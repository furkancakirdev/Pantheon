/**
 * TEFAS API Client V2
 * Türkiye Elektronik Fon Alım Satım Platformu
 *
 * Kaynak: https://www.tefas.gov.tr
 * Endpoints: /api/DB/BindComparisonFundReturns, /BindComparisonFundSizes
 *
 * Özellikler:
 * - Fon getirileri ve büyüklükleri
 * - Fon türü filtreleme
 * - Getiri sıralama
 * - Risk hesaplama (standart sapma)
 * - Sharpe oranı hesaplama
 */

// ============ TİP TANIMLARI ============

export interface FundReturn {
    fonKodu: string;           // Fon kodu (TI2, YAY vb.)
    fonAdi: string;            // Fon adı
    fonTuru: string;           // Fon türü (Hisse, Borçlanma, Kıymetli Maden, vb.)
    kurucuAdi: string;         // Kurucu şirket
    gunlukGetiri: number;      // Günlük getiri %
    haftalikGetiri: number;    // Haftalık getiri %
    aylikGetiri: number;       // Aylık getiri %
    yillikGetiri: number;      // Yıllık getiri %
    fonBuyuklugu?: number;     // Fon büyüklüğü (TL) - opsiyonel
}

export interface TefasApiResponse {
    data: FundReturn[];
}

export interface FundAnalysis extends FundReturn {
    riskSkoru?: number;        // Risk skoru 0-100
    sharpeOrani?: number;      // Sharpe oranı
    volatilite?: number;       // Standart sapma
    trend?: 'YUKARI' | 'ASAGI' | 'YATAY';
}

export type FonTuru =
    | 'Hisse Senedi'
    | 'Borçlanma Aracı'
    | 'Kıymetli Maden'
    | 'Yabancı Hisse Senedi'
    | 'Değişken Fon'
    | 'Para Piyasası'
    | 'Katılım Hisse Senedi'
    | 'Kıymetli Maden (Altın)'
    | 'Girişim Sermayesi';

const BASE_URL = 'https://www.tefas.gov.tr/api/DB';

// ============ API FONKSİYONLARI ============

/**
 * Fon getirilerini çeker
 */
export async function fetchFundReturns(): Promise<FundReturn[]> {
    const response = await fetch(`${BASE_URL}/BindComparisonFundReturns`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json',
        },
        body: JSON.stringify({
            lang: 'TR',
        }),
    });

    if (!response.ok) {
        throw new Error(`TEFAS API hatası: ${response.status}`);
    }

    const data = await response.json() as TefasApiResponse;
    return data.data || [];
}

/**
 * Fon büyüklüklerini çeker
 */
export async function fetchFundSizes(): Promise<Map<string, number>> {
    const response = await fetch(`${BASE_URL}/BindComparisonFundSizes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
        },
        body: JSON.stringify({ lang: 'TR' }),
    });

    if (!response.ok) {
        throw new Error(`TEFAS API hatası: ${response.status}`);
    }

    const data = await response.json() as TefasApiResponse;
    const funds = data.data || [];

    const sizeMap = new Map<string, number>();
    for (const fund of funds) {
        if (fund.fonKodu && fund.fonBuyuklugu) {
            sizeMap.set(fund.fonKodu, fund.fonBuyuklugu);
        }
    }

    return sizeMap;
}

// ============ FİLTRELEME VE SIRALAMA ============

/**
 * Fon türüne göre filtrele
 */
export function filterByFundType(funds: FundReturn[], type: FonTuru | string): FundReturn[] {
    return funds.filter(f => f.fonTuru?.toLowerCase().includes(type.toLowerCase()));
}

/**
 * Kurucuya göre filtrele
 */
export function filterByFounder(funds: FundReturn[], founder: string): FundReturn[] {
    return funds.filter(f => f.kurucuAdi?.toLowerCase().includes(founder.toLowerCase()));
}

/**
 * Getiri aralığına göre filtrele
 */
export function filterByReturnRange(
    funds: FundReturn[],
    minReturn: number,
    maxReturn: number = Infinity,
    period: 'gunluk' | 'haftalik' | 'aylik' | 'yillik' = 'yillik'
): FundReturn[] {
    const key = `${period}Getiri` as keyof FundReturn;
    return funds.filter(f => {
        const ret = f[key] as number;
        return ret >= minReturn && ret <= maxReturn;
    });
}

/**
 * En yüksek getirili fonları sırala
 */
export function sortByReturn(
    funds: FundReturn[],
    period: 'gunluk' | 'haftalik' | 'aylik' | 'yillik' = 'yillik'
): FundReturn[] {
    const key = `${period}Getiri` as keyof FundReturn;
    return [...funds].sort((a, b) => (b[key] as number) - (a[key] as number));
}

/**
 * Fon büyüklüğüne göre sırala
 */
export function sortBySize(funds: FundReturn[]): FundReturn[] {
    return [...funds].sort((a, b) => (b.fonBuyuklugu || 0) - (a.fonBuyuklugu || 0));
}

// ============ ANALİZ FONKSİYONLARI ============

/**
 * Risk skoru hesapla (basit yaklaşım)
 * Volatilite bazlı risk hesaplaması
 */
export function calculateRiskScore(fund: FundReturn): number {
    // Aylık getiri volatilitesi tahmini
    const monthlyReturn = fund.aylikGetiri || 0;

    // Negatif getiri = yüksek risk
    if (monthlyReturn < -5) return 90;
    if (monthlyReturn < 0) return 70;
    if (monthlyReturn < 2) return 50;

    // Düşük pozitif getiri = düşük risk
    if (monthlyReturn < 5) return 30;
    return 20;
}

/**
 * Trend belirleme
 */
export function determineTrend(fund: FundReturn): 'YUKARI' | 'ASAGI' | 'YATAY' {
    const daily = fund.gunlukGetiri || 0;
    const weekly = fund.haftalikGetiri || 0;
    const monthly = fund.aylikGetiri || 0;

    // Hepsi pozitif = yukarı trend
    if (daily > 0 && weekly > 0 && monthly > 0) return 'YUKARI';

    // Hepsi negatif = aşağı trend
    if (daily < 0 && weekly < 0 && monthly < 0) return 'ASAGI';

    // Karışık = yatay
    return 'YATAY';
}

/**
 * Fon analizi yap
 */
export function analyzeFund(fund: FundReturn): FundAnalysis {
    const riskSkoru = calculateRiskScore(fund);
    const trend = determineTrend(fund);

    // Basit Sharpe oranı (yıllık getiri / risk skoru * 10)
    const yillikGetiri = fund.yillikGetiri || 0;
    const sharpeOrani = riskSkoru > 0 ? (yillikGetiri / riskSkoru) * 10 : 0;

    return {
        ...fund,
        riskSkoru,
        sharpeOrani,
        trend,
        volatilite: riskSkoru / 10, // Basit yaklaşım
    };
}

/**
 * Toplu fon analizi
 */
export function analyzeFunds(funds: FundReturn[]): FundAnalysis[] {
    return funds.map(f => analyzeFund(f));
}

/**
 * En iyi fonları seç (multi-kriter)
 */
export function selectBestFunds(
    funds: FundReturn[],
    options: {
        minReturn?: number;
        maxRisk?: number;
        fonTuru?: string;
        limit?: number;
    } = {}
): FundAnalysis[] {
    const {
        minReturn = 0,
        maxRisk = 50,
        fonTuru,
        limit = 10
    } = options;

    let filtered = funds;

    // Getiri filtresi
    if (minReturn > 0) {
        filtered = filterByReturnRange(filtered, minReturn, Infinity, 'yillik');
    }

    // Fon türü filtresi
    if (fonTuru) {
        filtered = filterByFundType(filtered, fonTuru);
    }

    // Analiz yap
    const analyzed = analyzeFunds(filtered);

    // Risk filtresi
    const riskFiltered = analyzed.filter(f => (f.riskSkoru || 0) <= maxRisk);

    // Sharpe oranına göre sırala
    riskFiltered.sort((a, b) => (b.sharpeOrani || 0) - (a.sharpeOrani || 0));

    return riskFiltered.slice(0, limit);
}

/**
 * Fon kodundan detaylı bilgi al
 */
export async function getFundDetails(fonKodu: string): Promise<FundAnalysis | null> {
    const funds = await fetchFundReturns();
    const fund = funds.find(f => f.fonKodu === fonKodu.toUpperCase());

    if (!fund) return null;

    // Büyüklük bilgisini ekle
    const sizes = await fetchFundSizes();
    const size = sizes.get(fonKodu);

    return analyzeFund({
        ...fund,
        fonBuyuklugu: size,
    });
}

/**
 * Fon türleri listesi
 */
export function getFonTurleri(funds: FundReturn[]): string[] {
    const types = new Set<string>();
    for (const fund of funds) {
        if (fund.fonTuru) {
            types.add(fund.fonTuru);
        }
    }
    return Array.from(types).sort();
}

/**
 * Kurucu şirketleri listesi
 */
export function getKurucular(funds: FundReturn[]): string[] {
    const founders = new Set<string>();
    for (const fund of funds) {
        if (fund.kurucuAdi) {
            founders.add(fund.kurucuAdi);
        }
    }
    return Array.from(founders).sort();
}

// ============ EXPORTS ============

export default {
    fetchFundReturns,
    fetchFundSizes,
    filterByFundType,
    filterByFounder,
    filterByReturnRange,
    sortByReturn,
    sortBySize,
    calculateRiskScore,
    determineTrend,
    analyzeFund,
    analyzeFunds,
    selectBestFunds,
    getFundDetails,
    getFonTurleri,
    getKurucular,
};

// Test için doğrudan çalıştırma
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('TEFAS API test ediliyor...');
    fetchFundReturns()
        .then(async funds => {
            console.log(`✅ ${funds.length} fon yüklendi`);

            const top5 = sortByReturn(funds, 'yillik').slice(0, 5);
            console.log('\n📊 En yüksek yıllık getirili 5 fon:');
            top5.forEach(f => {
                const analysis = analyzeFund(f);
                console.log(`  ${analysis.fonKodu} | ${analysis.fonAdi.substring(0, 30)}... | Yıllık: %${analysis.yillikGetiri?.toFixed(2)} | Risk: ${analysis.riskSkoru}/100`);
            });

            console.log('\n📈 Fon türleri:', getFonTurleri(funds));
        })
        .catch(err => console.error('❌ Hata:', err.message));
}
