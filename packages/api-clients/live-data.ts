/**
 * Live Data Service - Canlı BIST Veri Servisi
 *
 * Özellikler:
 * - Canlı fiyat güncellemeleri (SSE/WebSocket simülasyonu)
 * - Portföy takibi
 * - Real-time sinyal bildirimleri
 */

// ============ TİP TANIMLARI ============

export interface LiveQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    high: number;
    low: number;
    bid?: number;
    ask?: number;
    timestamp: Date;
}

export interface LiveQuoteUpdate {
    symbol: string;
    price: number;
    change: number;
    volume?: number;
    timestamp: Date;
}

export interface PortfolioPosition {
    symbol: string;
    quantity: number;
    entryPrice: number;
    entryDate: Date;
}

export interface PortfolioSnapshot {
    positions: Array<{
        symbol: string;
        quantity: number;
        entryPrice: number;
        currentPrice: number;
        pnl: number;
        pnlPercent: number;
        value: number;
    }>;
    totalValue: number;
    totalPnl: number;
    totalPnlPercent: number;
    timestamp: Date;
}

// ============ CANLI FİYAT SERVİSİ ============

class LiveDataService {
    private static instance: LiveDataService;
    private subscribers: Map<string, Set<(quote: LiveQuote) => void>> = new Map();
    private portfolioSubscribers: Set<(snapshot: PortfolioSnapshot) => void> = new Set();
    private updateInterval: ReturnType<typeof setInterval> | null = null;

    private constructor() {}

    public static getInstance(): LiveDataService {
        if (!LiveDataService.instance) {
            LiveDataService.instance = new LiveDataService();
        }
        return LiveDataService.instance;
    }

    /**
     * Tek bir hissenin canlı fiyatını al
     */
    public async getLiveQuote(symbol: string): Promise<LiveQuote | null> {
        // Mock canlı fiyat (gerçek API entegrasyonu yapılacak)
        const quote = this.generateMockQuote(symbol);
        return quote;
    }

    /**
     * Çoklu hisse canlı fiyatı al
     */
    public async getBatchQuotes(symbols: string[]): Promise<Map<string, LiveQuote>> {
        const quotes = new Map<string, LiveQuote>();

        for (const symbol of symbols) {
            const quote = await this.getLiveQuote(symbol);
            if (quote) {
                quotes.set(symbol, quote);
            }
        }

        return quotes;
    }

    /**
     * Canlı fiyat aboneliği başlat
     */
    public subscribeToQuotes(symbol: string, callback: (quote: LiveQuote) => void): () => void {
        if (!this.subscribers.has(symbol)) {
            this.subscribers.set(symbol, new Set());
        }
        this.subscribers.get(symbol)!.add(callback);

        // Aboneliğe hemen mevcut değeri gönder
        this.getLiveQuote(symbol).then(quote => {
            if (quote) callback(quote);
        });

        // Abonelik iptal fonksiyonu
        return () => {
            const subs = this.subscribers.get(symbol);
            if (subs) {
                subs.delete(callback);
                if (subs.size === 0) {
                    this.subscribers.delete(symbol);
                }
            }
        };
    }

    /**
     * Portföy anlık görüntüsü al
     */
    public async getPortfolioSnapshot(positions: PortfolioPosition[]): Promise<PortfolioSnapshot> {
        const quotes = await this.getBatchQuotes(positions.map(p => p.symbol));

        let totalValue = 0;
        let totalPnl = 0;
        const positionSnapshots = [];

        for (const position of positions) {
            const quote = quotes.get(position.symbol);
            if (!quote) continue;

            const currentValue = quote.price * position.quantity;
            const entryValue = position.entryPrice * position.quantity;
            const pnl = currentValue - entryValue;
            const pnlPercent = ((quote.price - position.entryPrice) / position.entryPrice) * 100;

            totalValue += currentValue;
            totalPnl += pnl;

            positionSnapshots.push({
                symbol: position.symbol,
                quantity: position.quantity,
                entryPrice: position.entryPrice,
                currentPrice: quote.price,
                pnl,
                pnlPercent,
                value: currentValue,
            });
        }

        const totalPnlPercent = totalValue > 0 ? (totalPnl / (totalValue - totalPnl)) * 100 : 0;

        return {
            positions: positionSnapshots,
            totalValue,
            totalPnl,
            totalPnlPercent,
            timestamp: new Date(),
        };
    }

    /**
     * Canlı güncelleme servisini başlat
     * Simüle edilmiş SSE/WebSocket bağlantısı
     */
    public startLiveUpdates(symbols: string[], intervalMs: number = 5000): void {
        if (this.updateInterval) {
            this.stopLiveUpdates();
        }

        console.log(`🔴 Canlı veri servisi başlatıldı (${symbols.length} hisse, ${intervalMs}ms interval)`);

        this.updateInterval = setInterval(async () => {
            for (const symbol of symbols) {
                // Abonelere gönder
                const subs = this.subscribers.get(symbol);
                const quote = await this.getLiveQuote(symbol);

                if (subs && subs.size > 0 && quote) {
                    subs.forEach(cb => cb(quote));
                }
            }
        }, intervalMs);
    }

    /**
     * Canlı güncelleme servisini durdur
     */
    public stopLiveUpdates(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
            console.log('⏸️ Canlı veri servisi durduruldu');
        }
    }

    /**
     * Mock canlı fiyat üret
     * Gerçek API entegrasyonu sonrası kaldırılacak
     */
    private generateMockQuote(symbol: string): LiveQuote {
        const basePrices: Record<string, number> = {
            'THYAO': 315,
            'ASELS': 78,
            'SAHOL': 42,
            'GARAN': 43,
            'AKBNK': 18.5,
            'KCHOL': 28,
            'SISE': 52,
            'EKGYO': 35,
            'TSKB': 13,
            'YKBNK': 8.5,
        };

        const basePrice = basePrices[symbol] || 100;
        const change = (Math.random() - 0.5) * 4;
        const changePercent = (change / basePrice) * 100;
        const price = basePrice + change;

        return {
            symbol,
            price,
            change,
            changePercent,
            volume: Math.floor(1000000 + Math.random() * 10000000),
            high: price * 1.02,
            low: price * 0.98,
            bid: price - 0.05,
            ask: price + 0.05,
            timestamp: new Date(),
        };
    }

    /**
     * Mock fiyat güncellemesi üret
     */
    private generateMockUpdate(symbol: string): LiveQuoteUpdate {
        const quote = this.generateMockQuote(symbol);
        return {
            symbol: quote.symbol,
            price: quote.price,
            change: quote.change,
            volume: quote.volume,
            timestamp: new Date(),
        };
    }

    /**
     * Hareketli hisseleri tespit et
     */
    public async getMovers(topN: number = 10): Promise<{
        gainers: Array<{ symbol: string; changePercent: number }>;
        losers: Array<{ symbol: string; changePercent: number }>;
    }> {
        const stocks = await this.getAllStocks();
        const movers = stocks
            .map(s => ({
                symbol: s.kod,
                changePercent: (Math.random() - 0.5) * 10, // Mock - API'den gelecek
            }))
            .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

        return {
            gainers: movers
                .filter(m => m.changePercent > 0)
                .slice(0, topN)
                .map(m => ({ ...m, changePercent: Math.round(m.changePercent * 10) / 10 })),
            losers: movers
                .filter(m => m.changePercent < 0)
                .slice(0, topN)
                .map(m => ({ ...m, changePercent: Math.round(m.changePercent * 10) / 10 })),
        };
    }

    /**
     * Tüm hisse fiyatlarını al (batch)
     */
    private async getAllStocks(): Promise<Array<{ kod: string }>> {
        // Bu metod İş Yatırım API'den hisse listesi çekecek
        // Şimdilik mock veri dönüyorum
        return [
            { kod: 'THYAO' },
            { kod: 'ASELS' },
            { kod: 'SAHOL' },
            { kod: 'GARAN' },
            { kod: 'AKBNK' },
            { kod: 'KCHOL' },
            { kod: 'SISE' },
            { kod: 'EKGYO' },
            { kod: 'TSKB' },
            { kod: 'YKBNK' },
        ];
    }

    /**
     * Canlı veri cache'ini temizle
     */
    public async clearCache(symbol?: string): Promise<void> {
        // Cache temizleme - devre dışı
    }
}

export default LiveDataService.getInstance();
