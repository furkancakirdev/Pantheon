/**
 * ABD Hisse Growth Strategy Modülü
 *
 * Yapılacaklar 6.txt - "BÖLÜM 5: ABD PİYASASI VE FONLAR İÇİN STRATEJİ":
 * BIST'teki "Yaşar Erdinç" faturaları (PD/DD, F/K) ABD hisseleri için geçerli değildir.
 * Tesla, Amazon gibi hisselerin F/K oranı hep yüksektir, yine de yükselirler.
 *
 * ABD için "Büyüme Stratejisi" (Growth Strategy) uygulanmalı:
 * - PEG Ratio (F/K'ya göre büyüme hızı)
 * - Revenue Growth (Gelir büyümesi)
 * - EPS Surprise (Kâr beklentisini aşma)
 * - Döviz Riski hesaplama
 *
 * Kullanım:
 * import { analyzeUSStock } from '@analysis/us-growth';
 * const result = analyzeUSStock('AAPL', fundamentalData, priceData, usdTryRate);
 */

// ============ TYPES ============

/**
 * ABD Hisse Temel Verileri
 */
export interface USFundamentalData {
    symbol: string;
    // Fiyat
    price: number;
    marketCap: number;        // Milyar USD
    sharesOutstanding: number;

    // Büyüme metrikleri
    revenueGrowth: number;    // Yıllık gelir büyümesi (%)
    earningsGrowth: number;   // Yıllık kâr büyümesi (%)

    // Karlılık
    eps: number;              // Earnings Per Share (TTM)
    epsEstimate: number;      // Gelecek dönem beklentisi
    epsSurprise?: number;     // Son财报 sürprizi (%)

    // Değerleme
    peRatio: number;          // P/E (TTM)
    pegRatio?: number;        // PEG (P/E / Growth)
    pbRatio?: number;         // P/B
    psRatio?: number;         // P/S

    // Kalite
    roe?: number;             // Return on Equity (%)
    roa?: number;             // Return on Assets (%)
    debtToEquity?: number;    // D/E

    // Teknik
    rsi52?: number;           // 52 hafta RSI
    vol52w?: number;          // 52 hafta volatility
}

/**
 * Fiyat Verileri
 */
export interface PriceData {
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    avgVolume: number;        // Ortalama günlük hacim
    dayHigh52: number;        // 52 hafta en yüksek
    dayLow52: number;         // 52 hafta en düşük
}

/**
 * ABD Hisse Analiz Sonucu
 */
export interface USStockAnalysis {
    symbol: string;
    strategy: 'GROWTH' | 'VALUE' | 'QUALITY' | 'MOMENTUM' | 'AVOID';
    score: number;            // 0-100

    // Bileşen skorlar
    growthScore: number;      // Büyüme skoru
    valueScore: number;       // Değerleme skoru
    qualityScore: number;     // Kalite skoru
    momentumScore: number;    // Momentum skoru

    // Sinyaller
    verdict: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'AVOID';
    verdictTr: string;

    // Detaylı analiz
    analysis: {
        // Büyüme analizi
        growthAnalysis: string;
        revenueGrowthRating: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
        earningsTrend: 'ACCELERATING' | 'STABLE' | 'DECELERATING' | 'DECLINING';

        // Değerleme analizi
        valuationAnalysis: string;
        pegRating: 'UNDERVALUED' | 'FAIR' | 'OVERVALUED';
        relativeValuation: string;

        // Kalite analizi
        qualityAnalysis: string;
        grade: 'A+' | 'A' | 'B' | 'C' | 'D';

        // Teknik analiz
        technicalAnalysis: string;
        position52w: 'NEAR_HIGH' | 'MID_RANGE' | 'NEAR_LOW';
        volumeSignal: string;
    };

    // Risk faktörleri
    risks: {
        currencyRisk: number;     // Döviz riski (0-100)
        volatilityRisk: number;   // Volatilite riski
        concentrationRisk: number; // Konsantrasyon riski
    };

    // Özet
    summary: string;
    recommendation: string;

    // TL bazlı (Türk yatırımcı için)
    tryAnalysis?: {
        priceTRY: number;
        changeTRY: number;
        changeTRYPercent: number;
        currencyEffect: string;
    };
}

// ============ HELPER FUNCTIONS ============

/**
 * PEG Ratio hesapla (P/E / Growth)
 */
export function calculatePEG(peRatio: number, earningsGrowth: number): number {
    if (earningsGrowth <= 0) return 999;  // Negatif büyüme = çok riskli
    return peRatio / earningsGrowth;
}

/**
 * EPS Surprise hesapla
 */
export function calculateEPSSurprise(actualEPS: number, estimatedEPS: number): number {
    if (estimatedEPS === 0) return 0;
    return ((actualEPS - estimatedEPS) / estimatedEPS) * 100;
}

/**
 * Büyüme skorunu hesapla (0-100)
 */
export function calculateGrowthScore(data: USFundamentalData): number {
    let score = 50;  // Baz skor

    // Gelir büyümesi
    if (data.revenueGrowth >= 30) score += 25;
    else if (data.revenueGrowth >= 20) score += 20;
    else if (data.revenueGrowth >= 10) score += 10;
    else if (data.revenueGrowth >= 5) score += 5;
    else if (data.revenueGrowth < 0) score -= 20;

    // Kâr büyümesi
    if (data.earningsGrowth >= 30) score += 20;
    else if (data.earningsGrowth >= 20) score += 15;
    else if (data.earningsGrowth >= 10) score += 10;
    else if (data.earningsGrowth < 0) score -= 15;

    // EPS Surprise (varsa)
    if (data.epsSurprise !== undefined) {
        if (data.epsSurprise >= 10) score += 5;
        else if (data.epsSurprise >= 5) score += 3;
        else if (data.epsSurprise <= -5) score -= 5;
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Değerleme skorunu hesapla (0-100)
 */
export function calculateValueScore(data: USFundamentalData): number {
    let score = 50;

    // PEG Ratio (varsa) - En önemli değerleme metriği
    if (data.pegRatio !== undefined) {
        if (data.pegRatio < 1) score += 30;  // UCuz
        else if (data.pegRatio < 1.5) score += 15;
        else if (data.pegRatio > 3) score -= 20;  // Pahalı
    }

    // P/E (sız) - Büyüme hisseleri için yüksek P/E normal
    const growthAdjustedPE = data.peRatio / Math.max(1, data.earningsGrowth / 10);
    if (growthAdjustedPE < 1) score += 10;
    else if (growthAdjustedPE > 3) score -= 10;

    // P/S (varsa)
    if (data.psRatio !== undefined) {
        if (data.psRatio < 2) score += 10;
        else if (data.psRatio > 10) score -= 10;
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Kalite skorunu hesapla (0-100)
 */
export function calculateQualityScore(data: USFundamentalData): number {
    let score = 50;

    // ROE
    if (data.roe !== undefined) {
        if (data.roe >= 20) score += 20;
        else if (data.roe >= 15) score += 15;
        else if (data.roe >= 10) score += 10;
        else if (data.roe < 5) score -= 15;
    }

    // ROA
    if (data.roa !== undefined) {
        if (data.roa >= 10) score += 10;
        else if (data.roa >= 5) score += 5;
        else if (data.roa < 0) score -= 20;
    }

    // D/E
    if (data.debtToEquity !== undefined) {
        if (data.debtToEquity < 0.5) score += 10;
        else if (data.debtToEquity > 2) score -= 15;
    }

    // Piyasa değeri (Liquidity premium)
    if (data.marketCap > 100) score += 10;  // Large cap
    else if (data.marketCap > 10) score += 5;  // Mid cap
    else score -= 5;  // Small cap = riskli

    return Math.max(0, Math.min(100, score));
}

/**
 * Momentum skorunu hesapla (0-100)
 */
export function calculateMomentumScore(fundamental: USFundamentalData, price: PriceData): number {
    let score = 50;

    // 52 hafta pozisyonu
    const range52 = price.dayHigh52 - price.dayLow52;
    const positionInRange = (price.price - price.dayLow52) / range52;

    if (positionInRange >= 0.8) {
        score += 20;  // Zirve yakın = güçlü momentum
    } else if (positionInRange >= 0.6) {
        score += 10;
    } else if (positionInRange <= 0.2) {
        score -= 10;  // Dip yakın = zayıf momentum (veya fırsat)
    }

    // Hacim sinyali
    const volumeRatio = price.volume / price.avgVolume;
    if (volumeRatio > 1.5) score += 15;  // Yüksek hacim
    else if (volumeRatio < 0.5) score -= 10;

    // Değişim
    if (price.changePercent > 2) score += 10;
    else if (price.changePercent < -2) score -= 10;

    // RSI (varsa)
    if (fundamental.rsi52 !== undefined) {
        if (fundamental.rsi52 >= 50 && fundamental.rsi52 <= 70) score += 10;
        else if (fundamental.rsi52 > 70) score -= 5;  // Overbought
        else if (fundamental.rsi52 < 30) score += 5;  // Oversold = fırsat
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Strateji tipi belirle
 */
export function determineStrategy(
    growthScore: number,
    valueScore: number,
    qualityScore: number,
    momentumScore: number
): USStockAnalysis['strategy'] {
    const avgScore = (growthScore + valueScore + qualityScore + momentumScore) / 4;

    if (growthScore >= 70 && avgScore >= 60) return 'GROWTH';
    if (valueScore >= 70 && avgScore >= 60) return 'VALUE';
    if (qualityScore >= 70 && avgScore >= 60) return 'QUALITY';
    if (momentumScore >= 70 && avgScore >= 55) return 'MOMENTUM';
    if (avgScore < 40) return 'AVOID';

    // En yüksek skora göre
    const scores = { growthScore, valueScore, qualityScore, momentumScore };
    const maxScore = Math.max(...Object.values(scores));

    if (maxScore === growthScore) return 'GROWTH';
    if (maxScore === valueScore) return 'VALUE';
    if (maxScore === qualityScore) return 'QUALITY';
    if (maxScore === momentumScore) return 'MOMENTUM';

    return 'VALUE';
}

// ============ MAIN ANALYSIS FUNCTION ============

export function analyzeUSStock(
    fundamental: USFundamentalData,
    price: PriceData,
    usdTryRate: number = 35
): USStockAnalysis {
    // Skorları hesapla
    const growthScore = calculateGrowthScore(fundamental);
    const valueScore = calculateValueScore(fundamental);
    const qualityScore = calculateQualityScore(fundamental);
    const momentumScore = calculateMomentumScore(fundamental, price);

    // Genel skor
    const score = Math.round((growthScore * 0.35 + valueScore * 0.25 + qualityScore * 0.2 + momentumScore * 0.2));

    // Strateji
    const strategy = determineStrategy(growthScore, valueScore, qualityScore, momentumScore);

    // Karar
    let verdict: USStockAnalysis['verdict'];
    let verdictTr: string;

    if (score >= 80) {
        verdict = 'STRONG_BUY';
        verdictTr = 'GÜÇLÜ AL';
    } else if (score >= 65) {
        verdict = 'BUY';
        verdictTr = 'AL';
    } else if (score >= 40) {
        verdict = 'HOLD';
        verdictTr = 'BEKLE';
    } else if (score >= 25) {
        verdict = 'SELL';
        verdictTr = 'SAT';
    } else {
        verdict = 'AVOID';
        verdictTr = 'KAÇIN';
    }

    // Detaylı analizler
    const revenueGrowthRating: USStockAnalysis['analysis']['revenueGrowthRating'] =
        fundamental.revenueGrowth >= 20 ? 'EXCELLENT' :
        fundamental.revenueGrowth >= 10 ? 'GOOD' :
        fundamental.revenueGrowth >= 0 ? 'FAIR' : 'POOR';

    const earningsTrend: USStockAnalysis['analysis']['earningsTrend'] =
        fundamental.earningsGrowth > fundamental.revenueGrowth ? 'ACCELERATING' :
        fundamental.earningsGrowth > 0 ? 'STABLE' :
        fundamental.earningsGrowth > -10 ? 'DECELERATING' : 'DECLINING';

    const pegRating: USStockAnalysis['analysis']['pegRating'] =
        fundamental.pegRatio !== undefined ?
            (fundamental.pegRatio < 1 ? 'UNDERVALUED' :
             fundamental.pegRatio < 2 ? 'FAIR' : 'OVERVALUED') :
            'FAIR';

    const range52 = price.dayHigh52 - price.dayLow52;
    const positionInRange = (price.price - price.dayLow52) / range52;
    const position52w: USStockAnalysis['analysis']['position52w'] =
        positionInRange >= 0.75 ? 'NEAR_HIGH' :
        positionInRange >= 0.25 ? 'MID_RANGE' : 'NEAR_LOW';

    const volumeRatio = price.volume / price.avgVolume;
    const volumeSignal = volumeRatio > 1.5 ? 'GÜÇLÜ HACİM' :
                         volumeRatio < 0.5 ? 'ZAYIF HACİM' : 'NORMAL HACİM';

    const grade: USStockAnalysis['analysis']['grade'] =
        qualityScore >= 90 ? 'A+' :
        qualityScore >= 75 ? 'A' :
        qualityScore >= 60 ? 'B' :
        qualityScore >= 45 ? 'C' : 'D';

    // Analiz metinleri
    const growthAnalysis = `${fundamental.symbol} gelir büyümesi %${fundamental.revenueGrowth} ile ${revenueGrowthRating} seviyede. ` +
        `Kâr büyümesi %${fundamental.earningsGrowth}. ` +
        (fundamental.epsSurprise !== undefined ?
            `Son财报da EPS beklentiyi %${fundamental.epsSurprise.toFixed(1)} ${fundamental.epsSurprise >= 0 ? 'aştı' : 'aşamadı'}.` :
            '');

    const valuationAnalysis = `P/E: ${fundamental.peRatio.toFixed(1)}x. ` +
        (fundamental.pegRatio !== undefined ? `PEG: ${fundamental.pegRatio.toFixed(2)} (${pegRating}). ` : '') +
        (fundamental.psRatio !== undefined ? `P/S: ${fundamental.psRatio.toFixed(1)}x. ` : '') +
        `Değerleme ${pegRating === 'UNDERVALUED' ? 'UCUZ' : pegRating === 'OVERVALUED' ? 'PAHALI' : 'ADİL'} bölgede.`;

    const qualityAnalysis = `ROE: %${fundamental.roe?.toFixed(1) || 'N/A'}. ` +
        `D/E: ${fundamental.debtToEquity?.toFixed(2) || 'N/A'}. ` +
        `Piyasa değeri: $${fundamental.marketCap}B. ` +
        `Kalite notu: ${grade}.`;

    const technicalAnalysis = `52 hafta aralığında ${position52w === 'NEAR_HIGH' ? 'yüksek' : position52w === 'NEAR_LOW' ? 'düşük' : 'orta'} seviyede. ` +
        `Hacim: ${volumeSignal}. ` +
        `Değişim: %${price.changePercent.toFixed(2)}.`;

    // Riskler
    const currencyRisk = Math.abs(usdTryRate - 35) * 2;  // Kur volatilitesi
    const volatilityRisk = fundamental.vol52w ?? 50;
    const concentrationRisk = fundamental.marketCap < 10 ? 80 :
                              fundamental.marketCap < 50 ? 50 : 20;

    // Özet
    const summary = `${fundamental.symbol} için ${strategy} stratejisi uygulanıyor. ` +
        `Genel skor: ${score}/100. ` +
        `Verdict: ${verdictTr}.`;

    const recommendation =
        verdict === 'STRONG_BUY' ? `💪 ${fundamental.symbol} güçlü büyüme ve kalite gösteriyor. Portföy eklemesi yapılabilir.` :
        verdict === 'BUY' ? `✅ ${fundamental.symbol} olumlu görünüyor. Kademeli alım düşünülebilir.` :
        verdict === 'HOLD' ? `⏸️ ${fundamental.symbol} nötr bölgede. Mevcut pozisyonu koru veya bekle.` :
        verdict === 'SELL' ? `📉 ${fundamental.symbol} zayıflıyor. Kar almayı düşün.` :
        `⚠️ ${fundamental.symbol} riskli. Kaçınılması önerilir.`;

    // TL analizi
    const priceTRY = price.price * usdTryRate;
    const changeTRY = price.change * usdTryRate;
    const changeTRYPercent = ((priceTRY / (price.price - price.change) - 1) * 100);

    const tryAnalysis = {
        priceTRY: Math.round(priceTRY * 100) / 100,
        changeTRY: Math.round(changeTRY * 100) / 100,
        changeTRYPercent: Math.round(changeTRYPercent * 100) / 100,
        currencyEffect: usdTryRate > 35 ? 'Dolar artışı TL getiriyi artırdı' :
                         usdTryRate < 35 ? 'Dolar düşüşü TL getiriyi azalttı' :
                         'Kur etkisi nötr',
    };

    return {
        symbol: fundamental.symbol,
        strategy,
        score,
        growthScore,
        valueScore,
        qualityScore,
        momentumScore,
        verdict,
        verdictTr,
        analysis: {
            growthAnalysis,
            revenueGrowthRating,
            earningsTrend,
            valuationAnalysis,
            pegRating,
            relativeValuation: pegRating === 'UNDERVALUED' ? 'Sektör ortalamasının altında' :
                              pegRating === 'OVERVALUED' ? 'Sektör ortalamasının üstünde' :
                              'Sektör ortalamasında',
            qualityAnalysis,
            grade,
            technicalAnalysis,
            position52w,
            volumeSignal,
        },
        risks: {
            currencyRisk,
            volatilityRisk,
            concentrationRisk,
        },
        summary,
        recommendation,
        tryAnalysis,
    };
}

/**
 * Mock veri ile analiz (test için)
 */
export function analyzeUSStockMock(
    symbol: string,
    price: number,
    usdTryRate: number = 35
): USStockAnalysis {
    // Mock data generator (seeded with symbol hash for consistency)
    const hash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);

    const fundamental: USFundamentalData = {
        symbol,
        price,
        marketCap: ((hash % 1000) + 10),
        sharesOutstanding: 1000,
        revenueGrowth: (hash % 40) - 5,  // -5 to 35
        earningsGrowth: (hash % 50) - 10,  // -10 to 40
        eps: ((hash % 100) / 10) + 1,
        epsEstimate: ((hash % 100) / 10) + 1.5,
        epsSurprise: (hash % 20) - 10,  // -10 to 10
        peRatio: ((hash % 50) + 10),
        pegRatio: ((hash % 30) / 10) + 0.5,
        pbRatio: ((hash % 10) + 1),
        psRatio: ((hash % 20) + 1),
        roe: ((hash % 30) + 5),
        roa: ((hash % 20) + 2),
        debtToEquity: ((hash % 200) / 100),
    };

    const priceData: PriceData = {
        price,
        change: ((hash % 10) - 5),
        changePercent: ((hash % 10) - 5),
        volume: ((hash % 100) + 50) * 1000000,
        avgVolume: 75 * 1000000,
        dayHigh52: price * 1.3,
        dayLow52: price * 0.7,
    };

    return analyzeUSStock(fundamental, priceData, usdTryRate);
}

/**
 * ABD hissesi mi kontrol et
 */
export function isUSStock(symbol: string): boolean {
    // ABD hisse kodları genelde 1-4 harf
    if (symbol.length > 5) return false;

    // BIST kodları genelde 5 harf ve biter
    if (symbol.length === 5 && /^[A-Z]{5}$/.test(symbol)) return false;

    // ETF'ler
    if (symbol.startsWith('QQQ') || symbol.startsWith('SPY') || symbol.startsWith('IWM') ||
        symbol.startsWith('TLT') || symbol.startsWith('GLD') || symbol.startsWith('SLV')) {
        return true;
    }

    // Tekrar eden harf kontrolü (BIST hisselerinde sıralı harfler yaygın)
    const hasRepeatedChars = /(.)\1{2,}/.test(symbol);
    if (hasRepeatedChars && symbol.length >= 3) return false;

    return true;
}

export default {
    analyzeUSStock,
    analyzeUSStockMock,
    isUSStock,
    calculatePEG,
    calculateEPSSurprise,
    calculateGrowthScore,
    calculateValueScore,
    calculateQualityScore,
    calculateMomentumScore,
};
