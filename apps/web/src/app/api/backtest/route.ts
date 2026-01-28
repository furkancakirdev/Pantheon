/**
 * Backtest API
 * Strateji backtest analizi yapar
 *
 * NOT: @pantheon/backtest paketi henüz tamamlanmamıştır.
 * Bu endpoint mock veriler döndürmektedir.
 */

// Static optimization'ı devre dışı bırak
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

interface BacktestParams {
    symbol: string;
    strategy: string;
    startDate?: string;
    endDate?: string;
    initialCapital?: number;
}

interface BacktestResult {
    symbol: string;
    strategy: string;
    period: { start: string; end: string };
    initialCapital: number;
    finalCapital: number;
    totalReturn: number;
    totalReturnPercent: number;
    annualizedReturn: number;
    maxDrawdown: number;
    sharpeRatio: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    trades: Array<{
        date: string;
        type: 'BUY' | 'SELL';
        price: number;
        quantity: number;
        value: number;
        pnl?: number;
    }>;
}

/**
 * Hash tabanlı tutarlı rastgele sayı üretici
 */
function getSeededRandom(symbol: string, index: number): number {
    let hash = 0;
    const seed = symbol + index.toString();
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash) / 2147483647;
}

/**
 * Backtest analizi (mock)
 */
function getMockBacktestResult(params: BacktestParams): BacktestResult {
    const { symbol, strategy, initialCapital = 100000 } = params;

    const startDate = params.startDate || '2023-01-01';
    const endDate = params.endDate || new Date().toISOString().split('T')[0];

    const totalReturnPercent = -10 + getSeededRandom(symbol, 0) * 40;
    const finalCapital = initialCapital * (1 + totalReturnPercent / 100);

    const maxDrawdown = 5 + getSeededRandom(symbol, 1) * 25;
    const sharpeRatio = 0.5 + getSeededRandom(symbol, 2) * 2;
    const winRate = 40 + getSeededRandom(symbol, 3) * 30;

    const totalTrades = Math.floor(10 + getSeededRandom(symbol, 4) * 40);
    const winningTrades = Math.floor(totalTrades * winRate / 100);
    const losingTrades = totalTrades - winningTrades;

    const avgWin = 500 + getSeededRandom(symbol, 5) * 2000;
    const avgLoss = -300 - getSeededRandom(symbol, 6) * 1500;

    const profitFactor = Math.abs(avgWin * winningTrades / (avgLoss * losingTrades));

    // Mock trades
    const trades: Array<{
        date: string;
        type: 'BUY' | 'SELL';
        price: number;
        quantity: number;
        value: number;
        pnl?: number;
    }> = [];
    let currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    for (let i = 0; i < Math.min(totalTrades, 20); i++) {
        const isBuy = i % 2 === 0;
        const price = 50 + getSeededRandom(symbol, i + 100) * 200;
        const quantity = 100 + Math.floor(getSeededRandom(symbol, i + 200) * 500);

        trades.push({
            date: currentDate.toISOString().split('T')[0],
            type: isBuy ? 'BUY' : 'SELL',
            price,
            quantity,
            value: price * quantity,
            pnl: !isBuy ? (price * quantity * (getSeededRandom(symbol, i + 300) - 0.5) * 0.1) : undefined,
        });

        currentDate = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
        if (currentDate > endDateObj) break;
    }

    return {
        symbol,
        strategy,
        period: { start: startDate, end: endDate },
        initialCapital,
        finalCapital: Math.round(finalCapital),
        totalReturn: Math.round(finalCapital - initialCapital),
        totalReturnPercent: Math.round(totalReturnPercent * 100) / 100,
        annualizedReturn: Math.round(totalReturnPercent * 100) / 100,
        maxDrawdown: Math.round(maxDrawdown * 100) / 100,
        sharpeRatio: Math.round(sharpeRatio * 100) / 100,
        winRate: Math.round(winRate),
        totalTrades,
        winningTrades,
        losingTrades,
        avgWin: Math.round(avgWin),
        avgLoss: Math.round(avgLoss),
        profitFactor: Math.round(profitFactor * 100) / 100,
        trades,
    };
}

/**
 * POST /api/backtest
 * Backtest analizi yapar
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const params: BacktestParams = {
            symbol: body.symbol || 'ASELS',
            strategy: body.strategy || 'momentum',
            startDate: body.startDate,
            endDate: body.endDate,
            initialCapital: body.initialCapital || 100000,
        };

        if (!params.symbol) {
            return NextResponse.json({
                success: false,
                error: 'symbol parameter is required',
            }, { status: 400 });
        }

        const result = getMockBacktestResult(params);

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                timestamp: new Date().toISOString(),
                note: 'Mock data - @pantheon/backtest paketi henüz tamamlanmamıştır.',
            },
        });

    } catch (error) {
        console.error('Backtest Error:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        }, { status: 500 });
    }
}

/**
 * GET /api/backtest?symbol=ASELS&strategy=momentum
 * Backtest analizi yapar (GET için)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    const params: BacktestParams = {
        symbol: searchParams.get('symbol') || 'ASELS',
        strategy: searchParams.get('strategy') || 'momentum',
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        initialCapital: parseFloat(searchParams.get('initialCapital') || '100000'),
    };

    try {
        const result = getMockBacktestResult(params);

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                timestamp: new Date().toISOString(),
                note: 'Mock data - @pantheon/backtest paketi henüz tamamlanmamıştır.',
            },
        });

    } catch (error) {
        console.error('Backtest Error:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        }, { status: 500 });
    }
}
