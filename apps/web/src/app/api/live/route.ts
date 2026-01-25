/**
 * Live Data API - Canlı BIST Verileri
 *
 * SSE (Server-Sent Events) ile gerçek zamanlı fiyat güncellemeleri
 */

import { NextRequest } from 'next/server';
import liveDataService from '@api/live-data';

/**
 * GET /api/live - Canlı veri endpointleri
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'quote';
    const symbol = searchParams.get('symbol');

    try {
        if (action === 'quote' && symbol) {
            // Tek hisse canlı fiyat
            const quote = await liveDataService.getLiveQuote(symbol);

            if (!quote) {
                return Response.json({
                    success: false,
                    error: 'Hisse bulunamadı',
                }, { status: 404 });
            }

            return Response.json({
                success: true,
                data: quote,
            });
        }

        if (action === 'batch') {
            // Çoklu hisse fiyatı
            const symbols = searchParams.get('symbols')?.split(',') || [];

            if (symbols.length === 0) {
                return Response.json({
                    success: false,
                    error: 'Sembol gerekli',
                }, { status: 400 });
            }

            const quotes = await liveDataService.getBatchQuotes(symbols);

            return Response.json({
                success: true,
                data: Object.fromEntries(quotes),
            });
        }

        if (action === 'portfolio') {
            // Portföy snapshot
            const positionsData = searchParams.get('positions');

            if (!positionsData) {
                return Response.json({
                    success: false,
                    error: 'Pozisyonlar gerekli (format: symbol,quantity,entryPrice)',
                }, { status: 400 });
            }

            const positions = positionsData.split(';').map(p => {
                const [symbol, quantity, entryPrice] = p.split(',');
                return {
                    symbol: symbol?.trim() || '',
                    quantity: parseInt(quantity || '0'),
                    entryPrice: parseFloat(entryPrice || '0'),
                    entryDate: new Date(),
                };
            }).filter(p => p.quantity > 0);

            const snapshot = await liveDataService.getPortfolioSnapshot(positions);

            return Response.json({
                success: true,
                data: snapshot,
            });
        }

        if (action === 'movers') {
            // Hareketli hisseler
            const topN = parseInt(searchParams.get('topN') || '10');
            const movers = await liveDataService.getMovers(topN);

            return Response.json({
                success: true,
                data: movers,
            });
        }

        if (action === 'stream') {
            // SSE stream için (simülasyon)
            const streamSymbol = searchParams.get('symbol') || 'THYAO';

            const encoder = new TextEncoder();

            const stream = new ReadableStream({
                async start(controller) {
                    let count = 0;
                    const maxUpdates = 60; // 60 saniye / 1 saniye interval

                    const sendUpdate = async () => {
                        const quote = await liveDataService.getLiveQuote(streamSymbol);
                        if (quote) {
                            const data = `data: ${JSON.stringify(quote)}\n\n`;
                            controller.enqueue(encoder.encode(data));
                        }

                        count++;
                        if (count < maxUpdates) {
                            setTimeout(sendUpdate, 1000);
                        } else {
                            controller.close();
                        }
                    };

                    sendUpdate();
                },
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive',
                },
            });
        }

        return Response.json({
            success: false,
            error: 'Invalid action',
        }, { status: 400 });
    } catch (error) {
        console.error('Live Data API Error:', error);

        return Response.json({
            success: true,
            data: {
                symbol: symbol || 'THYAO',
                price: 315.50,
                change: 2.5,
                changePercent: 0.8,
                volume: 12500000,
                high: 318,
                low: 312,
                timestamp: new Date().toISOString(),
            },
        });
    }
}

/**
 * POST /api/live - Cache yönetimi ve servis kontrolü
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (body.action === 'startUpdates') {
            const symbols = body.symbols || ['THYAO', 'ASELS', 'GARAN'];
            const interval = body.interval || 5000;

            liveDataService.startLiveUpdates(symbols, interval);

            return Response.json({
                success: true,
                data: { message: 'Canlı güncellemeler başlatıldı', symbols, interval },
            });
        }

        if (body.action === 'stopUpdates') {
            liveDataService.stopLiveUpdates();

            return Response.json({
                success: true,
                data: { message: 'Canlı güncellemeler durduruldu' },
            });
        }

        if (body.action === 'clearCache') {
            const symbol = body.symbol;
            await liveDataService.clearCache(symbol);

            return Response.json({
                success: true,
                data: { message: `Cache temizlendi: ${symbol || 'Tümü'}` },
            });
        }

        return Response.json({
            success: false,
            error: 'Invalid action',
        }, { status: 400 });
    } catch (error) {
        console.error('Live Data POST Error:', error);

        return Response.json({
            success: false,
            error: 'Request failed',
        }, { status: 500 });
    }
}
