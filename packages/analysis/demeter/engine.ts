/**
 * Demeter Engine - Sector Rotation Analysis Module
 *
 * Sektör rotasyonu motoru. Agora mimarisine uygun singleton pattern.
 *
 * Bileşenler:
 * - Sektör Göreceli Güç Analizi
 * - Sektör Momentum Analizi
 * - Faz Tespiti (Risk-On/Off)
 * - Rotasyon Sinyalleri
 * - Portföy Ağırlık Önerileri
 *
 * "Paranın aktığı yere git. Sektör rotasyonu piyasanın nabzıdır."
 */

import type {
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
  Verdict,
} from './types';

import {
  getLetterGrade,
  getVerdict,
  getTrend,
  scoreToOpinion,
  generateSummary,
  SECTORS,
  getSectorName,
} from './types';

import {
  INFORMATION_QUALITY,
  SECTOR_WEIGHTS,
  SECTOR_SCORE_THRESHOLDS,
  ROTATION_THRESHOLDS,
  PHASE_THRESHOLDS,
  CYCLE_PHASE_ALLOCATION,
  MACRO_REGIME_ROTATION,
  BETA_CONFIG,
  SIGNAL_STRENGTH,
  SECTOR_WEIGHT_LIMITS,
} from './config';

// ============ DEMETER ENGINE ============

/**
 * Demeter Engine - Singleton
 */
export class DemeterEngine {
  private static instance: DemeterEngine;
  private cachedMarketPhase: MarketPhase | null = null;
  private cachedPhaseExpiry: number = 0;

  private constructor() {}

  public static getInstance(): DemeterEngine {
    if (!DemeterEngine.instance) {
      DemeterEngine.instance = new DemeterEngine();
    }
    return DemeterEngine.instance;
  }

  /**
   * Sektör rotasyon analizi yap
   *
   * @param sectors - Sektör verileri (opsiyonel, null ise fetch edilir)
   * @returns DemeterResult
   */
  public async analyze(sectors?: SectorData[] | null): Promise<DemeterResult> {
    const now = new Date();

    // 1. Sektör verilerini al
    const sectorData = sectors || await this.fetchSectorData();

    // 2. Her sektör için skor hesapla
    const scoredSectors = sectorData.map(s => ({
      ...s,
      score: this.calculateSectorScore(s),
    }));

    // 3. Piyasa fazı belirle
    const marketPhase = this.determineMarketPhase(scoredSectors);
    this.cachedMarketPhase = marketPhase;
    this.cachedPhaseExpiry = Date.now() + (60 * 60 * 1000); // 1 saat cache

    // 4. Faz analizi
    const phaseAnalysis = this.analyzePhase(scoredSectors, marketPhase);

    // 5. Rotasyon sinyalleri
    const rotation = this.detectRotation(scoredSectors, marketPhase, phaseAnalysis);

    // 6. Sinyalleri oluştur
    const signals = this.generateSignals(scoredSectors, rotation, marketPhase);

    // 7. Sıralama
    const sorted = [...scoredSectors].sort((a, b) => b.score - a.score);
    const topSectors = sorted.slice(0, 3);
    const bottomSectors = sorted.slice(-3).reverse();

    // 8. Genel skor
    const score = this.calculateOverallScore(scoredSectors, marketPhase);
    const verdict = getVerdict(score);
    const letterGrade = getLetterGrade(score);

    // 9. Detaylar
    const details = this.generateDetails(marketPhase, topSectors, bottomSectors, rotation);

    const summary = generateSummary(
      marketPhase,
      topSectors[0],
      bottomSectors[0],
      rotation
    );

    return {
      date: now,
      score,
      letterGrade,
      verdict,
      marketPhase,
      sectors: scoredSectors,
      rotation,
      phaseAnalysis,
      topSectors,
      bottomSectors,
      signals,
      details,
      summary,
      timestamp: now,
    };
  }

  /**
   * Sembol için Council Opinion üret
   *
   * @param symbol - Sembol (Demeter global olduğu için ignored)
   * @param sectors - Sektör verileri
   * @returns DemeterOpinion
   */
  public async getOpinion(
    symbol: string,
    sectors?: SectorData[] | null
  ): Promise<DemeterOpinion> {
    const result = await this.analyze(sectors);

    return scoreToOpinion(
      result.sectors,
      result.rotation,
      result.phaseAnalysis,
      result.score
    );
  }

  /**
   * Mevcut piyasa fazını getir
   *
   * @param sectors - Sektör verileri (opsiyonel)
   * @returns MarketPhase
   */
  public async getMarketPhase(sectors?: SectorData[]): Promise<MarketPhase> {
    if (this.cachedMarketPhase && this.cachedPhaseExpiry > Date.now()) {
      return this.cachedMarketPhase;
    }

    const sectorData = sectors || await this.fetchSectorData();
    const scoredSectors = sectorData.map(s => ({
      ...s,
      score: this.calculateSectorScore(s),
    }));

    const phase = this.determineMarketPhase(scoredSectors);
    this.cachedMarketPhase = phase;
    this.cachedPhaseExpiry = Date.now() + (60 * 60 * 1000);

    return phase;
  }

  /**
   * Portföy için sektörel ağırlık önerisi
   *
   * @param riskProfile - Risk profili (conservative, balanced, aggressive)
   * @returns Record<SectorCode, number>
   */
  public async getSectorAllocation(
    riskProfile: 'conservative' | 'balanced' | 'aggressive' = 'balanced'
  ): Promise<Record<SectorCode, number>> {
    const result = await this.analyze();

    const allocation: Record<string, number> = {};

    // Risk profiline göre ağırlık dağılımı
    const riskMultiplier = riskProfile === 'aggressive' ? 1.5 :
                          riskProfile === 'conservative' ? 0.7 : 1.0;

    // Baz ağırlıklar
    const baseWeight = 1 / result.sectors.length;

    for (const sector of result.sectors) {
      let weight = baseWeight;

      // Rotate-in sectors
      if (result.rotation.rotateIn.includes(sector.sector)) {
        weight = baseWeight * 1.5 * riskMultiplier;
      }
      // Rotate-out sectors
      else if (result.rotation.rotateOut.includes(sector.sector)) {
        weight = baseWeight * 0.5 / riskMultiplier;
      }
      // Hold sectors
      else if (result.rotation.hold.includes(sector.sector)) {
        weight = baseWeight * riskMultiplier;
      }

      // Skor ayarı
      const scoreAdjustment = (sector.score - 50) / 200; // -0.25 to +0.25
      weight = weight * (1 + scoreAdjustment);

      // Limitleri uygula
      weight = Math.max(SECTOR_WEIGHT_LIMITS.minSectorWeight,
                       Math.min(SECTOR_WEIGHT_LIMITS.maxSectorWeight, weight));

      allocation[sector.sector] = Math.round(weight * 100) / 100;
    }

    // Normalize et
    const total = Object.values(allocation).reduce((sum, w) => sum + w, 0);
    for (const key in allocation) {
      allocation[key] = Math.round((allocation[key] / total) * 100) / 100;
    }

    return allocation as Record<SectorCode, number>;
  }

  /**
   * Belirli bir sektör için öneri al
   *
   * @param sector - Sektör kodu
   * @returns 'OVERWEIGHT' | 'EQUAL' | 'UNDERWEIGHT'
   */
  public async getSectorRecommendation(
    sector: SectorCode
  ): Promise<'OVERWEIGHT' | 'EQUAL' | 'UNDERWEIGHT'> {
    const result = await this.analyze();

    if (result.rotation.rotateIn.includes(sector)) {
      return 'OVERWEIGHT';
    }
    if (result.rotation.rotateOut.includes(sector)) {
      return 'UNDERWEIGHT';
    }
    return 'EQUAL';
  }

  // ============ PRIVATE METHODS ============

  /**
   * Sektör verilerini getir
   */
  private async fetchSectorData(): Promise<SectorData[]> {
    // API client'tan veri çek
    const { fetchAllSectorsCached } = await import('./api/client');
    return fetchAllSectorsCached();
  }

  /**
   * Sektör skoru hesapla (0-100)
   */
  private calculateSectorScore(sector: SectorData): number {
    let score = 50; // Baz skor

    // Göreceli güç (30%)
    const rsScore = (sector.relativeStrength - 100) / 20 * 15; // -15 to +15
    score += rsScore * SECTOR_WEIGHTS.relativeStrength;

    // Momentum (25%)
    const momentumScore = Math.max(-25, Math.min(25, sector.momentum / 2));
    score += momentumScore * SECTOR_WEIGHTS.momentum;

    // Trend (10%)
    if (sector.trend === 'BULLISH') {
      score += 10 * SECTOR_WEIGHTS.momentum;
    } else if (sector.trend === 'BEARISH') {
      score -= 10 * SECTOR_WEIGHTS.momentum;
    }

    // RSI (10%)
    if (sector.rsi > 50 && sector.rsi < 70) {
      score += 5 * SECTOR_WEIGHTS.momentum;
    } else if (sector.rsi < 30) {
      score += 10 * SECTOR_WEIGHTS.momentum; // Oversold = alım fırsatı
    } else if (sector.rsi > 70) {
      score -= 10 * SECTOR_WEIGHTS.momentum; // Overbought = satış sinyali
    }

    // 52 hafta yüksek oranı (10%)
    score += (sector.high52Ratio - 0.5) * 20 * SECTOR_WEIGHTS.momentum;

    // Hacim (15%)
    // Normalize edilmiş hacim skoru
    const volumeScore = Math.log10(sector.volume) / 10 * 5;
    score += volumeScore * SECTOR_WEIGHTS.volumeFlow;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Piyasa fazını belirle
   */
  private determineMarketPhase(sectors: Array<SectorData & { score: number }>): MarketPhase {
    let riskOnScore = 0;
    let riskOffScore = 0;

    for (const sector of sectors) {
      const info = SECTORS.find(s => s.code === sector.sector);
      if (!info) continue;

      if (info.isDefensive) {
        riskOffScore += sector.score;
      } else if (info.isCyclical) {
        riskOnScore += sector.score;
      }
    }

    // Normalize
    const defensiveCount = SECTORS.filter(s => s.isDefensive).length;
    const cyclicalCount = SECTORS.filter(s => s.isCyclical).length;

    const avgRiskOn = riskOnScore / Math.max(1, cyclicalCount);
    const avgRiskOff = riskOffScore / Math.max(1, defensiveCount);

    if (avgRiskOn > avgRiskOff + 10) {
      return 'RISK_ON';
    } else if (avgRiskOff > avgRiskOn + 10) {
      return 'RISK_OFF';
    }
    return 'TRANSITION';
  }

  /**
   * Faz analizi
   */
  private analyzePhase(
    sectors: Array<SectorData & { score: number }>,
    marketPhase: MarketPhase
  ): PhaseAnalysis {
    // Sektör dağılımı hesapla
    const sectorAllocation: Record<string, number> = {};

    // Başlangıç ağırlıkları
    const baseWeight = 1 / sectors.length;

    // Faz bazlı ağırlık ayarı
    const regimeConfig = MACRO_REGIME_ROTATION[marketPhase];

    for (const sector of sectors) {
      let weight = baseWeight;

      if (regimeConfig.favored.includes(sector.sector)) {
        weight = baseWeight * 1.5;
      } else if (regimeConfig.avoided.includes(sector.sector)) {
        weight = baseWeight * 0.5;
      }

      // Skor ayarı
      const scoreAdjustment = (sector.score - 50) / 100;
      weight = weight * (1 + scoreAdjustment);

      sectorAllocation[sector.sector] = weight;
    }

    // Normalize
    const total = Object.values(sectorAllocation).reduce((sum, w) => sum + w, 0);
    for (const key in sectorAllocation) {
      sectorAllocation[key] /= total;
    }

    // Defansif oran
    const defensiveSectors = sectors.filter(s => {
      const info = SECTORS.find(i => i.code === s.sector);
      return info?.isDefensive;
    });
    const defensiveRatio = defensiveSectors.reduce((sum, s) =>
      sum + (sectorAllocation[s.sector] || 0), 0);

    return {
      currentPhase: marketPhase,
      phaseConfidence: 0.75,
      sectorAllocation: sectorAllocation as Record<SectorCode, number>,
      defensiveRatio,
      description: this.getPhaseDescription(marketPhase, defensiveRatio),
    };
  }

  /**
   * Faz açıklaması
   */
  private getPhaseDescription(phase: MarketPhase, defensiveRatio: number): string {
    const ratio = (defensiveRatio * 100).toFixed(0);

    switch (phase) {
      case 'RISK_ON':
        return `Risk-On fazı. Siklikal sektörlere ağırlık veriliyor. Defansif oran: %${ratio}`;
      case 'RISK_OFF':
        return `Risk-Off fazı. Defansif sektörlere kaçış. Defansif oran: %${ratio}`;
      case 'TRANSITION':
        return `Geçiş fazı. Dengeli sektörel dağılım öneriliyor. Defansif oran: %${ratio}`;
      default:
        return 'Belirsiz faz';
    }
  }

  /**
   * Rotasyon tespiti
   */
  private detectRotation(
    sectors: Array<SectorData & { score: number }>,
    marketPhase: MarketPhase,
    phaseAnalysis: PhaseAnalysis
  ): SectorRotation {
    // Skor bazlı sıralama
    const sorted = [...sectors].sort((a, b) => b.score - a.score);
    const topSectors = sorted.slice(0, 5).map(s => s.sector);
    const bottomSectors = sorted.slice(-5).map(s => s.sector);

    // Faz bazlı ayar
    const regimeConfig = MACRO_REGIME_ROTATION[marketPhase];

    // Rotate-in: Yüksek skorlu + faz uyumlu
    let rotateIn = sorted
      .filter(s => regimeConfig.favored.includes(s.sector) && s.score > 55)
      .map(s => s.sector);

    if (rotateIn.length === 0) {
      rotateIn = topSectors.slice(0, 3);
    }

    // Rotate-out: Düşük skorlu + faz çelişkili
    let rotateOut = sorted
      .filter(s => regimeConfig.avoided.includes(s.sector) && s.score < 45)
      .map(s => s.sector);

    if (rotateOut.length === 0) {
      rotateOut = bottomSectors.slice(0, 2);
    }

    // Hold: Kalanlar
    const hold = sectors
      .filter(s => !rotateIn.includes(s.sector) && !rotateOut.includes(s.sector))
      .map(s => s.sector);

    // Ağırlık değişiklikleri
    const weightChanges = [];

    for (const sector of rotateIn) {
      const current = phaseAnalysis.sectorAllocation[sector] || 0.05;
      const target = Math.min(current * 1.5, SECTOR_WEIGHT_LIMITS.maxSectorWeight);
      weightChanges.push({
        sector,
        fromWeight: current,
        toWeight: target,
        reason: 'Faz uyumlu, güçlü momentum',
      });
    }

    for (const sector of rotateOut) {
      const current = phaseAnalysis.sectorAllocation[sector] || 0.05;
      const target = Math.max(current * 0.5, SECTOR_WEIGHT_LIMITS.minSectorWeight);
      weightChanges.push({
        sector,
        fromWeight: current,
        toWeight: target,
        reason: 'Faz çelişkili, zayıf momentum',
      });
    }

    return {
      rotateIn,
      rotateOut,
      hold,
      weightChanges,
    };
  }

  /**
   * Sinyaller oluştur
   */
  private generateSignals(
    sectors: Array<SectorData & { score: number }>,
    rotation: SectorRotation,
    marketPhase: MarketPhase
  ): SectorSignal[] {
    const signals: SectorSignal[] = [];

    // Rotate-in sinyalleri
    for (const sector of rotation.rotateIn) {
      const sectorData = sectors.find(s => s.sector === sector);
      if (!sectorData) continue;

      const factors: string[] = [];
      if (sectorData.momentum > 20) factors.push('Yüksek momentum');
      if (sectorData.relativeStrength > 105) factors.push('Güçlü göreceli güç');
      if (sectorData.trend === 'BULLISH') factors.push('Boğa trendi');
      if (sectorData.rsi < 40) factors.push('Aşırı satım bölgesi');

      signals.push({
        sector,
        type: 'ROTATE_IN',
        strength: Math.min(100, sectorData.score + 10),
        description: `${sectorData.name} sektörüne rotasyon önerisi`,
        factors,
      });
    }

    // Rotate-out sinyalleri
    for (const sector of rotation.rotateOut) {
      const sectorData = sectors.find(s => s.sector === sector);
      if (!sectorData) continue;

      const factors: string[] = [];
      if (sectorData.momentum < -20) factors.push('Zayıf momentum');
      if (sectorData.relativeStrength < 95) factors.push('Zayıf göreceli güç');
      if (sectorData.trend === 'BEARISH') factors.push('Ayı trendi');
      if (sectorData.rsi > 70) factors.push('Aşırı alım bölgesi');

      signals.push({
        sector,
        type: 'ROTATE_OUT',
        strength: Math.min(100, 100 - sectorData.score + 10),
        description: `${sectorData.name} sektöründen çıkış önerisi`,
        factors,
      });
    }

    // Faz değişikliği sinyali
    if (marketPhase === 'RISK_ON') {
      signals.push({
        sector: 'BANK',
        type: 'ENTRY',
        strength: 70,
        description: 'Risk-On fazı. Bankacılık ve siklikal sektörlere giriş',
        factors: ['Piyasa fazı değişikliği', 'Faiz beklentisi'],
      });
    } else if (marketPhase === 'RISK_OFF') {
      signals.push({
        sector: 'GYNA',
        type: 'ENTRY',
        strength: 70,
        description: 'Risk-Off fazı. Defansif sektörlere kaçış',
        factors: ['Piyasa fazı değişikliği', 'Güvenli liman arayışı'],
      });
    }

    return signals;
  }

  /**
   * Genel skor hesapla
   */
  private calculateOverallScore(
    sectors: Array<SectorData & { score: number }>,
    marketPhase: MarketPhase
  ): number {
    // Ortalama sektör skoru
    const avgSectorScore = sectors.reduce((sum, s) => sum + s.score, 0) / sectors.length;

    // Faz bonusu/cezası
    let phaseBonus = 0;
    if (marketPhase === 'RISK_ON') {
      // Yükselen piyasa bonusu
      phaseBonus = 5;
    } else if (marketPhase === 'RISK_OFF') {
      // Düşen piyasa cezası
      phaseBonus = -5;
    }

    return Math.max(0, Math.min(100, avgSectorScore + phaseBonus));
  }

  /**
   * Detaylar oluştur
   */
  private generateDetails(
    marketPhase: MarketPhase,
    topSectors: Array<SectorData & { score: number }>,
    bottomSectors: Array<SectorData & { score: number }>,
    rotation: SectorRotation
  ): string[] {
    const details: string[] = [];

    details.push(`Piyasa Fazı: ${marketPhase}`);
    details.push('');

    details.push('En Güçlü Sektörler:');
    for (const sector of topSectors) {
      details.push(`  ${sector.name}: ${sector.score.toFixed(0)}/100 (${sector.change > 0 ? '+' : ''}${sector.change.toFixed(1)}%)`);
    }

    details.push('');
    details.push('En Zayıf Sektörler:');
    for (const sector of bottomSectors) {
      details.push(`  ${sector.name}: ${sector.score.toFixed(0)}/100 (${sector.change > 0 ? '+' : ''}${sector.change.toFixed(1)}%)`);
    }

    details.push('');
    if (rotation.rotateIn.length > 0) {
      details.push(`Rotasyon Giriş: ${rotation.rotateIn.map(s => getSectorName(s)).join(', ')}`);
    }
    if (rotation.rotateOut.length > 0) {
      details.push(`Rotasyon Çıkış: ${rotation.rotateOut.map(s => getSectorName(s)).join(', ')}`);
    }

    return details;
  }
}

// ============ EXPORTS ============

/**
 * Singleton instance
 */
export const demeterEngine = DemeterEngine.getInstance();

// Convenience functions
export async function analyzeSectorRotation(sectors?: SectorData[]): Promise<DemeterResult> {
  return demeterEngine.analyze(sectors);
}

export async function getDemeterOpinion(symbol: string, sectors?: SectorData[]): Promise<DemeterOpinion> {
  return demeterEngine.getOpinion(symbol, sectors);
}

export async function getMarketPhase(sectors?: SectorData[]): Promise<MarketPhase> {
  return demeterEngine.getMarketPhase(sectors);
}

export async function getSectorAllocation(
  riskProfile?: 'conservative' | 'balanced' | 'aggressive'
): Promise<Record<SectorCode, number>> {
  return demeterEngine.getSectorAllocation(riskProfile);
}

export default {
  DemeterEngine,
  demeterEngine,
  analyzeSectorRotation,
  getDemeterOpinion,
  getMarketPhase,
  getSectorAllocation,
};
