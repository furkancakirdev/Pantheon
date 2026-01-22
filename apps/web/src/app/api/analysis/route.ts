/**
 * Analysis API - Hisse analizi ve Grand Council kararı
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'ASELS';

    return NextResponse.json({
        success: true,
        data: getUpdatedAnalysis(symbol.toUpperCase()),
    });
}

function getUpdatedAnalysis(symbol: string) {
    // Varsayılan analiz şablonu
    const base = {
        hisse: symbol,
        tarih: new Date().toISOString(),
    };

    if (symbol === 'ASELS') {
        return {
            ...base,
            erdincSkor: 88,
            wonderkidSkor: 94,
            teknikSinyal: 'AL',
            councilKarar: {
                sonKarar: 'AL',
                konsensus: 90,
                oylar: [
                    { modul: 'Atlas V2', oy: 'AL', guven: 85, aciklama: 'F/K 14.2 (Sektör 18.0). Net Kar büyümesi güçlü.' },
                    { modul: 'Orion V3', oy: 'AL', guven: 88, aciklama: 'Tüm SMA\'ların üzerinde. Hacim artışta.' },
                    { modul: 'Demeter', oy: 'AL', guven: 95, aciklama: 'Savunma sanayi sipariş defteri rekor seviyede.' },
                    { modul: 'Aether', oy: 'AL', guven: 80, aciklama: 'Risk iştahı yüksek, büyüme hisseleri favori.' },
                    { modul: 'Phoenix', oy: 'AL', guven: 92, aciklama: 'Golden Cross onayı alındı.' },
                    { modul: 'Chiron', oy: 'BEKLE', guven: 60, aciklama: 'Portföyde %5 ağırlık var, ekleme için limit uygun.' },
                    { modul: 'Hermes', oy: 'AL', guven: 85, aciklama: 'Sosyal medyada #ASELS etiketi %85 pozitif.' },
                ]
            }
        };
    }

    if (symbol === 'THYAO') {
        return {
            ...base,
            erdincSkor: 92,
            wonderkidSkor: 85,
            teknikSinyal: 'AL',
            councilKarar: {
                sonKarar: 'AL',
                konsensus: 85,
                oylar: [
                    { modul: 'Atlas V2', oy: 'AL', guven: 95, aciklama: 'F/K 3.5 inanılmaz ucuz.' },
                    { modul: 'Orion V3', oy: 'BEKLE', guven: 60, aciklama: 'Direnç seviyesinde (315 TL).' },
                    { modul: 'Demeter', oy: 'AL', guven: 85, aciklama: 'Turizm sezonu beklentisi.' },
                    // Diğer oylar...
                ]
            }
        };
    }

    // Varsayılan
    return {
        ...base,
        erdincSkor: 50,
        teknikSinyal: 'BEKLE',
        councilKarar: { sonKarar: 'BEKLE', konsensus: 50, oylar: [] }
    };
}
