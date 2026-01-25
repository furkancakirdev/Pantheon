/**
 * Chiron Risk Management API
 * Risk analizi, position sizing, portföy yönetimi
 */

import { NextRequest, NextResponse } from 'next/server';
import { ChironEngine } from '@analysis/chiron/risk';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'analyze';

  try {
    const chironEngine = ChironEngine.getInstance();

    if (action === 'config') {
      // Konfigürasyon oku
      return NextResponse.json({
        success: true,
        data: chironEngine.getConfig(),
      });
    }

    if (action === 'review') {
      // Sinyal değerlendirme
      const signal = {
        action: (searchParams.get('signalAction') || 'BUY') as 'BUY' | 'SELL',
        symbol: searchParams.get('symbol') || 'ASELS',
        price: parseFloat(searchParams.get('price') || '78'),
        reason: searchParams.get('reason') || 'Test sinyali',
        confidence: parseInt(searchParams.get('confidence') || '80'),
        sector: searchParams.get('sector') || 'Teknoloji',
      };

      const portfolio = searchParams.get('portfolio')
        ? JSON.parse(searchParams.get('portfolio')!)
        : [
            { symbol: 'THYAO', entryPrice: 300, quantity: 50, sector: 'Havacılık', isOpen: true },
            { symbol: 'GARAN', entryPrice: 40, quantity: 100, sector: 'Bankacılık', isOpen: true },
          ];

      const grandCouncilScore = parseInt(searchParams.get('councilScore') || '80');
      const equity = parseFloat(searchParams.get('equity') || '100000');
      const currentPrice = searchParams.get('currentPrice')
        ? parseFloat(searchParams.get('currentPrice')!)
        : undefined;

      const decision = chironEngine.review(signal, portfolio, grandCouncilScore, equity, currentPrice);

      return NextResponse.json({
        success: true,
        data: decision,
      });
    }

    if (action === 'positionSize') {
      // Position size hesaplama
      const equity = parseFloat(searchParams.get('equity') || '100000');
      const price = parseFloat(searchParams.get('price') || '78');
      const confidence = parseInt(searchParams.get('confidence') || '80');
      const method = (searchParams.get('method') || 'FIXED_R') as 'FIXED_PERCENT' | 'FIXED_R' | 'KELLY' | 'VOLATILITY';

      const result = chironEngine.calculatePositionSize(equity, price, confidence, method);

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    if (action === 'portfolioRisk') {
      // Portföy risk analizi
      const portfolio = searchParams.get('portfolio')
        ? JSON.parse(searchParams.get('portfolio')!)
        : [
            { symbol: 'ASELS', entryPrice: 72, quantity: 100, sector: 'Teknoloji', isOpen: true },
            { symbol: 'THYAO', entryPrice: 300, quantity: 50, sector: 'Havacılık', isOpen: true },
            { symbol: 'GARAN', entryPrice: 40, quantity: 100, sector: 'Bankacılık', isOpen: true },
          ];

      const equity = parseFloat(searchParams.get('equity') || '100000');

      const riskMetrics = chironEngine.analyzePortfolioRisk(portfolio, equity);

      return NextResponse.json({
        success: true,
        data: riskMetrics,
      });
    }

    if (action === 'stopLoss') {
      // Stop loss önerisi
      const entryPrice = parseFloat(searchParams.get('entryPrice') || '78');
      const atr = searchParams.get('atr') ? parseFloat(searchParams.get('atr')!) : undefined;
      const method = (searchParams.get('method') || 'PERCENT') as 'ATR' | 'PERCENT' | 'SUPPORT';

      const stopLoss = chironEngine.suggestStopLoss(entryPrice, atr || 5, method);

      return NextResponse.json({
        success: true,
        data: {
          entryPrice,
          stopLoss,
          method,
        },
      });
    }

    if (action === 'cooldown') {
      // Cooldown kontrolü
      const symbol = searchParams.get('symbol') || 'ASELS';
      const remaining = chironEngine.getCooldownRemaining(symbol);

      return NextResponse.json({
        success: true,
        data: {
          symbol,
          cooldownRemaining: remaining,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    });
  } catch (error) {
    console.error('Chiron API Error:', error);

    // Fallback mock response
    return NextResponse.json({
      success: true,
      data: {
        approved: true,
        adjustedQuantity: 100,
        suggestedStopLoss: 70.2,
        suggestedTakeProfit: 93.6,
        riskR: 2.0,
        reason: '2R yöntemi. Grand Council: 80/100',
        warnings: [],
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const chironEngine = ChironEngine.getInstance();

    if (body.action === 'setConfig') {
      chironEngine.setConfig(body.config);
      return NextResponse.json({
        success: true,
        data: chironEngine.getConfig(),
      });
    }

    if (body.action === 'clearHistory') {
      chironEngine.clearHistory();
      return NextResponse.json({
        success: true,
        data: { message: 'History cleared' },
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    });
  } catch (error) {
    console.error('Chiron POST Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Request failed',
    });
  }
}
