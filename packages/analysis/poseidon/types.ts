/**
 * Poseidon Module Types - Asset Allocation Analysis (Agora)
 *
 * Varlık dağılımı modülü için tip tanımları.
 * Agora mimarisine uygun Result ve Opinion tipleri.
 */

// ============ TEMEL VERİ TİPLERİ ============

/**
 * Varlık Sınıfı
 */
export type AssetClass =
  | 'EQUITY'      // Hisse Senedi
  | 'FIXED_INCOME' // Tahvil/Fixed Income
  | 'CASH'        // Nakit
  | 'GOLD'        // Altın
  | 'COMMODITY'   // Emtia
  | 'CRYPTO'      // Kripto
  | 'REAL_ESTATE' // Gayrimenkul
  | 'INTERNATIONAL'; // Uluslararası

/**
 * Varlık Tipi (Detaylı)
 */
export type AssetType =
  | 'HISSE'
  | 'ETF'
  | 'EMTIA'
  | 'KRIPTO'
  | 'FON'
  | 'TAHVIL'
  | 'NAKIT'
  | 'ALTIN';

/**
 * Risk Profili
 */
export type RiskProfile =
  | 'CONSERVATIVE'   // Muhafazakar
  | 'MODERATE'       // Ilımlı
  | 'BALANCED'       // Dengeli
  | 'GROWTH'         // Büyüme
  | 'AGGRESSIVE';    // Agresif

/**
 * Portföy Yapısı
 */
export interface AssetAllocation {
  /** Hisse Senedi */
  equity: number;
  /** Tahvil/Fixed Income */
  fixedIncome: number;
  /** Nakit */
  cash: number;
  /** Altın */
  gold: number;
  /** Emtia */
  commodity: number;
  /** Kripto */
  crypto: number;
  /** Gayrimenkul */
  realEstate: number;
  /** Uluslararası */
  international: number;
}

/**
 * Varlık Verisi
 */
export interface AssetData {
  /** Varlık sınıfı */
  assetClass: AssetClass;
  /** Varlık tipi */
  assetType: AssetType;
  /** Mevcut ağırlık (%) */
  currentWeight: number;
  /** Hedef ağırlık (%) */
  targetWeight: number;
  /** Ağırlık değişikliği */
  weightChange: number;
  /** Beklenen getiri (%) */
  expectedReturn: number;
  /** Risk (volatilite %) */
  risk: number;
  /** Sharpe oranı */
  sharpeRatio: number;
  /** Korelasyon (piyasa ile) */
  correlation: number;
  /** Trend */
  trend: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  /** Öneri */
  recommendation: 'OVERWEIGHT' | 'EQUAL' | 'UNDERWEIGHT' | 'AVOID';
}

/**
 * Rejim Durumu
 */
export interface RegimeStatus {
  /** Rejim tipi */
  regime: 'BULL' | 'BEAR' | 'NEUTRAL' | 'STAGFLATION';
  /** Rejim güvenilirliği */
  confidence: number;
  /** Volatilite ortamı */
  volatility: 'LOW' | 'NORMAL' | 'HIGH';
  /** Faiz ortamı */
  rateEnvironment: 'RISING' | 'STABLE' | 'FALLING';
  /** Enflasyon ortamı */
  inflationEnvironment: 'LOW' | 'MODERATE' | 'HIGH';
}

/**
 * Risk Bütçesi
 */
export interface RiskBudget {
  /** Toplam risk bütçesi (%) */
  totalRisk: number;
  /** Hisse risk bütçesi */
  equityRisk: number;
  /** Tahvil risk bütçesi */
  fixedIncomeRisk: number;
  /** Alternatif risk bütçesi */
  alternativesRisk: number;
  /** Mevcut kullanılan risk */
  usedRisk: number;
  /** Kalan risk bütçesi */
  remainingRisk: number;
}

/**
 * Portföy Metrikleri
 */
export interface PortfolioMetrics {
  /** Beklenen portföy getirisi */
  expectedReturn: number;
  /** Portföy volatilitesi */
  volatility: number;
  /** Sharpe oranı */
  sharpeRatio: number;
  /** Sortino oranı */
  sortinoRatio: number;
  /** Max drawdown beklentisi */
  maxDrawdown: number;
  /** VaR (Value at Risk) */
  var: number;
}

/**
 * Varlık Rotasyon Sinyali
 */
export interface AssetRotationSignal {
  /** Kaynak varlık sınıfı */
  from: AssetClass;
  /** Hedef varlık sınıfı */
  to: AssetClass;
  /** Sinyal gücü */
  strength: number;
  /** Açıklama */
  reason: string;
  /** Zaman ufkusu */
  timeframe: 'SHORT' | 'MEDIUM' | 'LONG';
}

// ============ ANALİZ SONUCU ============

/**
 * Poseidon Analiz Sonucu (Agora)
 */
export interface PoseidonResult {
  /** Analiz tarihi */
  date: Date;
  /** Genel skor (0-100) */
  score: number;
  /** Harf notu */
  letterGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Karar */
  verdict: Verdict;
  /** Risk profili */
  riskProfile: RiskProfile;
  /** Mevcut portföy yapısı */
  currentAllocation: AssetAllocation;
  /** Hedef portföy yapısı */
  targetAllocation: AssetAllocation;
  /** Varlık verileri */
  assets: AssetData[];
  /** Rejim durumu */
  regime: RegimeStatus;
  /** Risk bütçesi */
  riskBudget: RiskBudget;
  /** Portföy metrikleri */
  metrics: PortfolioMetrics;
  /** Rotasyon sinyalleri */
  rotations: AssetRotationSignal[];
  /** Detaylar */
  details: string[];
  /** Özet */
  summary: string;
  /** Analiz zamanı */
  timestamp: Date;
}

/**
 * Agora modül opiniyonuna dönüşüm
 */
export interface PoseidonOpinion {
  /** Modül */
  module: 'poseidon';
  /** Duruş */
  stance: 'CLAIM' | 'SUPPORT' | 'OBJECT' | 'ABSTAIN';
  /** Tercih edilen aksiyon */
  preferredAction: 'buy' | 'sell' | 'hold';
  /** Güç (0-1) */
  strength: number;
  /** Skor (0-100) */
  score: number;
  /** Güven (0-1) */
  confidence: number;
  /** Kanıtlar */
  evidence: string[];
  /** Varlık sınıfı önerileri */
  assetRecommendations: Array<{
    assetClass: AssetClass;
    action: 'OVERWEIGHT' | 'EQUAL' | 'UNDERWEIGHT';
    conviction: number;
  }>;
}

/**
 * Karar Tipi
 */
export type Verdict = 'GÜÇLÜ POZİTİF' | 'POZİTİF' | 'NÖTR' | 'NEGATİF' | 'GÜÇLÜ NEGATİF';

/**
 * Poseidon Ağırlıkları (Modül ağırlıkları)
 */
export interface PoseidonWeights {
  atlas: number;
  orion: number;
  aether: number;
  hermes: number;
  cronos: number;
  athena: number;
  demeter: number;
}

// ============ HARF NOTLARI ============

/**
 * Skora göre harf notu hesapla
 */
export function getLetterGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

/**
 * Skora göre karar ver
 */
export function getVerdict(score: number): Verdict {
  if (score >= 75) return 'GÜÇLÜ POZİTİF';
  if (score >= 60) return 'POZİTİF';
  if (score >= 45) return 'NÖTR';
  if (score >= 30) return 'NEGATİF';
  return 'GÜÇLÜ NEGATİF';
}

/**
 * Kararı Action'a çevir
 */
export function verdictToAction(verdict: Verdict): 'buy' | 'sell' | 'hold' {
  if (verdict === 'GÜÇLÜ POZİTİF' || verdict === 'POZİTİF') return 'buy';
  if (verdict === 'GÜÇLÜ NEGATİF' || verdict === 'NEGATİF') return 'sell';
  return 'hold';
}

/**
 * Skoru Opinion'a dönüştür
 */
export function scoreToOpinion(
  assets: AssetData[],
  regime: RegimeStatus,
  targetAllocation: AssetAllocation,
  score: number
): PoseidonOpinion {
  const quality = 0.85; // Poseidon güvenilirliği

  // Stance belirle
  let stance: PoseidonOpinion['stance'];
  if (score >= 70) {
    stance = 'SUPPORT';
  } else if (score >= 55) {
    stance = 'ABSTAIN';
  } else if (score >= 40) {
    stance = 'OBJECT';
  } else {
    stance = 'OBJECT';
  }

  // Kanıtlar
  const evidence: string[] = [
    `Dağılım Skoru: ${score}/100`,
    `Rejim: ${regime.regime}`,
    `Volatilite: ${regime.volatility}`,
    `Beklenen Getiri: ${assets.reduce((sum, a) => sum + a.expectedReturn * a.targetWeight / 100, 0).toFixed(1)}%`,
  ];

  // Varlık sınıfı önerileri
  const assetRecommendations: PoseidonOpinion['assetRecommendations'] = [];

  for (const asset of assets) {
    if (asset.recommendation !== 'EQUAL') {
      assetRecommendations.push({
        assetClass: asset.assetClass,
        action: asset.recommendation === 'OVERWEIGHT' ? 'OVERWEIGHT' : 'UNDERWEIGHT',
        conviction: Math.abs(asset.weightChange) / 20,
      });
    }
  }

  return {
    module: 'poseidon',
    stance,
    preferredAction: verdictToAction(getVerdict(score)),
    strength: Math.abs(score - 50) / 50 * quality,
    score,
    confidence: quality,
    evidence,
    assetRecommendations,
  };
}

/**
 * Özet oluştur
 */
export function generateSummary(
  regime: RegimeStatus,
  targetAllocation: AssetAllocation,
  topAsset: AssetData,
  metrics: PortfolioMetrics
): string {
  const parts: string[] = [];

  parts.push(`Rejim: ${regime.regime}.`);

  const allocations: string[] = [];
  if (targetAllocation.equity > 0) allocations.push(`Hisse %${targetAllocation.equity}`);
  if (targetAllocation.fixedIncome > 0) allocations.push(`Tahvil %${targetAllocation.fixedIncome}`);
  if (targetAllocation.gold > 0) allocations.push(`Altın %${targetAllocation.gold}`);
  if (targetAllocation.cash > 0) allocations.push(`Nakit %${targetAllocation.cash}`);

  parts.push(`Hedef Dağılım: ${allocations.join(', ')}.`);

  parts.push(`Beklenen Getiri: %${metrics.expectedReturn.toFixed(1)}, Risk: %${metrics.volatility.toFixed(1)}.`);

  if (topAsset.recommendation === 'OVERWEIGHT') {
    parts.push(`${topAsset.assetClass} ağırlık artır.`);
  }

  return parts.join(' ');
}

/**
 * Varlık sınıfı adı
 */
export function getAssetClassName(assetClass: AssetClass): string {
  const names: Record<AssetClass, string> = {
    EQUITY: 'Hisse Senedi',
    FIXED_INCOME: 'Tahvil',
    CASH: 'Nakit',
    GOLD: 'Altın',
    COMMODITY: 'Emtia',
    CRYPTO: 'Kripto',
    REAL_ESTATE: 'Gayrimenkul',
    INTERNATIONAL: 'Uluslararası',
  };
  return names[assetClass] || assetClass;
}

// ============ EXPORTS ============

export default {
  getLetterGrade,
  getVerdict,
  verdictToAction,
  scoreToOpinion,
  generateSummary,
  getAssetClassName,
};
