/**
 * Ali Perşembe Teknik Analiz Yöntemleri
 * 
 * Kaynak: d:\Ali Perşembe\Teknik Analiz mi Dedin (Ali Persembe).pdf
 * 
 * Yöntemler:
 * - Destek / Direnç Seviyeleri
 * - Trend Çizgileri
 * - Grafik Formasyonları (Omuz-Baş-Omuz, Üçgenler, vb.)
 * - Hacim Analizi
 * - Fibonacci Düzeltmeleri
 */

import type { Candle } from '../kivanc/indicators.js';

/**
 * Destek/Direnç Seviyeleri
 */
export interface SupportResistance {
    seviye: number;
    tip: 'DESTEK' | 'DİRENÇ';
    guc: number;           // 1-10 arası güç seviyesi
    testSayisi: number;    // Kaç kez test edildi
}

/**
 * Trend Bilgisi
 */
export interface TrendInfo {
    yonu: 'YUKARI' | 'AŞAĞI' | 'YATAY';
    baslangic: Date;
    guc: number;           // Trend gücü (açı derecesi)
    cizgiDenklemi: {       // y = mx + b
        egim: number;        // m
        kesisim: number;     // b
    };
}

/**
 * Formasyon Tipi
 */
export type FormasyonTipi =
    | 'OMUZ_BAS_OMUZ'
    | 'TERS_OMUZ_BAS_OMUZ'
    | 'CIFT_DIP'
    | 'CIFT_TEPE'
    | 'YUKARI_UCGEN'
    | 'ASAGI_UCGEN'
    | 'SIMETRIK_UCGEN'
    | 'BAYRAK'
    | 'FLAMA'
    | 'KAMA';

export interface Formasyon {
    tip: FormasyonTipi;
    guvenilirlik: number;  // 0-100
    hedefFiyat: number;
    aciklama: string;
}

// ===== DESTEK/DİRENÇ HESAPLAMA =====

/**
 * Pivot noktalarını bul (yerel min/max)
 */
export function pivotNoktalari(
    candles: Candle[],
    pencere: number = 5
): { dipler: number[]; tepeler: number[] } {
    const dipler: number[] = [];
    const tepeler: number[] = [];

    for (let i = pencere; i < candles.length - pencere; i++) {
        const mum = candles[i];
        let enDusuk = true;
        let enYuksek = true;

        for (let j = i - pencere; j <= i + pencere; j++) {
            if (j === i) continue;
            if (candles[j].low < mum.low) enDusuk = false;
            if (candles[j].high > mum.high) enYuksek = false;
        }

        if (enDusuk) dipler.push(mum.low);
        if (enYuksek) tepeler.push(mum.high);
    }

    return { dipler, tepeler };
}

/**
 * Destek ve direnç seviyelerini hesapla
 */
export function destekDirencBul(
    candles: Candle[],
    tolerans: number = 0.02  // %2 tolerans
): SupportResistance[] {
    const { dipler, tepeler } = pivotNoktalari(candles);
    const seviyeler: SupportResistance[] = [];
    const sonFiyat = candles[candles.length - 1].close;

    // Dipleri grupla ve destek seviyelerine dönüştür
    const grupla = (noktalar: number[], tip: 'DESTEK' | 'DİRENÇ') => {
        const gruplanmis: Map<number, number[]> = new Map();

        noktalar.forEach(nokta => {
            let eklendi = false;
            gruplanmis.forEach((degerler, anahtar) => {
                if (Math.abs(nokta - anahtar) / anahtar <= tolerans) {
                    degerler.push(nokta);
                    eklendi = true;
                }
            });
            if (!eklendi) {
                gruplanmis.set(nokta, [nokta]);
            }
        });

        gruplanmis.forEach((degerler, _) => {
            const ortalama = degerler.reduce((a, b) => a + b) / degerler.length;
            const guc = Math.min(10, degerler.length * 2);

            seviyeler.push({
                seviye: ortalama,
                tip,
                guc,
                testSayisi: degerler.length,
            });
        });
    };

    grupla(dipler.filter(d => d < sonFiyat), 'DESTEK');
    grupla(tepeler.filter(t => t > sonFiyat), 'DİRENÇ');

    // Güce göre sırala
    return seviyeler.sort((a, b) => b.guc - a.guc);
}

// ===== TREND ANALİZİ =====

/**
 * Lineer regresyon ile trend çizgisi
 */
export function trendCizgisi(candles: Candle[]): TrendInfo {
    const n = candles.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = candles.map(c => c.close);

    // Ortalamalar
    const xOrt = x.reduce((a, b) => a + b) / n;
    const yOrt = y.reduce((a, b) => a + b) / n;

    // Eğim (m) hesapla
    let pay = 0;
    let payda = 0;
    for (let i = 0; i < n; i++) {
        pay += (x[i] - xOrt) * (y[i] - yOrt);
        payda += (x[i] - xOrt) ** 2;
    }

    const egim = pay / payda;
    const kesisim = yOrt - egim * xOrt;

    // Trend yönü belirle
    const aciDerece = Math.atan(egim) * (180 / Math.PI);
    let yonu: TrendInfo['yonu'];

    if (aciDerece > 5) yonu = 'YUKARI';
    else if (aciDerece < -5) yonu = 'AŞAĞI';
    else yonu = 'YATAY';

    return {
        yonu,
        baslangic: candles[0].date,
        guc: Math.abs(aciDerece),
        cizgiDenklemi: { egim, kesisim },
    };
}

// ===== FİBONACCİ DÜZELTMELERİ =====

export const FIBONACCI_SEVIYELERI = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

/**
 * Fibonacci düzeltme seviyelerini hesapla
 */
export function fibonacciSeviyeleri(
    enDusuk: number,
    enYuksek: number,
    dusus: boolean = false
): { seviye: number; oran: number }[] {
    const fark = enYuksek - enDusuk;

    return FIBONACCI_SEVIYELERI.map(oran => ({
        oran,
        seviye: dusus
            ? enYuksek - fark * oran
            : enDusuk + fark * oran,
    }));
}

// ===== HACİM ANALİZİ =====

/**
 * Hacim teyidi kontrol
 * Ali Perşembe: "Fiyat hareketi hacimle teyit edilmeli"
 */
export function hacimTeyidi(candles: Candle[], pencere: number = 20): {
    teyitli: boolean;
    hacimTrendi: 'ARTAN' | 'AZALAN' | 'NORMAL';
    aciklama: string;
} {
    if (candles.length < pencere + 1) {
        return { teyitli: false, hacimTrendi: 'NORMAL', aciklama: 'Yetersiz veri' };
    }

    const sonMumlar = candles.slice(-pencere);
    const ortalamaHacim = sonMumlar.reduce((a, b) => a + b.volume, 0) / pencere;
    const sonHacim = candles[candles.length - 1].volume;
    const sonFiyatDegisim = candles[candles.length - 1].close - candles[candles.length - 2].close;

    // Hacim ortalamanın üzerinde mi?
    const hacimYukarida = sonHacim > ortalamaHacim * 1.2;

    let hacimTrendi: 'ARTAN' | 'AZALAN' | 'NORMAL' = 'NORMAL';
    if (sonHacim > ortalamaHacim * 1.5) hacimTrendi = 'ARTAN';
    else if (sonHacim < ortalamaHacim * 0.7) hacimTrendi = 'AZALAN';

    // Fiyat yükselirken hacim artmalı (boğa piyasası)
    // Fiyat düşerken hacim artmalı (ayı piyasası teyit)
    const teyitli = hacimYukarida && Math.abs(sonFiyatDegisim) > 0;

    let aciklama = '';
    if (sonFiyatDegisim > 0 && hacimYukarida) {
        aciklama = '✅ Yükseliş hacimle teyit edildi (Ali Perşembe kuralı)';
    } else if (sonFiyatDegisim < 0 && hacimYukarida) {
        aciklama = '⚠️ Düşüş güçlü hacimle geliyor - dikkat';
    } else if (sonFiyatDegisim > 0 && !hacimYukarida) {
        aciklama = '⚠️ Yükseliş zayıf hacimle - teyit yok';
    } else {
        aciklama = 'Belirgin hacim sinyali yok';
    }

    return { teyitli, hacimTrendi, aciklama };
}

// ===== FORMASYON TESPİTİ (Basit) =====

/**
 * Çift dip formasyonu tespit
 */
export function ciftDipTespit(candles: Candle[], tolerans: number = 0.03): Formasyon | null {
    if (candles.length < 20) return null;

    const { dipler } = pivotNoktalari(candles, 3);

    if (dipler.length < 2) return null;

    const sonIkiDip = dipler.slice(-2);
    const fark = Math.abs(sonIkiDip[0] - sonIkiDip[1]) / sonIkiDip[0];

    if (fark <= tolerans) {
        const ortalamaDip = (sonIkiDip[0] + sonIkiDip[1]) / 2;
        const sonFiyat = candles[candles.length - 1].close;

        // Boyun çizgisini bul (iki dip arasındaki tepe)
        const aradakiTepeler = candles
            .filter(c => c.low >= ortalamaDip)
            .map(c => c.high);
        const boyunCizgisi = Math.max(...aradakiTepeler);

        // Hedef: Boyun çizgisi + (boyun çizgisi - dip) = 2x boyun - dip
        const hedef = boyunCizgisi + (boyunCizgisi - ortalamaDip);

        return {
            tip: 'CIFT_DIP',
            guvenilirlik: 70,
            hedefFiyat: hedef,
            aciklama: `Çift dip formasyonu: Dip=${ortalamaDip.toFixed(2)}, Hedef=${hedef.toFixed(2)}`,
        };
    }

    return null;
}

// ===== ANA ANALİZ FONKSİYONU =====

export interface PersembeAnaliz {
    destekDirenc: SupportResistance[];
    trend: TrendInfo;
    fibonacci: { seviye: number; oran: number }[];
    hacim: ReturnType<typeof hacimTeyidi>;
    formasyon: Formasyon | null;
    ozet: string;
}

/**
 * Tam Ali Perşembe analizi
 */
export function persembeAnaliz(candles: Candle[]): PersembeAnaliz {
    const destekDirenc = destekDirencBul(candles);
    const trend = trendCizgisi(candles);

    // Son 50 mumun min/max için Fibonacci
    const son50 = candles.slice(-50);
    const enDusuk = Math.min(...son50.map(c => c.low));
    const enYuksek = Math.max(...son50.map(c => c.high));
    const fibonacci = fibonacciSeviyeleri(enDusuk, enYuksek, trend.yonu === 'AŞAĞI');

    const hacim = hacimTeyidi(candles);
    const formasyon = ciftDipTespit(candles);

    // Özet oluştur
    const destekler = destekDirenc.filter(s => s.tip === 'DESTEK').slice(0, 2);
    const direncler = destekDirenc.filter(s => s.tip === 'DİRENÇ').slice(0, 2);

    const ozet = `
📈 Ali Perşembe Teknik Analiz Özeti
━━━━━━━━━━━━━━━━━━━━━━━━━━
Trend: ${trend.yonu} (Güç: ${trend.guc.toFixed(1)}°)
Destek: ${destekler.map(d => d.seviye.toFixed(2)).join(', ') || 'Belirsiz'}
Direnç: ${direncler.map(d => d.seviye.toFixed(2)).join(', ') || 'Belirsiz'}
Hacim: ${hacim.aciklama}
${formasyon ? `Formasyon: ${formasyon.aciklama}` : ''}
`;

    return {
        destekDirenc,
        trend,
        fibonacci,
        hacim,
        formasyon,
        ozet,
    };
}

export default {
    pivotNoktalari,
    destekDirencBul,
    trendCizgisi,
    fibonacciSeviyeleri,
    hacimTeyidi,
    ciftDipTespit,
    persembeAnaliz,
    FIBONACCI_SEVIYELERI,
};
