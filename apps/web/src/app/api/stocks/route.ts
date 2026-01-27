/**
 * Stocks API - Tüm Piyasalar için
 * BIST, ABD ve TEFAS fonlarını içerir
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
    BIST_STOCKS,
    US_STOCKS,
    TEFAS_FUNDS,
    getAssetsByMarket,
    findAsset,
    type StockInfo,
    type FundInfo
} from '@db/stock-registry';

interface StockData {
    kod: string;
    ad: string;
    sektor: string;
    piyasa: 'BIST' | 'NYSE' | 'NASDAQ' | 'TEFAS';
    altPiyasa?: string;
    doviz?: 'TRY' | 'USD';
    kapanis: number;
    degisim: number;
    fk?: number;
    pddd?: number;
    hacim?: number;
    aktif: boolean;
}

/**
 * GET /api/stocks
 * Query params:
 * - market: BIST | NYSE | NASDAQ | TEFAS | ALL (default)
 * - sector: Sektör filtresi
 * - search: Arama metni
 * - favorites: Sadece favoriler (localStorage'dan gelmeli)
 */
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const market = (searchParams.get('market') || 'ALL').toUpperCase();
    const sector = searchParams.get('sector');
    const search = searchParams.get('search');
    const favorites = searchParams.get('favorites');

    try {
        let stocks: StockData[] = [];

        // Piyasa filtresi
        if (market === 'BIST') {
            stocks = BIST_STOCKS.map(s => enrichWithPriceData(s));
        } else if (market === 'US') {
            stocks = US_STOCKS.map(s => enrichWithPriceData(s));
        } else if (market === 'TEFAS') {
            stocks = TEFAS_FUNDS.map(f => enrichFundWithData(f));
        } else {
            // ALL - Tüm piyasalar
            stocks = [
                ...BIST_STOCKS.map(s => enrichWithPriceData(s)),
                ...US_STOCKS.map(s => enrichWithPriceData(s)),
                ...TEFAS_FUNDS.map(f => enrichFundWithData(f))
            ];
        }

        // Sektör filtresi
        if (sector) {
            stocks = stocks.filter(s => s.sektor.toLowerCase() === sector.toLowerCase());
        }

        // Arama filtresi
        if (search) {
            const searchLower = search.toLowerCase();
            stocks = stocks.filter(s =>
                s.kod.toLowerCase().includes(searchLower) ||
                s.ad.toLowerCase().includes(searchLower)
            );
        }

        // Favoriler filtresi
        if (favorites) {
            const favArray = favorites.split(',').map(f => f.trim().toUpperCase());
            stocks = stocks.filter(s => favArray.includes(s.kod));
        }

        return NextResponse.json({
            success: true,
            source: 'stock_registry',
            count: stocks.length,
            data: stocks,
        });
    } catch (error) {
        console.error('Stocks API Error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        }, { status: 500 });
    }
}

/**
 * StockInfo'ya fiyat verisi ekle (Mock - Production'da gerçek API'den gelecek)
 */
function enrichWithPriceData(stock: StockInfo): StockData {
    // Mock fiyat hesaplama - sembol bazlı tutarlılık
    const basePrice = getBasePrice(stock.symbol, stock.market);
    const variation = 0.98 + Math.random() * 0.04; // ±2%

    const price = basePrice * variation;
    const change = (Math.random() - 0.5) * 10; // ±5%

    return {
        kod: stock.symbol,
        ad: stock.name,
        sektor: stock.sector,
        piyasa: stock.market,
        altPiyasa: stock.subMarket,
        doviz: stock.currency,
        kapanis: Math.round(price * 100) / 100,
        degisim: Math.round(change * 10) / 10,
        fk: getMockFK(stock.symbol),
        pddd: getMockPDDD(stock.symbol),
        hacim: Math.floor(1000000 + Math.random() * 50000000),
        aktif: stock.isActive
    };
}

/**
 * FundInfo'ya veri ekle
 */
function enrichFundWithData(fund: FundInfo): StockData {
    const basePrice = getBasePrice(fund.code, 'TEFAS');
    const price = basePrice * (0.99 + Math.random() * 0.02);

    return {
        kod: fund.code,
        ad: fund.name,
        sektor: 'Fon',
        piyasa: 'TEFAS',
        altPiyasa: fund.type,
        doviz: 'TRY',
        kapanis: Math.round(price * 1000) / 1000,
        degisim: (Math.random() - 0.5) * 2,
        aktif: true
    };
}

/**
 * Sembole göre temel fiyat (Tutarlılık için)
 */
function getBasePrice(symbol: string, market: string): number {
    // Hash benzeri tutarlı rastgele sayı
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
        hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
        hash = hash & hash;
    }
    const normalizedHash = Math.abs(hash) / 10000000;

    // Piyasa bazlı aralık
    if (market === 'TEFAS') {
        // Fonlar 1-100 arası
        return 1 + normalizedHash * 99;
    } else if (market === 'NASDAQ' || market === 'NYSE') {
        // US hisseleri 50-500 arası
        return 50 + normalizedHash * 450;
    } else {
        // BIST hisseleri 10-1000 arası
        return 10 + normalizedHash * 990;
    }
}

/**
 * Mock F/K oranı
 */
function getMockFK(symbol: string): number {
    const fkMap: Record<string, number> = {
        'THYAO': 3.5, 'GARAN': 3.2, 'ISCTR': 3.8, 'AKBNK': 3.4, 'YKBNK': 3.1,
        'BIMAS': 18.2, 'MGROS': 14.5, 'SASA': 12.8, 'ASELS': 14.2,
        'TUPRS': 6.2, 'PETKM': 8.5, 'EREGL': 12.4, 'KRDMD': 8.8,
        'KOZAA': 6.5, 'KOZAL': 6.3,
        'AAPL': 28, 'MSFT': 32, 'GOOGL': 24, 'AMZN': 45, 'TSLA': 55,
        'NVDA': 65, 'META': 22, 'NFLX': 38
    };
    return fkMap[symbol] || 8 + Math.random() * 20;
}

/**
 * Mock PD/DD oranı
 */
function getMockPDDD(symbol: string): number {
    const pdddMap: Record<string, number> = {
        'THYAO': 0.9, 'GARAN': 0.65, 'ISCTR': 0.75, 'AKBNK': 0.70, 'YKBNK': 0.68,
        'KOZAA': 2.8, 'KOZAL': 2.6,
        'EREGL': 0.8, 'KRDMD': 0.6, 'TUPRS': 1.4
    };
    return pdddMap[symbol] || 0.8 + Math.random() * 2;
}
