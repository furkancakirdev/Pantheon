/**
 * Mynet Finans API Client
 * Canlı Piyasa Verileri
 *
 * Kaynak: https://finans.mynet.com
 * Endpoints: /api/real-time, /static/most-shares-live-user-data.json
 */

export interface MynetConfig {
    baseUrl?: string;
    timeout?: number; // ms
}

export interface MarketData {
    xu100: {
        deger: number;
        degisim: number;
        degisimOran: number;
    };
    xu030: {
        deger: number;
        degisim: number;
        degisimOran: number;
    };
    dolar: {
        alis: number;
        satis: number;
        degisim: number;
    };
    euro: {
        alis: number;
        satis: number;
        degisim: number;
    };
    altin: {
        alis: number;
        satis: number;
        degisim: number;
    };
}

export interface LiveStock {
    kod: string;
    ad: string;
    son: number;
    degisim: number;
    hacim: number;
}

export class MynetClient {
    private config: MynetConfig;

    constructor(config?: MynetConfig) {
        this.config = {
            baseUrl: config?.baseUrl || 'https://finans.mynet.com',
            timeout: config?.timeout || 30000,
        };
    }

    /**
     * API çağrısı yap (timeout ile)
     */
    private async fetchWithTimeout(url: string, options?: RequestInit): Promise<Response> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Canlı piyasa verilerini çeker (endeksler, döviz, emtia)
     */
    async fetchRealTimeMarket(): Promise<MarketData> {
        try {
            const response = await this.fetchWithTimeout(`${this.config.baseUrl}/api/real-time`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Mynet API Hatası: HTTP ${response.status} - ${response.statusText}`);
            }

            const data = await response.json() as MarketData;

            // Veri validation
            if (!data.xu100 || !data.dolar) {
                throw new Error('Mynet API: Geçersiz piyasa verisi formatı');
            }

            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Mynet API Error:', errorMessage);
            throw new Error(`Mynet piyasa verisi alınamadı: ${errorMessage}`);
        }
    }

    /**
     * En hareketli hisseleri çeker
     */
    async fetchMostActiveStocks(): Promise<LiveStock[]> {
        try {
            const response = await this.fetchWithTimeout(
                `${this.config.baseUrl}/static/most-shares-live-user-data.json`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Mynet API Hatası: HTTP ${response.status}`);
            }

            const data = await response.json() as LiveStock[];

            if (!Array.isArray(data)) {
                throw new Error('Mynet API: Geçersiz hisse verisi formatı');
            }

            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('Mynet Most Active Error:', errorMessage);
            throw new Error(`En hareketli hisseler alınamadı: ${errorMessage}`);
        }
    }

    /**
     * Piyasa özeti formatla
     */
    formatMarketSummary(data: MarketData): string {
        return `
📊 Piyasa Özeti
━━━━━━━━━━━━━━━
BIST 100: ${data.xu100?.deger?.toLocaleString('tr-TR')} (${data.xu100?.degisimOran > 0 ? '+' : ''}${data.xu100?.degisimOran?.toFixed(2)}%)
BIST 30:  ${data.xu030?.deger?.toLocaleString('tr-TR')} (${data.xu030?.degisimOran > 0 ? '+' : ''}${data.xu030?.degisimOran?.toFixed(2)}%)
━━━━━━━━━━━━━━━
USD/TRY:  ${data.dolar?.satis?.toFixed(4)}
EUR/TRY:  ${data.euro?.satis?.toFixed(4)}
Altın:    ${data.altin?.satis?.toLocaleString('tr-TR')} TL
`;
    }
}

// Singleton instance
export const mynet = new MynetClient();

// Legacy function exports for backward compatibility
export async function fetchRealTimeMarket(): Promise<MarketData> {
    return mynet.fetchRealTimeMarket();
}

export async function fetchMostActiveStocks(): Promise<LiveStock[]> {
    return mynet.fetchMostActiveStocks();
}

export function formatMarketSummary(data: MarketData): string {
    return mynet.formatMarketSummary(data);
}

export default mynet;
