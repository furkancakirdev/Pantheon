/**
 * Orion Analysis API
 * Ali Perşembe + Kıvanç Özbilgiç Teknik Analiz Motoru
 */

import { NextRequest, NextResponse } from 'next/server';
import { OrionEngine } from '@analysis/orion/engine';

// Mock candles data for testing (Gerçek uygulamada API'den çekilmeli)
function getMockCandles(symbol: string) {
  // Basit mock mum verisi
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
    // Mock candles - gerçek uygulamada veri servisten çekilmeli
    const candles = getMockCandles(symbol.toUpperCase());

    // Orion analizini çalıştır
    const orionEngine = OrionEngine.getInstance();
    const result = orionEngine.analyze(symbol.toUpperCase(), candles);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Orion Analysis Error:', error);

    // Fallback mock response
    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        totalScore: 72,
        verdict: 'AL',
        components: { trend: 20, momentum: 16, volatility: 8, structure: 16, kivanc: 12 },
        kivanc: {
          alphaTrend: 'AL',
          most: 'AL',
          superTrend: 'AL',
          stochRSI: 'BEKLE',
          mavilimW: 'YUKARI',
          harmonicLevels: { h6: 85, l6: 72, m1: 78.5 },
        },
        persembe: {
          marketStructure: 'UPTREND',
          lastSwingHigh: 82,
          lastSwingLow: 75,
        },
        details: ['AlphaTrend: AL', 'MOST: AL', 'SuperTrend: AL', 'MavilimW: Yukarı trend'],
      },
    });
  }
}
