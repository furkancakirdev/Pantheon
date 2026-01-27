/**
 * Prometheus - Second-Order Thinking Adaptörü
 *
 * Grand Council'e Prometheus modülünü entegre eder
 */

import type { PrometheusAnalysis, CouncilVote } from '../prometheus';
import type { ModulOyu, ModulGorus } from './grand-council';

// ============ PROMETHEUS ADAPTÖRLERİ ============

/**
 * Prometheus Oyu Adaptörü
 *
 * @param analysis - Prometheus analizi
 * @returns ModulOyu
 */
export function prometheusOyu(analysis: PrometheusAnalysis): ModulOyu {
  let oy: CouncilVote['oy'];
  let guven: number;
  
  // Dolaylı faydalanıcı var mı?
  const hasIndirectPlays = analysis.indirectPlays.length > 0;
  
  // Streaming/Royalty var mı?
  const hasStreaming = analysis.indirectPlays.some(p => 
    p.type === 'STREAMING' || p.type === 'ROYALTY'
  );
  
  // Oy tipi belirle
  if (hasStreaming && analysis.score >= 60) {
    oy = 'AL';
    guven = Math.min(100, analysis.score + 10);
  } else if (hasIndirectPlays && analysis.score >= 50) {
    oy = 'AL';
    guven = analysis.score;
  } else if (analysis.directPlays.length > 0 && analysis.score >= 60) {
    oy = 'AL';
    guven = analysis.score - 10; // Direkt oyuncular için düşük güven
  } else {
    oy = 'BEKLE';
    guven = 50;
  }
  
  // Açıklama oluştur
  let aciklama = '';
  if (hasStreaming) {
    const streamingNames = analysis.indirectPlays
      .filter(p => p.type === 'STREAMING' || p.type === 'ROYALTY')
      .map(p => p.beneficiary)
      .join(', ');
    aciklama = `Second-Order: ${streamingNames} (Streaming/Royalty modeli, risk asimetrisi)`;
  } else if (hasIndirectPlays) {
    const indirectNames = analysis.indirectPlays.map(p => p.beneficiary).join(', ');
    aciklama = `Second-Order: ${indirectNames}`;
  } else if (analysis.macroTrend) {
    aciklama = `Makro trend: ${analysis.macroTrend.trigger}`;
  } else {
    aciklama = 'Second-Order ilişki tespit edilemedi';
  }
  
  return {
    modul: 'Prometheus',
    oy,
    guven,
    icon: '🔬',
    aciklama,
  };
}

/**
 * Prometheus Görüş Adaptörü
 *
 * @param analysis - Prometheus analizi
 * @returns ModulGorus
 */
export function prometheusGorus(analysis: PrometheusAnalysis): ModulGorus {
  let gorus = '';
  let sinyal: string | undefined;
  
  // Dolaylı faydalanıcı var mı?
  const hasIndirectPlays = analysis.indirectPlays.length > 0;
  const hasStreaming = analysis.indirectPlays.some(p => 
    p.type === 'STREAMING' || p.type === 'ROYALTY'
  );
  
  if (hasStreaming) {
    const streamingCount = analysis.indirectPlays.filter(p => 
      p.type === 'STREAMING' || p.type === 'ROYALTY'
    ).length;
    
    gorus = `Second-Order Thinking: ${streamingCount} streaming/royalty şirketi tespit edildi. ` +
      `Bu şirketler, direkt madencilikten daha düşük riskle trendten faydalanıyor. ` +
      `Sabit alım fiyatı, capex riski yok, keşif maliyeti yok.`;
    
    sinyal = 'RİSK ASİMETRİSİ';
  } else if (hasIndirectPlays) {
    gorus = `Second-Order Thinking: ${analysis.indirectPlays.length} dolaylı faydalanıcı tespit edildi. ` +
      `Bu şirketler, trendten dolaylı olarak faydalanıyor.`;
    
    sinyal = 'SECOND-ORDER';
  } else if (analysis.macroTrend) {
    gorus = `Makro trend tespit edildi: ${analysis.macroTrend.trigger}. ` +
      `Etkilenen emtialar: ${analysis.macroTrend.affectedCommodities.join(', ')}.`;
    
    sinyal = 'MAKRO TREND';
  } else {
    gorus = 'Second-Order ilişki tespit edilemedi. Daha fazla veri gerekli.';
    
    sinyal = 'NO SIGNAL';
  }
  
  return {
    modul: 'Prometheus (Second-Order Thinking)',
    icon: '🔬',
    oy: analysis.score >= 60 ? 'AL' : analysis.score >= 40 ? 'BEKLE' : 'SAT',
    guven: Math.round(analysis.score),
    gorus,
    sinyal,
  };
}

/**
 * Prometheus için Dynamic Council Membership
 * 
 * @param symbol - Sembol
 * @returns boolean - Prometheus aktif mi?
 */
export function isPrometheusEligible(symbol: string): boolean {
  const upperSymbol = symbol.toUpperCase();
  
  // Prometheus, emtia ve madencilikle ilgili hisseler için aktif
  const eligibleSymbols = [
    // Emtia ve madencilik
    'ETIL', 'EGEEN', 'TKFEN', 'KRDMD', 'IZMIR', 'ERDEM', 'ISCEM',
    // Altın ve değerli metaller
    'ALBRK', 'KOZAA', 'ODAS',
    // Lityum ve nadir elementler
    'KOZAA',
    // Demir-çelik
    'IZMIR', 'ERDEM', 'ISCEM',
    // Yarı iletken
    'SAHOL', 'THYAO',
    // US streaming şirketleri
    'WPM', 'FNV', 'RGLD', 'OR', 'SAND', 'ER', 'FCX', 'SCCO', 'RIO', 'BHP', 'VALE', 'GOLD', 'NEM', 'AEM', 'KGC', 'MTA', 'MP',
  ];
  
  return eligibleSymbols.includes(upperSymbol);
}

/**
 * Prometheus için OSINT Eligibility
 * 
 * @param symbol - Sembol
 * @returns boolean - Prometheus OSINT kullanmalı mı?
 */
export function getPrometheusOsintEligibility(): {
  retailPulse: boolean;
  githubPulse: boolean;
  sikayetvar: boolean;
  teias: boolean;
} {
  // Prometheus için OSINT kullanımı sınırlı
  // Makro trend ve emtia verileri için API entegrasyonu gerekebilir
  return {
    retailPulse: false,
    githubPulse: false,
    sikayetvar: false,
    teias: false,
  };
}

export default {
  prometheusOyu,
  prometheusGorus,
  isPrometheusEligible,
  getPrometheusOsintEligibility,
};
