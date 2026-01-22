/**
 * Wonderkid Keşif Motoru
 * Football Manager tarzı "gelecek vaat eden şirket" tespiti
 * 
 * Kriterler:
 * - Yönetim vizyonu ve yeni yatırımlar
 * - Sektör potansiyeli (global trendler)
 * - Finansal dinamizm
 * - Haber/Sentiment skoru
 */

import type { StockFundamentals } from '../api-clients/isyatirim.js';
import type { ErdincScore } from '../erdinc/rules.js';

/**
 * Global megatrendler
 */
export const MEGA_TRENDLER = [
    'yapay zeka',
    'elektrikli araç',
    'yeşil enerji',
    'savunma',
    'siber güvenlik',
    'biyoteknoloji',
    'bulut bilişim',
    'otomasyon',
    'e-ticaret',
    'fintech',
];

/**
 * Türkiye odaklı sektörler
 */
export const TURKIYE_ODAK_SEKTORLER = [
    'savunma sanayi',
    'havacılık',
    'yazılım',
    'turizm',
    'ihracat',
    'enerji',
    'gıda',
    'otomotiv yan sanayi',
];

/**
 * Wonderkid skoru
 */
export interface WonderkidScore {
    kod: string;
    ad: string;
    wonderkidSkor: number;        // 0-100
    potansiyelYildiz: boolean;    // Top pick mi?
    nedenler: string[];
    riskler: string[];
    sektor: string;
    trendEslesmesi: string[];     // Hangi trendlere uyuyor
}

/**
 * Haber/duyuru analizi için basit keyword eşleştirme
 */
export const POZITIF_KEYWORDS = [
    'yatırım', 'büyüme', 'ihracat', 'rekor', 'artış',
    'ortaklık', 'anlaşma', 'sözleşme', 'ar-ge',
    'teknoloji', 'inovasyon', 'kapasite',
];

export const NEGATIF_KEYWORDS = [
    'zarar', 'borç', 'dava', 'kriz', 'daralma',
    'azalış', 'erteleme', 'iptal',
];

/**
 * Sektörü global trendlerle eşleştir
 */
function sektorTrendEslestir(sektor: string): string[] {
    const eslesme: string[] = [];
    const sektorLower = sektor?.toLowerCase() || '';

    if (sektorLower.includes('savun') || sektorLower.includes('havac')) {
        eslesme.push('savunma');
    }
    if (sektorLower.includes('enerji') || sektorLower.includes('elektrik')) {
        eslesme.push('yeşil enerji');
    }
    if (sektorLower.includes('teknoloji') || sektorLower.includes('yazılım')) {
        eslesme.push('yapay zeka', 'bulut bilişim');
    }
    if (sektorLower.includes('otomotiv')) {
        eslesme.push('elektrikli araç');
    }
    if (sektorLower.includes('banka') || sektorLower.includes('finans')) {
        eslesme.push('fintech');
    }
    if (sektorLower.includes('sağlık') || sektorLower.includes('ilaç')) {
        eslesme.push('biyoteknoloji');
    }

    return eslesme;
}

/**
 * Wonderkid skoru hesapla
 */
export function hesaplaWonderkidSkor(
    hisse: StockFundamentals,
    erdincSkor?: ErdincScore
): WonderkidScore {
    const nedenler: string[] = [];
    const riskler: string[] = [];
    let skor = 0;

    // 1. Sektör Potansiyeli (30 puan)
    const trendEslesmesi = sektorTrendEslestir(hisse.sektor);
    if (trendEslesmesi.length >= 2) {
        skor += 30;
        nedenler.push(`🌍 Çoklu megatrend eşleşmesi: ${trendEslesmesi.join(', ')}`);
    } else if (trendEslesmesi.length === 1) {
        skor += 20;
        nedenler.push(`🌍 Megatrend eşleşmesi: ${trendEslesmesi[0]}`);
    } else {
        skor += 5;
        riskler.push('Belirgin bir megatrend eşleşmesi yok');
    }

    // 2. Türkiye Odağı (15 puan)
    const turkiyeOdak = TURKIYE_ODAK_SEKTORLER.some(s =>
        hisse.sektor?.toLowerCase().includes(s)
    );
    if (turkiyeOdak) {
        skor += 15;
        nedenler.push('🇹🇷 Türkiye stratejik sektöründe');
    }

    // 3. Yabancı Yatırımcı İlgisi (15 puan)
    if (hisse.yabanciOran > 50) {
        skor += 15;
        nedenler.push(`📈 Yüksek yabancı ilgisi: %${hisse.yabanciOran?.toFixed(1)}`);
    } else if (hisse.yabanciOran > 30) {
        skor += 10;
        nedenler.push(`📊 Orta seviye yabancı ilgisi: %${hisse.yabanciOran?.toFixed(1)}`);
    }

    // 4. Temel Analiz Skoru (Erdinç) (25 puan)
    if (erdincSkor) {
        const erdincBonus = (erdincSkor.toplamSkor / 100) * 25;
        skor += erdincBonus;
        if (erdincSkor.toplamSkor >= 70) {
            nedenler.push(`✅ Güçlü Erdinç skoru: ${erdincSkor.toplamSkor}/100`);
        }
    }

    // 5. Düşük Market Cap = Daha fazla büyüme potansiyeli (15 puan)
    // Not: Market cap verisi şimdilik mevcut değil, ROE üzerinden tahmin
    if (hisse.roe > 20) {
        skor += 15;
        nedenler.push(`💰 Yüksek verimlilik: ROE %${hisse.roe?.toFixed(1)}`);
    } else if (hisse.roe > 15) {
        skor += 10;
    }

    // Risk değerlendirmesi
    if (hisse.borcOzkaynak > 1.5) {
        riskler.push(`⚠️ Yüksek borçluluk: ${hisse.borcOzkaynak?.toFixed(2)}x`);
        skor -= 5;
    }
    if (hisse.fk > 20) {
        riskler.push(`⚠️ Yüksek değerleme: F/K ${hisse.fk?.toFixed(1)}`);
        skor -= 3;
    }

    // Minimum 0, maksimum 100
    skor = Math.max(0, Math.min(100, skor));

    return {
        kod: hisse.kod,
        ad: hisse.ad,
        wonderkidSkor: Math.round(skor),
        potansiyelYildiz: skor >= 75,
        nedenler,
        riskler,
        sektor: hisse.sektor,
        trendEslesmesi,
    };
}

/**
 * Top Wonderkid'leri bul
 */
export function topWonderkids(
    hisseler: StockFundamentals[],
    limit: number = 10
): WonderkidScore[] {
    return hisseler
        .map(h => hesaplaWonderkidSkor(h))
        .sort((a, b) => b.wonderkidSkor - a.wonderkidSkor)
        .slice(0, limit);
}

/**
 * Wonderkid Rapor formatla
 */
export function wonderkidRapor(wk: WonderkidScore): string {
    const yildiz = wk.potansiyelYildiz ? '⭐' : '';

    return `
## ${yildiz} ${wk.kod} - Wonderkid Skoru: ${wk.wonderkidSkor}/100

**Sektör:** ${wk.sektor}
**Trend Eşleşmeleri:** ${wk.trendEslesmesi.join(', ') || 'Yok'}

### Neden Wonderkid?
${wk.nedenler.map(n => `- ${n}`).join('\n')}

${wk.riskler.length > 0 ? `### Riskler
${wk.riskler.map(r => `- ${r}`).join('\n')}` : ''}
`;
}

export default {
    hesaplaWonderkidSkor,
    topWonderkids,
    wonderkidRapor,
    MEGA_TRENDLER,
    TURKIYE_ODAK_SEKTORLER,
};
