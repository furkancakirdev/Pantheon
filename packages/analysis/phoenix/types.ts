/**
 * Phoenix Module Types - Strategy & Signal Scanning (Agora)
 *
 * Strateji ve sinyal tarama modülü için tip tanımları.
 * Agora mimarisine uygun Result ve Opinion tipleri.
 */

// ============ TEMEL VERİ TİPLERİ ============

/**
 * Sinyal Tipi
 */
export type PhoenixSignalType =
  | 'GOLDEN_CROSS'      // Golden Death Cross (SMA50 > SMA200)
  | 'DEATH_CROSS'       // Death Cross (SMA50 < SMA200)
  | 'SMA_CROSS'         // SMA Crossover
  | 'MACD_CROSS'        // MACD Crossover
  | 'RSI_OVERSOLD'      // RSI Aşırı Satım
  | 'RSI_OVERBOUGHT'    // RSI Aşırı Alım
  | 'VOLUME_SPIKE'      // Hacim Spike
  | 'FORMASYON';        // Mum Formasyonu

/**
 * Sinyal Yönü
 */
export type SignalDirection = 'bullish' | 'bearish' | 'neutral';

/**
 * Phoenix Sinyali
 */
export interface PhoenixSignal {
  /** Sinyal tipi */
  type: PhoenixSignalType;
  /** Güç (1-10) */
  strength: number;
  /** Açıklama */
  description: string;
  /** Boğa/Ayı */
  bullish: boolean;
  /** Sinyal tarihi */
  timestamp?: Date;
}

/**
 * Fiyat Seviyesi
 */
export interface PriceLevel {
  /** Seviye tipi */
  type: 'support' | 'resistance';
  /** Fiyat seviyesi */
  price: number;
  /** Güç (0-100) */
  strength: number;
  /** Test sayısı */
  tests?: number;
}

/**
 * Risk Seviyesi
 */
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

/**
 * Karar Tipi
 */
export type Verdict = 'GÜÇLÜ POZİTİF' | 'POZİTİF' | 'NÖTR' | 'NEGATİF' | 'GÜÇLÜ NEGATİF';

/**
 * Tarama Modu
 */
export type PhoenixMode = 'SAVER' | 'BALANCED' | 'AGGRESSIVE';

/**
 * Portföy Tavsiyesi
 */
export type Recommendation = 'HOLD' | 'BUY' | 'SELL' | 'TAKE_PROFIT' | 'ADD_POSITION';

// ============ ANALİZ SONUCU ============

/**
 * Phoenix Analiz Sonucu (Agora)
 */
export interface PhoenixResult {
  /** Sembol */
  symbol: string;
  /** Sinyal skoru (0-100) */
  score: number;
  /** Harf notu */
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Karar */
  verdict: Verdict;
  /** Tespit edilen sinyaller */
  signals: PhoenixSignal[];
  /** Destek/Direnç seviyeleri */
  levels: PriceLevel[];
  /** Risk seviyesi */
  riskLevel: RiskLevel;
  /** Güçlü boğa sinyalleri */
  bullishSignals: PhoenixSignal[];
  /** Güçlü ayı sinyalleri */
  bearishSignals: PhoenixSignal[];
  /** Fiyat */
  currentPrice: number;
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
export interface PhoenixOpinion {
  /** Modül */
  module: 'phoenix';
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
 * Tarama Sonucu
 */
export interface PhoenixScanResult {
  /** Aday hisseler */
  candidates: PhoenixCandidate[];
  /** Rapor */
  report: PhoenixReport;
}

/**
 * Phoenix Adayı
 */
export interface PhoenixCandidate {
  /** Sembol */
  symbol: string;
  /** Son fiyat */
  lastPrice: number;
  /** Skor */
  score: number;
  /** Gerekçe */
  reason: string;
  /** Sinyaller */
  signals: PhoenixSignal[];
  /** Risk seviyesi */
  riskLevel: RiskLevel;
}

/**
 * Tarama Raporu
 */
export interface PhoenixReport {
  /** Mod */
  mode: PhoenixMode;
  /** Taranan sayı */
  scanned: number;
  /** Filtrelenen sayı */
  filtered: number;
  /** Shortlist sayısı */
  shortlisted: number;
  /** Doğrulan sayı */
  verified: number;
  /** Tarih */
  timestamp: string;
}

/**
 * Portföy İzleme Sonucu
 */
export interface PortfolioMonitorResult {
  /** Sembol */
  symbol: string;
  /** Güncel fiyat */
  currentPrice: number;
  /** Kar/Zarar */
  pnl: number;
  /** Kar/Zarar % */
  pnlPercent: number;
  /** Sinyaller */
  signals: PhoenixSignal[];
  /** Tavsiye */
  recommendation: Recommendation;
}

// ============ OHLCV CANDLE ============

/**
 * OHLCV Mum Verisi
 */
export interface Candle {
  /** Tarih */
  date: Date;
  /** Açılış */
  open: number;
  /** Yüksek */
  high: number;
  /** Düşük */
  low: number;
  /** Kapanış */
  close: number;
  /** Hacim */
  volume: number;
}

// ============ HARF NOTLARI ============

/**
 * Skora göre harf notu hesapla
 */
export function getLetterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  return 'F';
}

/**
 * Skora göre karar ver
 */
export function getVerdict(score: number): Verdict {
  if (score >= 80) return 'GÜÇLÜ POZİTİF';
  if (score >= 65) return 'POZİTİF';
  if (score >= 50) return 'NÖTR';
  if (score >= 35) return 'NEGATİF';
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
 * Sinyal组合ına göre stance belirle
 */
export function getStanceFromSignals(
  bullishCount: number,
  bearishCount: number
): 'CLAIM' | 'SUPPORT' | 'OBJECT' | 'ABSTAIN' {
  if (bullishCount >= 3) return 'CLAIM';
  if (bullishCount >= 2) return 'SUPPORT';
  if (bearishCount >= 2) return 'OBJECT';
  return 'ABSTAIN';
}

/**
 * Risk seviyesini belirle
 */
export function getRiskLevel(
  bearishCount: number,
  bullishCount: number
): RiskLevel {
  if (bearishCount >= 2) return 'HIGH';
  if (bearishCount >= 1) return 'MEDIUM';
  if (bullishCount >= 3) return 'LOW';
  return 'MEDIUM';
}

/**
 * Skoru Opinion'a dönüştür
 */
export function scoreToOpinion(
  symbol: string,
  score: number,
  signals: PhoenixSignal[],
  riskLevel: RiskLevel
): PhoenixOpinion {
  const quality = 0.75; // Phoenix güvenilirliği

  // Güçlü sinyalleri say
  const bullishCount = signals.filter(s => s.bullish && s.strength >= 6).length;
  const bearishCount = signals.filter(s => !s.bullish && s.strength >= 6).length;

  // Stance belirle
  const stance = getStanceFromSignals(bullishCount, bearishCount);

  // Kanıtlar
  const evidence: string[] = [
    `Sinyal Skoru: ${score}/100`,
    `Boğa Sinyalleri: ${bullishCount}`,
    `Ayı Sinyalleri: ${bearishCount}`,
    `Risk Seviyesi: ${riskLevel}`,
  ];

  // Top 3 sinyal
  const topSignals = signals.slice(0, 3);
  for (const signal of topSignals) {
    evidence.push(`${signal.type}: ${signal.description}`);
  }

  return {
    module: 'phoenix',
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
  signals: PhoenixSignal[],
  score: number,
  riskLevel: RiskLevel
): string {
  const parts: string[] = [];

  if (signals.length === 0) {
    parts.push('Belirgin sinyal yok');
  } else {
    const bullishCount = signals.filter(s => s.bullish).length;
    const bearishCount = signals.filter(s => !s.bullish).length;

    if (bullishCount > 0) {
      parts.push(`${bullishCount} boğa sinyali`);
    }
    if (bearishCount > 0) {
      parts.push(`${bearishCount} ayı sinyali`);
    }
  }

  // Skor yorumu
  if (score >= 80) {
    parts.push('- Güçlü alım fırsatı');
  } else if (score >= 65) {
    parts.push('- İyi alım potansiyeli');
  } else if (score >= 50) {
    parts.push('- Nötr görünüm');
  } else if (score >= 35) {
    parts.push('- Satış baskısı');
  } else {
    parts.push('- Güçlü satış sinyali');
  }

  // Risk yorumu
  if (riskLevel === 'HIGH') {
    parts.push('(Yüksek Risk)');
  } else if (riskLevel === 'LOW') {
    parts.push('(Düşük Risk)');
  }

  return parts.join('. ');
}

// ============ EXPORTS ============

export default {
  PhoenixSignalType,
  SignalDirection,
  PhoenixSignal,
  PriceLevel,
  RiskLevel,
  Verdict,
  PhoenixMode,
  Recommendation,
  PhoenixResult,
  PhoenixOpinion,
  PhoenixScanResult,
  PhoenixCandidate,
  PhoenixReport,
  PortfolioMonitorResult,
  Candle,
  getLetterGrade,
  getVerdict,
  verdictToAction,
  getStanceFromSignals,
  getRiskLevel,
  scoreToOpinion,
  generateSummary,
};
