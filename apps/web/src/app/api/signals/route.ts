
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ==================== INLINE TYPES ====================

interface StockFundamentals {
    kod: string;
    ad: string;
    sektor: string;
    kapanis: number;
    fk: number;
    pddd: number;
    fdFavok: number;
    roe: number;
    borcOzkaynak: number;
    piyasaDegeri: number;
    yabanciOran: number;
}

interface MarketData {
    xu100: { deger: number; degisim: number; degisimOran: number };
    xu030: { deger: number; degisim: number; degisimOran: number };
    dolar: { alis: number; satis: number; degisim: number };
    altin: { alis: number; satis: number; degisim: number };
}

// ==================== MOCK DATA FALLBACK ====================
const MOCK_STOCKS: StockFundamentals[] = [
    { kod: 'THYAO', ad: 'TÜRK HAVA YOLLARI', sektor: 'Ulaştırma', kapanis: 295.5, fk: 3.5, pddd: 0.8, fdFavok: 4.2, roe: 35, borcOzkaynak: 1.2, piyasaDegeri: 400000000, yabanciOran: 45 },
    { kod: 'ASELS', ad: 'ASELSAN', sektor: 'Savunma', kapanis: 62.15, fk: 12.4, pddd: 2.1, fdFavok: 9.8, roe: 28, borcOzkaynak: 0.4, piyasaDegeri: 200000000, yabanciOran: 30 },
    { kod: 'GARAN', ad: 'GARANTİ BANKASI', sektor: 'Bankacılık', kapanis: 85.0, fk: 4.1, pddd: 1.1, fdFavok: 0, roe: 40, borcOzkaynak: 8.5, piyasaDegeri: 350000000, yabanciOran: 55 },
    { kod: 'KCHOL', ad: 'KOÇ HOLDİNG', sektor: 'Holding', kapanis: 190.2, fk: 5.2, pddd: 1.3, fdFavok: 5.5, roe: 32, borcOzkaynak: 0.9, piyasaDegeri: 500000000, yabanciOran: 60 },
    { kod: 'TUPRS', ad: 'TÜPRAŞ', sektor: 'Kimya', kapanis: 165.4, fk: 6.8, pddd: 2.5, fdFavok: 6.1, roe: 45, borcOzkaynak: 1.1, piyasaDegeri: 300000000, yabanciOran: 50 },
];

const MOCK_MARKET: MarketData = {
    xu100: { deger: 9250.45, degisim: 120.5, degisimOran: 1.32 },
    xu030: { deger: 10100.20, degisim: 140.2, degisimOran: 1.40 },
    dolar: { alis: 33.50, satis: 33.55, degisim: 0.15 },
    altin: { alis: 2450, satis: 2465, degisim: -0.5 },
};

// ==================== API HELPERS ====================

async function fetchWithRetry(url: string, options: RequestInit, retries = 1): Promise<any> {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://www.isyatirim.com.tr/',
                'Origin': 'https://www.isyatirim.com.tr',
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-Requested-With': 'XMLHttpRequest',
                ...options.headers,
            }
        });

        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error(`JSON Parse Error for ${url}:`, text.substring(0, 100));
            throw new Error('Invalid JSON response');
        }
    } catch (error) {
        if (retries > 0) return fetchWithRetry(url, options, retries - 1);
        throw error;
    }
}

// İş Yatırım API
async function fetchAllStocks(): Promise<StockFundamentals[]> {
    try {
        const data = await fetchWithRetry(
            'https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/Data.aspx/HisseSenetleri',
            { method: 'POST', body: JSON.stringify({}) }
        );
        return data.d || [];
    } catch (e) {
        console.error("İş Yatırım API Failed, using MOCK:", e);
        return MOCK_STOCKS;
    }
}

// Mynet API
async function fetchRealTimeMarket(): Promise<MarketData> {
    try {
        const data = await fetchWithRetry(
            'https://finans.mynet.com/api/real-time',
            { method: 'GET' }
        );
        return data || MOCK_MARKET;
    } catch (e) {
        console.error("Mynet API Failed, using MOCK:", e);
        return MOCK_MARKET;
    }
}

// Erdinç Skor Hesaplama
function hesaplaErdincSkor(hisse: StockFundamentals): number {
    let skor = 15;
    if (hisse.borcOzkaynak <= 0.8) skor += 25;
    else if (hisse.borcOzkaynak <= 1.5) skor += 18;
    else if (hisse.borcOzkaynak <= 2.0) skor += 10;

    if (hisse.fk > 0 && hisse.fk <= 15) skor += 12;
    else if (hisse.fk > 15 && hisse.fk <= 20) skor += 8;

    if (hisse.pddd > 0 && hisse.pddd <= 1.5) skor += 13;
    else if (hisse.pddd > 0 && hisse.pddd <= 2.0) skor += 8;

    if (hisse.roe >= 20) skor += 25;
    else if (hisse.roe >= 15) skor += 18;
    else if (hisse.roe > 0) skor += 10;

    return skor;
}

function getVerdictFromScore(score: number): string {
    if (score >= 85) return 'GÜÇLÜ AL';
    if (score >= 70) return 'AL';
    if (score >= 50) return 'TUT';
    if (score >= 30) return 'AZALT';
    return 'SAT';
}

function getVoteFromScore(score: number): 'BUY' | 'SELL' | 'HOLD' {
    if (score >= 70) return 'BUY';
    if (score < 40) return 'SELL';
    return 'HOLD';
}

// ==================== CORS HEADERS ====================
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle OPTIONS request for CORS
export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

// ==================== MAIN API HANDLER ====================

export async function GET() {
    try {
        console.log("🏛️ Pantheon Analiz (Safe Mode) Başlatılıyor...");

        // 1. Verileri Çek
        const [allStocks, marketData] = await Promise.all([
            fetchAllStocks(),
            fetchRealTimeMarket()
        ]);

        console.log(`✅ ${allStocks.length} hisse ve piyasa verisi hazır`);

        // 2. Erdinç Skorlama
        const skorluHisseler = allStocks
            .map(hisse => ({ ...hisse, toplamSkor: hesaplaErdincSkor(hisse) }))
            .sort((a, b) => b.toplamSkor - a.toplamSkor);

        const top10 = skorluHisseler.slice(0, 10);

        // 3. Makro - VIX (Sabit veya Mynet'ten varsa)
        const vix = 18.5;
        const regime = 'NEUTRAL';

        // 4. Sinyalleri Oluştur
        const signals = top10.map(stock => {
            const atlasScore = stock.toplamSkor;
            const orionScore = 65; // Mock momentum score
            const aetherScore = 55;
            const phoenixScore = Math.floor((atlasScore + orionScore) / 2);

            const coreScore = Math.floor(
                (atlasScore * 0.35) +
                (orionScore * 0.30) +
                (aetherScore * 0.15) +
                (phoenixScore * 0.20)
            );

            return {
                symbol: stock.kod,
                name: stock.ad || stock.kod,
                coreScore,
                pulseScore: orionScore,
                price: stock.kapanis || 0,
                fk: stock.fk,
                pddd: stock.pddd,
                verdict: getVerdictFromScore(coreScore),
                modules: [
                    { module: 'Atlas', icon: '🗺️', vote: getVoteFromScore(atlasScore), confidence: atlasScore, reason: `F/K: ${stock.fk?.toFixed(1) || '-'}, PD/DD: ${stock.pddd?.toFixed(1) || '-'}` },
                    { module: 'Orion', icon: '⭐', vote: 'BUY' as const, confidence: orionScore, reason: 'Yükseliş Trendi' },
                    { module: 'Aether', icon: '🌤️', vote: 'HOLD' as const, confidence: aetherScore, reason: `Rejim: ${regime}` },
                    { module: 'Phoenix', icon: '🔥', vote: getVoteFromScore(phoenixScore), confidence: phoenixScore, reason: 'Güçlü Temel' },
                ],
                lastUpdate: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
            };
        });

        return NextResponse.json({
            success: true,
            data: {
                signals,
                market: {
                    xu100: marketData?.xu100?.deger || 0,
                    xu100Change: marketData?.xu100?.degisimOran || 0,
                    xu030: marketData?.xu030?.deger || 0,
                    usdtry: marketData?.dolar?.satis || 0,
                    gold: marketData?.altin?.satis || 0,
                    vix,
                    regime,
                },
                meta: {
                    totalStocks: allStocks.length,
                    analysisTime: new Date().toISOString(),
                    summary: `${allStocks.length} hisse analiz edildi.`
                }
            }
        }, { headers: corsHeaders });

    } catch (error) {
        console.error('❌ CRITICAL ERROR:', error);
        return NextResponse.json(
            { success: false, error: 'Analiz hatası', details: String(error) },
            { status: 500, headers: corsHeaders }
        );
    }
}
