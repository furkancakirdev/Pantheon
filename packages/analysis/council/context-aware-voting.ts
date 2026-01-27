/**
 * Context-Aware Voting - Bağlama Duyarlı Oylama
 *
 * Yapılacaklar 6.txt - "BÖLÜM 3: GRAND COUNCİL'İN EVRİMİ":
 * Context-Aware Voting (Bağlama Duyarlı Oylama)
 * Her modülün, piyasanın durumuna göre ağırlığı değişmeli.
 *
 * Senaryo 1 (Ralli): Piyasa hızla yükseliyorsa, Orion (Teknik) ve Cronos (Zaman)
 *   modüllerinin ağırlığı %40 çıksın. Trende binmeliyiz.
 *
 * Senaryo 2 (Çöküş): Piyasa çöküyorsa, Chiron (Risk) modülü "VETO" yetkisi kullansın.
 *   Hiçbir kâr risk etmez.
 *
 * Senaryo 3 (Bilanço Dönemi): Şirketler rapor açıklarken, Atlas (Temel) modülünün
 *   ağırlığı %50 olsun. Beklenmedik kârlar fiyatı çarpar.
 */

import { OyTipi, ModulOyu } from './grand-council';
import { PiyasaRejimi } from './performance-tracker';

// ============ TYPES ============

/**
 * Piyasa Koşulu
 */
export type PiyasaKosulu =
    | 'RALLI'           // Hızlı yükseliş
    | 'DUSUS'           // Hızlı düşüş
    | 'YATAY'           // Yatay hareket
    | 'VOLATIL'         // Yüksek volatilite
    | 'BILANCO'         // Bilanço dönemi
    | 'FAIZ_KARARI'     // Faiz kararı öncesi
    | 'KRIZ';           // Kriz dönemi

/**
 * Modül Ağırlık Profili
 */
export interface ModulAgirlikProfili {
    modul: string;
    temelAgirlik: number;      // Normal ağırlık (0-1)
    kosulAgiirliklari: Record<PiyasaKosulu, number>;  // Koşula göre ağırlıklar
    vetoYetkisi: PiyasaKosulu[];  // Hangi koşullarda veto yetkisi var
}

/**
 * Bağlam Duyarlı Konfigürasyon
 */
export interface BaglamDuyarliConfig {
    mevcutKosul: PiyasaKosulu;
    piyasaRejimi: PiyasaRejimi;
    vix?: number;               // VIX endeksi (opsiyon)
    bagilFiyat?: number;        // Piyasa değişimi (%)
    hacimArtisi?: boolean;      // Hacim artışı var mı?
};

/**
 * Bağlam Duyarlı Oylama Sonucu
 */
export interface BaglamDuyarliOylamaSonuc {
    orijinalOylar: ModulOyu[];
    agirlikliOylar: ModulOyu[];
    uygulananProfiller: ModulAgirlikProfili[];
    aktifKosul: PiyasaKosulu;
    vetoKullanildi: boolean;
    vetoModulu?: string;
    finalKarar: OyTipi;
    konsensus: number;
    aciklama: string;
}

// ============ MODÜL PROFİLLERİ ============

const MODUL_PROFILLERI: Record<string, ModulAgirlikProfili> = {
    'Atlas V3': {
        modul: 'Atlas V3',
        temelAgirlik: 1.0,
        kosulAgiirliklari: {
            'RALLI': 0.8,      // Rallide temel analiz daha az önemli
            'DUSUS': 1.3,      // Düşüşte temel analiz önemli (dip avı)
            'YATAY': 1.0,
            'VOLATIL': 1.2,
            'BILANCO': 2.0,    // Bilanço döneminde çok önemli
            'FAIZ_KARARI': 1.0,
            'KRIZ': 1.5,
        },
        vetoYetkisi: ['BILANCO', 'KRIZ'],
    },
    'Orion V3': {
        modul: 'Orion V3',
        temelAgirlik: 1.0,
        kosulAgiirliklari: {
            'RALLI': 1.5,      // Rallide teknik anahtar
            'DUSUS': 1.3,      // Düşüşte de teknik önemli (destek seviyeleri)
            'YATAY': 1.0,
            'VOLATIL': 1.2,    // Volatilitede teknik kritik
            'BILANCO': 0.6,    // Bilanço döneminde teknik daha az önemli
            'FAIZ_KARARI': 1.0,
            'KRIZ': 0.8,       // Krizde teknik sinyal zayıf kalabilir
        },
        vetoYetkisi: ['RALLI', 'VOLATIL'],
    },
    'Athena V2': {
        modul: 'Athena V2',
        temelAgirlik: 1.0,
        kosulAgiirliklari: {
            'RALLI': 1.2,
            'DUSUS': 0.8,
            'YATAY': 1.0,
            'VOLATIL': 1.0,
            'BILANCO': 1.3,
            'FAIZ_KARARI': 1.0,
            'KRIZ': 1.2,
        },
        vetoYetkisi: [],
    },
    'Hermes': {
        modul: 'Hermes',
        temelAgirlik: 1.0,
        kosulAgiirliklari: {
            'RALLI': 1.1,
            'DUSUS': 1.4,      // Düşüşte sentiment çok önemli (panik kontrolü)
            'YATAY': 1.0,
            'VOLATIL': 1.3,    // Volatilitede haber akışı kritik
            'BILANCO': 0.7,
            'FAIZ_KARARI': 1.5, // Faiz kararı öncesi haber kritik
            'KRIZ': 1.8,       // Krizde haber/en son gelişme çok önemli
        },
        vetoYetkisi: ['DUSUS', 'KRIZ', 'FAIZ_KARARI'],
    },
    'Aether': {
        modul: 'Aether',
        temelAgirlik: 1.0,
        kosulAgiirliklari: {
            'RALLI': 0.8,
            'DUSUS': 1.2,      // Düşüşte makro önemli
            'YATAY': 1.0,
            'VOLATIL': 1.0,
            'BILANCO': 0.8,
            'FAIZ_KARARI': 2.0, // Faiz kararı öncesi makro anahtar
            'KRIZ': 2.0,       // Krizde makro en önemli
        },
        vetoYetkisi: ['DUSUS', 'KRIZ', 'FAIZ_KARARI'],
    },
    'Phoenix': {
        modul: 'Phoenix',
        temelAgirlik: 1.0,
        kosulAgiirliklari: {
            'RALLI': 1.3,
            'DUSUS': 0.7,
            'YATAY': 1.0,
            'VOLATIL': 1.0,
            'BILANCO': 1.0,
            'FAIZ_KARARI': 1.0,
            'KRIZ': 0.5,
        },
        vetoYetkisi: ['RALLI'],
    },
    'Cronos': {
        modul: 'Cronos',
        temelAgirlik: 1.0,
        kosulAgiirliklari: {
            'RALLI': 1.4,      // Rallide timing kritik
            'DUSUS': 1.3,      // Düşüşte de timing önemli
            'YATAY': 1.0,
            'VOLATIL': 1.2,
            'BILANCO': 0.8,
            'FAIZ_KARARI': 1.0,
            'KRIZ': 1.5,       // Krizde timing hayat Önemli
        },
        vetoYetkisi: ['RALLI', 'DUSUS', 'VOLATIL'],
    },
    'Demeter': {
        modul: 'Demeter',
        temelAgirlik: 1.0,
        kosulAgiirliklari: {
            'RALLI': 1.2,      // Rallide sektör rotasyonu önemli
            'DUSUS': 1.0,
            'YATAY': 1.0,
            'VOLATIL': 1.0,
            'BILANCO': 1.0,
            'FAIZ_KARARI': 1.0,
            'KRIZ': 1.0,
        },
        vetoYetkisi: [],
    },
    'Chiron': {
        modul: 'Chiron',
        temelAgirlik: 1.0,
        kosulAgiirliklari: {
            'RALLI': 0.5,      // Rallide risk yönetimi daha az önemli
            'DUSUS': 2.0,      // Düşüşte risk yönetimi ÇOK ÖNEMLİ
            'YATAY': 1.0,
            'VOLATIL': 1.5,
            'BILANCO': 0.8,
            'FAIZ_KARARI': 1.5,
            'KRIZ': 2.0,       // Krizde risk her şeyden ÖNEMLİ
        },
        vetoYetkisi: ['DUSUS', 'VOLATIL', 'KRIZ'],
    },
};

// ============ PİYASA KOŞULU TESPİTİ ============

/**
 * Piyasa koşulunu tespit et
 */
export function piyasaKosuluTespitEt(config: BaglamDuyarliConfig): PiyasaKosulu {
    // Kullanıcı açıkça belirtmişse
    if (config.mevcutKosul !== 'YATAY') {
        return config.mevcutKosul;
    }

    // VIX'e göre
    if (config.vix !== undefined) {
        if (config.vix > 35) return 'KRIZ';
        if (config.vix > 25) return 'VOLATIL';
    }

    // Piyasa rejimine göre
    if (config.piyasaRejimi === 'BOGA') {
        if (config.bagilFiyat && config.bagilFiyat > 2) return 'RALLI';
        return 'YATAY';
    }

    if (config.piyasaRejimi === 'AYI') {
        if (config.bagilFiyat && config.bagilFiyat < -2) return 'DUSUS';
        return 'YATAY';
    }

    if (config.piyasaRejimi === 'VOLATIL') {
        return 'VOLATIL';
    }

    return 'YATAY';
}

/**
 * VIX'e göre volatilite seviyesini hesapla
 */
export function vixSeviyesi(vix: number): 'DUSUK' | 'NORMAL' | 'YUKSEK' | 'KRITIK' {
    if (vix < 15) return 'DUSUK';
    if (vix < 20) return 'NORMAL';
    if (vix < 30) return 'YUKSEK';
    return 'KRITIK';
}

// ============ BAĞLAM DUYARLI OYLAMA ============

/**
 * Bağlama duyarlı oylama yap
 */
export function baglamDuyarliOyla(
    oylar: ModulOyu[],
    config: BaglamDuyarliConfig
): BaglamDuyarliOylamaSonuc {
    // Koşulu tespit et
    const aktifKosul = piyasaKosuluTespitEt(config);

    // Ağırlıkları uygula
    const agirlikliOylar: ModulOyu[] = oylar.map(oy => {
        const profil = MODUL_PROFILLERI[oy.modul];
        if (!profil) return oy;

        const agirlik = profil.kosulAgiirliklari[aktifKosul] || profil.temelAgirlik;
        const agirlikliGuven = Math.min(100, Math.round(oy.guven * agirlik));

        return {
            ...oy,
            guven: agirlikliGuven,
            aciklama: `${oy.aciklama} [${aktifKosul}: ${agirlik.toFixed(1)}x]`,
        };
    });

    // Veto kontrolü
    let vetoKullanildi = false;
    let vetoModulu: string | undefined;

    for (const oy of oylar) {
        const profil = MODUL_PROFILLERI[oy.modul];
        if (profil && profil.vetoYetkisi.includes(aktifKosul)) {
            // Veto koşulu: Eğer modül SAT diyorsa ve veto yetkisi varsa
            if (oy.oy === 'SAT') {
                vetoKullanildi = true;
                vetoModulu = oy.modul;
                break;
            }
            // Chiron özel durumu: Düşüş ve krizde risk kararı geçerli
            if (oy.modul === 'Chiron' && (aktifKosul === 'DUSUS' || aktifKosul === 'KRIZ' || aktifKosul === 'VOLATIL')) {
                vetoKullanildi = true;
                vetoModulu = oy.modul;
                break;
            }
        }
    }

    // Ağırlıklı oylamayı hesapla
    const alAgirlik = agirlikliOylar
        .filter(o => o.oy === 'AL')
        .reduce((sum, o) => sum + o.guven, 0);

    const satAgirlik = agirlikliOylar
        .filter(o => o.oy === 'SAT')
        .reduce((sum, o) => sum + o.guven, 0);

    const bekleAgirlik = agirlikliOylar
        .filter(o => o.oy === 'BEKLE')
        .reduce((sum, o) => sum + o.guven, 0);

    const toplam = alAgirlik + satAgirlik + bekleAgirlik;

    let finalKarar: OyTipi = 'BEKLE';
    let konsensus = 0;

    if (vetoKullanildi) {
        // Veto kullanıldıysa, riskli modülün kararı geçerli
        finalKarar = 'BEKLE';  // Varsayılan olarak bekle
        konsensus = 100;
    } else if (toplam > 0) {
        if (alAgirlik > satAgirlik && alAgirlik > bekleAgirlik) {
            finalKarar = 'AL';
            konsensus = Math.round((alAgirlik / toplam) * 100);
        } else if (satAgirlik > alAgirlik && satAgirlik > bekleAgirlik) {
            finalKarar = 'SAT';
            konsensus = Math.round((satAgirlik / toplam) * 100);
        } else {
            konsensus = Math.round((bekleAgirlik / toplam) * 100);
        }
    }

    // Açıklama oluştur
    const aciklama = baglamAciklamaOlustur(
        aktifKosul,
        vetoKullanildi,
        vetoModulu,
        finalKarar,
        konsensus
    );

    return {
        orijinalOylar: oylar,
        agirlikliOylar,
        uygulananProfiller: oylar.map(o => MODUL_PROFILLERI[o.modul]).filter(Boolean) as ModulAgirlikProfili[],
        aktifKosul,
        vetoKullanildi,
        vetoModulu,
        finalKarar,
        konsensus,
        aciklama,
    };
}

/**
 * Açıklama oluştur
 */
function baglamAciklamaOlustur(
    kosul: PiyasaKosulu,
    vetoKullanildi: boolean,
    vetoModulu: string | undefined,
    karar: OyTipi,
    konsensus: number
): string {
    let aciklama = `Piyasa Koşulu: ${kosul}. `;

    if (vetoKullanildi) {
        aciklama += `⛔ VETO kullanıldı (${vetoModulu}). Risk öncelikli. `;
    }

    const kosulAciklamasi: Record<PiyasaKosulu, string> = {
        'RALLI': 'Yükselen trendde teknik ve momentum ağırlıklı.',
        'DUSUS': 'Düşüş trendinde risk yönetimi ve temel analiz öncelikli.',
        'YATAY': 'Nötr piyasa, normal ağırlık.',
        'VOLATIL': 'Yüksek volatilite, risk ve timing kritik.',
        'BILANCO': 'Bilanço dönemi, temel analiz anahtar.',
        'FAIZ_KARARI': 'Faiz kararı öncesi, makro veriler kritik.',
        'KRIZ': 'KRİZ MODU: Risk yönetimi maksimum öncelik.',
    };

    aciklama += kosulAciklamasi[kosul];
    aciklama += ` Karar: ${karar} (%${konsensus}).`;

    return aciklama;
}

// ============ CONTEXT AWARE COUNCIL ============

/**
 * Context-Aware Grand Council
 *
 * Bu fonksiyon, standart grandCouncil fonksiyonunun
 * bağlama duyarlı versiyonudur.
 */
export function contextAwareGrandCouncil(
    hisse: string,
    oylar: ModulOyu[],
    config: BaglamDuyarliConfig
): BaglamDuyarliOylamaSonuc {
    return baglamDuyarliOyla(oylar, config);
}

/**
 * Piyasa durumunu otomatik tespit et ve oyla
 */
export function otomatikBaglamliOyla(
    hisse: string,
    oylar: ModulOyu[],
    piyasaRejimi: PiyasaRejimi,
    vix?: number,
    bagilFiyat?: number
): BaglamDuyarliOylamaSonuc {
    const config: BaglamDuyarliConfig = {
        mevcutKosul: 'YATAY',  // Otomatik tespit ettir
        piyasaRejimi,
        vix,
        bagilFiyat,
    };

    return baglamDuyarliOyla(oylar, config);
}

/**
 * Modül ağırlıklarını görüntüle
 */
export function modulAgirliklariniGoster(kosul: PiyasaKosulu): Array<{ modul: string; agirlik: number }> {
    return Object.entries(MODUL_PROFILLERI).map(([modul, profil]) => ({
        modul,
        agirlik: profil.kosulAgiirliklari[kosul] || profil.temelAgirlik,
    })).sort((a, b) => b.agirlik - a.agirlik);
}

/**
 * Koşul açıklaması
 */
export function kosulAciklamasi(kosul: PiyasaKosulu): string {
    const aciklamalar: Record<PiyasaKosulu, string> = {
        'RALLI': '🚀 Ralli Modu: Teknik ve momentum ağırlıklı, trende binin.',
        'DUSUS': '📉 Düşüş Modu: Risk yönetimi maksimum, dip avına dikkat.',
        'YATAY': '➡️ Yatay Modu: Normal ağırlık, tüm modüller dengeli.',
        'VOLATIL': '📊 Volatil Modu: Risk ve timing kritik, temel analiz ikincil.',
        'BILANCO': '📋 Bilanço Modu: Temel analiz anahtar, sürpriz kârlar bekleyin.',
        'FAIZ_KARARI': '🏦 Faiz Kararı Modu: Makro veriler kritik, Hermes aktif.',
        'KRIZ': '🚨 Kriz Modu: RİSK YÖNETİMİ her şeyden önemli. Chiron veto yetkili.',
    };

    return aciklamalar[kosul];
}

export default {
    baglamDuyarliOyla,
    contextAwareGrandCouncil,
    otomatikBaglamliOyla,
    piyasaKosuluTespitEt,
    vixSeviyesi,
    modulAgirliklariniGoster,
    kosulAciklamasi,
};
