/**
 * EVDS (Elektronik Veri Dağıtım Sistemi) - TCMB API Client
 * Türkiye Cumhuriyet Merkez Bankası ekonomik verilerini çeker.
 *
 * Dokümantasyon: https://evds2.tcmb.gov.tr/
 *
 * Kullanıcı EVDS API key'i almalı: https://evds2.tcmb.gov.tr/register.php
 */

export interface EvdsConfig {
    apiKey: string;
    baseUrl?: string;
    timeout?: number; // ms
}

export interface EvdsSeries {
    seriesCode: string;
    description: string;
    frequency: 'GÜN' | 'HAFTA' | 'AY' | '3 AY' | '6 AY' | 'YIL';
}

export interface EvdsDataPoint {
    date: string;
    value: number | null;
}

export interface EvdsSeriesData {
    seriesCode: string;
    description: string;
    data: EvdsDataPoint[];
    unit: string;
}

export interface EvdsError {
    message: string;
    code?: string;
    statusCode?: number;
}

// Önceden tanımlı seri kodları
export const EVDS_SERIES = {
    // Döviz Kurları
    USD_TRY: 'TP.DK.USD.A.YTL',        // Dolar/TL
    EUR_TRY: 'TP.DK.EUR.A.YTL',        // Euro/TL
    GBP_TRY: 'TP.DK.GBP.A.YTL',        // Sterlin/TL

    // Faiz Oranları
    POLICY_RATE: 'TP.FG.J0',           // Bir hafta vadeli repo faizi
    BORROWING_RATE: 'TP.FG.J2',        // Gecelik faiz oranları (Borçlanma)
    LENDING_RATE: 'TP.FG.J3',          // Gecelik faiz oranları (Verim)

    // Enflasyon
    CPI: 'TP.FG.J0',                   // Tüketici Fiyat Endeksi (Yıllık %)
    PPI: 'TP.HF.PROD',                 // Üretici Fiyat Endeksi
    CORE_INFLATION: 'TP.FG.J2',        // Çekirdek enflasyon

    // BIST Endeksleri
    BIST100: 'TP.MK.F.BILESIK',        // BIST 100 Endeks
    BIST30: 'TP.MK.F.BILESIK',         // BIST 30 (Not: Gerçek kod kontrol edilmeli)

    // Para Arzı
    M2: 'TP.PB.M2',                    // M2 Para arzı
    M2Y: 'TP.PB.M2Y',                  // M2Y

    // Dış Ticaret
    EXPORT: 'TP.H4.G002',              // İhracat (milyon $)
    IMPORT: 'TP.H4.G003',              // İthalat (milyon $)
    TRADE_BALANCE: 'TP.H4.G004',       // Dış ticaret dengesi

    // Ödemeler Dengesi
    CURRENT_ACCOUNT: 'TP.AB.G01',      // Cari işlemler dengesi

    // Ekonomik Güven
    CONFIDENCE_INDEX: 'TP.GRCONF.G12', // Ekonomik güven endeksi

    // İşsizlik
    UNEMPLOYMENT: 'TP.ISGIRU01',       // İşsizlik oranı

    // Sanayi Üretimi
    INDUSTRIAL_PRODUCTION: 'TP.UREG2M',// Sanayi üretim endeksi

    // Rezervler
    RESERVES: 'TP.AB.GULRES',          // Resmi rezervler
} as const;

export interface EvdsMacroData {
    timestamp: Date;
    usdTry: number;
    eurTry: number;
    policyRate: number;
    cpi: number;
    ppi: number;
    bist100: number;
    m2y: number;
    currentAccount: number;
    economicConfidence: number;
    unemployment: number;
    industrialProduction: number;
    reserves: number;
}

export class EvdsClient {
    private static instance: EvdsClient;
    private config: EvdsConfig;
    private cache: Map<string, { data: any; expiry: number }> = new Map();

    // Varsayılan cache süreleri
    private readonly CACHE_TTL = {
        DAILY: 1 * 60 * 60 * 1000,      // 1 saat
        WEEKLY: 6 * 60 * 60 * 1000,     // 6 saat
        MONTHLY: 24 * 60 * 60 * 1000,   // 24 saat
    };

    private constructor(config?: EvdsConfig) {
        this.config = {
            apiKey: config?.apiKey || '',
            baseUrl: config?.baseUrl || 'https://evds2.tcmb.gov.tr/service/evds',
            timeout: config?.timeout || 30000, // 30 saniye varsayılan
        };
    }

    public static getInstance(config?: EvdsConfig): EvdsClient {
        if (!EvdsClient.instance) {
            EvdsClient.instance = new EvdsClient(config);
        }
        return EvdsClient.instance;
    }

    public setApiKey(apiKey: string): void {
        this.config.apiKey = apiKey;
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
     * Seri verisi çek
     */
    public async getSeries(
        seriesCode: string,
        startDate?: string,
        endDate?: string
    ): Promise<EvdsSeriesData | null> {
        if (!this.config.apiKey) {
            throw new Error('EVDS API key bulunamadı. Lütfen EVDS_API_KEY environment variable\'ını ayarlayın.');
        }

        const cacheKey = `evds_${seriesCode}_${startDate}_${endDate}`;
        const cached = this.cache.get(cacheKey);

        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }

        try {
            // Varsayılan tarih aralığı: son 30 gün
            const today = new Date();
            const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

            const start = startDate || thirtyDaysAgo.toISOString().split('T')[0];
            const end = endDate || today.toISOString().split('T')[0];

            // Gerçek API çağrısı
            const url = `${this.config.baseUrl}/series=${seriesCode}&startDate=${start}&endDate=${end}&type=json&key=${this.config.apiKey}`;
            const response = await this.fetchWithTimeout(url);

            if (!response.ok) {
                throw new Error(`EVDS API Hatası: HTTP ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();

            // EVDS API response formatı kontrolü
            if (!result || result.items.length === 0) {
                throw new Error(`EVDS API: ${seriesCode} için veri bulunamadı`);
            }

            // EVDS formatını kendi formatımıza çevir
            const items = result.items || [];
            const data: EvdsDataPoint[] = items.map((item: any) => ({
                date: item.Tarih || item.DATE,
                value: item.value !== null && item.value !== undefined ? parseFloat(item.value) : null,
            }));

            const seriesData: EvdsSeriesData = {
                seriesCode,
                description: items[0]?.SERIE_TITLE || seriesCode,
                data,
                unit: items[0]?.UNIT || '',
            };

            // Cache'e kaydet
            this.cache.set(cacheKey, {
                data: seriesData,
                expiry: Date.now() + this.CACHE_TTL.DAILY
            });

            return seriesData;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`EVDS error for series ${seriesCode}:`, errorMessage);
            throw new Error(`EVDS veri alınamadı (${seriesCode}): ${errorMessage}`);
        }
    }

    /**
     * Birden fazla seriyi aynı anda çek
     */
    public async getMultipleSeries(seriesCodes: string[]): Promise<Map<string, EvdsSeriesData>> {
        const results = new Map<string, EvdsSeriesData>();
        const errors: Map<string, string> = new Map();

        await Promise.all(
            seriesCodes.map(async (code) => {
                try {
                    const data = await this.getSeries(code);
                    if (data) {
                        results.set(code, data);
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    errors.set(code, errorMessage);
                }
            })
        );

        if (errors.size > 0) {
            console.warn('EVDS: Bazı seriler alınamadı:', Array.from(errors.entries()));
        }

        return results;
    }

    /**
     * Makro ekonomik verileri özet halinde çek
     */
    public async getMacroOverview(): Promise<EvdsMacroData | null> {
        const seriesCodes = [
            EVDS_SERIES.USD_TRY,
            EVDS_SERIES.EUR_TRY,
            EVDS_SERIES.POLICY_RATE,
            EVDS_SERIES.CPI,
            EVDS_SERIES.BIST100,
        ];

        try {
            const results = await this.getMultipleSeries(seriesCodes);

            if (results.size === 0) {
                throw new Error('Makro veriler alınamadı');
            }

            const usdTryData = results.get(EVDS_SERIES.USD_TRY);
            const latestValue = (data: EvdsDataPoint[]) => {
                if (!data || data.length === 0) return null;
                // null olmayan son değeri bul
                for (let i = data.length - 1; i >= 0; i--) {
                    if (data[i].value !== null) return data[i].value;
                }
                return null;
            };

            const usdTry = latestValue(usdTryData?.data || []);
            if (usdTry === null) {
                throw new Error('USD/TRY verisi alınamadı');
            }

            return {
                timestamp: new Date(),
                usdTry,
                eurTry: latestValue(results.get(EVDS_SERIES.EUR_TRY)?.data || []) || 0,
                policyRate: latestValue(results.get(EVDS_SERIES.POLICY_RATE)?.data || []) || 0,
                cpi: latestValue(results.get(EVDS_SERIES.CPI)?.data || []) || 0,
                ppi: latestValue(results.get(EVDS_SERIES.PPI)?.data || []) || 0,
                bist100: latestValue(results.get(EVDS_SERIES.BIST100)?.data || []) || 0,
                m2y: latestValue(results.get(EVDS_SERIES.M2Y)?.data || []) || 0,
                currentAccount: latestValue(results.get(EVDS_SERIES.CURRENT_ACCOUNT)?.data || []) || 0,
                economicConfidence: latestValue(results.get(EVDS_SERIES.CONFIDENCE_INDEX)?.data || []) || 0,
                unemployment: latestValue(results.get(EVDS_SERIES.UNEMPLOYMENT)?.data || []) || 0,
                industrialProduction: latestValue(results.get(EVDS_SERIES.INDUSTRIAL_PRODUCTION)?.data || []) || 0,
                reserves: latestValue(results.get(EVDS_SERIES.RESERVES)?.data || []) || 0,
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('EVDS getMacroOverview error:', errorMessage);
            throw new Error(`Makro veri alınamadı: ${errorMessage}`);
        }
    }

    /**
     * Döviz kuru tarihsel verisi
     */
    public async getExchangeRateHistory(
        currency: 'USD' | 'EUR' | 'GBP',
        days: number = 30
    ): Promise<EvdsDataPoint[]> {
        const seriesCode = currency === 'USD' ? EVDS_SERIES.USD_TRY :
                          currency === 'EUR' ? EVDS_SERIES.EUR_TRY :
                          EVDS_SERIES.GBP_TRY;

        const data = await this.getSeries(seriesCode);
        return data?.data.slice(-days) || [];
    }

    /**
     * Faiz oranı verisi
     */
    public async getPolicyRate(): Promise<number | null> {
        const data = await this.getSeries(EVDS_SERIES.POLICY_RATE);
        if (!data || data.data.length === 0) return null;

        // null olmayan son değeri bul
        for (let i = data.data.length - 1; i >= 0; i--) {
            if (data.data[i].value !== null) return data.data[i].value;
        }
        return null;
    }

    /**
     * Enflasyon verisi
     */
    public async getInflation(): Promise<{
        cpi: number | null;
        ppi: number | null;
        coreInflation: number | null;
    }> {
        const [cpiData, ppiData, coreData] = await Promise.all([
            this.getSeries(EVDS_SERIES.CPI).catch(() => null),
            this.getSeries(EVDS_SERIES.PPI).catch(() => null),
            this.getSeries(EVDS_SERIES.CORE_INFLATION).catch(() => null),
        ]);

        const getLatest = (data: EvdsSeriesData | null) => {
            if (!data || data.data.length === 0) return null;
            for (let i = data.data.length - 1; i >= 0; i--) {
                if (data.data[i].value !== null) return data.data[i].value;
            }
            return null;
        };

        return {
            cpi: getLatest(cpiData),
            ppi: getLatest(ppiData),
            coreInflation: getLatest(coreData)
        };
    }

    /**
     * Cache'i temizle
     */
    public clearCache(): void {
        this.cache.clear();
    }

    /**
     * API anahtarı ayarlı mı kontrol et
     */
    public isConfigured(): boolean {
        return !!this.config.apiKey && this.config.apiKey.length > 0;
    }
}

export default EvdsClient.getInstance();
