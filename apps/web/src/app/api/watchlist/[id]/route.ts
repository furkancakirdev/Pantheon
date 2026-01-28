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

// GET - İzleme listesi detayı
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const watchlist = await prisma.watchlist.findUnique({
      where: { id },
      include: {
        ogeler: {
          orderBy: { eklenmeTarihi: 'desc' },
        },
      },
    });

    if (!watchlist) {
      return NextResponse.json(
        { success: false, error: 'İzleme listesi bulunamadı' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      data: watchlist,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Watchlist Detail GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Detay alınamadı' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE - İzleme listesini sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.watchlist.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'İzleme listesi silindi',
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Watchlist DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'İzleme listesi silinemedi' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Listeye hisse ekle
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { hisseKod, hisseAd, hedefFiyat, alarmFiyat, notlar } = body;

    if (!hisseKod) {
      return NextResponse.json(
        { success: false, error: 'Hisse kodu zorunludur' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Zaten var mı kontrol et
    const mevcut = await prisma.watchlistItem.findUnique({
      where: {
        watchlistId_hisseKod: {
          watchlistId: id,
          hisseKod: hisseKod.toUpperCase(),
        },
      },
    });

    if (mevcut) {
      return NextResponse.json(
        { success: false, error: 'Bu hisse zaten listede var' },
        { status: 400, headers: corsHeaders }
      );
    }

    const item = await prisma.watchlistItem.create({
      data: {
        watchlistId: id,
        hisseKod: hisseKod.toUpperCase(),
        hisseAd: hisseAd || hisseKod.toUpperCase(),
        hedefFiyat: hedefFiyat ? parseFloat(hedefFiyat) : null,
        alarmFiyat: alarmFiyat ? parseFloat(alarmFiyat) : null,
        notlar,
      },
    });

    return NextResponse.json({
      success: true,
      data: item,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Watchlist Item POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Hisse eklenemedi' },
      { status: 500, headers: corsHeaders }
    );
  }
}
