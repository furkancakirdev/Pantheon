import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

// CORS Headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

// GET - Tüm portföyleri listele
export async function GET() {
  try {
    const portfolios = await prisma.portfolio.findMany({
      include: {
        pozisyonlar: {
          where: { satistami: false },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Her portföy için özet hesaplamalar
    const portfoliosWithSummary = portfolios.map((p) => {
      const toplamMaliyet = p.pozisyonlar.reduce((sum, pos) => sum + pos.toplamMaliyet, 0);
      const toplamDeger = p.pozisyonlar.reduce((sum, pos) => sum + (pos.guncelDeger || 0), 0);
      const karZarar = toplamDeger - toplamMaliyet;
      const karZararYuzde = toplamMaliyet > 0 ? (karZarar / toplamMaliyet) * 100 : 0;

      return {
        ...p,
        ozet: {
          toplamMaliyet,
          toplamDeger,
          karZarar,
          karZararYuzde,
          pozisyonSayisi: p.pozisyonlar.length,
        },
      };
    });

    return NextResponse.json({
      success: true,
      data: portfoliosWithSummary,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Portfolio GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Portföyler alınamadı' },
      { status: 500, headers: corsHeaders }
    );
  }
}

// POST - Yeni portföy oluştur
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { isim, aciklama, bakiye } = body;

    if (!isim) {
      return NextResponse.json(
        { success: false, error: 'Portföy adı zorunludur' },
        { status: 400, headers: corsHeaders }
      );
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        isim,
        aciklama,
        bakiye: bakiye || 0,
      },
    });

    return NextResponse.json({
      success: true,
      data: portfolio,
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Portfolio POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Portföy oluşturulamadı' },
      { status: 500, headers: corsHeaders }
    );
  }
}
