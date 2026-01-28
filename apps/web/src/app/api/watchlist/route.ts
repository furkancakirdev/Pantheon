import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Tüm izleme listeleri
export async function GET() {
  try {
    const watchlists = await prisma.watchlist.findMany({
      include: {
        ogeler: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data: watchlists,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Watchlist GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'İzleme listeleri alınamadı' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Yeni izleme listesi oluştur
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { isim, aciklama } = body;

    if (!isim) {
      return NextResponse.json(
        { success: false, error: 'Liste adı zorunludur' },
        { status: 400, headers: corsHeaders }
      );
    }

    const watchlist = await prisma.watchlist.create({
      data: {
        isim,
        aciklama,
      },
      include: {
        ogeler: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: watchlist,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Watchlist POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'İzleme listesi oluşturulamadı' },
      { status: 500, headers: corsHeaders }
    );
  }
}
