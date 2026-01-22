/**
 * Phoenix - Strateji ve Tarama Motoru
 * Argus Terminal'den port edildi.
 * 
 * Amaç: Otomatik tarama (Scanning) ve Fırsat Yakalama (Level 0 -> Level 1 pipeline)
 */

export interface PhoenixCandidate {
    symbol: string;
    lastPrice: number;
    score?: number;
    reason?: string;
}

export type PhoenixMode = 'SAVER' | 'BALANCED' | 'AGGRESSIVE';

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
     * Tarama Pipeline'ını Çalıştır
     */
    public async runPipeline(
        mode: PhoenixMode,
        universe: Array<{ symbol: string; price: number; change: number }>
    ): Promise<{ candidates: PhoenixCandidate[]; report: string }> {

        // 1. Level 0: Evren Taraması (Filtreleme)
        const candidates = universe.filter(item => {
            // Basit filtreler: Penny stock olmasın, hacim olsun vb.
            if (item.price < 5) return false;

            // Mod'a göre değişim filtresi
            if (mode === 'AGGRESSIVE' && Math.abs(item.change) < 2) return false; // Agresif modda hareketli hisseler

            return true;
        });

        // 2. Shortlist Seçimi (En çok düşen/çıkanlar)
        const sorted = candidates.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
        const limit = mode === 'SAVER' ? 5 : (mode === 'BALANCED' ? 10 : 20);
        const shortlist = sorted.slice(0, limit);

        // 3. Level 1: Kanıt Toplama (Teknik Analiz Taraması)
        const verified: PhoenixCandidate[] = [];

        for (const item of shortlist) {
            // Mock Teknik Analiz (SMA Cross vb.)
            // Gerçekte burada teknik analiz servisi çağrılır
            const isGoldenCross = Math.random() > 0.7; // %30 şansla AL sinyali

            if (isGoldenCross) {
                verified.push({
                    symbol: item.symbol,
                    lastPrice: item.price,
                    score: 80 + Math.random() * 20, // 80-100 arası skor
                    reason: 'Phoenix: Golden Cross Tespit Edildi',
                });
            }
        }

        // Rapor Oluştur
        const report = `Phoenix Tarama Raporu (${mode}):
Taranan: ${universe.length}
Aday: ${candidates.length}
Shortlist: ${shortlist.length}
Onaylanan: ${verified.length}
`;

        return { candidates: verified, report };
    }
}

export default PhoenixEngine.getInstance();
