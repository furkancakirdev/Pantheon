/**
 * Şikayetvar.com OSINT Scraper
 *
 * Yapılacaklar 4.txt - "MODÜL 2: HERMES OSINT (TÜKETİCİ DAVRANIŞI)":
 * Şikayetvar.com Endeksi (Risk Sinyali)
 * - "Turkcell iptal" veya "Türk Telekom çekmiyor" şikayetleri geçen aya göre %30 arttıysa
 *   -> Gelecek çeyrek abone kaybedecekler.
 * - Vestel için "Servis gelmedi" şikayetleri patladıysa
 *   -> Maliyetler artmış veya operasyon bozulmuş.
 *
 * Kullanım:
 * import { getSikayetvarScore, analyzeCompanyComplaints } from '@analysis/osint/sikayetvar';
 */

// ============ TYPES ============

/**
 * Şikayet Bilgisi
 */
export interface Sikayet {
    id: string;
    title: string;
    date: Date;
    company: string;
    category: string;
    views: number;
    status: 'Çözüldü' | 'İnceleniyor' | 'Cevap Bekliyor';
}

/**
 * Şirket Şikayet Analizi
 */
export interface CompanyComplaintAnalysis {
    symbol: string;
    company: string;

    // Şikayet metrikleri
    totalComplaints: number;
    newComplaintsThisMonth: number;
    newComplaintsLastMonth: number;

    // Çözüm oranı
    resolvedComplaints: number;
    unresolvedComplaints: number;
    resolutionRate: number;

    // Kategoriler
    complaintsByCategory: Record<string, number>;

    // Trend
    trend: 'IMPROVING' | 'STABLE' | 'WORSENING' | 'SURGING';

    // Risk skoru (0-100, yüksek = riskli)
    riskScore: number;

    // Sinyal
    signal: 'LOW_RISK' | 'NORMAL' | 'ELEVATED' | 'HIGH_RISK' | 'CRITICAL';

    // Detaylı analiz
    analysis: string;
    recommendation: string;
}

/**
 * Şirket Şikayetvar URL Mapping
 */
export interface CompanySikayetvarMapping {
    symbol: string;
    company: string;
    sikayetvarSlug: string;
    keywords: string[];
}

// ============ ŞİRKET MAPPING ============

/**
 * BIST şirketlerinin Şikayetvar URL bilgileri
 */
export const COMPANY_SIKAYETVAR_MAP: CompanySikayetvarMapping[] = [
    // Telekomünikasyon
    { symbol: 'TCELL', company: 'Turkcell', sikayetvarSlug: 'turkcell', keywords: ['turkcell', 'iptal', 'tarife', 'internet'] },
    { symbol: 'TTKOM', company: 'Türk Telekom', sikayetvarSlug: 'turk-telekom', keywords: ['türk telekom', 'pilav', 'internet', 'adsl'] },
    { symbol: 'TKFEN', company: 'Turknet', sikayetvarSlug: 'turknet', keywords: ['turknet', 'internet'] },

    // Perakende / E-ticaret
    { symbol: 'MGROS', company: 'Migros', sikayetvarSlug: 'migros', keywords: ['migros', 'market', 'kasa'] },
    { symbol: 'BIMAS', company: 'BİM', sikayetvarSlug: 'bim', keywords: ['bim', 'market'] },
    { symbol: 'SAHOL', company: 'Şok', sikayetvarSlug: 'sok-market', keywords: ['şok', 'market'] },
    { symbol: 'AGROL', company: 'Agrocery', sikayetvarSlug: 'agrocery', keywords: ['agrocery'] },
    { symbol: 'GROFY', company: 'CarrefourSA', sikayetvarSlug: 'carrefoursa', keywords: ['carrefour'] },

    // Teknoloji / Elektronik
    { symbol: 'VEST', company: 'Vestel', sikayetvarSlug: 'vestel', keywords: ['vestel', 'servis', 'tv'] },
    { symbol: 'ARCLK', company: 'Arçelik', sikayetvarSlug: 'arcelik', keywords: ['arçelik', 'servis', 'buzdolabı'] },
    { symbol: 'BERA', company: 'Beko', sikayetvarSlug: 'beko', keywords: ['beko', 'servis'] },

    // Bankacılık
    { symbol: 'AKBNK', company: 'Akbank', sikayetvarSlug: 'akbank', keywords: ['akbank', 'hesap', 'kart'] },
    { symbol: 'ISCTR', company: 'İş Bankası', sikayetvarSlug: 'isbankasi', keywords: ['iş bankası', 'kredi'] },
    { symbol: 'GARAN', company: 'Garanti', sikayetvarSlug: 'garanti', keywords: ['garanti', 'bbva'] },
    { symbol: 'YKBNK', company: 'Yapı Kredi', sikayetvarSlug: 'yapi-kredi', keywords: ['yapı kredi'] },
    { symbol: 'HALKB', company: 'Halkbank', sikayetvarSlug: 'halkbank', keywords: ['halkbank'] },
    { symbol: 'VAKBN', company: 'Vakıfbank', sikayetvarSlug: 'vakifbank', keywords: ['vakıfbank'] },

    // Havacılık
    { symbol: 'THYAO', company: 'Turkish Airlines', sikayetvarSlug: 'thy-turkish-airlines', keywords: ['thy', 'bilet', 'uçuş'] },
    { symbol: 'PGSUS', company: 'Pegasus', sikayetvarSlug: 'pegasus', keywords: ['pegasus', 'bilet'] },

    // Otomotiv
    { symbol: 'TOASO', company: 'TOFAŞ', sikayetvarSlug: 'tofas', keywords: ['tofaş', 'servis', 'fiat'] },
    { symbol: 'FROTO', company: 'Ford Otosan', sikayetvarSlug: 'ford-otosan', keywords: ['ford'] },

    // Enerji
    { symbol: 'AKSEN', company: 'Aksa', sikayetvarSlug: 'aksa', keywords: ['aksa', 'doğalgaz'] },
    { symbol: 'BRYAT', company: 'Botaş', sikayetvarSlug: 'botas', keywords: ['botaş'] },
];

/**
 * Şirket sembolüne göre Şikayetvar bilgisini bul
 */
export function findCompanySikayetvar(symbol: string): CompanySikayetvarMapping | undefined {
    return COMPANY_SIKAYETVAR_MAP.find(c => c.symbol === symbol);
}

/**
 * Şirket Şikayetvar'da takip edilebilir mi?
 */
export function isTrackableCompany(symbol: string): boolean {
    return COMPANY_SIKAYETVAR_MAP.some(c => c.symbol === symbol);
}

// ============ MOCK DATA GENERATOR ============

/**
 * Mock şikayet verileri oluştur (gerçek scraping yerine)
 */
export function generateMockComplaints(symbol: string, months: number = 6): {
    month: string;
    complaints: number;
    resolved: number;
}[] {
    const mapping = findCompanySikayetvar(symbol);

    // Baz şikayet seviyesi (sembol hash'ten)
    const hash = symbol.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const baseComplaints = (hash % 100) + 10;

    const data = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(date.getMonth() - i);

        const monthStr = date.toISOString().slice(0, 7);

        // Rastgele varyasyon
        const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 - 1.3
        const complaints = Math.round(baseComplaints * randomFactor * (1 + i * 0.1));

        // Çözüm oranı (%60-90 arası)
        const resolutionRate = 0.6 + Math.random() * 0.3;
        const resolved = Math.round(complaints * resolutionRate);

        data.push({
            month: monthStr,
            complaints,
            resolved,
        });
    }

    return data;
}

// ============ ANALYSIS FUNCTIONS ============

/**
 * Şirket şikayetlerini analiz et
 */
export function analyzeCompanyComplaints(symbol: string): CompanyComplaintAnalysis {
    const mapping = findCompanySikayetvar(symbol);
    const company = mapping?.company || symbol;

    const monthlyData = generateMockComplaints(symbol, 6);

    // Son 2 ay
    const thisMonth = monthlyData[monthlyData.length - 1];
    const lastMonth = monthlyData[monthlyData.length - 2];

    const totalComplaints = monthlyData.reduce((sum, d) => sum + d.complaints, 0);
    const newComplaintsThisMonth = thisMonth.complaints;
    const newComplaintsLastMonth = lastMonth.complaints;

    const resolvedComplaints = monthlyData.reduce((sum, d) => sum + d.resolved, 0);
    const unresolvedComplaints = totalComplaints - resolvedComplaints;
    const resolutionRate = totalComplaints > 0 ? (resolvedComplaints / totalComplaints) * 100 : 0;

    // Kategoriler (mock)
    const complaintsByCategory: Record<string, number> = {
        'Müşteri Hizmetleri': Math.round(newComplaintsThisMonth * 0.3),
        'Ürün Kalite': Math.round(newComplaintsThisMonth * 0.25),
        'Teslimat': Math.round(newComplaintsThisMonth * 0.2),
        'Faturalandırma': Math.round(newComplaintsThisMonth * 0.15),
        'Diğer': Math.round(newComplaintsThisMonth * 0.1),
    };

    // Trend hesapla
    const changeRate = lastMonth.complaints > 0
        ? ((thisMonth.complaints - lastMonth.complaints) / lastMonth.complaints) * 100
        : 0;

    let trend: CompanyComplaintAnalysis['trend'];
    if (changeRate > 30) {
        trend = 'SURGING';
    } else if (changeRate > 10) {
        trend = 'WORSENING';
    } else if (changeRate < -10) {
        trend = 'IMPROVING';
    } else {
        trend = 'STABLE';
    }

    // Risk skoru (0-100)
    let riskScore = 50;

    // Şikayet artışı
    if (changeRate > 50) riskScore += 30;
    else if (changeRate > 20) riskScore += 15;
    else if (changeRate < -20) riskScore -= 15;

    // Çözüm oranı
    if (resolutionRate < 50) riskScore += 20;
    else if (resolutionRate > 80) riskScore -= 10;

    // Çözümsüz şikayet sayısı
    if (unresolvedComplaints > 100) riskScore += 15;

    riskScore = Math.max(0, Math.min(100, riskScore));

    // Sinyal
    let signal: CompanyComplaintAnalysis['signal'];
    if (riskScore >= 80) signal = 'CRITICAL';
    else if (riskScore >= 65) signal = 'HIGH_RISK';
    else if (riskScore >= 50) signal = 'ELEVATED';
    else if (riskScore >= 35) signal = 'NORMAL';
    else signal = 'LOW_RISK';

    // Analiz metni
    const analysisText = `${company} Şikayetvar Analizi:\n` +
        `• Son 30 gün: ${newComplaintsThisMonth} şikayet\n` +
        `• Değişim: ${changeRate >= 0 ? '+' : ''}%${changeRate.toFixed(1)}\n` +
        `• Çözüm oranı: %${resolutionRate.toFixed(1)}\n` +
        `• Çözümsüz: ${unresolvedComplaints} şikayet\n` +
        `• Trend: ${trend === 'SURGING' ? '🚀 Patlama' :
                  trend === 'WORSENING' ? '📈 Kötüleşme' :
                  trend === 'IMPROVING' ? '📉 İyileşme' : '➡️ Stabil'}`;

    // Öneri
    let recommendation = '';

    switch (signal) {
        case 'CRITICAL':
            recommendation = '🚨 KRİTİK RİSK! Şikayetler patlamış ve çözüm oranı düşük. ' +
                'Müşteri kaybı kaçınılmaz. Kısa vadede SAT sinyali.';
            break;
        case 'HIGH_RISK':
            recommendation = '⚠️ YÜKSEK RİSK! Şikayetlerde artış var. ' +
                'Operasyon sorunları olabilir. Temkinli olun.';
            break;
        case 'ELEVATED':
            recommendation = '📊 RİSK ARTIŞI. Şikayetler artıyor, izleyin. ' +
                'Müşteri memnuniyetine dikkat.';
            break;
        case 'NORMAL':
            recommendation = '✅ Normal seviyede. Şirket müşteri şikayetlerini yönetebiliyor.';
            break;
        case 'LOW_RISK':
            recommendation = '💚 DÜŞÜK RİSK! Şikayetler azalıyor, çözüm oranı yüksek. ' +
                'Müşteri memnuniyesi iyi.';
            break;
    }

    return {
        symbol,
        company,
        totalComplaints,
        newComplaintsThisMonth,
        newComplaintsLastMonth,
        resolvedComplaints,
        unresolvedComplaints,
        resolutionRate,
        complaintsByCategory,
        trend,
        riskScore,
        signal,
        analysis: analysisText,
        recommendation,
    };
}

/**
 * Çoklu şirket analizi
 */
export function analyzeMultipleComplaintCompanies(symbols: string[]): CompanyComplaintAnalysis[] {
    return symbols
        .filter(symbol => isTrackableCompany(symbol))
        .map(symbol => analyzeCompanyComplaints(symbol))
        .sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * En riskli şirketler (yüksek şikayet)
 */
export function getHighestRiskCompanies(limit: number = 5): CompanyComplaintAnalysis[] {
    const trackableSymbols = COMPANY_SIKAYETVAR_MAP.map(c => c.symbol);
    return analyzeMultipleComplaintCompanies(trackableSymbols).slice(0, limit);
}

/**
 * En iyi müşteri hizmetine sahip şirketler
 */
export function getBestCustomerService(limit: number = 5): CompanyComplaintAnalysis[] {
    const trackableSymbols = COMPANY_SIKAYETVAR_MAP.map(c => c.symbol);
    return analyzeMultipleComplaintCompanies(trackableSymbols)
        .sort((a, b) => b.resolutionRate - a.resolutionRate)
        .slice(0, limit);
}

/**
 * Basit şikayet skoru (tek sembol için)
 */
export function getSikayetvarScore(symbol: string): {
    riskScore: number;
    signal: CompanyComplaintAnalysis['signal'];
    summary: string;
} {
    const analysis = analyzeCompanyComplaints(symbol);

    return {
        riskScore: analysis.riskScore,
        signal: analysis.signal,
        summary: `${analysis.company}: ${analysis.signal} (Risk: ${analysis.riskScore}/100)`,
    };
}

/**
 * Şikayet trend ikonu
 */
export function getSikayetvarTrendIcon(trend: CompanyComplaintAnalysis['trend']): string {
    switch (trend) {
        case 'SURGING': return '🚀';
        case 'WORSENING': return '📈';
        case 'IMPROVING': return '📉';
        case 'STABLE': return '➡️';
    }
}

/**
 * Sinyal ikonu
 */
export function getSikayetvarSignalIcon(signal: CompanyComplaintAnalysis['signal']): string {
    switch (signal) {
        case 'CRITICAL': return '🚨';
        case 'HIGH_RISK': return '⚠️';
        case 'ELEVATED': return '📊';
        case 'NORMAL': return '✅';
        case 'LOW_RISK': return '💚';
    }
}

export default {
    analyzeCompanyComplaints,
    analyzeMultipleComplaintCompanies,
    getHighestRiskCompanies,
    getBestCustomerService,
    getSikayetvarScore,
    isTrackableCompany,
    findCompanySikayetvar,
    getSikayetvarTrendIcon,
    getSikayetvarSignalIcon,
    COMPANY_SIKAYETVAR_MAP,
};
