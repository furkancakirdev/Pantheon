/**
 * Sentiment Analizi - Türkçe NLP
 * 
 * Kaynaklar:
 * - X/Twitter scraping (12 hesap)
 * - Haber siteleri
 * 
 * Model: Basit keyword-based sentiment (Transformers.js entegrasyonu ileride)
 */

/**
 * Takip edilen hesaplar
 */
export const TAKIP_EDILEN_HESAPLAR = [
    { handle: 'prideveteran1', odak: 'genel piyasa' },
    { handle: 'kursadbucak', odak: 'teknik analiz' },
    { handle: 'ganicyus', odak: 'portföy yönetimi' },
    { handle: 'Selcoin', odak: 'kripto + hisse' },
    { handle: 'fire_ozgur', odak: 'FIRE haraketi' },
    { handle: 'finansal_ozgur', odak: 'finansal özgürlük' },
    { handle: 'yatirimcibaba1', odak: 'değer yatırımı' },
    { handle: 'birikimyatirimi', odak: 'uzun vadeli' },
    { handle: 'DegiskenPortfoy', odak: 'portföy taktikleri' },
    { handle: 'Finansalpsk', odak: 'temel analiz' },
    { handle: 'yatirimfonlarim', odak: 'fon analizleri' },
    { handle: 'fatihtonguc', odak: 'youtube video' },
    // Yeni eklenen hesaplar (10 adet)
    { handle: 'fx_trader__', odak: 'forex + hisse' },
    { handle: 'serkan_saka_', odak: 'teknik analiz' },
    { handle: 'omerhankrm', odak: 'detaylı analiz raporları', oncelikli: true },
    { handle: 'TanerGenek', odak: 'piyasa analizi' },
    { handle: 'ademayan66', odak: 'hisse analizi' },
    { handle: 'nurisevgen', odak: 'yatırım stratejileri' },
    { handle: 'kadirhanozturk', odak: 'borsa analizi' },
    { handle: 'KptKUTERO', odak: 'teknik analiz' },
    { handle: 'cembabafinans', odak: 'finans haberleri' },
    { handle: 'financialfree42', odak: 'finansal özgürlük' },
];

/**
 * Pozitif kelimeler (Türkçe)
 */
export const POZITIF_KELIMELER = [
    'yükseliş', 'artış', 'rekor', 'büyüme', 'kar', 'kazanç',
    'al', 'alım', 'toplama', 'fırsat', 'ucuz', 'değerli',
    'güçlü', 'pozitif', 'başarı', 'ihracat', 'yatırım',
    'temettü', 'beklenti', 'hedef', 'öneri', 'destek',
    'kırılım', 'breakout', 'momentum', 'trend', 'boğa',
];

/**
 * Negatif kelimeler (Türkçe)
 */
export const NEGATIF_KELIMELER = [
    'düşüş', 'azalış', 'zarar', 'kayıp', 'kriz', 'risk',
    'sat', 'satış', 'çık', 'tehlike', 'pahalı', 'aşırı',
    'zayıf', 'negatif', 'başarısız', 'daralma', 'borç',
    'endişe', 'belirsizlik', 'volatilite', 'ayı', 'çöküş',
    'direnç', 'kırılamadı', 'geri çekilme', 'stop',
];

/**
 * Sentiment sonucu
 */
export interface SentimentResult {
    metin: string;
    skor: number;           // -1 (negatif) ile 1 (pozitif) arası
    label: 'POZİTİF' | 'NEGATİF' | 'NÖTR';
    pozitifKelimeler: string[];
    negatifKelimeler: string[];
    bahsedilenHisseler: string[];
}

/**
 * Tweet/Post verisi
 */
export interface Post {
    id: string;
    hesap: string;
    metin: string;
    tarih: Date;
    begeni: number;
    retweet: number;
}

/**
 * Metindeki hisse sembollerini bul ($THYAO, $ASELS vb.)
 */
export function hisseBul(metin: string): string[] {
    const regex = /\$([A-Z]{3,5})/g;
    const matches = metin.match(regex);
    return matches ? matches.map(m => m.replace('$', '')) : [];
}

/**
 * Basit keyword-based sentiment analizi
 */
export function analizEt(metin: string): SentimentResult {
    const metinLower = metin.toLowerCase();

    const pozitifBulunan = POZITIF_KELIMELER.filter(k => metinLower.includes(k));
    const negatifBulunan = NEGATIF_KELIMELER.filter(k => metinLower.includes(k));

    const pozitifSkor = pozitifBulunan.length;
    const negatifSkor = negatifBulunan.length;
    const toplam = pozitifSkor + negatifSkor;

    let skor = 0;
    if (toplam > 0) {
        skor = (pozitifSkor - negatifSkor) / toplam;
    }

    let label: SentimentResult['label'] = 'NÖTR';
    if (skor > 0.2) label = 'POZİTİF';
    else if (skor < -0.2) label = 'NEGATİF';

    return {
        metin,
        skor,
        label,
        pozitifKelimeler: pozitifBulunan,
        negatifKelimeler: negatifBulunan,
        bahsedilenHisseler: hisseBul(metin),
    };
}

/**
 * Birden fazla postu analiz et ve özet çıkar
 */
export function topluAnaliz(posts: Post[]): {
    genelSentiment: number;
    genelLabel: SentimentResult['label'];
    hisseBazliSentiment: Map<string, number>;
    topPozitif: Post[];
    topNegatif: Post[];
} {
    const analizler = posts.map(p => ({ post: p, sonuc: analizEt(p.metin) }));

    // Genel sentiment
    const skorlar = analizler.map(a => a.sonuc.skor);
    const genelSentiment = skorlar.length > 0
        ? skorlar.reduce((a, b) => a + b, 0) / skorlar.length
        : 0;

    let genelLabel: SentimentResult['label'] = 'NÖTR';
    if (genelSentiment > 0.2) genelLabel = 'POZİTİF';
    else if (genelSentiment < -0.2) genelLabel = 'NEGATİF';

    // Hisse bazlı sentiment
    const hisseBazliSentiment = new Map<string, number[]>();
    analizler.forEach(a => {
        a.sonuc.bahsedilenHisseler.forEach(hisse => {
            if (!hisseBazliSentiment.has(hisse)) {
                hisseBazliSentiment.set(hisse, []);
            }
            hisseBazliSentiment.get(hisse)!.push(a.sonuc.skor);
        });
    });

    const hisseOrtalamalari = new Map<string, number>();
    hisseBazliSentiment.forEach((skorlar, hisse) => {
        const ort = skorlar.reduce((a, b) => a + b, 0) / skorlar.length;
        hisseOrtalamalari.set(hisse, ort);
    });

    // Top pozitif ve negatif postlar
    const sirali = [...analizler].sort((a, b) => b.sonuc.skor - a.sonuc.skor);
    const topPozitif = sirali.slice(0, 5).map(a => a.post);
    const topNegatif = sirali.slice(-5).reverse().map(a => a.post);

    return {
        genelSentiment,
        genelLabel,
        hisseBazliSentiment: hisseOrtalamalari,
        topPozitif,
        topNegatif,
    };
}

/**
 * Sentiment özeti formatla
 */
export function ozetFormatla(
    genelSentiment: number,
    genelLabel: SentimentResult['label']
): string {
    const emoji = genelLabel === 'POZİTİF' ? '🟢' : genelLabel === 'NEGATİF' ? '🔴' : '🟡';
    const yuzde = Math.abs(genelSentiment * 100).toFixed(0);

    return `${emoji} Piyasa Duyarlılığı: ${genelLabel} (%${yuzde})`;
}

export default {
    analizEt,
    topluAnaliz,
    ozetFormatla,
    hisseBul,
    TAKIP_EDILEN_HESAPLAR,
    POZITIF_KELIMELER,
    NEGATIF_KELIMELER,
};
