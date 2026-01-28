/**
 * İş Yatırım API Client
 * BIST Hisse Senedi Temel Verileri
 *
 * Kaynak: https://www.isyatirim.com.tr
 * Endpoint: POST /Data.aspx/HisseSenetleri
 */

export interface IsyatirimConfig {
    baseUrl?: string;
    timeout?: number; // ms
}

export interface StockFundamentals {
    kod: string;           // Hisse kodu (THYAO, ASELS, vb.)
    ad: string;            // Şirket adı
    sektor: string;        // Sektör
    kapanis: number;       // Kapanış fiyatı
    fk: number;            // Fiyat/Kazanç
    pddd: number;          // Piyasa Değeri / Defter Değeri
    fdFavok: number;       // FD/FAVÖK
    roe: number;           // Özkaynak Karlılığı
    borcOzkaynak: number;  // Borç/Özkaynak
    piyasaDegeri: number;  // Piyasa Değeri (TL)
    yabanciOran: number;   // Yabancı Oranı %
}

export interface IsyatirimApiResponse {
    d: StockFundamentals[];
}

export class IsyatirimClient {
    private config: IsyatirimConfig;

    constructor(config?: IsyatirimConfig) {
        this.config = {
            baseUrl: config?.baseUrl || 'https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/Data.aspx',
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
     * Tüm BIST hisselerinin temel verilerini çeker
     */
    async fetchAllStocks(): Promise<StockFundamentals[]> {
        try {
            const response = await this.fetchWithTimeout(`${this.config.baseUrl}/HisseSenetleri`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                throw new Error(`İş Yatırım API Hatası: HTTP ${response.status} - ${response.statusText}`);
            }

            const data = await response.json() as IsyatirimApiResponse;
            const stocks = data.d || [];

            if (stocks.length === 0) {
                throw new Error('İş Yatırım API: Hiç hisse verisi bulunamadı');
            }

            return stocks;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('İş Yatırım API Error:', errorMessage);
            throw new Error(`İş Yatırım veri alınamadı: ${errorMessage}`);
        }
    }

    /**
     * Belirli bir hisseyi koduna göre getir
     */
    async getStockByCode(code: string): Promise<StockFundamentals | null> {
        const stocks = await this.fetchAllStocks();
        return stocks.find(s => s.kod === code.toUpperCase()) || null;
    }

    /**
     * Birden fazla hisseyi kodlarına göre getir
     */
    async getStocksByCodes(codes: string[]): Promise<Map<string, StockFundamentals>> {
        const stocks = await this.fetchAllStocks();
        const results = new Map<string, StockFundamentals>();

        const upperCodes = codes.map(c => c.toUpperCase());
        for (const stock of stocks) {
            if (upperCodes.includes(stock.kod)) {
                results.set(stock.kod, stock);
            }
        }

        return results;
    }

    /**
     * Belirli bir sektördeki hisseleri filtreler
     */
    async filterBySector(sector: string): Promise<StockFundamentals[]> {
        const stocks = await this.fetchAllStocks();
        return stocks.filter(s => s.sektor?.toLowerCase().includes(sector.toLowerCase()));
    }

    /**
     * F/K oranına göre filtreler (Yaşar Erdinç kriteri)
     */
    async filterByPE(maxPE: number = 15): Promise<StockFundamentals[]> {
        const stocks = await this.fetchAllStocks();
        return stocks.filter(s => s.fk > 0 && s.fk <= maxPE);
    }

    /**
     * PD/DD oranına göre filtreler
     */
    async filterByPBV(maxPBV: number = 2): Promise<StockFundamentals[]> {
        const stocks = await this.fetchAllStocks();
        return stocks.filter(s => s.pddd > 0 && s.pddd <= maxPBV);
    }

    /**
     * Birden fazla kriterle filtreler
     */
    async filterByCriteria(criteria: {
        maxPE?: number;
        maxPBV?: number;
        minROE?: number;
        maxDebtEquity?: number;
        sector?: string;
    }): Promise<StockFundamentals[]> {
        let stocks = await this.fetchAllStocks();

        if (criteria.maxPE !== undefined) {
            const maxPE = criteria.maxPE!;
            stocks = stocks.filter(s => s.fk > 0 && s.fk <= maxPE);
        }
        if (criteria.maxPBV !== undefined) {
            const maxPBV = criteria.maxPBV!;
            stocks = stocks.filter(s => s.pddd > 0 && s.pddd <= maxPBV);
        }
        if (criteria.minROE !== undefined) {
            const minROE = criteria.minROE!;
            stocks = stocks.filter(s => s.roe >= minROE);
        }
        if (criteria.maxDebtEquity !== undefined) {
            const maxDebtEquity = criteria.maxDebtEquity!;
            stocks = stocks.filter(s => s.borcOzkaynak <= maxDebtEquity);
        }
        if (criteria.sector) {
            stocks = stocks.filter(s => s.sektor?.toLowerCase().includes(criteria.sector!.toLowerCase()));
        }

        return stocks;
    }
}

// Singleton instance
export const isyatirim = new IsyatirimClient();

// Legacy function exports for backward compatibility
export async function fetchAllStocks(): Promise<StockFundamentals[]> {
    return isyatirim.fetchAllStocks();
}

export async function clearStocksCache(): Promise<void> {
    // Cache temizleme - devre dışı
}

export function filterBySector(stocks: StockFundamentals[], sector: string): StockFundamentals[] {
    return stocks.filter(s => s.sektor?.toLowerCase().includes(sector.toLowerCase()));
}

export function filterByPE(stocks: StockFundamentals[], maxPE: number = 15): StockFundamentals[] {
    return stocks.filter(s => s.fk > 0 && s.fk <= maxPE);
}

export function filterByPBV(stocks: StockFundamentals[], maxPBV: number = 2): StockFundamentals[] {
    return stocks.filter(s => s.pddd > 0 && s.pddd <= maxPBV);
}

export default isyatirim;
