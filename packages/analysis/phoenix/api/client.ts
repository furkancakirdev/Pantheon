/**
 * Phoenix API Client - Signal Scanning Data Fetcher
 *
 * OHLCV mum verilerini çeker.
 */

import type { Candle } from '../types';

// ============ DATA SOURCES ============

/**
 * Mock OHLCV verisi oluştur
 */
function generateMockCandles(symbol: string, days: number = 200): Candle[] {
  const candles: Candle[] = [];
  const now = Date.now();
  const seed = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);

  // Başlangıç fiyatı
  let price = 50 + (seed % 200);

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);

    // Rastgele fiyat hareketi (basit random walk)
    const change = (Math.sin(seed + i) * 2 - 1) * price * 0.03;
    price += change;

    const open = price;
    const close = price + (Math.sin(seed + i + 1) * 2 - 1) * price * 0.015;
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);

    // Hacim
    const volume = Math.floor(1000000 + Math.random() * 5000000);

    candles.push({
      date,
      open,
      high,
      low,
      close,
      volume,
    });

    price = close;
  }

  return candles;
}

/**
 * OHLCV mum verilerini çek
 */
export async function fetchCandles(symbol: string, days: number = 200): Promise<Candle[]> {
  try {
    // Gerçek API entegrasyonu yakında eklenecek
    // Şimdilik mock data
    return generateMockCandles(symbol.toUpperCase(), days);
  } catch (error) {
    console.error(`Error fetching candles for ${symbol}:`, error);
    return [];
  }
}

/**
 * Sembol için mum verileri çek
 */
export async function fetchCandlesForSymbol(symbol: string, days?: number): Promise<Candle[]> {
  return fetchCandles(symbol.toUpperCase(), days);
}

// ============ CACHE ============

/**
 * Basit in-memory cache
 */
const cache = new Map<string, { data: Candle[]; expiry: number }>();

/**
 * Cache TTL (milisaniye)
 */
const CACHE_TTL = {
  CANDLES: 5 * 60 * 1000, // 5 dakika
};

/**
 * Cache'li mum verilerini çek
 */
export async function fetchCandlesCached(symbol: string, days: number = 200): Promise<Candle[]> {
  const cacheKey = `PHOENIX_CANDLES_${symbol.toUpperCase()}_${days}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const data = await fetchCandles(symbol.toUpperCase(), days);
  cache.set(cacheKey, {
    data,
    expiry: Date.now() + CACHE_TTL.CANDLES,
  });

  return data;
}

/**
 * Cache'i temizle
 */
export function clearCache(symbol?: string): void {
  if (symbol) {
    for (const key of cache.keys()) {
      if (key.startsWith(`PHOENIX_CANDLES_${symbol.toUpperCase()}`)) {
        cache.delete(key);
      }
    }
  } else {
    cache.clear();
  }
}

/**
 * Cache istatistiklerini getir
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

export default {
  fetchCandles,
  fetchCandlesForSymbol,
  fetchCandlesCached,
  clearCache,
  getCacheStats,
};
