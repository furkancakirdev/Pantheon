/**
 * Mynet Finans API Client
 * Canlı Piyasa Verileri
 * 
 * Kaynak: https://finans.mynet.com
 * Endpoints: /api/real-time, /static/most-shares-live-user-data.json
 */

export interface MarketData {
    xu100: {
        deger: number;
        degisim: number;
        degisimOran: number;
    };
    xu030: {
        deger: number;
        degisim: number;
        degisimOran: number;
    };
    dolar: {
        alis: number;
        satis: number;
        degisim: number;
    };
    euro: {
        alis: number;
        satis: number;
        degisim: number;
    };
    altin: {
        alis: number;
        satis: number;
        degisim: number;
    };
}

export interface LiveStock {
    kod: string;
    ad: string;
    son: number;
    degisim: number;
    hacim: number;
}

const BASE_URL = 'https://finans.mynet.com';

/**
 * Canlı piyasa verilerini çeker (endeksler, döviz, emtia)
 */
export async function fetchRealTimeMarket(): Promise<MarketData> {
    const response = await fetch(`${BASE_URL}/api/real-time`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Mynet API hatası: ${response.status}`);
    }

    return await response.json() as MarketData;
}

/**
 * En hareketli hisseleri çeker
 */
export async function fetchMostActiveStocks(): Promise<LiveStock[]> {
    const response = await fetch(`${BASE_URL}/static/most-shares-live-user-data.json`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
    });

    if (!response.ok) {
        throw new Error(`Mynet API hatası: ${response.status}`);
    }

    return await response.json() as LiveStock[];
}

/**
 * Piyasa özeti formatla
 */
export function formatMarketSummary(data: MarketData): string {
    return `
📊 Piyasa Özeti
━━━━━━━━━━━━━━━
BIST 100: ${data.xu100?.deger?.toLocaleString('tr-TR')} (${data.xu100?.degisimOran > 0 ? '+' : ''}${data.xu100?.degisimOran?.toFixed(2)}%)
BIST 30:  ${data.xu030?.deger?.toLocaleString('tr-TR')} (${data.xu030?.degisimOran > 0 ? '+' : ''}${data.xu030?.degisimOran?.toFixed(2)}%)
━━━━━━━━━━━━━━━
USD/TRY:  ${data.dolar?.satis?.toFixed(4)}
EUR/TRY:  ${data.euro?.satis?.toFixed(4)}
Altın:    ${data.altin?.satis?.toLocaleString('tr-TR')} TL
`;
}

// Test için doğrudan çalıştırma
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('Mynet API test ediliyor...');
    fetchRealTimeMarket()
        .then(data => {
            console.log('✅ Piyasa verisi alındı');
            console.log(formatMarketSummary(data));
        })
        .catch(err => console.error('❌ Hata:', err.message));
}
