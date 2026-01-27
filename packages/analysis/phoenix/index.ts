/**
 * Phoenix - Strategy & Signal Scanning Modülü
 *
 * Ana Modül Export'ları (Agora Mimarisi)
 *
 * Strateji ve sinyal tarama motoru.
 * Golden/Death Cross, SMA Crossover, MACD, RSI, Hacim Spike tespiti.
 */

// ============ AGORA ENGINE ============

// Engine
export { PhoenixEngine, phoenixEngine } from './engine';

// Convenience functions
export {
  analyzeSignals,
  getPhoenixOpinion,
  quickScan,
} from './engine';

// Agora Types
export type {
  Candle,
  PhoenixSignal,
  PhoenixSignalType,
  SignalDirection,
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
} from './types';

// Helpers
export {
  getLetterGrade,
  getVerdict,
  verdictToAction,
  getStanceFromSignals,
  getRiskLevel,
  scoreToOpinion,
  generateSummary,
} from './types';

// ============ CONFIG ============

export {
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
} from './config';

// ============ API CLIENT ============

export {
  fetchCandles,
  fetchCandlesForSymbol,
  fetchCandlesCached,
} from './api/client';

// ============ DEFAULT ============

export { default } from './engine';
