/**
 * Orion V3 - Gelişmiş Teknik Skorlama Motoru
 * Argus Terminal'den V3 mimarisi port edildi.
 * 
 * Bileşenler:
 * 1. Trend (30p): SMA hizalanması, MACD
 * 2. Momentum (25p): RSI, Hacim
 * 3. Volatilite (10p): ATR, Bollinger Squeeze
 * 4. Yapı (20p): Market Structure (HH/HL)
 * 5. Pattern (15p): Formasyonlar
 */

import { sma, atr, Candle } from '../kivanc/indicators.js';

export interface OrionScoreResult {
    symbol: string;
    totalScore: number;
    components: {
        trend: number;
        momentum: number;
        volatility: number;
        structure: number;
        pattern: number;
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
            return {
                symbol,
                totalScore: 0,
                components: { trend: 0, momentum: 0, volatility: 0, structure: 0, pattern: 0 },
                details: ['Yetersiz veri (min 50 mum gerekli)'],
            };
        }

        const trend = this.calculateTrend(candles);
        const momentum = this.calculateMomentum(candles);
        const volatility = this.calculateVolatility(candles);
        const structure = this.calculateStructure(candles);
        const pattern = { score: 10, details: ['Formasyon analizi (Mock)'] }; // Şimdilik mock

        const totalScore = Math.min(100, trend.score + momentum.score + volatility.score + structure.score + pattern.score);

        return {
            symbol,
            totalScore,
            components: {
                trend: trend.score,
                momentum: momentum.score,
                volatility: volatility.score,
                structure: structure.score,
                pattern: pattern.score,
            },
            details: [
                ...trend.details,
                ...momentum.details,
                ...volatility.details,
                ...structure.details,
                ...pattern.details,
            ],
        };
    }

    // 1. Trend (Max 30)
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

        if (!s20 || !s50 || !s200) return { score: 0, details: ['SMA verisi eksik'] };

        // SMA200 üstü (Long Term Bias) - 10p
        if (currentPrice > s200) {
            score += 10;
            details.push('Fiyat > SMA200 (Uzun vade pozitif)');
        }

        // Hizalanma (Alignment) - 10p
        if (s20 > s50 && s50 > s200) {
            score += 10;
            details.push('Tam Boğa Sıralaması (20>50>200)');
        } else if (s20 > s50) {
            score += 7;
            details.push('Kısa vade pozitif (20>50)');
        }

        // Momentum (Fiyat vs SMA20) - 10p
        if (currentPrice > s20) {
            const diff = (currentPrice - s20) / s20;
            if (diff < 0.05) {
                score += 10; // Sağlıklı trend
            } else {
                score += 5; // Biraz şişkin
                details.push('Fiyat SMA20\'den uzaklaştı');
            }
        }

        return { score: Math.min(30, score), details };
    }

    // 2. Momentum (Max 25)
    private calculateMomentum(candles: Candle[]): { score: number; details: string[] } {
        let score = 0;
        const details: string[] = [];

        // RSI Hesabı
        const rsiVal = this.rsi(candles.map(c => c.close), 14);

        if (rsiVal >= 50 && rsiVal <= 70) {
            score += 15;
            details.push(`RSI Güçlü (${rsiVal.toFixed(1)})`);
        } else if (rsiVal > 70) {
            score += 10; // Şişkin
            details.push(`RSI Aşırı Alım (${rsiVal.toFixed(1)})`);
        } else if (rsiVal < 30) {
            score += 10; // Tepki potansiyeli
            details.push(`RSI Aşırı Satım (${rsiVal.toFixed(1)})`);
        } else {
            score += 5;
        }

        // Hacim (Mock)
        score += 10;

        return { score: Math.min(25, score), details };
    }

    // 3. Volatilite (Max 10)
    private calculateVolatility(candles: Candle[]): { score: number; details: string[] } {
        const atrVals = atr(candles, 14);
        const lastAtr = atrVals[atrVals.length - 1];
        const price = candles[candles.length - 1].close;

        // ATR %
        const atrPct = (lastAtr / price) * 100;

        if (atrPct > 1.5 && atrPct < 4.0) {
            return { score: 10, details: ['Volatilite İdeal'] };
        }

        return { score: 5, details: ['Volatilite Yüksek/Düşük'] };
    }

    // 4. Yapı (Max 20)
    private calculateStructure(candles: Candle[]): { score: number; details: string[] } {
        // Basit HH/HL kontrolü (Mock)
        return { score: 15, details: ['Yapı: Yükselen Trend (Mock)'] };
    }

    // Helper: RSI
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
}

export default OrionEngine.getInstance();
