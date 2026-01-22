/**
 * Market API - Mynet'ten canlı piyasa verileri
 * 
 * GET /api/market - Anlık endeks, döviz, emtia verileri
 */

import { NextResponse } from 'next/server';

interface MarketData {
    xu100: { deger: number; degisim: number; degisimOran: number };
    xu030: { deger: number; degisim: number; degisimOran: number };
    dolar: { alis: number; satis: number; degisim: number };
    euro: { alis: number; satis: number; degisim: number };
    altin: { alis: number; satis: number; degisim: number };
    tarih: string;
}

// Mynet API endpoint
const MYNET_API = 'https://finans.mynet.com/api/real-time';

export async function GET() {
    try {
        const response = await fetch(MYNET_API, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            return NextResponse.json({
                success: true,
                source: 'mock',
                data: getMockMarket(),
                message: 'Mynet API erişilemedi, mock data kullanılıyor',
            });
        }

        const data = await response.json();

        return NextResponse.json({
            success: true,
            source: 'mynet',
            data: {
                ...data,
                tarih: new Date().toISOString(),
            },
        });

    } catch (error) {
        console.error('Market API error:', error);

        return NextResponse.json({
            success: true,
            source: 'mock',
            data: getMockMarket(),
            message: 'API hatası, mock data kullanılıyor',
        });
    }
}

function getMockMarket(): MarketData {
    return {
        xu100: { deger: 9850.45, degisim: 120.32, degisimOran: 1.24 },
        xu030: { deger: 10245.80, degisim: 89.15, degisimOran: 0.89 },
        dolar: { alis: 35.38, satis: 35.42, degisim: 0.15 },
        euro: { alis: 38.10, satis: 38.18, degisim: 0.22 },
        altin: { alis: 2845, satis: 2855, degisim: 12 },
        tarih: new Date().toISOString(),
    };
}
