/**
 * Cronos Engine - Timing & Cycle Analysis Module
 *
 * Zamanlama faktörü motoru. Agora mimarisine uygun singleton pattern.
 *
 * Bileşenler:
 * - Saat Analizi (Gün içi volatilite)
 * - Haftanın Günü Analizi
 * - Ay/Çeyrek Sonu Analizi
 * - Kazanç Sezonu Analizi
 * - Tatil/Özel Gün Analizi
 * - Genel Volatilite Analizi
 *
 * "Ne zaman aldığın, ne aldığın kadar önemli."
 */

import type {
  TimingType,
  TimingRecommendation,
  CronosFactor,
  Verdict,
  CronosResult,
  CronosOpinion,
  MarketHourInfo,
} from './types';

import {
  getLetterGrade,
  getVerdict,
  getTimingType,
  verdictToAction,
  scoreToOpinion,
  generateSummary,
  getMarketHourInfo,
} from './types';

import {
  FACTOR_WEIGHTS,
  HOUR_SCORES,
  DAY_SCORES,
  MONTH_END_SCORES,
  EARNINGS_SCORES,
  SCORE_THRESHOLDS,
  INFORMATION_QUALITY,
  OPTIMAL_HOURS,
  MARKET_HOURS,
  LUNCH_HOURS,
  BIST_HOURS,
  EARNINGS_MONTHS,
  QUARTER_END_MONTHS,
  HOLIDAYS,
  YEAR_END_PERIOD,
} from './config';

// ============ CRONOS ENGINE ============

/**
 * Cronos Engine - Singleton
 */
export class CronosEngine {
  private static instance: CronosEngine;

  private constructor() {}

  public static getInstance(): CronosEngine {
    if (!CronosEngine.instance) {
      CronosEngine.instance = new CronosEngine();
    }
    return CronosEngine.instance;
  }

  /**
   * Zamanlama analizi yap
   *
   * @param date - Tarih (varsayılan: bugün)
   * @returns CronosResult
   */
  public analyze(date: Date = new Date()): CronosResult {
    const now = new Date();

    // 1. Faktörleri hesapla
    const factors: CronosFactor[] = [];

    // Saat Faktörü
    const hourFactor = this.analyzeHour(date);
    factors.push({
      name: 'Saat',
      ...hourFactor,
      weight: FACTOR_WEIGHTS.hour,
    });

    // Gün Faktörü
    const dayFactor = this.analyzeDayOfWeek(date);
    factors.push({
      name: 'Haftanın Günü',
      ...dayFactor,
      weight: FACTOR_WEIGHTS.dayOfWeek,
    });

    // Ay Sonu Faktörü
    const monthEndFactor = this.analyzeMonthEnd(date);
    factors.push({
      name: 'Ay/Çeyrek Sonu',
      ...monthEndFactor,
      weight: FACTOR_WEIGHTS.monthEnd,
    });

    // Kazanç Sezonu Faktörü
    const earningsFactor = this.analyzeEarningsSeason(date);
    factors.push({
      name: 'Kazanç Sezonu',
      ...earningsFactor,
      weight: FACTOR_WEIGHTS.earningsSeason,
    });

    // Tatil Faktörü
    const holidayFactor = this.analyzeHolidays(date);
    factors.push({
      name: 'Tatil/Özel Gün',
      ...holidayFactor,
      weight: FACTOR_WEIGHTS.holiday,
    });

    // Volatilite Faktörü (genel)
    const volFactor = { score: 60, description: 'Normal volatilite' };
    factors.push({
      name: 'Volatilite',
      ...volFactor,
      weight: FACTOR_WEIGHTS.volatility,
    });

    // 2. Skor hesapla (ağırlıklı toplam)
    const score = factors.reduce(
      (sum, f) => sum + f.score * f.weight / 100,
      0
    );

    // 3. Karar
    const verdict = getVerdict(score);
    const letterGrade = getLetterGrade(score);

    // 4. Zamanlama
    const timing = getTimingType(score);

    // 5. Tavsiye
    const recommendation = this.getRecommendation(score);

    // 6. En iyi/en kötü faktör
    const sorted = [...factors].sort((a, b) => b.score - a.score);
    const bestFactor = sorted[0];
    const worstFactor = sorted[sorted.length - 1];

    // 7. Detaylar
    const details = this.generateDetails(factors, timing);

    const summary = generateSummary(timing, bestFactor, worstFactor);

    return {
      date,
      score,
      letterGrade,
      verdict,
      timing,
      recommendation,
      factors,
      bestFactor,
      worstFactor,
      details,
      summary,
      timestamp: now,
    };
  }

  /**
   * Sembol için Council Opinion üret
   *
   * @param symbol - Semböl (cronos global timing olduğu için ignored)
   * @param date - Tarih
   * @returns CronosOpinion
   */
  public getOpinion(symbol: string, date: Date = new Date()): CronosOpinion {
    const result = this.analyze(date);
    return scoreToOpinion(date, result.score, result.factors);
  }

  /**
   * Piyasa saati bilgisini getir
   *
   * @param date - Tarih
   * @returns MarketHourInfo
   */
  public getMarketHourInfo(date: Date = new Date()): MarketHourInfo {
    return getMarketHourInfo(date);
  }

  /**
   * Optimal işlem saatlerini getir
   *
   * @returns Array<{start: number, end: number, name: string}>
   */
  public getOptimalHours(): Array<{
    start: number;
    end: number;
    name: string;
  }> {
    return [
      { start: OPTIMAL_HOURS.morning.start, end: OPTIMAL_HOURS.morning.end, name: 'Sabah' },
      { start: OPTIMAL_HOURS.afternoon.start, end: OPTIMAL_HOURS.afternoon.end, name: 'Öğle' },
    ];
  }

  /**
   * Bu hafta için optimal günleri getir
   *
   * @returns Array<{day: number, name: string, score: number}>
   */
  public getOptimalDaysThisWeek(startDate: Date = new Date()): Array<{
    day: number;
    name: string;
    score: number;
  }> {
    const days = [
      { day: 1, name: 'Pazartesi', score: DAY_SCORES.monday },
      { day: 2, name: 'Salı', score: DAY_SCORES.tuesday },
      { day: 3, name: 'Çarşamba', score: DAY_SCORES.wednesday },
      { day: 4, name: 'Perşembe', score: DAY_SCORES.thursday },
      { day: 5, name: 'Cuma', score: DAY_SCORES.friday },
    ];

    return days.sort((a, b) => b.score - a.score);
  }

  /**
   * Yaklaşan önemli tarihleri getir
   *
   * @param days - Kaç gün ileriye bakılacak
   * @returns Array<{date: Date, name: string, type: string}>
   */
  public getUpcomingEvents(days: number = 30): Array<{
    date: Date;
    name: string;
    type: 'HOLIDAY' | 'QUARTER_END' | 'MONTH_END' | 'EARNINGS';
  }> {
    const events: Array<{
      date: Date;
      name: string;
      type: 'HOLIDAY' | 'QUARTER_END' | 'MONTH_END' | 'EARNINGS';
    }> = [];

    const now = new Date();

    for (let i = 0; i <= days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      date.setHours(12, 0, 0, 0);

      const day = date.getDate();
      const month = date.getMonth();
      const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate();

      // Çeyrek sonu
      if (QUARTER_END_MONTHS.includes(month as any) && day >= daysInMonth - 2) {
        events.push({
          date,
          name: 'Çeyrek Sonu',
          type: 'QUARTER_END',
        });
      }

      // Ay sonu (çeyrek sonu değilse)
      else if (day >= daysInMonth - 2 && !QUARTER_END_MONTHS.includes(month as any)) {
        events.push({
          date,
          name: 'Ay Sonu',
          type: 'MONTH_END',
        });
      }

      // Resmi tatiller
      for (const holiday of HOLIDAYS) {
        if (month === holiday.month && Math.abs(day - holiday.day) <= 1) {
          events.push({
            date,
            name: holiday.name,
            type: 'HOLIDAY',
          });
        }
      }
    }

    return events;
  }

  // ============ PRIVATE METHODS ============

  /**
   * Saat faktörü analizi
   */
  private analyzeHour(date: Date): { score: number; description: string } {
    const hour = date.getHours();
    const minute = date.getMinutes();
    const time = hour + minute / 60;

    // Optimal saatler
    if (
      (time >= OPTIMAL_HOURS.morning.start && time <= OPTIMAL_HOURS.morning.end) ||
      (time >= OPTIMAL_HOURS.afternoon.start && time <= OPTIMAL_HOURS.afternoon.end)
    ) {
      return { score: HOUR_SCORES.optimal, description: 'Optimal işlem saati' };
    }

    // Açılış volatilitesi
    if (time >= MARKET_HOURS.preMarket.start && time < MARKET_HOURS.preMarket.end) {
      return { score: HOUR_SCORES.opening, description: 'Açılış volatilitesi - dikkat' };
    }

    // Kapanış
    if (time >= MARKET_HOURS.closing.start && time <= MARKET_HOURS.closing.end) {
      return { score: HOUR_SCORES.closing, description: 'Kapanış saatı' };
    }

    // Öğle arası
    if (time >= LUNCH_HOURS.start && time <= LUNCH_HOURS.end) {
      return { score: HOUR_SCORES.lunch, description: 'Öğle arası - düşük hacim' };
    }

    // Piyasa kapalı
    if (time < MARKET_HOURS.preMarket.start || time > MARKET_HOURS.afterHours.end) {
      return { score: HOUR_SCORES.closed, description: 'Piyasa kapalı' };
    }

    return { score: HOUR_SCORES.normal, description: 'Normal işlem saati' };
  }

  /**
   * Haftanın günü analizi
   */
  private analyzeDayOfWeek(date: Date): { score: number; description: string } {
    const day = date.getDay();

    switch (day) {
      case 1: // Pazartesi
        return { score: DAY_SCORES.monday, description: 'Pazartesi efekti - dikkat' };
      case 2: // Salı
        return { score: DAY_SCORES.tuesday, description: 'Salı - olumlu' };
      case 3: // Çarşamba
        return { score: DAY_SCORES.wednesday, description: 'Çarşamba - optimal' };
      case 4: // Perşembe
        return { score: DAY_SCORES.thursday, description: 'Perşembe - olumlu' };
      case 5: // Cuma
        return { score: DAY_SCORES.friday, description: 'Cuma - hafta sonu riski' };
      default: // Hafta sonu
        return { score: DAY_SCORES.weekend, description: 'Hafta sonu - piyasa kapalı' };
    }
  }

  /**
   * Ay sonu analizi
   */
  private analyzeMonthEnd(date: Date): { score: number; description: string } {
    const day = date.getDate();
    const month = date.getMonth();
    const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate();

    // Son 3 gün
    if (day >= daysInMonth - 2) {
      // Çeyrek sonu mu?
      const isQuarterEnd = QUARTER_END_MONTHS.includes(month as any);
      if (isQuarterEnd) {
        return {
          score: MONTH_END_SCORES.quarterEnd,
          description: 'Çeyrek sonu - window dressing',
        };
      }
      return { score: MONTH_END_SCORES.monthEnd, description: 'Ay sonu - portföy düzenlemesi' };
    }

    // Ay başı (ilk 3 gün)
    if (day <= 3) {
      return { score: MONTH_END_SCORES.monthStart, description: 'Ay başı - yeni alımlar' };
    }

    return { score: MONTH_END_SCORES.normal, description: 'Ay ortası - normal' };
  }

  /**
   * Kazanç sezonu analizi
   */
  private analyzeEarningsSeason(date: Date): { score: number; description: string } {
    const month = date.getMonth();

    // Bilanço ayları
    if (EARNINGS_MONTHS.includes(month as any)) {
      return { score: EARNINGS_SCORES.earnings, description: 'Bilanço sezonu - volatilite yüksek' };
    }

    // Bilanço öncesi
    if (EARNINGS_MONTHS.includes((month + 1) % 12)) {
      return { score: EARNINGS_SCORES.preEarnings, description: 'Bilanço öncesi - beklenti dönemi' };
    }

    return { score: EARNINGS_SCORES.normal, description: 'Normal dönem' };
  }

  /**
   * Tatil analizi
   */
  private analyzeHolidays(date: Date): { score: number; description: string } {
    const month = date.getMonth();
    const day = date.getDate();

    // Yılbaşı dönemi
    if (
      (month === YEAR_END_PERIOD.startMonth && day >= YEAR_END_PERIOD.startDay) ||
      (month === YEAR_END_PERIOD.endMonth && day <= YEAR_END_PERIOD.endDay)
    ) {
      if (month === YEAR_END_PERIOD.startMonth) {
        return { score: 40, description: 'Yılbaşı yaklaşıyor - düşük hacim' };
      }
      return { score: 45, description: 'Yeni yıl - düşük hacim' };
    }

    // Resmi tatiller
    for (const holiday of HOLIDAYS) {
      if (month === holiday.month && Math.abs(day - holiday.day) <= 1) {
        return { score: 50, description: `Resmi tatil: ${holiday.name}` };
      }
    }

    return { score: 75, description: 'Normal gün' };
  }

  /**
   * Tavsiye hesapla
   */
  private getRecommendation(score: number): TimingRecommendation {
    if (score >= 70) return 'BUY';
    if (score >= 55) return 'HOLD';
    if (score >= 40) return 'WAIT';
    return 'SELL';
  }

  /**
   * Detaylar oluştur
   */
  private generateDetails(factors: CronosFactor[], timing: TimingType): string[] {
    const details: string[] = [];

    details.push(`Zamanlama: ${timing}`);

    for (const factor of factors) {
      details.push(`${factor.name}: ${factor.description} (${factor.score}/100)`);
    }

    return details;
  }
}

// ============ EXPORTS ============

/**
 * Singleton instance
 */
export const cronosEngine = CronosEngine.getInstance();

// Convenience functions
export function analyzeTiming(date?: Date): CronosResult {
  return cronosEngine.analyze(date);
}

export function getCronosOpinion(symbol: string, date?: Date): CronosOpinion {
  return cronosEngine.getOpinion(symbol, date);
}

export default {
  CronosEngine,
  cronosEngine,
  analyzeTiming,
  getCronosOpinion,
};
