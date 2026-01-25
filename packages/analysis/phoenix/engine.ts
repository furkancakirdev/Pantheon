/**
 * Phoenix V2 - Strateji ve Tarama Motoru
 * Argus Terminal'den port edildi ve genişletildi.
 *
 * Amaç: Otomatik tarama (Scanning) ve Fırsat Yakalama (Level 0 -> Level 1 pipeline)
 *
 * Özellikler:
 * - Golden/Death Cross tespiti
 * - SMA Crossover sinyalleri
 * - Formasyon tespiti (Perşembe modülü entegrasyonu)
 * - Çoklu zamanlı analiz
 * - Skor tabanlı aday seçimi
 */

import type { Candle } from '../kivanc/indicators';
import { sma, ema } from '../kivanc/indicators';
import {
    mumFormasyonlariTara,
    destekDirencBul,
    type MumFormasyonu,
    type SupportResistance
} from '../persembe/technical';

// ============ TİP TANIMLARI ============

export interface PhoenixCandidate {
    symbol: string;
    lastPrice: number;
    score: number;
    reason: string;
    signals: PhoenixSignal[];
    riskLevel: 'DÜŞÜK' | 'ORTA' | 'YÜKSEK';
}

export interface PhoenixSignal {
    type: 'GOLDEN_CROSS' | 'DEATH_CROSS' | 'SMA_CROSS' | 'MACD_CROSS' | 'RSI_OVERSOLD' | 'RSI_OVERBOUGHT' | 'FORMASYON' | 'VOLUME_SPIKE';
    strength: number; // 1-10
    description: string;
    bullish: boolean;
}

export type PhoenixMode = 'SAVER' | 'BALANCED' | 'AGGRESSIVE';

export interface PhoenixScanResult {
    candidates: PhoenixCandidate[];
    report: PhoenixReport;
}

export interface PhoenixReport {
    mode: PhoenixMode;
    scanned: number;
    filtered: number;
    shortlisted: number;
    verified: number;
    timestamp: string;
}

// ============ YARDIMCI FONKSİYONLAR ============

/**
 * SMA hesapla
 */
function calculateSMA(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
        const slice = data.slice(i - period + 1, i + 1);
        result.push(slice.reduce((a, b) => a + b, 0) / period);
    }
    return result;
}

/**
 * Golden/Death Cross tespiti
 * Golden Cross: SMA50 > SMA200 (AL sinyali)
 * Death Cross: SMA50 < SMA200 (SAT sinyali)
 */
function detectCross(candles: Candle[]): { goldenCross: boolean; deathCross: boolean; crossDate?: Date } {
    if (candles.length < 200) return { goldenCross: false, deathCross: false };

    const closes = candles.map(c => c.close);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);

    // Son değerler
    const last50 = sma50[sma50.length - 1];
    const last200 = sma200[sma200.length - 1];
    const prev50 = sma50[sma50.length - 2];
    const prev200 = sma200[sma200.length - 2];

    // Crossover kontrolü
    const goldenCross = prev50 <= prev200 && last50 > last200;
    const deathCross = prev50 >= prev200 && last50 < last200;

    return {
        goldenCross,
        deathCross,
        crossDate: goldenCross || deathCross ? candles[candles.length - 1].date : undefined
    };
}

/**
 * MACD Crossover tespiti
 */
function detectMACDCross(candles: Candle[]): { bullish: boolean; bearish: boolean } {
    if (candles.length < 26) return { bullish: false, bearish: false };

    const closes = candles.map(c => c.close);

    // MACD hesapla (12, 26, 9)
    const ema12: number[] = [];
    const ema26: number[] = [];
    const multiplier = 2 / (13); // EMA平滑系数

    // Basit EMA hesaplaması
    let ema12Val = closes[0];
    let ema26Val = closes[0];

    for (let i = 0; i < closes.length; i++) {
        ema12Val = closes[i] * multiplier + ema12Val * (1 - multiplier);
        if (i >= 14) { // 26-12
            ema26Val = closes[i] * (2 / 27) + ema26Val * (1 - 2 / 27);
            ema26.push(ema26Val);
        }
        ema12.push(ema12Val);
    }

    // MACD line = EMA12 - EMA26
    const macdLine: number[] = [];
    for (let i = 0; i < ema26.length; i++) {
        macdLine.push(ema12[i + 14] - ema26[i]);
    }

    // Signal line = 9-period EMA of MACD
    const signalLine: number[] = [];
    let signalVal = macdLine[0];
    for (let i = 0; i < macdLine.length; i++) {
        signalVal = macdLine[i] * (2 / 10) + signalVal * (1 - 2 / 10);
        signalLine.push(signalVal);
    }

    // Crossover kontrolü
    const lastDiff = macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1];
    const prevDiff = macdLine[macdLine.length - 2] - signalLine[signalLine.length - 2];

    return {
        bullish: prevDiff <= 0 && lastDiff > 0,
        bearish: prevDiff >= 0 && lastDiff < 0
    };
}

/**
 * RSI aşırı alım/satım tespiti
 */
function detectRSI(candles: Candle[]): { oversold: boolean; overbought: boolean; value: number } {
    if (candles.length < 15) return { oversold: false, overbought: false, value: 50 };

    const closes = candles.map(c => c.close);
    let gains = 0;
    let losses = 0;
    const period = 14;

    for (let i = closes.length - period; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        if (change > 0) gains += change;
        else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    let rsi = 50;
    if (avgLoss > 0) {
        const rs = avgGain / avgLoss;
        rsi = 100 - (100 / (1 + rs));
    }

    return {
        oversold: rsi < 30,
        overbought: rsi > 70,
        value: rsi
    };
}

/**
 * Hacim spike tespiti
 */
function detectVolumeSpike(candles: Candle[]): { spike: boolean; ratio: number } {
    if (candles.length < 20) return { spike: false, ratio: 1 };

    const last20 = candles.slice(-20);
    const avgVolume = last20.reduce((a, b) => a + b.volume, 0) / 20;
    const lastVolume = candles[candles.length - 1].volume;

    const ratio = lastVolume / avgVolume;

    return {
        spike: ratio > 2.0, // 2x ortalama
        ratio
    };
}

/**
 * SMA Crossover tespiti (kısa vade)
 */
function detectSMACross(candles: Candle[]): { bullish: boolean; bearish: boolean; type: string } {
    if (candles.length < 50) return { bullish: false, bearish: false, type: 'NONE' };

    const closes = candles.map(c => c.close);
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);

    const last20 = sma20[sma20.length - 1];
    const last50 = sma50[sma50.length - 1];
    const prev20 = sma20[sma20.length - 2];
    const prev50 = sma50[sma50.length - 2];

    const bullish = prev20 <= prev50 && last20 > last50;
    const bearish = prev20 >= prev50 && last20 < last50;

    return {
        bullish,
        bearish,
        type: bullish ? 'SMA20>SMA50' : bearish ? 'SMA20<SMA50' : 'NONE'
    };
}

// ============ PHOENIX ENGINE ============

export class PhoenixEngine {
    private static instance: PhoenixEngine;

    private constructor() { }

    public static getInstance(): PhoenixEngine {
        if (!PhoenixEngine.instance) {
            PhoenixEngine.instance = new PhoenixEngine();
        }
        return PhoenixEngine.instance;
    }

    /**
     * Sinyal Analizi - Tek bir hisse için
     */
    public analyzeSignals(symbol: string, candles: Candle[]): PhoenixSignal[] {
        const signals: PhoenixSignal[] = [];

        if (candles.length < 20) {
            return signals;
        }

        // 1. Golden/Death Cross
        const cross = detectCross(candles);
        if (cross.goldenCross) {
            signals.push({
                type: 'GOLDEN_CROSS',
                strength: 10,
                description: 'Golden Cross: SMA50 SMA200\'ü yukarı kırdı',
                bullish: true
            });
        } else if (cross.deathCross) {
            signals.push({
                type: 'DEATH_CROSS',
                strength: 10,
                description: 'Death Cross: SMA50 SMA200\'ü aşağı kırdı',
                bullish: false
            });
        }

        // 2. SMA Crossover (kısa vade)
        const smaCross = detectSMACross(candles);
        if (smaCross.bullish) {
            signals.push({
                type: 'SMA_CROSS',
                strength: 7,
                description: 'SMA20 > SMA50 cross (kısa vade AL)',
                bullish: true
            });
        } else if (smaCross.bearish) {
            signals.push({
                type: 'SMA_CROSS',
                strength: 7,
                description: 'SMA20 < SMA50 cross (kısa vade SAT)',
                bullish: false
            });
        }

        // 3. MACD Cross
        const macdCross = detectMACDCross(candles);
        if (macdCross.bullish) {
            signals.push({
                type: 'MACD_CROSS',
                strength: 6,
                description: 'MACD bullîsh crossover',
                bullish: true
            });
        } else if (macdCross.bearish) {
            signals.push({
                type: 'MACD_CROSS',
                strength: 6,
                description: 'MACD bearish crossover',
                bullish: false
            });
        }

        // 4. RSI Extremes
        const rsi = detectRSI(candles);
        if (rsi.oversold) {
            signals.push({
                type: 'RSI_OVERSOLD',
                strength: 5,
                description: `RSI aşırı satım (${rsi.value.toFixed(1)})`,
                bullish: true
            });
        } else if (rsi.overbought) {
            signals.push({
                type: 'RSI_OVERBOUGHT',
                strength: 5,
                description: `RSI aşırı alım (${rsi.value.toFixed(1)})`,
                bullish: false
            });
        }

        // 5. Hacim Spike
        const volume = detectVolumeSpike(candles);
        if (volume.spike) {
            signals.push({
                type: 'VOLUME_SPIKE',
                strength: 4,
                description: `Hacim spike (${volume.ratio.toFixed(1)}x ortalama)`,
                bullish: true // Nötr ama ilgi gösterir
            });
        }

        // 6. Formasyon Tespiti (Perşembe modülü)
        const formations = mumFormasyonlariTara(candles);
        for (const f of formations) {
            signals.push({
                type: 'FORMASYON',
                strength: f.guvenilirlik / 10,
                description: `${f.tip}: ${f.aciklama}`,
                bullish: f.sinyal === 'AL'
            });
        }

        return signals.sort((a, b) => b.strength - a.strength);
    }

    /**
     * Skor Hesaplama
     */
    private calculateScore(signals: PhoenixSignal[]): number {
        let score = 50; // Baz skor

        for (const signal of signals) {
            if (signal.bullish) {
                score += signal.strength;
            } else {
                score -= signal.strength * 0.5; // Ayı sinyalleri daha az ceza puanı
            }
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Risk Seviyesi Belirleme
     */
    private determineRiskLevel(signals: PhoenixSignal[]): 'DÜŞÜK' | 'ORTA' | 'YÜKSEK' {
        const bearishCount = signals.filter(s => !s.bullish && s.strength >= 6).length;
        const bullishCount = signals.filter(s => s.bullish && s.strength >= 6).length;

        if (bearishCount >= 2) return 'YÜKSEK';
        if (bearishCount >= 1) return 'ORTA';
        if (bullishCount >= 3) return 'DÜŞÜK';
        return 'ORTA';
    }

    /**
     * Tek bir hisseyi analiz et
     */
    public analyzeStock(symbol: string, candles: Candle[]): Omit<PhoenixCandidate, 'symbol'> {
        const signals = this.analyzeSignals(symbol, candles);
        const score = this.calculateScore(signals);
        const riskLevel = this.determineRiskLevel(signals);

        const lastPrice = candles[candles.length - 1].close;
        const topSignals = signals.slice(0, 3);
        const reason = topSignals.length > 0
            ? topSignals.map(s => s.description).join('; ')
            : 'Belirgin sinyal yok';

        return {
            lastPrice,
            score,
            reason,
            signals,
            riskLevel
        };
    }

    /**
     * Tarama Pipeline'ını Çalıştır
     */
    public async runPipeline(
        mode: PhoenixMode,
        universe: Array<{ symbol: string; price: number; change: number }>,
        candlesMap: Map<string, Candle[]> // Hisse bazlı mum verileri
    ): Promise<PhoenixScanResult> {

        const startTime = Date.now();

        // 1. Level 0: Evren Taraması (Filtreleme)
        let candidates = universe.filter(item => {
            // Penny stock filtresi
            if (item.price < 5) return false;

            // Mod'a göre değişim filtresi
            if (mode === 'AGGRESSIVE' && Math.abs(item.change) < 1) return false;
            if (mode === 'SAVER' && Math.abs(item.change) > 5) return false;

            return true;
        });

        const filtered = candidates.length;

        // 2. Shortlist Seçimi
        const sorted = candidates.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
        const limit = mode === 'SAVER' ? 5 : (mode === 'BALANCED' ? 10 : 20);
        const shortlist = sorted.slice(0, limit);

        // 3. Level 1: Kanıt Toplama (Sinyal Analizi)
        const verified: PhoenixCandidate[] = [];

        for (const item of shortlist) {
            const candles = candlesMap.get(item.symbol);
            if (!candles || candles.length < 20) continue;

            const analysis = this.analyzeStock(item.symbol, candles);

            // Skor eşiğine göre filtrele
            const scoreThreshold = mode === 'SAVER' ? 70 : (mode === 'BALANCED' ? 60 : 50);

            if (analysis.score >= scoreThreshold) {
                verified.push({
                    symbol: item.symbol,
                    ...analysis
                });
            }
        }

        // Skora göre sırala
        verified.sort((a, b) => b.score - a.score);

        // Rapor Oluştur
        const report: PhoenixReport = {
            mode,
            scanned: universe.length,
            filtered,
            shortlisted: shortlist.length,
            verified: verified.length,
            timestamp: new Date().toISOString()
        };

        return { candidates: verified, report };
    }

    /**
     * Hızlı Tarama - Sadece temel sinyaller
     */
    public quickScan(
        universe: Array<{ symbol: string; price: number; change: number }>,
        candlesMap: Map<string, Candle[]>
    ): PhoenixCandidate[] {
        const results: PhoenixCandidate[] = [];

        for (const item of universe) {
            if (item.price < 5) continue; // Penny filtre

            const candles = candlesMap.get(item.symbol);
            if (!candles || candles.length < 50) continue;

            const signals = this.analyzeSignals(item.symbol, candles);
            const bullishSignals = signals.filter(s => s.bullish && s.strength >= 6);

            if (bullishSignals.length >= 2) {
                const analysis = this.analyzeStock(item.symbol, candles);
                results.push({
                    symbol: item.symbol,
                    ...analysis
                });
            }
        }

        return results.sort((a, b) => b.score - a.score);
    }

    /**
     * Portföy İzleme - Mevcut pozisyonları takip et
     */
    public monitorPortfolio(
        portfolio: Array<{ symbol: string; entryPrice: number; quantity: number }>,
        candlesMap: Map<string, Candle[]>
    ): Array<{
        symbol: string;
        currentPrice: number;
        pnl: number;
        pnlPercent: number;
        signals: PhoenixSignal[];
        recommendation: 'TUT' | 'AL' | 'SAT' | 'KAR_AL';
    }> {
        const results: Array<{
            symbol: string;
            currentPrice: number;
            pnl: number;
            pnlPercent: number;
            signals: PhoenixSignal[];
            recommendation: 'TUT' | 'AL' | 'SAT' | 'KAR_AL';
        }> = [];

        for (const position of portfolio) {
            const candles = candlesMap.get(position.symbol);
            if (!candles || candles.length < 20) continue;

            const currentPrice = candles[candles.length - 1].close;
            const signals = this.analyzeSignals(position.symbol, candles);

            const pnl = (currentPrice - position.entryPrice) * position.quantity;
            const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

            // Tavsiye hesapla
            let recommendation: 'TUT' | 'AL' | 'SAT' | 'KAR_AL' = 'TUT';

            const bearishCount = signals.filter(s => !s.bullish && s.strength >= 7).length;
            const bullishCount = signals.filter(s => s.bullish && s.strength >= 7).length;

            if (pnlPercent > 15 && bearishCount >= 1) {
                recommendation = 'KAR_AL';
            } else if (bearishCount >= 2) {
                recommendation = 'SAT';
            } else if (bullishCount >= 3 && pnlPercent < -5) {
                recommendation = 'AL';
            }

            results.push({
                symbol: position.symbol,
                currentPrice,
                pnl,
                pnlPercent,
                signals,
                recommendation
            });
        }

        return results;
    }
}

export default PhoenixEngine.getInstance();
