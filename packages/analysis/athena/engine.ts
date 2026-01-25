/**
 * Athena - Faktör Zekası Modülü (Smart Beta)
 * 
 * "Bu hisse akıllı paranın sevdiği profile benziyor mu?"
 * 
 * Faktörler:
 * 1. Momentum (25%): Son 12 ay getirisi
 * 2. Value (25%): Düşük F/K, yüksek temettü
 * 3. Quality (25%): Yüksek ROE, düşük kaldıraç
 * 4. Size (15%): Small-cap premium
 * 5. Low Volatility (10%): Düşük beta avantajı
 */

export interface AthenaResult {
    symbol: string;
    score: number;              // 0-100
    dominantFactor: 'MOMENTUM' | 'VALUE' | 'QUALITY' | 'SIZE' | 'LOW_VOL' | 'KARMA';
    factors: AthenaFactor[];
    smartMoneyFit: 'YÜKSEK' | 'ORTA' | 'DÜŞÜK';
    summary: string;
}

export interface AthenaFactor {
    name: string;
    score: number;
    weight: number;
    description: string;
}

export interface AthenaInput {
    // Momentum
    return12M: number;          // 12 aylık getiri (%)
    return6M: number;           // 6 aylık getiri (%)
    return1M: number;           // 1 aylık getiri (%)

    // Value
    peRatio: number;            // F/K
    pbRatio: number;            // PD/DD
    dividendYield: number;      // Temettü verimi (%)

    // Quality
    roe: number;                // ROE (%)
    debtToEquity: number;       // Borç/Özkaynak
    netProfitMargin: number;    // Net Kar Marjı (%)

    // Size
    marketCap: number;          // Piyasa Değeri (TL)

    // Volatility
    beta: number;               // Beta katsayısı
    volatility30D: number;      // 30 günlük volatilite (%)
}

export class AthenaEngine {
    private static instance: AthenaEngine;

    private constructor() { }

    public static getInstance(): AthenaEngine {
        if (!AthenaEngine.instance) {
            AthenaEngine.instance = new AthenaEngine();
        }
        return AthenaEngine.instance;
    }

    public analyze(symbol: string, data: AthenaInput): AthenaResult {
        const factors: AthenaFactor[] = [];

        // 1. Momentum Faktörü (25%)
        const momentum = this.analyzeMomentum(data);
        factors.push({ name: 'Momentum', ...momentum, weight: 25 });

        // 2. Value Faktörü (25%)
        const value = this.analyzeValue(data);
        factors.push({ name: 'Value', ...value, weight: 25 });

        // 3. Quality Faktörü (25%)
        const quality = this.analyzeQuality(data);
        factors.push({ name: 'Quality', ...quality, weight: 25 });

        // 4. Size Faktörü (15%)
        const size = this.analyzeSize(data);
        factors.push({ name: 'Size', ...size, weight: 15 });

        // 5. Low Volatility Faktörü (10%)
        const lowVol = this.analyzeLowVolatility(data);
        factors.push({ name: 'Low Volatility', ...lowVol, weight: 10 });

        // Ağırlıklı toplam
        const score = factors.reduce((sum, f) => sum + (f.score * f.weight / 100), 0);

        // Dominant faktör
        const dominantFactor = this.findDominantFactor(factors);

        // Smart Money Fit
        const smartMoneyFit = score >= 70 ? 'YÜKSEK' : score >= 45 ? 'ORTA' : 'DÜŞÜK';

        const summary = this.generateSummary(dominantFactor, score, factors);

        return { symbol, score, dominantFactor, factors, smartMoneyFit, summary };
    }

    private analyzeMomentum(data: AthenaInput): { score: number; description: string } {
        let score = 50;
        const descriptions: string[] = [];

        // 12 aylık getiri
        if (data.return12M > 30) {
            score += 25;
            descriptions.push('Güçlü 12M momentum');
        } else if (data.return12M > 10) {
            score += 15;
            descriptions.push('Pozitif 12M');
        } else if (data.return12M < -10) {
            score -= 15;
            descriptions.push('Negatif 12M');
        }

        // 6 aylık ivme
        if (data.return6M > data.return12M / 2) {
            score += 10;
            descriptions.push('Hızlanan momentum');
        }

        // Son 1 ay
        if (data.return1M > 5) {
            score += 10;
        } else if (data.return1M < -5) {
            score -= 10;
        }

        return {
            score: Math.min(100, Math.max(0, score)),
            description: descriptions.join(', ') || 'Normal momentum'
        };
    }

    private analyzeValue(data: AthenaInput): { score: number; description: string } {
        let score = 50;
        const descriptions: string[] = [];

        // F/K < 10 değerli
        if (data.peRatio > 0 && data.peRatio < 10) {
            score += 20;
            descriptions.push('Düşük F/K');
        } else if (data.peRatio > 25) {
            score -= 15;
            descriptions.push('Yüksek F/K');
        }

        // PD/DD < 1.5 değerli
        if (data.pbRatio > 0 && data.pbRatio < 1.5) {
            score += 15;
            descriptions.push('Düşük PD/DD');
        }

        // Temettü verimi > %3 çekici
        if (data.dividendYield > 5) {
            score += 15;
            descriptions.push('Yüksek temettü');
        } else if (data.dividendYield > 3) {
            score += 10;
            descriptions.push('İyi temettü');
        }

        return {
            score: Math.min(100, Math.max(0, score)),
            description: descriptions.join(', ') || 'Normal değerleme'
        };
    }

    private analyzeQuality(data: AthenaInput): { score: number; description: string } {
        let score = 50;
        const descriptions: string[] = [];

        // ROE > %20 kaliteli
        if (data.roe > 20) {
            score += 20;
            descriptions.push('Yüksek ROE');
        } else if (data.roe > 15) {
            score += 10;
            descriptions.push('İyi ROE');
        } else if (data.roe < 5) {
            score -= 15;
            descriptions.push('Düşük ROE');
        }

        // Düşük kaldıraç
        if (data.debtToEquity < 0.5) {
            score += 15;
            descriptions.push('Düşük borç');
        } else if (data.debtToEquity > 1.5) {
            score -= 15;
            descriptions.push('Yüksek borç');
        }

        // Net kar marjı
        if (data.netProfitMargin > 15) {
            score += 15;
            descriptions.push('Yüksek karlılık');
        }

        return {
            score: Math.min(100, Math.max(0, score)),
            description: descriptions.join(', ') || 'Normal kalite'
        };
    }

    private analyzeSize(data: AthenaInput): { score: number; description: string } {
        // Small-cap premium: Küçük şirketler tarihsel olarak daha iyi getiri
        // BIST için: < 5 milyar TL small-cap, > 50 milyar TL large-cap

        if (data.marketCap < 5e9) { // 5 milyar TL altı
            return { score: 75, description: 'Small-cap (yüksek potansiyel)' };
        } else if (data.marketCap < 20e9) { // 5-20 milyar arası
            return { score: 65, description: 'Mid-cap' };
        } else if (data.marketCap < 50e9) { // 20-50 milyar arası
            return { score: 55, description: 'Large-cap' };
        }
        return { score: 45, description: 'Mega-cap (düşük potansiyel)' };
    }

    private analyzeLowVolatility(data: AthenaInput): { score: number; description: string } {
        let score = 50;

        // Beta < 1 düşük volatilite
        if (data.beta < 0.8) {
            score += 25;
            return { score, description: 'Çok düşük beta (savunmacı)' };
        } else if (data.beta < 1) {
            score += 15;
            return { score, description: 'Düşük beta' };
        } else if (data.beta > 1.5) {
            score -= 15;
            return { score, description: 'Yüksek beta (riskli)' };
        }

        // 30 günlük volatilite
        if (data.volatility30D < 20) {
            score += 10;
        } else if (data.volatility30D > 40) {
            score -= 10;
        }

        return { score: Math.min(100, Math.max(0, score)), description: 'Normal volatilite' };
    }

    private findDominantFactor(factors: AthenaFactor[]): 'MOMENTUM' | 'VALUE' | 'QUALITY' | 'SIZE' | 'LOW_VOL' | 'KARMA' {
        const sorted = [...factors].sort((a, b) => b.score - a.score);
        const top = sorted[0];
        const second = sorted[1];

        // En yüksek faktör significantlı mı?
        if (top.score - second.score >= 10) {
            switch (top.name) {
                case 'Momentum': return 'MOMENTUM';
                case 'Value': return 'VALUE';
                case 'Quality': return 'QUALITY';
                case 'Size': return 'SIZE';
                case 'Low Volatility': return 'LOW_VOL';
            }
        }
        return 'KARMA';
    }

    private generateSummary(dominant: string, score: number, factors: AthenaFactor[]): string {
        const high = factors.filter(f => f.score >= 70).map(f => f.name);

        if (high.length >= 3) {
            return `Güçlü multi-faktör profil. Akıllı para için çekici.`;
        } else if (high.length >= 1) {
            return `${dominant} faktöründe güçlü. ${high.join(', ')} öne çıkıyor.`;
        }
        return `Zayıf faktör profili. Akıllı para tercih etmeyebilir.`;
    }
}

export default AthenaEngine.getInstance();
