/**
 * Market API - Production Ready (No Mock)
 *
 * GET /api/market - Anlık endeks, döviz, emtia verileri
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

interface MarketData {
  xu100: { deger: number; degisim: number; degisimOran: number };
  xu030: { deger: number; degisim: number; degisimOran: number };
  dolar: { alis: number; satis: number; degisim: number };
  euro: { alis: number; satis: number; degisim: number };
  altin: { alis: number; satis: number; degisim: number };
  bitcoin: { deger: number; degisim: number };
  tarih: string;
}

const MYNET_API = 'https://finans.mynet.com/api/real-time';

async function fetchMarketData(): Promise<MarketData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(MYNET_API, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      cache: 'no-store',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.xu100 || !data.dolar) {
      throw new Error('Geçersiz piyasa verisi formatı');
    }

    return {
      xu100: data.xu100 || { deger: 0, degisim: 0, degisimOran: 0 },
      xu030: data.xu030 || { deger: 0, degisim: 0, degisimOran: 0 },
      dolar: data.dolar || { alis: 0, satis: 0, degisim: 0 },
      euro: data.euro || { alis: 0, satis: 0, degisim: 0 },
      altin: data.altin || { alis: 0, satis: 0, degisim: 0 },
      bitcoin: data.bitcoin || { deger: 0, degisim: 0 },
      tarih: new Date().toISOString(),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function GET() {
  try {
    const data = await fetchMarketData();

    return NextResponse.json({
      success: true,
      source: 'mynet_api',
      data: data,
    });
  } catch (error) {
    console.error('Market API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Piyasa verisi alınamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 503 } // Service Unavailable
    );
  }
}
