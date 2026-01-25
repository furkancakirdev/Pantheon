/**
 * PANTHEON API HOOKS
 * Custom hooks for API communication
 */

import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../constants/Config';
import {
  ApiResponse,
  StockSignal,
  StockAnalysis,
  MarketData,
  MacroRating,
  BacktestResult,
  OrionAnalysis,
  PersembeAnalysis,
  CompleteStockAnalysis,
  PhoenixAnalysis,
  ChironRiskDecision,
  ChironRiskMetrics,
  PositionSizeResult,
} from '../types/api';

// ============ BASE FETCH FUNCTION ============
const baseFetch = async <T>(
  endpoint: string,
  errorMessage: string
): Promise<T | null> => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) {
      console.warn(`API Warning: ${response.status} ${response.statusText}`);
      return null;
    }
    const result: ApiResponse<T> = await response.json();
    return result.data;
  } catch (error) {
    console.error(`${errorMessage}:`, error);
    return null;
  }
};

// ============ USE SIGNALS HOOK ============
export interface UseSignalsResult {
  signals: StockSignal[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useSignals = (): UseSignalsResult => {
  const [signals, setSignals] = useState<StockSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}`);
      if (!response.ok) {
        // Try fallback to signals endpoint
        const fallbackResponse = await fetch(`${API_URL}/signals`);
        if (!fallbackResponse.ok) {
          throw new Error('API bağlantısı başarısız');
        }
        const result: ApiResponse<StockSignal[]> = await fallbackResponse.json();
        setSignals(result.data || []);
      } else {
        // Direct signals response
        const result: ApiResponse<StockSignal[]> = await response.json();
        setSignals(result.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      // Return mock data on error
      setSignals(getMockSignals());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  return { signals, loading, error, refresh: fetchSignals };
};

// ============ USE ANALYSIS HOOK ============
export interface UseAnalysisResult {
  analysis: StockAnalysis | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useAnalysis = (symbol: string): UseAnalysisResult => {
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/../analysis?symbol=${symbol}`);
      if (!response.ok) {
        throw new Error('Analiz API bağlantısı başarısız');
      }
      const result: ApiResponse<StockAnalysis> = await response.json();
      setAnalysis(result.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bilinmeyen hata');
      setAnalysis(getMockAnalysis(symbol));
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return { analysis, loading, error, refresh: fetchAnalysis };
};

// ============ USE MARKET DATA HOOK ============
export interface UseMarketResult {
  market: MarketData | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useMarket = (): UseMarketResult => {
  const [market, setMarket] = useState<MarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarket = useCallback(async () => {
    setLoading(true);
    setError(null);

    const data = await baseFetch<MarketData>('/market', 'Piyasa verisi alınamadı');
    if (data) {
      setMarket(data);
    } else {
      setMarket(getMockMarket());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMarket();
  }, [fetchMarket]);

  return { market, loading, error, refresh: fetchMarket };
};

// ============ USE AETHER HOOK ============
export interface UseAetherResult {
  macro: MacroRating | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useAether = (): UseAetherResult => {
  const [macro, setMacro] = useState<MacroRating | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAether = useCallback(async () => {
    setLoading(true);
    setError(null);

    const data = await baseFetch<MacroRating>('/aether', 'Aether verisi alınamadı');
    if (data) {
      setMacro(data);
    } else {
      setMacro(getMockAether());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAether();
  }, [fetchAether]);

  return { macro, loading, error, refresh: fetchAether };
};

// ============ USE BACKTEST HOOK ============
export const useBacktest = (symbol: string, days: number = 90) => {
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBacktest = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);

    // Simulated backtest data
    setTimeout(() => {
      setResult({
        symbol,
        startDate: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        initialCapital: 100000,
        finalValue: 100000 * (1 + (Math.random() * 0.4 - 0.1)),
        return: Math.random() * 40 - 10,
        winRate: 55 + Math.random() * 15,
        totalTrades: Math.floor(10 + Math.random() * 30),
        winningTrades: Math.floor(5 + Math.random() * 15),
        losingTrades: Math.floor(3 + Math.random() * 10),
        avgWin: 3 + Math.random() * 5,
        avgLoss: -(2 + Math.random() * 3),
        maxDrawdown: -(5 + Math.random() * 10),
        sharpeRatio: 0.5 + Math.random() * 1.5,
      });
      setLoading(false);
    }, 500);
  }, [symbol, days]);

  useEffect(() => {
    fetchBacktest();
  }, [fetchBacktest]);

  return { result, loading, error, refresh: fetchBacktest };
};

// ============ USE ORION ANALYSIS HOOK ============
export interface UseOrionResult {
  orion: OrionAnalysis | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useOrion = (symbol: string): UseOrionResult => {
  const [orion, setOrion] = useState<OrionAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrion = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);

    const data = await baseFetch<OrionAnalysis>(`/analysis/orion?symbol=${symbol}`, 'Orion analizi alınamadı');
    if (data) {
      setOrion(data);
    } else {
      setOrion(getMockOrion(symbol));
    }
    setLoading(false);
  }, [symbol]);

  useEffect(() => {
    fetchOrion();
  }, [fetchOrion]);

  return { orion, loading, error, refresh: fetchOrion };
};

// ============ USE PERSEMBE ANALYSIS HOOK ============
export interface UsePersembeResult {
  persembe: PersembeAnalysis | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const usePersembe = (symbol: string): UsePersembeResult => {
  const [persembe, setPersembe] = useState<PersembeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPersembe = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);

    const data = await baseFetch<PersembeAnalysis>(`/analysis/persembe?symbol=${symbol}`, 'Perşembe analizi alınamadı');
    if (data) {
      setPersembe(data);
    } else {
      setPersembe(getMockPersembe(symbol));
    }
    setLoading(false);
  }, [symbol]);

  useEffect(() => {
    fetchPersembe();
  }, [fetchPersembe]);

  return { persembe, loading, error, refresh: fetchPersembe };
};

// ============ USE COMPLETE ANALYSIS HOOK ============
export interface UseCompleteAnalysisResult {
  analysis: CompleteStockAnalysis | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useCompleteAnalysis = (symbol: string): UseCompleteAnalysisResult => {
  const [analysis, setAnalysis] = useState<CompleteStockAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCompleteAnalysis = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);

    const data = await baseFetch<CompleteStockAnalysis>(`/analysis/complete?symbol=${symbol}`, 'Tam analiz alınamadı');
    if (data) {
      setAnalysis(data);
    } else {
      setAnalysis(getMockCompleteAnalysis(symbol));
    }
    setLoading(false);
  }, [symbol]);

  useEffect(() => {
    fetchCompleteAnalysis();
  }, [fetchCompleteAnalysis]);

  return { analysis, loading, error, refresh: fetchCompleteAnalysis };
};

// ============ MOCK DATA (Fallback) ============
const getMockSignals = (): StockSignal[] => [
  {
    hisse: 'THYAO',
    fiyat: 315.50,
    degisim: '+2.5%',
    erdimcSkor: 92,
    wonderkidSkor: 85,
    teknikSinyal: 'AL',
    councilKarar: {
      sonKarar: 'AL',
      konsensus: 85,
      oylar: [
        { modul: 'Atlas V2', oy: 'AL', guven: 95, aciklama: 'F/K 3.5 inanılmaz ucuz' },
        { modul: 'Orion V3', oy: 'BEKLE', guven: 60, aciklama: 'Direnç seviyesinde' },
      ],
    },
  },
  {
    hisse: 'ASELS',
    fiyat: 78.25,
    degisim: '+1.8%',
    erdimcSkor: 88,
    wonderkidSkor: 94,
    teknikSinyal: 'AL',
    councilKarar: {
      sonKarar: 'AL',
      konsensus: 90,
      oylar: [
        { modul: 'Atlas V2', oy: 'AL', guven: 85, aciklama: 'F/K 14.2 (Sektör 18.0)' },
        { modul: 'Orion V3', oy: 'AL', guven: 88, aciklama: 'Tüm SMA\'ların üzerinde' },
      ],
    },
  },
  {
    hisse: 'SAHOL',
    fiyat: 42.80,
    degisim: '-0.5%',
    erdimcSkor: 75,
    wonderkidSkor: 68,
    teknikSinyal: 'BEKLE',
    councilKarar: {
      sonKarar: 'BEKLE',
      konsensus: 55,
      oylar: [
        { modul: 'Atlas V2', oy: 'BEKLE', guven: 50, aciklama: 'Değerleme nötr' },
        { modul: 'Orion V3', oy: 'BEKLE', guven: 55, aciklama: 'Yatay seyir' },
      ],
    },
  },
];

const getMockAnalysis = (symbol: string): StockAnalysis => ({
  hisse: symbol,
  erdincSkor: 75,
  wonderkidSkor: 70,
  teknikSinyal: 'BEKLE',
  councilKarar: {
    sonKarar: 'BEKLE',
    konsensus: 55,
    oylar: [
      { modul: 'Atlas V2', oy: 'BEKLE', guven: 50, aciklama: 'Nötr bölge' },
      { modul: 'Orion V3', oy: 'BEKLE', guven: 55, aciklama: 'Yatay trend' },
    ],
  },
  tarih: new Date().toISOString(),
});

const getMockMarket = (): MarketData => ({
  endeks: 'BIST100',
  endeksDeger: 10250,
  endeksDegisim: '+1.2%',
  regime: 'Risk İştahı Yüksek',
  signals: getMockSignals(),
});

const getMockAether = (): MacroRating => ({
  regime: 'Risk İştahı Yüksek',
  numericScore: 75,
  leading: 80,
  coincident: 75,
  lagging: 70,
  timestamp: new Date().toISOString(),
});

// ============ NEW MOCK DATA ============
const getMockOrion = (symbol: string): OrionAnalysis => ({
  symbol,
  totalScore: 72,
  verdict: 'AL',
  components: { trend: 20, momentum: 16, volatility: 8, structure: 16, kivanc: 12 },
  kivanc: {
    alphaTrend: 'AL',
    most: 'AL',
    superTrend: 'AL',
    stochRSI: 'BEKLE',
    mavilimW: 'YUKARI',
    harmonicLevels: { h6: 85, l6: 72, m1: 78.5 },
  },
  persembe: {
    marketStructure: 'UPTREND',
    lastSwingHigh: 82,
    lastSwingLow: 75,
  },
  details: ['AlphaTrend: AL', 'MOST: AL', 'SuperTrend: AL', 'MavilimW: Yukarı trend'],
});

const getMockPersembe = (symbol: string): PersembeAnalysis => ({
  destekDirenc: [
    { seviye: 75, tip: 'DESTEK', guc: 8, testSayisi: 3 },
    { seviye: 82, tip: 'DİRENÇ', guc: 6, testSayisi: 2 },
  ],
  trend: {
    yonu: 'YUKARI',
    baslangic: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    guc: 12.5,
  },
  fibonacci: [
    { seviye: 75, oran: 0 },
    { seviye: 76.5, oran: 0.236 },
    { seviye: 78, oran: 0.382 },
    { seviye: 78.5, oran: 0.5 },
  ],
  hacim: {
    teyitli: true,
    hacimTrendi: 'ARTAN',
    aciklama: 'Yükseliş hacimle teyit edildi',
  },
  formasyon: null,
  mumFormasyonlari: [],
  ozet: 'Yukarı trend, güçlü hacim teyidi',
});

const getMockCompleteAnalysis = (symbol: string): CompleteStockAnalysis => ({
  symbol,
  orion: getMockOrion(symbol),
  persembe: getMockPersembe(symbol),
  erdinc: {
    toplamSkor: 78,
    buyumeSkor: 18,
    borcSkor: 22,
    carpanSkor: 20,
    karlilikSkor: 18,
    gerekceler: ['F/K 8.5 (Sektör 12.0)', 'ROE %22.5', 'Borç/Özkaynak 0.65'],
  },
  quote: {
    currentPrice: 78.50,
    change: 1.25,
    changePercent: 1.62,
    volume: 12500000,
    high52w: 95,
    low52w: 62,
  },
  timestamp: new Date().toISOString(),
});

export default {
  useSignals,
  useAnalysis,
  useMarket,
  useAether,
  useBacktest,
  useOrion,
  usePersembe,
  useCompleteAnalysis,
  usePhoenix,
  useChironReview,
  useChironRisk,
  useChironPositionSize,
};

// ============ USE PHOENIX ANALYSIS HOOK ============
export interface UsePhoenixResult {
  phoenix: PhoenixAnalysis | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const usePhoenix = (symbol: string): UsePhoenixResult => {
  const [phoenix, setPhoenix] = useState<PhoenixAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhoenix = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);

    const data = await baseFetch<PhoenixAnalysis>(`/analysis/phoenix?symbol=${symbol}&action=analyze`, 'Phoenix analizi alınamadı');
    if (data) {
      setPhoenix(data);
    } else {
      setPhoenix(getMockPhoenix(symbol));
    }
    setLoading(false);
  }, [symbol]);

  useEffect(() => {
    fetchPhoenix();
  }, [fetchPhoenix]);

  return { phoenix, loading, error, refresh: fetchPhoenix };
};

// ============ USE CHIRON REVIEW HOOK ============
export interface UseChironReviewResult {
  decision: ChironRiskDecision | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useChironReview = (
  symbol: string,
  councilScore: number = 75,
  equity: number = 100000
): UseChironReviewResult => {
  const [decision, setDecision] = useState<ChironRiskDecision | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReview = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    setError(null);

    const data = await baseFetch<ChironRiskDecision>(
      `/analysis/chiron?action=review&symbol=${symbol}&councilScore=${councilScore}&equity=${equity}`,
      'Chiron incelemesi alınamadı'
    );
    if (data) {
      setDecision(data);
    } else {
      setDecision(getMockChironDecision(symbol));
    }
    setLoading(false);
  }, [symbol, councilScore, equity]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  return { decision, loading, error, refresh: fetchReview };
};

// ============ USE CHIRON RISK METRICS HOOK ============
export interface UseChironRiskResult {
  metrics: ChironRiskMetrics | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useChironRisk = (equity: number = 100000): UseChironRiskResult => {
  const [metrics, setMetrics] = useState<ChironRiskMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRisk = useCallback(async () => {
    setLoading(true);
    setError(null);

    const data = await baseFetch<ChironRiskMetrics>(
      `/analysis/chiron?action=portfolioRisk&equity=${equity}`,
      'Risk metrikleri alınamadı'
    );
    if (data) {
      setMetrics(data);
    } else {
      setMetrics(getMockChironMetrics());
    }
    setLoading(false);
  }, [equity]);

  useEffect(() => {
    fetchRisk();
  }, [fetchRisk]);

  return { metrics, loading, error, refresh: fetchRisk };
};

// ============ USE CHIRON POSITION SIZE HOOK ============
export interface UseChironPositionSizeResult {
  positionSize: PositionSizeResult | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export const useChironPositionSize = (
  equity: number = 100000,
  price: number = 100,
  confidence: number = 80,
  method: string = 'FIXED_R'
): UseChironPositionSizeResult => {
  const [positionSize, setPositionSize] = useState<PositionSizeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPositionSize = useCallback(async () => {
    setLoading(true);
    setError(null);

    const data = await baseFetch<PositionSizeResult>(
      `/analysis/chiron?action=positionSize&equity=${equity}&price=${price}&confidence=${confidence}&method=${method}`,
      'Position size hesaplanamadı'
    );
    if (data) {
      setPositionSize(data);
    } else {
      setPositionSize(getMockPositionSize(equity, price));
    }
    setLoading(false);
  }, [equity, price, confidence, method]);

  useEffect(() => {
    fetchPositionSize();
  }, [fetchPositionSize]);

  return { positionSize, loading, error, refresh: fetchPositionSize };
};

// ============ MOCK DATA (Fallback) ============
const getMockPhoenix = (symbol: string): PhoenixAnalysis => ({
  symbol,
  lastPrice: 78.50,
  score: 75,
  reason: 'SMA20 > SMA50 cross; MACD bullish crossover',
  signals: [
    { type: 'SMA_CROSS', strength: 7, description: 'SMA20 > SMA50', bullish: true },
    { type: 'MACD_CROSS', strength: 6, description: 'MACD bullish', bullish: true },
    { type: 'RSI_OVERSOLD', strength: 5, description: 'RSI aşırı satım (45)', bullish: true },
  ],
  riskLevel: 'DÜŞÜK',
  timestamp: new Date().toISOString(),
});

const getMockChironDecision = (symbol: string): ChironRiskDecision => ({
  approved: true,
  adjustedQuantity: 100,
  suggestedStopLoss: 70.20,
  suggestedTakeProfit: 93.60,
  riskR: 2.0,
  reason: '2R yöntemi. Grand Council: 80/100',
  warnings: [],
});

const getMockChironMetrics = (): ChironRiskMetrics => ({
  totalRiskR: 4.5,
  sectorExposure: {
    'Teknoloji': 35,
    'Havacılık': 25,
    'Bankacılık': 20,
  },
  maxDrawdown: 6.8,
  var95: 3.2,
  concentrationRisk: 25,
});

const getMockPositionSize = (equity: number, price: number): PositionSizeResult => ({
  shares: Math.floor((equity * 0.05) / price),
  riskR: 2.0,
  reason: '2R yöntemi',
});
