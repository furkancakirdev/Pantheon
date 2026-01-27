/**
 * Poseidon Analysis API
 * Asset Allocation Motoru
 *
 * GET /api/analysis/poseidon
 * POST /api/analysis/poseidon
 */

import { NextRequest, NextResponse } from 'next/server';
import { poseidonEngine } from '@pantheon/analysis/poseidon';
import type { RiskProfile, AssetAllocation } from '@pantheon/analysis/poseidon/types';

/**
 * GET Handler - Varlık dağılım analizi
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'full'; // full | opinion | allocation | regime
  const riskProfile = searchParams.get('risk') as RiskProfile | null;

  try {
    // Rejim bilgisi
    if (format === 'regime') {
      const regime = await poseidonEngine.getRegime();
      return NextResponse.json({
        success: true,
        data: regime,
      });
    }

    // Hedef dağılım
    if (format === 'allocation') {
      const allocation = await poseidonEngine.getTargetAllocation(
        riskProfile || 'BALANCED'
      );
      return NextResponse.json({
        success: true,
        data: {
          riskProfile: riskProfile || 'BALANCED',
          allocation,
        },
      });
    }

    // Council için Opinion format
    if (format === 'opinion') {
      const opinion = await poseidonEngine.getOpinion('GLOBAL', riskProfile || 'BALANCED');
      return NextResponse.json({
        success: true,
        data: opinion,
      });
    }

    // Full format (default)
    const result = await poseidonEngine.analyze(riskProfile || 'BALANCED');

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Poseidon Analysis Error:', error);

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
    const action = body.action as 'analyze' | 'allocation' | 'regime' | undefined;
    const riskProfile = body.riskProfile as RiskProfile | undefined;
    const currentAllocation = body.currentAllocation as AssetAllocation | undefined;

    if (action === 'allocation') {
      const allocation = await poseidonEngine.getTargetAllocation(
        riskProfile || 'BALANCED'
      );

      return NextResponse.json({
        success: true,
        data: {
          riskProfile: riskProfile || 'BALANCED',
          allocation,
        },
      });
    }

    if (action === 'regime') {
      const regime = await poseidonEngine.getRegime();

      return NextResponse.json({
        success: true,
        data: regime,
      });
    }

    // Default: analyze
    const result = await poseidonEngine.analyze(
      riskProfile || 'BALANCED',
      currentAllocation
    );

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Poseidon POST Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}
