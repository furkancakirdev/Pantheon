/**
 * Yaşar Erdinç Temel Analiz Kural Motoru V2
 *
 * Kaynak: d:\yaşar erdinç\TEMEL ANALIZ\DOKUMANLAR
 *
 * Kurallar:
 * - Büyüme Kriterleri: Net kar artışı > %15 YoY
 * - Borçluluk Rasyoları: Borç/Özkaynak < 1.5
 * - Piyasa Çarpanları: F/K < Sektör Ortalaması
 * - Nakit Döngüsü: < 90 gün
 * - DuPont Analizi: ROE ayrıştırması
 *
 * YENİ V2 - Ek Kriterler:
 * - Aktif Karlılığı (ROA) > %8
 * - Net Kar Marjı (NKM) > %10
 * - Serbest Nakit Akışı (FCF) > 0
 * - Brüt Kar Marjı (BKM) > %25
 * - ROIC > %10
 */

import type { StockFundamentals } from '@api/isyatirim';

// ============ GENİŞLETİLMİŞ VERİ YAPILARI ============

/**
 * Gelişmiş Temel Analiz Verileri
 */
export interface ExtendedFundamentals extends StockFundamentals {
    // Mevcut alanlar
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

    // YENİ - Gelişmiş Karlılık Metrikleri
    aktifKariligi?: number;      // ROA - Return on Assets (%)
    netKarMarji?: number;         // NKM - Net Profit Margin (%)
    serbestNakitAkisi?: number;   // FCF - Free Cash Flow (TL)
    brutKarMarji?: number;        // BKM - Gross Profit Margin (%)
    roic?: number;                // ROIC - Return on Invested Capital (%)

    // YENİ - Büyüme Metrikleri
    netKarArtisYillik?: number;   // YoY Net Kar Artış (%)
    satisArtisYillik?: number;    // YoY Satış Artış (%)

    // YENİ - Operasyonel Verimlilik
    nakitDonemHizi?: number;      // Nakit dönüşüm hızı (gün)
    stokDevirHizi?: number;       // Stok devir hızı
    alacakDevirHizi?: number;     // Alacak devir hızı
}

/**
 * Erdinç Analiz Skoru V2
 */
export interface ErdincScore {
    kod: string;
    ad: string;
    toplamSkor: number;           // 0-100 arası
    buyumeSkor: number;           // Büyüme kriterleri (0-25)
    borcSkor: number;             // Borçluluk rasyoları (0-25)
    carpanSkor: number;           // Piyasa çarpanları (0-25)
    karlilikSkor: number;         // Karlılık - ROE (0-25)

    // YENİ V2
    gidaSkor?: number;            // GIDA (Gelişmiş) Skor (0-100)
    gidaKriterler?: {
        aktifKariligi: boolean;    // ROA > %8
        netKarMarji: boolean;      // NKM > %10
        serbestNakitAkisi: boolean; // FCF > 0
        brutKarMarji: boolean;     // BKM > %25
        roic: boolean;             // ROIC > %10
    };

    gerekceler: string[];         // Neden bu skor?
    uyari: string[];              // Dikkat edilmesi gerekenler
}

// ============ SABİT DEĞERLER ============

/**
 * Sektör ortalamaları (varsayılan değerler)
 */
export const SEKTOR_ORTALAMALARI = {
    fk: 12,
    pddd: 1.5,
    roe: 15,
    borcOzkaynak: 1.0,
};

/**
 * Erdinç kriteri eşik değerleri
 */
export const ESIK_DEGERLER = {
    // Büyüme
    minNetKarArtisi: 15,          // %15 minimum net kar artışı

    // Borçluluk
    maxBorcOzkaynak: 1.5,         // Maksimum 1.5x borç/özkaynak
    idealBorcOzkaynak: 0.8,       // İdeal 0.8x altı

    // Çarpanlar
    maxFk: 15,                    // Maksimum F/K
    maxPddd: 2.0,                 // Maksimum PD/DD

    // Karlılık
    minRoe: 15,                   // Minimum %15 ROE
    hedefRoe: 20,                 // Hedef %20+ ROE

    // YENİ V2 - GIDA Kriterleri
    minAktifKariligi: 8,          // ROA > %8
    minNetKarMarji: 10,           // NKM > %10
    minBrutKarMarji: 25,          // BKM > %25
    minRoic: 10,                  // ROIC > %10
};

/**
 * GIDA Filtre Eşikleri (Yaşar Erdinç)
 * "Şirketleri detaylıca inceledikten sonra fiyatlaması da uygunsa portföyüme dahil ediyorum."
 */
export const GIDA_FILTRE = {
    aktifKariligi: 8,             // Aktif Karlılığı %8 ve üzeri
    netKarMarji: 10,              // Net Kar Marjı %10 ve üzeri
    serbestNakitAkisi: 0,         // Serbest Nakit Akışı pozitif
    brutKarMarji: 25,             // Brüt Kar Marjı %25 ve üzeri
    roic: 10,                     // ROIC %10 ve üzeri
};

// ============ GIDA SKOR HESAPLAMA ============

/**
 * GIDA (Gelişmiş) Skor Hesaplama
 * Yaşar Erdinç'in temel analiz filtreleri
 */
export function hesaplaGidaSkor(
    hisse: ExtendedFundamentals
): { skor: number; kriterler: ErdincScore['gidaKriterler']; gerekceler: string[] } {
    const kriterler = {
        aktifKariligi: false,
        netKarMarji: false,
        serbestNakitAkisi: false,
        brutKarMarji: false,
        roic: false,
    };

    const gerekceler: string[] = [];
    let puan = 0;

    // 1. Aktif Karlılığı (ROA) > %8 (20 puan)
    if (hisse.aktifKariligi !== undefined && hisse.aktifKariligi >= GIDA_FILTRE.aktifKariligi) {
        kriterler.aktifKariligi = true;
        puan += 20;
        gerekceler.push(`✅ Aktif Karlılığı (ROA): %${hisse.aktifKariligi.toFixed(1)} >= %${GIDA_FILTRE.aktifKariligi}`);
    } else if (hisse.aktifKariligi !== undefined) {
        gerekceler.push(`❌ Aktif Karlılığı (ROA): %${hisse.aktifKariligi.toFixed(1)} < %${GIDA_FILTRE.aktifKariligi}`);
    } else {
        gerekceler.push(`⚠️ Aktif Karlılığı verisi yok`);
    }

    // 2. Net Kar Marjı (NKM) > %10 (20 puan)
    if (hisse.netKarMarji !== undefined && hisse.netKarMarji >= GIDA_FILTRE.netKarMarji) {
        kriterler.netKarMarji = true;
        puan += 20;
        gerekceler.push(`✅ Net Kar Marjı: %${hisse.netKarMarji.toFixed(1)} >= %${GIDA_FILTRE.netKarMarji}`);
    } else if (hisse.netKarMarji !== undefined) {
        gerekceler.push(`❌ Net Kar Marjı: %${hisse.netKarMarji.toFixed(1)} < %${GIDA_FILTRE.netKarMarji}`);
    } else {
        gerekceler.push(`⚠️ Net Kar Marjı verisi yok`);
    }

    // 3. Serbest Nakit Akışı (FCF) > 0 (20 puan)
    if (hisse.serbestNakitAkisi !== undefined && hisse.serbestNakitAkisi > GIDA_FILTRE.serbestNakitAkisi) {
        kriterler.serbestNakitAkisi = true;
        puan += 20;
        gerekceler.push(`✅ Serbest Nakit Akışı: ${hisse.serbestNakitAkisi.toFixed(0)}M TL > 0`);
    } else if (hisse.serbestNakitAkisi !== undefined) {
        gerekceler.push(`❌ Serbest Nakit Akışı negatif: ${hisse.serbestNakitAkisi.toFixed(0)}M TL`);
    } else {
        gerekceler.push(`⚠️ Serbest Nakit Akışı verisi yok`);
    }

    // 4. Brüt Kar Marjı (BKM) > %25 (20 puan)
    if (hisse.brutKarMarji !== undefined && hisse.brutKarMarji >= GIDA_FILTRE.brutKarMarji) {
        kriterler.brutKarMarji = true;
        puan += 20;
        gerekceler.push(`✅ Brüt Kar Marjı: %${hisse.brutKarMarji.toFixed(1)} >= %${GIDA_FILTRE.brutKarMarji}`);
    } else if (hisse.brutKarMarji !== undefined) {
        gerekceler.push(`❌ Brüt Kar Marjı: %${hisse.brutKarMarji.toFixed(1)} < %${GIDA_FILTRE.brutKarMarji}`);
    } else {
        gerekceler.push(`⚠️ Brüt Kar Marjı verisi yok`);
    }

    // 5. ROIC > %10 (20 puan)
    if (hisse.roic !== undefined && hisse.roic >= GIDA_FILTRE.roic) {
        kriterler.roic = true;
        puan += 20;
        gerekceler.push(`✅ ROIC: %${hisse.roic.toFixed(1)} >= %${GIDA_FILTRE.roic}`);
    } else if (hisse.roic !== undefined) {
        gerekceler.push(`❌ ROIC: %${hisse.roic.toFixed(1)} < %${GIDA_FILTRE.roic}`);
    } else {
        gerekceler.push(`⚠️ ROIC verisi yok`);
    }

    return { skor: puan, kriterler, gerekceler };
}

// ============ ERDİNÇ SKOR HESAPLAMA ============

/**
 * Tek bir hisse için Erdinç skoru hesapla
 */
export function hesaplaErdincSkor(
    hisse: StockFundamentals | ExtendedFundamentals,
    sektorOrt: typeof SEKTOR_ORTALAMALARI = SEKTOR_ORTALAMALARI
): ErdincScore {
    const gerekceler: string[] = [];
    const uyarilar: string[] = [];

    // 1. Büyüme Skoru (25 puan)
    let buyumeSkor = 0;

    // Gelişmiş veri varsa net kar artışını kullan
    const extended = hisse as ExtendedFundamentals;
    if (extended.netKarArtisYillik !== undefined) {
        if (extended.netKarArtisYillik >= ESIK_DEGERLER.minNetKarArtisi) {
            buyumeSkor = 25;
            gerekceler.push(`✅ Net Kar Artışı: %${extended.netKarArtisYillik.toFixed(1)} (Erdinç: >%${ESIK_DEGERLER.minNetKarArtisi})`);
        } else if (extended.netKarArtisYillik > 0) {
            buyumeSkor = 12;
            gerekceler.push(`✓ Net Kar Artışı: %${extended.netKarArtisYillik.toFixed(1)} - Düşük`);
        } else {
            buyumeSkor = 0;
            uyarilar.push(`❌ Net Kar Artışı: %${extended.netKarArtisYillik.toFixed(1)} - Negatif`);
        }
    } else {
        // Büyüme verisi yok, ortalamadan varsay
        buyumeSkor = 15;
        gerekceler.push('⚠️ Büyüme verisi ayrıca hesaplanmalı (bilanço karşılaştırması)');
    }

    // 2. Borç Skoru (25 puan)
    let borcSkor = 0;
    if (hisse.borcOzkaynak <= ESIK_DEGERLER.idealBorcOzkaynak) {
        borcSkor = 25;
        gerekceler.push(`✅ Borç/Özkaynak: ${hisse.borcOzkaynak?.toFixed(2)} - MÜKEMMEL (Erdinç: <0.8)`);
    } else if (hisse.borcOzkaynak <= ESIK_DEGERLER.maxBorcOzkaynak) {
        borcSkor = 18;
        gerekceler.push(`✓ Borç/Özkaynak: ${hisse.borcOzkaynak?.toFixed(2)} - KABUL EDİLEBİLİR`);
    } else if (hisse.borcOzkaynak <= 2.0) {
        borcSkor = 10;
        uyarilar.push(`⚠️ Borç/Özkaynak: ${hisse.borcOzkaynak?.toFixed(2)} - YÜKSEK`);
    } else {
        borcSkor = 0;
        uyarilar.push(`❌ Borç/Özkaynak: ${hisse.borcOzkaynak?.toFixed(2)} - TEHLİKELİ`);
    }

    // 3. Çarpan Skoru (25 puan)
    let carpanSkor = 0;

    // F/K değerlendirmesi
    if (hisse.fk > 0 && hisse.fk <= ESIK_DEGERLER.maxFk) {
        carpanSkor += 12;
        gerekceler.push(`✅ F/K: ${hisse.fk?.toFixed(1)} - UCUZ (Erdinç: <${ESIK_DEGERLER.maxFk})`);
    } else if (hisse.fk > ESIK_DEGERLER.maxFk && hisse.fk <= sektorOrt.fk * 1.2) {
        carpanSkor += 8;
        gerekceler.push(`✓ F/K: ${hisse.fk?.toFixed(1)} - MAKUL`);
    } else if (hisse.fk > 0) {
        uyarilar.push(`⚠️ F/K: ${hisse.fk?.toFixed(1)} - PAHALI`);
    }

    // PD/DD değerlendirmesi
    if (hisse.pddd > 0 && hisse.pddd <= sektorOrt.pddd) {
        carpanSkor += 13;
        gerekceler.push(`✅ PD/DD: ${hisse.pddd?.toFixed(2)} - DEĞER ALANINDA`);
    } else if (hisse.pddd > 0 && hisse.pddd <= ESIK_DEGERLER.maxPddd) {
        carpanSkor += 8;
        gerekceler.push(`✓ PD/DD: ${hisse.pddd?.toFixed(2)} - KABUL EDİLEBİLİR`);
    } else if (hisse.pddd > 0) {
        uyarilar.push(`⚠️ PD/DD: ${hisse.pddd?.toFixed(2)} - PAHALI`);
    }

    // 4. Karlılık Skoru - ROE (25 puan)
    let karlilikSkor = 0;
    if (hisse.roe >= ESIK_DEGERLER.hedefRoe) {
        karlilikSkor = 25;
        gerekceler.push(`✅ ROE: %${hisse.roe?.toFixed(1)} - MÜKEMMEL (Erdinç: >%20)`);
    } else if (hisse.roe >= ESIK_DEGERLER.minRoe) {
        karlilikSkor = 18;
        gerekceler.push(`✓ ROE: %${hisse.roe?.toFixed(1)} - İYİ`);
    } else if (hisse.roe > 0) {
        karlilikSkor = 10;
        uyarilar.push(`⚠️ ROE: %${hisse.roe?.toFixed(1)} - DÜŞÜK`);
    } else {
        karlilikSkor = 0;
        uyarilar.push(`❌ ROE: %${hisse.roe?.toFixed(1)} - NEGATİF/YOK`);
    }

    // Toplam skor
    const toplamSkor = buyumeSkor + borcSkor + carpanSkor + karlilikSkor;

    // GIDA Skorunu hesapla (eğer gelişmiş veri varsa)
    let gidaSkor: number | undefined;
    let gidaKriterler: ErdincScore['gidaKriterler'] | undefined;

    const extendedData = hisse as ExtendedFundamentals;
    if (extendedData.aktifKariligi !== undefined ||
        extendedData.netKarMarji !== undefined ||
        extendedData.serbestNakitAkisi !== undefined) {

        const gidaResult = hesaplaGidaSkor(extendedData);
        gidaSkor = gidaResult.skor;
        gidaKriterler = gidaResult.kriterler;

        // GIDA gerekçelerini ana listeye ekle
        gerekceler.push(...gidaResult.gerekceler);
    }

    return {
        kod: hisse.kod,
        ad: hisse.ad,
        toplamSkor,
        buyumeSkor,
        borcSkor,
        carpanSkor,
        karlilikSkor,
        gidaSkor,
        gidaKriterler,
        gerekceler,
        uyari: uyarilar,
    };
}

// ============ GIDA FİLTRELEME ============

/**
 * GIDA Filtresi - Yaşar Erdinç kriterlerine göre hisse seçimi
 *
 * Kriterler:
 * - Aktif Karlılığı %8 ve üzeri
 * - Net Kar Marjı %10 ve üzeri
 * - Serbest Nakit Akışı pozitif
 * - Brüt Kar Marjı %25 ve üzeri
 * - ROIC %10 ve üzeri
 */
export function filtreleGIDA(
    hisseler: (StockFundamentals | ExtendedFundamentals)[]
): { filtrelenen: ErdincScore[]; geceler: Array<ErdincScore & { gidaSkor: number }> } {

    const sonuc: Array<ErdincScore & { gidaSkor: number }> = [];
    const geceler: Array<ErdincScore & { gidaSkor: number }> = [];

    for (const hisse of hisseler) {
        const score = hesaplaErdincSkor(hisse) as ErdincScore & { gidaSkor?: number };

        const extended = hisse as ExtendedFundamentals;

        // GIDA kriterleri kontrolü
        const gidaKriterler = {
            aktifKariligi: extended.aktifKariligi !== undefined && extended.aktifKariligi >= GIDA_FILTRE.aktifKariligi,
            netKarMarji: extended.netKarMarji !== undefined && extended.netKarMarji >= GIDA_FILTRE.netKarMarji,
            serbestNakitAkisi: extended.serbestNakitAkisi !== undefined && extended.serbestNakitAkisi > GIDA_FILTRE.serbestNakitAkisi,
            brutKarMarji: extended.brutKarMarji !== undefined && extended.brutKarMarji >= GIDA_FILTRE.brutKarMarji,
            roic: extended.roic !== undefined && extended.roic >= GIDA_FILTRE.roic,
        };

        // Tüm kriterleri sağlayanlar
        const tumKriterlerSagliyor =
            gidaKriterler.aktifKariligi &&
            gidaKriterler.netKarMarji &&
            gidaKriterler.serbestNakitAkisi &&
            gidaKriterler.brutKarMarji &&
            gidaKriterler.roic;

        const gidaSonuc = {
            ...score,
            gidaKriterler,
            tumKriterlerSagliyor,
        };

        if (tumKriterlerSagliyor) {
            geceler.push(gidaSonuc as any);
        }

        sonuc.push(gidaSonuc as any);
    }

    return {
        filtrelenen: sonuc.filter(s => (s as any).tumKriterlerSagliyor),
        geceler: sonuc.sort((a, b) => (b.gidaSkor || 0) - (a.gidaSkor || 0)),
    };
}

/**
 * Tüm hisseleri skorla ve sırala
 */
export function skorlaVeSirala(hisseler: StockFundamentals[]): ErdincScore[] {
    return hisseler
        .map(h => hesaplaErdincSkor(h))
        .sort((a, b) => b.toplamSkor - a.toplamSkor);
}

/**
 * Minimum skora göre filtrele
 */
export function filtreleSkorile(skorlar: ErdincScore[], minSkor: number = 70): ErdincScore[] {
    return skorlar.filter(s => s.toplamSkor >= minSkor);
}

/**
 * Rapor formatla (Markdown)
 */
export function raporFormatla(skor: ErdincScore): string {
    const emoji = skor.toplamSkor >= 80 ? '🌟' : skor.toplamSkor >= 60 ? '✅' : '⚠️';

    let rapor = `
## ${emoji} ${skor.kod} - ${skor.ad}

### Erdinç Skoru: ${skor.toplamSkor}/100

| Kategori | Skor |
|----------|------|
| Büyüme | ${skor.buyumeSkor}/25 |
| Borçluluk | ${skor.borcSkor}/25 |
| Çarpanlar | ${skor.carpanSkor}/25 |
| Karlılık | ${skor.karlilikSkor}/25 |
`;

    // GIDA Skoru varsa ekle
    if (skor.gidaSkor !== undefined) {
        rapor += `| **GIDA** | **${skor.gidaSkor}/100** |\n`;
    }

    rapor += `
### Gerekçeler
${skor.gerekceler.map(g => `- ${g}`).join('\n')}
`;

    if (skor.uyari.length > 0) {
        rapor += `
### Uyarılar
${skor.uyari.map(u => `- ${u}`).join('\n')}
`;
    }

    return rapor;
}

export default {
    hesaplaErdincSkor,
    hesaplaGidaSkor,
    filtreleGIDA,
    skorlaVeSirala,
    filtreleSkorile,
    raporFormatla,
    ESIK_DEGERLER,
    SEKTOR_ORTALAMALARI,
    GIDA_FILTRE,
};
