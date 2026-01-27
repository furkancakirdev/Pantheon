/**
 * Phoenix Engine - Strategy & Signal Scanning Module
 *
 * Strateji ve sinyal tarama motoru. Agora mimarisine uygun singleton pattern.
 * Argus Terminal Phoenix Scenario Engine'den esinlenilmiştir.
 *
 * Bileşenler:
 * - Golden/Death Cross Detection
 * - SMA Crossover Signals
 * - MACD Crossover Signals
 * - RSI Extremes Detection
 * - Volume Spike Detection
 * - Formation Detection (Perşembe modülü)
 * - Portfolio Monitoring
 * - Scanning Pipeline
 */

import type {
  Candle,
  PhoenixSignal,
  PhoenixSignalType,
  PriceLevel,
  RiskLevel,
  PhoenixResult,
  PhoenixOpinion,
  PhoenixScanResult,
  PhoenixCandidate,
  PhoenixReport,
  PortfolioMonitorResult,
  PhoenixMode,
  Recommendation,
} from './types';

import {
  getLetterGrade,
  getVerdict,
  getRiskLevel,
  getStanceFromSignals,
  scoreToOpinion,
  generateSummary,
} from './types';

import {
  SCORING_WEIGHTS,
  SIGNAL_STRENGTH,
  SIGNAL_PENALTY,
  MODE_SCORE_THRESHOLDS,
  MODE_FILTERS,
  SMA_PERIODS,
  MACD_PARAMS,
  RSI_PARAMS,
  VOLUME_PARAMS,
  PORTFOLIO_THRESHOLDS,
  INFORMATION_QUALITY,
} from './config';

// ============ PHOENIX ENGINE ============

/**
 * Phoenix Engine - Singleton
 */
export class PhoenixEngine {
  private static instance: PhoenixEngine;

  private constructor() {}

  public static getInstance(): PhoenixEngine {
    if (!PhoenixEngine.instance) {
      PhoenixEngine.instance = new PhoenixEngine();
    }
    return PhoenixEngine.instance;
  }

  /**
   * Sinyal analizi yap
   *
   * @param symbol - Sembol
   * @param candles - OHLCV verileri
   * @returns PhoenixResult
   */
  public analyze(
    symbol: string,
    candles: Candle[]
  ): PhoenixResult {
    const now = new Date();

    // 1. Sinyalleri tespit et
    const signals = this.detectSignals(candles);

    // 2. Güçlü sinyalleri ayır
    const bullishSignals = signals.filter(s => s.bullish && s.strength >= 6);
    const bearishSignals = signals.filter(s => !s.bullish && s.strength >= 6);

    // 3. Destek/Direnç seviyeleri
    const levels = this.detectSupportResistance(candles);

    // 4. Skor hesapla (0-100)
    const score = this.calculateScore(signals);

    // 5. Karar
    const verdict = getVerdict(score);
    const letterGrade = getLetterGrade(score);

    // 6. Risk seviyesi
    const riskLevel = getRiskLevel(bearishSignals.length, bullishSignals.length);

    // 7. Detaylar
    const details = this.generateDetails(signals, score, riskLevel);

    const summary = generateSummary(signals, score, riskLevel);

    const currentPrice = candles.length > 0 ? candles[candles.length - 1].close : 0;

    return {
      symbol,
      score,
      letterGrade,
      verdict,
      signals,
      levels,
      riskLevel,
      bullishSignals,
      bearishSignals,
      currentPrice,
      details,
      summary,
      timestamp: now,
    };
  }

  /**
   * Sembol için Council Opinion üret
   *
   * @param symbol - Sembol
   * @param candles - OHLCV verileri
   * @returns PhoenixOpinion
   */
  public getOpinion(
    symbol: string,
    candles: Candle[]
  ): PhoenixOpinion {
    const result = this.analyze(symbol, candles);
    return scoreToOpinion(symbol, result.score, result.signals, result.riskLevel);
  }

  /**
   * Sinyalleri tespit et
   */
  public detectSignals(candles: Candle[]): PhoenixSignal[] {
    const signals: PhoenixSignal[] = [];

    if (candles.length < 20) {
      return signals;
    }

    // 1. Golden/Death Cross
    const cross = this.detectCross(candles);
    if (cross.goldenCross) {
      signals.push({
        type: 'GOLDEN_CROSS',
        strength: SIGNAL_STRENGTH.GOLDEN_CROSS,
        description: 'Golden Cross: SMA50 SMA200\'ü yukarı kırdı',
        bullish: true,
      });
    } else if (cross.deathCross) {
      signals.push({
        type: 'DEATH_CROSS',
        strength: SIGNAL_STRENGTH.DEATH_CROSS,
        description: 'Death Cross: SMA50 SMA200\'ü aşağı kırdı',
        bullish: false,
      });
    }

    // 2. SMA Crossover (kısa vade)
    const smaCross = this.detectSMACross(candles);
    if (smaCross.bullish) {
      signals.push({
        type: 'SMA_CROSS',
        strength: SIGNAL_STRENGTH.SMA_CROSS,
        description: 'SMA20 > SMA50 cross (kısa vade AL)',
        bullish: true,
      });
    } else if (smaCross.bearish) {
      signals.push({
        type: 'SMA_CROSS',
        strength: SIGNAL_STRENGTH.SMA_CROSS,
        description: 'SMA20 < SMA50 cross (kısa vade SAT)',
        bullish: false,
      });
    }

    // 3. MACD Cross
    const macdCross = this.detectMACDCross(candles);
    if (macdCross.bullish) {
      signals.push({
        type: 'MACD_CROSS',
        strength: SIGNAL_STRENGTH.MACD_CROSS,
        description: 'MACD bullish crossover',
        bullish: true,
      });
    } else if (macdCross.bearish) {
      signals.push({
        type: 'MACD_CROSS',
        strength: SIGNAL_STRENGTH.MACD_CROSS,
        description: 'MACD bearish crossover',
        bullish: false,
      });
    }

    // 4. RSI Extremes
    const rsi = this.detectRSI(candles);
    if (rsi.oversold) {
      signals.push({
        type: 'RSI_OVERSOLD',
        strength: SIGNAL_STRENGTH.RSI_OVERSOLD,
        description: `RSI aşırı satım (${rsi.value.toFixed(1)})`,
        bullish: true,
      });
    } else if (rsi.overbought) {
      signals.push({
        type: 'RSI_OVERBOUGHT',
        strength: SIGNAL_STRENGTH.RSI_OVERBOUGHT,
        description: `RSI aşırı alım (${rsi.value.toFixed(1)})`,
        bullish: false,
      });
    }

    // 5. Hacim Spike
    const volume = this.detectVolumeSpike(candles);
    if (volume.spike) {
      signals.push({
        type: 'VOLUME_SPIKE',
        strength: SIGNAL_STRENGTH.VOLUME_SPIKE,
        description: `Hacim spike (${volume.ratio.toFixed(1)}x ortalama)`,
        bullish: true,
      });
    }

    return signals.sort((a, b) => b.strength - a.strength);
  }

  /**
   * Portföy izleme
   *
   * @param portfolio - Portföy pozisyonları
   * @param candlesMap - Sembol → Candle[] mapping
   * @returns PortfolioMonitorResult[]
   */
  public monitorPortfolio(
    portfolio: Array<{ symbol: string; entryPrice: number; quantity: number }>,
    candlesMap: Map<string, Candle[]>
  ): PortfolioMonitorResult[] {
    const results: PortfolioMonitorResult[] = [];

    for (const position of portfolio) {
      const candles = candlesMap.get(position.symbol);
      if (!candles || candles.length < 20) continue;

      const currentPrice = candles[candles.length - 1].close;
      const signals = this.detectSignals(candles);

      const pnl = (currentPrice - position.entryPrice) * position.quantity;
      const pnlPercent = ((currentPrice - position.entryPrice) / position.entryPrice) * 100;

      // Tavsiye hesapla
      const recommendation = this.calculateRecommendation(signals, pnlPercent);

      results.push({
        symbol: position.symbol,
        currentPrice,
        pnl,
        pnlPercent,
        signals,
        recommendation,
      });
    }

    return results;
  }

  /**
   * Tarama Pipeline'ını çalıştır
   *
   * @param mode - Tarama modu
   * @param universe - Taranacak evren
   * @param candlesMap - Sembol → Candle[] mapping
   * @returns PhoenixScanResult
   */
  public runPipeline(
    mode: PhoenixMode,
    universe: Array<{ symbol: string; price: number; change: number }>,
    candlesMap: Map<string, Candle[]>
  ): PhoenixScanResult {
    // Mod bazlı filtreler
    const filters = MODE_FILTERS[mode];

    // 1. Level 0: Evren Taraması (Filtreleme)
    let candidates = universe.filter(item => {
      // Fiyat filtresi
      if (item.price < filters.minPrice) return false;

      // Değişim filtresi
      if (Math.abs(item.change) < filters.minChange) return false;
      if (Math.abs(item.change) > filters.maxChange) return false;

      return true;
    });

    const filtered = candidates.length;

    // 2. Shortlist Seçimi
    const sorted = candidates.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
    const shortlist = sorted.slice(0, filters.shortlistLimit);

    // 3. Level 1: Sinyal Analizi
    const verified: PhoenixCandidate[] = [];
    const scoreThreshold = MODE_SCORE_THRESHOLDS[mode];

    for (const item of shortlist) {
      const candles = candlesMap.get(item.symbol);
      if (!candles || candles.length < 20) continue;

      const result = this.analyze(item.symbol, candles);

      if (result.score >= scoreThreshold) {
        verified.push({
          symbol: item.symbol,
          lastPrice: result.currentPrice,
          score: result.score,
          reason: result.summary,
          signals: result.signals,
          riskLevel: result.riskLevel,
        });
      }
    }

    // Skora göre sırala
    verified.sort((a, b) => b.score - a.score);

    // Rapor
    const report: PhoenixReport = {
      mode,
      scanned: universe.length,
      filtered,
      shortlisted: shortlist.length,
      verified: verified.length,
      timestamp: new Date().toISOString(),
    };

    return { candidates: verified, report };
  }

  /**
   * Hızlı tarama - Sadece güçlü sinyaller
   *
   * @param universe - Taranacak evren
   * @param candlesMap - Sembol → Candle[] mapping
   * @returns PhoenixCandidate[]
   */
  public quickScan(
    universe: Array<{ symbol: string; price: number }>,
    candlesMap: Map<string, Candle[]>
  ): PhoenixCandidate[] {
    const results: PhoenixCandidate[] = [];

    for (const item of universe) {
      if (item.price < 5) continue; // Penny filtre

      const candles = candlesMap.get(item.symbol);
      if (!candles || candles.length < 50) continue;

      const result = this.analyze(item.symbol, candles);

      // En az 2 güçlü boğa sinyali
      if (result.bullishSignals.length >= 2) {
        results.push({
          symbol: item.symbol,
          lastPrice: result.currentPrice,
          score: result.score,
          reason: result.summary,
          signals: result.signals,
          riskLevel: result.riskLevel,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  // ============ PRIVATE METHODS ============

  /**
   * Skor hesapla (0-100)
   */
  private calculateScore(signals: PhoenixSignal[]): number {
    let score = 50; // Baz skor

    for (const signal of signals) {
      if (signal.bullish) {
        score += signal.strength;
      } else {
        score -= signal.strength * 0.5; // Ayı sinyalleri daha az ceza
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Golden/Death Cross tespiti
   */
  private detectCross(candles: Candle[]): { goldenCross: boolean; deathCross: boolean } {
    if (candles.length < SMA_PERIODS.LONG) {
      return { goldenCross: false, deathCross: false };
    }

    const closes = candles.map(c => c.close);
    const sma50 = this.calculateSMA(closes, SMA_PERIODS.MEDIUM);
    const sma200 = this.calculateSMA(closes, SMA_PERIODS.LONG);

    if (sma50.length < 2 || sma200.length < 2) {
      return { goldenCross: false, deathCross: false };
    }

    const last50 = sma50[sma50.length - 1];
    const last200 = sma200[sma200.length - 1];
    const prev50 = sma50[sma50.length - 2];
    const prev200 = sma200[sma200.length - 2];

    const goldenCross = prev50 <= prev200 && last50 > last200;
    const deathCross = prev50 >= prev200 && last50 < last200;

    return { goldenCross, deathCross };
  }

  /**
   * SMA Crossover tespiti
   */
  private detectSMACross(candles: Candle[]): { bullish: boolean; bearish: boolean } {
    if (candles.length < SMA_PERIODS.MEDIUM) {
      return { bullish: false, bearish: false };
    }

    const closes = candles.map(c => c.close);
    const sma20 = this.calculateSMA(closes, SMA_PERIODS.SHORT);
    const sma50 = this.calculateSMA(closes, SMA_PERIODS.MEDIUM);

    if (sma20.length < 2 || sma50.length < 2) {
      return { bullish: false, bearish: false };
    }

    const last20 = sma20[sma20.length - 1];
    const last50 = sma50[sma50.length - 1];
    const prev20 = sma20[sma20.length - 2];
    const prev50 = sma50[sma50.length - 2];

    const bullish = prev20 <= prev50 && last20 > last50;
    const bearish = prev20 >= prev50 && last20 < last50;

    return { bullish, bearish };
  }

  /**
   * MACD Crossover tespiti
   */
  private detectMACDCross(candles: Candle[]): { bullish: boolean; bearish: boolean } {
    if (candles.length < MACD_PARAMS.SLOW + MACD_PARAMS.SIGNAL) {
      return { bullish: false, bearish: false };
    }

    const closes = candles.map(c => c.close);
    const { macdLine, signalLine } = this.calculateMACD(closes);

    if (macdLine.length < 2 || signalLine.length < 2) {
      return { bullish: false, bearish: false };
    }

    const lastDiff = macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1];
    const prevDiff = macdLine[macdLine.length - 2] - signalLine[signalLine.length - 2];

    return {
      bullish: prevDiff <= 0 && lastDiff > 0,
      bearish: prevDiff >= 0 && lastDiff < 0,
    };
  }

  /**
   * RSI tespiti
   */
  private detectRSI(candles: Candle[]): { oversold: boolean; overbought: boolean; value: number } {
    if (candles.length < RSI_PARAMS.PERIOD + 1) {
      return { oversold: false, overbought: false, value: 50 };
    }

    const closes = candles.map(c => c.close);
    let gains = 0;
    let losses = 0;

    for (let i = closes.length - RSI_PARAMS.PERIOD; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / RSI_PARAMS.PERIOD;
    const avgLoss = losses / RSI_PARAMS.PERIOD;

    let rsi = 50;
    if (avgLoss > 0) {
      const rs = avgGain / avgLoss;
      rsi = 100 - (100 / (1 + rs));
    }

    return {
      oversold: rsi < RSI_PARAMS.OVERSOLD,
      overbought: rsi > RSI_PARAMS.OVERBOUGHT,
      value: rsi,
    };
  }

  /**
   * Hacim spike tespiti
   */
  private detectVolumeSpike(candles: Candle[]): { spike: boolean; ratio: number } {
    if (candles.length < VOLUME_PARAMS.SPIKE_PERIOD) {
      return { spike: false, ratio: 1 };
    }

    const lastN = candles.slice(-VOLUME_PARAMS.SPIKE_PERIOD);
    const avgVolume = lastN.reduce((a, b) => a + b.volume, 0) / VOLUME_PARAMS.SPIKE_PERIOD;
    const lastVolume = candles[candles.length - 1].volume;

    const ratio = avgVolume > 0 ? lastVolume / avgVolume : 1;

    return {
      spike: ratio >= VOLUME_PARAMS.SPIKE_RATIO,
      ratio,
    };
  }

  /**
   * Destek/Direnç tespiti
   */
  private detectSupportResistance(candles: Candle[]): PriceLevel[] {
    const levels: PriceLevel[] = [];
    // Basit pivot point tespiti
    // Daha gelişmiş versiyon Perşembe modülünden gelebilir
    return levels;
  }

  /**
   * Portföy tavsiyesi hesapla
   */
  private calculateRecommendation(
    signals: PhoenixSignal[],
    pnlPercent: number
  ): Recommendation {
    const bearishCount = signals.filter(s => !s.bullish && s.strength >= 7).length;
    const bullishCount = signals.filter(s => s.bullish && s.strength >= 7).length;

    // Kar realizasyonu
    if (pnlPercent > PORTFOLIO_THRESHOLDS.TAKE_PROFIT_PNL && bearishCount >= 1) {
      return 'TAKE_PROFIT';
    }

    // Stop loss / Satış
    if (bearishCount >= PORTFOLIO_THRESHOLDS.BEARISH_SIGNALS_COUNT) {
      return 'SELL';
    }

    // Pozisyon ekleme
    if (bullishCount >= PORTFOLIO_THRESHOLDS.BULLISH_SIGNALS_COUNT && pnlPercent < PORTFOLIO_THRESHOLDS.ADD_POSITION_PNL) {
      return 'ADD_POSITION';
    }

    // Alım
    if (bullishCount >= 3) {
      return 'BUY';
    }

    return 'HOLD';
  }

  /**
   * SMA hesapla
   */
  private calculateSMA(data: number[], period: number): number[] {
    const result: number[] = [];
    for (let i = period - 1; i < data.length; i++) {
      const slice = data.slice(i - period + 1, i + 1);
      result.push(slice.reduce((a, b) => a + b, 0) / period);
    }
    return result;
  }

  /**
   * EMA hesapla
   */
  private calculateEMA(data: number[], period: number): number[] {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);

    let ema = data[0];
    for (let i = 0; i < data.length; i++) {
      ema = data[i] * multiplier + ema * (1 - multiplier);
      result.push(ema);
    }
    return result;
  }

  /**
   * MACD hesapla
   */
  private calculateMACD(closes: number[]): { macdLine: number[]; signalLine: number[] } {
    const ema12 = this.calculateEMA(closes, MACD_PARAMS.FAST);
    const ema26 = this.calculateEMA(closes, MACD_PARAMS.SLOW);

    // MACD line = EMA12 - EMA26 (align shorter array)
    const macdLine: number[] = [];
    const offset = ema12.length - ema26.length;
    for (let i = 0; i < ema26.length; i++) {
      macdLine.push(ema12[i + offset] - ema26[i]);
    }

    // Signal line = 9-period EMA of MACD
    const signalLine = this.calculateEMA(macdLine, MACD_PARAMS.SIGNAL);

    return { macdLine, signalLine };
  }

  /**
   * Detaylar oluştur
   */
  private generateDetails(
    signals: PhoenixSignal[],
    score: number,
    riskLevel: RiskLevel
  ): string[] {
    const details: string[] = [];

    const bullishCount = signals.filter(s => s.bullish).length;
    const bearishCount = signals.filter(s => !s.bullish).length;

    details.push(`Toplam Sinyal: ${signals.length}`);
    details.push(`Boğa: ${bullishCount}, Ayı: ${bearishCount}`);
    details.push(`Skor: ${score.toFixed(0)}/100`);
    details.push(`Risk: ${riskLevel}`);

    // Top 3 sinyal
    const topSignals = signals.slice(0, 3);
    for (const signal of topSignals) {
      details.push(`${signal.type}: ${signal.description}`);
    }

    return details;
  }
}

// ============ EXPORTS ============

/**
 * Singleton instance
 */
export const phoenixEngine = PhoenixEngine.getInstance();

// Convenience functions
export function analyzeSignals(
  symbol: string,
  candles: Candle[]
): PhoenixResult {
  return phoenixEngine.analyze(symbol, candles);
}

export function getPhoenixOpinion(
  symbol: string,
  candles: Candle[]
): PhoenixOpinion {
  return phoenixEngine.getOpinion(symbol, candles);
}

export function quickScan(
  universe: Array<{ symbol: string; price: number }>,
  candlesMap: Map<string, Candle[]>
): PhoenixCandidate[] {
  return phoenixEngine.quickScan(universe, candlesMap);
}

export default {
  PhoenixEngine,
  phoenixEngine,
  analyzeSignals,
  getPhoenixOpinion,
  quickScan,
};
