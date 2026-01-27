/**
 * Council Module - Exports
 * Grand Council ve tüm council modülleri için tek bir export noktasü
 *
 * Yeni Agora Mimarisi:
 * - types.ts: Agora tip tanımları
 * - decision-engine.ts: Yeni karar motoru
 * - grand-council.ts: Legacy council (geriye dönük uyumluluk)
 */

// ============ AGORA MIMARISİ (YENİ) ============
export type {
  SignalAction,
  AssetType,
  EngineTag,
  CandidateSource,
  AgoraStance,
  QualityTier,
  ModuleOpinion,
  ConsensusParams,
  AgoraDebate,
  DataHealthSnapshot,
  RiskGateResult,
  PhoenixGuidance,
  RiskPlan,
  ExecutionPlan,
  AgoraDecision,
  AgoraTrace,
  TieredResult,
  ChurnGuardResult,
  ChurnReason,
  ChurnGuardConfig,
  CouncilResult,
  LegacyModulOyu,
} from './types';

export {
  INFORMATION_QUALITY,
  createModuleOpinion,
  calculateHealthScore,
  createEmptyAgoraTrace,
  calculateTier,
  DEFAULT_CHURN_CONFIG,
  signalActionToLegacyOy,
  legacyOyToSignalAction,
  engineTagToTurkish,
  engineTagToIcon,
} from './types';

export type {
  DecisionEngineConfig,
  PortfolioContext,
  DecisionEngineInput,
  DecisionEngineOutput,
} from './decision-engine';

export {
  DEFAULT_DECISION_CONFIG,
  checkChurnGuard,
  buildOpinion,
  calculateConsensus,
  makeDecision,
} from './decision-engine';

// ============ LEGACY COUNCIL (ESKİ SİSTEM) ============
export type { OyTipi, ModulOyu, CouncilKarar, ArgusRapor, ModulGorus, CouncilEligibility } from './grand-council';
export {
    grandCouncil,
    argusRaporOlustur,
    argusRaporToText,
    atlasOyu,
    atlasGorus,
    wonderkidOyu,
    wonderkidGorus,
    orionOyu,
    orionGorus,
    athenaV2Oyu,
    athenaV2Gorus,
    athenaOyu,
    hermesOyu,
    hermesGorus,
    aetherOyu,
    aetherGorus,
    phoenixOyu,
    phoenixGorus,
    cronosOyu,
    cronosGorus,
    poseidonGorus,
    chironGorus,
    // OSINT Adaptörler (Yeni - Adım 1: Mantıksal Birleşme)
    retailPulseOyu,
    retailPulseGorus,
    githubPulseOyu,
    githubPulseGorus,
    sikayetvarOyu,
    sikayetvarGorus,
    teiasOyu,
    teiasGorus,
    // Dynamic Council Membership (Yeni)
    getOsintEligibility,
    collectOsintVotes,
    collectOsintGorusler,
} from './grand-council';

export { PerformanceTracker } from './performance-tracker';
export type { PiyasaRejimi, ModulPerformans, PerformansKaydi, AgirlikliOylama, TrackerDurumu } from './performance-tracker';
export { ConflictDetector } from './conflict-detector';
export {
  piyasaKosuluTespitEt,
  vixSeviyesi,
  baglamDuyarliOyla,
  contextAwareGrandCouncil,
  otomatikBaglamliOyla,
  modulAgirliklariniGoster,
  kosulAciklamasi
} from './context-aware-voting';
export type { PiyasaKosulu, ModulAgirlikProfili, BaglamDuyarliConfig, BaglamDuyarliOylamaSonuc } from './context-aware-voting';
