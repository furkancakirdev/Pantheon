/**
 * TEFAS API Client V2
 * Türkiye Elektronik Fon Alım Satım Platformu
 *
 * Kaynak: https://www.tefas.gov.tr
 * Endpoints: /api/DB/BindComparisonFundReturns, /BindComparisonFundSizes
 *
 * Özellikler:
 * - Fon getirileri ve büyüklükleri
 * - Fon türü filtreleme
 * - Getiri sıralama
 * - Risk hesaplama (standart sapma)
 * - Sharpe oranı hesaplama
 */

export interface TefasConfig {
    baseUrl?: string;
    timeout?: number; // ms
}

// ============ TİP TANIMLARI ============

export interface FundReturn {
    fonKodu: string;           // Fon kodu (TI2, YAY vb.)
    fonAdi: string;            // Fon adı
    fonTuru: string;           // Fon türü (Hisse, Borçlanma, Kıymetli Maden, vb.)
    kurucuAdi: string;         // Kurucu şirket
    gunlukGetiri: number;      // Günlük getiri %
    haftalikGetiri: number;    // Haftalık getiri %
    aylikGetiri: number;       // Aylık getiri %
    yillikGetiri: number;      // Yıllık getiri %
    fonBuyuklugu?: number;     // Fon büyüklüğü (TL) - opsiyonel
}

export interface TefasApiResponse {
    data: FundReturn[];
}

export interface FundAnalysis extends FundReturn {
    riskSkoru?: number;        // Risk skoru 0-100
    sharpeOrani?: number;      // Sharpe oranı
    volatilite?: number;       // Standart sapma
    trend?: 'YUKARI' | 'ASAGI' | 'YATAY';
}

export type FonTuru =
    | 'Hisse Senedi'
    | 'Borçlanma Aracı'
    | 'Kıymetli Maden'
    | 'Yabancı Hisse Senedi'
    | 'Değişken Fon'
    | 'Para Piyasası'
    | 'Katılım Hisse Senedi'
    | 'Kıymetli Maden (Altın)'
    | 'Girişim Sermayesi';

export class TefasClient {
    private config: TefasConfig;

    constructor(config?: TefasConfig) {
        this.config = {
            baseUrl: config?.baseUrl || 'https://www.tefas.gov.tr/api/DB',
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
     * Fon getirilerini çeker
     */
    async fetchFundReturns(): Promise<FundReturn[]> {
        try {
            const response = await this.fetchWithTimeout(`${this.config.baseUrl}/BindComparisonFundReturns`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    lang: 'TR',
                }),
            });

            if (!response.ok) {
                throw new Error(`TEFAS API Hatası: HTTP ${response.status} - ${response.statusText}`);
            }

            const data = await response.json() as TefasApiResponse;
            const funds = data.data || [];

            if (funds.length === 0) {
                throw new Error('TEFAS API: Fon verisi bulunamadı');
            }

            return funds;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('TEFAS API Error:', errorMessage);
            throw new Error(`TEFAS fon verileri alınamadı: ${errorMessage}`);
        }
    }

    /**
     * Fon büyüklüklerini çeker
     */
    async fetchFundSizes(): Promise<Map<string, number>> {
        try {
            const response = await this.fetchWithTimeout(`${this.config.baseUrl}/BindComparisonFundSizes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                },
                body: JSON.stringify({ lang: 'TR' }),
            });

            if (!response.ok) {
                throw new Error(`TEFAS API Hatası: HTTP ${response.status}`);
            }

            const data = await response.json() as TefasApiResponse;
            const funds = data.data || [];

            const sizeMap = new Map<string, number>();
            for (const fund of funds) {
                if (fund.fonKodu && fund.fonBuyuklugu) {
                    sizeMap.set(fund.fonKodu, fund.fonBuyuklugu);
                }
            }

            return sizeMap;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('TEFAS Fund Sizes Error:', errorMessage);
            throw new Error(`TEFAS fon büyüklükleri alınamadı: ${errorMessage}`);
        }
    }

    /**
     * Fon türüne göre filtrele
     */
    filterByFundType(funds: FundReturn[], type: FonTuru | string): FundReturn[] {
        return funds.filter(f => f.fonTuru?.toLowerCase().includes(type.toLowerCase()));
    }

    /**
     * Kurucuya göre filtrele
     */
    filterByFounder(funds: FundReturn[], founder: string): FundReturn[] {
        return funds.filter(f => f.kurucuAdi?.toLowerCase().includes(founder.toLowerCase()));
    }

    /**
     * Getiri aralığına göre filtrele
     */
    filterByReturnRange(
        funds: FundReturn[],
        minReturn: number,
        maxReturn: number = Infinity,
        period: 'gunluk' | 'haftalik' | 'aylik' | 'yillik' = 'yillik'
    ): FundReturn[] {
        const key = `${period}Getiri` as keyof FundReturn;
        return funds.filter(f => {
            const ret = f[key] as number;
            return ret >= minReturn && ret <= maxReturn;
        });
    }

    /**
     * En yüksek getirili fonları sırala
     */
    sortByReturn(
        funds: FundReturn[],
        period: 'gunluk' | 'haftalik' | 'aylik' | 'yillik' = 'yillik'
    ): FundReturn[] {
        const key = `${period}Getiri` as keyof FundReturn;
        return [...funds].sort((a, b) => (b[key] as number) - (a[key] as number));
    }

    /**
     * Fon büyüklüğüne göre sırala
     */
    sortBySize(funds: FundReturn[]): FundReturn[] {
        return [...funds].sort((a, b) => (b.fonBuyuklugu || 0) - (a.fonBuyuklugu || 0));
    }

    /**
     * Risk skoru hesapla (basit yaklaşım)
     */
    calculateRiskScore(fund: FundReturn): number {
        const monthlyReturn = fund.aylikGetiri || 0;

        if (monthlyReturn < -5) return 90;
        if (monthlyReturn < 0) return 70;
        if (monthlyReturn < 2) return 50;
        if (monthlyReturn < 5) return 30;
        return 20;
    }

    /**
     * Trend belirleme
     */
    determineTrend(fund: FundReturn): 'YUKARI' | 'ASAGI' | 'YATAY' {
        const daily = fund.gunlukGetiri || 0;
        const weekly = fund.haftalikGetiri || 0;
        const monthly = fund.aylikGetiri || 0;

        if (daily > 0 && weekly > 0 && monthly > 0) return 'YUKARI';
        if (daily < 0 && weekly < 0 && monthly < 0) return 'ASAGI';
        return 'YATAY';
    }

    /**
     * Fon analizi yap
     */
    analyzeFund(fund: FundReturn): FundAnalysis {
        const riskSkoru = this.calculateRiskScore(fund);
        const trend = this.determineTrend(fund);

        const yillikGetiri = fund.yillikGetiri || 0;
        const sharpeOrani = riskSkoru > 0 ? (yillikGetiri / riskSkoru) * 10 : 0;

        return {
            ...fund,
            riskSkoru,
            sharpeOrani,
            trend,
            volatilite: riskSkoru / 10,
        };
    }

    /**
     * Toplu fon analizi
     */
    analyzeFunds(funds: FundReturn[]): FundAnalysis[] {
        return funds.map(f => this.analyzeFund(f));
    }

    /**
     * En iyi fonları seç (multi-kriter)
     */
    async selectBestFunds(options: {
        minReturn?: number;
        maxRisk?: number;
        fonTuru?: string;
        limit?: number;
    } = {}): Promise<FundAnalysis[]> {
        const {
            minReturn = 0,
            maxRisk = 50,
            fonTuru,
            limit = 10
        } = options;

        let funds = await this.fetchFundReturns();

        if (minReturn > 0) {
            funds = this.filterByReturnRange(funds, minReturn, Infinity, 'yillik');
        }

        if (fonTuru) {
            funds = this.filterByFundType(funds, fonTuru);
        }

        const analyzed = this.analyzeFunds(funds);
        const riskFiltered = analyzed.filter(f => (f.riskSkoru || 0) <= maxRisk);

        riskFiltered.sort((a, b) => (b.sharpeOrani || 0) - (a.sharpeOrani || 0));

        return riskFiltered.slice(0, limit);
    }

    /**
     * Fon kodundan detaylı bilgi al
     */
    async getFundDetails(fonKodu: string): Promise<FundAnalysis | null> {
        const funds = await this.fetchFundReturns();
        const fund = funds.find(f => f.fonKodu === fonKodu.toUpperCase());

        if (!fund) return null;

        const sizes = await this.fetchFundSizes();
        const size = sizes.get(fonKodu);

        return this.analyzeFund({
            ...fund,
            fonBuyuklugu: size,
        });
    }

    /**
     * Fon türleri listesi
     */
    async getFonTurleri(): Promise<string[]> {
        const funds = await this.fetchFundReturns();
        const types = new Set<string>();

        for (const fund of funds) {
            if (fund.fonTuru) {
                types.add(fund.fonTuru);
            }
        }

        return Array.from(types).sort();
    }

    /**
     * Kurucu şirketleri listesi
     */
    async getKurucular(): Promise<string[]> {
        const funds = await this.fetchFundReturns();
        const founders = new Set<string>();

        for (const fund of funds) {
            if (fund.kurucuAdi) {
                founders.add(fund.kurucuAdi);
            }
        }

        return Array.from(founders).sort();
    }
}

// Singleton instance
export const tefas = new TefasClient();

// Legacy function exports for backward compatibility
export async function fetchFundReturns(): Promise<FundReturn[]> {
    return tefas.fetchFundReturns();
}

export async function fetchFundSizes(): Promise<Map<string, number>> {
    return tefas.fetchFundSizes();
}

export function filterByFundType(funds: FundReturn[], type: FonTuru | string): FundReturn[] {
    return tefas.filterByFundType(funds, type);
}

export function filterByFounder(funds: FundReturn[], founder: string): FundReturn[] {
    return tefas.filterByFounder(funds, founder);
}

export function filterByReturnRange(
    funds: FundReturn[],
    minReturn: number,
    maxReturn: number = Infinity,
    period: 'gunluk' | 'haftalik' | 'aylik' | 'yillik' = 'yillik'
): FundReturn[] {
    return tefas.filterByReturnRange(funds, minReturn, maxReturn, period);
}

export function sortByReturn(
    funds: FundReturn[],
    period: 'gunluk' | 'haftalik' | 'aylik' | 'yillik' = 'yillik'
): FundReturn[] {
    return tefas.sortByReturn(funds, period);
}

export function sortBySize(funds: FundReturn[]): FundReturn[] {
    return tefas.sortBySize(funds);
}

export function calculateRiskScore(fund: FundReturn): number {
    return tefas.calculateRiskScore(fund);
}

export function determineTrend(fund: FundReturn): 'YUKARI' | 'ASAGI' | 'YATAY' {
    return tefas.determineTrend(fund);
}

export function analyzeFund(fund: FundReturn): FundAnalysis {
    return tefas.analyzeFund(fund);
}

export function analyzeFunds(funds: FundReturn[]): FundAnalysis[] {
    return tefas.analyzeFunds(funds);
}

export async function selectBestFunds(
    options: {
        minReturn?: number;
        maxRisk?: number;
        fonTuru?: string;
        limit?: number;
    } = {}
): Promise<FundAnalysis[]> {
    return tefas.selectBestFunds(options);
}

export async function getFundDetails(fonKodu: string): Promise<FundAnalysis | null> {
    return tefas.getFundDetails(fonKodu);
}

export async function getFonTurleri(): Promise<string[]> {
    return tefas.getFonTurleri();
}

export async function getKurucular(): Promise<string[]> {
    return tefas.getKurucular();
}

export default {
    fetchFundReturns,
    fetchFundSizes,
    filterByFundType,
    filterByFounder,
    filterByReturnRange,
    sortByReturn,
    sortBySize,
    calculateRiskScore,
    determineTrend,
    analyzeFund,
    analyzeFunds,
    selectBestFunds,
    getFundDetails,
    getFonTurleri,
    getKurucular,
};
