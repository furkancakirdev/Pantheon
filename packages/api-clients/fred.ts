/**
 * FRED API Client (Aether Modülü İçin)
 * Federal Reserve Economic Data
 * 
 * Amaç: Makroekonomik verileri (VIX, Enflasyon, Faiz, İşsizlik) çekmek.
 */

const BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

export interface FredObservation {
    date: string;
    value: number;
}

export class FredClient {
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.FRED_API_KEY || '';
    }

    /**
     * Seriden son veriyi çeker
     * @param seriesId Serinin ID'si (örn: VIXCLS, CPIAUCSL)
     */
    async getLastObservation(seriesId: string): Promise<FredObservation | null> {
        if (!this.apiKey) {
            console.warn('FRED API Key eksik. Mock veri dönülüyor.');
            return this.getMockData(seriesId);
        }

        try {
            const url = `${BASE_URL}?series_id=${seriesId}&api_key=${this.apiKey}&file_type=json&sort_order=desc&limit=1`;
            const response = await fetch(url);

            if (!response.ok) throw new Error(`FRED API Error: ${response.status}`);

            const data = await response.json();
            if (data.observations && data.observations.length > 0) {
                return {
                    date: data.observations[0].date,
                    value: parseFloat(data.observations[0].value),
                };
            }
            return null;

        } catch (error) {
            console.error('FRED Fetch Error:', error);
            return this.getMockData(seriesId);
        }
    }

    private getMockData(seriesId: string): FredObservation {
        const today = new Date().toISOString().split('T')[0];

        switch (seriesId) {
            case 'VIXCLS': return { date: today, value: 14.25 }; // VIX
            case 'DGS10': return { date: today, value: 4.15 };   // 10 Yıllık Tahvil
            case 'CPIAUCSL': return { date: today, value: 310.5 }; // Enflasyon (Index)
            case 'UNRATE': return { date: today, value: 3.9 };     // İşsizlik
            case 'DEXUSEU': return { date: today, value: 1.08 };   // EUR/USD
            default: return { date: today, value: 0 };
        }
    }
}

export const fred = new FredClient();
