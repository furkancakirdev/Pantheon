/**
 * FRED API Client (Aether Modülü İçin)
 * Federal Reserve Economic Data
 *
 * Amaç: Makroekonomik verileri (VIX, Enflasyon, Faiz, İşsizlik) çekmek.
 */

const BASE_URL = 'https://api.stlouisfed.org/fred/series/observations';

export interface FredConfig {
    apiKey: string;
    timeout?: number; // ms
}

export interface FredObservation {
    date: string;
    value: number;
}

export class FredClient {
    private config: FredConfig;

    constructor(config?: FredConfig) {
        this.config = {
            apiKey: config?.apiKey || process.env.FRED_API_KEY || '',
            timeout: config?.timeout || 30000,
        };
    }

    /**
     * API çağrısı yap (timeout ile)
     */
    private async fetchWithTimeout(url: string): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                },
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * API key kontrolü
     */
    private ensureApiKey(): void {
        if (!this.config.apiKey) {
            throw new Error('FRED API key bulunamadı. Lütfen FRED_API_KEY environment variable\'ını ayarlayın.');
        }
    }

    /**
     * Seriden son veriyi çeker
     * @param seriesId Serinin ID'si (örn: VIXCLS, CPIAUCSL)
     */
    async getLastObservation(seriesId: string): Promise<FredObservation> {
        this.ensureApiKey();

        try {
            const url = `${BASE_URL}?series_id=${seriesId}&api_key=${this.config.apiKey}&file_type=json&sort_order=desc&limit=1`;
            const response = await this.fetchWithTimeout(url);

            if (!response.ok) {
                throw new Error(`FRED API Hatası: HTTP ${response.status} - ${response.statusText}`);
            }

            const data = await response.json() as { observations: Array<{ date: string; value: string }> };

            if (!data.observations || data.observations.length === 0) {
                throw new Error(`FRED API: ${seriesId} için veri bulunamadı`);
            }

            const observation = data.observations[0];
            const value = parseFloat(observation.value);

            if (isNaN(value)) {
                throw new Error(`FRED API: ${seriesId} için geçersiz veri değeri`);
            }

            return {
                date: observation.date,
                value,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('FRED Fetch Error:', errorMessage);
            throw new Error(`FRED veri alınamadı (${seriesId}): ${errorMessage}`);
        }
    }

    /**
     * Seriden birden fazla gözlem çeker
     * @param seriesId Serinin ID'si
     * @param limit Kaç gözlem çekilecek
     */
    async getObservations(seriesId: string, limit: number = 100): Promise<FredObservation[]> {
        this.ensureApiKey();

        try {
            const url = `${BASE_URL}?series_id=${seriesId}&api_key=${this.config.apiKey}&file_type=json&sort_order=desc&limit=${limit}`;
            const response = await this.fetchWithTimeout(url);

            if (!response.ok) {
                throw new Error(`FRED API Hatası: HTTP ${response.status}`);
            }

            const data = await response.json() as { observations: Array<{ date: string; value: string }> };

            if (!data.observations || data.observations.length === 0) {
                throw new Error(`${seriesId} için veri bulunamadı`);
            }

            return data.observations
                .map(obs => ({
                    date: obs.date,
                    value: parseFloat(obs.value),
                }))
                .filter(obs => !isNaN(obs.value));
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('FRED Observations Error:', errorMessage);
            throw new Error(`FRED gözlemleri alınamadı (${seriesId}): ${errorMessage}`);
        }
    }

    /**
     * Birden fazla seriden veri çeker
     */
    async getMultipleObservations(seriesIds: string[]): Promise<Map<string, FredObservation>> {
        const results = new Map<string, FredObservation>();
        const errors: Map<string, string> = new Map();

        await Promise.all(
            seriesIds.map(async (seriesId) => {
                try {
                    const observation = await this.getLastObservation(seriesId);
                    results.set(seriesId, observation);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    errors.set(seriesId, errorMessage);
                }
            })
        );

        if (errors.size > 0) {
            console.warn('FRED: Bazı seriler alınamadı:', Array.from(errors.entries()));
        }

        return results;
    }

    /**
     * API key yapılandırılmış mı kontrol et
     */
    isConfigured(): boolean {
        return !!this.config.apiKey && this.config.apiKey.length > 0;
    }
}

export const fred = new FredClient();
