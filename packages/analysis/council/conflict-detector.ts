/**
 * ConflictDetector - Konsey İhtilafı Dedektörü
 *
 * Yapılacaklar 3.txt - "KONSEY'İN RUHU":
 * Modüller arası çelişkiyi fırsata çevirin.
 * Senaryo: Hermes (Haberler) "Çok Kötü" diyor, ama Atlas (Temel) "Çok Ucuz" diyor.
 * Bu bir "Panik Satışı Fırsatı"dır.
 *
 * Özellikler:
 * - Modüller arası görüş ayrılığını tespit et
 * - Çatışma türünü belirle (Temel vs Teknik, Haber vs Fiyat, vb.)
 * - Fırsat/Risk sinyali üret
 * - "Konsey Kararsız, Ama Fırsat Olabilir" uyarısı ver
 */

import { OyTipi, ModulOyu, ModulGorus } from './grand-council';

/**
 * Çatışma Şiddeti
 */
export type CatismaSeviyesi = 'YOK' | 'DÜŞÜK' | 'ORTA' | 'YÜKSEK' | 'KRİTİK';

/**
 * Çatışma Türü
 */
export type CatismaTuru =
    | 'TEMEL_TEKNİK'        // Temel analiz ile teknik analiz çelişkisi
    | 'HABER_FIYAT'         // Duygu (Hermes) ile fiyat çelişkisi
    | 'MAKRO_MIKRO'         // Makro rejim ile bireysel hisse çelişkisi
    | 'KISA_UZUN'           // Kısa vadeli ile uzun vadeli çelişki
    | 'SEKTÖR_GENEL'        // Sektör trendi ile hisse çelişkisi
    | 'ZAMANLA_REJİM';      // Zamanlama ile piyasa rejimi çelişkisi

/**
 * Fırsat Türü
 */
export type FirsatTuru =
    | 'PANİK_SATIŞ_FIRSATI'    // Haberler kötü ama temeller sağlam
    | 'BALON_UYARISI'           // Fiyat yükseliyor ama temeller zayıf
    | 'BOTTOM_AVAİ'             // Teknik dip ama temel henüz hazır değil
    | 'TOP_GERİLEME'            // Zirve yakın ama hala alış sinyali
    | 'TREND_DEĞİŞİMİ';         // Trend dönüşü sinyali

/**
 * Çatışma Analizi Sonucu
 */
export interface CatismaAnalizi {
    seviye: CatismaSeviyesi;
    tur: CatismaTuru | null;
    varyansPuani: number;        // 0-100 arası, yüksek = çok ihtilaf
    firsatTuru: FirsatTuru | null;
    aciklama: string;
    etkileyenModuller: {
        modul: string;
        oy: OyTipi;
        guven: number;
    }[];
    ozetMesaj: string;
    aksiyonOnerisi: string;
}

/**
 * Modül Görüş Çatışması
 */
export interface ModulCatismasi {
    modul1: string;
    modul2: string;
    tip: 'ZIT' | 'FARKLI';
    fark: number;  // Güven puanı farkı
    aciklama: string;
}

/**
 * ConflictDetector Sınıfı
 */
export class ConflictDetector {
    private VARYANS_ESIK_LOW = 25;
    private VARYANS_ESIK_MEDIUM = 40;
    private VARYANS_ESIK_HIGH = 55;
    private VARYANS_ESIK_CRITICAL = 70;

    /**
     * Modül oylarını analiz et ve çatışma tespit et
     */
    analizEt(oylar: ModulOyu[], piyasaRejimi?: string): CatismaAnalizi {
        if (oylar.length === 0) {
            return this.bosAnaliz();
        }

        // Oyları grupla
        const alOylar = oylar.filter(o => o.oy === 'AL');
        const satOylar = oylar.filter(o => o.oy === 'SAT');
        const bekleOylar = oylar.filter(o => o.oy === 'BEKLE');

        // Güven puanlarına göre varyans hesapla
        const guvenler = oylar.map(o => o.guven);
        const varyans = this.varyansHesapla(guvenler);
        const varyansPuani = Math.min(100, Math.round(varyans));

        // Çatışma seviyesini belirle
        const seviye = this.catismaSeviyesiBelirle(varyansPuani, alOylar.length, satOylar.length);

        // Çatışma türünü tespit et
        const tur = this.catismaTuruTespitEt(oylar);

        // Fırsat türünü belirle
        const firsat = this.firsatTuruBelirle(oylar, tur);

        const aciklama = this.aciklamaOlustur(seviye, tur, firsat, oylar);
        const ozet = this.ozetMesajOlustur(seviye, firsat);
        const aksiyon = this.aksiyonOnerisiOlustur(firsat, seviye);

        return {
            seviye,
            tur,
            varyansPuani,
            firsatTuru: firsat,
            aciklama,
            etkileyenModuller: oylar.map(o => ({ modul: o.modul, oy: o.oy, guven: o.guven })),
            ozetMesaj: ozet,
            aksiyonOnerisi: aksiyon,
        };
    }

    /**
     * Modül görüşlerini analiz et (detaylı)
     */
    detayliAnaliz(gorusler: ModulGorus[]): CatismaAnalizi {
        if (gorusler.length === 0) {
            return this.bosAnaliz();
        }

        const oylar: ModulOyu[] = gorusler.map(g => ({
            modul: g.modul,
            oy: g.oy,
            guven: g.guven,
            icon: '',
            aciklama: g.gorus,
        }));

        return this.analizEt(oylar);
    }

    /**
     * Varyans hesapla (standart sapma karesi)
     */
    private varyansHesapla(degerler: number[]): number {
        if (degerler.length === 0) return 0;

        const ortalama = degerler.reduce((sum, d) => sum + d, 0) / degerler.length;
        const varyans = degerler.reduce((sum, d) => sum + Math.pow(d - ortalama, 2), 0) / degerler.length;

        return varyans;
    }

    /**
     * Çatışma seviyesini belirle
     */
    private catismaSeviyesiBelirle(
        varyansPuani: number,
        alSayisi: number,
        satSayisi: number
    ): CatismaSeviyesi {
        // Hem AL hem SAT oyu varsa ve varyans yüksekse -> KRİTİK
        if (alSayisi > 0 && satSayisi > 0) {
            if (varyansPuani >= this.VARYANS_ESIK_CRITICAL) return 'KRİTİK';
            if (varyansPuani >= this.VARYANS_ESIK_HIGH) return 'YÜKSEK';
        }

        // Varyans puanına göre
        if (varyansPuani >= this.VARYANS_ESIK_HIGH) return 'YÜKSEK';
        if (varyansPuani >= this.VARYANS_ESIK_MEDIUM) return 'ORTA';
        if (varyansPuani >= this.VARYANS_ESIK_LOW) return 'DÜŞÜK';
        return 'YOK';
    }

    /**
     * Çatışma türünü tespit et
     */
    private catismaTuruTespitEt(oylar: ModulOyu[]): CatismaTuru | null {
        const modulMap = new Map<string, ModulOyu>();
        oylar.forEach(o => modulMap.set(o.modul, o));

        // Atlas (Temel) vs Orion (Teknik)
        const atlas = modulMap.get('Atlas V3');
        const orion = modulMap.get('Orion V3');
        if (atlas && orion && this.zitMi(atlas.oy, orion.oy)) {
            return 'TEMEL_TEKNİK';
        }

        // Hermes (Haber/Duygu) vs Fiyat (AL/SAT dengesi)
        const hermes = modulMap.get('Hermes');
        if (hermes) {
            const alOylar = oylar.filter(o => o.oy === 'AL').length;
            const satOylar = oylar.filter(o => o.oy === 'SAT').length;

            // Hermes iyi diyor ama çoğunluk kötü diyor (veya tersi)
            if ((hermes.oy === 'AL' && satOylar > alOylar) ||
                (hermes.oy === 'SAT' && alOylar > satOylar)) {
                return 'HABER_FIYAT';
            }
        }

        // Aether (Makro) vs Diğerleri
        const aether = modulMap.get('Aether');
        if (aether) {
            const digerOylar = oylar.filter(o => o.modul !== 'Aether');
            const aetherYonu = aether.oy === 'AL' ? 'AL' : aether.oy === 'SAT' ? 'SAT' : 'BEKLE';

            const digerFavori = this.enPopulerOy(digerOylar);
            if (digerFavori && this.zitMi(aetherYonu as OyTipi, digerFavori)) {
                return 'MAKRO_MIKRO';
            }
        }

        // Cronos (Zamanlama) çatışması
        const cronos = modulMap.get('Cronos');
        if (cronos && cronos.oy === 'SAT') {
            const alOylar = oylar.filter(o => o.oy === 'AL');
            if (alOylar.length > 0) {
                return 'ZAMANLA_REJİM';
            }
        }

        // Demeter (Sektör) vs Genel
        const demeter = modulMap.get('Demeter');
        if (demeter) {
            const alOylar = oylar.filter(o => o.oy === 'AL').length;
            const satOylar = oylar.filter(o => o.oy === 'SAT').length;

            if ((demeter.oy === 'AL' && satOylar > alOylar) ||
                (demeter.oy === 'SAT' && alOylar > satOylar)) {
                return 'SEKTÖR_GENEL';
            }
        }

        return null;
    }

    /**
     * Fırsat türünü belirle
     */
    private firsatTuruBelirle(oylar: ModulOyu[], tur: CatismaTuru | null): FirsatTuru | null {
        const modulMap = new Map<string, ModulOyu>();
        oylar.forEach(o => modulMap.set(o.modul, o));

        // Panik Satışı Fırsatı
        if (tur === 'HABER_FIYAT' || tur === 'TEMEL_TEKNİK') {
            const hermes = modulMap.get('Hermes');
            const atlas = modulMap.get('Atlas V3');

            // Hermes kötü diyor ama Atlas iyi diyor
            if (hermes && atlas && hermes.oy === 'SAT' && atlas.oy === 'AL') {
                return 'PANİK_SATIŞ_FIRSATI';
            }

            // Teknik dip ama temel sağlam
            const orion = modulMap.get('Orion V3');
            if (orion && atlas && orion.oy === 'SAT' && atlas.oy === 'AL') {
                return 'BOTTOM_AVAİ';
            }
        }

        // Balon Uyarısı
        const alOylar = oylar.filter(o => o.oy === 'AL');
        const atlas = modulMap.get('Atlas V3');
        const orion = modulMap.get('Orion V3');

        // Herkes AL diyor ama temel zayıfsa
        if (alOylar.length >= oylar.length * 0.6 && atlas && atlas.oy !== 'AL') {
            return 'BALON_UYARISI';
        }

        // Zirve yakın
        if (orion && orion.oy === 'AL' && atlas && atlas.oy === 'BEKLE') {
            return 'TOP_GERİLEME';
        }

        // Trend değişimi
        if (tur === 'ZAMANLA_REJİM') {
            return 'TREND_DEĞİŞİMİ';
        }

        return null;
    }

    /**
     * Açıklama oluştur
     */
    private aciklamaOlustur(
        seviye: CatismaSeviyesi,
        tur: CatismaTuru | null,
        firsat: FirsatTuru | null,
        oylar: ModulOyu[]
    ): string {
        let aciklama = '';

        switch (seviye) {
            case 'KRİTİK':
                aciklama = '🔴 KRİTİK ÇATIŞMA: Konsey ciddi şekilde bölünmüş.';
                break;
            case 'YÜKSEK':
                aciklama = '🟠 YÜKSEK ÇATIŞMA: Modüller arasında önemli görüş ayrılıkları var.';
                break;
            case 'ORTA':
                aciklama = '🟡 ORTA ÇATIŞMA: Bazı modüller farklı görüşlere sahip.';
                break;
            case 'DÜŞÜK':
                aciklama = '🟢 DÜŞÜK ÇATIŞMA: Hafif görüş farkları.';
                break;
            default:
                aciklama = '✅ Konsensus: Modüller genel olarak aynı görüşte.';
        }

        if (tur) {
            const turAciklama = this.turAciklama(tur);
            aciklama += ` Tür: ${turAciklama}.`;
        }

        if (firsat) {
            const firsatAciklama = this.firsatAciklama(firsat);
            aciklama += ` ${firsatAciklama}`;
        }

        return aciklama;
    }

    /**
     * Özet mesaj oluştur
     */
    private ozetMesajOlustur(seviye: CatismaSeviyesi, firsat: FirsatTuru | null): string {
        if (firsat === 'PANİK_SATIŞ_FIRSATI') {
            return '🎯 PANİK SATIŞI FIRSATI! Kötü haberler fiyatı düşürdü ama temeller sağlam.';
        }
        if (firsat === 'BALON_UYARISI') {
            return '⚠️ BALON UYARISI! Fiyatlar yükseliyor ama temel destek zayıf.';
        }
        if (firsat === 'BOTTOM_AVAİ') {
            return '💎 BOTTOM FıRSATI! Teknik olarak dip bölgesinde, temel sağlam.';
        }
        if (firsat === 'TOP_GERİLEME') {
            return '🔻 ZİRVE YAKIN! Kısa vadeli kar almayı düşünün.';
        }

        switch (seviye) {
            case 'KRİTİK': return '⚔️ Konsey ciddi şekilde bölünmüş. Dikkatli olun.';
            case 'YÜKSEK': return '⚠️ Konsey kararsız. Beklemek en iyisi.';
            case 'ORTA': return '🤔 Hafif kararsızlık. Diğer faktörlere bakın.';
            default: return '✅ Konsey genel olarak aynı görüşte.';
        }
    }

    /**
     * Aksiyon önerisi oluştur
     */
    private aksiyonOnerisiOlustur(firsat: FirsatTuru | null, seviye: CatismaSeviyesi): string {
        if (firsat === 'PANİK_SATIŞ_FIRSATI') {
            return '💡 AKSİYON: Panik ile satışlar fırsat olabilir. Güçlü temelleri olan hisseleri izleyin.';
        }
        if (firsat === 'BALON_UYARISI') {
            return '💡 AKSİYON: Balon riski yüksek. Kademeli satış düşünün.';
        }
        if (firsat === 'BOTTOM_AVAİ') {
            return '💡 AKSİYON: Teknik dip bölgesi. Kademeli alım yapılabilir.';
        }
        if (firsat === 'TOP_GERİLEME') {
            return '💡 AKSİYON: Zirve yakın, kar almayı düşünün.';
        }

        if (seviye === 'KRİTİK' || seviye === 'YÜKSEK') {
            return '💡 AKSİYON: Konsey kararsız. Beklemek en iyisi.';
        }

        return '💡 AKSİYON: Diğer faktörlere de bakın.';
    }

    /**
     * Tür açıklaması
     */
    private turAciklama(tur: CatismaTuru): string {
        switch (tur) {
            case 'TEMEL_TEKNİK': return 'Temel vs Teknik';
            case 'HABER_FIYAT': return 'Haber/Duygu vs Fiyat';
            case 'MAKRO_MIKRO': return 'Makro Rejim vs Hisse';
            case 'KISA_UZUN': return 'Kısa vs Uzun Vadeli';
            case 'SEKTÖR_GENEL': return 'Sektör vs Genel';
            case 'ZAMANLA_REJİM': return 'Zamanlama Çatışması';
        }
    }

    /**
     * Fırsat açıklaması
     */
    private firsatAciklama(firsat: FirsatTuru): string {
        switch (firsat) {
            case 'PANİK_SATIŞ_FIRSATI': return 'Haberler kötü ama şirket sağlam.';
            case 'BALON_UYARISI': return 'Fiyatlar temelleri geride bıraktı.';
            case 'BOTTOM_AVAİ': return 'Teknik dip, temel destek var.';
            case 'TOP_GERİLEME': return 'Zirve yakın, dikkat.';
            case 'TREND_DEĞİŞİMİ': return 'Trend dönüş sinyali.';
        }
    }

    /**
     * İki oyun zıt olup olmadığını kontrol et
     */
    private zitMi(oy1: OyTipi, oy2: OyTipi): boolean {
        return (oy1 === 'AL' && oy2 === 'SAT') || (oy1 === 'SAT' && oy2 === 'AL');
    }

    /**
     * En popüler oyu bul
     */
    private enPopulerOy(oylar: ModulOyu[]): OyTipi | null {
        const al = oylar.filter(o => o.oy === 'AL').length;
        const sat = oylar.filter(o => o.oy === 'SAT').length;
        const bekle = oylar.filter(o => o.oy === 'BEKLE').length;

        if (al > sat && al > bekle) return 'AL';
        if (sat > al && sat > bekle) return 'SAT';
        if (bekle > al && bekle > sat) return 'BEKLE';

        return null;
    }

    /**
     * Boş analiz
     */
    private bosAnaliz(): CatismaAnalizi {
        return {
            seviye: 'YOK',
            tur: null,
            varyansPuani: 0,
            firsatTuru: null,
            aciklama: 'Analiz yapılabilecek oy yok.',
            etkileyenModuller: [],
            ozetMesaj: 'Veri yok.',
            aksiyonOnerisi: 'Bekleyin...',
        };
    }

    /**
     * Modül çiftlerini karşılaştır
     */
    modulleriKarsilastir(oylar: ModulOyu[]): ModulCatismasi[] {
        const catismalar: ModulCatismasi[] = [];

        for (let i = 0; i < oylar.length; i++) {
            for (let j = i + 1; j < oylar.length; j++) {
                const o1 = oylar[i];
                const o2 = oylar[j];

                const fark = Math.abs(o1.guven - o2.guven);
                const zit = this.zitMi(o1.oy, o2.oy);

                catismalar.push({
                    modul1: o1.modul,
                    modul2: o2.modul,
                    tip: zit ? 'ZIT' : 'FARKLI',
                    fark,
                    aciklama: zit
                        ? `${o1.modul} (${o1.oy}) vs ${o2.modul} (${o2.oy}) - Zıt görüşler`
                        : `${o1.modul} (${o1.oy}) vs ${o2.modul} (${o2.oy}) - ${fark} puan farkı`,
                });
            }
        }

        return catismalar.sort((a, b) => b.fark - a.fark);
    }

    /**
     * Çatışma seviyesi ikonu
     */
    seviyeIcon(seviye: CatismaSeviyesi): string {
        switch (seviye) {
            case 'KRİTİK': return '🔴';
            case 'YÜKSEK': return '🟠';
            case 'ORTA': return '🟡';
            case 'DÜŞÜK': return '🟢';
            default: return '⚪';
        }
    }

    /**
     * Fırsat ikonu
     */
    firsatIcon(firsat: FirsatTuru | null): string {
        switch (firsat) {
            case 'PANİK_SATIŞ_FIRSATI': return '💎';
            case 'BALON_UYARISI': return '🎈';
            case 'BOTTOM_AVAİ': return '📈';
            case 'TOP_GERİLEME': return '📉';
            case 'TREND_DEĞİŞİMİ': return '🔄';
            default: return '⚪';
        }
    }
}

// === GLOBAL INSTANCE ===

let globalDetector: ConflictDetector | null = null;

/**
 * Global conflict detector örneğini al
 */
export function getConflictDetector(): ConflictDetector {
    if (!globalDetector) {
        globalDetector = new ConflictDetector();
    }
    return globalDetector;
}

/**
 * Hızlı analiz fonksiyonu
 */
export function catismasiAnaliziEt(oylar: ModulOyu[]): CatismaAnalizi {
    return getConflictDetector().analizEt(oylar);
}

/**
 * Çatışma seviyesini kontrol et (eşik değeri ile)
 */
export function catismaVarMi(oylar: ModulOyu[], esik: CatismaSeviyesi = 'ORTA'): boolean {
    const analiz = catismasiAnaliziEt(oylar);
    const seviyeler: CatismaSeviyesi[] = ['YOK', 'DÜŞÜK', 'ORTA', 'YÜKSEK', 'KRİTİK'];
    return seviyeler.indexOf(analiz.seviye) >= seviyeler.indexOf(esik);
}

export default {
    ConflictDetector,
    getConflictDetector,
    catismasiAnaliziEt,
    catismaVarMi,
};
