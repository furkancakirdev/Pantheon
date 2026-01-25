/**
 * Ali Perşembe Teknik Analiz Yöntemleri
 *
 * Kaynak: d:\Ali Perşembe\Teknik Analiz mi Dedin (Ali Persembe).pdf
 *          d:\AlgoTrade\MUM FORMASYONLARI
 *
 * Yöntemler:
 * - Destek / Direnç Seviyeleri
 * - Trend Çizgileri
 * - Grafik Formasyonları (Omuz-Baş-Omuz, Üçgenler, vb.)
 * - Hacim Analizi
 * - Fibonacci Düzeltmeleri
 * - Mum Formasyonları (Çekiç, Yutan, Doji Hamile, vb.)
 */

import type { Candle } from '../kivanc/indicators';

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

// ===== MUM FORMASYONLARI (AlgoTrade) =====

/**
 * Mum formasyonu sonucu
 */
export interface MumFormasyonu {
    tip: string;
    sinyal: 'AL' | 'SAT' | 'BEKLE';
    guvenilirlik: number;  // 0-100
    aciklama: string;
}

/**
 * Çekiç Boğa Formasyonu (Hammer)
 * K1: (H=C AND H>O AND (O-L)/(H-O)>=2) AND REF(L,-1)>O AND REF(L,-2)>O
 * K2: (H=O AND H>C AND (O-C)/(C-L)<=0.5) AND REF(L,-1)>C AND REF(L,-2)>C
 *
 * Özellikler: Alt gölge uzun, üst gölge yok/çok kısa, gövde küçük
 * Konum: Düşüş sonrası dip bölgesinde
 */
export function cekicBuga(candles: Candle[]): MumFormasyonu | null {
    if (candles.length < 3) return null;

    const curr = candles[candles.length - 1];
    const prev1 = candles[candles.length - 2];
    const prev2 = candles[candles.length - 3];

    const { open: o, high: h, low: l, close: c } = curr;
    const body = Math.abs(c - o);
    const upperShadow = h - Math.max(o, c);
    const lowerShadow = Math.min(o, c) - l;

    // K1: H=C (üst gölge yok), gövde üstte, alt gölde en az 2x gövde
    const k1 = (h === c || h === o) && h > Math.min(o, c) && lowerShadow >= body * 2;
    // K2: H=O (üst gölge yok), gövde altta, alt gölce küçük
    const k2 = (h === o) && h > c && body <= (c - l) * 0.5;

    // Önceki 2 mumun düşüş trendi olduğunu kontrol et
    const dususTrendi = prev1.low > o && prev2.low > o;

    if ((k1 || k2) && dususTrendi) {
        return {
            tip: 'ÇEKİÇ (HAMMER)',
            sinyal: 'AL',
            guvenilirlik: 75,
            aciklama: 'Dip formasyonu: Çekiç, satış baskısının bittiğini işaret ediyor',
        };
    }

    return null;
}

/**
 * Yutan Boğa Formasyonu (Bullish Engulfing)
 * ref(c,-1)<=ref(o,-1) and c>o and ref(c,-1)>=o and c>=ref(o,-1) and (c-o)>(ref(o,-1)-ref(c,-1))
 *
 * Özellikler: Yeşil mum, önceki kırmızı mumu tamamen yutuyor
 * Konum: Düşüş sonrası
 */
export function yutanBuga(candles: Candle[], minHacim: number = 10000): MumFormasyonu | null {
    if (candles.length < 2) return null;

    const curr = candles[candles.length - 1];
    const prev = candles[candles.length - 2];

    // Önceki mum kırmızı (kapanış <= açılış)
    const oncekiKirmizi = prev.close <= prev.open;
    // Şu anki mum yeşil (kapanış > açılış)
    const suankiYesil = curr.close > curr.open;
    // Yutan koşulu
    const yutan = curr.close >= prev.open && curr.open <= prev.close;
    // Gövde büyüklük karşılaştırması
    const buyukGovde = (curr.close - curr.open) > (prev.open - prev.close);
    // Hacim kontrolü
    const hacimli = curr.volume > minHacim;

    if (oncekiKirmizi && suankiYesil && yutan && buyukGovde && hacimli) {
        return {
            tip: 'YUTAN BOĞA (ENGULFING)',
            sinyal: 'AL',
            guvenilirlik: 80,
            aciklama: 'Güçlü AL sinyali: Yeşil mum kırmızı mumu yutuyor',
        };
    }

    return null;
}

/**
 * Doji Hamile Boğa Formasyonu (Doji Star/Harami)
 * ref(c,-1)<ref(o,-1) and c=o and ref(c,-1)<=L and H<=ref(o,-1)
 *
 * Özellikler: Doji (açılış = kapanış), önceki kırmızı mumun gövdesi içinde
 * Konum: Düşüş trendi sonunda
 */
export function dojiHamileBuga(candles: Candle[]): MumFormasyonu | null {
    if (candles.length < 2) return null;

    const curr = candles[candles.length - 1];
    const prev = candles[candles.length - 2];

    // Doji kontrolü: açılış ≈ kapanış (%0.5 tolerans)
    const isDoji = Math.abs(curr.close - curr.open) / curr.open < 0.005;
    // Önceki mum kırmızı
    const oncekiKirmizi = prev.close < prev.open;
    // Doji, önceki mumun gövdesi içinde veya altında
    const icinde = curr.close <= prev.low && curr.high <= prev.open;

    if (isDoji && oncekiKirmizi && icinde) {
        return {
            tip: 'DOJİ HAMİLE (DOJI STAR)',
            sinyal: 'AL',
            guvenilirlik: 70,
            aciklama: 'Dönüş sinyali: Doji formasyonu, kararsızlığı işaret ediyor',
        };
    }

    return null;
}

/**
 * Tepen Mumları (Ayı formasyonları)
 */
export function tepenMumlari(candles: Candle[]): MumFormasyonu | null {
    if (candles.length < 2) return null;

    const curr = candles[candles.length - 1];
    const prev = candles[candles.length - 2];

    // Şotaci (Shooting Star) - Tepede长的 üst gölge
    const upperShadow = curr.high - Math.max(curr.open, curr.close);
    const lowerShadow = Math.min(curr.open, curr.close) - curr.low;
    const body = Math.abs(curr.close - curr.open);

    const isShootingStar = upperShadow > body * 2 && lowerShadow < body;

    if (isShootingStar && prev.close > prev.open) {
        return {
            tip: 'ŞOTACI (SHOOTING STAR)',
            sinyal: 'SAT',
            guvenilirlik: 70,
            aciklama: 'Tepe formasyonu: Üst gölce uzun, satış baskısı',
        };
    }

    return null;
}

/**
 * Sabah Yıldızı (Morning Star) - 3 mumlu formasyon
 * 1. Kırmızı mum (uzun)
 * 2. Küçük mum veya doji (gap ile)
 * 3. Yeşil mum (önemli kısmı geri aldı)
 */
export function sabahYildizi(candles: Candle[]): MumFormasyonu | null {
    if (candles.length < 3) return null;

    const curr = candles[candles.length - 1];
    const mid = candles[candles.length - 2];
    const prev = candles[candles.length - 3];

    // 1. Kırmızı mum
    const firstBearish = prev.close < prev.open;
    // 2. Küçük gövde (doji olabilir)
    const midSmall = Math.abs(mid.close - mid.open) < (prev.open - prev.close) * 0.3;
    // 3. Yeşil mum, ilk mumun ortasını geçti
    const lastBullish = curr.close > curr.open && curr.close > (prev.open + prev.close) / 2;

    if (firstBearish && midSmall && lastBullish) {
        return {
            tip: 'SABAH YILDIZI (MORNING STAR)',
            sinyal: 'AL',
            guvenilirlik: 85,
            aciklama: 'Güçlü dönüş formasyonu: 3 mumlu sabah yıldızı',
        };
    }

    return null;
}

/**
 * Tüm mum formasyonlarını tara
 */
export function mumFormasyonlariTara(candles: Candle[]): MumFormasyonu[] {
    const formasyonlar: MumFormasyonu[] = [];

    const cekic = cekicBuga(candles);
    if (cekic) formasyonlar.push(cekic);

    const yutan = yutanBuga(candles);
    if (yutan) formasyonlar.push(yutan);

    const doji = dojiHamileBuga(candles);
    if (doji) formasyonlar.push(doji);

    const tepe = tepenMumlari(candles);
    if (tepe) formasyonlar.push(tepe);

    const sabah = sabahYildizi(candles);
    if (sabah) formasyonlar.push(sabah);

    // Güvenilirliğe göre sırala
    return formasyonlar.sort((a, b) => b.guvenilirlik - a.guvenilirlik);
}

// ===== ANA ANALİZ FONKSİYONU =====

export interface PersembeAnaliz {
    destekDirenc: SupportResistance[];
    trend: TrendInfo;
    fibonacci: { seviye: number; oran: number }[];
    hacim: ReturnType<typeof hacimTeyidi>;
    formasyon: Formasyon | null;
    mumFormasyonlari: MumFormasyonu[];
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
    const mumFormasyonlari = mumFormasyonlariTara(candles);

    // Özet oluştur
    const destekler = destekDirenc.filter(s => s.tip === 'DESTEK').slice(0, 2);
    const direncler = destekDirenc.filter(s => s.tip === 'DİRENÇ').slice(0, 2);

    const mumFormasyonText = mumFormasyonlari.length > 0
        ? `\n📊 Mum Formasyonları:\n${mumFormasyonlari.map(f => `  • ${f.tip}: ${f.aciklama}`).join('\n')}`
        : '';

    const ozet = `
📈 Ali Perşembe Teknik Analiz Özeti
━━━━━━━━━━━━━━━━━━━━━━━━━━
Trend: ${trend.yonu} (Güç: ${trend.guc.toFixed(1)}°)
Destek: ${destekler.map(d => d.seviye.toFixed(2)).join(', ') || 'Belirsiz'}
Direnç: ${direncler.map(d => d.seviye.toFixed(2)).join(', ') || 'Belirsiz'}
Hacim: ${hacim.aciklama}
${formasyon ? `Formasyon: ${formasyon.aciklama}` : ''}${mumFormasyonText}
`;

    return {
        destekDirenc,
        trend,
        fibonacci,
        hacim,
        formasyon,
        mumFormasyonlari,
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
    // Mum formasyonları
    cekicBuga,
    yutanBuga,
    dojiHamileBuga,
    tepenMumlari,
    sabahYildizi,
    mumFormasyonlariTara,
    persembeAnaliz,
    FIBONACCI_SEVIYELERI,
};
