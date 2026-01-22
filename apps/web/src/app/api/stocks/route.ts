/**
 * Stocks API - İş Yatırım'dan BIST hisse verileri
 */

import { NextRequest, NextResponse } from 'next/server';

interface StockData {
    kod: string;
    ad: string;
    sektor: string;
    kapanis: number; // Güncel Fiyat
    degisim: number;
    fk: number;
    pddd: number;
    hacim: number;
}

export async function GET(request: NextRequest) {
    // Mock data - Güncel Fiyatlarla
    return NextResponse.json({
        success: true,
        source: 'mock_updated',
        data: getUpdatedMockStocks(),
        message: 'Güncel hisse verileri (Simüle)',
    });
}

function getUpdatedMockStocks(): StockData[] {
    return [
        { kod: 'ASELS', ad: 'Aselsan', sektor: 'Savunma', kapanis: 64.25, degisim: 2.4, fk: 14.2, pddd: 2.1, hacim: 5400000000 },
        { kod: 'THYAO', ad: 'Türk Hava Yolları', sektor: 'Havacılık', kapanis: 312.50, degisim: 1.8, fk: 3.5, pddd: 0.9, hacim: 12500000000 },
        { kod: 'KCHOL', ad: 'Koç Holding', sektor: 'Holding', kapanis: 205.10, degisim: -0.5, fk: 5.8, pddd: 0.85, hacim: 2100000000 },
        { kod: 'TUPRS', ad: 'Tüpraş', sektor: 'Enerji', kapanis: 168.40, degisim: 0.2, fk: 6.2, pddd: 1.4, hacim: 3200000000 },
        { kod: 'GARAN', ad: 'Garanti BBVA', sektor: 'Banka', kapanis: 124.60, degisim: 3.5, fk: 3.2, pddd: 0.65, hacim: 8500000000 },
        { kod: 'AKBNK', ad: 'Akbank', sektor: 'Banka', kapanis: 68.90, degisim: 3.1, fk: 3.4, pddd: 0.70, hacim: 6400000000 },
        { kod: 'SISE', ad: 'Şişecam', sektor: 'Cam', kapanis: 46.80, degisim: -1.2, fk: 8.5, pddd: 1.1, hacim: 1800000000 },
        { kod: 'BIMAS', ad: 'BİM', sektor: 'Perakende', kapanis: 585.00, degisim: 0.5, fk: 18.2, pddd: 7.5, hacim: 1500000000 },
        { kod: 'EREGL', ad: 'Ereğli Demir Çelik', sektor: 'Metal', kapanis: 54.30, degisim: -0.8, fk: 12.4, pddd: 0.8, hacim: 2200000000 },
        { kod: 'MGROS', ad: 'Migros', sektor: 'Perakende', kapanis: 510.25, degisim: 1.2, fk: 14.5, pddd: 4.2, hacim: 950000000 },
    ];
}
