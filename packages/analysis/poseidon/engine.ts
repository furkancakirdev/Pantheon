/**
 * Poseidon - ETF/Emtia Hafifletilmiş Mod
 * 
 * Temel analizi zor veya anlamsız varlıklar için hafifletilmiş değerlendirme.
 * Atlas devre dışı, Orion + Aether ağırlıklı.
 * 
 * Kapsam: ETF, Emtia, Kripto, Endeks Fonları
 */

export type AssetType = 'HISSE' | 'ETF' | 'EMTIA' | 'KRIPTO' | 'FON';

export interface PoseidonWeights {
    atlas: number;      // Temel Analiz
    orion: number;      // Teknik Analiz
    aether: number;     // Makro Rejim
    hermes: number;     // Sentiment
    cronos: number;     // Zamanlama
    athena: number;     // Faktör
}

export interface PoseidonResult {
    assetType: AssetType;
    weights: PoseidonWeights;
    adjustedScore: number;
    reasoning: string;
}

export class PoseidonEngine {
    private static instance: PoseidonEngine;

    // Varsayılan Hisse Ağırlıkları (Toplam: 100)
    private static readonly DEFAULT_WEIGHTS: PoseidonWeights = {
        atlas: 25,
        orion: 25,
        aether: 20,
        hermes: 10,
        cronos: 10,
        athena: 10,
    };

    private constructor() { }

    public static getInstance(): PoseidonEngine {
        if (!PoseidonEngine.instance) {
            PoseidonEngine.instance = new PoseidonEngine();
        }
        return PoseidonEngine.instance;
    }

    /**
     * Varlık tipine göre ağırlıkları ayarla
     */
    public getWeights(assetType: AssetType): PoseidonWeights {
        switch (assetType) {
            case 'HISSE':
                return PoseidonEngine.DEFAULT_WEIGHTS;

            case 'ETF':
                // Atlas devre dışı, Teknik + Makro ağırlıklı
                return {
                    atlas: 0,
                    orion: 40,
                    aether: 30,
                    hermes: 10,
                    cronos: 10,
                    athena: 10,
                };

            case 'EMTIA':
                // Makro en önemli, Teknik ikincil
                return {
                    atlas: 0,
                    orion: 35,
                    aether: 40,
                    hermes: 5,
                    cronos: 15,
                    athena: 5,
                };

            case 'KRIPTO':
                // Teknik ve Sentiment ağırlıklı, Makro önemli
                return {
                    atlas: 0,
                    orion: 35,
                    aether: 25,
                    hermes: 20,
                    cronos: 10,
                    athena: 10,
                };

            case 'FON':
                // Makro ve Faktör ağırlıklı
                return {
                    atlas: 0,
                    orion: 25,
                    aether: 35,
                    hermes: 5,
                    cronos: 10,
                    athena: 25,
                };

            default:
                return PoseidonEngine.DEFAULT_WEIGHTS;
        }
    }

    /**
     * Modül skorlarını ağırlıklı olarak birleştir
     */
    public calculateScore(
        assetType: AssetType,
        scores: {
            atlas?: number;
            orion?: number;
            aether?: number;
            hermes?: number;
            cronos?: number;
            athena?: number;
        }
    ): PoseidonResult {
        const weights = this.getWeights(assetType);

        let totalScore = 0;
        let totalWeight = 0;

        // Atlas
        if (weights.atlas > 0 && scores.atlas !== undefined) {
            totalScore += scores.atlas * weights.atlas;
            totalWeight += weights.atlas;
        }
        // Orion
        if (weights.orion > 0 && scores.orion !== undefined) {
            totalScore += scores.orion * weights.orion;
            totalWeight += weights.orion;
        }
        // Aether
        if (weights.aether > 0 && scores.aether !== undefined) {
            totalScore += scores.aether * weights.aether;
            totalWeight += weights.aether;
        }
        // Hermes
        if (weights.hermes > 0 && scores.hermes !== undefined) {
            totalScore += scores.hermes * weights.hermes;
            totalWeight += weights.hermes;
        }
        // Cronos
        if (weights.cronos > 0 && scores.cronos !== undefined) {
            totalScore += scores.cronos * weights.cronos;
            totalWeight += weights.cronos;
        }
        // Athena
        if (weights.athena > 0 && scores.athena !== undefined) {
            totalScore += scores.athena * weights.athena;
            totalWeight += weights.athena;
        }

        const adjustedScore = totalWeight > 0 ? totalScore / totalWeight : 50;
        const reasoning = this.generateReasoning(assetType, weights);

        return { assetType, weights, adjustedScore, reasoning };
    }

    /**
     * Varlık tipini otomatik tespit et
     */
    public detectAssetType(symbol: string): AssetType {
        const upper = symbol.toUpperCase();

        // Kripto
        if (upper.includes('BTC') || upper.includes('ETH') || upper.includes('USDT') || upper.endsWith('-USD')) {
            return 'KRIPTO';
        }
        // ETF
        if (upper.includes('ETF') || upper.startsWith('SPY') || upper.startsWith('QQQ') || upper.startsWith('IVV')) {
            return 'ETF';
        }
        // Emtia
        if (['GLD', 'SLV', 'USO', 'UNG', 'ALTIN', 'GUMUS', 'PETROL'].some(e => upper.includes(e))) {
            return 'EMTIA';
        }
        // TEFAS Fonları
        if (upper.startsWith('TGD') || upper.startsWith('TTE') || upper.startsWith('TTA')) {
            return 'FON';
        }

        return 'HISSE';
    }

    private generateReasoning(assetType: AssetType, weights: PoseidonWeights): string {
        switch (assetType) {
            case 'ETF':
                return 'ETF için temel analiz devre dışı. Teknik ve makro ağırlıklı değerlendirme.';
            case 'EMTIA':
                return 'Emtia için makro ortam en kritik faktör. Teknik ikincil.';
            case 'KRIPTO':
                return 'Kripto için sentiment ve teknik analiz öne çıkıyor.';
            case 'FON':
                return 'Fon için makro rejim ve faktör analizi ağırlıklı.';
            default:
                return 'Standart hisse değerlendirmesi uygulandı.';
        }
    }
}

export default PoseidonEngine.getInstance();
