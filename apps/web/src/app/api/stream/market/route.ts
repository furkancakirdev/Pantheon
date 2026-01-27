/**
 * Real-Time Market Data Stream API
 * Server-Sent Events (SSE) ile canlı veri akışı
 *
 * Endpoint: GET /api/stream/market?symbols=THYAO,ASELS,GARAN
 *
 * Özellikler:
 * - SSE ile canlı veri push
 * - Çoklu sembol takibi
 * - Auto-reconnect client tarafı
 * - Heartbeat ile bağlantı kontrolü
 */

import { NextRequest } from 'next/server';

// ============ TİP TANIMLARI ============

interface MarketQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    high: number;
    low: number;
    bid?: number;
    ask?: number;
    timestamp: number;
}

interface StreamMessage {
    type: 'quote' | 'heartbeat' | 'error';
    data?: MarketQuote | { symbols: string[] };
    error?: string;
    timestamp: number;
}

// ============ MOCK VERİ GENERATOR ============

class MockDataGenerator {
    private basePrices: Map<string, number> = new Map();
    private currentPrices: Map<string, number> = new Map();

    constructor() {
        // Başlangıç fiyatları
        this.basePrices.set('THYAO', 315);
        this.basePrices.set('ASELS', 78);
        this.basePrices.set('SAHOL', 42);
        this.basePrices.set('GARAN', 43);
        this.basePrices.set('AKBNK', 18.5);
        this.basePrices.set('KCHOL', 28);
        this.basePrices.set('SISE', 52);
        this.basePrices.set('EKGYO', 35);
        this.basePrices.set('TSKB', 13);
        this.basePrices.set('YKBNK', 8.5);
        this.basePrices.set('XU100', 8500);
        this.basePrices.set('USDTRY', 32.5);
        this.basePrices.set('EURTRY', 35.2);
        this.basePrices.set('GLDGR', 2450);

        // Mevcut fiyatları başlat
        this.basePrices.forEach((price, symbol) => {
            this.currentPrices.set(symbol, price);
        });
    }

    /**
     * Bir sembol için anlık fiyat üret
     */
    generateQuote(symbol: string): MarketQuote {
        const basePrice = this.basePrices.get(symbol) || 100;
        const currentPrice = this.currentPrices.get(symbol) || basePrice;

        // Random walk - fiyat ufak değişimler yapar
        const change = (Math.random() - 0.5) * (basePrice * 0.002); // %0.2 volatilite
        const newPrice = currentPrice + change;
        const totalChange = newPrice - basePrice;
        const totalChangePercent = (totalChange / basePrice) * 100;

        this.currentPrices.set(symbol, newPrice);

        return {
            symbol,
            price: Number(newPrice.toFixed(2)),
            change: Number(totalChange.toFixed(2)),
            changePercent: Number(totalChangePercent.toFixed(2)),
            volume: Math.floor(1000000 + Math.random() * 10000000),
            high: Number((newPrice * 1.02).toFixed(2)),
            low: Number((newPrice * 0.98).toFixed(2)),
            bid: Number((newPrice - 0.05).toFixed(2)),
            ask: Number((newPrice + 0.05).toFixed(2)),
            timestamp: Date.now()
        };
    }

    /**
     * Çoklu sembol için fiyat üret
     */
    generateBatch(symbols: string[]): MarketQuote[] {
        return symbols.map(symbol => this.generateQuote(symbol));
    }
}

const generator = new MockDataGenerator();

// ============ SSE STREAM HANDLER ============

/**
 * SSE formatında mesaj oluştur
 */
function formatSSE(event: string, data: any): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

/**
 * GET handler - SSE stream başlat
 */
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const symbolsParam = searchParams.get('symbols');
    const interval = parseInt(searchParams.get('interval') || '1000', 10);

    if (!symbolsParam) {
        return Response.json(
            { error: 'symbols parametresi gerekli' },
            { status: 400 }
        );
    }

    const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());

    // SSE response header'ları
    const headers = new Headers({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Nginx buffer'ını kapat
    });

    // Stream encoder
    const encoder = new TextEncoder();

    // ReadableStream oluştur
    const stream = new ReadableStream({
        async start(controller) {
            let intervalId: NodeJS.Timeout | null = null;
            let heartbeatId: NodeJS.Timeout | null = null;

            // Başlangıç mesajı
            const startMessage: StreamMessage = {
                type: 'quote',
                data: { symbols } as any,
                timestamp: Date.now()
            };
            controller.enqueue(encoder.encode(formatSSE('connected', startMessage)));

            // Veri gönderme fonksiyonu
            const sendQuotes = () => {
                try {
                    const quotes = generator.generateBatch(symbols);

                    quotes.forEach(quote => {
                        const message: StreamMessage = {
                            type: 'quote',
                            data: quote,
                            timestamp: Date.now()
                        };
                        controller.enqueue(encoder.encode(formatSSE('quote', message)));
                    });
                } catch (error) {
                    console.error('SSE gönderim hatası:', error);
                    const errorMessage: StreamMessage = {
                        type: 'error',
                        error: 'Veri gönderim hatası',
                        timestamp: Date.now()
                    };
                    controller.enqueue(encoder.encode(formatSSE('error', errorMessage)));
                }
            };

            // Heartbeat fonksiyonu
            const sendHeartbeat = () => {
                try {
                    const heartbeat: StreamMessage = {
                        type: 'heartbeat',
                        timestamp: Date.now()
                    };
                    controller.enqueue(encoder.encode(formatSSE('heartbeat', heartbeat)));
                } catch (error) {
                    // Client disconnected
                    cleanup();
                }
            };

            // Timer'ları başlat
            intervalId = setInterval(sendQuotes, interval);
            heartbeatId = setInterval(sendHeartbeat, 15000); // 15 saniyede bir heartbeat

            // Cleanup fonksiyonu
            const cleanup = () => {
                if (intervalId) clearInterval(intervalId);
                if (heartbeatId) clearInterval(heartbeatId);
                try {
                    controller.close();
                } catch (e) {
                    // Zaten kapalı
                }
            };

            // Client disconnect olduğunda cleanup
            request.signal.addEventListener('abort', cleanup);

            // İlk veriyi hemen gönder
            sendQuotes();
        },

        cancel() {
            console.log('SSE stream iptal edildi');
        }
    });

    return new Response(stream, { headers });
}

// ============ OPTIONS (CORS) ============

export async function OPTIONS() {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }
    });
}
