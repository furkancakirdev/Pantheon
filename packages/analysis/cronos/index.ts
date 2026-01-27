/**
 * Cronos - Timing & Cycle Analysis Modülü
 *
 * Ana Modül Export'ları (Agora Mimarisi)
 *
 * Zamanlama faktörü motoru.
 */

// ============ AGORA ENGINE ============

// Engine
export { CronosEngine, cronosEngine } from './engine';

// Convenience functions
export {
  analyzeTiming,
  getCronosOpinion,
} from './engine';

// Agora Types
export type {
  TimingType,
  TimingRecommendation,
  CronosFactor,
  Verdict,
  CronosResult,
  CronosOpinion,
  TimingDetail,
  MarketHourInfo,
} from './types';

// Helpers
export {
  getLetterGrade,
  getVerdict,
  verdictToAction,
  getTimingType,
  scoreToOpinion,
  generateSummary,
  getMarketHourInfo,
} from './types';

// ============ CONFIG ============

export {
  FACTOR_WEIGHTS,
  HOUR_SCORES,
  DAY_SCORES,
  MONTH_END_SCORES,
  EARNINGS_SCORES,
  SCORE_THRESHOLDS,
  GRADE_THRESHOLDS,
  INFORMATION_QUALITY,
  OPTIMAL_HOURS,
  MARKET_HOURS,
  LUNCH_HOURS,
  BIST_HOURS,
  EARNINGS_MONTHS,
  QUARTER_END_MONTHS,
  HOLIDAYS,
  YEAR_END_PERIOD,
  TIMING_VERDICTS,
  TIMING_RECOMMENDATIONS,
  CACHE_TTL,
} from './config';

// ============ DEFAULT ============

export { default } from './engine';
