/**
 * Cronos Module Configuration - Timing & Cycle Analysis
 *
 * Cronos modülü konfigürasyon sabitleri ve ayarları.
 * Zamanlama faktörleri için parametreler.
 */

// ============ SKORLAMA AYARLARI ============

/**
 * Faktör ağırlıkları
 */
export const FACTOR_WEIGHTS = {
  hour: 20,          // Saat (gün içi volatilite)
  dayOfWeek: 20,     // Haftanın günü
  monthEnd: 20,      // Ay/Çeyrek sonu (window dressing)
  earningsSeason: 20, // Kazanç sezonu
  holiday: 10,       // Tatil/Özel günler
  volatility: 10,    // Genel volatilite
} as const;

/**
 * Saat bazlı skorlar
 */
export const HOUR_SCORES = {
  optimal: 85,       // 10:00-11:30, 14:00-15:30
  opening: 50,       // 09:30-10:00 (açılış volatilitesi)
  closing: 60,       // 17:00-18:00
  lunch: 70,          // 12:00-13:30 (öğle arası)
  normal: 65,        // Diğer işlem saatleri
  closed: 40,        // Piyasa kapalı
} as const;

/**
 * Gün bazlı skorlar
 */
export const DAY_SCORES = {
  monday: 55,        // Pazartesi efekti
  tuesday: 75,       // Salı
  wednesday: 80,     // Çarşamba (optimal)
  thursday: 75,      // Perşembe
  friday: 60,        // Cuma (hafta sonu riski)
  weekend: 20,       // Hafta sonu
} as const;

/**
 * Ay sonu skorları
 */
export const MONTH_END_SCORES = {
  quarterEnd: 45,    // Çeyrek sonu (window dressing)
  monthEnd: 55,      // Ay sonu
  monthStart: 70,    // Ay başı
  normal: 65,        // Ay ortası
} as const;

/**
 * Kazanç sezonu skorları
 */
export const EARNINGS_SCORES = {
  earnings: 50,      // Bilanço sezonu
  preEarnings: 60,   // Bilanço öncesi
  normal: 70,        // Normal dönem
} as const;

// ============ SKOR ESİKLERİ ============

/**
 * Skor threshold'ları
 */
export const SCORE_THRESHOLDS = {
  EXCELLENT: 75,     // Mükemmel zamanlama
  GOOD: 60,          // İyi zamanlama
  FAIR: 45,          // Nötr zamanlama
  POOR: 30,          // Zayıf zamanlama
} as const;

/**
 * Harf notu threshold'ları
 */
export const GRADE_THRESHOLDS = {
  A: 75,             // Mükemmel zamanlama
  B: 60,             // İyi zamanlama
  C: 45,             // Nötr zamanlama
  D: 30,             // Zayıf zamanlama
} as const;

// = Information QUALITY ============

/**
 * Information Quality Weight (Cronos)
 * Timing modülü, düşük-orta güvenilirlik
 */
export const INFORMATION_QUALITY = 0.60;

// ============ ZAMAN ARAKLARI ============

/**
 * Optimal işlem saatleri
 */
export const OPTIMAL_HOURS = {
  morning: { start: 10, end: 11.5 },    // 10:00 - 11:30
  afternoon: { start: 14, end: 15.5 },  // 14:00 - 15:30
} as const;

/**
 * Açılış/Kapanış saatleri
 */
export const MARKET_HOURS = {
  preMarket: { start: 9.5, end: 10 },     // 09:30 - 10:00
  regular: { start: 10, end: 17 },       // 10:00 - 17:00
  closing: { start: 17, end: 17.5 },     // 17:00 - 17:30
  afterHours: { start: 17.5, end: 18 }, // 17:30 - 18:00
} as const;

/**
 * Öğle arası
 */
export const LUNCH_HOURS = {
  start: 12,
  end: 13.5,
} as const;

/**
 * BIST işlem saatleri
 */
export const BIST_HOURS = {
  morning: { start: 10, end: 12 },       // 10:00 - 12:00
  afternoon: { start: 14, end: 17.5 },   // 14:00 - 17:30
} as const;

// ============ TAKVİM ============

/**
 * Bilanço ayları (Türkiye)
 */
export const EARNINGS_MONTHS = [0, 3, 6, 9] as const; // Ocak, Nisan, Temmuz, Ekim

/**
 * Çeyrek son ayları
 */
export const QUARTER_END_MONTHS = [2, 5, 8, 11] as const; // Mart, Haziran, Eylül, Aralık

/**
 * Resmi tatiller (sabit tarihler)
 */
export const HOLIDAYS = [
  { month: 3, day: 23, name: 'Ulusal Egemenlik' },
  { month: 4, day: 19, name: 'Atatürk\'ü Anma' },
  { month: 5, day: 1, name: 'Emek ve Dayanışma' },
  { month: 7, day: 15, name: 'Demokrasi ve Millî Birlik' },
  { month: 8, day: 30, name: 'Zafer Bayramı' },
  { month: 9, day: 29, name: 'Cumhuriyet' },
] as const;

/**
 * Yılbaşı tatili dönemi
 */
export const YEAR_END_PERIOD = {
  startMonth: 11, // Aralık
  startDay: 25,
  endMonth: 0,    // Ocak
  endDay: 5,
} as const;

// ============ ZAMANLAMA TİPLERİ ============

/**
 * Zamanlama verdict
 */
export const TIMING_VERDICTS = {
  UYGUN: 'UYGUN',           // Uygun zamanlama
  NOTR: 'NÖTR',            // Nötr zamanlama
  UYGUNSUZ: 'UYGUNSUZ',     // Uygun olmayan zamanlama
} as const;

/**
 * Zamanlama tavsiyesi
 */
export const TIMING_RECOMMENDATIONS = {
  BUY: 'AL',
  SELL: 'SAT',
  WAIT: 'BEKLE',
  HOLD: 'TUT',
} as const;

// ============ CACHE AYARLARI ============

/**
 * Cache TTL (milisaniye)
 */
export const CACHE_TTL = {
  TIMING_DATA: 24 * 60 * 60 * 1000,  // 24 saat
  HOLIDAYS: 7 * 24 * 60 * 60 * 1000,  // 1 hafta
  EARNINGS: 30 * 24 * 60 * 60 * 1000, // 1 ay
} as const;

// ============ EXPORTS ============

export default {
  FACTOR_WEIGHTS,
  HOUR_SCORES,
  DAY_SCORES,
  MONTH_END_SCORES,
  EARNINGS_SCORES,
  SCORE_THRESHOLDS,
  GRADE_THRESHOLDS,
  INFORMATION_QUALITY,
  OPTIMAL_HOURS,
  MARKET_HOURS,
  LUNCH_HOURS,
  BIST_HOURS,
  EARNINGS_MONTHS,
  QUARTER_END_MONTHS,
  HOLIDAYS,
  YEAR_END_PERIOD,
  TIMING_VERDICTS,
  TIMING_RECOMMENDATIONS,
  CACHE_TTL,
};
