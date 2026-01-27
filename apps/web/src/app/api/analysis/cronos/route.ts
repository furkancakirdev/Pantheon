/**
 * Cronos Analysis API
 * Timing & Cycle Motoru
 *
 * GET /api/analysis/cronos?date=2024-01-27
 */

import { NextRequest, NextResponse } from 'next/server';
import { cronosEngine } from '@pantheon/analysis/cronos/engine';

/**
 * GET Handler - Zamanlama analizi
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const dateParam = searchParams.get('date');
  const format = searchParams.get('format') || 'full'; // full | opinion | score

  try {
    // Tarihi parse et
    let date: Date;
    if (dateParam) {
      date = new Date(dateParam);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          {
            success: false,
            error: 'Geçersiz tarih formatı',
          },
          { status: 400 }
        );
      }
    } else {
      date = new Date();
    }

    // İstenilen formatta sonuç dön
    if (format === 'opinion') {
      // Council için Opinion format
      const opinion = cronosEngine.getOpinion('GLOBAL', date);
      return NextResponse.json({
        success: true,
        data: opinion,
      });
    }

    if (format === 'score') {
      // Sadece skor
      const result = cronosEngine.analyze(date);
      return NextResponse.json({
        success: true,
        data: {
          date: result.date,
          score: result.score,
          letterGrade: result.letterGrade,
          verdict: result.verdict,
          timing: result.timing,
          recommendation: result.recommendation,
          summary: result.summary,
        },
      });
    }

    // Full format (default)
    const result = cronosEngine.analyze(date);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Cronos Analysis Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      },
      { status: 500 }
    );
  }
}
