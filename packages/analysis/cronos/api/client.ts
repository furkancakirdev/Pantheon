/**
 * Cronos API Client - Timing Data Fetcher
 *
 * Takvim ve piyasa saatleri verilerini çeker.
 */

import { HOLIDAYS, EARNINGS_MONTHS, QUARTER_END_MONTHS } from '../config';

// ============ DATA SOURCES ============

/**
 * Resmi tatilleri getir
 */
export async function fetchHolidays(): Promise<Array<{ month: number; day: number; name: string }>> {
  // Gerçek API entegrasyonu yakında eklenecek
  return HOLIDAYS;
}

/**
 * Bilanço aylarını getir
 */
export async function fetchEarningsMonths(): Promise<number[]> {
  // Gerçek API entegrasyonu yakında eklenecek
  return EARNINGS_MONTHS;
}

/**
 * Çeyrek son aylarını getir
 */
export async function fetchQuarterEndMonths(): Promise<number[]> {
  // Gerçek API entegrasyonu yakında eklenecek
  return QUARTER_END_MONTHS;
}

/**
 * Piyasa açık mı kontrol et
 */
export function isMarketOpen(date: Date = new Date()): boolean {
  const hour = date.getHours();
  const minute = date.getMinutes();
  const day = date.getDay();
  const time = hour + minute / 60;

  // Hafta sonu kapalı
  if (day === 0 || day === 6) return false;

  // İşlem saatleri: 10:00 - 12:00, 14:00 - 17:30
  if ((time >= 10 && time < 12) || (time >= 14 && time < 17.5)) {
    return true;
  }

  return false;
}

/**
 * Bir sonraki işlem gününü getir
 */
export function getNextTradingDay(date: Date = new Date()): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);

  while (next.getDay() === 0 || next.getDay() === 6) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

/**
 * İşlem günleri sayısı
 */
export function countTradingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

/**
 * Ayın işlem günü sayısını hesapla
 */
export function getTradingDaysInMonth(year: number, month: number): number {
  let count = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }

  return count;
}

// ============ CACHE ============

/**
 * Basit in-memory cache
 */
const cache = new Map<string, { data: any; expiry: number }>();

/**
 * Cache TTL (milisaniye)
 */
const CACHE_TTL = {
  HOLIDAYS: 7 * 24 * 60 * 60 * 1000,    // 1 hafta
  MARKET_HOURS: 24 * 60 * 60 * 1000, // 24 saat
};

/**
 * Cache'li tatilleri getir
 */
export async function fetchHolidaysCached(): Promise<Array<{ month: number; day: number; name: string }>> {
  const cacheKey = 'CRONOS_HOLIDAYS';
  const cached = cache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const data = await fetchHolidays();
  cache.set(cacheKey, {
    data,
    expiry: Date.now() + CACHE_TTL.HOLIDAYS,
  });

  return data;
}

/**
 * Cache'i temizle
 */
export function clearCache(): void {
  cache.clear();
}

export default {
  fetchHolidays,
  fetchEarningsMonths,
  fetchQuarterEndMonths,
  isMarketOpen,
  getNextTradingDay,
  countTradingDays,
  getTradingDaysInMonth,
  fetchHolidaysCached,
  clearCache,
};
