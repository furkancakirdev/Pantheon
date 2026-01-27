/**
 * Poseidon Engine - Asset Allocation Analysis Module
 *
 * Varlık dağılımı motoru. Agora mimarisine uygun singleton pattern.
 *
 * Bileşenler:
 * - Stratejik Varlık Dağılımı
 * - Taktiksel Varlık Dağılımı
 * - Rejim Bazlı Rotasyon
 * - Risk Bütçeleme
 * - Portföy Optimizasyonu
 *
 * "Doğru varlık dağılımı, portföy başarısının %90'ını belirler."
 */

import type {
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

import {
  getLetterGrade,
  getVerdict,
  verdictToAction,
  scoreToOpinion,
  generateSummary,
  getAssetClassName,
} from './types';

import {
  INFORMATION_QUALITY,
  STRATEGIC_ALLOCATIONS,
  REGIME_ADJUSTMENTS,
  ASSET_EXPECTED_RETURNS,
  RISK_BUDGETS,
  ASSET_TYPE_WEIGHTS,
  TACTICAL_LIMITS,
  ROTATION_THRESHOLDS,
  VAR_CONFIG,
} from './config';

// ============ POSEIDON ENGINE ============

/**
 * Poseidon Engine - Singleton
 */
export class PoseidonEngine {
  private static instance: PoseidonEngine;
  private cachedRegime: RegimeStatus | null = null;
  private cachedRegimeExpiry: number = 0;

  private constructor() {}

  public static getInstance(): PoseidonEngine {
    if (!PoseidonEngine.instance) {
      PoseidonEngine.instance = new PoseidonEngine();
    }
    return PoseidonEngine.instance;
  }

  /**
   * Varlık dağılım analizi yap
   *
   * @param riskProfile - Risk profili
   * @param currentAllocation - Mevcut portföy dağılımı (opsiyonel)
   * @returns PoseidonResult
   */
  public async analyze(
    riskProfile: RiskProfile = 'BALANCED',
    currentAllocation?: AssetAllocation | null
  ): Promise<PoseidonResult> {
    const now = new Date();

    // 1. Verileri çek
    const assets = await this.fetchAssetData();
    const regime = await this.fetchRegimeStatus();

    // 2. Stratejik dağılım
    const strategicAllocation = this.getStrategicAllocation(riskProfile);

    // 3. Taktiksel ayarlar
    const tacticalAdjustments = this.getTacticalAdjustments(regime);

    // 4. Hedef dağılım
    const targetAllocation = this.calculateTargetAllocation(
      strategicAllocation,
      tacticalAdjustments
    );

    // 5. Mevcut dağılım (verilmezse equal weight varsay)
    const current = currentAllocation || this.calculateEqualAllocation();

    // 6. Varlık verilerini güncelle
    const updatedAssets = this.updateAssetData(assets, current, targetAllocation);

    // 7. Risk bütçesi
    const riskBudget = this.calculateRiskBudget(riskProfile, updatedAssets);

    // 8. Portföy metrikleri
    const metrics = this.calculatePortfolioMetrics(updatedAssets, targetAllocation);

    // 9. Rotasyon sinyalleri
    const rotations = this.detectRotations(updatedAssets, regime, current, targetAllocation);

    // 10. Genel skor
    const score = this.calculateOverallScore(regime, metrics, riskBudget);
    const verdict = getVerdict(score);
    const letterGrade = getLetterGrade(score);

    // 11. Detaylar
    const details = this.generateDetails(
      riskProfile,
      regime,
      current,
      targetAllocation,
      metrics,
      riskBudget
    );

    const topAsset = [...updatedAssets].sort((a, b) => b.targetWeight - a.targetWeight)[0];
    const summary = generateSummary(regime, targetAllocation, topAsset, metrics);

    return {
      date: now,
      score,
      letterGrade,
      verdict,
      riskProfile,
      currentAllocation: current,
      targetAllocation,
      assets: updatedAssets,
      regime,
      riskBudget,
      metrics,
      rotations,
      details,
      summary,
      timestamp: now,
    };
  }

  /**
   * Sembol için Council Opinion üret
   *
   * @param symbol - Sembol
   * @param riskProfile - Risk profili
   * @returns PoseidonOpinion
   */
  public async getOpinion(
    symbol: string,
    riskProfile: RiskProfile = 'BALANCED'
  ): Promise<PoseidonOpinion> {
    const result = await this.analyze(riskProfile);

    return scoreToOpinion(
      result.assets,
      result.regime,
      result.targetAllocation,
      result.score
    );
  }

  /**
   * Mevcut rejimi getir
   *
   * @returns RegimeStatus
   */
  public async getRegime(): Promise<RegimeStatus> {
    if (this.cachedRegime && this.cachedRegimeExpiry > Date.now()) {
      return this.cachedRegime;
    }

    const regime = await this.fetchRegimeStatus();
    this.cachedRegime = regime;
    this.cachedRegimeExpiry = Date.now() + (60 * 60 * 1000); // 1 saat

    return regime;
  }

  /**
   * Hedef portföy dağılımını getir
   *
   * @param riskProfile - Risk profili
   * @returns AssetAllocation
   */
  public async getTargetAllocation(
    riskProfile: RiskProfile = 'BALANCED'
  ): Promise<AssetAllocation> {
    const regime = await this.getRegime();
    const strategic = this.getStrategicAllocation(riskProfile);
    const tactical = this.getTacticalAdjustments(regime);

    return this.calculateTargetAllocation(strategic, tactical);
  }

  /**
   * Varlık tipine göre modül ağırlıklarını getir
   *
   * @param assetType - Varlık tipi
   * @returns PoseidonWeights
   */
  public getWeights(assetType: AssetType): PoseidonWeights {
    return ASSET_TYPE_WEIGHTS[assetType] || ASSET_TYPE_WEIGHTS.HISSE;
  }

  /**
   * Varlık tipini otomatik tespit et
   *
   * @param symbol - Sembol
   * @returns AssetType
   */
  public detectAssetType(symbol: string): AssetType {
    const upper = symbol.toUpperCase();

    // Kripto
    if (upper.includes('BTC') || upper.includes('ETH') || upper.includes('USDT') || upper.endsWith('-USD')) {
      return 'KRIPTO';
    }
    // ETF
    if (upper.includes('ETF') || upper.startsWith('SPY') || upper.startsWith('QQQ') || upper.startsWith('IVV')) {
      return 'ETF';
    }
    // Emtia
    if (['GLD', 'SLV', 'USO', 'UNG', 'ALTIN', 'GUMUS', 'PETROL'].some(e => upper.includes(e))) {
      return 'EMTIA';
    }
    // Altın
    if (['GLD', 'ALTIN', 'XAU'].some(e => upper.includes(e))) {
      return 'ALTIN';
    }
    // TEFAS Fonları
    if (upper.startsWith('TGD') || upper.startsWith('TTE') || upper.startsWith('TTA')) {
      return 'FON';
    }

    return 'HISSE';
  }

  /**
   * Modül skorlarını ağırlıklı olarak birleştir
   *
   * @param assetType - Varlık tipi
   * @param scores - Modül skorları
   * @returns number - Ağırlıklı skor
   */
  public calculateScore(
    assetType: AssetType,
    scores: {
      atlas?: number;
      orion?: number;
      aether?: number;
      hermes?: number;
      cronos?: number;
      athena?: number;
      demeter?: number;
    }
  ): number {
    const weights = this.getWeights(assetType);

    let totalScore = 0;
    let totalWeight = 0;

    // Atlas
    if (weights.atlas > 0 && scores.atlas !== undefined) {
      totalScore += scores.atlas * weights.atlas;
      totalWeight += weights.atlas;
    }
    // Orion
    if (weights.orion > 0 && scores.orion !== undefined) {
      totalScore += scores.orion * weights.orion;
      totalWeight += weights.orion;
    }
    // Aether
    if (weights.aether > 0 && scores.aether !== undefined) {
      totalScore += scores.aether * weights.aether;
      totalWeight += weights.aether;
    }
    // Hermes
    if (weights.hermes > 0 && scores.hermes !== undefined) {
      totalScore += scores.hermes * weights.hermes;
      totalWeight += weights.hermes;
    }
    // Cronos
    if (weights.cronos > 0 && scores.cronos !== undefined) {
      totalScore += scores.cronos * weights.cronos;
      totalWeight += weights.cronos;
    }
    // Athena
    if (weights.athena > 0 && scores.athena !== undefined) {
      totalScore += scores.athena * weights.athena;
      totalWeight += weights.athena;
    }
    // Demeter
    if (weights.demeter > 0 && scores.demeter !== undefined) {
      totalScore += scores.demeter * weights.demeter;
      totalWeight += weights.demeter;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 50;
  }

  // ============ PRIVATE METHODS ============

  /**
   * Varlık verilerini çek
   */
  private async fetchAssetData(): Promise<AssetData[]> {
    const { fetchAllAssetClassesCached } = await import('./api/client');
    return fetchAllAssetClassesCached();
  }

  /**
   * Rejim durumunu çek
   */
  private async fetchRegimeStatus(): Promise<RegimeStatus> {
    const { fetchRegimeStatusCached } = await import('./api/client');
    return fetchRegimeStatusCached();
  }

  /**
   * Stratejik dağılım
   */
  private getStrategicAllocation(riskProfile: RiskProfile): AssetAllocation {
    return STRATEGIC_ALLOCATIONS[riskProfile];
  }

  /**
   * Taktiksel ayarlar
   */
  private getTacticalAdjustments(regime: RegimeStatus): Partial<AssetAllocation> {
    const adjustment = REGIME_ADJUSTMENTS[regime.regime] || REGIME_ADJUSTMENTS.NEUTRAL;

    return {
      equity: adjustment.equity,
      fixedIncome: adjustment.fixedIncome,
      gold: adjustment.gold,
      cash: adjustment.cash,
      commodity: 0,
      crypto: 0,
      realEstate: 0,
      international: 0,
    };
  }

  /**
   * Hedef dağılımı hesapla
   */
  private calculateTargetAllocation(
    strategic: AssetAllocation,
    tactical: Partial<AssetAllocation>
  ): AssetAllocation {
    const target: AssetAllocation = {
      equity: Math.max(0, Math.min(100, strategic.equity + (tactical.equity || 0))),
      fixedIncome: Math.max(0, Math.min(100, strategic.fixedIncome + (tactical.fixedIncome || 0))),
      cash: Math.max(TACTICAL_LIMITS.minCash, strategic.cash + (tactical.cash || 0)),
      gold: Math.max(0, Math.min(100, strategic.gold + (tactical.gold || 0))),
      commodity: strategic.commodity + (tactical.commodity || 0),
      crypto: strategic.crypto + (tactical.crypto || 0),
      realEstate: strategic.realEstate + (tactical.realEstate || 0),
      international: strategic.international + (tactical.international || 0),
    };

    // Normalize et (toplam %100 olsun)
    const total = Object.values(target).reduce((sum, v) => sum + v, 0);
    if (total !== 100 && total > 0) {
      for (const key in target) {
        target[key as keyof AssetAllocation] = Math.round((target[key as keyof AssetAllocation] / total) * 100);
      }
    }

    return target;
  }

  /**
   * Eşit ağırlıklı dağılım
   */
  private calculateEqualAllocation(): AssetAllocation {
    return {
      equity: 12.5,
      fixedIncome: 12.5,
      cash: 12.5,
      gold: 12.5,
      commodity: 12.5,
      crypto: 12.5,
      realEstate: 12.5,
      international: 12.5,
    };
  }

  /**
   * Varlık verilerini güncelle
   */
  private updateAssetData(
    assets: AssetData[],
    current: AssetAllocation,
    target: AssetAllocation
  ): AssetData[] {
    const allocationMap: Record<string, number> = {
      EQUITY: target.equity,
      FIXED_INCOME: target.fixedIncome,
      CASH: target.cash,
      GOLD: target.gold,
      COMMODITY: target.commodity,
      CRYPTO: target.crypto,
      REAL_ESTATE: target.realEstate,
      INTERNATIONAL: target.international,
    };

    const currentMap: Record<string, number> = {
      EQUITY: current.equity,
      FIXED_INCOME: current.fixedIncome,
      CASH: current.cash,
      GOLD: current.gold,
      COMMODITY: current.commodity,
      CRYPTO: current.crypto,
      REAL_ESTATE: current.realEstate,
      INTERNATIONAL: current.international,
    };

    return assets.map(asset => ({
      ...asset,
      currentWeight: currentMap[asset.assetClass] || 0,
      targetWeight: allocationMap[asset.assetClass] || 0,
      weightChange: (allocationMap[asset.assetClass] || 0) - (currentMap[asset.assetClass] || 0),
    }));
  }

  /**
   * Risk bütçesi hesapla
   */
  private calculateRiskBudget(riskProfile: RiskProfile, assets: AssetData[]): RiskBudget {
    const budget = RISK_BUDGETS[riskProfile];

    // Mevcut kullanılan risk
    let usedRisk = 0;
    let equityRisk = 0;
    let fixedIncomeRisk = 0;
    let alternativesRisk = 0;

    for (const asset of assets) {
      const contribution = asset.risk * asset.targetWeight / 100;

      if (asset.assetClass === 'EQUITY' || asset.assetClass === 'INTERNATIONAL') {
        equityRisk += contribution;
      } else if (asset.assetClass === 'FIXED_INCOME' || asset.assetClass === 'CASH') {
        fixedIncomeRisk += contribution;
      } else {
        alternativesRisk += contribution;
      }

      usedRisk += contribution;
    }

    return {
      totalRisk: budget.totalRisk,
      equityRisk: budget.maxEquityRisk,
      fixedIncomeRisk: budget.maxFixedIncomeRisk,
      alternativesRisk: budget.maxAlternativesRisk,
      usedRisk,
      remainingRisk: Math.max(0, budget.totalRisk - usedRisk),
    };
  }

  /**
   * Portföy metrikleri hesapla
   */
  private calculatePortfolioMetrics(
    assets: AssetData[],
    target: AssetAllocation
  ): PortfolioMetrics {
    let expectedReturn = 0;
    let portfolioVariance = 0;
    let downsideDeviation = 0;

    const weights: Record<AssetClass, number> = {
      EQUITY: target.equity,
      FIXED_INCOME: target.fixedIncome,
      CASH: target.cash,
      GOLD: target.gold,
      COMMODITY: target.commodity,
      CRYPTO: target.crypto,
      REAL_ESTATE: target.realEstate,
      INTERNATIONAL: target.international,
    };

    // Beklenen getirisi
    for (const asset of assets) {
      const w = weights[asset.assetClass] / 100;
      expectedReturn += asset.expectedReturn * w;
    }

    // Portföy volatilitesi (basit yaklaşım)
    for (const asset of assets) {
      const w = weights[asset.assetClass] / 100;
      portfolioVariance += Math.pow(asset.risk * w, 2);
    }
    const volatility = Math.sqrt(portfolioVariance);

    // Sharpe oranı (risk-free rate = %3 varsayımı)
    const riskFreeRate = 3;
    const sharpeRatio = expectedReturn > riskFreeRate ?
      (expectedReturn - riskFreeRate) / volatility : 0;

    // Sortino oranı (basit yaklaşım)
    const downsideReturns = assets.filter(a => a.expectedReturn < riskFreeRate);
    downsideDeviation = downsideReturns.length > 0 ?
      downsideReturns.reduce((sum, a) => sum + Math.pow(riskFreeRate - a.expectedReturn, 2), 0) /
      downsideReturns.length : 1;
    const sortinoRatio = expectedReturn > riskFreeRate ?
      (expectedReturn - riskFreeRate) / Math.sqrt(downsideDeviation) : 0;

    // VaR (Parametrik, %95 güven)
    const varValue = expectedReturn - 1.65 * volatility;

    // Max drawdown tahmini
    const maxDrawdown = Math.min(0.4, volatility * 2);

    return {
      expectedReturn,
      volatility,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown,
      var: varValue,
    };
  }

  /**
   * Rotasyon sinyalleri tespit et
   */
  private detectRotations(
    assets: AssetData[],
    regime: RegimeStatus,
    current: AssetAllocation,
    target: AssetAllocation
  ): AssetRotationSignal[] {
    const signals: AssetRotationSignal[] = [];

    const currentMap: Record<string, number> = {
      EQUITY: current.equity,
      FIXED_INCOME: current.fixedIncome,
      CASH: current.cash,
      GOLD: current.gold,
      COMMODITY: current.commodity,
      CRYPTO: current.crypto,
      REAL_ESTATE: current.realEstate,
      INTERNATIONAL: current.international,
    };

    const targetMap: Record<string, number> = {
      EQUITY: target.equity,
      FIXED_INCOME: target.fixedIncome,
      CASH: target.cash,
      GOLD: target.gold,
      COMMODITY: target.commodity,
      CRYPTO: target.crypto,
      REAL_ESTATE: target.realEstate,
      INTERNATIONAL: target.international,
    };

    // Artış gösteren varlıklar
    for (const asset of assets) {
      const change = targetMap[asset.assetClass] - currentMap[asset.assetClass];

      if (change >= ROTATION_THRESHOLDS.minWeightChange) {
        // En çok azaltılan varlık bulunur
        let maxReduction = 0;
        let fromAsset: AssetClass | null = null;

        for (const [key, value] of Object.entries(currentMap)) {
          const reduction = value - targetMap[key as AssetClass];
          if (reduction > maxReduction) {
            maxReduction = reduction;
            fromAsset = key as AssetClass;
          }
        }

        if (fromAsset) {
          signals.push({
            from: fromAsset,
            to: asset.assetClass,
            strength: Math.abs(change),
            reason: this.getRotationReason(asset.assetClass, regime),
            timeframe: 'MEDIUM',
          });
        }
      }
    }

    // Rejim bazlı sinyal
    if (regime.regime === 'STAGFLATION' && targetMap.GOLD > currentMap.GOLD) {
      signals.push({
        from: 'EQUITY',
        to: 'GOLD',
        strength: 15,
        reason: 'Stagflasyon rejimi: Enflasyon koruması için altına rotasyon',
        timeframe: 'LONG',
      });
    }

    return signals;
  }

  /**
   * Rotasyon nedeni
   */
  private getRotationReason(to: AssetClass, regime: RegimeStatus): string {
    const reasons: Record<AssetClass, string> = {
      EQUITY: 'Büyüme beklentisi',
      FIXED_INCOME: 'Stabilite arayışı',
      CASH: 'Likidite ihtiyacı',
      GOLD: 'Enflasyon koruması',
      COMMODITY: 'Enflasyon hedge',
      CRYPTO: 'Spekülatif fırsat',
      REAL_ESTATE: 'Varlık koruması',
      INTERNATIONAL: 'Yurt dışı çeşitlendirme',
    };

    return reasons[to] || 'Portföy dengesizliği';
  }

  /**
   * Genel skor hesapla
   */
  private calculateOverallScore(
    regime: RegimeStatus,
    metrics: PortfolioMetrics,
    riskBudget: RiskBudget
  ): number {
    let score = 50; // Baz skor

    // Rejim bonusu/cezası
    if (regime.regime === 'BULL') {
      score += 15;
    } else if (regime.regime === 'BEAR') {
      score -= 10;
    } else if (regime.regime === 'STAGFLATION') {
      score -= 5;
    }

    // Sharpe bonusu
    if (metrics.sharpeRatio > 0.5) {
      score += 10;
    } else if (metrics.sharpeRatio < 0.2) {
      score -= 10;
    }

    // Risk bütçesi kullanımı
    const riskUsage = riskBudget.usedRisk / riskBudget.totalRisk;
    if (riskUsage > 0.8 && riskUsage < 1.0) {
      score += 5; // İyi risk kullanımı
    } else if (riskUsage > 1.0) {
      score -= 10; // Risk aşımı
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Detaylar oluştur
   */
  private generateDetails(
    riskProfile: RiskProfile,
    regime: RegimeStatus,
    current: AssetAllocation,
    target: AssetAllocation,
    metrics: PortfolioMetrics,
    riskBudget: RiskBudget
  ): string[] {
    const details: string[] = [];

    details.push(`Risk Profili: ${riskProfile}`);
    details.push(`Rejim: ${regime.regime} (Güven: ${(regime.confidence * 100).toFixed(0)}%)`);
    details.push('');

    details.push('Mevcut Dağılım:');
    details.push(`  Hisse: %${current.equity}, Tahvil: %${current.fixedIncome}, Altın: %${current.gold}, Nakit: %${current.cash}`);

    details.push('');
    details.push('Hedef Dağılım:');
    details.push(`  Hisse: %${target.equity}, Tahvil: %${target.fixedIncome}, Altın: %${target.gold}, Nakit: %${target.cash}`);

    details.push('');
    details.push('Portföy Metrikleri:');
    details.push(`  Beklenen Getiri: %${metrics.expectedReturn.toFixed(1)}`);
    details.push(`  Volatilite: %${metrics.volatility.toFixed(1)}`);
    details.push(`  Sharpe: ${metrics.sharpeRatio.toFixed(2)}`);
    details.push(`  Max Drawdown: %${(metrics.maxDrawdown * 100).toFixed(1)}`);

    details.push('');
    details.push('Risk Bütçesi:');
    details.push(`  Kullanılan: %${riskBudget.usedRisk.toFixed(1)}/${riskBudget.totalRisk}%`);
    details.push(`  Kalan: %${riskBudget.remainingRisk.toFixed(1)}`);

    return details;
  }
}

// ============ EXPORTS ============

/**
 * Singleton instance
 */
export const poseidonEngine = PoseidonEngine.getInstance();

// Convenience functions
export async function analyzeAssetAllocation(
  riskProfile?: RiskProfile,
  currentAllocation?: AssetAllocation
): Promise<any> {
  return poseidonEngine.analyze(riskProfile, currentAllocation);
}

export async function getPoseidonOpinion(
  symbol: string,
  riskProfile?: RiskProfile
): Promise<any> {
  return poseidonEngine.getOpinion(symbol, riskProfile);
}

export async function getRegime(): Promise<RegimeStatus> {
  return poseidonEngine.getRegime();
}

export async function getTargetAllocation(
  riskProfile?: RiskProfile
): Promise<AssetAllocation> {
  return poseidonEngine.getTargetAllocation(riskProfile);
}

export default {
  PoseidonEngine,
  poseidonEngine,
  analyzeAssetAllocation,
  getPoseidonOpinion,
  getRegime,
  getTargetAllocation,
};
