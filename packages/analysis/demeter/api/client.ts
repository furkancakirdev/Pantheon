/**
 * Demeter API Client - Sector Data Fetcher
 *
 * Sektör endeksleri ve hisse verilerini çeker.
 */

import type { SectorCode, SectorData, IndexData } from '../types';
import { BIST_SECTOR_INDICES } from '../config';

// ============ MOCK DATA GENERATORS ============

/**
 * Mock sektör verisi oluştur
 */
function generateMockSectorData(sectorCode: SectorCode, date: Date): SectorData {
  const sectorNames: Record<SectorCode, string> = {
    BANK: 'Bankacılık',
    SINA: 'Sınaî',
    TEKN: 'Teknoloji',
    GYNA: 'Gıda',
    MANA: 'Mağazacılık',
    ELEC: 'Elektrik',
    ENRG: 'Enerji',
    META: 'Madencilik',
    HOCA: 'Holding',
    ILCS: 'İletişim',
    TAAS: 'Taşıma',
    INSR: 'Sigorta',
    REAL: 'Gayrimenkul',
    TEXT: 'Tekstil',
    CHEM: 'Kimya',
    OTOM: 'Otomotiv',
  };

  // Rastgele ama tutarlı değerler oluştur
  const hash = sectorCode.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const seed = hash + dayOfYear;

  // Seeded random
  const seededRandom = (n: number): number => {
    const x = Math.sin(seed + n) * 10000;
    return x - Math.floor(x);
  };

  const basePrice = 1000 + seededRandom(1) * 500;
  const change = (seededRandom(2) - 0.45) * 5; // -2.25% to +2.75%
  const volume = 1000000000 + seededRandom(3) * 2000000000;

  // RSI hesapla
  const rsi = 30 + seededRandom(4) * 40; // 30-70

  // Momentum hesapla
  const momentum = (seededRandom(5) - 0.4) * 100; // -40 to +60

  // Göreceli güç
  const relativeStrength = 90 + seededRandom(6) * 30; // 90-120

  // Trend belirle
  let trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  if (rsi > 55 && momentum > 10) {
    trend = 'BULLISH';
  } else if (rsi < 45 || momentum < -10) {
    trend = 'BEARISH';
  } else {
    trend = 'NEUTRAL';
  }

  return {
    sector: sectorCode,
    name: sectorNames[sectorCode],
    price: basePrice,
    change,
    volume,
    high52Ratio: 0.7 + seededRandom(7) * 0.3,
    rsi,
    momentum,
    relativeStrength,
    trend,
    phase: 'EARLY_CYCLE', // Daha sonra hesaplanacak
    pe: 8 + seededRandom(8) * 15,
    pb: 1 + seededRandom(9) * 2,
  };
}

/**
 * Mock endeks verisi oluştur
 */
function generateMockIndexData(symbol: string): IndexData {
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seededRandom = (n: number): number => {
    const x = Math.sin(hash + n + Date.now() / 86400000) * 10000;
    return x - Math.floor(x);
  };

  return {
    symbol,
    price: 1000 + seededRandom(1) * 500,
    change: (seededRandom(2) - 0.45) * 3,
    volume: 100000000 + seededRandom(3) * 500000000,
    timestamp: new Date(),
  };
}

// ============ DATA SOURCES ============

/**
 * Tüm sektör verilerini getir
 */
export async function fetchAllSectors(date: Date = new Date()): Promise<SectorData[]> {
  // Gerçek API entegrasyonu yakında eklenecek
  const sectors: SectorCode[] = [
    'BANK', 'SINA', 'TEKN', 'GYNA', 'MANA',
    'ELEC', 'ENRG', 'META', 'HOCA', 'ILCS',
    'TAAS', 'INSR', 'REAL', 'TEXT', 'CHEM', 'OTOM',
  ];

  return sectors.map(sector => generateMockSectorData(sector, date));
}

/**
 * Tek sektör verisi getir
 */
export async function fetchSectorData(sector: SectorCode): Promise<SectorData | null> {
  try {
    const sectors = await fetchAllSectors();
    return sectors.find(s => s.sector === sector) || null;
  } catch (error) {
    console.error(`Error fetching sector ${sector}:`, error);
    return null;
  }
}

/**
 * Sektör endeks verisini getir
 */
export async function fetchSectorIndex(sector: SectorCode): Promise<IndexData | null> {
  const indexSymbol = BIST_SECTOR_INDICES[sector];

  // Gerçek API entegrasyonu yakında eklenecek
  return generateMockIndexData(indexSymbol);
}

/**
 * Tüm endeks verilerini getir
 */
export async function fetchAllIndices(): Promise<IndexData[]> {
  const indices = Object.values(BIST_SECTOR_INDICES);
  return indices.map(symbol => generateMockIndexData(symbol));
}

/**
 * Sektör hisse senetlerini getir
 */
export async function fetchSectorStocks(sector: SectorCode): Promise<string[]> {
  // Gerçek API entegrasyonu yakında eklenecek
  const sectorStocks: Record<SectorCode, string[]> = {
    BANK: ['AKBNK', 'GARAN', 'ISCTR', 'YKBNK', 'HALKB', 'TSKB'],
    SINA: ['THYAO', 'FROTO', 'TOASO', 'CCOLA', 'SAHOL'],
    TEKN: ['PARSN', 'PRKME', 'LOGFA', 'TUPRS', 'MIATK'],
    GYNA: ['GUBRF', 'PENSAS', 'ULKER', 'AGROT'],
    MANA: ['BIMAS', 'MGROS', 'SASA', 'GSDDE', 'KERVN'],
    ELEC: ['AKSA', 'AKENR', 'AYEN', 'BRSAN'],
    ENRG: ['PETKM', 'TUPRS', 'TPSAO', 'BRISA'],
    META: ['TKFEN', 'DDMN', 'KOZAA', 'KOZAL'],
    HOCA: ['SAHOL', 'KCHOL', 'ALARK', 'HOLYA'],
    ILCS: ['TKTL', 'TCELL', 'KRDMD'],
    TAAS: ['THYAO', 'ARCLK', 'EKGYO'],
    INSR: ['ALLI', 'GENIL', 'TRKCM'],
    REAL: ['AVEYO', 'TEMVO', 'EKGYO', 'KONTR'],
    TEXT: ['SUNTK', 'BORSA', 'GSDDE'],
    CHEM: ['PETKM', 'TUPRS', 'DURDO'],
    OTOM: ['TOASO', 'FROTO', 'DOAS'],
  };

  return sectorStocks[sector] || [];
}

/**
 * Göreceli güç hesapla (Sektör / Endeks)
 */
export async function calculateRelativeStrength(
  sector: SectorCode,
  period: number = 60
): Promise<number> {
  // Gerçek API ile tarihsel veri gerekli
  // Şimdilik mock değer dönüyoruz
  const hash = sector.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const seededRandom = (n: number): number => {
    const x = Math.sin(hash + n + Date.now() / 86400000) * 10000;
    return x - Math.floor(x);
  };

  return 90 + seededRandom(1) * 30; // 90-120 arası
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
  SECTOR_DATA: 15 * 60 * 1000,    // 15 dakika
  SECTOR_INDEX: 5 * 60 * 1000,    // 5 dakika
  INDICES: 5 * 60 * 1000,         // 5 dakika
  SECTOR_STOCKS: 60 * 60 * 1000,  // 1 saat
  RELATIVE_STRENGTH: 30 * 60 * 1000, // 30 dakika
};

/**
 * Cache'li sektör verilerini getir
 */
export async function fetchAllSectorsCached(date: Date = new Date()): Promise<SectorData[]> {
  const cacheKey = `DEME_SECTORS_${date.toDateString()}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const data = await fetchAllSectors(date);
  cache.set(cacheKey, {
    data,
    expiry: Date.now() + CACHE_TTL.SECTOR_DATA,
  });

  return data;
}

/**
 * Cache'li endeks verilerini getir
 */
export async function fetchAllIndicesCached(): Promise<IndexData[]> {
  const cacheKey = 'DEME_INDICES';
  const cached = cache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const data = await fetchAllIndices();
  cache.set(cacheKey, {
    data,
    expiry: Date.now() + CACHE_TTL.INDICES,
  });

  return data;
}

/**
 * Cache'li göreceli güç hesapla
 */
export async function calculateRelativeStrengthCached(
  sector: SectorCode,
  period: number = 60
): Promise<number> {
  const cacheKey = `DEME_RS_${sector}_${period}`;
  const cached = cache.get(cacheKey);

  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const data = await calculateRelativeStrength(sector, period);
  cache.set(cacheKey, {
    data,
    expiry: Date.now() + CACHE_TTL.RELATIVE_STRENGTH,
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
  fetchAllSectors,
  fetchSectorData,
  fetchSectorIndex,
  fetchAllIndices,
  fetchSectorStocks,
  calculateRelativeStrength,
  fetchAllSectorsCached,
  fetchAllIndicesCached,
  calculateRelativeStrengthCached,
  clearCache,
};
