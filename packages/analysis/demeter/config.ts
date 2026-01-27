/**
 * Demeter Module Configuration - Sector Rotation Analysis
 *
 * Sektör rotasyonu modülü konfigürasyonu.
 */

import type { SectorCode, SectorInfo } from './types';

// ============ BİLGİ KALİTESİ ============

/**
 * Demeter modülü güvenilirliği
 * Sektör analizi orta-yüksek güvenilirlikte
 */
export const INFORMATION_QUALITY = 0.80;

// ============ SEKTÖR AĞIRLIKLARI ============

/**
 * Sektör analiz ağırlıkları
 */
export const SECTOR_WEIGHTS = {
  /** Göreceli güç (RS, endeks performansı) */
  relativeStrength: 0.30,
  /** Momentum (trend gücü) */
  momentum: 0.25,
  /** Hacim akışı */
  volumeFlow: 0.20,
  /** Volatilite/Beta */
  volatility: 0.10,
  /** Değerleme (P/E, P/B) */
  valuation: 0.10,
  /** Makro uyumu */
  macroAlignment: 0.05,
} as const;

/**
 * Faz skoru ağırlıkları
 */
export const PHASE_SCORE_WEIGHTS = {
  /** Sektör trend uyumu */
  trendAlignment: 0.35,
  /** Faz performansı */
  phasePerformance: 0.30,
  /** Beta ayarı */
  betaAdjustment: 0.20,
  /** Göreceli güç */
  relativeStrength: 0.15,
} as const;

// ============ SKOR EŞİKLERİ ============

/**
 * Sektör skoru eşikleri
 */
export const SECTOR_SCORE_THRESHOLDS = {
  /** Çok güçlü (Overweight) */
  STRONG_BUY: 70,
  /** Güçlü (Overweight) */
  BUY: 60,
  /** Nötr (Equal weight) */
  HOLD: 45,
  /** Zayıf (Underweight) */
  SELL: 35,
  /** Çok zayıf (Underweight) */
  STRONG_SELL: 0,
} as const;

/**
 * Rotasyon sinyal eşikleri
 */
export const ROTATION_THRESHOLDS = {
  /** Minimum momentum farkı */
  minMomentumGap: 20,
  /** Minimum RS farkı */
  minRelativeStrengthGap: 10,
  /** Minimum hacim artışı */
  minVolumeIncrease: 1.5, // %50
  /** RSI aşırı bölge */
  rsiOverbought: 70,
  /** RSA aşırı satım */
  rsiOversold: 30,
} as const;

/**
 * Faz belirleme eşikleri
 */
export const PHASE_THRESHOLDS = {
  /** Risk-On skoru eşiği */
  riskOnThreshold: 60,
  /** Risk-Off skoru eşiği */
  riskOffThreshold: 40,
  /** Defansif oran eşiği */
  defensiveRatio: 0.4,
} as const;

// ============ SEKTÖR FAZ TANIMLARI ============

/**
 * Döngü fazına göre sektör ağırlıkları
 */
export const CYCLE_PHASE_ALLOCATION = {
  /** Erken döngü - Banka, tüketici, otomotiv */
  EARLY_CYCLE: {
    sectors: ['BANK', 'TEKN', 'OTOM', 'MANA', 'TAAS'] as SectorCode[],
    description: 'Erken döngü: Faiz düşüşü, ekonomik toparlanma',
  },
  /** Orta döngü - Sınai, teknoloji, holding */
  MID_CYCLE: {
    sectors: ['SINA', 'TEKN', 'HOCA', 'CHEM', 'INSR'] as SectorCode[],
    description: 'Orta döngü: İstikrarlı büyüme',
  },
  /** Geç döngü - Enerji, madencilik, gayrimenkul */
  LATE_CYCLE: {
    sectors: ['ENRG', 'META', 'REAL', 'SINA'] as SectorCode[],
    description: 'Geç döngü: Enflasyon baskısı, talep zirvesi',
  },
  /** Resesyon - Defansif sektöler */
  RECESSION: {
    sectors: ['GYNA', 'ELEC', 'ILCS', 'INSR'] as SectorCode[],
    description: 'Resesyon: Defansif kaçış',
  },
  /** İyileşme - Tüketici, perakende */
  RECOVERY: {
    sectors: ['MANA', 'GYNA', 'BANK', 'TAAS'] as SectorCode[],
    description: 'İyileşme: Talep canlanması',
  },
} as const;

// ============ MACRO REGIME AYARLARI ============

/**
 * Makro rejime göre sektörel rotasyon
 */
export const MACRO_REGIME_ROTATION = {
  /** Risk-On (Düşük faiz, güçlü büyüme) */
  RISK_ON: {
    favored: ['BANK', 'SINA', 'TEKN', 'META', 'REAL'] as SectorCode[],
    avoided: ['GYNA', 'ELEC', 'INSR'] as SectorCode[],
    description: 'Risk iştahı yüksek. Beta yüksek sektörlere yönelim.',
  },
  /** Risk-Off (Yüksek belirsizlik) */
  RISK_OFF: {
    favored: ['GYNA', 'ELEC', 'ILCS', 'INSR'] as SectorCode[],
    avoided: ['META', 'ENRG', 'REAL', 'OTOM'] as SectorCode[],
    description: 'Risk kaçışı. Defansif sektörlere yönelim.',
  },
  /** Geçiş (Belirsizlik) */
  TRANSITION: {
    favored: ['HOCA', 'CHEM', 'TEXT', 'MANA'] as SectorCode[],
    avoided: [] as SectorCode[],
    description: 'Faz değişikliği. Dengeli portföy.',
  },
} as const;

// ============ GÖRECELİ GÜÇ AYARLARI ============

/**
 * Endeks bazlı göreceli güç hesaplama
 */
export const RELATIVE_STRENGTH_CONFIG = {
  /** RS hesaplama periyodu (gün) */
  period: 60,
  /** RS smooting periyodu */
  smoothing: 5,
  /** Güçlü sinyal eşiği */
  strongSignal: 105,
  /** Zayıf sinyal eşiği */
  weakSignal: 95,
} as const;

// ============ MOMENTUM AYARLARI ============

/**
 * Sektör momentum hesaplama
 */
export const MOMENTUM_CONFIG = {
  /** Kısa periyot (gün) */
  shortPeriod: 20,
  /** Orta periyot (gün) */
  mediumPeriod: 60,
  /** Uzun periyot (gün) */
  longPeriod: 120,
  /** Ağırlıklar */
  weights: {
    short: 0.5,
    medium: 0.3,
    long: 0.2,
  },
} as const;

// ============ VOLATILITE/BETA AYARLARI ============

/**
 * Beta bazlı volatilite ayarlaması
 */
export const BETA_CONFIG = {
  /** Piyasa beta referansı */
  marketBeta: 1.0,
  /** Yüksek beta eşiği */
  highBeta: 1.3,
  /** Düşük beta eşiği */
  lowBeta: 0.7,
  /** Risk-off beta çarpanı */
  riskOffMultiplier: 0.5,
  /** Risk-on beta çarpanı */
  riskOnMultiplier: 1.2,
} as const;

// ============ DEĞERLEME AYARLARI ============

/**
 * Sektör değerleme aralıkları
 */
export const VALUATION_RANGES = {
  BANK: { pe: [5, 12], pb: [0.8, 1.5] },
  SINA: { pe: [8, 20], pb: [1.0, 2.5] },
  TEKN: { pe: [15, 40], pb: [2.0, 6.0] },
  GYNA: { pe: [15, 35], pb: [2.0, 5.0] },
  MANA: { pe: [20, 50], pb: [3.0, 8.0] },
  ELEC: { pe: [8, 25], pb: [1.5, 4.0] },
  ENRG: { pe: [6, 15], pb: [0.8, 2.0] },
  META: { pe: [8, 20], pb: [1.0, 3.0] },
  HOCA: { pe: [5, 15], pb: [0.8, 1.8] },
  ILCS: { pe: [10, 25], pb: [1.5, 4.0] },
  TAAS: { pe: [8, 20], pb: [1.2, 3.0] },
  INSR: { pe: [10, 25], pb: [1.5, 3.5] },
  REAL: { pe: [6, 18], pb: [0.8, 2.0] },
  TEXT: { pe: [8, 18], pb: [1.0, 2.5] },
  CHEM: { pe: [10, 25], pb: [1.5, 3.5] },
  OTOM: { pe: [6, 15], pb: [0.8, 2.0] },
} as const;

// ============ SİNYAL GÜÇLERİ ============

/**
 * Rotasyon sinyali güçleri
 */
export const SIGNAL_STRENGTH = {
  /** Faz değişikliği */
  PHASE_CHANGE: 10,
  /** Göreceli güç突破 */
  RS_BREAKOUT: 8,
  /** Hacim spike */
  VOLUME_SPIKE: 7,
  /** Momentum reversal */
  MOMENTUM_REVERSAL: 6,
  /** Trend değişikliği */
  TREND_CHANGE: 5,
  /** Değerleme uyarısı */
  VALUATION_ALERT: 3,
} as const;

// ============ PORTFÖY AĞIRLIK SINIRLARI ============

/**
 * Sektör ağırlık sınırları
 */
export const SECTOR_WEIGHT_LIMITS = {
  /** Maksimum tek sektör ağırlığı */
  maxSectorWeight: 0.30, // %30
  /** Minimum sektör ağırlığı */
  minSectorWeight: 0.05, // %5
  /** Maksimum defansif oran (risk-off'ta) */
  maxDefensiveRatio: 0.60, // %60
  /** Maksimum siklikal oran (risk-on'da) */
  maxCyclicalRatio: 0.80, // %80
} as const;

// ============ BIST SEKTÖR ENDEKSLERİ ============

/**
 * BIST sektör endeksleri ve sembolleri
 */
export const BIST_SECTOR_INDICES = {
  BANK: 'XUBNK',
  SINA: 'XUSIN',
  TEKN: 'XUTEK',
  GYNA: 'XUGDM',
  MANA: 'XUMAG',
  ELEC: 'XUELK',
  ENRG: 'XUENJ',
  META: 'XUMAD',
  HOCA: 'XUHLD',
  ILCS: 'XUHIZ',
  TAAS: 'XUTAS',
  INSR: 'XUSIG',
  REAL: 'XUGYO',
  TEXT: 'XUTEX',
  CHEM: 'XUKIM',
  OTOM: 'XUOTO',
} as const;

// ============ CACHE AYARLARI ============

/**
 * Cache TTL (milisaniye)
 */
export const CACHE_TTL = {
  /** Sektör verileri (15 dakika) */
  SECTOR_DATA: 15 * 60 * 1000,
  /** Rotasyon analizi (30 dakika) */
  ROTATION: 30 * 60 * 1000,
  /** Faz analizi (1 saat) */
  PHASE: 60 * 60 * 1000,
  /** Endeks verileri (5 dakika) */
  INDEX_DATA: 5 * 60 * 1000,
} as const;

// ============ EXPORTS ============

export default {
  INFORMATION_QUALITY,
  SECTOR_WEIGHTS,
  PHASE_SCORE_WEIGHTS,
  SECTOR_SCORE_THRESHOLDS,
  ROTATION_THRESHOLDS,
  PHASE_THRESHOLDS,
  CYCLE_PHASE_ALLOCATION,
  MACRO_REGIME_ROTATION,
  RELATIVE_STRENGTH_CONFIG,
  MOMENTUM_CONFIG,
  BETA_CONFIG,
  VALUATION_RANGES,
  SIGNAL_STRENGTH,
  SECTOR_WEIGHT_LIMITS,
  BIST_SECTOR_INDICES,
  CACHE_TTL,
};
