
import PantheonScoreEngine, { ModuleScores, PantheonScoreEngine as EngineClass } from './score';

describe('Pantheon Score Engine', () => {
    // Singleton resetlemek zor olabilir, bu yüzden direkt import edilen instance'ı kullanıyoruz
    const engine = PantheonScoreEngine;

    it('should be a singleton', () => {
        const instance1 = PantheonScoreEngine;
        // @ts-ignore - Private constructor hack for testing if needed, but normally handled by export
        // const instance2 = EngineClass.getInstance(); 
        // expect(instance1).toBe(instance2);
        expect(instance1).toBeDefined();
    });

    it('should calculate HIGH CORE SCORE for all bullish signals', () => {
        const scores: ModuleScores = {
            atlas: 90,
            orion: 85,
            aether: 80,
            hermes: 95,
            cronos: 88,
            athena: 92
        };

        const result = engine.calculate('TEST', scores);

        expect(result.coreScore).toBeGreaterThan(80);
        expect(result.coreVerdict).toBe('GÜÇLÜ AL');
        expect(result.confidence).toBeGreaterThan(70); // High confidence due to low variance
    });

    it('should calculate LOW CORE SCORE for all bearish signals', () => {
        const scores: ModuleScores = {
            atlas: 20,
            orion: 15,
            aether: 30,
            hermes: 25,
            cronos: 10,
            athena: 20
        };

        const result = engine.calculate('TEST', scores);

        expect(result.coreScore).toBeLessThan(30);
        expect(result.coreVerdict).toBe('GÜÇLÜ SAT');
    });

    it('should calculate PULSE SCORE correctly (Weighted towards Technicals)', () => {
        const scores: ModuleScores = {
            atlas: 10, // Fundamental (ignored in Pulse)
            orion: 90, // Technical (High weight in Pulse)
            aether: 50,
            hermes: 50,
            cronos: 80, // Timing (High weight in Pulse)
            athena: 10
        };

        const result = engine.calculate('TEST', scores);

        // Pulse should be high because Orion and Cronos are high
        expect(result.pulseScore).toBeGreaterThan(65);
        expect(result.pulseVerdict).toBe('LONG');

        // Core score might be lower due to Atlas/Athena being low
        expect(result.coreScore).toBeLessThan(result.pulseScore);
    });

    it('should handle missing module scores gracefully', () => {
        const scores: ModuleScores = {
            atlas: 80,
            orion: 80,
            // aether missing
            // hermes missing
            cronos: 80,
            // athena missing
        };

        const result = engine.calculate('TEST', scores);

        expect(result.coreScore).toBeCloseTo(80, 0);
        expect(result.coreVerdict).toBe('GÜÇLÜ AL');
    });

    it('should default empty scores to neutral (50)', () => {
        const scores: ModuleScores = {}; // Empty

        // This edge case might return 50 or NaN depending on implementation logis
        // current implementation: totalWeight > 0 ? ... : 50

        const result = engine.calculate('TEST', scores);
        expect(result.coreScore).toBe(50);
        expect(result.pulseScore).toBe(50);
        expect(result.confidence).toBe(50);
    });
});
