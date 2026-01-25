/**
 * Analiz Motoru - Ana giriş noktası
 * Tüm analiz modüllerini bir araya getirir
 * 
 * Pantheon v2.0 Modülleri:
 * - Atlas V3 (Yaşar Erdinç + Genişletilmiş Temel Analiz)
 * - Orion V4 (Ali Perşembe + Kıvanç Özbilgiç Teknik)
 * - Aether (Makro Rejim)
 * - Hermes V2 (Twitter 12 Hesap + LLM Sentiment)
 * - Phoenix (Strateji Birleştirme)
 * - Council (Grand Council Oylama)
 * - Chiron (Rejim + Öğrenme)
 * - Cronos (Zamanlama Faktörü) [YENİ]
 * - Athena (Faktör Zekası) [YENİ]
 * - Poseidon (ETF/Emtia Modu) [YENİ]
 */

// Legacy exports
import { fetchAllStocks, type StockFundamentals } from '@api/isyatirim';
import { hesaplaErdincSkor, skorlaVeSirala, raporFormatla, type ErdincScore } from './erdinc/rules';
import { topWonderkids, wonderkidRapor, type WonderkidScore } from './wonderkid/engine';
import { persembeAnaliz, type PersembeAnaliz } from './persembe/technical';
import { tumIndikatorler, type IndicatorResult } from './kivanc/indicators';

// Re-export legacy modules
export * from './erdinc/rules';
export * from './wonderkid/engine';
export * from './persembe/technical';
export * from './kivanc/indicators';

// Pantheon V2 Modülleri
export * from './atlas/engine';
export * from './orion/engine';
export * from './aether/engine';
export * from './hermes/engine';
export * from './phoenix/engine';
export * from './council/grand-council';
export * from './council/explanation';
export * from './chiron/risk';
export * from './cronos/engine';
export * from './athena/engine';
export * from './poseidon/engine';
export * from './pantheon/score';
export * from './autopilot/engine';
export * from './voice/engine';

// Named exports for easy access
export { default as atlas } from './atlas/engine';
export { default as orion } from './orion/engine';
export { default as aether } from './aether/engine';
export { default as hermes } from './hermes/engine';
export { default as phoenix } from './phoenix/engine';
export { default as council } from './council/grand-council';
export { default as chiron } from './chiron/risk';
export { default as cronos } from './cronos/engine';
export { default as athena } from './athena/engine';
export { default as poseidon } from './poseidon/engine';
export { default as pantheonScore } from './pantheon/score';
export { default as autopilot } from './autopilot/engine';
export { default as voice } from './voice/engine';


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
    console.log('📊 PANTHEON TRADING OS RAPORU');
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
