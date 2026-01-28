/**
 * Council Analysis API
 * Grand Council karar motorunu kullanan endpoint
 */

// Static optimization'ı devre dışı bırak
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { grandCouncil, type ModulOyu, type OyTipi } from '@analysis/council';
import type { CouncilKarar } from '@analysis/council';

/**
 * GET /api/analysis/council?symbol=ASELS
 * Council analizi yapar
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'ASELS';

    try {
        const symbolUpper = symbol.toUpperCase();

        // Mock oylar oluştur (gerçek uygulamada diğer modüllerden gelir)
        const mockVotes: ModulOyu[] = [
            { modul: 'Atlas', oy: 'AL' as const, guven: 75, aciklama: 'Temel göstergeler güçlü', icon: '📊' },
            { modul: 'Orion', oy: 'AL' as const, guven: 80, aciklama: 'Teknik sinyal pozitif', icon: '📈' },
            { modul: 'Wonderkid', oy: 'BEKLE' as const, guven: 60, aciklama: 'Sektörel momentum zayıf', icon: '⭐' },
            { modul: 'Athena', oy: 'AL' as const, guven: 70, aciklama: 'Faktör analizi olumlu', icon: '🦉' },
            { modul: 'Hermes', oy: 'BEKLE' as const, guven: 50, aciklama: 'Sentiment nötr', icon: '🐦' },
            { modul: 'Aether', oy: 'AL' as const, guven: 65, aciklama: 'Makro koşullar destekleyici', icon: '🌍' },
            { modul: 'Phoenix', oy: 'AL' as const, guven: 85, aciklama: 'Strateji uyumu yüksek', icon: '🔥' },
            { modul: 'Cronos', oy: 'BEKLE' as const, guven: 55, aciklama: 'Zamanlama ideal değil', icon: '⏰' },
        ];

        const councilKarar: CouncilKarar = grandCouncil(symbolUpper, 'HISSE', mockVotes);

        return NextResponse.json({
            success: true,
            data: {
                symbol: symbolUpper,
                timestamp: new Date().toISOString(),
                votes: mockVotes,
                councilDecision: councilKarar,
            },
        });

    } catch (error) {
        console.error('Council Analysis Error:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        }, { status: 500 });
    }
}

/**
 * POST /api/analysis/council
 * Batch council analizi yapar
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
        console.error('Batch Council Analysis Error:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        }, { status: 500 });
    }
}
