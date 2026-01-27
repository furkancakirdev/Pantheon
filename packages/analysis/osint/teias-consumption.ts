/**
 * TEİAŞ Elektrik Tüketimi Modülü
 *
 * Yapılacaklar 4.txt - "MODÜL 3: DEMETER OSINT (REEL EKONOMİ İZLEME)":
 * TEİAŞ (Sanayi Elektrik Tüketimi)
 * - Organize Sanayi Bölgeleri'nin elektrik tüketimi düşüyorsa
 *   -> Sanayi üretimi yavaşlıyor. (Ereğli, Kardemir, Şişecam için NEGATİF).
 * - Hafta sonu tüketimi yüksekse -> Fabrikalar mesai yapıyor. (POZİTİF).
 *
 * TEİAŞ her gün saat 14:00'te bir önceki günün tüketim verisini yayınlar.
 * Veriler OSGB (Organize Sanayi Bölgesi) bazında ayrı ayrı yayınlanır.
 *
 * Kullanım:
 * import { getTeiasConsumption, analyzeSectorPowerUsage } from '@analysis/osint/teias';
 */

// ============ TYPES ============

/**
 * OSGB Elektrik Tüketim Verisi
 */
export interface OSGBConsumption {
    osgb: string;
    name: string;
    city: string;
    date: Date;
    consumption: number;  // MWh
    previousDay?: number;
    changePercent?: number;
}

/**
 * Sektör Tüketim Analizi
 */
export interface SectorConsumptionAnalysis {
    sector: string;
    relatedSymbols: string[];

    // Tüketim metrikleri
    currentConsumption: number;
    previousConsumption: number;
    changePercent: number;

    // Hafta sonu analizi
    weekendConsumption: number;
    weekdayConsumption: number;
    weekendRatio: number;  // Hafta sonu tüketimin hafta içine oranı

    // Trend
    trend: 'SURGING' | 'INCREASING' | 'STABLE' | 'DECLINING' | 'CRASHING';

    // Sinyal
    signal: 'STRONG_POSITIVE' | 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'STRONG_NEGATIVE';

    // Skor (0-100)
    score: number;

    // Analiz
    analysis: string;
    recommendation: string;
}

/**
 * TEİAŞ Günlük Tüketim Özeti
 */
export interface TeiasDailySummary {
    date: Date;
    totalConsumption: number;  // Türkiye toplam (MWh)
    osgbCount: number;
    sectorAnalyses: SectorConsumptionAnalysis[];
}

/**
 * OSGB - Sektör - Hisse Mapping
 */
export interface OSGBSektorMapping {
    osgb: string;
    name: string;
    city: string;
    sector: string;
    relatedSymbols: string[];
}

// ============ OSGB MAPPING ============

/**
 * OSGB'lerin sektöre ve hisselere göre sınıflandırılması
 */
export const OSGB_SEKTOR_MAP: OSGBSektorMapping[] = [
    // Demir-Çelik
    { osgb: 'OSGB-IZMIR1', name: 'İzmir Atatürk OSGB', city: 'İzmir', sector: 'Demir-Çelik', relatedSymbols: ['IZMIR', 'ERDEM'] },
    { osgb: 'OSGB-KARAD3', name: 'Karabük OSGB', city: 'Karabük', sector: 'Demir-Çelik', relatedSymbols: ['KRDMD'] },
    { osgb: 'OSGB-ISCE2', name: 'İscehisar OSGB', city: 'Afyon', sector: 'Demir-Çelik', relatedSymbols: ['ISCEM'] },

    // Çimento
    { osgb: 'OSGB-ADANA1', name: 'Adana Hacı Sabancı OSGB', city: 'Adana', sector: 'Çimento', relatedSymbols: ['ADACI', 'AKCIM'] },
    { osgb: 'OSGB-IZMIT2', name: 'Kocaeli OSGB', city: 'Kocaeli', sector: 'Çimento', relatedSymbols: ['KCHOL'] },

    // Tekstil
    { osgb: 'OSGB-GAZI2', name: 'Gazi Antep OSGB', city: 'Gaziantep', sector: 'Tekstil', relatedSymbols: ['GUBRF', 'SAHOL'] },
    { osgb: 'OSGB-DENIZ1', name: 'Denizli OSGB', city: 'Denizli', sector: 'Tekstil', relatedSymbols: ['DENIZ'] },

    // Otomotiv
    { osgb: 'OSGB-BURSA2', name: 'Bursa OSGB', city: 'Bursa', sector: 'Otomotiv', relatedSymbols: ['TOASO', 'FROTO', 'BURSA'] },
    { osgb: 'OSGB-KOCA1', name: 'Kocaeli OSGB', city: 'Kocaeli', sector: 'Otomotiv', relatedSymbols: ['FROTO', 'FORGE'] },

    // Kimya
    { osgb: 'OSGB-IST2', name: 'İstanbul Trakya OSGB', city: 'İstanbul', sector: 'Kimya', relatedSymbols: ['PETKM', 'AKSA'] },

    // Gıda
    { osgb: 'OSGB-MANISA', name: 'Manisa OSGB', city: 'Manisa', sector: 'Gıda', relatedSymbols: ['TATGD', 'KONYA'] },

    // Cam / Seramik
    { osgb: 'OSGB-ESKI1', name: 'Eskişehir OSGB', city: 'Eskişehir', sector: 'Cam', relatedSymbols: ['SISE'] },

    // Elektrik / Elektronik
    { osgb: 'OSGB-ANKA1', name: 'Ankara OSGB', city: 'Ankara', sector: 'Elektronik', relatedSymbols: ['ASELS', 'KONTR'] },
];

/**
 * Sembolün sektörel elektrik tüketim verilerini bul
 */
export function findOSGBForSymbol(symbol: string): OSGBSektorMapping[] {
    return OSGB_SEKTOR_MAP.filter(m => m.relatedSymbols.includes(symbol));
}

/**
 * Sembol elektrik tüketimi ile takip edilebilir mi?
 */
export function isPowerTrackableSymbol(symbol: string): boolean {
    return OSGB_SEKTOR_MAP.some(m => m.relatedSymbols.includes(symbol));
}

// ============ MOCK DATA GENERATOR ============

/**
 * Mock OSGB tüketim verileri oluştur (gerçek TEİAŞ API yerine)
 */
export function generateMockConsumption(sektor: string, days: number = 30): {
    date: Date;
    consumption: number;
}[] {
    // Baz tüketim (sektöre göre)
    const baseConsumption: Record<string, number> = {
        'Demir-Çelik': 50000,
        'Çimento': 30000,
        'Tekstil': 25000,
        'Otomotiv': 40000,
        'Kimya': 35000,
        'Gıda': 20000,
        'Cam': 15000,
        'Elektronik': 18000,
    };

    const base = baseConsumption[sektor] || 25000;

    const data = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(12, 0, 0, 0);

        // Hafta sonu kontrolü
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const weekendFactor = isWeekend ? 0.6 : 1.0;

        // Rastgele varyasyon (mekansık yavaşlama simülasyonu)
        const trendFactor = 1 - (i * 0.005); // Yavaş yavaş azalma (recesson simülasyonu)
        const randomFactor = 0.85 + Math.random() * 0.3; // 0.85 - 1.15

        const consumption = Math.round(base * weekendFactor * trendFactor * randomFactor);

        data.push({ date, consumption });
    }

    return data;
}

/**
 * Mock hafta içi/hafta sonu tüketim analizi
 */
export function generateWeekdayWeekendAnalysis(sektor: string): {
    weekdayConsumption: number;
    weekendConsumption: number;
    weekendRatio: number;
} {
    const data = generateMockConsumption(sektor, 14); // Son 2 hafta

    const weekdayData = data.filter(d => d.date.getDay() > 0 && d.date.getDay() < 6);
    const weekendData = data.filter(d => d.date.getDay() === 0 || d.date.getDay() === 6);

    const weekdayAvg = weekdayData.reduce((sum, d) => sum + d.consumption, 0) / Math.max(1, weekdayData.length);
    const weekendAvg = weekendData.reduce((sum, d) => sum + d.consumption, 0) / Math.max(1, weekendData.length);

    const weekendRatio = weekdayAvg > 0 ? (weekendAvg / weekdayAvg) * 100 : 0;

    return {
        weekdayConsumption: Math.round(weekdayAvg),
        weekendConsumption: Math.round(weekendAvg),
        weekendRatio: Math.round(weekendRatio),
    };
}

// ============ ANALYSIS FUNCTIONS ============

/**
 * Sektör tüketimini analiz et
 */
export function analyzeSectorPowerUsage(sektor: string): SectorConsumptionAnalysis {
    const mapping = OSGB_SEKTOR_MAP.find(m => m.sector === sektor);

    const relatedSymbols = mapping?.relatedSymbols ||
        OSGB_SEKTOR_MAP.filter(m => m.sector === sektor).flatMap(m => m.relatedSymbols) ||
        [];

    const consumptionData = generateMockConsumption(sektor, 30);
    const current = consumptionData[consumptionData.length - 1];
    const previous = consumptionData[consumptionData.length - 2];

    const currentConsumption = current.consumption;
    const previousConsumption = previous.consumption;
    const changePercent = previousConsumption > 0
        ? ((currentConsumption - previousConsumption) / previousConsumption) * 100
        : 0;

    const { weekdayConsumption, weekendConsumption, weekendRatio } = generateWeekdayWeekendAnalysis(sektor);

    // Trend analizi
    const firstHalf = consumptionData.slice(0, 15);
    const secondHalf = consumptionData.slice(15);

    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.consumption, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.consumption, 0) / secondHalf.length;

    const trendChange = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

    let trend: SectorConsumptionAnalysis['trend'];
    if (trendChange > 10) {
        trend = 'SURGING';
    } else if (trendChange > 3) {
        trend = 'INCREASING';
    } else if (trendChange < -10) {
        trend = 'CRASHING';
    } else if (trendChange < -3) {
        trend = 'DECLINING';
    } else {
        trend = 'STABLE';
    }

    // Sinyal belirle
    let signal: SectorConsumptionAnalysis['signal'];

    // Hafta sonu mesai = güçlü sinyal
    if (weekendRatio > 70) {
        signal = 'STRONG_POSITIVE';
    } else if (trend === 'SURGING' || trend === 'INCREASING') {
        signal = 'POSITIVE';
    } else if (trend === 'CRASHING' || trend === 'DECLINING') {
        signal = 'STRONG_NEGATIVE';
    } else if (changePercent < -5) {
        signal = 'NEGATIVE';
    } else {
        signal = 'NEUTRAL';
    }

    // Skor hesapla (0-100)
    let score = 50;

    // Trend bonusu/penaltısı
    switch (trend) {
        case 'SURGING': score += 25; break;
        case 'INCREASING': score += 15; break;
        case 'STABLE': score += 5; break;
        case 'DECLINING': score -= 15; break;
        case 'CRASHING': score -= 30; break;
    }

    // Hafta sonu mesai bonusu
    if (weekendRatio > 70) score += 15;
    if (weekendRatio > 50) score += 5;

    score = Math.max(0, Math.min(100, score));

    // Analiz metni
    const analysisText = `${sektor} Sektörü Elektrik Tüketimi:\n` +
        `• Günlük tüketim: ${(currentConsumption / 1000).toFixed(1)} GWh\n` +
        `• Değişim: ${changePercent >= 0 ? '+' : ''}%${changePercent.toFixed(2)}\n` +
        `• Hafta içi ort: ${(weekdayConsumption / 1000).toFixed(1)} GWh\n` +
        `• Hafta sonu ort: ${(weekendConsumption / 1000).toFixed(1)} GWh\n` +
        `• Hafta sonu oranı: %${weekendRatio} ${weekendRatio > 60 ? '🏭 Mesai var!' : ''}\n` +
        `• Trend: ${trend === 'SURGING' ? '🚀 Yükseliş' :
                  trend === 'INCREASING' ? '📈 Artan' :
                  trend === 'STABLE' ? '➡️ Stabil' :
                  trend === 'DECLINING' ? '📉 Azalan' : '💥 Çöküş'}`;

    // Öneri
    let recommendation = '';

    switch (signal) {
        case 'STRONG_POSITIVE':
            recommendation = '🏭 GÜÇLÜ POZİTİF! Hafta sonu mesai yüksek. ' +
                'Fabrikalar kapasite kullanımı artırıyor. Sektör hisseleri için AL sinyali.';
            break;
        case 'POSITIVE':
            recommendation = '✅ POZİTİF. Elektrik tüketimi artıyor. ' +
                'Sanayi üretimi canlı. Sektör için olumlu.';
            break;
        case 'NEUTRAL':
            recommendation = '➡️ NÖTR. Tüketim stabil. Sektör yön belirgin değil.';
            break;
        case 'NEGATIVE':
            recommendation = '⚠️ NEGATİF. Tüketim azalıyor. ' +
                'Üretim yavaşlama sinyali. Dikkatli olun.';
            break;
        case 'STRONG_NEGATIVE':
            recommendation = '🚨 KÖTÜ! Elektrik tüketimi çöküyor. ' +
                'Sanayi üretimi ciddi yavaşlıyor. Sektör hisselerinden kaçın.';
            break;
    }

    return {
        sector: sektor,
        relatedSymbols,
        currentConsumption,
        previousConsumption,
        changePercent,
        weekendConsumption,
        weekdayConsumption,
        weekendRatio,
        trend,
        signal,
        score,
        analysis: analysisText,
        recommendation,
    };
}

/**
 * Şirket sembolüne göre elektrik tüketim analizi
 */
export function analyzeSymbolPowerUsage(symbol: string): SectorConsumptionAnalysis[] {
    const osgbMappings = findOSGBForSymbol(symbol);

    if (osgbMappings.length === 0) {
        return [{
            sector: 'Bilinmiyor',
            relatedSymbols: [symbol],
            currentConsumption: 0,
            previousConsumption: 0,
            changePercent: 0,
            weekendConsumption: 0,
            weekdayConsumption: 0,
            weekendRatio: 0,
            trend: 'STABLE',
            signal: 'NEUTRAL',
            score: 50,
            analysis: `${symbol} için OSGB verisi bulunamadı.`,
            recommendation: 'Bu hisse elektrik tüketimi ile takip edilemiyor.',
        }];
    }

    // Her OSGB'nin sektörü için analiz yap
    const sectors = [...new Set(osgbMappings.map(m => m.sector))];
    return sectors.map(sector => analyzeSectorPowerUsage(sector));
}

/**
 * Tüm sektörlerin elektrik tüketim özeti
 */
export function getTeiasDailySummary(): TeiasDailySummary {
    const sectors = [...new Set(OSGB_SEKTOR_MAP.map(m => m.sector))];

    const sectorAnalyses = sectors.map(sector => analyzeSectorPowerUsage(sector));

    const totalConsumption = sectorAnalyses.reduce((sum, a) => sum + a.currentConsumption, 0);

    return {
        date: new Date(),
        totalConsumption,
        osgbCount: OSGB_SEKTOR_MAP.length,
        sectorAnalyses,
    };
}

/**
 * En güçlü sektörler (yüksek elektrik tüketimi artışı)
 */
export function getStrongestSectors(limit: number = 3): SectorConsumptionAnalysis[] {
    const sectors = [...new Set(OSGB_SEKTOR_MAP.map(m => m.sector))];
    return sectors
        .map(sector => analyzeSectorPowerUsage(sector))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
}

/**
 * En zayıf sektörler (düşüş trendi)
 */
export function getWeakestSectors(limit: number = 3): SectorConsumptionAnalysis[] {
    const sectors = [...new Set(OSGB_SEKTOR_MAP.map(m => m.sector))];
    return sectors
        .map(sector => analyzeSectorPowerUsage(sector))
        .sort((a, b) => a.score - b.score)
        .slice(0, limit);
}

/**
 * Basit TEİAŞ skoru (tek sembol için)
 */
export function getTeiasConsumption(symbol: string): {
    score: number;
    signal: SectorConsumptionAnalysis['signal'];
    summary: string;
} {
    const analyses = analyzeSymbolPowerUsage(symbol);
    const best = analyses.sort((a, b) => b.score - a.score)[0];

    return {
        score: best.score,
        signal: best.signal,
        summary: `${symbol}: ${best.signal} (Skor: ${best.score}/100) - ${best.sector}`,
    };
}

/**
 * Sinyal ikonu
 */
export function getTeiasSignalIcon(signal: SectorConsumptionAnalysis['signal']): string {
    switch (signal) {
        case 'STRONG_POSITIVE': return '🏭';
        case 'POSITIVE': return '✅';
        case 'NEUTRAL': return '➡️';
        case 'NEGATIVE': return '⚠️';
        case 'STRONG_NEGATIVE': return '🚨';
    }
}

/**
 * Trend ikonu
 */
export function getTeiasTrendIcon(trend: SectorConsumptionAnalysis['trend']): string {
    switch (trend) {
        case 'SURGING': return '🚀';
        case 'INCREASING': return '📈';
        case 'STABLE': return '➡️';
        case 'DECLINING': return '📉';
        case 'CRASHING': return '💥';
    }
}

export default {
    analyzeSectorPowerUsage,
    analyzeSymbolPowerUsage,
    getTeiasDailySummary,
    getStrongestSectors,
    getWeakestSectors,
    getTeiasConsumption,
    isPowerTrackableSymbol,
    findOSGBForSymbol,
    getTeiasSignalIcon,
    getTeiasTrendIcon,
    OSGB_SEKTOR_MAP,
};
