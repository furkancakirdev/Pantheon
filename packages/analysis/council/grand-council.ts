/**
 * Grand Council - Pantheon Trading OS (V3)
 * 11 Modüllü Oylama Sistemi
 *
 * Modüller:
 * 1. Atlas V3 (Temel - Dinamik): Yaşar Erdinç kuralları
 * 2. Demeter (Sektör Rotasyonu): Wonderkid
 * 3. Orion V3 (Teknik): Kıvanç İndikatörleri + Trend
 * 4. Athena V2 (Faktör Zekası): Smart Beta (Momentum, Value, Quality)
 * 5. Hermes (Sentiment): X/Twitter Analizi
 * 6. Aether (Makro): Piyasa Rejimi
 * 7. Phoenix (Strateji): Otomatik Sinyal
 * 8. Cronos (Zamanlama): Timing faktörleri
 * 9. Poseidon (Varlık Tipi): ETF/Emtia/Kripto modu
 * 10. Chiron (Risk): Risk yönetimi ve pozisyon sizing
 * 11. Prometheus (Second-Order Thinking): İkinci Derece Düşünme ve Değer Zinciri Analizi
 */

import { WonderkidScore } from '../wonderkid/engine';
import type { OrionResult } from '../orion';
import type { AtlasResult } from '../atlas';
import { CronosResult } from '../cronos/engine';
import type { AthenaResult } from '../athena';
import type { AssetType } from '../poseidon/engine';

// OSINT modülleri
import { analyzeSymbolRetailSales, type SectorRetailAnalysis } from '../osint/retail-pulse';
import { analyzeCompanyActivity, type DeveloperActivity } from '../osint/github-pulse';
import { analyzeCompanyComplaints, type CompanyComplaintAnalysis } from '../osint/sikayetvar-scraper';
import { analyzeSymbolPowerUsage, type SectorConsumptionAnalysis } from '../osint/teias-consumption';

// Prometheus modülü
import { prometheusOyu, prometheusGorus, isPrometheusEligible } from './prometheus-adapter';
import { analyzeSecondOrder } from '../prometheus/second-order';
import type { PrometheusAnalysis } from '../prometheus';

/**
 * Modül oyları
 */
export type OyTipi = 'AL' | 'SAT' | 'BEKLE';

export interface ModulOyu {
    modul: string;
    oy: OyTipi;
    guven: number;      // 0-100 güven seviyesi
    aciklama: string;
    icon: string;       // Emoji ikon
}

/**
 * Council Kararı
 */
export interface CouncilKarar {
    hisse: string;
    varlikTipi: AssetType;
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
    ozet: string;            // Kısa özet cümle
}

/**
 * Argus Tarzı Detaylı Rapor
 */
export interface ArgusRapor {
    baslik: string;
    symbol: string;
    varlikTipi: AssetType;
    fiyatlBilgi: {
        fiyat: number;
        degisim: number;
        degisimPercent: number;
        hacim?: number;
    };
    modulGorusleri: ModulGorus[];
    finalKarar: {
        karari: OyTipi;
        konsensus: number;
        ozet: string;
        detayliAciklama: string;
    };
    piyasaHaberleri?: Array<{
        kaynak: string;
        baslik: string;
        etkisi: 'pozitif' | 'negatif' | 'nötr';
    }>;
    bilgiNotlari?: string[];
    poweredBy: string;
}

export interface ModulGorus {
    modul: string;
    icon: string;
    oy: OyTipi;
    guven: number;
    gorus: string;         // Detaylı görüş metni
    sinyal?: string;       // Kısa sinyal (örn: "AL", "GÜÇLÜ AL")
}

// === ADAPTÖRLER ===

// 1. Atlas V3 (Temel)
export function atlasOyu(analiz: AtlasResult): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    if (analiz.verdict === 'GÜÇLÜ AL' || analiz.verdict === 'AL') oy = 'AL';
    else if (analiz.verdict === 'SAT' || analiz.verdict === 'GÜÇLÜ SAT') oy = 'SAT';

    return {
        modul: 'Atlas V3',
        oy,
        guven: analiz.score,
        icon: '📊',
        aciklama: `${analiz.verdict}. F/K: ${analiz.dynamicFK?.toFixed(2) || 'N/A'}. Skor: ${analiz.score}/100`,
    };
}

export function atlasGorus(analiz: AtlasResult): ModulGorus {
    const oy = atlasOyu(analiz);
    return {
        modul: 'Atlas V3 (Temel Analiz)',
        icon: '📊',
        oy: oy.oy,
        guven: oy.guven,
        sinyal: analiz.verdict,
        gorus: `Temel analiz skoruna göre hisse ${analiz.score}/100 puan aldı. ` +
            (analiz.score >= 70 ? 'Güçlü temel göstergeler, değerleme cazip.' :
             analiz.score >= 50 ? 'Temel göstergeler karmaşık, nötr görünüm.' :
             'Zayıf temel göstergeler, bekleme önerilir.') +
            ` F/K_oran: ${analiz.dynamicFK?.toFixed(2) || 'N/A'}, PD/DD: ${analiz.dynamicPDDD?.toFixed(2) || 'N/A'}.`
    };
}

// 2. Demeter (Wonderkid - Sektör)
export function wonderkidOyu(skor: WonderkidScore): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    let guven = skor.wonderkidSkor;

    if (skor.potansiyelYildiz || skor.wonderkidSkor >= 60) oy = 'AL';
    else if (skor.wonderkidSkor <= 30) oy = 'SAT';

    return {
        modul: 'Demeter',
        oy,
        guven,
        icon: '⭐',
        aciklama: `Skor: ${skor.wonderkidSkor}. Trend: ${skor.trendEslesmesi.join(',')}`,
    };
}

export function wonderkidGorus(skor: WonderkidScore): ModulGorus {
    const oy = wonderkidOyu(skor);
    return {
        modul: 'Demeter (Sektör Rotasyonu)',
        icon: '⭐',
        oy: oy.oy,
        guven: oy.guven,
        sinyal: skor.potansiyelYildiz ? 'POTANSİYEL YILDIZ' : 'NÖTR',
        gorus: skor.potansiyelYildiz
            ? `⭐ Potansiyel Yıldız tespit edildi! Sektör trendi ile uyumlu (${skor.trendEslesmesi.join(',')}). ` +
              `Gelecek vaat eden şirket, büyüme potansiyeli yüksek.`
            : `Wonderkid skoru ${skor.wonderkidSkor}/100. ` +
              (skor.wonderkidSkor >= 60 ? 'Sektörde güçlü konum.' :
               skor.wonderkidSkor >= 40 ? 'Sektör performansı ortalama.' :
               'Sektörde zayıf performans, alternatiflere bakılabilir.')
    };
}

// 3. Orion V3 (Gelismis Teknik)
export function orionOyu(skor: OrionResult): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    let guven = skor.score;

    if (skor.score >= 70) oy = 'AL';
    else if (skor.score <= 30) oy = 'SAT';

    const firstDetail = skor.details?.[0] || '';
    const kivancSignal = `${skor.kivanc?.alphaTrend}/${skor.kivanc?.most}/${skor.kivanc?.mavilimW}`;

    return {
        modul: 'Orion V3',
        oy,
        guven,
        icon: '📈',
        aciklama: `Skor: ${skor.score}. ${kivancSignal}. ${firstDetail}`,
    };
}

export function orionGorus(skor: OrionResult): ModulGorus {
    const oy = orionOyu(skor);
    const kivanc = skor.kivanc;
    return {
        modul: 'Orion V3 (Teknik Analiz)',
        icon: '📈',
        oy: oy.oy,
        guven: oy.guven,
        sinyal: skor.score >= 70 ? 'GÜÇLÜ AL' : skor.score <= 30 ? 'SAT' : 'BEKLE',
        gorus: `Teknik skor ${skor.score}/100. ` +
            `Kivanc indikatorleri: ` +
            `AlphaTrend=${kivanc?.alphaTrend || 'N/A'}, ` +
            `MOST=${kivanc?.most || 'N/A'}, ` +
            `MavilimW=${kivanc?.mavilimW || 'N/A'}. ` +
            (skor.details?.length ? `Gozlemler: ${skor.details.slice(0, 2).join(', ')}.` : '')
    };
}

// 4. Athena V2 (Faktör Zekası)
export function athenaV2Oyu(analiz: AthenaResult): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    let guven = analiz.score;

    if (analiz.score >= 70) oy = 'AL';
    else if (analiz.score <= 40) oy = 'SAT';

    return {
        modul: 'Athena V2',
        oy,
        guven,
        icon: '🦉',
        aciklama: `Skor: ${analiz.score}. Style: ${analiz.styleLabel}. ${analiz.verdict}`,
    };
}

export function athenaV2Gorus(analiz: AthenaResult): ModulGorus {
    const oy = athenaV2Oyu(analiz);
    return {
        modul: 'Athena V2 (Faktör Zekası)',
        icon: '🦉',
        oy: oy.oy,
        guven: oy.guven,
        sinyal: analiz.score >= 70 ? 'FAKTÖR PROFİLİ GÜÇLÜ' :
                 analiz.score <= 40 ? 'FAKTÖR PROFİLİ ZAYIF' : 'NÖTR FAKTÖR PROFİLİ',
        gorus: `Smart Beta skoru ${analiz.score}/100. Style: ${analiz.styleLabel} (${analiz.styleDescription}). ` +
            `Faktörler: Value ${analiz.factors.value}/100, Quality ${analiz.factors.quality}/100, ` +
            `Momentum ${analiz.factors.momentum}/100. ` +
            `${analiz.summary}`
    };
}

// 4b. Athena Legacy (Perşembe trend) - Geriye dönük uyumluluk için
export function athenaOyu(trendYonu: 'YUKARI' | 'AŞAĞI' | 'YATAY'): ModulOyu {
    const oy = trendYonu === 'YUKARI' ? 'AL' : (trendYonu === 'AŞAĞI' ? 'SAT' : 'BEKLE');
    return {
        modul: 'Athena (Faktör)',
        oy,
        guven: 60,
        icon: '🦉',
        aciklama: `Trend: ${trendYonu}. Destek/Direnç analizi.`,
    };
}

// 5. Hermes (Sentiment)
export function hermesOyu(score: number): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    if (score > 0.6) oy = 'AL';
    else if (score < 0.4) oy = 'SAT';

    return {
        modul: 'Hermes',
        oy,
        guven: Math.round(score * 100),
        icon: '🐦',
        aciklama: `Duyarlılık: %${Math.round(score * 100)} pozitif`,
    };
}

export function hermesGorus(score: number, tweetCount?: number): ModulGorus {
    const oy = hermesOyu(score);
    return {
        modul: 'Hermes (Twitter Sentiment)',
        icon: '🐦',
        oy: oy.oy,
        guven: oy.guven,
        sinyal: score > 0.6 ? 'POZİTİF' : score < 0.4 ? 'NEGATİF' : 'NÖTR',
        gorus: `Twitter duyarlılığı %${Math.round(score * 100)}. ` +
            (score > 0.6 ? 'Pozitif algı hakim, yatırımcı ilgisi yüksek.' :
             score < 0.4 ? 'Negatif algı, iştah düşük.' :
             'Nötr algı, piyasa kararsız.') +
            (tweetCount ? ` ${tweetCount} tweet analiz edildi.` : '')
    };
}

// 6. Aether (Makro)
export function aetherOyu(regime: string): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    if (regime === 'RISK_ON' || regime === 'EUPHORIA') oy = 'AL';
    else if (regime === 'DEEP_RISK_OFF') oy = 'SAT';

    return {
        modul: 'Aether',
        oy,
        guven: 80,
        icon: '🌍',
        aciklama: `Rejim: ${regime}`,
    };
}

export function aetherGorus(regime: string, vix?: number): ModulGorus {
    const oy = aetherOyu(regime);
    return {
        modul: 'Aether (Makro Rejim)',
        icon: '🌍',
        oy: oy.oy,
        guven: oy.guven,
        sinyal: regime,
        gorus: `Piyasa rejimi: ${regime}. ` +
            (regime === 'RISK_ON' ? 'Risk iştahı yüksek, hisse senetleri için uygun ortam.' :
             regime === 'EUPHORIA' ? 'Eforik piyasa, dikkatli olunmalı.' :
             regime === 'RISK_OFF' ? 'Risk iştahı düşük, savunmacı hisselere geçiş.' :
             'Derin risk-off, nakitte kalınması önerilir.') +
            (vix ? ` VIX: ${vix.toFixed(1)}` : '')
    };
}

// 7. Phoenix (Strateji)
export function phoenixOyu(isScanMatch: boolean): ModulOyu {
    return {
        modul: 'Phoenix',
        oy: isScanMatch ? 'AL' : 'BEKLE',
        guven: isScanMatch ? 90 : 50,
        icon: '🔥',
        aciklama: isScanMatch ? 'Tarama listesinde yakalandı' : 'Tarama dışı',
    };
}

export function phoenixGorus(isScanMatch: boolean, strategy?: string): ModulGorus {
    const oy = phoenixOyu(isScanMatch);
    return {
        modul: 'Phoenix (Strateji)',
        icon: '🔥',
        oy: oy.oy,
        guven: oy.guven,
        sinyal: isScanMatch ? 'SCAN MATCH' : 'NO MATCH',
        gorus: isScanMatch
            ? `🎯 Strateji taramasında yakalandı! ` +
              (strategy ? `Strateji: ${strategy}.` : 'Algoritmik giriş sinyali.')
            : 'Strateji taramasını geçemedi. Daha iyi fırsatları değerlendirin.'
    };
}

// 8. Cronos (Zamanlama)
export function cronosOyu(analiz: CronosResult): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    if (analiz.timing === 'UYGUN') oy = 'AL';
    else if (analiz.timing === 'UYGUNSUZ') oy = 'SAT';

    return {
        modul: 'Cronos',
        oy,
        guven: analiz.score,
        icon: '⏰',
        aciklama: `Zamanlama: ${analiz.timing}. Skor: ${analiz.score}`,
    };
}

export function cronosGorus(analiz: CronosResult): ModulGorus {
    const oy = cronosOyu(analiz);
    return {
        modul: 'Cronos (Zamanlama Faktörü)',
        icon: '⏰',
        oy: oy.oy,
        guven: oy.guven,
        sinyal: analiz.timing,
        gorus: `"Ne zaman aldığın, ne aldığın kadar önemli." ` +
            `Zamanlama skoru ${analiz.score}/100. ` +
            `${analiz.summary} ` +
            (analiz.timing === 'UYGUN' ? 'Şu an giriş için uygun zaman.' :
             analiz.timing === 'UYGUNSUZ' ? 'Zamanlama uygun değil, bekleyin.' :
             'Zamanlama nötr, diğer faktörlere güvenin.')
    };
}

// 9. Poseidon (Varlık Tipi Ağırlıklandırma)
export function poseidonGorus(varlikTipi: AssetType, aciklama: string): ModulGorus {
    const iconMap: Record<AssetType, string> = {
        'HISSE': '📈',
        'ETF': '📊',
        'EMTIA': '💰',
        'KRIPTO': '₿',
        'FON': '💎'
    };

    return {
        modul: 'Poseidon (Varlık Tipi)',
        icon: iconMap[varlikTipi] || '📊',
        oy: 'BEKLE',  // Poseidon direkt oy vermez, ağırlıklandırma yapar
        guven: 100,
        sinyal: varlikTipi,
        gorus: `${varlikTipi} varlık sınıfı için analiz yapılıyor. ${aciklama}`
    };
}

// 10. Chiron (Risk Yönetimi)
export function chironGorus(
    maxRiskR: number,
    sectorExposure: Record<string, number>,
    recommended?: boolean
): ModulGorus {
    return {
        modul: 'Chiron (Risk Yönetimi)',
        icon: '🛡️',
        oy: recommended ? 'AL' : 'BEKLE',
        guven: 85,
        sinyal: recommended ? 'ONAYLI' : 'DİKKAT',
        gorus: `Maksimum risk birimi: %${maxRiskR}. ` +
            `Sektör dağılımı: ${Object.entries(sectorExposure).map(([s, p]) => `${s}=%${p.toFixed(1)}`).join(', ')}. ` +
            (recommended
                ? 'Risk parametreleri uygun, pozisyon açılabilir.'
                : 'Risk seviyesi yüksek, pozisyon büyüklüğünü azaltın veya bekleyin.')
    };
}

// ============ OSINT MODULE ADAPTERS ============
// Adım 1: Mantıksal Birleşme - OSINT modüllerini Grand Council'e entegre et

// 11. RetailPulse (EVDS - Perakende Satış)
export function retailPulseOyu(analiz: SectorRetailAnalysis | null): ModulOyu | null {
    if (!analiz) return null;

    let oy: OyTipi = 'BEKLE';
    if (analiz.signal === 'STRONG_POSITIVE' || analiz.signal === 'POSITIVE') oy = 'AL';
    else if (analiz.signal === 'STRONG_NEGATIVE' || analiz.signal === 'NEGATIVE') oy = 'SAT';

    return {
        modul: 'RetailPulse',
        oy,
        guven: analiz.score,
        icon: '🛒',
        aciklama: `Perakende satış: %${analiz.changePercent.toFixed(1)} (Reel: %${analiz.realGrowth.toFixed(1)}). ${analiz.trend}`,
    };
}

export function retailPulseGorus(analiz: SectorRetailAnalysis | null): ModulGorus | null {
    if (!analiz) return null;
    const oy = retailPulseOyu(analiz);
    if (!oy) return null;

    return {
        modul: 'RetailPulse (EVDS Perakende)',
        icon: '🛒',
        oy: oy.oy,
        guven: oy.guven,
        sinyal: analiz.signal,
        gorus: `EVDS verilerine göre ${analiz.sector} sektörü perakende satışları %${analiz.changePercent.toFixed(1)} değişti. ` +
            `Enflasyon ayıklı reel büyüme: %${analiz.realGrowth.toFixed(1)}. ` +
            (analiz.realGrowth > 0 ? 'Tüketim canlı, sektör için olumlu.' :
             analiz.realGrowth < -2 ? 'Tüketim daralıyor, sektör için risk.' :
             'Tüketim stabil.')
    };
}

// 12. GitHub Pulse (Teknoloji Şirketleri)
export function githubPulseOyu(aktivite: DeveloperActivity): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    if (aktivite.signal === 'PRODUCT_LAUNCH' || aktivite.signal === 'ACTIVE_DEVELOPMENT') oy = 'AL';
    else if (aktivite.signal === 'ABANDONED' || aktivite.activityTrend === 'DEAD') oy = 'SAT';

    return {
        modul: 'GitHub Pulse',
        oy,
        guven: aktivite.score,
        icon: '💻',
        aciklama: `Aktivite: ${aktivite.activityTrend}. Sinyal: ${aktivite.signal}. ${aktivite.totalCommits} commit/30g`,
    };
}

export function githubPulseGorus(aktivite: DeveloperActivity): ModulGorus {
    const oy = githubPulseOyu(aktivite);

    return {
        modul: 'GitHub Pulse (Tech OSINT)',
        icon: '💻',
        oy: oy.oy,
        guven: oy.guven,
        sinyal: aktivite.signal,
        gorus: `${aktivite.company} GitHub aktivitesi: Son 30 günde ${aktivite.totalCommits} commit, ` +
            `${aktivite.activeDevelopers} aktif geliştirici. ` +
            `Gece aktivitesi %${aktivite.nightActivity.toFixed(1)}. ` +
            (aktivite.signal === 'PRODUCT_LAUNCH' ? '🚀 Ürün lansmanı sinyali! Yüksek gece aktivitesi.' :
             aktivite.signal === 'ACTIVE_DEVELOPMENT' ? '✅ Aktif geliştirme sürüyor.' :
             aktivite.signal === 'ABANDONED' ? '❌ Proje terk edilmiş gibi görünüyor.' :
             '⏸️ Bakım modu.')
    };
}

// 13. Şikayetvar (Müşteri Şikayetleri)
export function sikayetvarOyu(analiz: CompanyComplaintAnalysis): ModulOyu {
    // Şikayetvar'da yüksek risk = negatif sinyal
    let oy: OyTipi = 'BEKLE';
    if (analiz.signal === 'LOW_RISK') oy = 'AL';
    else if (analiz.signal === 'HIGH_RISK' || analiz.signal === 'CRITICAL') oy = 'SAT';

    return {
        modul: 'Şikayetvar',
        oy,
        guven: 100 - analiz.riskScore, // Düşük risk = yüksek güven
        icon: '📢',
        aciklama: `Risk: ${analiz.signal}. Şikayet değişimi: %${analiz.newComplaintsThisMonth > 0 ? '+' : ''}${((analiz.newComplaintsThisMonth - analiz.newComplaintsLastMonth) / analiz.newComplaintsLastMonth * 100).toFixed(1)}`,
    };
}

export function sikayetvarGorus(analiz: CompanyComplaintAnalysis): ModulGorus {
    const oy = sikayetvarOyu(analiz);

    return {
        modul: 'Şikayetvar (Müşteri Memnuniyeti)',
        icon: '📢',
        oy: oy.oy,
        guven: oy.guven,
        sinyal: analiz.signal,
        gorus: `${analiz.company} için Şikayetvar analizi: Son 30 günde ${analiz.newComplaintsThisMonth} şikayet. ` +
            `Çözüm oranı %${analiz.resolutionRate.toFixed(1)}. ` +
            (analiz.signal === 'LOW_RISK' ? '💚 Düşük risk, müşteri memnuniyeti iyi.' :
             analiz.signal === 'NORMAL' ? '✅ Normal seviye.' :
             analiz.signal === 'ELEVATED' ? '📊 Risk artışı var.' :
             analiz.signal === 'HIGH_RISK' ? '⚠️ Yüksek risk!' :
             '🚨 Kritik risk! Şikayetler patlamış.')
    };
}

// 14. TEİAŞ (Elektrik Tüketimi)
export function teiasOyu(analiz: SectorConsumptionAnalysis): ModulOyu {
    let oy: OyTipi = 'BEKLE';
    if (analiz.signal === 'STRONG_POSITIVE' || analiz.signal === 'POSITIVE') oy = 'AL';
    else if (analiz.signal === 'STRONG_NEGATIVE' || analiz.signal === 'NEGATIVE') oy = 'SAT';

    return {
        modul: 'TEİAŞ',
        oy,
        guven: analiz.score,
        icon: '⚡',
        aciklama: `Tüketim: %${analiz.changePercent.toFixed(1)}. Hafta sonu oranı: %${analiz.weekendRatio}. ${analiz.trend}`,
    };
}

export function teiasGorus(analiz: SectorConsumptionAnalysis): ModulGorus {
    const oy = teiasOyu(analiz);

    return {
        modul: 'TEİAŞ (Sanayi Elektrik)',
        icon: '⚡',
        oy: oy.oy,
        guven: oy.guven,
        sinyal: analiz.signal,
        gorus: `${analiz.sector} sektörü elektrik tüketimi: Günlük ${(analiz.currentConsumption / 1000).toFixed(1)} GWh. ` +
            `Hafta sonu/içi oranı %${analiz.weekendRatio}` +
            (analiz.weekendRatio > 70 ? ' - 🏭 Hafta sonu mesai var!' : '') +
            `. ` +
            (analiz.signal === 'STRONG_POSITIVE' ? '🏭 Güçlü pozitif! Fabrikalar ötmüş çalışıyor.' :
             analiz.signal === 'POSITIVE' ? '✅ Tüketim artıyor.' :
             analiz.signal === 'NEGATIVE' ? '⚠️ Tüketim azalıyor.' :
             '🚨 Tüketim çöküyor!')
    };
}

// ============ DYNAMIC COUNCIL MEMBERSHIP ============
/**
 * Dynamic Council Membership - Sektöre göre aktif modülleri belirle
 *
 * Örnek:
 * - BIMAS (Perakende) → RetailPulse aktif, GitHub Pulse pasif
 * - LOGO (Teknoloji) → GitHub Pulse aktif, TEİAŞ pasif
 * - KRDMD (Demir-Çelik) → TEİAŞ aktif, RetailPulse pasif
 */

export interface CouncilEligibility {
    retailPulse: boolean;
    githubPulse: boolean;
    sikayetvar: boolean;
    teias: boolean;
    prometheus: boolean;
}

/**
 * Sembolün sektörüne göre hangi OSINT modüllerinin aktif olduğunu belirle
 */
export function getOsintEligibility(symbol: string): CouncilEligibility {
    // Import checking için helper fonksiyonlar
    const isRetail = (s: string) => ['BIMAS', 'MGROS', 'SAHOL', 'AGROL', 'GROFY', 'KIPA', 'LCWA', 'INDMS'].includes(s);
    const isTech = (s: string) => ['LOGO', 'MIATK', 'ARDYZ', 'SMART', 'KOCST', 'INNVA', 'NETAS', 'ULAS', 'TCELL', 'TTKOM', 'MSFT', 'GOOGL', 'META', 'AMZN'].includes(s);
    const isSteel = (s: string) => ['IZMIR', 'ERDEM', 'KRDMD', 'ISCEM'].includes(s);
    const isCement = (s: string) => ['ADACI', 'AKCIM', 'KCHOL'].includes(s);
    const isIndustrial = isSteel(symbol) || isCement(symbol) || ['TOASO', 'FROTO', 'FORGE', 'BURSA', 'PETKM', 'AKSA', 'SISE'].includes(symbol);
    const isTrackedForComplaints = (s: string) => ['TCELL', 'TTKOM', 'TKFEN', 'MGROS', 'BIMAS', 'SAHOL', 'AGROL', 'GROFY', 'VEST', 'ARCLK', 'BERA', 'AKBNK', 'ISCTR', 'GARAN', 'YKBNK', 'HALKB', 'VAKBN', 'THYAO', 'PGSUS', 'TOASO', 'FROTO', 'AKSEN', 'BRYAT'].includes(s);

    return {
        retailPulse: isRetail(symbol),
        githubPulse: isTech(symbol),
        sikayetvar: isTrackedForComplaints(symbol),
        teias: isIndustrial,
        prometheus: isPrometheusEligible(symbol),
    };
}

/**
 * OSINT modüllerinden oyları topla (sadece eligible olanlar)
 */
export async function collectOsintVotes(symbol: string): Promise<ModulOyu[]> {
    const oylar: ModulOyu[] = [];
    const eligibility = getOsintEligibility(symbol);

    // RetailPulse
    if (eligibility.retailPulse) {
        const retailAnaliz = analyzeSymbolRetailSales(symbol);
        if (retailAnaliz) {
            const oyu = retailPulseOyu(retailAnaliz);
            if (oyu) oylar.push(oyu);
        }
    }

    // GitHub Pulse
    if (eligibility.githubPulse) {
        const githubAktivite = analyzeCompanyActivity(symbol);
        oylar.push(githubPulseOyu(githubAktivite));
    }

    // Şikayetvar
    if (eligibility.sikayetvar) {
        const sikayetAnaliz = analyzeCompanyComplaints(symbol);
        oylar.push(sikayetvarOyu(sikayetAnaliz));
    }

    // TEİAŞ
    if (eligibility.teias) {
        const teiasAnalizleri = analyzeSymbolPowerUsage(symbol);
        if (teiasAnalizleri.length > 0) {
            const enIyiTeias = teiasAnalizleri.sort((a, b) => b.score - a.score)[0];
            oylar.push(teiasOyu(enIyiTeias));
        }
    }

    // Prometheus (Second-Order Thinking)
    if (eligibility.prometheus) {
        const prometheusInput = { symbol, assetType: 'HISSE' as const };
        const prometheusAnaliz = await analyzeSecondOrder(prometheusInput);
        oylar.push(prometheusOyu(prometheusAnaliz));
    }

    return oylar;
}

/**
 * OSINT Modul Goruslerini topla
 */
export async function collectOsintGorusler(symbol: string): Promise<ModulGorus[]> {
    const gorusler: ModulGorus[] = [];
    const eligibility = getOsintEligibility(symbol);

    // RetailPulse
    if (eligibility.retailPulse) {
        const retailAnaliz = analyzeSymbolRetailSales(symbol);
        if (retailAnaliz) {
            const gorus = retailPulseGorus(retailAnaliz);
            if (gorus) gorusler.push(gorus);
        }
    }

    // GitHub Pulse
    if (eligibility.githubPulse) {
        const githubAktivite = analyzeCompanyActivity(symbol);
        gorusler.push(githubPulseGorus(githubAktivite));
    }

    // Şikayetvar
    if (eligibility.sikayetvar) {
        const sikayetAnaliz = analyzeCompanyComplaints(symbol);
        gorusler.push(sikayetvarGorus(sikayetAnaliz));
    }

    // TEİAŞ
    if (eligibility.teias) {
        const teiasAnalizleri = analyzeSymbolPowerUsage(symbol);
        if (teiasAnalizleri.length > 0) {
            const enIyiTeias = teiasAnalizleri.sort((a, b) => b.score - a.score)[0];
            gorusler.push(teiasGorus(enIyiTeias));
        }
    }

    // Prometheus (Second-Order Thinking)
    if (eligibility.prometheus) {
        const prometheusInput = { symbol, assetType: 'HISSE' as const };
        const prometheusAnaliz = await analyzeSecondOrder(prometheusInput);
        gorusler.push(prometheusGorus(prometheusAnaliz));
    }

    return gorusler;
}

/**
 * Grand Council V3 Toplantısı - 11 Modül
 */
export function grandCouncil(
    hisse: string,
    varlikTipi: AssetType = 'HISSE',
    oylar: ModulOyu[]
): CouncilKarar {
    const alOylar = oylar.filter(o => o.oy === 'AL');
    const satOylar = oylar.filter(o => o.oy === 'SAT');
    const bekleOylar = oylar.filter(o => o.oy === 'BEKLE');

    const toplamOy = { al: alOylar.length, sat: satOylar.length, bekle: bekleOylar.length };

    // Ağırlıklı oylama - Güven puanlarına göre
    const alAgirlik = alOylar.reduce((sum, o) => sum + o.guven, 0);
    const satAgirlik = satOylar.reduce((sum, o) => sum + o.guven, 0);
    const bekleAgirlik = bekleOylar.reduce((sum, o) => sum + o.guven, 0);

    const toplamAgirlik = alAgirlik + satAgirlik + bekleAgirlik;

    let sonKarar: OyTipi = 'BEKLE';
    let konsensus = 0;

    if (toplamAgirlik > 0) {
        // Ağırlıkları sırala (en yüksek öncelik)
        const agirliklar = [
            { tip: 'AL' as const, deger: alAgirlik },
            { tip: 'SAT' as const, deger: satAgirlik },
            { tip: 'BEKLE' as const, deger: bekleAgirlik }
        ].sort((a, b) => b.deger - a.deger);

        const enYuksek = agirliklar[0];
        const ikinci = agirliklar[1];

        // En yüksek oy açık ara önde mi? (%5 fark)
        const acikOnde = (enYuksek.deger - ikinci.deger) / toplamAgirlik > 0.05;

        if (acikOnde) {
            // Açık ara fark var - kazananı belirle
            sonKarar = enYuksek.tip;
            konsensus = Math.round((enYuksek.deger / toplamAgirlik) * 100);
        } else {
            // Beraberlik veya yakın fark - tie-breaking mantığı
            // 1. BEKLE varsayılan (güvenlik first)
            // 2. Ancak, AL ve SAT ağırlıkları birbirine çok yakınsa ve BEKLE düşükse,
            //    modül sayısı çoğunluğuna git

            const alModulSayisi = alOylar.length;
            const satModulSayisi = satOylar.length;
            const modulCokunlugu = alModulSayisi > satModulSayisi ? 'AL' : satModulSayisi > alModulSayisi ? 'SAT' : 'BEKLE';

            // BEKLE ağırlığı düşükse ve modüller çoğunlukta ise, çoğunluğu seç
            if (bekleAgirlik < toplamAgirlik * 0.3) {
                sonKarar = modulCokunlugu === 'BEKLE' ? 'AL' : modulCokunlugu;
                konsensus = Math.round(
                    (sonKarar === 'AL' ? alAgirlik : sonKarar === 'SAT' ? satAgirlik : bekleAgirlik) / toplamAgirlik * 100
                );
            } else {
                // BEKLE ağırlığı yüksekse, güvenlik ön planda
                sonKarar = 'BEKLE';
                konsensus = Math.round((bekleAgirlik / toplamAgirlik) * 100);
            }
        }
    }

    const emoji = sonKarar === 'AL' ? '🟢' : (sonKarar === 'SAT' ? '🔴' : '🟡');
    const aciklama = `${emoji} Grand Council Kararı: ${sonKarar} (%${konsensus} Konsensus) - ${oylar.length} Modülün katılımıyla.`;

    let ozet = '';
    if (sonKarar === 'AL' && konsensus >= 70) {
        ozet = 'Güçlü alım sinyali. Çoğu modül olumlu görüş bildiriyor.';
    } else if (sonKarar === 'AL' && konsensus >= 55) {
        ozet = 'Alım sinyali. Modüllerin çoğunluğu olumlu.';
    } else if (sonKarar === 'SAT' && konsensus >= 60) {
        ozet = 'Satış sinyali. Risk yüksek, çıkış önerilir.';
    } else {
        ozet = 'Nötr görünüm. Modüller kararsız, beklemek en iyisi.';
    }

    return {
        hisse,
        varlikTipi,
        sonKarar,
        konsensus,
        oylar,
        toplamOy,
        aciklama,
        tarih: new Date(),
        ozet
    };
}

/**
 * Argus Tarzı Detaylı Rapor Oluştur
 */
export function argusRaporOlustur(
    symbol: string,
    varlikTipi: AssetType,
    fiyatBilgi: { fiyat: number; degisim: number; degisimPercent: number; hacim?: number },
    modulGorusleri: ModulGorus[],
    finalKarar: CouncilKarar,
    piyasaHaberleri?: Array<{ kaynak: string; baslik: string; etkisi: 'pozitif' | 'negatif' | 'nötr' }>
): ArgusRapor {
    // Bilgi notlarını derle
    const bilgiNotlari: string[] = [];

    // Hacim kontrolü
    if (fiyatBilgi.hacim !== undefined && fiyatBilgi.hacim < 1000000) {
        bilgiNotlari.push('💡 Hacim Onayı: Düşük hacim, yakıtsız arabaya benzer; trend teyidi gerekli.');
    }

    // Consensus kontrolü
    if (finalKarar.konsensus < 55) {
        bilgiNotlari.push('⚠️ Düşük Konsensus: Modüller fikir birliğine varamadı, dikkatli olun.');
    }

    return {
        baslik: `${symbol} için veriler toplanıyor...`,
        symbol,
        varlikTipi,
        fiyatlBilgi: fiyatBilgi,
        modulGorusleri,
        finalKarar: {
            karari: finalKarar.sonKarar,
            konsensus: finalKarar.konsensus,
            ozet: finalKarar.ozet,
            detayliAciklama: finalKarar.aciklama
        },
        piyasaHaberleri,
        bilgiNotlari: bilgiNotlari.length > 0 ? bilgiNotlari : undefined,
        poweredBy: 'Powered by PANTHEON AI ENGINE'
    };
}

/**
 * Format Argus Report to Text
 */
export function argusRaporToText(rapor: ArgusRapor): string {
    let output = `# ${rapor.baslik}\n\n`;

    // Fiyat bilgisi
    const yon = rapor.fiyatlBilgi.degisim >= 0 ? '📈' : '📉';
    output += `${yon} ${rapor.symbol}: ${rapor.fiyatlBilgi.fiyat.toFixed(2)} ` +
        `(%${rapor.fiyatlBilgi.degisimPercent >= 0 ? '+' : ''}${rapor.fiyatlBilgi.degisimPercent.toFixed(2)})\n\n`;

    // Modül görüşleri
    for (const gorus of rapor.modulGorusleri) {
        const oyEmoji = gorus.oy === 'AL' ? '🟢' : gorus.oy === 'SAT' ? '🔴' : '🟡';
        output += `${gorus.icon} **${gorus.modul}**\n`;
        output += `   Oy: ${oyEmoji} ${gorus.oy} | Güven: %${gorus.guven}`;
        if (gorus.sinyal) output += ` | Sinyal: ${gorus.sinyal}`;
        output += `\n   ${gorus.gorus}\n\n`;
    }

    // Final karar
    const kararEmoji = rapor.finalKarar.karari === 'AL' ? '🟢' : rapor.finalKarar.karari === 'SAT' ? '🔴' : '🟡';
    output += `---\n`;
    output += `${kararEmoji} **GRAND COUNCIL KARARI: ${rapor.finalKarar.karari}**\n`;
    output += `Konsensus: %${rapor.finalKarar.konsensus}\n`;
    output += `${rapor.finalKarar.detayliAciklama}\n\n`;

    // Bilgi notları
    if (rapor.bilgiNotlari && rapor.bilgiNotlari.length > 0) {
        output += `---\n`;
        for (const not of rapor.bilgiNotlari) {
            output += `${not}\n`;
        }
    }

    // Footer
    output += `\n---\n${rapor.poweredBy}\n`;

    return output;
}

export default {
    // Adaptörler (Legacy)
    atlasOyu,
    wonderkidOyu,
    orionOyu,
    athenaOyu,
    hermesOyu,
    aetherOyu,
    phoenixOyu,
    // OSINT Adaptörler (Yeni)
    retailPulseOyu,
    githubPulseOyu,
    sikayetvarOyu,
    teiasOyu,
    // Prometheus Adaptörler (Yeni)
    prometheusOyu,
    // Görüş fonksiyonları (V3)
    atlasGorus,
    wonderkidGorus,
    orionGorus,
    athenaV2Oyu,
    athenaV2Gorus,
    hermesGorus,
    aetherGorus,
    phoenixGorus,
    cronosOyu,
    cronosGorus,
    poseidonGorus,
    chironGorus,
    // OSINT Görüş fonksiyonları (Yeni)
    retailPulseGorus,
    githubPulseGorus,
    sikayetvarGorus,
    teiasGorus,
    // Prometheus Görüş fonksiyonları (Yeni)
    prometheusGorus,
    // Dynamic Council Membership (Yeni)
    getOsintEligibility,
    collectOsintVotes,
    collectOsintGorusler,
    isPrometheusEligible,
    // Ana Fonksiyonlar
    grandCouncil,
    argusRaporOlustur,
    argusRaporToText,
};
