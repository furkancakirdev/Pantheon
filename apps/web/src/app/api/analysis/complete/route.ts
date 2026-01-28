/**
 * Complete Stock Analysis API - Grand Council V3
 * Tüm 10 modülü birleştiren, Argus tarzı detaylı rapor üreten endpoint
 *
 * Artık TÜM BIST hisseleri, US hisseleri ve TEFAS fonları için çalışır
 */

// Static optimization'ı devre dışı bırak
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { OrionEngine } from '@analysis/orion/engine';
import { CronosEngine } from '@analysis/cronos/engine';
import { AthenaEngine } from '@analysis/athena/engine';
import { PoseidonEngine, type AssetType } from '@analysis/poseidon/engine';
import { findAsset, BIST_STOCKS, US_STOCKS, TEFAS_FUNDS } from '@db/stock-registry';
import {
    grandCouncil,
    argusRaporOlustur,
    argusRaporToText,
    atlasGorus,
    wonderkidGorus,
    orionGorus,
    hermesGorus,
    aetherGorus,
    phoenixGorus,
    cronosGorus,
    athenaV2Gorus,
    poseidonGorus,
    chironGorus,
    type CouncilKarar,
    type ArgusRapor,
    type ModulGorus,
} from '@analysis/council/grand-council';
import type { AtlasResult } from '@analysis/atlas/engine';
import type { AthenaResult } from '@analysis/athena/engine';
import type { CronosResult } from '@analysis/cronos/engine';
import type { WonderkidScore } from '@analysis/wonderkid/engine';
import type { PoseidonResult } from '@analysis/poseidon/engine';

// ===== DATA GENERATORS =====

/**
 * Hash tabanlı tutarlı rastgele sayı üretici
 * Her sembol için her zaman aynı değerleri üretir
 */
function getSeededRandom(symbol: string, index: number): number {
    let hash = 0;
    const seed = symbol + index.toString();
    for (let i = 0; i < seed.length; i++) {
        hash = ((hash << 5) - hash) + seed.charCodeAt(i);
        hash = hash & hash;
    }
    return Math.abs(hash) / 2147483647;
}

/**
 * Sembole göre temel fiyat
 */
function getBasePrice(symbol: string, market: string): number {
    const hash = getSeededRandom(symbol, 0);
    const normalizedHash = hash;

    if (market === 'TEFAS') {
        return 1 + normalizedHash * 99;
    } else if (market === 'NASDAQ' || market === 'NYSE') {
        return 50 + normalizedHash * 450;
    } else {
        return 10 + normalizedHash * 990;
    }
}

/**
 * Mum grafik verisi oluştur
 */
function getMockCandles(symbol: string) {
    const asset = findAsset(symbol);
    const market = asset?.market || 'BIST';
    const basePrice = getBasePrice(symbol, market);

    const candles = [];
    const now = Date.now();

    // Trend yönü belirle
    const trend = getSeededRandom(symbol, 1) > 0.5 ? 1 : -1;
    let price = basePrice * (1 - trend * 0.2); // Başlangıç fiyatı

    for (let i = 100; i >= 0; i--) {
        const volatility = getSeededRandom(symbol, i) * 0.03;
        const direction = (getSeededRandom(symbol, i + 1000) - 0.5) * 2;
        price = price * (1 + direction * volatility + trend * 0.001);

        candles.push({
            date: new Date(now - i * 24 * 60 * 60 * 1000),
            open: price * (1 + getSeededRandom(symbol, i + 2000) * 0.01),
            high: price * (1 + getSeededRandom(symbol, i + 3000) * 0.02),
            low: price * (1 - getSeededRandom(symbol, i + 4000) * 0.02),
            close: price,
            volume: Math.floor(1000000 + getSeededRandom(symbol, i + 5000) * 50000000),
        });
    }

    return candles;
}

/**
 * Temel analiz verileri oluştur
 */
function getMockFundamentals(symbol: string) {
    const asset = findAsset(symbol);
    const isUS = asset?.market === 'NASDAQ' || asset?.market === 'NYSE';
    const isFund = asset?.market === 'TEFAS';

    const basePrice = getBasePrice(symbol, asset?.market || 'BIST');
    const fk = 5 + getSeededRandom(symbol, 10) * 30;
    const pddd = 0.5 + getSeededRandom(symbol, 11) * 3;
    const roe = 10 + getSeededRandom(symbol, 12) * 30;

    if (isUS) {
        // ABD hisseleri için Growth metrikleri
        return {
            kod: symbol,
            ad: asset?.name || symbol,
            sektor: asset?.sector || 'Teknoloji',
            kapanis: basePrice,
            fk,
            pddd,
            fdFavok: 20 + getSeededRandom(symbol, 13) * 20,
            roe,
            borcOzkaynak: 0.5 + getSeededRandom(symbol, 14) * 1.5,
            piyasaDegeri: basePrice * (1000000000 + getSeededRandom(symbol, 15) * 2000000000000),
            yabanciOran: 50 + getSeededRandom(symbol, 16) * 30,
            dividendYield: getSeededRandom(symbol, 17) * 2,
            netProfitMargin: 15 + getSeededRandom(symbol, 18) * 20,
            marketCap: basePrice * 1000000000,
            beta: 0.5 + getSeededRandom(symbol, 19) * 1.5,
            volatility30D: 15 + getSeededRandom(symbol, 20) * 30,
            return12M: -30 + getSeededRandom(symbol, 21) * 80,
            return6M: -20 + getSeededRandom(symbol, 22) * 50,
            return1M: -10 + getSeededRandom(symbol, 23) * 25,
            // Growth metrikleri
            revenueGrowth: 5 + getSeededRandom(symbol, 24) * 30,
            epsGrowth: 5 + getSeededRandom(symbol, 25) * 40,
            pegRatio: 0.5 + getSeededRandom(symbol, 26) * 3,
        };
    }

    if (isFund) {
        // Fon için farklı metrikler
        return {
            kod: symbol,
            ad: asset?.name || symbol,
            sektor: 'Fon',
            kapanis: basePrice,
            fk: 0,
            pddd: 0,
            fdFavok: 0,
            roe: 0,
            borcOzkaynak: 0,
            piyasaDegeri: 0,
            yabanciOran: 0,
            dividendYield: 0,
            netProfitMargin: 0,
            marketCap: 0,
            beta: 0,
            volatility30D: 5 + getSeededRandom(symbol, 27) * 15,
            return12M: -20 + getSeededRandom(symbol, 28) * 60,
            return6M: -10 + getSeededRandom(symbol, 29) * 30,
            return1M: -5 + getSeededRandom(symbol, 30) * 15,
        };
    }

    // BIST hisseleri
    return {
        kod: symbol,
        ad: asset?.name || symbol,
        sektor: asset?.sector || 'Diğer',
        kapanis: basePrice,
        fk,
        pddd,
        fdFavok: 5 + getSeededRandom(symbol, 31) * 15,
        roe,
        borcOzkaynak: 0.3 + getSeededRandom(symbol, 32) * 1.5,
        piyasaDegeri: basePrice * (100000000 + getSeededRandom(symbol, 33) * 10000000000),
        yabanciOran: 30 + getSeededRandom(symbol, 34) * 50,
        dividendYield: getSeededRandom(symbol, 35) * 5,
        netProfitMargin: 5 + getSeededRandom(symbol, 36) * 20,
        marketCap: basePrice * 1000000000,
        beta: 0.3 + getSeededRandom(symbol, 37) * 1.2,
        volatility30D: 20 + getSeededRandom(symbol, 38) * 30,
        return12M: -40 + getSeededRandom(symbol, 39) * 100,
        return6M: -25 + getSeededRandom(symbol, 40) * 60,
        return1M: -15 + getSeededRandom(symbol, 41) * 35,
    };
}

/**
 * Atlas sonucu oluştur
 */
function getMockAtlasResult(symbol: string, fundamentals: any): AtlasResult {
    const fk = fundamentals.fk || 12;
    const isUS = fk > 20; // US hisseleri genelde yüksek F/K

    let score: number;
    if (isUS) {
        // US için Growth Strategy
        const revenueGrowth = fundamentals.revenueGrowth || 10;
        const epsGrowth = fundamentals.epsGrowth || 10;
        score = revenueGrowth + epsGrowth * 0.5 + (100 - fk) * 0.3;
    } else {
        // BIST için Value Strategy
        score = fk < 8 ? 85 : fk < 12 ? 70 : fk < 18 ? 55 : 40;
    }

    const verdict = score >= 70 ? 'GÜÇLÜ AL' : score >= 55 ? 'AL' : score >= 40 ? 'TUT' : 'SAT';

    return {
        symbol,
        score: Math.min(100, Math.max(0, score)),
        verdict,
        dynamicFK: fk,
        dynamicPDDD: fundamentals.pddd || 1.5,
        letterGrade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D',
        erdincChecklist: [],
        extendedChecklist: [],
        summary: isUS
            ? `Growth: F/K ${fk.toFixed(1)}, Revenue +%${fundamentals.revenueGrowth?.toFixed(1) || 0}`
            : `Value: F/K ${fk.toFixed(1)}, ROE %${fundamentals.roe?.toFixed(1) || 0}`,
    };
}

/**
 * Wonderkid skoru oluştur
 */
function getMockWonderkidScore(symbol: string): WonderkidScore {
    const asset = findAsset(symbol);
    const sector = asset?.sector || 'Diğer';

    // Yüksek potansiyelli sektörler
    const highPotentialSectors = ['Teknoloji', 'Savunma', 'Havacılık', 'Enerji', 'Yarı İletken'];
    const isHighPotential = highPotentialSectors.includes(sector);

    const baseScore = 30 + getSeededRandom(symbol, 50) * 50;
    const wonderkidSkor = isHighPotential ? baseScore + 20 : baseScore;
    const potansiyelYildiz = wonderkidSkor > 60;

    return {
        kod: symbol,
        ad: asset?.name || symbol,
        wonderkidSkor: Math.round(wonderkidSkor),
        potansiyelYildiz,
        nedenler: potansiyelYildiz
            ? [`${sector} sektörü`, 'Yüksek büyüme potansiyeli', 'Global trend uyumu']
            : ['Ortalama göstergeler'],
        riskler: ['Piyasa volatilitesi', sector === 'Teknoloji' ? 'Regülasyon riski' : 'Sektörel riskler'],
        sektor: sector,
        trendEslesmesi: potansiyelYildiz ? ['YUKARI', 'HACIM'] : ['YATAY'],
    };
}

/**
 * Cronos sonucu
 */
function getMockCronosResult(): CronosResult {
    const engine = CronosEngine.getInstance();
    return engine.analyze();
}

/**
 * Athena sonucu
 */
function getMockAthenaResult(symbol: string, fundamentals: any): AthenaResult {
    const engine = AthenaEngine.getInstance();

    return engine.analyze(symbol, {
        return12M: fundamentals.return12M || 20,
        return6M: fundamentals.return6M || 10,
        return1M: fundamentals.return1M || 2,
        peRatio: fundamentals.fk || 12,
        pbRatio: fundamentals.pddd || 1.5,
        dividendYield: fundamentals.dividendYield || 2,
        roe: fundamentals.roe || 15,
        debtToEquity: fundamentals.borcOzkaynak || 0.8,
        netProfitMargin: fundamentals.netProfitMargin || 12,
        marketCap: fundamentals.piyasaDegeri || 10000000000,
        beta: fundamentals.beta || 1,
        volatility30D: fundamentals.volatility30D || 25,
    });
}

/**
 * Piyasa haberleri oluştur
 */
function getMockPiyasaHaberleri(symbol: string): Array<{ kaynak: string; baslik: string; etkisi: 'pozitif' | 'negatif' | 'nötr' }> {
    const asset = findAsset(symbol);
    const haberler: Array<{ kaynak: string; baslik: string; etkisi: 'pozitif' | 'negatif' | 'nötr' }> = [];

    const isUS = asset?.market === 'NASDAQ' || asset?.market === 'NYSE';
    const isFund = asset?.market === 'TEFAS';

    // Rastgele ama tutarlı haber sayısı
    const haberCount = Math.floor(getSeededRandom(symbol, 60) * 3);

    const pozitifHaberler = isUS
        ? [
            { kaynak: 'Bloomberg', baslik: `${asset?.name || symbol} Beats Earnings Expectations` },
            { kaynak: 'Reuters', baslik: 'Analyst Upgrades Rating to Buy' },
            { kaynak: 'WSJ', baslik: 'Strong Growth Momentum Continues' },
        ]
        : isFund
        ? [
            { kaynak: 'TEFAS', baslik: 'Fon getirisinde artış devam ediyor' },
            { kaynak: 'FinansGündem', baslik: 'Yatırımcı ilgisi artıyor' },
          ]
        : [
            { kaynak: 'Bloomberg HT', baslik: `${asset?.name || symbol} güçlü bilanço açıkladı` },
            { kaynak: 'AA Finans', baslik: 'Yurt dışı ilginin artışı bekleniyor' },
            { kaynak: 'Mynet', baslik: 'Sektördeki pozitif ayrışma sürüyor' },
          ];

    const negatifHaberler = isUS
        ? [
            { kaynak: 'Bloomberg', baslik: 'Market Volatility Impacts Sector' },
            { kaynak: 'Reuters', baslik: 'Analyst Cuts Price Target' },
          ]
        : [
            { kaynak: 'Bloomberg HT', baslik: 'Kur hareketi etkisi sürüyor' },
            { kaynak: 'AA Finans', baslik: 'Sektörel belirsizlik arttı' },
          ];

    for (let i = 0; i < haberCount; i++) {
        const isPozitif = getSeededRandom(symbol, 61 + i) > 0.3;
        const kaynak = isPozitif ? pozitifHaberler : negatifHaberler;
        const haber = kaynak[i % kaynak.length];
        haberler.push({
            ...haber,
            etkisi: isPozitif ? 'pozitif' : 'negatif',
        });
    }

    return haberler;
}

// ===== MAIN HANDLER =====

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get('symbol') || 'ASELS';
    const format = searchParams.get('format') || 'json'; // json | text

    try {
        const symbolUpper = symbol.toUpperCase();

        // Varlık kontrolü
        const asset = findAsset(symbolUpper);
        if (!asset) {
            return NextResponse.json({
                success: false,
                error: `Varlık bulunamadı: ${symbolUpper}. Desteklenen sembolleri /api/stocks endpoint'inden kontrol edin.`,
            }, { status: 404 });
        }

        const candles = getMockCandles(symbolUpper);
        const fundamentals = getMockFundamentals(symbolUpper);

        // Varlık tipi tespiti
        const poseidon = PoseidonEngine.getInstance();
        const varlikTipi: AssetType = poseidon.detectAssetType(symbolUpper);
        const poseidonResult: PoseidonResult = await poseidon.analyze('BALANCED');

        // 1. Orion (Teknik)
        const orionEngine = OrionEngine.getInstance();
        const orionResult = orionEngine.analyze(symbolUpper, candles);

        // 2. Atlas (Temel)
        const atlasResult = getMockAtlasResult(symbolUpper, fundamentals);

        // 3. Wonderkid (Sektör)
        const wonderkidScore = getMockWonderkidScore(symbolUpper);

        // 4. Cronos (Zamanlama)
        const cronosResult = getMockCronosResult();

        // 5. Athena (Faktör)
        const athenaResult = getMockAthenaResult(symbolUpper, fundamentals);

        // 6. Hermes (Sentiment)
        const hermesScore = 0.4 + getSeededRandom(symbolUpper, 70) * 0.4;

        // 7. Aether (Makro)
        const aetherRegime = getSeededRandom(symbolUpper, 71) > 0.5 ? 'RISK_ON' : 'RISK_OFF';

        // 8. Phoenix (Strateji)
        const phoenixMatch = getSeededRandom(symbolUpper, 72) > 0.4;

        // Fiyat bilgisi
        const currentPrice = candles[candles.length - 1].close;
        const prevPrice = candles[candles.length - 2].close;
        const degisim = currentPrice - prevPrice;
        const degisimPercent = (degisim / prevPrice) * 100;
        const hacim = candles[candles.length - 1].volume;

        // ===== GÖRÜŞLER TOPLA =====
        const modulGorusleri: ModulGorus[] = [
            atlasGorus(atlasResult),
            wonderkidGorus(wonderkidScore),
            orionGorus(orionResult),
            athenaV2Gorus(athenaResult),
            hermesGorus(hermesScore, 42),
            aetherGorus(aetherRegime, 14.5),
            phoenixGorus(phoenixMatch, 'Momentum Scan'),
            cronosGorus(cronosResult),
            poseidonGorus(varlikTipi, poseidonResult.details.join(', ')),
            chironGorus(2.0, { [asset.sector]: 35 }, true),
        ];

        // ===== GRAND COUNCIL TOPLANTISI =====
        const oylar = modulGorusleri.map(g => ({
            modul: g.modul,
            oy: g.oy,
            guven: g.guven,
            aciklama: g.gorus.substring(0, 100),
            icon: g.icon,
        }));

        const councilKarar = grandCouncil(symbolUpper, varlikTipi, oylar);

        // ===== ARGUS RAPORU =====
        const piyasaHaberleri = getMockPiyasaHaberleri(symbolUpper);

        const argusRapor = argusRaporOlustur(
            symbolUpper,
            varlikTipi,
            {
                fiyat: currentPrice,
                degisim,
                degisimPercent,
                hacim,
            },
            modulGorusleri,
            councilKarar,
            piyasaHaberleri
        );

        // ===== FORMAT =====
        if (format === 'text') {
            return new NextResponse(argusRaporToText(argusRapor), {
                headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
        }

        // JSON format
        return NextResponse.json({
            success: true,
            data: {
                symbol: symbolUpper,
                varlikTipi,
                varlikBilgisi: {
                    ad: asset.name,
                    sektor: asset.sector,
                    piyasa: asset.market,
                    altPiyasa: asset.subMarket,
                },
                timestamp: new Date().toISOString(),
                fiyat: {
                    fiyat: currentPrice,
                    degisim,
                    degisimPercent,
                    hacim,
                },
                moduller: {
                    atlas: { ...atlasResult, gorus: modulGorusleri[0] },
                    demeter: { ...wonderkidScore, gorus: modulGorusleri[1] },
                    orion: { ...orionResult, gorus: modulGorusleri[2] },
                    athena: { ...athenaResult, gorus: modulGorusleri[3] },
                    hermes: { score: hermesScore, gorus: modulGorusleri[4] },
                    aether: { regime: aetherRegime, vix: 14.5, gorus: modulGorusleri[5] },
                    phoenix: { isMatch: phoenixMatch, gorus: modulGorusleri[6] },
                    cronos: { ...cronosResult, gorus: modulGorusleri[7] },
                    poseidon: { varlikTipi, weights: poseidon.getWeights(varlikTipi), gorus: modulGorusleri[8] },
                    chiron: { maxRiskR: 2.0, sectorExposure: { [asset.sector]: 35 }, gorus: modulGorusleri[9] },
                },
                grandCouncil: councilKarar,
                argusRapor,
            },
        });

    } catch (error) {
        console.error('Complete Analysis Error:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        }, { status: 500 });
    }
}

// POST endpoint for batch analysis
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { symbols } = body;

        if (!Array.isArray(symbols) || symbols.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'symbols array required',
            }, { status: 400 });
        }

        const results = [];

        for (const symbol of symbols.slice(0, 20)) { // Max 20 symbols
            const mockRequest = new Request(
                `${request.url.split('?')[0]}?symbol=${symbol}&format=json`
            );
            const response = await GET(mockRequest as NextRequest);
            const data = await response.json();
            results.push(data.data);
        }

        return NextResponse.json({
            success: true,
            count: results.length,
            data: results,
        });

    } catch (error) {
        console.error('Batch Analysis Error:', error);

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Bilinmeyen hata',
        }, { status: 500 });
    }
}
