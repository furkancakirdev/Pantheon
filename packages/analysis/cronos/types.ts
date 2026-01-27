/**
 * Cronos Module Types - Timing & Cycle Analysis (Agora)
 *
 * Zamanlama faktörü modülü için tip tanımları.
 * Agora mimarisine uygun Result ve Opinion tipleri.
 */

// ============ TEMEL VERİ TİPLERİ ============

/**
 * Zamanlama Tipi
 */
export type TimingType = 'UYGUN' | 'NOTR' | 'UYGUNSUZ';

/**
 * Zamanlama tavsiyesi
 */
export type TimingRecommendation = 'BUY' | 'SELL' | 'WAIT' | 'HOLD';

/**
 * Cronos Faktörü
 */
export interface CronosFactor {
  /** Faktör adı */
  name: string;
  /** Skor (0-100) */
  score: number;
  /** Ağırlık (%) */
  weight: number;
  /** Açıklama */
  description: string;
}

/**
 * Karar Tipi
 */
export type Verdict = 'GÜÇLÜ POZİTİF' | 'POZİTİF' | 'NÖTR' | 'NEGATİF' | 'GÜÇLÜ NEGATİF';

// ============ ANALİZ SONUCU ============

/**
 * Cronos Analiz Sonucu (Agora)
 */
export interface CronosResult {
  /** Tarih */
  date: Date;
  /** Zamanlama skoru (0-100) */
  score: number;
  /** Harf notu */
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Karar */
  verdict: Verdict;
  /** Zamanlama */
  timing: TimingType;
  /** Tavsiye */
  recommendation: TimingRecommendation;
  /** Faktörler */
  factors: CronosFactor[];
  /** En iyi faktör */
  bestFactor: CronosFactor;
  /** En kötü faktör */
  worstFactor: CronosFactor;
  /** Detaylar */
  details: string[];
  /** Özet */
  summary: string;
  /** Analiz tarihi */
  timestamp: Date;
}

/**
 * Agora modül opiniyonuna dönüşüm
 */
export interface CronosOpinion {
  /** Modül */
  module: 'cronos';
  /** Duruş */
  stance: 'CLAIM' | 'SUPPORT' | 'OBJECT' | 'ABSTAIN';
  /** Tercih edilen aksiyon */
  preferredAction: 'buy' | 'sell' | 'hold';
  /** Güç (0-1) */
  strength: number;
  /** Skor (0-100) */
  score: number;
  /** Güven (0-1) */
  confidence: number;
  /** Kanıtlar */
  evidence: string[];
}

/**
 * Zaman Analizi Detayı
 */
export interface TimingDetail {
  /** Kategori */
  category: string;
  /** Mevcut durum */
  current: string;
  /** Skor */
  score: number;
  /** Ağırlık */
  weight: number;
  /** Açıklama */
  description: string;
}

/**
 * Piyasa Saati Bilgisi
 */
export interface MarketHourInfo {
  /** Piyasa açık mı? */
  isOpen: boolean;
  /** Saat */
  hour: number;
  /** Gün */
  day: number;
  /** Hafta içi mi? */
  isWeekday: boolean;
  /** İşlem saati mi? */
  isTradingHour: boolean;
  /** Mevcut session */
  session: 'PRE_MARKET' | 'MORNING' | 'LUNCH' | 'AFTERNOON' | 'CLOSING' | 'CLOSED';
}

// ============ HARF NOTLARI ============

/**
 * Skora göre harf notu hesapla
 */
export function getLetterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

/**
 * Skora göre karar ver
 */
export function getVerdict(score: number): Verdict {
  if (score >= 75) return 'GÜÇLÜ POZİTİF';
  if (score >= 60) return 'POZİTİF';
  if (score >= 45) return 'NÖTR';
  if (score >= 30) return 'NEGATİF';
  return 'GÜÇLÜ NEGATİF';
}

/**
 * Kararı Action'a çevir
 */
export function verdictToAction(verdict: Verdict): 'buy' | 'sell' | 'hold' {
  if (verdict === 'GÜÇLÜ POZİTİF' || verdict === 'POZİTİF') return 'buy';
  if (verdict === 'GÜÇLÜ NEGATİF' || verdict === 'NEGATİF') return 'sell';
  return 'hold';
}

/**
 * Skora göre zamanlama tipi
 */
export function getTimingType(score: number): TimingType {
  if (score >= 65) return 'UYGUN';
  if (score >= 45) return 'NÖTR';
  return 'UYGUNSUZ';
}

/**
 * Skoru Opinion'a dönüştür
 */
export function scoreToOpinion(
  date: Date,
  score: number,
  factors: CronosFactor[]
): CronosOpinion {
  const quality = 0.60; // Cronos güvenilirliği

  // Stance belirle
  let stance: CronosOpinion['stance'];
  if (score >= 70) {
    stance = 'SUPPORT';
  } else if (score >= 55) {
    stance = 'ABSTAIN';
  } else if (score >= 40) {
    stance = 'OBJECT';
  } else {
    stance = 'OBJECT'; // Daha güçlü objeksiyon
  }

  // Kanıtlar
  const evidence: string[] = [
    `Zamanlama Skoru: ${score}/100`,
    `Tarih: ${date.toLocaleDateString('tr-TR')}`,
    `Saat: ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
  ];

  // Top 3 faktör
  const sortedFactors = [...factors].sort((a, b) => b.score - a.score).slice(0, 3);
  for (const factor of sortedFactors) {
    evidence.push(`${factor.name}: ${factor.description}`);
  }

  return {
    module: 'cronos',
    stance,
    preferredAction: verdictToAction(getVerdict(score)),
    strength: Math.abs(score - 50) / 50 * quality,
    score,
    confidence: quality,
    evidence,
  };
}

/**
 * Özet oluştur
 */
export function generateSummary(
  timing: TimingType,
  bestFactor: CronosFactor,
  worstFactor: CronosFactor
): string {
  const parts: string[] = [];

  if (timing === 'UYGUN') {
    parts.push('Zamanlama uygun. İşlem yapılabilir.');
  } else if (timing === 'NÖTR') {
    parts.push('Zamanlama nötr. Dikkatli olun.');
  } else {
    parts.push('Zamanlama uygun değil. Beklemek önerilir.');
  }

  parts.push(`En olumlu: ${bestFactor.name}.`);
  parts.push(`Dikkat: ${worstFactor.name}.`);

  return parts.join(' ');
}

/**
 * Piyasa saati bilgisini getir
 */
export function getMarketHourInfo(date: Date): MarketHourInfo {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const day = date.getDay();
  const time = hour + minute / 60;
  const isWeekday = day >= 1 && day <= 5;

  let isOpen = false;
  let isTradingHour = false;
  let session: MarketHourInfo['session'] = 'CLOSED';

  if (isWeekday) {
    if (time >= 10 && time < 12) {
      isOpen = true;
      isTradingHour = true;
      session = 'MORNING';
    } else if (time >= 14 && time < 17.5) {
      isOpen = true;
      isTradingHour = true;
      session = 'AFTERNOON';
    } else if (time >= 9.5 && time < 10) {
      isOpen = true;
      isTradingHour = false; // Pre-market volatilitesi
      session = 'PRE_MARKET';
    } else if (time >= 17 && time < 17.5) {
      isOpen = true;
      isTradingHour = false; // Kapanış
      session = 'CLOSING';
    }
  }

  return {
    isOpen,
    hour,
    day,
    isWeekday,
    isTradingHour,
    session,
  };
}

// ============ EXPORTS ============

export default {
  TimingType,
  TimingRecommendation,
  CronosFactor,
  Verdict,
  CronosResult,
  CronosOpinion,
  TimingDetail,
  MarketHourInfo,
  getLetterGrade,
  getVerdict,
  verdictToAction,
  getTimingType,
  scoreToOpinion,
  generateSummary,
  getMarketHourInfo,
};
