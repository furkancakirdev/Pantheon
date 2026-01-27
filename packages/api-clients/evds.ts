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
            baseUrl: config?.baseUrl || 'https://evds2.tcmb.gov.tr/service/evds'
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
     * Seri verisi çek
     */
    public async getSeries(
        seriesCode: string,
        startDate?: string,
        endDate?: string
    ): Promise<EvdsSeriesData | null> {
        if (!this.config.apiKey) {
            console.warn('EVDS API key not set');
            return null;
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

            // Gerçek implementasyonda fetch çağrısı
            // const response = await fetch(
            //     `${this.config.baseUrl}/series=${seriesCode}&startDate=${start}&endDate=${end}&type=json&key=${this.config.apiKey}`
            // );

            // Şimdilik mock data döndürelim
            const mockData = this.getMockSeriesData(seriesCode, start, end);

            this.cache.set(cacheKey, {
                data: mockData,
                expiry: Date.now() + this.CACHE_TTL.DAILY
            });

            return mockData;
        } catch (error) {
            console.error(`EVDS error for series ${seriesCode}:`, error);
            return null;
        }
    }

    /**
     * Birden fazla seriyi aynı anda çek
     */
    public async getMultipleSeries(seriesCodes: string[]): Promise<Map<string, EvdsSeriesData>> {
        const results = new Map<string, EvdsSeriesData>();

        await Promise.all(
            seriesCodes.map(async (code) => {
                const data = await this.getSeries(code);
                if (data) {
                    results.set(code, data);
                }
            })
        );

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

        const results = await this.getMultipleSeries(seriesCodes);

        if (results.size === 0) return null;

        const usdTryData = results.get(EVDS_SERIES.USD_TRY);
        const latestValue = (data: EvdsDataPoint[]) => data[data.length - 1]?.value || 0;

        return {
            timestamp: new Date(),
            usdTry: latestValue(usdTryData?.data || []),
            eurTry: latestValue(results.get(EVDS_SERIES.EUR_TRY)?.data || []),
            policyRate: latestValue(results.get(EVDS_SERIES.POLICY_RATE)?.data || []),
            cpi: latestValue(results.get(EVDS_SERIES.CPI)?.data || []),
            ppi: latestValue(results.get(EVDS_SERIES.PPI)?.data || []),
            bist100: latestValue(results.get(EVDS_SERIES.BIST100)?.data || []),
            m2y: latestValue(results.get(EVDS_SERIES.M2Y)?.data || []),
            currentAccount: latestValue(results.get(EVDS_SERIES.CURRENT_ACCOUNT)?.data || []),
            economicConfidence: latestValue(results.get(EVDS_SERIES.CONFIDENCE_INDEX)?.data || []),
            unemployment: latestValue(results.get(EVDS_SERIES.UNEMPLOYMENT)?.data || []),
            industrialProduction: latestValue(results.get(EVDS_SERIES.INDUSTRIAL_PRODUCTION)?.data || []),
            reserves: latestValue(results.get(EVDS_SERIES.RESERVES)?.data || []),
        };
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
        return data.data[data.data.length - 1].value;
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
            this.getSeries(EVDS_SERIES.CPI),
            this.getSeries(EVDS_SERIES.PPI),
            this.getSeries(EVDS_SERIES.CORE_INFLATION)
        ]);

        const getLatest = (data: EvdsSeriesData | null) => {
            if (!data || data.data.length === 0) return null;
            return data.data[data.data.length - 1].value;
        };

        return {
            cpi: getLatest(cpiData),
            ppi: getLatest(ppiData),
            coreInflation: getLatest(coreData)
        };
    }

    /**
     * Mock seri verisi
     */
    private getMockSeriesData(seriesCode: string, start: string, end: string): EvdsSeriesData {
        const data: EvdsDataPoint[] = [];
        const startDate = new Date(start);
        const endDate = new Date(end);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        let baseValue = 100;
        let unit = 'Bilinmiyor';
        let description = seriesCode;

        // Seriye göre mock değer
        if (seriesCode.includes('USD') || seriesCode.includes('DK.USD')) {
            baseValue = 32 + Math.random() * 2;
            unit = 'TL';
            description = 'ABD Doları/Türk Lirası';
        } else if (seriesCode.includes('EUR') || seriesCode.includes('DK.EUR')) {
            baseValue = 35 + Math.random() * 2;
            unit = 'TL';
            description = 'Euro/Türk Lirası';
        } else if (seriesCode.includes('FG.J')) {
            baseValue = 45 + Math.random() * 5;
            unit = '%';
            description = 'Politika Faizi';
        } else if (seriesCode.includes('BILESIK') || seriesCode.includes('BIST')) {
            baseValue = 8000 + Math.random() * 500;
            unit = 'Endeks';
            description = 'BIST 100 Endeks';
        } else if (seriesCode.includes('CPI') || seriesCode.includes('FG.J0')) {
            baseValue = 60 + Math.random() * 5;
            unit = '%';
            description = 'Tüketici Fiyat Endeksi (Yıllık)';
        }

        for (let i = 0; i <= daysDiff; i++) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const change = (Math.random() - 0.5) * 0.02;
            baseValue = baseValue * (1 + change);

            data.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(baseValue * 100) / 100
            });
        }

        return {
            seriesCode,
            description,
            data,
            unit
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
