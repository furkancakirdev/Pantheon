/**
 * Poseidon Module Configuration - Asset Allocation Analysis
 *
 * Varlık dağılımı modülü konfigürasyonu.
 */

import type { AssetClass, AssetType, RiskProfile, PoseidonWeights } from './types';

// ============ BİLGİ KALİTESİ ============

/**
 * Poseidon modülü güvenilirliği
 * Varlık dağılımı yüksek güvenilirlikte
 */
export const INFORMATION_QUALITY = 0.85;

// ============ RISK PROFİLİ DAĞILIMLARI ============

/**
 * Risk profiline göre stratejik varlık dağılımı
 */
export const STRATEGIC_ALLOCATIONS: Record<RiskProfile, {
  equity: number;
  fixedIncome: number;
  cash: number;
  gold: number;
  commodity: number;
  crypto: number;
  realEstate: number;
  international: number;
  description: string;
}> = {
  CONSERVATIVE: {
    equity: 20,
    fixedIncome: 50,
    cash: 15,
    gold: 10,
    commodity: 0,
    crypto: 0,
    realEstate: 5,
    international: 0,
    description: 'Muhafazakar: Sermaye koruma öncelikli. Tahvil ağırlıklı.',
  },
  MODERATE: {
    equity: 35,
    fixedIncome: 40,
    cash: 10,
    gold: 10,
    commodity: 0,
    crypto: 0,
    realEstate: 5,
    international: 0,
    description: 'Ilımlı: Dengeli getiri-risk profili.',
  },
  BALANCED: {
    equity: 50,
    fixedIncome: 30,
    cash: 5,
    gold: 10,
    commodity: 0,
    crypto: 0,
    realEstate: 5,
    international: 0,
    description: 'Dengeli: Büyüme ve stabilite dengesi.',
  },
  GROWTH: {
    equity: 65,
    fixedIncome: 20,
    cash: 5,
    gold: 5,
    commodity: 0,
    crypto: 0,
    realEstate: 5,
    international: 0,
    description: 'Büyüme: Hisse ağırlıklı büyüme odaklı.',
  },
  AGGRESSIVE: {
    equity: 75,
    fixedIncome: 10,
    cash: 5,
    gold: 0,
    commodity: 5,
    crypto: 5,
    realEstate: 0,
    international: 0,
    description: 'Agresif: Maksimum büyüme, yüksek volatilite kabulü.',
  },
} as const;

// ============ REJİM TABANLI TACTICAL ALLOCATIONS ============

/**
 * Makro rejime göre taktiksel dağılım ayarları
 */
export const REGIME_ADJUSTMENTS: Record<string, {
  equity: number;
  fixedIncome: number;
  gold: number;
  cash: number;
  description: string;
}> = {
  BULL: {
    equity: 10,    // Hisse artır
    fixedIncome: -10,
    gold: -5,
    cash: 5,
    description: 'Boğa piyasası: Hisse ağırlığını artır, tahvilı azalt.',
  },
  BEAR: {
    equity: -20,   // Hisse azalt
    fixedIncome: 10,
    gold: 5,
    cash: 5,
    description: 'Ayı piyasası: Defansif pozisyon, nakit artır.',
  },
  NEUTRAL: {
    equity: 0,
    fixedIncome: 0,
    gold: 0,
    cash: 0,
    description: 'Nötr piyasası: Dengeli dağılım.',
  },
  STAGFLATION: {
    equity: -15,
    fixedIncome: -5,
    gold: 15,     // Altın artır
    cash: 5,
    description: 'Stagflasyon: Altın ve emtia koruması.',
  },
} as const;

// ============ VARLIK SINIFI ÖZELLİKLERİ ============

/**
 * Varlık sınıfı beklenen getirileri
 */
export const ASSET_EXPECTED_RETURNS: Record<AssetClass, {
  baseReturn: number;
  volatility: number;
  sharpe: number;
  correlation: number;
}> = {
  EQUITY: {
    baseReturn: 10,
    volatility: 18,
    sharpe: 0.45,
    correlation: 1.0,
  },
  FIXED_INCOME: {
    baseReturn: 5,
    volatility: 6,
    sharpe: 0.50,
    correlation: 0.3,
  },
  CASH: {
    baseReturn: 3,
    volatility: 1,
    sharpe: 0.00,
    correlation: 0.0,
  },
  GOLD: {
    baseReturn: 6,
    volatility: 15,
    sharpe: 0.25,
    correlation: -0.1,
  },
  COMMODITY: {
    baseReturn: 4,
    volatility: 20,
    sharpe: 0.10,
    correlation: 0.2,
  },
  CRYPTO: {
    baseReturn: 25,
    volatility: 80,
    sharpe: 0.30,
    correlation: 0.1,
  },
  REAL_ESTATE: {
    baseReturn: 7,
    volatility: 12,
    sharpe: 0.40,
    correlation: 0.6,
  },
  INTERNATIONAL: {
    baseReturn: 8,
    volatility: 16,
    sharpe: 0.35,
    correlation: 0.7,
  },
} as const;

// ============ RISK BÜTÇESİ AYARLARI ============

/**
 * Risk profiline göre risk bütçesi
 */
export const RISK_BUDGETS: Record<RiskProfile, {
  totalRisk: number;
  maxEquityRisk: number;
  maxFixedIncomeRisk: number;
  maxAlternativesRisk: number;
}> = {
  CONSERVATIVE: {
    totalRisk: 8,
    maxEquityRisk: 6,
    maxFixedIncomeRisk: 4,
    maxAlternativesRisk: 3,
  },
  MODERATE: {
    totalRisk: 10,
    maxEquityRisk: 8,
    maxFixedIncomeRisk: 5,
    maxAlternativesRisk: 4,
  },
  BALANCED: {
    totalRisk: 12,
    maxEquityRisk: 10,
    maxFixedIncomeRisk: 6,
    maxAlternativesRisk: 5,
  },
  GROWTH: {
    totalRisk: 15,
    maxEquityRisk: 13,
    maxFixedIncomeRisk: 7,
    maxAlternativesRisk: 6,
  },
  AGGRESSIVE: {
    totalRisk: 20,
    maxEquityRisk: 18,
    maxFixedIncomeRisk: 8,
    maxAlternativesRisk: 10,
  },
} as const;

// ============ VARLIK TİPİNE GÖRE MODÜL AĞIRLIKLARI ============

/**
 * Varlık tipine göre Poseidon ağırlıkları
 */
export const ASSET_TYPE_WEIGHTS: Record<AssetType, PoseidonWeights> = {
  HISSE: {
    atlas: 25,
    orion: 25,
    aether: 20,
    hermes: 10,
    cronos: 10,
    athena: 10,
    demeter: 0,
  },
  ETF: {
    atlas: 0,
    orion: 40,
    aether: 30,
    hermes: 10,
    cronos: 10,
    athena: 10,
    demeter: 0,
  },
  EMTIA: {
    atlas: 0,
    orion: 35,
    aether: 40,
    hermes: 5,
    cronos: 15,
    athena: 5,
    demeter: 0,
  },
  KRIPTO: {
    atlas: 0,
    orion: 35,
    aether: 25,
    hermes: 20,
    cronos: 10,
    athena: 10,
    demeter: 0,
  },
  FON: {
    atlas: 0,
    orion: 25,
    aether: 35,
    hermes: 5,
    cronos: 10,
    athena: 25,
    demeter: 0,
  },
  TAHVIL: {
    atlas: 0,
    orion: 20,
    aether: 50,
    hermes: 5,
    cronos: 5,
    athena: 20,
    demeter: 0,
  },
  NAKIT: {
    atlas: 0,
    orion: 0,
    aether: 80,
    hermes: 0,
    cronos: 0,
    athena: 20,
    demeter: 0,
  },
  ALTIN: {
    atlas: 0,
    orion: 30,
    aether: 50,
    hermes: 10,
    cronos: 10,
    athena: 0,
    demeter: 0,
  },
} as const;

// ============ TACTICAL AYARLAR ============

/**
 * Taktiksel dağılım limitleri
 */
export const TACTICAL_LIMITS = {
  /** Maksimum taktiksel sapma (+/-) */
  maxDeviation: 10, // %10
  /** Minimum ağırlık */
  minWeight: 0,
  /** Maksimum ağırlık */
  maxWeight: 100,
  /** Minimum nakit oranı */
  minCash: 5, // %5
} as const;

// ============ REBALANCE AYARLARI ============

/**
 * Rebalance tetikleyicileri
 */
export const REBALANCE_THRESHOLDS = {
  /** Hedeften sapma eşiği (%) */
  targetDeviation: 5, // %5
  /** Zaman bazlı rebalance (gün) */
  timeBased: 90, // 90 gün
  /** Piyasa değişim eşiği */
  marketChange: 15, // %15
} as const;

// ============ SIGNAL THRESHOLDS ============

/**
 * Rotasyon sinyal eşikleri
 */
export const ROTATION_THRESHOLDS = {
  /** Min ağırlık değişikliği */
  minWeightChange: 5, // %5
  /** Min rejim değişiklik skoru */
  minRegimeChange: 30,
  /** Min momentum farkı */
  minMomentumGap: 20,
} as const;

// ============ CACHE AYARLARI ============

/**
 * Cache TTL (milisaniye)
 */
export const CACHE_TTL = {
  /** Varlık verileri (15 dakika) */
  ASSET_DATA: 15 * 60 * 1000,
  /** Dağılım analizi (30 dakika) */
  ALLOCATION: 30 * 60 * 1000,
  /** Rejim durumu (1 saat) */
  REGIME: 60 * 60 * 1000,
  /** Risk bütçesi (1 saat) */
  RISK_BUDGET: 60 * 60 * 1000,
} as const;

// ============ PORTFÖY METRİK AYARLARI ============

/**
 * VaR (Value at Risk) hesaplama
 */
export const VAR_CONFIG = {
  /** Güven seviyesi */
  confidence: 0.95,
  /** Zaman ufkusu (gün) */
  horizon: 10,
} as const;

/**
 * Drawdown limitleri
 */
export const DRAWDOWN_LIMITS = {
  /** Maksimum kabul edilebilir drawdown */
  maxDrawdown: 0.25, // %25
  /** Uyarı seviyesi */
  warningLevel: 0.15, // %15
} as const;

// ============ EXPORTS ============

export default {
  INFORMATION_QUALITY,
  STRATEGIC_ALLOCATIONS,
  REGIME_ADJUSTMENTS,
  ASSET_EXPECTED_RETURNS,
  RISK_BUDGETS,
  ASSET_TYPE_WEIGHTS,
  TACTICAL_LIMITS,
  REBALANCE_THRESHOLDS,
  ROTATION_THRESHOLDS,
  CACHE_TTL,
  VAR_CONFIG,
  DRAWDOWN_LIMITS,
};
