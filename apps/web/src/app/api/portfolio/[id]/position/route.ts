import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// POST - Pozisyon ekle
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { hisseKod, hisseAd, adet, alimFiyati } = body;

    if (!hisseKod || !adet || !alimFiyati) {
      return NextResponse.json(
        { success: false, error: 'Hisse kodu, adet ve alış fiyatı zorunludur' },
        { status: 400, headers: corsHeaders }
      );
    }

    const toplamMaliyet = adet * alimFiyati;

    // Pozisyon oluştur
    const pozisyon = await prisma.portfolioPosition.create({
      data: {
        portfolioId: id,
        hisseKod: hisseKod.toUpperCase(),
        hisseAd: hisseAd || hisseKod.toUpperCase(),
        adet: parseFloat(adet),
        alimFiyati: parseFloat(alimFiyati),
        toplamMaliyet,
        guncelFiyat: parseFloat(alimFiyati),
        guncelDeger: toplamMaliyet,
        karZarar: 0,
        karZararYuzde: 0,
      },
    });

    // İşlem kaydı oluştur
    await prisma.portfolioTransaction.create({
      data: {
        portfolioId: id,
        hisseKod: hisseKod.toUpperCase(),
        islemTipi: 'ALIS',
        adet: parseFloat(adet),
        fiyat: parseFloat(alimFiyati),
        toplam: toplamMaliyet,
      },
    });

    return NextResponse.json({
      success: true,
      data: pozisyon,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Position POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Pozisyon eklenemedi' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT - Pozisyon güncelle (fiyat güncelleme)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { positionId, guncelFiyat } = body;

    if (!positionId || !guncelFiyat) {
      return NextResponse.json(
        { success: false, error: 'Position ID ve güncel fiyat zorunludur' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Mevcut pozisyonu al
    const pozisyon = await prisma.portfolioPosition.findUnique({
      where: { id: positionId },
    });

    if (!pozisyon) {
      return NextResponse.json(
        { success: false, error: 'Pozisyon bulunamadı' },
        { status: 404, headers: corsHeaders }
      );
    }

    const guncelDeger = pozisyon.adet * parseFloat(guncelFiyat);
    const karZarar = guncelDeger - pozisyon.toplamMaliyet;
    const karZararYuzde = (karZarar / pozisyon.toplamMaliyet) * 100;

    // Güncelle
    const guncellenen = await prisma.portfolioPosition.update({
      where: { id: positionId },
      data: {
        guncelFiyat: parseFloat(guncelFiyat),
        guncelDeger,
        karZarar,
        karZararYuzde,
      },
    });

    return NextResponse.json({
      success: true,
      data: guncellenen,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Position PUT Error:', error);
    return NextResponse.json(
      { success: false, error: 'Pozisyon güncellenemedi' },
      { status: 500, headers: corsHeaders }
    );
  }
}
