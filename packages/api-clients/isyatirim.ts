/**
 * İş Yatırım API Client
 * BIST Hisse Senedi Temel Verileri
 * 
 * Kaynak: https://www.isyatirim.com.tr
 * Endpoint: POST /Data.aspx/HisseSenetleri
 */

export interface StockFundamentals {
    kod: string;           // Hisse kodu (THYAO, ASELS, vb.)
    ad: string;            // Şirket adı
    sektor: string;        // Sektör
    kapanis: number;       // Kapanış fiyatı
    fk: number;            // Fiyat/Kazanç
    pddd: number;          // Piyasa Değeri / Defter Değeri
    fdFavok: number;       // FD/FAVÖK
    roe: number;           // Özkaynak Karlılığı
    borcOzkaynak: number;  // Borç/Özkaynak
    piyasaDegeri: number;  // Piyasa Değeri (TL)
    yabanciOran: number;   // Yabancı Oranı %
}

export interface IsyatirimApiResponse {
    d: StockFundamentals[];
}

const BASE_URL = 'https://www.isyatirim.com.tr/_layouts/15/IsYatirim.Website/Common/Data.aspx';

/**
 * Tüm BIST hisselerinin temel verilerini çeker
 */
export async function fetchAllStocks(): Promise<StockFundamentals[]> {
    const response = await fetch(`${BASE_URL}/HisseSenetleri`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json',
        },
        body: JSON.stringify({}),
    });

    if (!response.ok) {
        throw new Error(`İş Yatırım API hatası: ${response.status}`);
    }

    const data: IsyatirimApiResponse = await response.json();
    return data.d || [];
}

/**
 * Belirli bir sektördeki hisseleri filtreler
 */
export function filterBySector(stocks: StockFundamentals[], sector: string): StockFundamentals[] {
    return stocks.filter(s => s.sektor?.toLowerCase().includes(sector.toLowerCase()));
}

/**
 * F/K oranına göre filtreler (Yaşar Erdinç kriteri)
 */
export function filterByPE(stocks: StockFundamentals[], maxPE: number = 15): StockFundamentals[] {
    return stocks.filter(s => s.fk > 0 && s.fk <= maxPE);
}

/**
 * PD/DD oranına göre filtreler
 */
export function filterByPBV(stocks: StockFundamentals[], maxPBV: number = 2): StockFundamentals[] {
    return stocks.filter(s => s.pddd > 0 && s.pddd <= maxPBV);
}

// Test için doğrudan çalıştırma
if (import.meta.url === `file://${process.argv[1]}`) {
    console.log('İş Yatırım API test ediliyor...');
    fetchAllStocks()
        .then(stocks => {
            console.log(`✅ ${stocks.length} hisse yüklendi`);
            console.log('İlk 5 hisse:', stocks.slice(0, 5).map(s => s.kod));
        })
        .catch(err => console.error('❌ Hata:', err.message));
}
