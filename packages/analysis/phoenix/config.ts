/**
 * Phoenix Module Configuration - Strategy & Signal Scanning
 *
 * Phoenix modülü konfigürasyon sabitleri ve ayarları.
 * Strateji ve sinyal tarama için parametreler.
 */

// ============ SKORLAMA AYARLARI ============

/**
 * Skor ağırlıkları
 */
export const SCORING_WEIGHTS = {
  crossSignals: 0.35,    // Golden/Death Cross ağırlığı
  smaCross: 0.25,        // SMA Crossover ağırlığı
  momentum: 0.20,        // MACD, RSI momentum ağırlığı
  volume: 0.10,          // Hacim spike ağırlığı
  formation: 0.10,       // Formasyon tespiti ağırlığı
} as const;

/**
 * Sinyal güçleri (1-10)
 */
export const SIGNAL_STRENGTH = {
  GOLDEN_CROSS: 10,      // Golden Cross
  DEATH_CROSS: 10,       // Death Cross
  SMA_CROSS: 7,          // SMA Crossover
  MACD_CROSS: 6,         // MACD Crossover
  RSI_OVERSOLD: 5,       // RSI Aşırı Satım
  RSI_OVERBOUGHT: 5,     // RSI Aşırı Alım
  VOLUME_SPIKE: 4,       // Hacim Spike
  FORMASYON: 3,          // Formasyon
} as const;

/**
 * Sinyal cezaları (bearish sinyaller için)
 */
export const SIGNAL_PENALTY = {
  DEATH_CROSS: 10,       // Death Cross cezası
  BEARISH_SMA: 7,        // Bearish SMA cezası
  BEARISH_MACD: 6,       // Bearish MACD cezası
  RSI_OVERBOUGHT: 5,     // RSI aşırı alım cezası
} as const;

// ============ SKOR ESİKLERİ ============

/**
 * Skor threshold'ları
 */
export const SCORE_THRESHOLDS = {
  EXCELLENT: 80,         // Mükemmel sinyal kombinasyonu
  GOOD: 65,              // İyi sinyal kombinasyonu
  FAIR: 50,              // Orta sinyal kombinasyonu
  POOR: 35,              // Zayıf sinyal kombinasyonu
} as const;

/**
 * Mod bazlı skor threshold'ları
 */
export const MODE_SCORE_THRESHOLDS = {
  SAVER: 70,             // Saver mod minimum skor
  BALANCED: 60,          // Balanced mod minimum skor
  AGGRESSIVE: 50,        // Aggressive mod minimum skor
} as const;

// = Information QUALITY ============

/**
 * Information Quality Weight (Phoenix)
 * Sinyal tabanlı strateji, orta-düşük güvenilirlik
 */
export const INFORMATION_QUALITY = 0.75;

// ============ TARAMA PARAMETRELERİ ============

/**
 * Mod bazlı filtre parametreleri
 */
export const MODE_FILTERS = {
  SAVER: {
    minPrice: 10,         // Minimum fiyat
    maxChange: 5,         // Maksimum değişim %
    minChange: 0,         // Minimum değişim %
    shortlistLimit: 5,    // Shortlist limiti
  },
  BALANCED: {
    minPrice: 5,          // Minimum fiyat
    maxChange: 10,        // Maksimum değişim %
    minChange: 0.5,       // Minimum değişim %
    shortlistLimit: 10,   // Shortlist limiti
  },
  AGGRESSIVE: {
    minPrice: 2,          // Minimum fiyat
    maxChange: 100,       // Maksimum değişim %
    minChange: 1,         // Minimum değişim %
    shortlistLimit: 20,   // Shortlist limiti
  },
} as const;

/**
 * Tarama limitleri
 */
export const SCAN_LIMITS = {
  MAX_UNIVERSE: 500,      // Maksimum evren boyutu
  MAX_SHORTLIST: 50,      // Maksimum shortlist
  MAX_CANDIDATES: 20,     // Maksimum aday
} as const;

// ============ TEKNİK İNDİKATÖR PARAMETRELERİ ============

/**
 * SMA periyotları
 */
export const SMA_PERIODS = {
  SHORT: 20,
  MEDIUM: 50,
  LONG: 200,
} as const;

/**
 * MACD parametreleri
 */
export const MACD_PARAMS = {
  FAST: 12,
  SLOW: 26,
  SIGNAL: 9,
} as const;

/**
 * RSI parametreleri
 */
export const RSI_PARAMS = {
  PERIOD: 14,
  OVERSOLD: 30,
  OVERBOUGHT: 70,
} as const;

/**
 * Hacim parametreleri
 */
export const VOLUME_PARAMS = {
  SPIKE_RATIO: 2.0,      // 2x ortalama
  SPIKE_PERIOD: 20,      // 20 günlük ortalama
} as const;

// ============ PORTFÖY İZLEME PARAMETRELERİ ============

/**
 * Portföy tavsiyesi threshold'ları
 */
export const PORTFOLIO_THRESHOLDS = {
  TAKE_PROFIT_PNL: 15,   // Kar realizasyonu % eşiği
  STOP_LOSS_PNL: -10,    // Stop loss % eşiği
  ADD_POSITION_PNL: -5,  // Pozisyon ekleme % eşiği
  BEARISH_SIGNALS_COUNT: 2, // Satış için ayı sinyali sayısı
  BULLISH_SIGNALS_COUNT: 3, // Alım için boğa sinyali sayısı
} as const;

/**
 * Risk seviyeleri
 */
export const RISK_LEVELS = {
  HIGH_BEARISH_COUNT: 2,  // Yüksek risk için ayı sinyali sayısı
  LOW_BULLISH_COUNT: 3,   // Düşük risk için boğa sinyali sayısı
} as const;

// ============ SİNYAL TİPLERİ ============

/**
 * Sinyal tipleri
 */
export const SIGNAL_TYPES = {
  GOLDEN_CROSS: 'GOLDEN_CROSS',
  DEATH_CROSS: 'DEATH_CROSS',
  SMA_CROSS: 'SMA_CROSS',
  MACD_CROSS: 'MACD_CROSS',
  RSI_OVERSOLD: 'RSI_OVERSOLD',
  RSI_OVERBOUGHT: 'RSI_OVERBOUGHT',
  VOLUME_SPIKE: 'VOLUME_SPIKE',
  FORMASYON: 'FORMASYON',
} as const;

/**
 * Boğa sinyalleri
 */
export const BULLISH_SIGNALS = [
  SIGNAL_TYPES.GOLDEN_CROSS,
  SIGNAL_TYPES.SMA_CROSS,
  SIGNAL_TYPES.MACD_CROSS,
  SIGNAL_TYPES.RSI_OVERSOLD,
  SIGNAL_TYPES.VOLUME_SPIKE,
] as const;

/**
 * Ayı sinyalleri
 */
export const BEARISH_SIGNALS = [
  SIGNAL_TYPES.DEATH_CROSS,
  SIGNAL_TYPES.RSI_OVERBOUGHT,
] as const;

// ============ TAVSİYE TİPLERİ ============

/**
 * Portföy tavsiye tipleri
 */
export const RECOMMENDATION_TYPES = {
  HOLD: 'TUT',
  BUY: 'AL',
  SELL: 'SAT',
  TAKE_PROFIT: 'KAR_AL',
  ADD_POSITION: 'EKLE',
} as const;

// ============ CACHE AYARLARI ============

/**
 * Cache TTL (milisaniye)
 */
export const CACHE_TTL = {
  SIGNALS: 5 * 60 * 1000,        // 5 dakika
  SCAN_RESULTS: 10 * 60 * 1000,  // 10 dakika
  PORTFOLIO: 2 * 60 * 1000,      // 2 dakika
} as const;

// ============ EXPORTS ============

export default {
  SCORING_WEIGHTS,
  SIGNAL_STRENGTH,
  SIGNAL_PENALTY,
  SCORE_THRESHOLDS,
  MODE_SCORE_THRESHOLDS,
  INFORMATION_QUALITY,
  MODE_FILTERS,
  SCAN_LIMITS,
  SMA_PERIODS,
  MACD_PARAMS,
  RSI_PARAMS,
  VOLUME_PARAMS,
  PORTFOLIO_THRESHOLDS,
  RISK_LEVELS,
  SIGNAL_TYPES,
  BULLISH_SIGNALS,
  BEARISH_SIGNALS,
  RECOMMENDATION_TYPES,
  CACHE_TTL,
};
