/**
 * Prometheus Analysis API
 * Second-Order Thinking analizi yapar
 *
 * NOT: @analysis/prometheus paketi henüz tamamlanmamıştır.
 * Bu endpoint mock veriler döndürmektedir.
 */

// Static optimization'ı devre dışı bırak
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';

interface PrometheusAnalysis {
    symbol: string;
    score: number;
    directPlays: Array<{ symbol: string; type: string; exposure: number }>;
    indirectPlays: Array<{ beneficiary: string; type: string; exposure: number }>;
    macroTrend?: {
        trigger: string;
        affectedCommodities: string[];
    };
    reasoning: string;
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
 * Prometheus analizi (mock)
 */
function getMockPrometheusAnalysis(symbol: string): PrometheusAnalysis {
    const score = 40 + getSeededRandom(symbol, 0) * 40;
    const hasStreaming = getSeededRandom(symbol, 1) > 0.6;
    const hasMacroTrend = getSeededRandom(symbol, 2) > 0.5;

    const directPlays: Array<{ symbol: string; type: string; exposure: number }> = [];
    const indirectPlays: Array<{ beneficiary: string; type: string; exposure: number }> = [];

    if (hasStreaming) {
        indirectPlays.push(
            { beneficiary: 'WPM', type: 'STREAMING', exposure: 0.8 },
            { beneficiary: 'FNV', type: 'ROYALTY', exposure: 0.6 }
        );
    }

    const macroTrend = hasMacroTrend ? {
        trigger: 'EV Revolution',
        affectedCommodities: ['Lithium', 'Copper', 'Nickel']
    } : undefined;

    return {
        symbol,
        score: Math.round(score),
        directPlays,
        indirectPlays,
        macroTrend,
        reasoning: hasStreaming
            ? 'Streaming/royalty modelleri ile risk asimetrisi tespit edildi.'
            : hasMacroTrend
            ? 'Makro trend ile dolaylı ilişki tespit edildi.'
            : 'Second-Order ilişki tespit edilemedi.',
    };
}

/**
 * GET /api/analysis/prometheus?symbol=ASELS
 * Prometheus analizi yapar
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'ASELS';

    try {
        const symbolUpper = symbol.toUpperCase();
        const analysis = getMockPrometheusAnalysis(symbolUpper);

        return NextResponse.json({
            success: true,
            data: {
                ...analysis,
                timestamp: new Date().toISOString(),
                note: 'Mock data - @analysis/prometheus paketi henüz tamamlanmamıştır.',
            },
        });

    } catch (error) {
        console.error('Prometheus Analysis Error:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        }, { status: 500 });
    }
}

/**
 * POST /api/analysis/prometheus
 * Batch Prometheus analizi yapar
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { symbols } = body;

        if (!Array.isArray(symbols) || symbols.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'symbols array required',
            }, { status: 400 });
        }

        const results = [];

        for (const symbol of symbols.slice(0, 20)) { // Max 20 symbols
            const mockRequest = new Request(
                `${request.url.split('?')[0]}?symbol=${symbol}`
            );
            const response = await GET(mockRequest as NextRequest);
            const data = await response.json();
            results.push(data.data);
        }

        return NextResponse.json({
            success: true,
            count: results.length,
            data: results,
        });

    } catch (error) {
        console.error('Batch Prometheus Analysis Error:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        }, { status: 500 });
    }
}
