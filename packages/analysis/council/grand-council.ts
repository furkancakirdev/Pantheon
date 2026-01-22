/**
 * Grand Council - Argus Terminal Entegrasyonu (V2)
 * 7 Modüllü Oylama Sistemi
 * 
 * Modüller:
 * 1. Atlas V2 (Temel - Dinamik): Yaşar Erdinç
 * 2. Demeter (Sektör): Wonderkid
 * 3. Orion V3 (Teknik): Kıvanç İndikatörleri + Trend
 * 4. Athena (Faktör): Ali Perşembe
 * 5. Hermes (Sentiment): X/Twitter Analizi
 * 6. Aether (Makro): Piyasa Rejimi
 * 7. Phoenix (Strateji): Otomatik Sinyal
 */

import { WonderkidScore } from '../wonderkid/engine.js';
import { OrionScoreResult } from '../orion/engine.js';
import { AtlasResult } from '../atlas/engine.js';

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

// === ADAPTÖRLER ===

// 1. Atlas V2 (Temel)
export function atlasOyu(analiz: AtlasResult): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    if (analiz.verdict === 'UCUZ') oy = 'AL';
    else if (analiz.verdict === 'PAHALI') oy = 'SAT';

    return {
        modul: 'Atlas V2 (Dinamik Temel)',
        oy,
        guven: analiz.score,
        aciklama: `${analiz.verdict}. F/K: ${analiz.dynamicFK?.toFixed(2) || 'N/A'}. ${analiz.details[0] || ''}`,
    };
}

// 2. Demeter (Wonderkid - Sektör)
export function wonderkidOyu(skor: WonderkidScore): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    let guven = skor.wonderkidSkor;

    if (skor.potansiyelYildiz || skor.wonderkidSkor >= 60) oy = 'AL';
    else if (skor.wonderkidSkor <= 30) oy = 'SAT';

    return {
        modul: 'Demeter (Sektör - Wonderkid)',
        oy,
        guven,
        aciklama: `Skor: ${skor.wonderkidSkor}. Trend: ${skor.trendEslesmesi.join(',')}`,
    };
}

// 3. Orion V3 (Gelişmiş Teknik)
export function orionOyu(skor: OrionScoreResult): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    let guven = skor.totalScore;

    if (skor.totalScore >= 70) oy = 'AL';
    else if (skor.totalScore <= 30) oy = 'SAT';

    return {
        modul: 'Orion V3 (Teknik)',
        oy,
        guven,
        aciklama: `Skor: ${skor.totalScore}. ${skor.details[0] || ''}`,
    };
}

// 4. Athena (Perşembe) - Basitleştirilmiş
export function athenaOyu(trendYonu: 'YUKARI' | 'AŞAĞI' | 'YATAY'): ModulOyu {
    const oy = trendYonu === 'YUKARI' ? 'AL' : (trendYonu === 'AŞAĞI' ? 'SAT' : 'BEKLE');
    return {
        modul: 'Athena (Faktör)',
        oy,
        guven: 60, // Sabit güven
        aciklama: `Trend: ${trendYonu}. Destek/Direnç analizi.`,
    };
}

// 5. Hermes (Sentiment)
export function hermesOyu(score: number): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    if (score > 0.6) oy = 'AL';
    else if (score < 0.4) oy = 'SAT';

    return {
        modul: 'Hermes (Sentiment)',
        oy,
        guven: Math.round(score * 100),
        aciklama: `Duyarlılık: %${Math.round(score * 100)} pozitif`,
    };
}

// 6. Aether (Makro)
export function aetherOyu(regime: string): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    if (regime === 'RISK_ON' || regime === 'EUPHORIA') oy = 'AL';
    else if (regime === 'DEEP_RISK_OFF') oy = 'SAT';

    return {
        modul: 'Aether (Makro)',
        oy,
        guven: 80,
        aciklama: `Rejim: ${regime}`,
    };
}

// 7. Phoenix (Strateji)
export function phoenixOyu(isScanMatch: boolean): ModulOyu {
    return {
        modul: 'Phoenix (Strateji)',
        oy: isScanMatch ? 'AL' : 'BEKLE',
        guven: isScanMatch ? 90 : 50,
        aciklama: isScanMatch ? 'Tarama listesinde yakalandı' : 'Tarama dışı',
    };
}

/**
 * Grand Council V2 Toplantısı - 7 Modül
 */
export function grandCouncil(
    hisse: string,
    oylar: ModulOyu[]
): CouncilKarar {
    const alOylar = oylar.filter(o => o.oy === 'AL');
    const satOylar = oylar.filter(o => o.oy === 'SAT');
    const bekleOylar = oylar.filter(o => o.oy === 'BEKLE');

    const toplamOy = { al: alOylar.length, sat: satOylar.length, bekle: bekleOylar.length };

    // Ağırlıklı oylama - Güven puanlarına göre
    const alAgirlik = alOylar.reduce((sum, o) => sum + o.guven, 0);
    const satAgirlik = satOylar.reduce((sum, o) => sum + o.guven, 0);
    // Bekle oyları kararı nötrler, direkt ağırlık eklemez ama paydayı büyütürse konsensusu düşürür
    const bekleAgirlik = bekleOylar.reduce((sum, o) => sum + o.guven, 0);

    const toplamAgirlik = alAgirlik + satAgirlik + bekleAgirlik;

    let sonKarar: OyTipi = 'BEKLE';
    let konsensus = 0;

    if (toplamAgirlik > 0) {
        if (alAgirlik > satAgirlik && alAgirlik > bekleAgirlik) {
            sonKarar = 'AL';
            konsensus = Math.round((alAgirlik / toplamAgirlik) * 100);
        } else if (satAgirlik > alAgirlik && satAgirlik > bekleAgirlik) {
            sonKarar = 'SAT';
            konsensus = Math.round((satAgirlik / toplamAgirlik) * 100);
        } else {
            konsensus = Math.round((bekleAgirlik / toplamAgirlik) * 100);
        }
    }

    const emoji = sonKarar === 'AL' ? '🟢' : (sonKarar === 'SAT' ? '🔴' : '🟡');
    const aciklama = `${emoji} Grand Council Kararı: ${sonKarar} (%${konsensus} Konsensus) - ${oylar.length} Modülün katılımıyla.`;

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

export default {
    // Adaptörler
    atlasOyu,
    wonderkidOyu,
    orionOyu,
    athenaOyu,
    hermesOyu,
    aetherOyu,
    phoenixOyu,
    // Ana Fonksiyon
    grandCouncil,
};
