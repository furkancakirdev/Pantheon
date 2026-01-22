/**
 * Atlas V2 - Dinamik Temel Analiz Motoru
 * Argus Terminal'den V2 mimarisi port edildi.
 * 
 * Amaç: Statik bilanço verilerini, canlı fiyat ile birleştirerek
 * Dinamik F/K, Dinamik PD/DD ve Piyasa Değeri hesaplamak.
 */

export interface FundamentalData {
    lastPrice: number;
    eps: number; // Hisse Başına Kar (TTM)
    bookValuePerShare: number; // Özsermaye / Hisse Sayısı
    sectorFk: number;
}

export interface AtlasResult {
    symbol: string;
    dynamicFK: number;
    dynamicPDDD: number;
    score: number;
    verdict: 'UCUZ' | 'MAKUL' | 'PAHALI';
    details: string[];
}

export class AtlasEngine {
    private static instance: AtlasEngine;

    private constructor() { }

    public static getInstance(): AtlasEngine {
        if (!AtlasEngine.instance) {
            AtlasEngine.instance = new AtlasEngine();
        }
        return AtlasEngine.instance;
    }

    public analyze(symbol: string, data: FundamentalData): AtlasResult {
        // 1. Dinamik Oran Hesaplama
        const dynamicFK = data.lastPrice / data.eps; // Canlı Fiyat / Sabit EPS
        const dynamicPDDD = data.lastPrice / data.bookValuePerShare; // Canlı Fiyat / Sabit Defter Değeri

        // 2. Skorlama
        let score = 50;
        const details: string[] = [];

        // F/K Analizi
        if (dynamicFK < 5) {
            score += 20;
            details.push('F/K Çok Ucuz (<5)');
        } else if (dynamicFK < 10) {
            score += 10;
            details.push('F/K Makul (5-10)');
        } else if (dynamicFK > 20) {
            score -= 10;
            details.push('F/K Pahalı (>20)');
        }

        // Sektör Karşılaştırması
        if (dynamicFK < data.sectorFk * 0.7) {
            score += 15;
            details.push('Sektör ortalamasından %30 daha ucuz');
        }

        // PD/DD Analizi
        if (dynamicPDDD < 1.0) {
            score += 15;
            details.push('PD/DD İskontolu (<1.0)');
        }

        // 3. Karar
        let verdict: 'UCUZ' | 'MAKUL' | 'PAHALI' = 'MAKUL';
        if (score >= 70) verdict = 'UCUZ';
        else if (score <= 30) verdict = 'PAHALI';

        return {
            symbol,
            dynamicFK,
            dynamicPDDD,
            score: Math.min(100, Math.max(0, score)),
            verdict,
            details,
        };
    }
}

export default AtlasEngine.getInstance();
