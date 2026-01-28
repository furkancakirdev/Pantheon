/**
 * Financial Modeling Prep (FMP) API Client
 *
 * Amaç: Global hisse verileri, detaylı finansallar ve rasyolar.
 * Atlas ve Global analizler için kullanılır.
 */

const BASE_URL = 'https://financialmodelingprep.com/api/v3';

export interface FmpConfig {
    apiKey: string;
    timeout?: number; // ms
}

export interface FmpQuote {
    symbol: string;
    price: number;
    changesPercentage: number;
    change: number;
    dayLow: number;
    dayHigh: number;
    yearHigh: number;
    yearLow: number;
    marketCap: number;
    priceAvg50: number;
    priceAvg200: number;
    volume: number;
    avgVolume: number;
    eps: number;
    pe: number;
}

export class FmpClient {
    private config: FmpConfig;

    constructor(config?: FmpConfig) {
        this.config = {
            apiKey: config?.apiKey || process.env.FMP_API_KEY || '',
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
            throw new Error('FMP API key bulunamadı. Lütfen FMP_API_KEY environment variable\'ını ayarlayın.');
        }
    }

    /**
     * Hisse senedi anlık fiyat ve temel verilerini çeker
     */
    async getQuote(symbol: string): Promise<FmpQuote> {
        this.ensureApiKey();

        try {
            const url = `${BASE_URL}/quote/${symbol}?apikey=${this.config.apiKey}`;
            const response = await this.fetchWithTimeout(url);

            if (!response.ok) {
                throw new Error(`FMP API Hatası: HTTP ${response.status} - ${response.statusText}`);
            }

            const data = await response.json() as FmpQuote[];

            if (!Array.isArray(data) || data.length === 0) {
                throw new Error(`FMP API: ${symbol} için veri bulunamadı`);
            }

            return data[0];
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('FMP Fetch Error:', errorMessage);
            throw new Error(`FMP veri alınamadı (${symbol}): ${errorMessage}`);
        }
    }

    /**
     * En aktif hisseleri getir
     */
    async getMostActive(): Promise<FmpQuote[]> {
        this.ensureApiKey();

        try {
            const url = `${BASE_URL}/stock_market/actives?apikey=${this.config.apiKey}`;
            const response = await this.fetchWithTimeout(url);

            if (!response.ok) {
                throw new Error(`FMP API Hatası: HTTP ${response.status}`);
            }

            const data = await response.json() as FmpQuote[];
            return Array.isArray(data) ? data : [];
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('FMP Most Active Error:', errorMessage);
            throw new Error(`En aktif hisseler alınamadı: ${errorMessage}`);
        }
    }

    /**
     * Birden fazla hissenin verisini aynı anda çek
     */
    async getMultipleQuotes(symbols: string[]): Promise<Map<string, FmpQuote>> {
        const results = new Map<string, FmpQuote>();
        const errors: Map<string, string> = new Map();

        await Promise.all(
            symbols.map(async (symbol) => {
                try {
                    const quote = await this.getQuote(symbol);
                    results.set(symbol, quote);
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    errors.set(symbol, errorMessage);
                }
            })
        );

        if (errors.size > 0) {
            console.warn('FMP: Bazı hisseler alınamadı:', Array.from(errors.entries()));
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

export const fmp = new FmpClient();
