/**
 * Pantheon Score Engine - Core Score ve Pulse Score
 * 
 * Core Score: Uzun vadeli yatırım kararları (Tüm modüller)
 * Pulse Score: Kısa vadeli trade kararları (Teknik ağırlıklı)
 */

import { PoseidonEngine, AssetType } from '../poseidon/engine';

export interface ModuleScores {
    atlas?: number;     // Temel Analiz (0-100)
    orion?: number;     // Teknik Analiz (0-100)
    aether?: number;    // Makro Rejim (0-100)
    hermes?: number;    // Sentiment (0-100)
    cronos?: number;    // Zamanlama (0-100)
    athena?: number;    // Faktör (0-100)
}

export interface PantheonScoreResult {
    symbol: string;
    assetType: AssetType;
    coreScore: number;          // 0-100
    pulseScore: number;         // 0-100
    coreVerdict: 'GÜÇLÜ AL' | 'AL' | 'TUT' | 'SAT' | 'GÜÇLÜ SAT';
    pulseVerdict: 'LONG' | 'BEKLE' | 'SHORT';
    confidence: number;         // 0-100
    moduleScores: ModuleScores;
    summary: string;
}

// Chiron tarafından dinamik olarak ayarlanan ağırlıklar
export interface ChironWeights {
    atlas: number;
    orion: number;
    aether: number;
    hermes: number;
    cronos: number;
    athena: number;
}

// Varsayılan ağırlıklar (Boğa piyasası)
const DEFAULT_WEIGHTS: ChironWeights = {
    atlas: 20,
    orion: 25,
    aether: 20,
    hermes: 10,
    cronos: 10,
    athena: 15,
};

// Pulse Score ağırlıkları (Kısa vade, teknik ağırlıklı)
const PULSE_WEIGHTS = {
    orion: 40,
    cronos: 25,
    aether: 20,
    hermes: 15,
};

export class PantheonScoreEngine {
    private static instance: PantheonScoreEngine;
    private currentWeights: ChironWeights = DEFAULT_WEIGHTS;

    private constructor() { }

    public static getInstance(): PantheonScoreEngine {
        if (!PantheonScoreEngine.instance) {
            PantheonScoreEngine.instance = new PantheonScoreEngine();
        }
        return PantheonScoreEngine.instance;
    }

    /**
     * Chiron'dan gelen dinamik ağırlıkları ayarla
     */
    public setWeights(weights: Partial<ChironWeights>): void {
        this.currentWeights = { ...this.currentWeights, ...weights };
        this.normalizeWeights();
    }

    /**
     * Ağırlıkları normalize et (toplam 100 olmalı)
     */
    private normalizeWeights(): void {
        const total = Object.values(this.currentWeights).reduce((a, b) => a + b, 0);
        if (total !== 100 && total > 0) {
            for (const key in this.currentWeights) {
                this.currentWeights[key as keyof ChironWeights] =
                    (this.currentWeights[key as keyof ChironWeights] / total) * 100;
            }
        }
    }

    /**
     * Ana hesaplama
     */
    public calculate(
        symbol: string,
        scores: ModuleScores,
        assetType: AssetType = 'HISSE'
    ): PantheonScoreResult {
        // Poseidon ile varlık tipine göre ağırlık ayarla
        const poseidon = PoseidonEngine.getInstance();
        const adjustedWeights = assetType === 'HISSE'
            ? this.currentWeights
            : poseidon.getWeights(assetType);

        // Core Score hesapla
        const coreScore = this.calculateCoreScore(scores, adjustedWeights);
        const coreVerdict = this.getCoreVerdict(coreScore);

        // Pulse Score hesapla
        const pulseScore = this.calculatePulseScore(scores);
        const pulseVerdict = this.getPulseVerdict(pulseScore);

        // Güven skoru (modül uyumu)
        const confidence = this.calculateConfidence(scores);

        // Özet
        const summary = this.generateSummary(coreVerdict, pulseVerdict, confidence);

        return {
            symbol,
            assetType,
            coreScore,
            pulseScore,
            coreVerdict,
            pulseVerdict,
            confidence,
            moduleScores: scores,
            summary,
        };
    }

    /**
     * Core Score: Uzun vade, tüm modüller
     */
    private calculateCoreScore(scores: ModuleScores, weights: ChironWeights | any): number {
        let totalScore = 0;
        let totalWeight = 0;

        const pairs: [keyof ModuleScores, number][] = [
            ['atlas', weights.atlas || 0],
            ['orion', weights.orion || 0],
            ['aether', weights.aether || 0],
            ['hermes', weights.hermes || 0],
            ['cronos', weights.cronos || 0],
            ['athena', weights.athena || 0],
        ];

        for (const [key, weight] of pairs) {
            if (scores[key] !== undefined && weight > 0) {
                totalScore += scores[key]! * weight;
                totalWeight += weight;
            }
        }

        return totalWeight > 0 ? totalScore / totalWeight : 50;
    }

    /**
     * Pulse Score: Kısa vade, teknik ağırlıklı
     */
    private calculatePulseScore(scores: ModuleScores): number {
        let totalScore = 0;
        let totalWeight = 0;

        if (scores.orion !== undefined) {
            totalScore += scores.orion * PULSE_WEIGHTS.orion;
            totalWeight += PULSE_WEIGHTS.orion;
        }
        if (scores.cronos !== undefined) {
            totalScore += scores.cronos * PULSE_WEIGHTS.cronos;
            totalWeight += PULSE_WEIGHTS.cronos;
        }
        if (scores.aether !== undefined) {
            totalScore += scores.aether * PULSE_WEIGHTS.aether;
            totalWeight += PULSE_WEIGHTS.aether;
        }
        if (scores.hermes !== undefined) {
            totalScore += scores.hermes * PULSE_WEIGHTS.hermes;
            totalWeight += PULSE_WEIGHTS.hermes;
        }

        return totalWeight > 0 ? totalScore / totalWeight : 50;
    }

    /**
     * Güven skoru: Modüllerin uyumu
     */
    private calculateConfidence(scores: ModuleScores): number {
        const values = Object.values(scores).filter(v => v !== undefined) as number[];
        if (values.length < 2) return 50;

        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.map(v => Math.pow(v - avg, 2)).reduce((a, b) => a + b, 0) / values.length;
        const stdDev = Math.sqrt(variance);

        // Düşük standart sapma = yüksek güven
        return Math.max(0, Math.min(100, 100 - stdDev * 2));
    }

    private getCoreVerdict(score: number): 'GÜÇLÜ AL' | 'AL' | 'TUT' | 'SAT' | 'GÜÇLÜ SAT' {
        if (score >= 75) return 'GÜÇLÜ AL';
        if (score >= 55) return 'AL';
        if (score >= 45) return 'TUT';
        if (score >= 25) return 'SAT';
        return 'GÜÇLÜ SAT';
    }

    private getPulseVerdict(score: number): 'LONG' | 'BEKLE' | 'SHORT' {
        if (score >= 60) return 'LONG';
        if (score <= 40) return 'SHORT';
        return 'BEKLE';
    }

    private generateSummary(core: string, pulse: string, confidence: number): string {
        const confText = confidence >= 70 ? 'Yüksek' : confidence >= 40 ? 'Orta' : 'Düşük';
        return `Core: ${core}, Pulse: ${pulse}. Güven: ${confText} (%${confidence.toFixed(0)}).`;
    }
}

export default PantheonScoreEngine.getInstance();
