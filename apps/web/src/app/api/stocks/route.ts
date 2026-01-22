/**
 * Stocks API - İş Yatırım'dan BIST hisse verileri
 * 
 * GET /api/stocks - Tüm hisseler
 * GET /api/stocks?sector=... - Sektöre göre filtre
 */

import { NextRequest, NextResponse } from 'next/server';

interface StockData {
    kod: string;
    ad: string;
    sektor: string;
    kapanis: number;
    fk: number;
    pddd: number;
    roe: number;
    borcOzkaynak: number;
    yabanciOran: number;
}

// İş Yatırım API endpoint
const IS_YATIRIM_API = 'https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/Data.aspx/HisseSenetleri';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const sector = searchParams.get('sector');

        // İş Yatırım API'den veri çek
        const response = await fetch(IS_YATIRIM_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                'Accept': 'application/json',
            },
            body: JSON.stringify({}),
            cache: 'no-store', // Her seferinde taze veri
        });

        if (!response.ok) {
            // API başarısız olursa mock data döndür
            return NextResponse.json({
                success: true,
                source: 'mock',
                data: getMockStocks(),
                message: 'İş Yatırım API erişilemedi, mock data kullanılıyor',
            });
        }

        const result = await response.json();
        let stocks: StockData[] = result.d || [];

        // Sektör filtresi
        if (sector) {
            stocks = stocks.filter(s =>
                s.sektor?.toLowerCase().includes(sector.toLowerCase())
            );
        }

        return NextResponse.json({
            success: true,
            source: 'isyatirim',
            count: stocks.length,
            data: stocks,
        });

    } catch (error) {
        console.error('Stocks API error:', error);

        // Hata durumunda mock data
        return NextResponse.json({
            success: true,
            source: 'mock',
            data: getMockStocks(),
            message: 'API hatası, mock data kullanılıyor',
        });
    }
}

// Mock data
function getMockStocks(): StockData[] {
    return [
        { kod: 'ASELS', ad: 'Aselsan', sektor: 'Savunma', kapanis: 52.80, fk: 12.5, pddd: 1.8, roe: 24, borcOzkaynak: 0.6, yabanciOran: 42 },
        { kod: 'THYAO', ad: 'Türk Hava Yolları', sektor: 'Havacılık', kapanis: 285.50, fk: 8.2, pddd: 1.2, roe: 28, borcOzkaynak: 1.8, yabanciOran: 55 },
        { kod: 'KCHOL', ad: 'Koç Holding', sektor: 'Holding', kapanis: 165.20, fk: 6.5, pddd: 0.9, roe: 18, borcOzkaynak: 0.7, yabanciOran: 48 },
        { kod: 'TUPRS', ad: 'Tüpraş', sektor: 'Enerji', kapanis: 142.30, fk: 5.8, pddd: 1.1, roe: 22, borcOzkaynak: 0.5, yabanciOran: 38 },
        { kod: 'SISE', ad: 'Şişecam', sektor: 'Cam', kapanis: 48.90, fk: 7.2, pddd: 0.8, roe: 16, borcOzkaynak: 0.9, yabanciOran: 35 },
        { kod: 'SAHOL', ad: 'Sabancı Holding', sektor: 'Holding', kapanis: 78.50, fk: 5.5, pddd: 0.7, roe: 15, borcOzkaynak: 0.8, yabanciOran: 52 },
        { kod: 'AKBNK', ad: 'Akbank', sektor: 'Banka', kapanis: 42.15, fk: 4.2, pddd: 0.6, roe: 20, borcOzkaynak: 5.2, yabanciOran: 45 },
        { kod: 'GARAN', ad: 'Garanti BBVA', sektor: 'Banka', kapanis: 98.70, fk: 3.8, pddd: 0.5, roe: 22, borcOzkaynak: 4.8, yabanciOran: 58 },
        { kod: 'EREGL', ad: 'Ereğli Demir Çelik', sektor: 'Metal', kapanis: 52.40, fk: 6.8, pddd: 0.9, roe: 14, borcOzkaynak: 0.4, yabanciOran: 32 },
        { kod: 'BIMAS', ad: 'BİM', sektor: 'Perakende', kapanis: 485.00, fk: 22.5, pddd: 8.5, roe: 35, borcOzkaynak: 1.2, yabanciOran: 68 },
    ];
}
