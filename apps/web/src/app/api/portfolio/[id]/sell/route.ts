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

// POST - Pozisyon sat
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { positionId, satisFiyati, adet } = body;

    if (!positionId || !satisFiyati || !adet) {
      return NextResponse.json(
        { success: false, error: 'Position ID, satış fiyatı ve adet zorunludur' },
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

    const satisTutari = parseFloat(satisFiyati) * parseFloat(adet);
    const satisAdet = parseFloat(adet);

    // Ortalama maliyet hesaplama (kısmi satış için)
    const birimMaliyet = pozisyon.toplamMaliyet / pozisyon.adet;
    const satisMaliyeti = birimMaliyet * satisAdet;
    const karZarar = satisTutari - satisMaliyeti;

    // Tam satış mı?
    const tamSatis = satisAdet >= pozisyon.adet;

    if (tamSatis) {
      // Pozisyonu satıldı olarak işaretle
      await prisma.portfolioPosition.update({
        where: { id: positionId },
        data: {
          satistami: true,
          satisTarihi: new Date(),
          guncelFiyat: parseFloat(satisFiyati),
          guncelDeger: satisTutari,
          karZarar,
          karZararYuzde: (karZarar / satisMaliyeti) * 100,
        },
      });
    } else {
      // Kısmi satış - yeni ortalama maliyet hesapla
      const yeniAdet = pozisyon.adet - satisAdet;
      const yeniMaliyet = pozisyon.toplamMaliyet - satisMaliyeti;
      const yeniOrtalama = yeniMaliyet / yeniAdet;

      await prisma.portfolioPosition.update({
        where: { id: positionId },
        data: {
          adet: yeniAdet,
          alimFiyati: yeniOrtalama,
          toplamMaliyet: yeniMaliyet,
        },
      });
    }

    // İşlem kaydı oluştur
    await prisma.portfolioTransaction.create({
      data: {
        portfolioId: id,
        hisseKod: pozisyon.hisseKod,
        islemTipi: 'SATIS',
        adet: satisAdet,
        fiyat: parseFloat(satisFiyati),
        toplam: satisTutari,
        not: tamSatis ? 'Tam satış' : `${satisAdet} adet satış`,
      },
    });

    return NextResponse.json({
      success: true,
      message: tamSatis ? 'Pozisyon tamamen satıldı' : `${satisAdet} adet satıldı`,
      data: { karZarar, tamSatis },
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Sell POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Satış işlemi başarısız' },
      { status: 500, headers: corsHeaders }
    );
  }
}
