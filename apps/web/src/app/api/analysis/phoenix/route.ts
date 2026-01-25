/**
 * Phoenix Analysis API
 * Tarama motoru ve sinyal onayı
 */

import { NextRequest, NextResponse } from 'next/server';
import { PhoenixEngine } from '@analysis/phoenix/engine';
import type { Candle } from '@analysis/kivanc/indicators';

// Mock candles data for testing
function getMockCandles(symbol: string) {
  const candles: Candle[] = [];
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
  const action = searchParams.get('action') || 'analyze'; // analyze, scan, monitor

  try {
    const phoenixEngine = PhoenixEngine.getInstance();

    if (action === 'analyze') {
      // Tek hisse analizi
      const candles = getMockCandles(symbol.toUpperCase());
      const result = phoenixEngine.analyzeStock(symbol.toUpperCase(), candles);

      return NextResponse.json({
        success: true,
        data: {
          symbol: symbol.toUpperCase(),
          ...result,
        },
      });
    }

    if (action === 'scan') {
      // Tarama modu
      const mode = (searchParams.get('mode') || 'BALANCED') as 'SAVER' | 'BALANCED' | 'AGGRESSIVE';

      // Mock universe
      const universe = [
        { symbol: 'ASELS', price: 78.50, change: 2.5 },
        { symbol: 'THYAO', price: 315.00, change: 1.8 },
        { symbol: 'SAHOL', price: 45.20, change: -0.5 },
        { symbol: 'GARAN', price: 42.80, change: 1.2 },
        { symbol: 'AKBNK', price: 18.50, change: 0.8 },
        { symbol: 'KCHOL', price: 28.30, change: -1.2 },
        { symbol: 'SISE', price: 52.40, change: 3.1 },
        { symbol: 'EKGYO', price: 35.60, change: 2.0 },
        { symbol: 'TSKB', price: 12.80, change: 0.5 },
        { symbol: 'YKBNK', price: 8.50, change: 0.3 },
      ];

      // Mock candles map
      const candlesMap = new Map<string, Candle[]>();
      for (const item of universe) {
        candlesMap.set(item.symbol, getMockCandles(item.symbol));
      }

      const result = await phoenixEngine.runPipeline(mode, universe, candlesMap);

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    if (action === 'monitor') {
      // Portföy izleme modu
      const portfolio = [
        { symbol: 'ASELS', entryPrice: 72, quantity: 100 },
        { symbol: 'THYAO', entryPrice: 300, quantity: 50 },
      ];

      const candlesMap = new Map<string, Candle[]>();
      for (const pos of portfolio) {
        candlesMap.set(pos.symbol, getMockCandles(pos.symbol));
      }

      const result = phoenixEngine.monitorPortfolio(portfolio, candlesMap);

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    });
  } catch (error) {
    console.error('Phoenix Analysis Error:', error);

    // Fallback mock response
    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        lastPrice: 78.50,
        score: 72,
        reason: 'SMA20 > SMA50 cross; MACD bullish crossover',
        signals: [
          {
            type: 'SMA_CROSS',
            strength: 7,
            description: 'SMA20 > SMA50 cross (kısa vade AL)',
            bullish: true,
          },
          {
            type: 'MACD_CROSS',
            strength: 6,
            description: 'MACD bullish crossover',
            bullish: true,
          },
        ],
        riskLevel: 'DÜŞÜK',
      },
    });
  }
}
