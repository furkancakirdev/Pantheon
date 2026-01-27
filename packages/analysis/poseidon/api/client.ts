/**
 * Poseidon API Client - Asset Data Fetcher
 *
 * Varlık sınıfı verilerini çeker.
 */

import type { AssetClass, AssetData, RegimeStatus } from '../types';

// ============ MOCK DATA GENERATORS ============

/**
 * Mock varlık verisi oluştur
 */
function generateMockAssetData(assetClass: AssetClass, date: Date): AssetData {
  const hash = assetClass.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const seed = hash + dayOfYear;

  // Seeded random
  const seededRandom = (n: number): number => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };

  // Varlık sınıfı bazlı varsayılanlar
  const defaults: Record<AssetClass, {
    expectedReturn: number;
    risk: number;
    correlation: number;
  }> = {
    EQUITY: { expectedReturn: 10, risk: 18, correlation: 1.0 },
    FIXED_INCOME: { expectedReturn: 5, risk: 6, correlation: 0.3 },
    CASH: { expectedReturn: 3, risk: 1, correlation: 0.0 },
    GOLD: { expectedReturn: 6, risk: 15, correlation: -0.1 },
    COMMODITY: { expectedReturn: 4, risk: 20, correlation: 0.2 },
    CRYPTO: { expectedReturn: 25, risk: 80, correlation: 0.1 },
    REAL_ESTATE: { expectedReturn: 7, risk: 12, correlation: 0.6 },
    INTERNATIONAL: { expectedReturn: 8, risk: 16, correlation: 0.7 },
  };

  const def = defaults[assetClass];

  // Mevcut ağırlık (mock)
  const currentWeight = seededRandom(1) * 50;

  // Hedef ağırlık (stratejik)
  const targetWeight = seededRandom(2) * 50;

  // Sharpe oranı
  const sharpeRatio = def.expectedReturn > 3 ? (def.expectedReturn - 3) / def.risk : 0;

  // Trend
  const momentum = (seededRandom(3) - 0.4) * 100;
  let trend: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  if (momentum > 10) {
    trend = 'POSITIVE';
  } else if (momentum < -10) {
    trend = 'NEGATIVE';
  } else {
    trend = 'NEUTRAL';
  }

  // Öneri
  let recommendation: 'OVERWEIGHT' | 'EQUAL' | 'UNDERWEIGHT' | 'AVOID';
  if (trend === 'POSITIVE' && sharpeRatio > 0.3) {
    recommendation = 'OVERWEIGHT';
  } else if (trend === 'NEGATIVE' && sharpeRatio < 0.2) {
    recommendation = 'UNDERWEIGHT';
  } else if (sharpeRatio < 0) {
    recommendation = 'AVOID';
  } else {
    recommendation = 'EQUAL';
  }

  return {
    assetClass,
    assetType: 'HISSE',
    currentWeight,
    targetWeight,
    weightChange: targetWeight - currentWeight,
    expectedReturn: def.expectedReturn + (seededRandom(4) - 0.5) * 5,
    risk: def.risk,
    sharpeRatio,
    correlation: def.correlation,
    trend,
    recommendation,
  };
}

/**
 * Mock rejim verisi oluştur
 */
function generateMockRegimeStatus(): RegimeStatus {
  const seed = Date.now() / 86400000;
  const seededRandom = (n: number): number => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };

  const regimeScore = seededRandom(1) * 100;

  let regime: RegimeStatus['regime'];
  if (regimeScore > 60) {
    regime = 'BULL';
  } else if (regimeScore < 40) {
    regime = 'BEAR';
  } else {
    regime = 'NEUTRAL';
  }

  let volatility: RegimeStatus['volatility'];
  const volScore = seededRandom(2);
  if (volScore > 0.7) {
    volatility = 'HIGH';
  } else if (volScore < 0.3) {
    volatility = 'LOW';
  } else {
    volatility = 'NORMAL';
  }

  let rateEnvironment: RegimeStatus['rateEnvironment'];
  const rateScore = seededRandom(3);
  if (rateScore > 0.6) {
    rateEnvironment = 'RISING';
  } else if (rateScore < 0.4) {
    rateEnvironment = 'FALLING';
  } else {
    rateEnvironment = 'STABLE';
  }

  let inflationEnvironment: RegimeStatus['inflationEnvironment'];
  const infScore = seededRandom(4);
  if (infScore > 0.66) {
    inflationEnvironment = 'HIGH';
  } else if (infScore < 0.33) {
    inflationEnvironment = 'LOW';
  } else {
    inflationEnvironment = 'MODERATE';
  }

  return {
    regime,
    confidence: 0.6 + seededRandom(5) * 0.3,
    volatility,
    rateEnvironment,
    inflationEnvironment,
  };
}

// ============ DATA SOURCES ============

/**
 * Tüm varlık sınıfı verilerini getir
 */
export async function fetchAllAssetClasses(date: Date = new Date()): Promise<AssetData[]> {
  // Gerçek API entegrasyonu yakında eklenecek
  const assetClasses: AssetClass[] = [
    'EQUITY', 'FIXED_INCOME', 'CASH', 'GOLD',
    'COMMODITY', 'CRYPTO', 'REAL_ESTATE', 'INTERNATIONAL',
  ];

  return assetClasses.map(assetClass => generateMockAssetData(assetClass, date));
}

/**
 * Tek varlık sınıfı verisi getir
 */
export async function fetchAssetData(assetClass: AssetClass): Promise<AssetData | null> {
  try {
    const assets = await fetchAllAssetClasses();
    return assets.find(a => a.assetClass === assetClass) || null;
  } catch (error) {
    console.error(`Error fetching asset class ${assetClass}:`, error);
    return null;
  }
}

/**
 * Rejim durumunu getir
 */
export async function fetchRegimeStatus(): Promise<RegimeStatus> {
  // Gerçek API entegrasyonu yakında eklenecek
  return generateMockRegimeStatus();
}

/**
 * Piyasa verilerini getir (hisse, tahvil, altın fiyatları)
 */
export async function fetchMarketPrices(): Promise<{
  equity: number;
  bond: number;
  gold: number;
  crypto: number;
  timestamp: Date;
}> {
  // Gerçek API entegrasyonu yakında eklenecek
  const seed = Date.now() / 86400000;
  const seededRandom = (n: number): number => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };

  return {
    equity: 1000 + seededRandom(1) * 500,
    bond: 100 + seededRandom(2) * 20,
    gold: 2000 + seededRandom(3) * 200,
    crypto: 50000 + seededRandom(4) * 10000,
    timestamp: new Date(),
  };
}

/**
 * Faiz oranlarını getir
 */
export async function fetchInterestRates(): Promise<{
  policyRate: number;
  bond10Y: number;
  realRate: number;
  timestamp: Date;
}> {
  // Gerçek API entegrasyonu yakında eklenecek
  const seed = Date.now() / 86400000;
  const seededRandom = (n: number): number => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };

  const policyRate = 40 + seededRandom(1) * 10; // %40-50 (TR)
  const inflation = seededRandom(2) * 20 + 40; // %40-60

  return {
    policyRate,
    bond10Y: policyRate + seededRandom(3) * 5,
    realRate: policyRate - inflation,
    timestamp: new Date(),
  };
}

/**
 * Enflasyon verisini getir
 */
export async function fetchInflationData(): Promise<{
  cpi: number;
  ppi: number;
  coreCpi: number;
  trend: 'RISING' | 'STABLE' | 'FALLING';
  timestamp: Date;
}> {
  // Gerçek API entegrasyonu yakında eklenecek
  const seed = Date.now() / 86400000;
  const seededRandom = (n: number): number => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };

  const cpi = 45 + seededRandom(1) * 20; // %45-65

  let trend: 'RISING' | 'STABLE' | 'FALLING';
  const trendScore = seededRandom(2);
  if (trendScore > 0.6) {
    trend = 'RISING';
  } else if (trendScore < 0.4) {
    trend = 'FALLING';
  } else {
    trend = 'STABLE';
  }

  return {
    cpi,
    ppi: cpi + seededRandom(3) * 10,
    coreCpi: cpi + seededRandom(4) * 5,
    trend,
    timestamp: new Date(),
  };
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
  ASSET_DATA: 15 * 60 * 1000,    // 15 dakika
  REGIME: 60 * 60 * 1000,        // 1 saat
  MARKET_PRICES: 5 * 60 * 1000,  // 5 dakika
  INTEREST_RATES: 30 * 60 * 1000, // 30 dakika
  INFLATION: 30 * 60 * 1000,     // 30 dakika
};

/**
 * Cache'li varlık verilerini getir
 */
export async function fetchAllAssetClassesCached(date: Date = new Date()): Promise<AssetData[]> {
  const cacheKey = `POSE_ASSETS_${date.toDateString()}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const data = await fetchAllAssetClasses(date);
  cache.set(cacheKey, {
    data,
    expiry: Date.now() + CACHE_TTL.ASSET_DATA,
  });

  return data;
}

/**
 * Cache'li rejim durumunu getir
 */
export async function fetchRegimeStatusCached(): Promise<RegimeStatus> {
  const cacheKey = 'POSE_REGIME';
  const cached = cache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const data = await fetchRegimeStatus();
  cache.set(cacheKey, {
    data,
    expiry: Date.now() + CACHE_TTL.REGIME,
  });

  return data;
}

/**
 * Cache'li piyasa fiyatlarını getir
 */
export async function fetchMarketPricesCached() {
  const cacheKey = 'POSE_PRICES';
  const cached = cache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const data = await fetchMarketPrices();
  cache.set(cacheKey, {
    data,
    expiry: Date.now() + CACHE_TTL.MARKET_PRICES,
  });

  return data;
}

/**
 * Cache'i temizle
 */
export function clearCache(): void {
  cache.clear();
}

// ============ EXPORTS ============

export default {
  fetchAllAssetClasses,
  fetchAssetData,
  fetchRegimeStatus,
  fetchMarketPrices,
  fetchInterestRates,
  fetchInflationData,
  fetchAllAssetClassesCached,
  fetchRegimeStatusCached,
  fetchMarketPricesCached,
  clearCache,
};
