/**
 * Demeter - Sector Rotation Analysis Modülü
 *
 * Ana Modül Export'ları (Agora Mimarisi)
 *
 * Sektör rotasyonu motoru.
 */

// ============ AGORA ENGINE ============

// Engine
export { DemeterEngine, demeterEngine } from './engine';

// Convenience functions
export {
  analyzeSectorRotation,
  getDemeterOpinion,
  getMarketPhase,
  getSectorAllocation,
} from './engine';

// Agora Types
export type {
  SectorCode,
  SectorTrend,
  SectorPhase,
  MarketPhase,
  SectorData,
  SectorSignal,
  SectorRotation,
  PhaseAnalysis,
  DemeterResult,
  DemeterOpinion,
  SectorInfo,
  IndexData,
  Verdict,
} from './types';

// Helpers
export {
  getLetterGrade,
  getVerdict,
  verdictToAction,
  getTrend,
  scoreToOpinion,
  generateSummary,
  SECTORS,
  getSectorName,
} from './types';

// ============ CONFIG ============

export {
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
} from './config';

// ============ API CLIENT ============

export {
  fetchAllSectors,
  fetchSectorData,
  fetchSectorIndex,
  fetchAllIndices,
  fetchSectorStocks,
  calculateRelativeStrength,
  fetchAllSectorsCached,
  fetchAllIndicesCached,
  calculateRelativeStrengthCached,
  clearCache,
} from './api/client';

// ============ DEFAULT ============

export { default } from './engine';
