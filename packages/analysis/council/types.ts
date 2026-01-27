/**
 * Agora Council Types - Pantheon Trading OS
 *
 * Argus Terminal Decision Engine mimarisine dayalı yeni tip yapısı.
 *
 * Council Akışı:
 * Modül Skorları (0-100) → ModuleOpinion → Claimant Selection → Debate → Consensus → AgoraTrace → Final Decision
 */

// ============ TEMEL TİPLER ============

/**
 * Sinyal Aksiyon Tipi
 */
export type SignalAction = 'buy' | 'sell' | 'hold';

/**
 * Varlık Tipi
 */
export type AssetType = 'stock' | 'ETF' | 'commodity' | 'crypto' | 'fund' | 'forex';

/**
 * Modül Etiketi
 */
export type EngineTag =
  | 'atlas'
  | 'orion'
  | 'athena'
  | 'hermes'
  | 'aether'
  | 'phoenix'
  | 'cronos'
  | 'chiron'
  | 'demeter'
  | 'poseidon'
  | 'prometheus';

/**
 * Aday Kaynağı
 */
export type CandidateSource = 'WATCHLIST' | 'SCOUT' | 'HERMES' | 'MANUAL' | 'BACKTEST';

/**
 * Agora Duruşu (Stance)
 */
export type AgoraStance = 'CLAIM' | 'SUPPORT' | 'OBJECT' | 'ABSTAIN';

/**
 * Kalite Kapısı (Quality Gate)
 */
export type QualityTier = 'BANKO' | 'STANDART' | 'SPEKÜLATİF' | 'RED';

// ============ MODÜL GÖRÜŞÜ ============

/**
 * Modül Görüşü
 *
 * Her modül Council'de görüş bildirirken bu yapıyı kullanır.
 */
export interface ModuleOpinion {
  /** Modül adı */
  module: EngineTag;
  /** Duruş - Konseydeki rolü */
  stance: AgoraStance;
  /** Tercih edilen aksiyon */
  preferredAction: SignalAction;
  /** Güç (Conviction) - 0-1 arası normalize edilmiş */
  strength: number;
  /** Ham Skor - 0-100 arası */
  score: number;
  /** Güven seviyesi - 0-1 arası (Bilgi kalite ağırlığı) */
  confidence: number;
  /** Kanıtlar - Gerekçeler listesi */
  evidence: string[];
}

/**
 * Modül Görüşü Oluşturucu
 */
export function createModuleOpinion(
  module: EngineTag,
  score: number,
  informationQuality: number
): ModuleOpinion {
  // Skordan aksiyon belirle
  let preferredAction: SignalAction = 'hold';
  if (score >= 55) {
    preferredAction = 'buy';
  } else if (score <= 45) {
    preferredAction = 'sell';
  }

  // Strength hesapla (50 merkez, 0 veya 100 maksimum)
  const rawStrength = Math.abs(score - 50) / 50;

  return {
    module,
    stance: 'ABSTAIN', // Council tarafından belirlenecek
    preferredAction,
    strength: rawStrength * informationQuality,
    score,
    confidence: informationQuality,
    evidence: [`${module} skoru: ${Math.round(score)}`],
  };
}

// ============ BİLGİ KALİTESİ AĞIRLIKLARI ============

/**
 * Bilgi Kalite Ağırlıkları
 *
 * Her modülün veri kalitesine göre ağırlığı.
 * Atlas en güvenilir, Hermes en gürültülü.
 */
export const INFORMATION_QUALITY: Record<EngineTag, number> = {
  atlas: 1.0,      // Temel veri en güvenilir
  aether: 0.95,    // Makro veri stabil
  athena: 0.90,    // Faktör modeli araştırılmış
  orion: 0.85,     // Teknik güvenilir ama gürültülü
  demeter: 0.80,   // Sektör analizi orta güvenilir
  phoenix: 0.75,   // Reversion sinyalleri
  prometheus: 0.70, // Second-order thinking
  cronos: 0.60,    // Timing spekülatif
  poseidon: 0.65,  // Varlık dağılımı
  chiron: 0.85,    // Risk analizi güvenilir
  hermes: 0.50,    // Haber çok gürültülü
};

// ============ CONSENSUS ============

/**
 * Konsensus Parametreleri
 */
export interface ConsensusParams {
  /** Toplam Claim gücü */
  totalClaimStrength: number;
  /** Toplam Objection gücü */
  totalObjectionStrength: number;
  /** Net Skor */
  netScore: number;
  /** Görüşme metni */
  deliberationText: string;
}

/**
 * Agora Tartışması
 */
export interface AgoraDebate {
  /** Talep sahibi (Claimant) - En güçlü görüş */
  claimant: ModuleOpinion | null;
  /** Tüm görüşler */
  opinions: ModuleOpinion[];
  /** Konsensus parametreleri */
  consensusParams: ConsensusParams;
}

// ============ VERİ SAĞLIĞI ============

/**
 * Veri Sağlık Anlık Görüntüsü
 */
export interface DataHealthSnapshot {
  /** Tazelik skoru - 0-100 */
  freshnessScore: number;
  /** Eksik modüller */
  missingModules: string[];
  /** Kabul edilebilir mi? */
  isAcceptable: boolean;
}

/**
 * Hesaplanan sağlık skoru
 */
export function calculateHealthScore(snapshot: DataHealthSnapshot): number {
  // Eksik modül başına ceza
  const penalty = snapshot.missingModules.length * 10;
  return Math.max(0, snapshot.freshnessScore - penalty);
}

// ============ RİSK DEĞERLENDİRMESİ ============

/**
 * Risk Kapısı Sonucu
 */
export interface RiskGateResult {
  /** Onaylandı mı? */
  isApproved: boolean;
  /** Risk bütçesi - Örn: 2.5 (portföyün %2.5'i) */
  riskBudgetR: number;
  /** Delta R - Bu işlem ekler - Örn: +0.5R */
  deltaR: number;
  /** Maksimum R */
  maxR: number;
  /** Gerekçe */
  reason: string;
}

// ============ İCRA PLANI ============

/**
 * Phoenix Rehberliği
 */
export interface PhoenixGuidance {
  /** Fiyat bandı */
  priceBand: string;
  /** Önerilen giriş */
  recommendedEntry: string;
  /** Güven */
  confidence: number;
}

/**
 * Risk Planı
 */
export interface RiskPlan {
  /** Stop loss */
  stopLoss: number | null;
  /** Take profit */
  takeProfit: number | null;
  /** Maksimum drawdown */
  maxDrawdown: number | null;
}

/**
 * İcra Planı
 */
export interface ExecutionPlan {
  /** Hedef aksiyon */
  targetAction: SignalAction;
  /** Hedef boyut - Örn: 0.5R (portföyün %0.5'i) */
  targetSizeR: number;
  /** Giriş rehberliği */
  entryGuidance: PhoenixGuidance | null;
  /** Risk planı */
  riskPlan: RiskPlan;
  /** Geçerlilik penceresi (saniye) */
  validityWindow: number;
}

// ============ FİNAL KARAR ============

/**
 * Agora Kararı
 */
export interface AgoraDecision {
  /** Aksiyon */
  action: SignalAction;
  /** Miktar */
  quantity: number;
  /** İcra planı */
  executionPlan: ExecutionPlan | null;
  /** Gerekçe */
  rationale: string;
  /** İcra stratejisi */
  executionStrategy: string;
}

// ============ AGORA TRACE ============

/**
 * Agora Trace
 *
 * Bir kararın tam yaşam döngüsü kaydı.
 */
export interface AgoraTrace {
  /** Benzersiz ID */
  id: string;
  /** Zaman damgası */
  timestamp: Date;
  /** Sembol */
  symbol: string;
  /** Kaynak */
  candidateSource: CandidateSource;
  /** Veri sağlığı */
  dataHealth: DataHealthSnapshot;
  /** Tartışma */
  debate: AgoraDebate;
  /** Risk değerlendirmesi */
  riskEvaluation: RiskGateResult;
  /** Final karar */
  finalDecision: AgoraDecision;
  /** Veri kaynağı kullanımı */
  dataSourceUsage: Record<string, string>;
  /** Kullanılmayan faktörler */
  unusedFactors: string[];
}

/**
 * Boş Agora Trace oluştur
 */
export function createEmptyAgoraTrace(symbol: string): AgoraTrace {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date(),
    symbol,
    candidateSource: 'MANUAL',
    dataHealth: {
      freshnessScore: 0,
      missingModules: [],
      isAcceptable: false,
    },
    debate: {
      claimant: null,
      opinions: [],
      consensusParams: {
        totalClaimStrength: 0,
        totalObjectionStrength: 0,
        netScore: 50,
        deliberationText: 'Veri yetersiz',
      },
    },
    riskEvaluation: {
      isApproved: false,
      riskBudgetR: 0,
      deltaR: 0,
      maxR: 0,
      reason: 'İşlem yok',
    },
    finalDecision: {
      action: 'hold',
      quantity: 0,
      executionPlan: null,
      rationale: 'Veri yetersiz',
      executionStrategy: 'NONE',
    },
    dataSourceUsage: {},
    unusedFactors: [],
  };
}

// ============ TIERED RESOLUTION ============

/**
 * Tiered Resolution Sonucu
 */
export interface TieredResult {
  /** Tier */
  tier: QualityTier;
  /** Pozisyon boyutu (R bazlı) */
  positionSize: number;
  /** Onaylandı mı? */
  isApproved: boolean;
  /** Açıklama */
  explanation: string;
}

/**
 * Tiered Resolution Hesapla
 *
 * Kalite ve skora göre pozisyon boyutu belirler.
 */
export function calculateTier(
  score: number,
  isBuy: boolean,
  quality: number
): TieredResult {
  // Normalleştir - satış için skoru ters çevir
  const normalizedScore = isBuy ? score : 100 - score;

  // Kalite kapıları
  if (quality < 0.4) {
    return {
      tier: 'RED',
      positionSize: 0,
      isApproved: false,
      explanation: `Düşük veri kalitesi: %${Math.round(quality * 100)}`,
    };
  }

  const maxTier = quality >= 0.8 ? 1 : quality >= 0.5 ? 2 : 3;

  if (normalizedScore >= 85) {
    if (maxTier <= 1) {
      return { tier: 'BANKO', positionSize: 1.0, isApproved: true, explanation: 'Banko' };
    }
    return { tier: 'STANDART', positionSize: 0.5, isApproved: true, explanation: 'Banko → Standart (Veri kalitesi düşük)' };
  }

  if (normalizedScore >= 70) {
    if (maxTier <= 2) {
      return { tier: 'STANDART', positionSize: 0.5, isApproved: true, explanation: 'Standart' };
    }
    return { tier: 'SPEKÜLATİF', positionSize: 0.25, isApproved: true, explanation: 'Standart → Spekülatif (Veri kalitesi düşük)' };
  }

  if (normalizedScore >= 60) {
    return { tier: 'SPEKÜLATİF', positionSize: 0.25, isApproved: true, explanation: 'Spekülatif' };
  }

  return { tier: 'RED', positionSize: 0, isApproved: false, explanation: `Yetersiz güç (Skor: ${Math.round(score)})` };
}

// ============ CHURN GUARD ============

/**
 * Churn Guard Sonucu
 */
export interface ChurnGuardResult {
  /** Bloklandı mı? */
  isBlocked: boolean;
  /** Tetiklenen kural */
  ruleTriggered: string | null;
  /** Kalan süre (saniye) */
  lockoutRemaining: number;
  /** Orijinal karar */
  originalDecision: SignalAction;
}

/**
 * Churn Guard Nedenleri
 */
export type ChurnReason =
  | 'MANUAL_OVERRIDE'
  | 'COOLDOWN_PULSE'
  | 'COOLDOWN_CORSE'
  | 'MIN_HOLD'
  | 'HYSTERESIS'
  | 'IDEMPOTENCY'
  | 'RISK_EXPOSURE';

/**
 * Churn Guard Konfigürasyonu
 */
export interface ChurnGuardConfig {
  /** Manuel override süresi */
  manualOverrideDuration: number;
  /** Cooldown (Pulse modu) */
  cooldownPulse: number;
  /** Cooldown (Corse modu) */
  cooldownCorse: number;
  /** Minimum hold (Corse modu) */
  minHoldCorse: number;
  /** Re-entry eşiği */
  reEntryThreshold: number;
  /** Re-entry penceresi */
  reEntryWindow: number;
}

/**
 * Varsayılan Churn Guard konfigürasyonu
 */
export const DEFAULT_CHURN_CONFIG: ChurnGuardConfig = {
  manualOverrideDuration: 86400, // 24 saat
  cooldownPulse: 300,            // 5 dakika
  cooldownCorse: 2700,           // 45 dakika
  minHoldCorse: 7200,            // 2 saat
  reEntryThreshold: 75,          // 75 puan
  reEntryWindow: 900,            // 15 dakika
};

// ============ COUNCIL SONUÇLARI ============

/**
 * Council Karar Sonucu
 *
 * Grand Council'den çıkan nihai sonuç.
 */
export interface CouncilResult {
  /** Sembol */
  symbol: string;
  /** Varlık tipi */
  assetType: AssetType;
  /** Final aksiyon */
  finalAction: SignalAction;
  /** Konsensus skoru - 0-100 */
  consensusScore: number;
  /** Tier */
  tier: QualityTier;
  /** Pozisyon boyutu (R bazlı) */
  positionSize: number;
  /** Modül görüşleri */
  moduleOpinions: ModuleOpinion[];
  /** Modül ağırlıkları */
  moduleWeights: Record<string, number>;
  /** Gerekçe */
  rationale: string;
  /** Özet */
  summary: string;
  /** Veri sağlığı */
  dataHealth: DataHealthSnapshot;
  /** Risk sonucu */
  riskResult: RiskGateResult | null;
  /** Churn Guard sonucu */
  churnResult: ChurnGuardResult | null;
  /** Zaman damgası */
  timestamp: Date;
}

// ============ LEGACY SUPPORT ============

/**
 * Legacy Modül Oyu (Eski sistemle uyumluluk için)
 */
export interface LegacyModulOyu {
  modul: string;
  oy: 'AL' | 'SAT' | 'BEKLE';
  guven: number;
  aciklama: string;
  icon: string;
}

/**
 * SignalAction → Legacy Oy dönüşümü
 */
export function signalActionToLegacyOy(action: SignalAction): 'AL' | 'SAT' | 'BEKLE' {
  switch (action) {
    case 'buy': return 'AL';
    case 'sell': return 'SAT';
    case 'hold': return 'BEKLE';
  }
}

/**
 * Legacy Oy → SignalAction dönüşümü
 */
export function legacyOyToSignalAction(oy: 'AL' | 'SAT' | 'BEKLE'): SignalAction {
  switch (oy) {
    case 'AL': return 'buy';
    case 'SAT': return 'sell';
    case 'BEKLE': return 'hold';
  }
}

/**
 * EngineTag → Türkçe isim
 */
export function engineTagToTurkish(tag: EngineTag): string {
  const names: Record<EngineTag, string> = {
    atlas: 'Atlas (Temel Analiz)',
    orion: 'Orion (Teknik Analiz)',
    athena: 'Athena (Faktör Zekası)',
    hermes: 'Hermes (Sosyal Sentiment)',
    aether: 'Aether (Makro Ekonomi)',
    phoenix: 'Phoenix (Strateji Motoru)',
    cronos: 'Cronos (Zamanlama)',
    chiron: 'Chiron (Risk Yönetimi)',
    demeter: 'Demeter (Sektör Rotasyonu)',
    poseidon: 'Poseidon (Varlık Dağılımı)',
    prometheus: 'Prometheus (İkinci Derece Düşünme)',
  };
  return names[tag];
}

/**
 * EngineTag → Lucide İkon
 */
export function engineTagToIcon(tag: EngineTag): string {
  const icons: Record<EngineTag, string> = {
    atlas: 'BarChart3',
    orion: 'TrendingUp',
    athena: 'Brain',
    hermes: 'MessageCircle',
    aether: 'Globe2',
    phoenix: 'Zap',
    cronos: 'Clock',
    chiron: 'Shield',
    demeter: 'Leaf',
    poseidon: 'Coins',
    prometheus: 'Network',
  };
  return icons[tag];
}

export default {
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
};
