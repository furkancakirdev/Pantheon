/**
 * TEFAS API Client
 * Türkiye Elektronik Fon Alım Satım Platformu
 * 
 * Kaynak: https://www.tefas.gov.tr
 * Endpoints: /api/DB/BindComparisonFundReturns, /BindComparisonFundSizes
 */

export interface FundReturn {
    fonKodu: string;       // Fon kodu (TI2, YAY vb.)
    fonAdi: string;        // Fon adı
    fonTuru: string;       // Fon türü (Hisse, Borçlanma, vb.)
    kurucuAdi: string;     // Kurucu şirket
    gunlukGetiri: number;  // Günlük getiri %
    haftalikGetiri: number; // Haftalık getiri %
    aylikGetiri: number;   // Aylık getiri %
    yillikGetiri: number;  // Yıllık getiri %
    fonBuyuklugu: number;  // Fon büyüklüğü (TL)
}

export interface TefasApiResponse {
    data: FundReturn[];
}

const BASE_URL = 'https://www.tefas.gov.tr/api/DB';

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

    const data: TefasApiResponse = await response.json();
    return data.data || [];
}

/**
 * Fon büyüklüklerini çeker
 */
export async function fetchFundSizes(): Promise<FundReturn[]> {
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

    const data: TefasApiResponse = await response.json();
    return data.data || [];
}

/**
 * Fon türüne göre filtrele
 */
export function filterByFundType(funds: FundReturn[], type: string): FundReturn[] {
    return funds.filter(f => f.fonTuru?.toLowerCase().includes(type.toLowerCase()));
}

/**
 * En yüksek getirili fonları sırala
 */
export function sortByReturn(funds: FundReturn[], period: 'gunluk' | 'haftalik' | 'aylik' | 'yillik' = 'yillik'): FundReturn[] {
    const key = `${period}Getiri` as keyof FundReturn;
    return [...funds].sort((a, b) => (b[key] as number) - (a[key] as number));
}

// Test için doğrudan çalıştırma
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('TEFAS API test ediliyor...');
    fetchFundReturns()
        .then(funds => {
            console.log(`✅ ${funds.length} fon yüklendi`);
            const top5 = sortByReturn(funds, 'yillik').slice(0, 5);
            console.log('En yüksek yıllık getirili 5 fon:');
            top5.forEach(f => console.log(`  ${f.fonKodu}: %${f.yillikGetiri?.toFixed(2)}`));
        })
        .catch(err => console.error('❌ Hata:', err.message));
}
