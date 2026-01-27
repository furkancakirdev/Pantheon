/**
 * Poseidon - Asset Allocation Analysis Modülü
 *
 * Ana Modül Export'ları (Agora Mimarisi)
 *
 * Varlık dağılımı motoru.
 */

// ============ AGORA ENGINE ============

// Engine
export { PoseidonEngine, poseidonEngine } from './engine';

// Convenience functions
export {
  analyzeAssetAllocation,
  getPoseidonOpinion,
  getRegime,
  getTargetAllocation,
} from './engine';

// Agora Types
export type {
  AssetClass,
  AssetType,
  RiskProfile,
  AssetAllocation,
  AssetData,
  RegimeStatus,
  RiskBudget,
  PortfolioMetrics,
  AssetRotationSignal,
  PoseidonResult,
  PoseidonOpinion,
  Verdict,
  PoseidonWeights,
} from './types';

// Helpers
export {
  getLetterGrade,
  getVerdict,
  verdictToAction,
  scoreToOpinion,
  generateSummary,
  getAssetClassName,
} from './types';

// ============ CONFIG ============

export {
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
} from './config';

// ============ API CLIENT ============

export {
  fetchAllAssetClasses,
  fetchAssetData,
  fetchRegimeStatus,
  fetchMarketPrices,
  fetchInterestRates,
  fetchInflationData,
  fetchAllAssetClassesCached,
  fetchRegimeStatusCached,
  fetchMarketPricesCached,
  clearCache,
} from './api/client';

// ============ DEFAULT ============

export { default } from './engine';
