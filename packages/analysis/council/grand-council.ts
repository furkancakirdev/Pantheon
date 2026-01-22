/**
 * Grand Council - Argus Terminal'den İlham Alınmış Oylama Sistemi
 * 
 * Tüm analiz modüllerinin oylama ile karar vermesi:
 * - Orion (Teknik Analiz) -> Kıvanç İndikatörleri
 * - Atlas (Temel Analiz) -> Yaşar Erdinç Kuralları
 * - Aether (Makro) -> (gelecekte)
 * - Hermes (Sentiment) -> Sentiment Analizi
 * - Athena (Faktör) -> Ali Perşembe Teknikleri
 * - Demeter (Sektör) -> Wonderkid Sektör Analizi
 */

import type { ErdincScore } from '../erdinc/rules.js';
import type { WonderkidScore } from '../wonderkid/engine.js';
import type { PersembeAnaliz } from '../persembe/technical.js';
import type { IndicatorResult, Signal } from '../kivanc/indicators.js';

/**
 * Modül oyları
 */
export type OyTipi = 'AL' | 'SAT' | 'BEKLE';

export interface ModulOyu {
    modul: string;
    oy: OyTipi;
    guven: number;      // 0-100 güven seviyesi
    aciklama: string;
}

/**
 * Council Kararı
 */
export interface CouncilKarar {
    hisse: string;
    sonKarar: OyTipi;
    konsensus: number;       // Oy birliği yüzdesi (0-100)
    oylar: ModulOyu[];
    toplamOy: {
        al: number;
        sat: number;
        bekle: number;
    };
    aciklama: string;
    tarih: Date;
}

/**
 * Erdinç skorundan oy üret
 */
export function erdincOyu(skor: ErdincScore): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    let guven = skor.toplamSkor;

    if (skor.toplamSkor >= 75) {
        oy = 'AL';
        guven = Math.min(100, skor.toplamSkor + 10);
    } else if (skor.toplamSkor <= 40) {
        oy = 'SAT';
        guven = 100 - skor.toplamSkor;
    }

    return {
        modul: 'Atlas (Temel Analiz - Erdinç)',
        oy,
        guven,
        aciklama: `Erdinç skoru: ${skor.toplamSkor}/100. ${skor.gerekceler.slice(0, 2).join(', ')}`,
    };
}

/**
 * Wonderkid skorundan oy üret
 */
export function wonderkidOyu(skor: WonderkidScore): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    let guven = skor.wonderkidSkor;

    if (skor.potansiyelYildiz) {
        oy = 'AL';
        guven = Math.min(100, skor.wonderkidSkor + 15);
    } else if (skor.wonderkidSkor >= 60) {
        oy = 'AL';
    } else if (skor.wonderkidSkor <= 30) {
        oy = 'SAT';
        guven = 100 - skor.wonderkidSkor;
    }

    return {
        modul: 'Demeter (Sektör Rotasyonu - Wonderkid)',
        oy,
        guven,
        aciklama: `Wonderkid skoru: ${skor.wonderkidSkor}/100. Trendler: ${skor.trendEslesmesi.join(', ')}`,
    };
}

/**
 * Teknik analiz sinyallerinden oy üret
 */
export function teknikOyu(sinyaller: IndicatorResult[]): ModulOyu {
    const alSayisi = sinyaller.filter(s => s.signal === 'AL').length;
    const satSayisi = sinyaller.filter(s => s.signal === 'SAT').length;
    const toplam = sinyaller.length;

    let oy: OyTipi = 'BEKLE';
    let guven = 50;

    if (toplam > 0) {
        const alOran = alSayisi / toplam;
        const satOran = satSayisi / toplam;

        if (alOran >= 0.6) {
            oy = 'AL';
            guven = Math.round(alOran * 100);
        } else if (satOran >= 0.6) {
            oy = 'SAT';
            guven = Math.round(satOran * 100);
        }
    }

    const detay = sinyaller.map(s => `${s.name}: ${s.signal}`).join(', ');

    return {
        modul: 'Orion (Teknik Analiz - Kıvanç)',
        oy,
        guven,
        aciklama: `${alSayisi} AL, ${satSayisi} SAT sinyali. ${detay}`,
    };
}

/**
 * Perşembe teknik analizinden oy üret
 */
export function persembeOyu(analiz: PersembeAnaliz): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    let guven = 50;

    // Trend yönüne göre
    if (analiz.trend.yonu === 'YUKARI') {
        oy = 'AL';
        guven = 60 + Math.min(30, analiz.trend.guc);
    } else if (analiz.trend.yonu === 'AŞAĞI') {
        oy = 'SAT';
        guven = 60 + Math.min(30, analiz.trend.guc);
    }

    // Hacim teyidi ekle
    if (analiz.hacim.teyitli) {
        guven = Math.min(100, guven + 15);
    }

    // Formasyon varsa güveni artır
    if (analiz.formasyon) {
        guven = Math.min(100, guven + 10);
    }

    return {
        modul: 'Athena (Faktör Analizi - Perşembe)',
        oy,
        guven,
        aciklama: `Trend: ${analiz.trend.yonu}, Güç: ${analiz.trend.guc.toFixed(1)}°. ${analiz.hacim.aciklama}`,
    };
}

/**
 * Sentiment analizinden oy üret
 */
export function sentimentOyu(genelSentiment: number): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    let guven = Math.abs(genelSentiment) * 100;

    if (genelSentiment > 0.3) {
        oy = 'AL';
        guven = 50 + genelSentiment * 50;
    } else if (genelSentiment < -0.3) {
        oy = 'SAT';
        guven = 50 + Math.abs(genelSentiment) * 50;
    }

    return {
        modul: 'Hermes (Sentiment - Sosyal Medya)',
        oy,
        guven: Math.min(100, guven),
        aciklama: `Piyasa duyarlılığı: %${(genelSentiment * 100).toFixed(0)} ${genelSentiment > 0 ? 'pozitif' : 'negatif'}`,
    };
}

/**
 * Grand Council toplantısı - Tüm modüllerin oylarını birleştir
 */
export function grandCouncil(
    hisse: string,
    oylar: ModulOyu[]
): CouncilKarar {
    const alOylar = oylar.filter(o => o.oy === 'AL');
    const satOylar = oylar.filter(o => o.oy === 'SAT');
    const bekleOylar = oylar.filter(o => o.oy === 'BEKLE');

    const toplamOy = {
        al: alOylar.length,
        sat: satOylar.length,
        bekle: bekleOylar.length,
    };

    // Ağırlıklı oylama (güven seviyesi ile)
    const alAgirlik = alOylar.reduce((sum, o) => sum + o.guven, 0);
    const satAgirlik = satOylar.reduce((sum, o) => sum + o.guven, 0);
    const bekleAgirlik = bekleOylar.reduce((sum, o) => sum + o.guven, 0);
    const toplamAgirlik = alAgirlik + satAgirlik + bekleAgirlik;

    // Son karar
    let sonKarar: OyTipi = 'BEKLE';
    let konsensus = 0;

    if (alAgirlik > satAgirlik && alAgirlik > bekleAgirlik) {
        sonKarar = 'AL';
        konsensus = Math.round((alAgirlik / toplamAgirlik) * 100);
    } else if (satAgirlik > alAgirlik && satAgirlik > bekleAgirlik) {
        sonKarar = 'SAT';
        konsensus = Math.round((satAgirlik / toplamAgirlik) * 100);
    } else {
        konsensus = Math.round((bekleAgirlik / toplamAgirlik) * 100);
    }

    // Açıklama oluştur
    const kararEmoji = sonKarar === 'AL' ? '🟢' : sonKarar === 'SAT' ? '🔴' : '🟡';
    const aciklama = `${kararEmoji} Grand Council Kararı: ${sonKarar}
Konsensus: %${konsensus}
Oylama: ${toplamOy.al} AL | ${toplamOy.sat} SAT | ${toplamOy.bekle} BEKLE
${oylar.map(o => `  - ${o.modul}: ${o.oy} (%${o.guven} güven)`).join('\n')}`;

    return {
        hisse,
        sonKarar,
        konsensus,
        oylar,
        toplamOy,
        aciklama,
        tarih: new Date(),
    };
}

/**
 * Rapor formatla
 */
export function councilRaporFormatla(karar: CouncilKarar): string {
    const emoji = karar.sonKarar === 'AL' ? '🟢' : karar.sonKarar === 'SAT' ? '🔴' : '🟡';

    return `
## 🏛️ Grand Council Kararı - ${karar.hisse}

### ${emoji} Final Karar: **${karar.sonKarar}**
**Konsensus:** %${karar.konsensus}

### 📊 Modül Oyları

| Modül | Oy | Güven |
|-------|-----|-------|
${karar.oylar.map(o => `| ${o.modul} | ${o.oy} | %${o.guven} |`).join('\n')}

### 📈 Oy Dağılımı
- 🟢 AL: ${karar.toplamOy.al} oy
- 🔴 SAT: ${karar.toplamOy.sat} oy
- 🟡 BEKLE: ${karar.toplamOy.bekle} oy

### 💬 Modül Gerekçeleri
${karar.oylar.map(o => `- **${o.modul}:** ${o.aciklama}`).join('\n')}
`;
}

export default {
    erdincOyu,
    wonderkidOyu,
    teknikOyu,
    persembeOyu,
    sentimentOyu,
    grandCouncil,
    councilRaporFormatla,
};
