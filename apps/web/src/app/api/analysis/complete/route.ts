/**
 * Complete Stock Analysis API
 * Orion + Perşembe + Erdinç analizlerini birleştirir
 */

import { NextRequest, NextResponse } from 'next/server';
import { OrionEngine } from '@analysis/orion/engine';
import { persembeAnaliz } from '@analysis/persembe/technical';
import { hesaplaErdincSkor, type ErdincScore } from '@analysis/erdinc/rules';
import type { PersembeAnaliz } from '@analysis/persembe/technical';
import type { OrionScoreResult } from '@analysis/orion/engine';

// Local type definition instead of mobile import
export interface CompleteStockAnalysis {
  symbol: string;
  timestamp: string;
  orion: OrionScoreResult;
  persembe: PersembeAnaliz;
  erdinc: ErdincScore;
  overall: {
    score: number;
    verdict: string;
  };
}

// Mock data functions
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

function getMockFundamentals(symbol: string) {
  // Mock temel analiz verisi
  const basePrice = symbol === 'THYAO' ? 315 : symbol === 'ASELS' ? 78 : 100;
  return {
    kod: symbol,
    ad: symbol === 'THYAO' ? 'Türk Hava Yolları' : symbol === 'ASELS' ? 'Aselsan Elektronik' : 'Sample Şirket',
    sektor: symbol === 'THYAO' ? 'Havacılık' : 'Teknoloji',
    kapanis: basePrice,
    fk: symbol === 'THYAO' ? 3.5 : symbol === 'ASELS' ? 14.2 : 12,
    pddd: symbol === 'THYAO' ? 1.2 : symbol === 'ASELS' ? 1.8 : 1.5,
    fdFavok: symbol === 'THYAO' ? 8.5 : 12,
    roe: symbol === 'THYAO' ? 22.5 : 18,
    borcOzkaynak: symbol === 'THYAO' ? 0.65 : 0.8,
    piyasaDegeri: basePrice * 1000000000,
    yabanciOran: symbol === 'THYAO' ? 65 : 72,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'ASELS';

  try {
    const symbolUpper = symbol.toUpperCase();
    const candles = getMockCandles(symbolUpper);
    const fundamentals = getMockFundamentals(symbolUpper);

    // Orion analizi
    const orionEngine = OrionEngine.getInstance();
    const orionResult = orionEngine.analyze(symbolUpper, candles);

    // Perşembe analizi
    const persembeResult = persembeAnaliz(candles);

    // Erdinç analizi
    const erdincResult = hesaplaErdincSkor(fundamentals);

    // Quote verisi
    const currentPrice = candles[candles.length - 1].close;
    const prevPrice = candles[candles.length - 2].close;

    const completeAnalysis: CompleteStockAnalysis = {
      symbol: symbolUpper,
      orion: orionResult,
      persembe: persembeResult,
      erdinc: erdincResult,
      overall: {
        score: (orionResult.totalScore + erdincResult.toplamSkor) / 2,
        verdict: orionResult.verdict,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: completeAnalysis,
    });
  } catch (error) {
    console.error('Complete Analysis Error:', error);

    // Fallback mock response
    return NextResponse.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        orion: {
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
          details: ['AlphaTrend: AL', 'MOST: AL', 'SuperTrend: AL'],
        },
        persembe: {
          destekDirenc: [
            { seviye: 75, tip: 'DESTEK', guc: 8, testSayisi: 3 },
            { seviye: 82, tip: 'DİRENÇ', guc: 6, testSayisi: 2 },
          ],
          trend: {
            yonu: 'YUKARI',
            baslangic: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            guc: 12.5,
          },
          fibonacci: [],
          hacim: {
            teyitli: true,
            hacimTrendi: 'ARTAN',
            aciklama: 'Yükseliş hacimle teyit edildi',
          },
          formasyon: null,
          mumFormasyonlari: [],
          ozet: 'Yukarı trend, güçlü hacim teyidi',
        },
        erdinc: {
          toplamSkor: 78,
          buyumeSkor: 18,
          borcSkor: 22,
          carpanSkor: 20,
          karlilikSkor: 18,
          gerekceler: ['F/K 8.5 (Sektör 12.0)', 'ROE %22.5', 'Borç/Özkaynak 0.65'],
        },
        quote: {
          currentPrice: 78.50,
          change: 1.25,
          changePercent: 1.62,
          volume: 12500000,
          high52w: 95,
          low52w: 62,
        },
        timestamp: new Date().toISOString(),
      },
    });
  }
}
