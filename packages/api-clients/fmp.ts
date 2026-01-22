/**
 * Financial Modeling Prep (FMP) API Client
 * 
 * Amaç: Global hisse verileri, detaylı finansallar ve rasyolar.
 * Atlas ve Global analizler için kullanılır.
 */

const BASE_URL = 'https://financialmodelingprep.com/api/v3';

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
    private apiKey: string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.FMP_API_KEY || '';
    }

    /**
     * Hisse senedi anlık fiyat ve temel verilerini çeker
     */
    async getQuote(symbol: string): Promise<FmpQuote | null> {
        if (!this.apiKey) {
            console.warn('FMP API Key eksik. Mock veri dönülüyor.');
            return this.getMockQuote(symbol);
        }

        try {
            const url = `${BASE_URL}/quote/${symbol}?apikey=${this.apiKey}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error(`FMP API Error: ${response.status}`);

            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                return data[0] as FmpQuote;
            }
            return null;

        } catch (error) {
            console.error('FMP Fetch Error:', error);
            return this.getMockQuote(symbol);
        }
    }

    /**
     * En aktif hisseleri getir
     */
    async getMostActive(): Promise<FmpQuote[]> {
        if (!this.apiKey) return this.getMockActive();
        try {
            const url = `${BASE_URL}/stock_market/actives?apikey=${this.apiKey}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('FMP Error');
            return await res.json();
        } catch (e) {
            return this.getMockActive();
        }
    }

    private getMockQuote(symbol: string): FmpQuote {
        return {
            symbol: symbol,
            price: 156.7,
            changesPercentage: 1.25,
            change: 1.95,
            dayLow: 154.2,
            dayHigh: 157.5,
            yearHigh: 180.0,
            yearLow: 130.0,
            marketCap: 2500000000000,
            priceAvg50: 150.0,
            priceAvg200: 145.0,
            volume: 50000000,
            avgVolume: 45000000,
            eps: 5.4,
            pe: 28.5
        };
    }

    private getMockActive(): FmpQuote[] {
        return [this.getMockQuote('AAPL'), this.getMockQuote('NVDA'), this.getMockQuote('TSLA')];
    }
}

export const fmp = new FmpClient();
