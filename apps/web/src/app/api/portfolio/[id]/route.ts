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

// GET - Portföy detayı
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        pozisyonlar: {
          orderBy: { alimTarihi: 'desc' },
        },
        islemler: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!portfolio) {
      return NextResponse.json(
        { success: false, error: 'Portföy bulunamadı' },
        { status: 404, headers: corsHeaders }
      );
    }

    // Özet hesaplamalar
    const aktifPozisyonlar = portfolio.pozisyonlar.filter((p: any) => !p.satistami);
    const toplamMaliyet = aktifPozisyonlar.reduce((sum: number, pos: any) => sum + pos.toplamMaliyet, 0);
    const toplamDeger = aktifPozisyonlar.reduce((sum: number, pos: any) => sum + (pos.guncelDeger || 0), 0);
    const karZarar = toplamDeger - toplamMaliyet;
    const karZararYuzde = toplamMaliyet > 0 ? (karZarar / toplamMaliyet) * 100 : 0;

    // Satis realizmis kar/zarar
    const satisPozisyonlar = portfolio.pozisyonlar.filter((p: any) => p.satistami);
    const realizmisKar = satisPozisyonlar.reduce((sum: number, pos: any) => sum + (pos.karZarar || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        ...portfolio,
        ozet: {
          toplamMaliyet,
          toplamDeger,
          karZarar,
          karZararYuzde,
          realizmisKar,
          aktifPozisyonSayisi: aktifPozisyonlar.length,
          toplamIslemSayisi: portfolio.islemler.length,
        },
      },
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Portfolio Detail GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Portföy detayı alınamadı' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT - Portföy güncelle
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { isim, aciklama, bakiye, durum } = body;

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: {
        ...(isim && { isim }),
        ...(aciklama !== undefined && { aciklama }),
        ...(bakiye !== undefined && { bakiye }),
        ...(durum && { durum }),
      },
    });

    return NextResponse.json({
      success: true,
      data: portfolio,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Portfolio PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Portföy güncellenemedi' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// DELETE - Portföy sil
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.portfolio.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Portföy silindi',
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Portfolio DELETE Error:', error);
    return NextResponse.json(
      { success: false, error: 'Portföy silinemedi' },
      { status: 500, headers: corsHeaders }
    );
  }
}
