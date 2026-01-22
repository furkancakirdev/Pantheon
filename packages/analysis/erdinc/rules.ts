/**
 * Yaşar Erdinç Temel Analiz Kural Motoru
 * 
 * Kaynak: d:\yaşar erdinç\TEMEL ANALIZ\DOKUMANLAR
 * 
 * Kurallar:
 * - Büyüme Kriterleri: Net kar artışı > %15 YoY
 * - Borçluluk Rasyoları: Borç/Özkaynak < 1.5
 * - Piyasa Çarpanları: F/K < Sektör Ortalaması
 * - Nakit Döngüsü: < 90 gün
 * - DuPont Analizi: ROE ayrıştırması
 */

import type { StockFundamentals } from '../api-clients/isyatirim.js';

/**
 * Erdinç Analiz Skoru
 */
export interface ErdincScore {
    kod: string;
    ad: string;
    toplamSkor: number;           // 0-100 arası
    buyumeSkor: number;           // Büyüme kriterleri
    borcSkor: number;             // Borçluluk rasyoları
    carpanSkor: number;           // Piyasa çarpanları
    karlilikSkor: number;         // Karlılık (ROE, DuPont)
    gerekceler: string[];         // Neden bu skor?
    uyari: string[];              // Dikkat edilmesi gerekenler
}

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
};

/**
 * Tek bir hisse için Erdinç skoru hesapla
 */
export function hesaplaErdincSkor(
    hisse: StockFundamentals,
    sektorOrt: typeof SEKTOR_ORTALAMALARI = SEKTOR_ORTALAMALARI
): ErdincScore {
    const gerekceler: string[] = [];
    const uyarilar: string[] = [];

    // 1. Büyüme Skoru (25 puan)
    let buyumeSkor = 0;
    // Not: Büyüme verisi API'den gelmiyor, şimdilik placeholder
    buyumeSkor = 15; // Ortalama varsayım
    gerekceler.push('Büyüme verisi ayrıca hesaplanmalı (bilanço karşılaştırması)');

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

    return {
        kod: hisse.kod,
        ad: hisse.ad,
        toplamSkor,
        buyumeSkor,
        borcSkor,
        carpanSkor,
        karlilikSkor,
        gerekceler,
        uyari: uyarilar,
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

    return `
## ${emoji} ${skor.kod} - ${skor.ad}

### Erdinç Skoru: ${skor.toplamSkor}/100

| Kategori | Skor |
|----------|------|
| Büyüme | ${skor.buyumeSkor}/25 |
| Borçluluk | ${skor.borcSkor}/25 |
| Çarpanlar | ${skor.carpanSkor}/25 |
| Karlılık | ${skor.karlilikSkor}/25 |

### Gerekçeler
${skor.gerekceler.map(g => `- ${g}`).join('\n')}

${skor.uyari.length > 0 ? `### Uyarılar
${skor.uyari.map(u => `- ${u}`).join('\n')}` : ''}
`;
}

export default {
    hesaplaErdincSkor,
    skorlaVeSirala,
    filtreleSkorile,
    raporFormatla,
    ESIK_DEGERLER,
    SEKTOR_ORTALAMALARI,
};
