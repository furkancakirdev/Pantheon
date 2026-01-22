/**
 * Analysis API - Hisse analizi ve Grand Council kararı
 * 
 * GET /api/analysis?symbol=ASELS - Belirli bir hisse için tam analiz
 */

import { NextRequest, NextResponse } from 'next/server';

interface AnalysisResult {
    hisse: string;
    erdincSkor: number;
    wonderkidSkor: number;
    teknikSinyal: string;
    councilKarar: {
        sonKarar: string;
        konsensus: number;
        oylar: Array<{ modul: string; oy: string; guven: number; aciklama: string }>;
    };
    gerekceler: string[];
    tarih: string;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const symbol = searchParams.get('symbol') || 'ASELS';

        // Gerçek analiz için API'lerden veri çekilecek
        // Şimdilik mock analiz sonucu döndür
        const analysis = getAnalysis(symbol.toUpperCase());

        return NextResponse.json({
            success: true,
            data: analysis,
        });

    } catch (error) {
        console.error('Analysis API error:', error);

        return NextResponse.json({
            success: false,
            error: 'Analiz yapılamadı',
        }, { status: 500 });
    }
}

function getAnalysis(symbol: string): AnalysisResult {
    // Mock analiz verileri
    const mockAnalyses: Record<string, AnalysisResult> = {
        'ASELS': {
            hisse: 'ASELS',
            erdincSkor: 85,
            wonderkidSkor: 92,
            teknikSinyal: 'AL',
            councilKarar: {
                sonKarar: 'AL',
                konsensus: 82,
                oylar: [
                    { modul: 'Atlas (Temel - Erdinç)', oy: 'AL', guven: 85, aciklama: 'F/K düşük, ROE yüksek' },
                    { modul: 'Demeter (Sektör - Wonderkid)', oy: 'AL', guven: 92, aciklama: 'Savunma + Teknoloji trendi' },
                    { modul: 'Orion (Teknik - Kıvanç)', oy: 'AL', guven: 75, aciklama: 'AlphaTrend: AL sinyali' },
                    { modul: 'Athena (Faktör - Perşembe)', oy: 'BEKLE', guven: 60, aciklama: 'Direnç yakın' },
                    { modul: 'Hermes (Sentiment)', oy: 'AL', guven: 78, aciklama: '%72 pozitif' },
                ],
            },
            gerekceler: [
                '✅ Erdinç skoru 85/100 - güçlü temel göstergeler',
                '✅ Wonderkid skoru 92/100 - savunma sektörü megatrendi',
                '✅ 4/5 modül AL oyu verdi',
                '⚠️ Direnç seviyesi yakın - kısa vadede volatilite olabilir',
            ],
            tarih: new Date().toISOString(),
        },
        'THYAO': {
            hisse: 'THYAO',
            erdincSkor: 78,
            wonderkidSkor: 88,
            teknikSinyal: 'AL',
            councilKarar: {
                sonKarar: 'AL',
                konsensus: 75,
                oylar: [
                    { modul: 'Atlas (Temel - Erdinç)', oy: 'AL', guven: 78, aciklama: 'F/K çok düşük' },
                    { modul: 'Demeter (Sektör - Wonderkid)', oy: 'AL', guven: 88, aciklama: 'Havacılık toparlanması' },
                    { modul: 'Orion (Teknik - Kıvanç)', oy: 'AL', guven: 70, aciklama: 'MOST: AL' },
                    { modul: 'Athena (Faktör - Perşembe)', oy: 'AL', guven: 65, aciklama: 'Trend güçlü' },
                    { modul: 'Hermes (Sentiment)', oy: 'BEKLE', guven: 55, aciklama: 'Karışık sentiment' },
                ],
            },
            gerekceler: [
                '✅ Düşük F/K oranı - değer potansiyeli',
                '✅ Global havacılık sektörü toparlanıyor',
                '⚠️ Yüksek borç/özkaynak oranı',
            ],
            tarih: new Date().toISOString(),
        },
    };

    return mockAnalyses[symbol] || {
        hisse: symbol,
        erdincSkor: 50,
        wonderkidSkor: 50,
        teknikSinyal: 'BEKLE',
        councilKarar: {
            sonKarar: 'BEKLE',
            konsensus: 50,
            oylar: [
                { modul: 'Atlas', oy: 'BEKLE', guven: 50, aciklama: 'Yetersiz veri' },
            ],
        },
        gerekceler: ['Analiz için yeterli veri yok'],
        tarih: new Date().toISOString(),
    };
}
