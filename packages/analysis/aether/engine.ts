/**
 * Aether - Makroekonomik Analiz ve Varlık Alokasyonu
 * Argus Terminal'den port edildi.
 * 
 * Amaç: Piyasa rejimini belirlemek ve varlık dağılım önerisi sunmak.
 */

export interface TargetAllocation {
    equity: number; // 0.0 - 1.0 (Hisse)
    bond: number;   // 0.0 - 1.0 (Tahvil/Güvenli)
    gold: number;   // 0.0 - 1.0 (Altın)
    cash: number;   // 0.0 - 1.0 (Nakit)
}

export type DetailedRegime =
    | 'EUPHORIA'      // Aşırı Boğa
    | 'RISK_ON'       // Boğa
    | 'NEUTRAL'       // Nötr
    | 'MILD_RISK_OFF' // Hafif Ayı
    | 'DEEP_RISK_OFF';// Derin Ayı

export class AetherEngine {
    private static instance: AetherEngine;

    private constructor() { }

    public static getInstance(): AetherEngine {
        if (!AetherEngine.instance) {
            AetherEngine.instance = new AetherEngine();
        }
        return AetherEngine.instance;
    }

    /**
     * Aether skoruna göre alokasyon belirle
     * @param aetherScore 0-100 arası makro skor
     */
    public determineAllocation(aetherScore: number): { regime: DetailedRegime; allocation: TargetAllocation } {
        let regime: DetailedRegime;
        let allocation: TargetAllocation;

        if (aetherScore >= 85) {
            // Euphoria (85-100): Coşku dönemi, biraz kar realizasyonu ve çeşitlendirme
            regime = 'EUPHORIA';
            allocation = { equity: 0.80, bond: 0.10, gold: 0.10, cash: 0.0 };
        } else if (aetherScore >= 65) {
            // Risk On (65-85): Güçlü piyasa, hisse ağırlıklı
            regime = 'RISK_ON';
            allocation = { equity: 0.95, bond: 0.0, gold: 0.05, cash: 0.0 };
        } else if (aetherScore >= 45) {
            // Neutral (45-65): Belirsiz, dengeli portföy
            regime = 'NEUTRAL';
            allocation = { equity: 0.60, bond: 0.20, gold: 0.10, cash: 0.10 };
        } else if (aetherScore >= 30) {
            // Mild Risk Off (30-45): Koruma ağırlıklı
            regime = 'MILD_RISK_OFF';
            allocation = { equity: 0.35, bond: 0.40, gold: 0.20, cash: 0.05 };
        } else {
            // Deep Risk Off (0-30): Kriz, nakit ve güvenli liman
            regime = 'DEEP_RISK_OFF';
            allocation = { equity: 0.15, bond: 0.40, gold: 0.35, cash: 0.10 };
        }

        return { regime, allocation };
    }

    /**
     * Risk profiline göre alokasyonu ayarla
     */
    public adjustForRiskProfile(allocation: TargetAllocation, profile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE'): TargetAllocation {
        let { equity, bond, gold, cash } = allocation;

        if (profile === 'CONSERVATIVE') {
            // Hisseyi azalt, tahvil/altına kaydır
            const shift = equity * 0.20;
            equity -= shift;
            bond += shift;
        } else if (profile === 'AGGRESSIVE') {
            // Tahvili azalt, hisseye kaydır
            const shift = bond * 0.50;
            bond -= shift;
            equity += shift;
        }

        // Toplamı 1.0'a normalize et
        const total = equity + bond + gold + cash;
        return {
            equity: equity / total,
            bond: bond / total,
            gold: gold / total,
            cash: cash / total,
        };
    }
}

export default AetherEngine.getInstance();
