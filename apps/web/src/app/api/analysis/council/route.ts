/**
 * Council Analysis API
 * Grand Council karar motorunu kullanan endpoint
 *
 * Production: Gerçek modül API'lerinden sonuçları toplar
 */

// Static optimization'ı devre dışı bırak
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { grandCouncil, type ModulOyu, type OyTipi } from '@analysis/council';
import type { CouncilKarar } from '@analysis/council';

// Modül API endpoint'leri
const MODULE_APIS = {
  atlas: '/api/analysis/complete',
  orion: '/api/analysis/orion',
  wonderkid: '/api/analysis/erdinc',
  athena: '/api/analysis/demeter',
  hermes: '/api/sentiment',
  aether: '/api/aether',
  phoenix: '/api/analysis/phoenix',
  cronos: '/api/analysis/cronos',
  prometheus: '/api/analysis/prometheus',
  poseidon: '/api/analysis/poseidon',
};

/**
 * Modül API'sinden analiz sonucu çek
 */
async function fetchModuleAnalysis(
  moduleName: string,
  symbol: string,
  baseUrl: string
): Promise<{ vote: ModulOyu; success: boolean } | null> {
  try {
    const apiUrl = `${MODULE_APIS[moduleName as keyof typeof MODULE_APIS]}?symbol=${symbol}`;
    const response = await fetch(new URL(apiUrl, baseUrl).toString());

    if (!response.ok) {
      console.warn(`${moduleName} API yanıtı vermedi: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Her modülün response formatı farklı, burada standartlaştırma yapıyoruz
    const vote: ModulOyu = {
      modul: moduleName.charAt(0).toUpperCase() + moduleName.slice(1),
      oy: 'BEKLE' as OyTipi,
      guven: data.data?.totalScore || data.data?.skor || 50,
      aciklama: data.data?.reason || data.data?.aciklama || 'Analiz tamamlandı',
      icon: getModuleIcon(moduleName),
    };

    // Verdict'ten oy belirleme
    if (data.data?.verdict || data.data?.karar) {
      const verdict = (data.data.verdict || data.data.kadar).toUpperCase();
      if (verdict.includes('AL') || verdict === 'BUY') {
        vote.oy = 'AL';
      } else if (verdict.includes('SAT') || verdict === 'SELL') {
        vote.oy = 'SAT';
      }
    }

    return { vote, success: data.success || true };
  } catch (error) {
    console.warn(`${moduleName} API çağrısı başarısız:`, error);
    return null;
  }
}

function getModuleIcon(moduleName: string): string {
  const icons: Record<string, string> = {
    atlas: '📊',
    orion: '📈',
    wonderkid: '⭐',
    athena: '🦉',
    hermes: '🐦',
    aether: '🌍',
    phoenix: '🔥',
    cronos: '⏰',
    prometheus: '📡',
    poseidon: '🌊',
  };
  return icons[moduleName] || '🔍';
}

/**
 * GET /api/analysis/council?symbol=ASELS
 * Council analizi yapar - gerçek modül API'lerini kullanır
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'ASELS';

  try {
    const symbolUpper = symbol.toUpperCase();

    // Tüm modüllerden paralel analiz çek
    const modules = ['orion', 'wonderkid', 'athena', 'aether', 'phoenix', 'cronos'];
    const baseUrl = request.url.split('?')[0].replace('/api/analysis/council', '');

    const analyses = await Promise.all(
      modules.map(module => fetchModuleAnalysis(module, symbolUpper, baseUrl))
    );

    // Başarılı analizleri topla
    const votes: ModulOyu[] = analyses
      .filter((result): result is { vote: ModulOyu; success: boolean } => result !== null && result.success)
      .map((result) => result!.vote);

    // Eğer hiçbir modül cevap vermezse, fallback
    if (votes.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Modüllerden yanıt alınamadı. Lütfen daha sonra tekrar deneyin.',
        dataSource: 'error',
      }, { status: 503 });
    }

    const councilKarar: CouncilKarar = grandCouncil(symbolUpper, 'HISSE', votes);

    return NextResponse.json({
      success: true,
      dataSource: 'real_modules',
      data: {
        symbol: symbolUpper,
        timestamp: new Date().toISOString(),
        votes,
        councilDecision: councilKarar,
        moduleCount: votes.length,
      },
    });

  } catch (error) {
    console.error('Council Analysis Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      dataSource: 'error',
    }, { status: 500 });
  }
}

/**
 * POST /api/analysis/council
 * Batch council analizi yapar
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { symbols } = body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'symbols array required',
      }, { status: 400 });
    }

    const results = [];

    for (const symbol of symbols.slice(0, 20)) { // Max 20 symbols
      const mockRequest = new Request(
        request.url.split('?')[0] + `?symbol=${symbol}`
      );
      const response = await GET(mockRequest as NextRequest);
      const data = await response.json();

      if (data.success) {
        results.push(data.data);
      }
    }

    return NextResponse.json({
      success: true,
      count: results.length,
      dataSource: 'real_modules',
      data: results,
    });

  } catch (error) {
    console.error('Batch Council Analysis Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
    }, { status: 500 });
  }
}
