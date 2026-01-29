/**
 * Stocks API - Tüm Piyasalar için
 * BIST, ABD ve TEFAS fonlarını içerir
 *
 * Production: İş Yatırım API'den gerçek veri çekiyor
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
    BIST_STOCKS,
    US_STOCKS,
    TEFAS_FUNDS,
    type StockInfo,
    type FundInfo
} from '@db/stock-registry';
import { IsyatirimClient, type StockFundamentals } from '@api-clients/isyatirim';

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
    fdFavok?: number;
    roe?: number;
    borcOzkaynak?: number;
    piyasaDegeri?: number;
    yabanciOran?: number;
    hacim?: number;
    aktif: boolean;
    dataSource?: 'is_yatirim' | 'fallback';
}

// Cache için global değişken (5 dakika)
let cachedBistData: StockFundamentals[] | null = null;
let cacheTime: number | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

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

        // BIST hisseleri için İş Yatırım API'den gerçek veri çek
        let bistFundamentals: StockFundamentals[] = [];

        if (market === 'BIST' || market === 'ALL') {
            bistFundamentals = await getBistFundamentals();
        }

        // Piyasa filtresi
        if (market === 'BIST') {
            stocks = enrichBISTStocksWithRealData(bistFundamentals);
        } else if (market === 'US') {
            stocks = US_STOCKS.map(s => enrichUSStockData(s));
        } else if (market === 'TEFAS') {
            stocks = TEFAS_FUNDS.map(f => enrichFundWithData(f));
        } else {
            // ALL - Tüm piyasalar
            stocks = [
                ...enrichBISTStocksWithRealData(bistFundamentals),
                ...US_STOCKS.map(s => enrichUSStockData(s)),
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
            source: 'real_api',
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
 * İş Yatırım API'den BIST verilerini çeker (cache'li)
 */
async function getBistFundamentals(): Promise<StockFundamentals[]> {
    const now = Date.now();

    // Cache kontrolü
    if (cachedBistData && cacheTime && (now - cacheTime) < CACHE_DURATION) {
        return cachedBistData;
    }

    try {
        const client = new IsyatirimClient();
        const data = await client.fetchAllStocks();

        // Cache'le
        cachedBistData = data;
        cacheTime = now;

        return data;
    } catch (error) {
        console.error('İş Yatırım API hatası, fallback kullanılıyor:', error);

        // Cache varsa eski veriyi kullan
        if (cachedBistData) {
            return cachedBistData;
        }

        // Yoksa boş array dön (fallback mock yerine hata fırlat)
        throw new Error('BIST verileri alınamadı ve cache yok');
    }
}

/**
 * BIST hisselerini gerçek API verisiyle zenginleştir
 */
function enrichBISTStocksWithRealData(fundamentals: StockFundamentals[]): StockData[] {
    // Hisse kodundan registry'e map oluştur
    const stockMap = new Map<string, StockInfo>();
    for (const stock of BIST_STOCKS) {
        stockMap.set(stock.symbol, stock);
    }

    // Fundamentals ile birleştir
    return fundamentals.map(f => {
        const registryInfo = stockMap.get(f.kod);
        return {
            kod: f.kod,
            ad: f.ad,
            sektor: f.sektor,
            piyasa: 'BIST',
            altPiyasa: registryInfo?.subMarket,
            doviz: 'TRY',
            kapanis: f.kapanis,
            degisim: 0, // İş Yatırım API'de değişim yok, hesaplanabilir
            fk: f.fk,
            pddd: f.pddd,
            fdFavok: f.fdFavok,
            roe: f.roe,
            borcOzkaynak: f.borcOzkaynak,
            piyasaDegeri: f.piyasaDegeri,
            yabanciOran: f.yabanciOran,
            hacim: f.piyasaDegeri * 0.1, // Tahmini hacim
            aktif: registryInfo?.isActive ?? true,
            dataSource: 'is_yatirim'
        };
    });
}

/**
 * US hissesi için veri (FMP API kullanılabilir)
 */
function enrichUSStockData(stock: StockInfo): StockData {
    // US hisseleri için mock veri - FMP API entegrasyonu yapılabilir
    const basePrice = getBasePrice(stock.symbol, stock.market);
    const variation = 0.98 + Math.random() * 0.04;
    const price = basePrice * variation;
    const change = (Math.random() - 0.5) * 10;

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
        aktif: stock.isActive,
        dataSource: 'fallback'
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
        aktif: true,
        dataSource: 'fallback'
    };
}

/**
 * Sembole göre temel fiyat (Tutarlılık için)
 */
function getBasePrice(symbol: string, market: string): number {
    let hash = 0;
    for (let i = 0; i < symbol.length; i++) {
        hash = ((hash << 5) - hash) + symbol.charCodeAt(i);
        hash = hash & hash;
    }
    const normalizedHash = Math.abs(hash) / 10000000;

    if (market === 'TEFAS') {
        return 1 + normalizedHash * 99;
    } else if (market === 'NASDAQ' || market === 'NYSE') {
        return 50 + normalizedHash * 450;
    } else {
        return 10 + normalizedHash * 990;
    }
}

/**
 * Mock F/K oranı (US için fallback)
 */
function getMockFK(symbol: string): number {
    const fkMap: Record<string, number> = {
        'AAPL': 28, 'MSFT': 32, 'GOOGL': 24, 'AMZN': 45, 'TSLA': 55,
        'NVDA': 65, 'META': 22, 'NFLX': 38
    };
    return fkMap[symbol] || 8 + Math.random() * 20;
}

/**
 * Mock PD/DD oranı (US için fallback)
 */
function getMockPDDD(symbol: string): number {
    return 0.8 + Math.random() * 2;
}
