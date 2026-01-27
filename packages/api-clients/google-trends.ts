/**
 * Google Trends API Client
 * Google Trends verilerini çekmek için kullanılır.
 * "Kitle Psikolojisi"ni ölçmek için arama hacmi trendlerini takip eder.
 *
 * Not: Google Trends'un resmi API'si yoktur.
 * Bu modül, alternatif yöntemler kullanarak trend verilerini çeker.
 */

export interface TrendData {
    term: string;
    timeline: Array<{ date: string; value: number }>;
    currentScore: number;
    trend: 'RISING' | 'FALLING' | 'STABLE';
    peakDate?: string;
    regionalInterest?: Record<string, number>;
}

export interface TrendComparison {
    term1: string;
    term2: string;
    correlation: number;
    winner: string;
}

export class GoogleTrendsClient {
    private static instance: GoogleTrendsClient;
    private cache: Map<string, { data: TrendData; expiry: number }> = new Map();
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 saat

    private constructor() {}

    public static getInstance(): GoogleTrendsClient {
        if (!GoogleTrendsClient.instance) {
            GoogleTrendsClient.instance = new GoogleTrendsClient();
        }
        return GoogleTrendsClient.instance;
    }

    /**
     * Bir terim için trend verisi çek
     * Google Trends'un resmi API'si olmadığı için,
     * sosyal medya ve haber kaynaklarında geçiş frekansını analiz ederiz
     */
    public async getTrend(term: string, timeframe: '7d' | '30d' | '90d' = '30d'): Promise<TrendData | null> {
        const cacheKey = `${term}_${timeframe}`;
        const cached = this.cache.get(cacheKey);

        if (cached && cached.expiry > Date.now()) {
            return cached.data;
        }

        try {
            // Not: Gerçek implementasyonda burada Google Trends API'ye istek atılır
            // Şimdilik mock data döndürelim
            const mockData = this.getMockTrendData(term, timeframe);

            this.cache.set(cacheKey, {
                data: mockData,
                expiry: Date.now() + this.CACHE_TTL
            });

            return mockData;
        } catch (error) {
            console.error(`Google Trends error for ${term}:`, error);
            return null;
        }
    }

    /**
     * Şirket/hisse için sosyal medya ilgisi skorunu hesapla
     * Twitter/X, haber siteleri ve forumlarda geçiş sayısına göre
     */
    public async getSocialBuzzScore(symbol: string, companyName?: string): Promise<{
        score: number; // 0-100
        trend: 'RISING' | 'FALLING' | 'STABLE';
        sources: {
            twitter: number;
            news: number;
            forums: number;
        };
    }> {
        // Mock data - Gerçek implementasyonda Hermes modülü ile entegre olacak
        const baseScore = 40 + Math.random() * 40;
        const trendRoll = Math.random();

        return {
            score: Math.round(baseScore),
            trend: trendRoll > 0.6 ? 'RISING' : trendRoll < 0.3 ? 'FALLING' : 'STABLE',
            sources: {
                twitter: Math.round(baseScore * (0.8 + Math.random() * 0.4)),
                news: Math.round(baseScore * (0.6 + Math.random() * 0.4)),
                forums: Math.round(baseScore * (0.4 + Math.random() * 0.4))
            }
        };
    }

    /**
     * İki terim karşılaştırması (Pair Trading insight)
     */
    public async compareTerms(term1: string, term2: string): Promise<TrendComparison | null> {
        try {
            const trend1 = await this.getTrend(term1);
            const trend2 = await this.getTrend(term2);

            if (!trend1 || !trend2) return null;

            const score1 = trend1.currentScore;
            const score2 = trend2.currentScore;

            // Basit korelasyon hesapla
            const correlation = this.calculateCorrelation(
                trend1.timeline.map(t => t.value),
                trend2.timeline.map(t => t.value)
            );

            return {
                term1,
                term2,
                correlation: Math.round(correlation * 100) / 100,
                winner: score1 > score2 ? term1 : term2
            };
        } catch (error) {
            console.error('Comparison error:', error);
            return null;
        }
    }

    /**
     * Sektör bazlı trend analizi
     */
    public async getSectorTrends(sector: string): Promise<{
        topCompanies: Array<{ symbol: string; score: number }>;
        sectorSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    }> {
        // Mock data
        const mockCompanies = {
            'Teknoloji': ['THYAO', 'ASELS', 'PARSN', 'KCHOL'],
            'Finans': ['GARAN', 'ISCTR', 'AKBNK', 'YKBNK'],
            'Havacılık': ['THYAO', 'PGSUS'],
            'Enerji': ['AKENR', 'AYGAZ', 'KZRER'],
            'Perakende': ['BIMAS', 'MGROS', 'SASA']
        };

        const companies = mockCompanies[sector as keyof typeof mockCompanies] || [];

        return {
            topCompanies: companies.map(symbol => ({
                symbol,
                score: 40 + Math.random() * 50
            })).sort((a, b) => b.score - a.score),
            sectorSentiment: Math.random() > 0.5 ? 'BULLISH' : 'NEUTRAL'
        };
    }

    /**
     * Korrelasyon hesapla (Pearson)
     */
    private calculateCorrelation(arr1: number[], arr2: number[]): number {
        const n = Math.min(arr1.length, arr2.length);
        if (n === 0) return 0;

        const mean1 = arr1.slice(0, n).reduce((a, b) => a + b, 0) / n;
        const mean2 = arr2.slice(0, n).reduce((a, b) => a + b, 0) / n;

        let num = 0;
        let den1 = 0;
        let den2 = 0;

        for (let i = 0; i < n; i++) {
            const diff1 = arr1[i] - mean1;
            const diff2 = arr2[i] - mean2;
            num += diff1 * diff2;
            den1 += diff1 * diff1;
            den2 += diff2 * diff2;
        }

        const den = Math.sqrt(den1 * den2);
        return den === 0 ? 0 : num / den;
    }

    /**
     * Mock trend verisi
     */
    private getMockTrendData(term: string, timeframe: string): TrendData {
        const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
        const timeline: Array<{ date: string; value: number }> = [];
        const now = Date.now();

        let baseValue = 40 + Math.random() * 30;
        const trend = Math.random() > 0.5 ? 1 : -1;

        for (let i = days; i >= 0; i--) {
            const date = new Date(now - i * 24 * 60 * 60 * 1000);
            const change = (Math.random() - 0.4) * trend * 5;
            baseValue = Math.max(10, Math.min(100, baseValue + change));

            timeline.push({
                date: date.toISOString().split('T')[0],
                value: Math.round(baseValue)
            });
        }

        const firstValue = timeline[0].value;
        const lastValue = timeline[timeline.length - 1].value;
        const trendDirection = lastValue > firstValue + 10 ? 'RISING' :
                              lastValue < firstValue - 10 ? 'FALLING' : 'STABLE';

        return {
            term,
            timeline,
            currentScore: lastValue,
            trend: trendDirection,
            peakDate: timeline.reduce((max, curr) =>
                curr.value > max.value ? curr : max
            ).date
        };
    }

    /**
     * Cache'i temizle
     */
    public clearCache(): void {
        this.cache.clear();
    }
}

export default GoogleTrendsClient.getInstance();
