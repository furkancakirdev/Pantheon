/**
 * KAP (Kamuoyu Aydınlatma Platformu) OSINT Scraper
 * SPK'nın "Özel Durum Açıklamaları" platformuna düşen haberleri
 * bot gibi hızlı okur ve NLP ile sınıflandırır.
 *
 * KAP URL: https://www.kap.org.tr/tr/bildirim-sorgulama
 */

export interface KapNotification {
    id: string;
    symbol: string;
    companyName: string;
    title: string;
    summary: string;
    publishTime: Date;
    category: KapCategory;
    sentiment: 'pozitif' | 'negatif' | 'nötr';
    importance: 'yüksek' | 'orta' | 'düşük';
    url: string;
}

export type KapCategory =
    | 'FINANSAL_TABLO'          // Finansal tablo, bilanço
    | 'KAR_PAYLASIMI'           // Temettü, kar dağıtımı
    | 'SERMAYE_ARTISI'          // Bedelsiz, bedelli sermaye artışı
    | 'SOZLESME_ANLASMA'        // İmza, anlaşma, sözleşme
    | 'SATIN_ALMA'              // Hisse/şirket satın alma
    | 'SATIS'                   // Hisse satışı
    | 'SUC_DUZELTME'            // Suç duyurusu
    | 'FAALIYET_RAPORU'         // Faaliyet raporu
    | 'GENEL_KURUL'             // Genel kurul kararı
    | 'DIGER';                  // Diğer

export interface KapFilter {
    symbols?: string[];
    categories?: KapCategory[];
    startDate?: Date;
    endDate?: Date;
    minImportance?: 'yüksek' | 'orta' | 'düşük';
}

export interface KapAnalysisResult {
    notifications: KapNotification[];
    summary: {
        total: number;
        pozitif: number;
        negatif: number;
        notr: number;
        yuksekOnemli: number;
    };
    alerts: string[];
}

export class KapScraper {
    private static instance: KapScraper;
    private cache: Map<string, { data: KapNotification[]; expiry: number }> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000; // 5 dakika

    // Kritik kelimeler - duygu analizi için
    private readonly POZITIF_KELIMELER = [
        'artış', 'yüksel', 'güçlü', ' pozitif', 'başarılı', 'kâr', 'getiri',
        'temettü', 'bedelsiz', 'sermaye artışı', 'anlaşma', 'sözleşme',
        'satın alma', 'ihale kazandı', 'rekör', 'en yüksek', 'büyük'
    ];

    private readonly NEGATIF_KELIMELER = [
        'düşüş', 'azalış', 'negatif', 'zayıf', 'zarar', 'kayıp',
        'faaliyet raporu', 'suç duyurusu', 'soruşturma', 'iadeli',
        'iptal', 'geri çekme', 'iflas', 'konkordato', 'borç'
    ];

    private readonly YUKSEK_ONEM_KELIMELER = [
        'bedelsiz', 'bedelli', 'temettü', 'satın alma', 'birleşme',
        'ihale', 'anlaşma', 'stratejik', 'karar', 'denetim'
    ];

    private constructor() {}

    public static getInstance(): KapScraper {
        if (!KapScraper.instance) {
            KapScraper.instance = new KapScraper();
        }
        return KapScraper.instance;
    }

    /**
     * KAP'tan son bildirimleri çek
     * Gerçek implementasyonda web scraping veya RSS kullanılır
     */
    public async getNotifications(filter?: KapFilter): Promise<KapAnalysisResult> {
        const cacheKey = `kap_${JSON.stringify(filter)}`;
        const cached = this.cache.get(cacheKey);

        if (cached && cached.expiry > Date.now()) {
            return this.analyzeNotifications(cached.data);
        }

        try {
            // Gerçek implementasyonda KAP RSS veya web scraping yapılacak
            const notifications = await this.fetchKapData(filter);

            this.cache.set(cacheKey, {
                data: notifications,
                expiry: Date.now() + this.CACHE_TTL
            });

            return this.analyzeNotifications(notifications);
        } catch (error) {
            console.error('KAP Scraper error:', error);
            return {
                notifications: [],
                summary: { total: 0, pozitif: 0, negatif: 0, notr: 0, yuksekOnemli: 0 },
                alerts: []
            };
        }
    }

    /**
     * Belirli bir sembol için son bildirimleri çek
     */
    public async getSymbolNotifications(symbol: string, limit: number = 10): Promise<KapNotification[]> {
        const result = await this.getNotifications({ symbols: [symbol] });
        return result.notifications.slice(0, limit);
    }

    /**
     * Gerçek KAP verisi çekme (Mock - Production'da web scraper olacak)
     */
    private async fetchKapData(filter?: KapFilter): Promise<KapNotification[]> {
        // Mock data - Gerçek implementasyonda:
        // 1. KAP RSS feed: https://www.kap.org.tr/tr/rss/bildirim-sorgulama
        // 2. Veya puppeteer/playwright ile web scraping

        const mockNotifications: KapNotification[] = [
            {
                id: '202501261',
                symbol: 'THYAO',
                companyName: 'Türk Hava Yolları A.O.',
                title: 'Yolcu Sayısında Artış',
                summary: 'Şirketimiz Ocak 2024 döneminde yolcu sayısında geçen yılın aynı dönemine göre %15 artış gerçekleştirmiştir.',
                publishTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 saat önce
                category: 'FAALIYET_RAPORU',
                sentiment: 'pozitif',
                importance: 'orta',
                url: 'https://www.kap.org.tr/tr/bildirim/123456'
            },
            {
                id: '202501262',
                symbol: 'GARAN',
                companyName: 'Garanti BBVA Yatırım Menkul',
                title: 'Temettü Ödemesi',
                summary: 'Yönetim kurulumuz, hisse başına 1,50 TL nakit temettü dağıtılması kararlaştırmıştır.',
                publishTime: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 saat önce
                category: 'KAR_PAYLASIMI',
                sentiment: 'pozitif',
                importance: 'yüksek',
                url: 'https://www.kap.org.tr/tr/bildirim/123457'
            },
            {
                id: '202501263',
                symbol: 'ASELS',
                companyName: 'Aselsan Elektronik Sanayi',
                title: 'İhracat Sözleşmesi İmzalandı',
                summary: 'Şirketimiz ile yurt dışı bir alıcı arasında 50 milyon USD tutarında ihracat sözleşmesi imzalanmıştır.',
                publishTime: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 saat önce
                category: 'SOZLESME_ANLASMA',
                sentiment: 'pozitif',
                importance: 'yüksek',
                url: 'https://www.kap.org.tr/tr/bildirim/123458'
            },
            {
                id: '202501264',
                symbol: 'ISCTR',
                companyName: 'İş Bankası',
                title: 'Faaliyet Raporu Açıklandı',
                summary: '2023 yılı faaliyet raporumuz yayımlanmıştır. Net karımız geçen yılın aynı dönemine göre %8 artışla 45 milyar TL olmuştur.',
                publishTime: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 saat önce
                category: 'FAALIYET_RAPORU',
                sentiment: 'pozitif',
                importance: 'orta',
                url: 'https://www.kap.org.tr/tr/bildirim/123459'
            },
            {
                id: '202501265',
                symbol: 'KOZAA',
                companyName: 'Koza Altın İşletmeleri',
                title: 'Suç Duyurusunda Bulunuldu',
                summary: 'Hakkında yürütülen soruşturma kapsamında suç duyurusunda bulunulmuştur.',
                publishTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 gün önce
                category: 'SUC_DUZELTME',
                sentiment: 'negatif',
                importance: 'yüksek',
                url: 'https://www.kap.org.tr/tr/bildirim/123460'
            }
        ];

        // Filtreleme
        let filtered = mockNotifications;

        if (filter?.symbols && filter.symbols.length > 0) {
            filtered = filtered.filter(n => filter.symbols!.includes(n.symbol));
        }

        if (filter?.categories && filter.categories.length > 0) {
            filtered = filtered.filter(n => filter.categories!.includes(n.category));
        }

        if (filter?.startDate) {
            filtered = filtered.filter(n => n.publishTime >= filter.startDate!);
        }

        if (filter?.endDate) {
            filtered = filtered.filter(n => n.publishTime <= filter.endDate!);
        }

        return filtered;
    }

    /**
     * Bildirimleri analiz et ve özetle
     */
    private analyzeNotifications(notifications: KapNotification[]): KapAnalysisResult {
        const summary = {
            total: notifications.length,
            pozitif: notifications.filter(n => n.sentiment === 'pozitif').length,
            negatif: notifications.filter(n => n.sentiment === 'negatif').length,
            notr: notifications.filter(n => n.sentiment === 'nötr').length,
            yuksekOnemli: notifications.filter(n => n.importance === 'yüksek').length
        };

        const alerts: string[] = [];

        // Yüksek önemli pozitif bildirimler
        notifications
            .filter(n => n.importance === 'yüksek' && n.sentiment === 'pozitif')
            .forEach(n => {
                alerts.push(`🟢 ${n.symbol}: ${n.title}`);
            });

        // Yüksek önemli negatif bildirimler
        notifications
            .filter(n => n.importance === 'yüksek' && n.sentiment === 'negatif')
            .forEach(n => {
                alerts.push(`🔴 ${n.symbol}: ${n.title}`);
            });

        return {
            notifications,
            summary,
            alerts
        };
    }

    /**
     * Metinden duygu analizi (Basit NLP)
     */
    public analyzeSentiment(text: string): 'pozitif' | 'negatif' | 'nötr' {
        const lowerText = text.toLowerCase();
        let pozitifScore = 0;
        let negatifScore = 0;

        for (const kelime of this.POZITIF_KELIMELER) {
            if (lowerText.includes(kelime)) pozitifScore++;
        }

        for (const kelime of this.NEGATIF_KELIMELER) {
            if (lowerText.includes(kelime)) negatifScore++;
        }

        if (pozitifScore > negatifScore) return 'pozitif';
        if (negatifScore > pozitifScore) return 'negatif';
        return 'nötr';
    }

    /**
     * Bildirim kategorisini tespit et
     */
    public detectCategory(title: string, summary: string): KapCategory {
        const text = (title + ' ' + summary).toLowerCase();

        if (text.includes('temettü') || text.includes('kar dağıt')) return 'KAR_PAYLASIMI';
        if (text.includes('bedelsiz') || text.includes('bedelli') || text.includes('sermaye artış')) return 'SERMAYE_ARTISI';
        if (text.includes('anlaşma') || text.includes('sözleşme') || text.includes('imza')) return 'SOZLESME_ANLASMA';
        if (text.includes('satın al') || text.includes('devral')) return 'SATIN_ALMA';
        if (text.includes('satış') || text.includes('devir')) return 'SATIS';
        if (text.includes('suç duyurusu') || text.includes('soruştur')) return 'SUC_DUZELTME';
        if (text.includes('faaliyet rapor') || text.includes('bilanço')) return 'FAALIYET_RAPORU';
        if (text.includes('genel kurul')) return 'GENEL_KURUL';

        return 'DIGER';
    }

    /**
     * Önem seviyesini tespit et
     */
    public detectImportance(title: string, summary: string): 'yüksek' | 'orta' | 'düşük' {
        const text = (title + ' ' + summary).toLowerCase();

        for (const kelime of this.YUKSEK_ONEM_KELIMELER) {
            if (text.includes(kelime)) return 'yüksek';
        }

        // Uzun bildirimler genelde daha önemlidir
        if (summary.length > 200) return 'orta';

        return 'orta';
    }

    /**
     * Cache'i temizle
     */
    public clearCache(): void {
        this.cache.clear();
    }
}

export default KapScraper.getInstance();
