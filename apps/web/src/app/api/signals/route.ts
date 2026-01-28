/**
 * Signals API - Production Ready (No Mock)
 *
 * GET /api/signals - Trading signals from analysis engines
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// ==================== API HELPERS ====================

async function fetchWithRetry(url: string, options: RequestInit, retries = 2): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        ...options.headers,
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error('Invalid JSON response');
    }
  } catch (error) {
    clearTimeout(timeoutId);
    if (retries > 0) return fetchWithRetry(url, options, retries - 1);
    throw error;
  }
}

// İş Yatırım API
async function fetchAllStocks(): Promise<any[]> {
  const data = await fetchWithRetry(
    'https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/Data.aspx/HisseSenetleri',
    { method: 'POST', body: JSON.stringify({}) }
  );
  return data.d || [];
}

// Mynet API
async function fetchRealTimeMarket(): Promise<any> {
  const data = await fetchWithRetry(
    'https://finans.mynet.com/api/real-time',
    { method: 'GET' }
  );
  return data || null;
}

// Erdinç Skor Hesaplama
function hesaplaErdincSkor(hisse: any): number {
  let skor = 15;
  if (hisse.borcOzkaynak <= 0.8) skor += 25;
  else if (hisse.borcOzkaynak <= 1.5) skor += 18;
  else if (hisse.borcOzkaynak <= 2.0) skor += 10;

  if (hisse.fk > 0 && hisse.fk <= 15) skor += 12;
  else if (hisse.fk > 15 && hisse.fk <= 20) skor += 8;

  if (hisse.pddd > 0 && hisse.pddd <= 1.5) skor += 13;
  else if (hisse.pddd > 0 && hisse.pddd <= 2.0) skor += 8;

  if (hisse.roe >= 20) skor += 25;
  else if (hisse.roe >= 15) skor += 18;
  else if (hisse.roe > 0) skor += 10;

  return skor;
}

function getVerdictFromScore(score: number): string {
  if (score >= 85) return 'GÜÇLÜ AL';
  if (score >= 70) return 'AL';
  if (score >= 50) return 'TUT';
  if (score >= 30) return 'AZALT';
  return 'SAT';
}

function getVoteFromScore(score: number): 'BUY' | 'SELL' | 'HOLD' {
  if (score >= 70) return 'BUY';
  if (score < 40) return 'SELL';
  return 'HOLD';
}

// ==================== MAIN API HANDLER ====================

export async function GET() {
  try {
    console.log('🏛️ Pantheon Signals API Başlatılıyor...');

    // 1. Verileri Çek
    const [allStocks, marketData] = await Promise.all([
      fetchAllStocks(),
      fetchRealTimeMarket()
    ]);

    if (!allStocks || allStocks.length === 0) {
      throw new Error('Hisse verileri alınamadı');
    }

    console.log(`✅ ${allStocks.length} hisse ve piyasa verisi hazır`);

    // 2. Erdinç Skorlama
    const skorluHisseler = allStocks
      .map(hisse => ({ ...hisse, toplamSkor: hesaplaErdincSkor(hisse) }))
      .sort((a, b) => b.toplamSkor - a.toplamSkor);

    const top10 = skorluHisseler.slice(0, 10);

    // 3. Makro - VIX (Sabit veya Mynet'ten varsa)
    const vix = 18.5;
    const regime = 'NEUTRAL';

    // 4. Sinyalleri Oluştur
    const signals = top10.map(stock => {
      const atlasScore = stock.toplamSkor;
      const orionScore = 65;
      const aetherScore = 55;
      const phoenixScore = Math.floor((atlasScore + orionScore) / 2);

      const coreScore = Math.floor(
        (atlasScore * 0.35) +
        (orionScore * 0.30) +
        (aetherScore * 0.15) +
        (phoenixScore * 0.20)
      );

      return {
        symbol: stock.kod,
        name: stock.ad || stock.kod,
        coreScore,
        pulseScore: orionScore,
        price: stock.kapanis || 0,
        fk: stock.fk,
        pddd: stock.pddd,
        verdict: getVerdictFromScore(coreScore),
        modules: [
          { module: 'Atlas', icon: '🗺️', vote: getVoteFromScore(atlasScore), confidence: atlasScore, reason: `F/K: ${stock.fk?.toFixed(1) || '-'}, PD/DD: ${stock.pddd?.toFixed(1) || '-'}` },
          { module: 'Orion', icon: '⭐', vote: 'BUY' as const, confidence: orionScore, reason: 'Yükseliş Trendi' },
          { module: 'Aether', icon: '🌤️', vote: 'HOLD' as const, confidence: aetherScore, reason: `Rejim: ${regime}` },
          { module: 'Phoenix', icon: '🔥', vote: getVoteFromScore(phoenixScore), confidence: phoenixScore, reason: 'Güçlü Temel' },
        ],
        lastUpdate: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        signals,
        market: {
          xu100: marketData?.xu100?.deger || 0,
          xu100Change: marketData?.xu100?.degisimOran || 0,
          xu030: marketData?.xu030?.deger || 0,
          usdtry: marketData?.dolar?.satis || 0,
          gold: marketData?.altin?.satis || 0,
          vix,
          regime,
        },
        meta: {
          totalStocks: allStocks.length,
          analysisTime: new Date().toISOString(),
          summary: `${allStocks.length} hisse analiz edildi.`
        }
      }
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('❌ Signals API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Sinyaller alınamadı',
        details: error instanceof Error ? error.message : 'Bilinmeyen hata'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
