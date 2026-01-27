/**
 * Agora Decision Engine - Pantheon Trading OS
 *
 * Argus Terminal DecisionEngine mimarisine dayalı yeni karar motoru.
 *
 * Akış:
 * 1. Veri Sağlık Kontrolü (Data Health Gate)
 * 2. Modül Görüşlerini Topla
 * 3. Claimant Selection (En güçlü görüşü seç)
 * 4. Debate (Destek ve itirazları topla)
 * 5. Consensus Calculation (Skoru hesapla)
 * 6. Tiered Resolution (Pozisyon boyutu belirle)
 * 7. Risk Gate (Risk kontrolü)
 * 8. Churn Guard (Aşırı işlem koruması)
 * 9. Final Decision (Nihai karar)
 */

import type {
  ModuleOpinion,
  SignalAction,
  AgoraDebate,
  AgoraStance,
  AgoraTrace,
  CouncilResult,
  DataHealthSnapshot,
  RiskGateResult,
  ExecutionPlan,
  RiskPlan,
  AgoraDecision,
  ConsensusParams,
  TieredResult,
  ChurnGuardResult,
  ChurnGuardConfig,
  EngineTag,
  AssetType,
  CandidateSource,
} from './types';
import {
  INFORMATION_QUALITY,
  createEmptyAgoraTrace,
  calculateTier,
  calculateHealthScore,
  DEFAULT_CHURN_CONFIG,
  engineTagToTurkish,
} from './types';

// ============ DECISION ENGINE CONFIG ============

/**
 * Decision Engine Konfigürasyonu
 */
export interface DecisionEngineConfig {
  /** Minimum veri kapsam oranı (%) */
  minDataCoverage: number;
  /** Minimum konsensus for güçlü sinyal (%) */
  minStrongConsensus: number;
  /** Zayıf itiraz eşiği (teknik veto için) */
  weakObjectionThreshold: number;
  /** Güçlü itiraz eşiği (teknik veto için) */
  strongObjectionThreshold: number;
  /** Churn Guard konfigürasyonu */
  churnConfig: ChurnGuardConfig;
}

/**
 * Varsayılan Decision Engine konfigürasyonu
 */
export const DEFAULT_DECISION_CONFIG: DecisionEngineConfig = {
  minDataCoverage: 60,
  minStrongConsensus: 55,
  weakObjectionThreshold: 40,
  strongObjectionThreshold: 60,
  churnConfig: DEFAULT_CHURN_CONFIG,
};

// ============ CHURN GUARD ============

/**
 * Portföy Bağlamı
 */
export interface PortfolioContext {
  /** Pozisyonda mı? */
  isInPosition: boolean;
  /** Son işlem zamanı */
  lastTradeTime: Date | null;
  /** Son aksiyon */
  lastAction: SignalAction | null;
  /** Son manuel işlem zamanı */
  lastManualActionTime: Date | null;
  /** Son manuel işlem tipi */
  lastManualActionType: SignalAction | null;
}

/**
 * Churn Guard Kontrolü
 *
 * Aşırı işlem yapmayı engeller.
 */
export function checkChurnGuard(
  proposedAction: SignalAction,
  score: number,
  context: PortfolioContext,
  config: ChurnGuardConfig = DEFAULT_CHURN_CONFIG
): ChurnGuardResult {
  const now = Date.now();
  const toSeconds = (ms: number) => Math.floor(ms / 1000);

  // 1. Manuel Override Check (İnsan Veto'su)
  // Kullanıcı manuel satış yaptıysa, hemen alım yapma
  if (proposedAction === 'buy') {
    if (context.lastManualActionTime && context.lastManualActionType === 'sell') {
      const age = now - context.lastManualActionTime.getTime();
      if (age < config.manualOverrideDuration * 1000) {
        // Exception: Çok yüksek skorsa izin ver
        if (score < 85) {
          return {
            isBlocked: true,
            ruleTriggered: `Manuel Override (${Math.round((config.manualOverrideDuration * 1000 - age) / 1000)}s kaldı)`,
            lockoutRemaining: Math.round((config.manualOverrideDuration * 1000 - age) / 1000),
            originalDecision: proposedAction,
          };
        }
      }
    }
  }

  // 2. Cooldown & MinHold (Zaman tabanlı korumalar)
  if (context.lastTradeTime) {
    const age = now - context.lastTradeTime.getTime();

    // A. Cooldown (Flip-Flop koruması)
    const cooldown = context.isInPosition ? config.cooldownCorse : config.cooldownPulse;
    if (age < cooldown * 1000) {
      // Aynı aksiyon mu yoksa ters mi?
      const isFlip = context.lastAction !== proposedAction && proposedAction !== 'hold';
      if (isFlip) {
        return {
          isBlocked: true,
          ruleTriggered: context.isInPosition ? 'Cooldown (Corse 45m)' : 'Cooldown (Pulse 5m)',
          lockoutRemaining: Math.round((cooldown * 1000 - age) / 1000),
          originalDecision: proposedAction,
        };
      }
    }

    // B. MinHold (Sadece Corse - Zayıf el koruması)
    if (context.isInPosition && proposedAction === 'sell') {
      if (age < config.minHoldCorse * 1000) {
        return {
          isBlocked: true,
          ruleTriggered: 'Min Hold (Corse 2s)',
          lockoutRemaining: Math.round((config.minHoldCorse * 1000 - age) / 1000),
          originalDecision: proposedAction,
        };
      }
    }
  }

  // 3. Hysteresis (Fiyat/Skor hafızası)
  // Çıkılan pozisyona tekrar girmek için daha yüksek eşiş gerekir
  if (!context.isInPosition && proposedAction === 'buy') {
    if (context.lastAction === 'sell' && context.lastTradeTime) {
      const age = now - context.lastTradeTime.getTime();
      if (age < config.reEntryWindow * 1000) {
        if (score < config.reEntryThreshold) {
          return {
            isBlocked: true,
            ruleTriggered: `Hysteresis (Skor ${score} < ${config.reEntryThreshold})`,
            lockoutRemaining: 0,
            originalDecision: proposedAction,
          };
        }
      }
    }
  }

  return {
    isBlocked: false,
    ruleTriggered: null,
    lockoutRemaining: 0,
    originalDecision: proposedAction,
  };
}

// ============ OPINION BUILDER ============

/**
 * Modül Görüşü Oluştur
 *
 * Ham skor ve bilgi kalitesinden ModuleOpinion oluşturur.
 */
export function buildOpinion(
  module: EngineTag,
  score: number | null,
  role: string
): ModuleOpinion {
  if (score === null) {
    return {
      module,
      stance: 'ABSTAIN',
      preferredAction: 'hold',
      strength: 0,
      score: 0,
      confidence: 0,
      evidence: ['Veri Yok'],
    };
  }

  const quality = INFORMATION_QUALITY[module];

  // Aksiyon belirle (daha sıkı eşikler)
  let action: SignalAction = 'hold';
  let evidenceTrace = '';

  if (score >= 55) {
    action = 'buy';
    evidenceTrace = score >= 75 ? 'GÜÇLÜ ALIM' : 'ALIM';
  } else if (score <= 45) {
    action = 'sell';
    evidenceTrace = score <= 25 ? 'GÜÇLÜ SATIŞ' : 'SATIŞ';
  } else {
    action = 'hold';
    evidenceTrace = 'NÖTR';
  }

  // Strength hesapla (50 merkez)
  const rawStrength = Math.abs(score - 50) / 50;
  const adjustedStrength = rawStrength * quality;

  return {
    module,
    stance: 'ABSTAIN', // Council tarafından belirlenecek
    preferredAction: action,
    strength: adjustedStrength,
    score,
    confidence: quality,
    evidence: [`${module} skoru: ${Math.round(score)} (${evidenceTrace}) [Q:%${Math.round(quality * 100)}]`],
  };
}

// ============ CONSENSUS CALCULATION ============

/**
 * Görüşme Metni Oluştur
 */
function generateConsensusText(
  claimant: ModuleOpinion,
  supporters: ModuleOpinion[],
  objectors: ModuleOpinion[],
  result: string
): string {
  let text = '';

  // 1. Sonuç başlığı
  if (result.includes('REDDEDİLDİ')) {
    text += `⛔️ ${result}\n\n`;
  } else {
    text += `✅ ${result}\n\n`;
  }

  // 2. Talep sahibi açıklaması
  const moduleNames: Record<EngineTag, string> = {
    atlas: 'Atlas',
    orion: 'Orion',
    athena: 'Athena',
    hermes: 'Hermes',
    aether: 'Aether',
    phoenix: 'Phoenix',
    cronos: 'Cronos',
    chiron: 'Chiron',
    demeter: 'Demeter',
    poseidon: 'Poseidon',
    prometheus: 'Prometheus',
  };

  switch (claimant.module) {
    case 'orion':
      text += 'Orion teknik göstergelerde belirgin bir yükseliş trendi tespit etti. ';
      break;
    case 'atlas':
      text += 'Atlas, şirketin temel verilerini ve değerlemesini son derece cazip buldu. ';
      break;
    case 'phoenix':
      text += 'Phoenix yapay zeka senaryoları yukarı yönlü bir hareket öngörüyor. ';
      break;
    case 'hermes':
      text += 'Hermes, hisse ile ilgili kritik derecede olumlu bir haber akışı yakaladı. ';
      break;
    case 'athena':
      text += 'Athena, faktör analizlerinde güçlü sinyaller görüyor. ';
      break;
    case 'aether':
      text += 'Aether, makro ekonomik koşulların hisse için uygun olduğunu belirtiyor. ';
      break;
    case 'prometheus':
      text += 'Prometheus, ikinci derece düşünce analiziyle fırsat tespit etti. ';
      break;
    default:
      text += `${moduleNames[claimant.module]} alım fırsatı görüyor. `;
  }

  // 3. Destekçiler
  if (supporters.length > 0) {
    const names = supporters.map((o) => moduleNames[o.module]).join(', ');
    text += `Bu analiz ${names} tarafından da teyit edildi.`;
  }

  // 4. İtirazçılar (Riskler)
  if (objectors.length > 0) {
    text += '\n\n⚠️ Risk Notları: ';
    for (const obj of objectors) {
      const reason = obj.evidence[0] || 'Belirsiz risk';
      text += `${moduleNames[obj.module]} bu karara şerh düştü: ${reason}. `;
    }
  }

  return text;
}

/**
 * Konsensus Hesapla
 *
 * Tüm görüşleri toplayarak nihai skoru hesaplar.
 */
export function calculateConsensus(
  opinions: ModuleOpinion[],
  config: DecisionEngineConfig = DEFAULT_DECISION_CONFIG
): {
  debate: AgoraDebate;
  consensusScore: number;
  finalAction: SignalAction;
  rationale: string;
  tier: TieredResult;
} {
  // 1. Claimant Seçimi (En güçlü görüş)
  const candidates = opinions.filter((o) => o.preferredAction !== 'hold');

  const claimant =
    candidates.length > 0
      ? candidates.reduce((prev, current) =>
          Math.abs(current.score - 50) > Math.abs(prev.score - 50) ? current : prev
        )
      : null;

  if (!claimant) {
    return {
      debate: {
        claimant: null,
        opinions,
        consensusParams: {
          totalClaimStrength: 0,
          totalObjectionStrength: 0,
          netScore: 50,
          deliberationText: 'Konsey sessiz (Yetersiz sinyal)',
        },
      },
      consensusScore: 50,
      finalAction: 'hold',
      rationale: 'Konsey sessiz - Yetersiz sinyal',
      tier: { tier: 'RED', positionSize: 0, isApproved: false, explanation: 'Yetersiz sinyal' },
    };
  }

  // 2. Claimant'ı güncelle
  claimant.stance = 'CLAIM';
  const claimAction = claimant.preferredAction;

  const finalOpinions: ModuleOpinion[] = [claimant];

  // 3. Tartışma (Destek ve İtiraz)
  let supportPower = 0;
  let objectionPower = 0;

  for (const op of opinions) {
    if (op.module === claimant.module) continue;

    // Ağırlık uygula
    const weight = INFORMATION_QUALITY[op.module];
    const effectiveStrength = op.strength * weight;

    if (op.preferredAction === claimAction) {
      op.stance = 'SUPPORT';
      supportPower += effectiveStrength;
    } else if (op.preferredAction === 'hold') {
      op.stance = 'ABSTAIN';
    } else {
      op.stance = 'OBJECT';
      objectionPower += effectiveStrength;
    }

    finalOpinions.push(op);
  }

  // 4. Konsensus Hesaplama
  const leaderScore = claimant.score;
  const directionMultiplier = claimAction === 'buy' ? 1 : -1;

  // Impact faktörleri
  const supportImpact = supportPower * 10 * directionMultiplier;
  const objectionImpact = objectionPower * 25 * -directionMultiplier; // İtiraz daha ağır

  let finalScore = leaderScore + supportImpact + objectionImpact;
  finalScore = Math.min(100, Math.max(0, finalScore));

  // 5. Tiered Resolution
  const activeParticipants = finalOpinions.filter((o) => o.confidence > 0);
  const avgConfidence =
    activeParticipants.length > 0
      ? activeParticipants.reduce((sum, o) => sum + o.confidence, 0) / activeParticipants.length
      : 0;

  const healthScore = 80; // Varsayılan, data health'ten gelecek
  const consensusQuality = (healthScore / 100) * avgConfidence;

  const tier = calculateTier(finalScore, claimAction === 'buy', consensusQuality);

  // 6. Final Karar
  const supporters = finalOpinions.filter((o) => o.stance === 'SUPPORT');
  const objectors = finalOpinions.filter((o) => o.stance === 'OBJECT');

  let finalAction: SignalAction = 'hold';
  let rationale = '';
  let isApproved = false;

  if (tier.isApproved) {
    // Teknik Veto kontrolü
    const strongTechObjectors = objectors.filter(
      (o) => (o.module === 'orion' || o.module === 'phoenix') && o.strength * 100 > config.strongObjectionThreshold
    );

    if (strongTechObjectors.length > 0) {
      finalAction = 'hold';
      isApproved = false;
      const vetoers = strongTechObjectors.map((o) => `${o.module} (${Math.round(o.strength * 100)})`).join(' & ');
      rationale = generateConsensusText(claimant, supporters, objectors, `ALIM REDDEDİLDİ (Teknik Veto: ${vetoers})`);
    } else {
      finalAction = claimAction;
      isApproved = true;

      // Zayıf itirazlar boyutu düşürür
      let sizeReductionReason = '';
      let positionSize = tier.positionSize;

      const weakTechObjectors = objectors.filter(
        (o) =>
          (o.module === 'orion' || o.module === 'phoenix') &&
          o.strength * 100 <= config.strongObjectionThreshold &&
          o.strength * 100 > config.weakObjectionThreshold
      );

      if (weakTechObjectors.length > 0 && positionSize > 0.5) {
        positionSize = 0.5;
        sizeReductionReason = 'Zayıf Teknik İtiraz';
      }

      if (objectionPower >= 0.5 && positionSize > 0.5) {
        positionSize = 0.5;
        if (!sizeReductionReason) sizeReductionReason = 'Genel İtiraz';
      }

      rationale = generateConsensusText(claimant, supporters, objectors, `ALIM ONAYLANDI (${tier.tier})`);
    }
  } else {
    finalAction = 'hold';
    rationale = generateConsensusText(claimant, supporters, objectors, `ALIM REDDEDİLDİ (${tier.tier})`);
  }

  return {
    debate: {
      claimant,
      opinions: finalOpinions,
      consensusParams: {
        totalClaimStrength: claimant.strength,
        totalObjectionStrength: objectionPower,
        netScore: finalScore,
        deliberationText: rationale,
      },
    },
    consensusScore: finalScore,
    finalAction,
    rationale,
    tier,
  };
}

// ============ MAIN DECISION ENGINE ============

/**
 * Decision Engine Input
 */
export interface DecisionEngineInput {
  /** Sembol */
  symbol: string;
  /** Varlık tipi */
  assetType: AssetType;
  /** Modül skorları */
  moduleScores: Partial<Record<EngineTag, number | null>>;
  /** Veri sağlığı */
  dataHealth?: DataHealthSnapshot;
  /** Portföy bağlamı */
  portfolioContext?: PortfolioContext;
  /** Piyasa verisi */
  marketData?: {
    price: number;
    equity: number;
    currentRiskR: number;
  };
  /** Kaynak */
  candidateSource?: CandidateSource;
  /** Konfigürasyon */
  config?: DecisionEngineConfig;
}

/**
 * Decision Engine Output
 */
export interface DecisionEngineOutput {
  /** Agora Trace */
  trace: AgoraTrace;
  /** Council Sonucu */
  result: CouncilResult;
}

/**
 * Ana Karar Motoru
 *
 * Tüm modüllerden gelen skorları değerlendirip nihai kararı verir.
 */
export function makeDecision(input: DecisionEngineInput): DecisionEngineOutput {
  const {
    symbol,
    assetType,
    moduleScores,
    dataHealth,
    portfolioContext,
    marketData,
    candidateSource = 'MANUAL',
    config = DEFAULT_DECISION_CONFIG,
  } = input;

  const now = new Date();
  const unusedFactors: string[] = [];
  const dataSources: Record<string, string> = {};

  // === FAZ 1: VERİ SAĞLIK KAPISI ===
  const totalModules = 4; // Orion, Atlas, Hermes, Aether (minumum)
  let filledModules = 0;

  const coreModules: EngineTag[] = ['atlas', 'orion', 'hermes', 'aether'];
  for (const mod of coreModules) {
    if (moduleScores[mod] !== null && moduleScores[mod] !== undefined) {
      filledModules += 1;
    } else {
      unusedFactors.push(`${mod} (Missing)`);
    }
  }

  const coveragePct = (filledModules / totalModules) * 100;
  const isDataSufficient = coveragePct >= config.minDataCoverage && moduleScores.orion !== null;

  const healthSnapshot: DataHealthSnapshot = dataHealth || {
    freshnessScore: 100,
    missingModules: isDataSufficient ? [] : ['Kritik Veri Eksik'],
    isAcceptable: isDataSufficient,
  };

  if (!isDataSufficient) {
    const trace = createEmptyAgoraTrace(symbol);
    trace.dataHealth = healthSnapshot;
    trace.timestamp = now;
    trace.candidateSource = candidateSource;

    const result: CouncilResult = {
      symbol,
      assetType,
      finalAction: 'hold',
      consensusScore: 0,
      tier: 'RED',
      positionSize: 0,
      moduleOpinions: [],
      moduleWeights: INFORMATION_QUALITY,
      rationale: `Veri Yetersiz (%${Math.round(coveragePct)}). İşlem yapılmadı.`,
      summary: 'Veri yetersizliği nedeniyle işlem yapılamadı.',
      dataHealth: healthSnapshot,
      riskResult: null,
      churnResult: null,
      timestamp: now,
    };

    return { trace, result };
  }

  // === FAZ 2: GÖRÜŞLERİ TOPLA ===
  const opinions: ModuleOpinion[] = [];

  for (const [module, score] of Object.entries(moduleScores)) {
    if (score !== null && score !== undefined) {
      opinions.push(buildOpinion(module as EngineTag, score, ''));
    }
  }

  // === FAZ 3: KONSENSUS HESAPLA ===
  const consensus = calculateConsensus(opinions, config);

  // === FAZ 4: RİSK KAPISI ===
  const riskResult: RiskGateResult | null = marketData
    ? {
        isApproved: true,
        riskBudgetR: 3.0,
        deltaR: consensus.tier.positionSize,
        maxR: 3.0,
        reason: 'Risk bütçesi uygun',
      }
    : null;

  // === FAZ 5: CHURN GUARD ===
  const churnResult: ChurnGuardResult | null = portfolioContext
    ? checkChurnGuard(consensus.finalAction, consensus.consensusScore, portfolioContext, config.churnConfig)
    : null;

  // === FAZ 6: FİNAL KARAR ===
  let finalAction = consensus.finalAction;

  // Churn Guard bloklaması
  if (churnResult && churnResult.isBlocked) {
    finalAction = 'hold';
  }

  // Risk veto'su
  if (riskResult && !riskResult.isApproved && finalAction === 'buy') {
    finalAction = 'hold';
  }

  // === TRACE OLUŞTUR ===
  const trace: AgoraTrace = {
    id: crypto.randomUUID(),
    timestamp: now,
    symbol,
    candidateSource,
    dataHealth: healthSnapshot,
    debate: consensus.debate,
    riskEvaluation: riskResult || {
      isApproved: false,
      riskBudgetR: 0,
      deltaR: 0,
      maxR: 0,
      reason: 'Risk verisi yok',
    },
    finalDecision: {
      action: finalAction,
      quantity: consensus.tier.positionSize,
      executionPlan: finalAction !== 'hold' ? {
        targetAction: finalAction,
        targetSizeR: consensus.tier.positionSize,
        entryGuidance: null,
        riskPlan: {
          stopLoss: marketData?.price && finalAction === 'buy' ? marketData.price * 0.95 : null,
          takeProfit: marketData?.price ? marketData.price * 1.1 : null,
          maxDrawdown: 3,
        },
        validityWindow: 300,
      } : null,
      rationale: consensus.rationale,
      executionStrategy: 'MARKET',
    },
    dataSourceUsage: dataSources,
    unusedFactors,
  };

  // === COUNCIL RESULT ===
  const summary =
    finalAction === 'buy'
      ? consensus.consensusScore >= 70
        ? 'Güçlü alım sinyali. Çoğu modül olumlu görüş bildiriyor.'
        : 'Alım sinyali. Modüllerin çoğunluğu olumlu.'
      : finalAction === 'sell'
      ? 'Satış sinyali. Risk yüksek, çıkış önerilir.'
      : 'Nötr görünüm. Modüller kararsız, beklemek en iyisi.';

  const result: CouncilResult = {
    symbol,
    assetType,
    finalAction,
    consensusScore: consensus.consensusScore,
    tier: consensus.tier.tier,
    positionSize: consensus.tier.positionSize,
    moduleOpinions: consensus.debate.opinions,
    moduleWeights: INFORMATION_QUALITY,
    rationale: consensus.rationale,
    summary,
    dataHealth: healthSnapshot,
    riskResult,
    churnResult,
    timestamp: now,
  };

  return { trace, result };
}

// ============ EXPORTS ============

export default {
  DEFAULT_DECISION_CONFIG,
  checkChurnGuard,
  buildOpinion,
  calculateConsensus,
  makeDecision,
};
