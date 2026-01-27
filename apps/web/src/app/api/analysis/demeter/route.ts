/**
 * Demeter Analysis API
 * Sector Rotation Motoru
 *
 * GET /api/analysis/demeter
 * POST /api/analysis/demeter
 */

import { NextRequest, NextResponse } from 'next/server';
import { demeterEngine } from '@pantheon/analysis/demeter';
import type { SectorCode } from '@pantheon/analysis/demeter/types';

/**
 * GET Handler - Sektör rotasyon analizi
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'full'; // full | opinion | phase | allocation
  const sector = searchParams.get('sector') as SectorCode | null;
  const riskProfile = searchParams.get('risk') as 'conservative' | 'balanced' | 'aggressive' | null;

  try {
    // Sektör özel öneri
    if (sector && format === 'recommendation') {
      const recommendation = await demeterEngine.getSectorRecommendation(sector);
      return NextResponse.json({
        success: true,
        data: {
          sector,
          recommendation,
        },
      });
    }

    // Piyasa fazı
    if (format === 'phase') {
      const phase = await demeterEngine.getMarketPhase();
      return NextResponse.json({
        success: true,
        data: {
          phase,
          description: phase === 'RISK_ON' ? 'Risk iştahı yüksek. Siklikal sektörlere yönelim.' :
                      phase === 'RISK_OFF' ? 'Risk kaçışı. Defansif sektörlere rotasyon.' :
                      'Geçiş fazı. Dengeli portföy.',
        },
      });
    }

    // Portföy ağırlık önerisi
    if (format === 'allocation') {
      const allocation = await demeterEngine.getSectorAllocation(
        riskProfile || 'balanced'
      );
      return NextResponse.json({
        success: true,
        data: {
          riskProfile: riskProfile || 'balanced',
          allocation,
        },
      });
    }

    // Council için Opinion format
    if (format === 'opinion') {
      const opinion = await demeterEngine.getOpinion('GLOBAL');
      return NextResponse.json({
        success: true,
        data: opinion,
      });
    }

    // Full format (default)
    const result = await demeterEngine.analyze();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Demeter Analysis Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}

/**
 * POST Handler - Farklı aksiyonlar
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as 'analyze' | 'allocation' | 'recommendation' | undefined;

    if (action === 'allocation') {
      const riskProfile = body.riskProfile as 'conservative' | 'balanced' | 'aggressive' | undefined;
      const allocation = await demeterEngine.getSectorAllocation(riskProfile);

      return NextResponse.json({
        success: true,
        data: {
          riskProfile: riskProfile || 'balanced',
          allocation,
        },
      });
    }

    if (action === 'recommendation') {
      const sector = body.sector as SectorCode;
      if (!sector) {
        return NextResponse.json(
          { success: false, error: 'Sektör parametresi gerekli' },
          { status: 400 }
        );
      }

      const recommendation = await demeterEngine.getSectorRecommendation(sector);

      return NextResponse.json({
        success: true,
        data: {
          sector,
          recommendation,
        },
      });
    }

    // Default: analyze
    const result = await demeterEngine.analyze();

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Demeter POST Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}
