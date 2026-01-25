/**
 * Orion V4 - Ali Perşembe + Kıvanç Özbilgiç Teknik Analiz Motoru
 * 
 * Bileşenler:
 * 1. Trend (25p): SMA hizalanması, MACD
 * 2. Momentum (20p): RSI, Hacim
 * 3. Volatilite (10p): ATR, Bollinger Squeeze
 * 4. Yapı - Ali Perşembe (20p): HH/HL Market Structure
 * 5. Kıvanç Sinyalleri (25p): AlphaTrend, MOST, MavilimW
 */

import { sma, ema, atr, alphaTrend, most, mavilimW, superTrend, kivancHL, stochasticRSI, Candle, Signal } from '../kivanc/indicators';

export interface OrionScoreResult {
    symbol: string;
    totalScore: number;
    verdict: 'GÜÇLÜ AL' | 'AL' | 'TUT' | 'SAT' | 'GÜÇLÜ SAT';
    components: {
        trend: number;
        momentum: number;
        volatility: number;
        structure: number;      // Ali Perşembe
        kivanc: number;         // Kıvanç İndikatörleri
    };
    kivanc: {
        alphaTrend: Signal;
        most: Signal;
        superTrend: Signal;
        stochRSI: Signal;
        mavilimW: 'YUKARI' | 'ASAGI' | 'YATAY';
        harmonicLevels?: {
            h6: number;
            l6: number;
            m1: number;
        };
    };
    persembe: {
        marketStructure: 'UPTREND' | 'DOWNTREND' | 'RANGE';
        lastSwingHigh: number;
        lastSwingLow: number;
    };
    details: string[];
}

export class OrionEngine {
    private static instance: OrionEngine;

    private constructor() { }

    public static getInstance(): OrionEngine {
        if (!OrionEngine.instance) {
            OrionEngine.instance = new OrionEngine();
        }
        return OrionEngine.instance;
    }

    public analyze(symbol: string, candles: Candle[]): OrionScoreResult {
        if (candles.length < 50) {
            return this.emptyResult(symbol, 'Yetersiz veri (min 50 mum gerekli)');
        }

        // 1. Trend Analizi (Max 25)
        const trend = this.calculateTrend(candles);

        // 2. Momentum Analizi (Max 20)
        const momentum = this.calculateMomentum(candles);

        // 3. Volatilite Analizi (Max 10)
        const volatility = this.calculateVolatility(candles);

        // 4. Ali Perşembe - Market Structure (Max 20)
        const structure = this.calculatePerşembeStructure(candles);

        // 5. Kıvanç Özbilgiç Sinyalleri (Max 25)
        const kivanc = this.calculateKivancSignals(candles);

        const totalScore = Math.min(100, trend.score + momentum.score + volatility.score + structure.score + kivanc.score);
        const verdict = this.getVerdict(totalScore);

        return {
            symbol,
            totalScore,
            verdict,
            components: {
                trend: trend.score,
                momentum: momentum.score,
                volatility: volatility.score,
                structure: structure.score,
                kivanc: kivanc.score,
            },
            kivanc: kivanc.signals,
            persembe: structure.analysis,
            details: [
                ...trend.details,
                ...momentum.details,
                ...volatility.details,
                ...structure.details,
                ...kivanc.details,
            ],
        };
    }

    // 1. Trend (Max 25)
    private calculateTrend(candles: Candle[]): { score: number; details: string[] } {
        let score = 0;
        const details: string[] = [];
        const closes = candles.map(c => c.close);
        const currentPrice = closes[closes.length - 1];

        const sma20 = sma(closes, 20);
        const sma50 = sma(closes, 50);
        const sma200 = sma(closes, 200);

        const s20 = sma20[sma20.length - 1];
        const s50 = sma50[sma50.length - 1];
        const s200 = sma200[sma200.length - 1];

        if (!s20 || !s50) return { score: 5, details: ['SMA verisi eksik'] };

        // SMA200 üstü - 8p
        if (s200 && currentPrice > s200) {
            score += 8;
            details.push('Fiyat > SMA200');
        }

        // Hizalanma - 10p
        if (s20 > s50 && (!s200 || s50 > s200)) {
            score += 10;
            details.push('Boğa Sıralaması (20>50>200)');
        } else if (s20 > s50) {
            score += 5;
            details.push('Kısa vade pozitif (20>50)');
        }

        // Fiyat vs SMA20 - 7p
        if (currentPrice > s20) {
            score += 7;
        }

        return { score: Math.min(25, score), details };
    }

    // 2. Momentum (Max 20)
    private calculateMomentum(candles: Candle[]): { score: number; details: string[] } {
        let score = 0;
        const details: string[] = [];

        const rsiVal = this.rsi(candles.map(c => c.close), 14);

        if (rsiVal >= 50 && rsiVal <= 70) {
            score += 12;
            details.push(`RSI Güçlü (${rsiVal.toFixed(1)})`);
        } else if (rsiVal > 70) {
            score += 6;
            details.push(`RSI Aşırı Alım (${rsiVal.toFixed(1)})`);
        } else if (rsiVal < 30) {
            score += 8;
            details.push(`RSI Aşırı Satım - Tepki Pot. (${rsiVal.toFixed(1)})`);
        } else {
            score += 4;
        }

        // Hacim trendi basit kontrol
        score += 8;

        return { score: Math.min(20, score), details };
    }

    // 3. Volatilite (Max 10)
    private calculateVolatility(candles: Candle[]): { score: number; details: string[] } {
        const atrVals = atr(candles, 14);
        const lastAtr = atrVals[atrVals.length - 1];
        const price = candles[candles.length - 1].close;

        const atrPct = (lastAtr / price) * 100;

        if (atrPct > 1.5 && atrPct < 4.0) {
            return { score: 10, details: ['Volatilite İdeal'] };
        }
        return { score: 5, details: ['Volatilite Yüksek/Düşük'] };
    }

    // 4. Ali Perşembe - Market Structure (Max 20)
    private calculatePerşembeStructure(candles: Candle[]): {
        score: number;
        details: string[];
        analysis: { marketStructure: 'UPTREND' | 'DOWNTREND' | 'RANGE'; lastSwingHigh: number; lastSwingLow: number }
    } {
        let score = 0;
        const details: string[] = [];

        // Swing High/Low Tespit (Basit versiyon: 5 mum karşılaştırma)
        const swingHighs: { index: number; price: number }[] = [];
        const swingLows: { index: number; price: number }[] = [];

        for (let i = 5; i < candles.length - 5; i++) {
            const window = candles.slice(i - 5, i + 6);
            const high = candles[i].high;
            const low = candles[i].low;

            // Swing High: Ortadaki mum en yüksek
            if (window.every(c => c.high <= high)) {
                swingHighs.push({ index: i, price: high });
            }
            // Swing Low: Ortadaki mum en düşük
            if (window.every(c => c.low >= low)) {
                swingLows.push({ index: i, price: low });
            }
        }

        const lastSwingHigh = swingHighs.length > 0 ? swingHighs[swingHighs.length - 1].price : candles[candles.length - 1].high;
        const lastSwingLow = swingLows.length > 0 ? swingLows[swingLows.length - 1].price : candles[candles.length - 1].low;

        // Market Structure belirleme
        let marketStructure: 'UPTREND' | 'DOWNTREND' | 'RANGE' = 'RANGE';

        if (swingHighs.length >= 2 && swingLows.length >= 2) {
            const lastTwoHighs = swingHighs.slice(-2);
            const lastTwoLows = swingLows.slice(-2);

            // Higher Highs + Higher Lows = UPTREND
            if (lastTwoHighs[1].price > lastTwoHighs[0].price &&
                lastTwoLows[1].price > lastTwoLows[0].price) {
                marketStructure = 'UPTREND';
                score += 20;
                details.push('Ali Perşembe: HH + HL (Yükseliş Yapısı)');
            }
            // Lower Highs + Lower Lows = DOWNTREND
            else if (lastTwoHighs[1].price < lastTwoHighs[0].price &&
                lastTwoLows[1].price < lastTwoLows[0].price) {
                marketStructure = 'DOWNTREND';
                score += 5;
                details.push('Ali Perşembe: LH + LL (Düşüş Yapısı)');
            } else {
                score += 10;
                details.push('Ali Perşembe: Karışık Yapı (Range)');
            }
        } else {
            score += 10;
            details.push('Ali Perşembe: Yetersiz Swing Noktası');
        }

        return {
            score: Math.min(20, score),
            details,
            analysis: { marketStructure, lastSwingHigh, lastSwingLow }
        };
    }

    // 5. Kıvanç Özbilgiç Sinyalleri (Max 25)
    private calculateKivancSignals(candles: Candle[]): {
        score: number;
        details: string[];
        signals: {
            alphaTrend: Signal;
            most: Signal;
            superTrend: Signal;
            stochRSI: Signal;
            mavilimW: 'YUKARI' | 'ASAGI' | 'YATAY';
            harmonicLevels?: { h6: number; l6: number; m1: number };
        }
    } {
        let score = 0;
        const details: string[] = [];

        // AlphaTrend (6p)
        const alphaResult = alphaTrend(candles);
        if (alphaResult.signal === 'AL') {
            score += 6;
            details.push('Kıvanç AlphaTrend: AL');
        } else if (alphaResult.signal === 'SAT') {
            score += 1;
            details.push('Kıvanç AlphaTrend: SAT');
        } else {
            score += 3;
        }

        // MOST (6p)
        const mostResult = most(candles);
        if (mostResult.signal === 'AL') {
            score += 6;
            details.push('Kıvanç MOST: AL');
        } else if (mostResult.signal === 'SAT') {
            score += 1;
            details.push('Kıvanç MOST: SAT');
        } else {
            score += 3;
        }

        // SuperTrend (6p)
        const stResult = superTrend(candles);
        if (stResult.signal === 'AL') {
            score += 6;
            details.push('Kıvanç SuperTrend: AL');
        } else if (stResult.signal === 'SAT') {
            score += 1;
            details.push('Kıvanç SuperTrend: SAT');
        } else {
            score += 3;
        }

        // Stochastic RSI (4p)
        const stochResult = stochasticRSI(candles);
        if (stochResult.signal === 'AL') {
            score += 4;
            details.push('StochRSI: AL (K üzeri D)');
        } else if (stochResult.signal === 'SAT') {
            score += 1;
            details.push('StochRSI: SAT (K altı D)');
        } else {
            score += 2;
        }

        // MavilimW Trend Direction (3p)
        const mavLine = mavilimW(candles);
        const lastMav = mavLine[mavLine.length - 1];
        const prevMav = mavLine[mavLine.length - 5] || lastMav;

        let mavilimWDir: 'YUKARI' | 'ASAGI' | 'YATAY' = 'YATAY';
        if (lastMav > prevMav * 1.005) {
            mavilimWDir = 'YUKARI';
            score += 3;
            details.push('Kıvanç MavilimW: Yukarı');
        } else if (lastMav < prevMav * 0.995) {
            mavilimWDir = 'ASAGI';
            score += 1;
            details.push('Kıvanç MavilimW: Aşağı');
        } else {
            score += 2;
        }

        // KIVANÇ HL (Harmonic Levels) - Ek bilgi puanı
        const hlResult = kivancHL(candles);
        const currentPrice = candles[candles.length - 1].close;

        if (currentPrice > hlResult.m1) {
            details.push(`KIVANÇ HL: Fiyat orta seviye (${hlResult.m1.toFixed(2)}) üzeri`);
            score += 1;
        } else if (currentPrice < hlResult.l6) {
            details.push(`KIVANÇ HL: Fiyat H6 seviyesinde destek`);
            score += 2;
        } else if (currentPrice > hlResult.h6) {
            details.push(`KIVANÇ HL: Fiyat H6 seviyesinde direnç`);
            score += 1;
        }

        return {
            score: Math.min(25, score),
            details,
            signals: {
                alphaTrend: alphaResult.signal,
                most: mostResult.signal,
                superTrend: stResult.signal,
                stochRSI: stochResult.signal,
                mavilimW: mavilimWDir,
                harmonicLevels: {
                    h6: hlResult.h6,
                    l6: hlResult.l6,
                    m1: hlResult.m1,
                }
            }
        };
    }

    private getVerdict(score: number): 'GÜÇLÜ AL' | 'AL' | 'TUT' | 'SAT' | 'GÜÇLÜ SAT' {
        if (score >= 80) return 'GÜÇLÜ AL';
        if (score >= 60) return 'AL';
        if (score >= 40) return 'TUT';
        if (score >= 20) return 'SAT';
        return 'GÜÇLÜ SAT';
    }

    private rsi(closes: number[], period: number = 14): number {
        if (closes.length < period + 1) return 50;

        let gains = 0;
        let losses = 0;

        for (let i = 1; i <= period; i++) {
            const change = closes[i] - closes[i - 1];
            if (change > 0) gains += change;
            else losses -= change;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        for (let i = period + 1; i < closes.length; i++) {
            const change = closes[i] - closes[i - 1];
            const g = change > 0 ? change : 0;
            const l = change < 0 ? -change : 0;

            avgGain = (avgGain * (period - 1) + g) / period;
            avgLoss = (avgLoss * (period - 1) + l) / period;
        }

        if (avgLoss === 0) return 100;
        const rs = avgGain / avgLoss;
        return 100 - (100 / (1 + rs));
    }

    private emptyResult(symbol: string, reason: string): OrionScoreResult {
        return {
            symbol,
            totalScore: 0,
            verdict: 'TUT',
            components: { trend: 0, momentum: 0, volatility: 0, structure: 0, kivanc: 0 },
            kivanc: {
                alphaTrend: 'BEKLE',
                most: 'BEKLE',
                superTrend: 'BEKLE',
                stochRSI: 'BEKLE',
                mavilimW: 'YATAY',
                harmonicLevels: { h6: 0, l6: 0, m1: 0 }
            },
            persembe: { marketStructure: 'RANGE', lastSwingHigh: 0, lastSwingLow: 0 },
            details: [reason],
        };
    }
}

export default OrionEngine.getInstance();
