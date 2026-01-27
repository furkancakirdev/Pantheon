/**
 * PerformanceTracker - Dinamik Ağırlık Sistemi
 *
 * Her modülün tarihsel başarısını takip edip oylama ağırlıklarını
 * dinamik olarak günceller. "Bağlama Duyarlı Oylama"ın temelidir.
 *
 * Yapılacaklar 3.txt - "KONSEY'İN RUHU":
 * Modüllerin "tarihsel başarısına" göre ağırlıkları her hafta otomatik güncellensin.
 * Geçen ay "Orion" düşüş trendini iyi bildiyse, bu ayki ayı piyasasında
 * onun sözü 1.5x daha değerli olsun.
 */

import { OyTipi, ModulOyu } from './grand-council';

/**
 * Piyasa Rejimi
 */
export type PiyasaRejimi =
    | 'BOGA'          // Yükseliş trendi
    | 'AYI'           // Düşüş trendi
    | 'YATAY'         // Yatay hareket
    | 'VOLATIL';      // Yüksek volatilite

/**
 * Modül Performans Metriği
 */
export interface ModulPerformans {
    modul: string;
    toplamTahmin: number;           // Toplam tahmin sayısı
    dogruTahmin: number;            // Doğru tahmin sayısı
    basariOrani: number;            // Başarı oranı (%0-100)

    // Rejim bazlı başarı oranları
    bogaBasaris: number;            // Boğa piyasasında başarı
    ayiBasaris: number;             // Ayı piyasasında başarı
    yatayBasaris: number;           // Yatay piyasada başarı

    // Son performans (son 30 tahmin)
    sonPerformans: {
        dogru: number;
        toplam: number;
        oran: number;
    };

    // Güncel ağırlık çarpanı (1.0 = normal, 1.5 = %50 daha etkili)
    agirlikCarpani: number;

    // Güncel form durumu
    formDurumu: 'HOT' | 'WARM' | 'COLD';
}

/**
 * Performans Kaydı
 */
export interface PerformansKaydi {
    tarih: Date;
    modul: string;
    hisse: string;
    tahmin: OyTipi;
    tahminGuveni: number;
    piyasaRejimi: PiyasaRejimi;
    gerceklesmeSuresi: number;      // Gün sayısı (sonuç ne kadar sonra çıktı)
    dogruMu: boolean | null;        // null = henüz sonuçlanmadı
}

/**
 * Ağırlıklı Oylama Sonucu
 */
export interface AgirlikliOylama {
    modul: string;
    oy: OyTipi;
    guven: number;
    agirlik: number;               // Uygulanan ağırlık çarpanı
    agirlikliGuven: number;         // guven * agirlik
    aciklama: string;
}

/**
 * Tracker Durumu
 */
export interface TrackerDurumu {
    moduller: Record<string, ModulPerformans>;
    kayitlar: PerformansKaydi[];
    sonGuncelleme: Date;
    mevcutRejim: PiyasaRejimi;
}

// === VARSAYILAN BAŞLANGIÇ DEĞERLERİ ===

const VARSAYILAN_AGIIRLIK_CARPANI = 1.0;
const MIN_AGIIRLIK_CARPANI = 0.5;   // En az %50 etki
const MAX_AGIIRLIK_CARPANI = 2.0;   // En fazla %200 etki

const FORM_HOT_ESIK = 70;           // Son 30 tahminde %70+ başarı
const FORM_WARM_ESIK = 50;          // Son 30 tahminde %50+ başarı

/**
 * PerformanceTracker Sınıfı
 */
export class PerformanceTracker {
    private durum: TrackerDurumu;
    private kayitDosyasi: string;

    constructor(kayitDosyasi?: string) {
        this.kayitDosyasi = kayitDosyasi || './data/performance-tracker.json';
        this.durum = this.baslangicDurumuOlustur();
    }

    /**
     * Başlangıç durumunu oluştur
     */
    private baslangicDurumuOlustur(): TrackerDurumu {
        return {
            moduller: {
                'Atlas V3': this.yeniModulPerformans('Atlas V3'),
                'Demeter': this.yeniModulPerformans('Demeter'),
                'Orion V3': this.yeniModulPerformans('Orion V3'),
                'Athena V2': this.yeniModulPerformans('Athena V2'),
                'Hermes': this.yeniModulPerformans('Hermes'),
                'Aether': this.yeniModulPerformans('Aether'),
                'Phoenix': this.yeniModulPerformans('Phoenix'),
                'Cronos': this.yeniModulPerformans('Cronos'),
            },
            kayitlar: [],
            sonGuncelleme: new Date(),
            mevcutRejim: 'YATAY',
        };
    }

    /**
     * Yeni modül performans nesnesi oluştur
     */
    private yeniModulPerformans(modul: string): ModulPerformans {
        return {
            modul,
            toplamTahmin: 0,
            dogruTahmin: 0,
            basariOrani: 50,          // Başlangıçta nötr (50%)
            bogaBasaris: 50,
            ayiBasaris: 50,
            yatayBasaris: 50,
            sonPerformans: { dogru: 0, toplam: 0, oran: 50 },
            agirlikCarpani: VARSAYILAN_AGIIRLIK_CARPANI,
            formDurumu: 'WARM',
        };
    }

    /**
     * Tahmin kaydet
     */
    tahminKaydet(
        modul: string,
        hisse: string,
        tahmin: OyTipi,
        tahminGuveni: number,
        piyasaRejimi: PiyasaRejimi
    ): PerformansKaydi {
        const kayit: PerformansKaydi = {
            tarih: new Date(),
            modul,
            hisse,
            tahmin,
            tahminGuveni,
            piyasaRejimi,
            gerceklesmeSuresi: 0,
            dogruMu: null,
        };

        this.durum.kayitlar.push(kayit);

        // Modül toplam sayısını güncelle
        if (this.durum.moduller[modul]) {
            this.durum.moduller[modul].toplamTahmin++;
        }

        this.durum.sonGuncelleme = new Date();
        return kayit;
    }

    /**
     * Tahminin sonucunu kaydet
     */
    sonucKaydet(kayitId: number, dogruMu: boolean): void {
        if (kayitId >= 0 && kayitId < this.durum.kayitlar.length) {
            const kayit = this.durum.kayitlar[kayitId];
            kayit.dogruMu = dogruMu;
            kayit.gerceklesmeSuresi = Math.floor(
                (Date.now() - kayit.tarih.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Modül performansını güncelle
            const modul = this.durum.moduller[kayit.modul];
            if (modul) {
                if (dogruMu) {
                    modul.dogruTahmin++;
                }

                // Genel başarı oranı
                modul.basariOrani = Math.round(
                    (modul.dogruTahmin / modul.toplamTahmin) * 100
                );

                // Rejim bazlı başarı
                if (kayit.piyasaRejimi === 'BOGA') {
                    modul.bogaBasaris = this.hareketliOranGuncelle(
                        modul.bogaBasaris,
                        dogruMu ? 100 : 0,
                        Math.min(modul.toplamTahmin, 50)
                    );
                } else if (kayit.piyasaRejimi === 'AYI') {
                    modul.ayiBasaris = this.hareketliOranGuncelle(
                        modul.ayiBasaris,
                        dogruMu ? 100 : 0,
                        Math.min(modul.toplamTahmin, 30)
                    );
                } else {
                    modul.yatayBasaris = this.hareketliOranGuncelle(
                        modul.yatayBasaris,
                        dogruMu ? 100 : 0,
                        Math.min(modul.toplamTahmin, 30)
                    );
                }

                // Son performansı güncelle (son 30)
                const sonKayitlar = this.durum.kayitlar
                    .filter(k => k.modul === kayit.modul && k.dogruMu !== null)
                    .slice(-30);

                modul.sonPerformans.toplam = sonKayitlar.length;
                modul.sonPerformans.dogru = sonKayitlar.filter(k => k.dogruMu).length;
                modul.sonPerformans.oran = Math.round(
                    (modul.sonPerformans.dogru / modul.sonPerformans.toplam) * 100
                );

                // Form durumu
                if (modul.sonPerformans.oran >= FORM_HOT_ESIK) {
                    modul.formDurumu = 'HOT';
                } else if (modul.sonPerformans.oran >= FORM_WARM_ESIK) {
                    modul.formDurumu = 'WARM';
                } else {
                    modul.formDurumu = 'COLD';
                }

                // Ağırlık çarpanını güncelle
                this.agirlikCarpaniGuncelle(kayit.modul, kayit.piyasaRejimi);
            }

            this.durum.sonGuncelleme = new Date();
        }
    }

    /**
     * Hareketli ortalama ile oran güncelleme
     */
    private hareketliOranGuncelle(mevcut: number, yeniDeger: number, adet: number): number {
        const alpha = 2 / (adet + 1);
        return Math.round(mevcut * (1 - alpha) + yeniDeger * alpha);
    }

    /**
     * Ağırlık çarpanını güncelle
     */
    private agirlikCarpaniGuncelle(modulAdi: string, mevcutRejim: PiyasaRejimi): void {
        const modul = this.durum.moduller[modulAdi];
        if (!modul) return;

        let hedefAgirlik = VARSAYILAN_AGIIRLIK_CARPANI;

        // Form bonusu/penaltısı
        if (modul.formDurumu === 'HOT') {
            hedefAgirlik += 0.3;  // Sıcak form = %30 bonus
        } else if (modul.formDurumu === 'COLD') {
            hedefAgirlik -= 0.2;  // Soğuk form = %20 penaltı
        }

        // Rejim bonusu
        let rejimBasarisi = 50;
        if (mevcutRejim === 'BOGA') {
            rejimBasarisi = modul.bogaBasaris;
        } else if (mevcutRejim === 'AYI') {
            rejimBasarisi = modul.ayiBasaris;
        } else {
            rejimBasarisi = modul.yatayBasaris;
        }

        // Rejimde başarılıysa ekstra bonus
        if (rejimBasarisi >= 65) {
            hedefAgirlik += 0.3;  // Bu rejimde uzman
        } else if (rejimBasarisi <= 35) {
            hedefAgirlik -= 0.3;  // Bu rejimde zayıf
        }

        // Sınırları uygula
        modul.agirlikCarpani = Math.max(
            MIN_AGIIRLIK_CARPANI,
            Math.min(MAX_AGIIRLIK_CARPANI, hedefAgirlik)
        );
    }

    /**
     * Mevcut piyasa rejimini güncelle
     */
    piyasaRejimiAyarla(rejim: PiyasaRejimi): void {
        this.durum.mevcutRejim = rejim;

        // Tüm modüllerin ağırlığını bu rejime göre güncelle
        for (const modulAdi of Object.keys(this.durum.moduller)) {
            this.agirlikCarpaniGuncelle(modulAdi, rejim);
        }

        this.durum.sonGuncelleme = new Date();
    }

    /**
     * Ağırlıklı oylama yap
     */
    agirlikliOyla(oylar: ModulOyu[]): AgirlikliOylama[] {
        return oylar.map(oy => {
            const modul = this.durum.moduller[oy.modul];
            const agirlik = modul?.agirlikCarpani || VARSAYILAN_AGIIRLIK_CARPANI;
            const form = modul?.formDurumu || 'WARM';

            return {
                modul: oy.modul,
                oy: oy.oy,
                guven: oy.guven,
                agirlik,
                agirlikliGuven: Math.round(oy.guven * agirlik),
                aciklama: `${oy.aciklama} | Ağırlık: ${agirlik.toFixed(2)}x | Form: ${form}`,
            };
        });
    }

    /**
     * Ağırlıklı Grand Council kararı
     */
    agirlikliCouncilKarari(
        hisse: string,
        oylar: AgirlikliOylama[]
    ): { karar: OyTipi; konsensus: number; aciklama: string } {
        const alAgirlik = oylar
            .filter(o => o.oy === 'AL')
            .reduce((sum, o) => sum + o.agirlikliGuven, 0);

        const satAgirlik = oylar
            .filter(o => o.oy === 'SAT')
            .reduce((sum, o) => sum + o.agirlikliGuven, 0);

        const bekleAgirlik = oylar
            .filter(o => o.oy === 'BEKLE')
            .reduce((sum, o) => sum + o.agirlikliGuven, 0);

        const toplam = alAgirlik + satAgirlik + bekleAgirlik;

        let karar: OyTipi = 'BEKLE';
        let konsensus = 0;

        if (toplam > 0) {
            if (alAgirlik > satAgirlik && alAgirlik > bekleAgirlik) {
                karar = 'AL';
                konsensus = Math.round((alAgirlik / toplam) * 100);
            } else if (satAgirlik > alAgirlik && satAgirlik > bekleAgirlik) {
                karar = 'SAT';
                konsensus = Math.round((satAgirlik / toplam) * 100);
            } else {
                konsensus = Math.round((bekleAgirlik / toplam) * 100);
            }
        }

        const formBilgisi = oylar
            .map(o => {
                const modul = this.durum.moduller[o.modul];
                return modul ? `${o.modul}(${modul.formDurumu})` : o.modul;
            })
            .join(', ');

        return {
            karar,
            konsensus,
            aciklama: `Dinamik Ağırlıklı Karar: ${karar} (%${konsensus})\nForm Durumu: ${formBilgisi}`,
        };
    }

    /**
     * Modül performansını getir
     */
    modulPerformans(modul: string): ModulPerformans | null {
        return this.durum.moduller[modul] || null;
    }

    /**
     * Tüm modül performanslarını getir
     */
    tumPerformanslar(): ModulPerformans[] {
        return Object.values(this.durum.moduller);
    }

    /**
     * En formda modülleri getir
     */
    enFormdaModuller(limit: number = 3): ModulPerformans[] {
        return this.tumPerformanslar()
            .filter(m => m.sonPerformans.toplam >= 5)  // En az 5 tahmin
            .sort((a, b) => b.sonPerformans.oran - a.sonPerformans.oran)
            .slice(0, limit);
    }

    /**
     * Mevcut rejime göre en iyi modülleri getir
     */
    rejimUzmanlari(rejim: PiyasaRejimi, limit: number = 3): ModulPerformans[] {
        return this.tumPerformanslar()
            .sort((a, b) => {
                const aBasari = rejim === 'BOGA' ? a.bogaBasaris :
                                rejim === 'AYI' ? a.ayiBasaris : a.yatayBasaris;
                const bBasari = rejim === 'BOGA' ? b.bogaBasaris :
                                rejim === 'AYI' ? b.ayiBasaris : b.yatayBasaris;
                return bBasari - aBasari;
            })
            .slice(0, limit);
    }

    /**
     * Durumu kaydet (dosyaya)
     */
    kaydet(): void {
        // Gerçek uygulamada burası dosyaya yazar
        // Şimdilik sadece log atıyoruz
        console.log('[PerformanceTracker] Durum kaydedildi:', this.durum.sonGuncelleme);
    }

    /**
     * Durumu yükle (dosyadan)
     */
    yukle(): void {
        // Gerçek uygulamada burası dosyadan okur
        console.log('[PerformanceTracker] Durum yüklendi');
    }

    /**
     * Durumu dışa aktar
     */
    durumuExport(): TrackerDurumu {
        return { ...this.durum };
    }
}

// === TEK İLİŞİLİK (Singleton) Tracker ===

let globalTracker: PerformanceTracker | null = null;

/**
 * Global tracker örneğini al
 */
export function getTracker(): PerformanceTracker {
    if (!globalTracker) {
        globalTracker = new PerformanceTracker();
    }
    return globalTracker;
}

/**
 * Modülü ağırlıklandırılmış güven puanına göre sırala
 */
export function siralaAgirlikliGuveneGore(oylar: AgirlikliOylama[]): AgirlikliOylama[] {
    return [...oylar].sort((a, b) => b.agirlikliGuven - a.agirlikliGuven);
}

/**
 * En etkili modülü bul (en yüksek ağırlıklı güven)
 */
export function enEtkiliModul(oylar: AgirlikliOylama[]): AgirlikliOylama | null {
    const sirali = siralaAgirlikliGuveneGore(oylar);
    return sirali.length > 0 ? sirali[0] : null;
}

/**
 * Form durumu ikonu
 */
export function formIcon(formDurumu: 'HOT' | 'WARM' | 'COLD'): string {
    switch (formDurumu) {
        case 'HOT': return '🔥';
        case 'WARM': return '🌡️';
        case 'COLD': return '❄️';
    }
}

/**
 * Ağırlık çarpanı ikonu
 */
export function agirlikIcon(agirlik: number): string {
    if (agirlik >= 1.5) return '⬆️';
    if (agirlik <= 0.7) return '⬇️';
    return '➡️';
}

export default {
    PerformanceTracker,
    getTracker,
    siralaAgirlikliGuveneGore,
    enEtkiliModul,
    formIcon,
    agirlikIcon,
};
