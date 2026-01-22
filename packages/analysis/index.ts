/**
 * Analiz Motoru - Ana giriş noktası
 * Tüm analiz modüllerini bir araya getirir
 */

import { fetchAllStocks, type StockFundamentals } from '../api-clients/isyatirim.js';
import { hesaplaErdincSkor, skorlaVeSirala, raporFormatla, type ErdincScore } from './erdinc/rules.js';
import { topWonderkids, wonderkidRapor, type WonderkidScore } from './wonderkid/engine.js';

export interface AnalizRaporu {
    tarih: string;
    toplamHisse: number;
    erdincTop10: ErdincScore[];
    wonderkidTop10: WonderkidScore[];
    ozet: string;
}

/**
 * Tam analiz çalıştır
 */
export async function tamAnaliz(): Promise<AnalizRaporu> {
    console.log('📊 Veri çekiliyor...');
    const hisseler = await fetchAllStocks();
    console.log(`✅ ${hisseler.length} hisse yüklendi`);

    console.log('\n🔍 Yaşar Erdinç analizi yapılıyor...');
    const erdincSkorlar = skorlaVeSirala(hisseler);
    const erdincTop10 = erdincSkorlar.slice(0, 10);

    console.log('\n⭐ Wonderkid analizi yapılıyor...');
    const wonderkidTop10 = topWonderkids(hisseler, 10);

    const rapor: AnalizRaporu = {
        tarih: new Date().toISOString(),
        toplamHisse: hisseler.length,
        erdincTop10,
        wonderkidTop10,
        ozet: `${hisseler.length} hisse analiz edildi. Erdinç Top 1: ${erdincTop10[0]?.kod}, Wonderkid Top 1: ${wonderkidTop10[0]?.kod}`,
    };

    return rapor;
}

/**
 * Raporu yazdır
 */
export function raporYazdir(rapor: AnalizRaporu): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 YATIRIM AJAN RAPORU');
    console.log('='.repeat(60));
    console.log(`Tarih: ${rapor.tarih}`);
    console.log(`Toplam Analiz Edilen: ${rapor.toplamHisse} hisse`);

    console.log('\n' + '-'.repeat(60));
    console.log('🏆 YAŞAR ERDİNÇ TOP 10');
    console.log('-'.repeat(60));
    rapor.erdincTop10.forEach((s, i) => {
        console.log(`${i + 1}. ${s.kod} - Skor: ${s.toplamSkor}/100`);
    });

    console.log('\n' + '-'.repeat(60));
    console.log('⭐ WONDERKID TOP 10');
    console.log('-'.repeat(60));
    rapor.wonderkidTop10.forEach((w, i) => {
        const yildiz = w.potansiyelYildiz ? '⭐' : '';
        console.log(`${i + 1}. ${yildiz} ${w.kod} - Skor: ${w.wonderkidSkor}/100 (${w.trendEslesmesi.join(', ') || 'Genel'})`);
    });

    console.log('\n' + '='.repeat(60));
}

// CLI çalıştırma
if (import.meta.url === `file://${process.argv[1]}`) {
    tamAnaliz()
        .then(rapor => {
            raporYazdir(rapor);

            // Detaylı ilk rapor
            if (rapor.erdincTop10[0]) {
                console.log('\n📋 EN İYİ HİSSE DETAYI:');
                console.log(raporFormatla(rapor.erdincTop10[0]));
            }
        })
        .catch(err => {
            console.error('❌ Analiz hatası:', err.message);
            process.exit(1);
        });
}

export default {
    tamAnaliz,
    raporYazdir,
};
