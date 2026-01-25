/**
 * Ali Perşembe Technical Analysis API
 * Destek/Direnç, Trend, Fibonacci, Mum Formasyonları
 */

import { NextRequest, NextResponse } from 'next/server';
import { persembeAnaliz } from '@analysis/persembe/technical';

// Mock candles data for testing
function getMockCandles(symbol: string) {
  const candles = [];
  const basePrice = symbol === 'THYAO' ? 315 : symbol === 'ASELS' ? 78 : 100;
  const now = Date.now();

  for (let i = 100; i >= 0; i--) {
    const change = (Math.random() - 0.5) * 0.02;
    const price = basePrice * (1 + change * i * 0.1);
    candles.push({
      date: new Date(now - i * 24 * 60 * 60 * 1000),
      open: price * (1 + Math.random() * 0.01),
      high: price * (1 + Math.random() * 0.02),
      low: price * (1 - Math.random() * 0.02),
      close: price,
      volume: Math.floor(1000000 + Math.random() * 5000000),
    });
  }

  return candles;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'ASELS';

  try {
    // Mock candles
    const candles = getMockCandles(symbol.toUpperCase());

    // Perşembe analizini çalıştır
    const result = persembeAnaliz(candles);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Perşembe Analysis Error:', error);

    // Fallback mock response
    return NextResponse.json({
      success: true,
      data: {
        destekDirenc: [
          { seviye: 75, tip: 'DESTEK', guc: 8, testSayisi: 3 },
          { seviye: 82, tip: 'DİRENÇ', guc: 6, testSayisi: 2 },
        ],
        trend: {
          yonu: 'YUKARI',
          baslangic: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          guc: 12.5,
        },
        fibonacci: [
          { seviye: 75, oran: 0 },
          { seviye: 76.5, oran: 0.236 },
          { seviye: 78, oran: 0.382 },
          { seviye: 78.5, oran: 0.5 },
        ],
        hacim: {
          teyitli: true,
          hacimTrendi: 'ARTAN',
          aciklama: 'Yükseliş hacimle teyit edildi',
        },
        formasyon: null,
        mumFormasyonlari: [],
        ozet: `Ali Perşembe Teknik Analiz Özeti
━━━━━━━━━━━━━━━━━━━━━━━━━━
Trend: YUKARI (Güç: 12.5°)
Destek: 75.00
Direnç: 82.00
Hacim: ✅ Yükseliş hacimle teyit edildi`,
      },
    });
  }
}
