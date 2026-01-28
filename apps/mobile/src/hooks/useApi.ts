/**
 * PANTHEON API HOOKS
 * Custom hooks for API communication
 * No mock fallback - production ready
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL, Config } from '../constants/Config';
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

// ============ BASE FETCH FUNCTION WITH RETRY ============
interface FetchOptions {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
}

const baseFetch = async <T>(
  endpoint: string,
  errorMessage: string,
  options: FetchOptions = {}
): Promise<T> => {
  const { maxRetries = 3, retryDelay = 1000, timeout = 10000 } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(`${Config.API_BASE_URL || API_URL}${endpoint}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: ApiResponse<T> = await response.json();

      if (!result.data) {
        throw new Error(errorMessage || 'Veri alınamadı');
      }

      return result.data;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt); // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} for ${endpoint}`);
      }
    }
  }

  throw lastError || new Error(errorMessage);
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
      const response = await fetch(`${Config.API_BASE_URL || API_URL}`);
      if (!response.ok) {
        // Try fallback to signals endpoint
        const fallbackResponse = await fetch(`${Config.API_BASE_URL || API_URL}/signals`);
        if (!fallbackResponse.ok) {
          throw new Error('API bağlantısı başarısız');
        }
        const result: ApiResponse<StockSignal[]> = await fallbackResponse.json();
        setSignals(result.data || []);
      } else {
        const result: ApiResponse<StockSignal[]> = await response.json();
        setSignals(result.data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals().catch(err => {
      console.error('useSignals error:', err);
    });
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
      const data = await baseFetch<StockAnalysis>(
        `/analysis?symbol=${symbol}`,
        'Analiz verisi alınamadı'
      );
      setAnalysis(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (symbol) {
      fetchAnalysis().catch(err => {
        console.error('useAnalysis error:', err);
      });
    }
  }, [fetchAnalysis, symbol]);

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

    try {
      const data = await baseFetch<MarketData>('/market', 'Piyasa verisi alınamadı');
      setMarket(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarket().catch(err => {
      console.error('useMarket error:', err);
    });
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

    try {
      const data = await baseFetch<MacroRating>('/aether', 'Aether verisi alınamadı');
      setMacro(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAether().catch(err => {
      console.error('useAether error:', err);
    });
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

    try {
      const data = await baseFetch<BacktestResult>(
        `/backtest?symbol=${symbol}&days=${days}`,
        'Backtest verisi alınamadı'
      );
      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [symbol, days]);

  useEffect(() => {
    if (symbol) {
      fetchBacktest().catch(err => {
        console.error('useBacktest error:', err);
      });
    }
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

    try {
      const data = await baseFetch<OrionAnalysis>(
        `/analysis/orion?symbol=${symbol}`,
        'Orion analizi alınamadı'
      );
      setOrion(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (symbol) {
      fetchOrion().catch(err => {
        console.error('useOrion error:', err);
      });
    }
  }, [fetchOrion, symbol]);

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

    try {
      const data = await baseFetch<PersembeAnalysis>(
        `/analysis/persembe?symbol=${symbol}`,
        'Perşembe analizi alınamadı'
      );
      setPersembe(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (symbol) {
      fetchPersembe().catch(err => {
        console.error('usePersembe error:', err);
      });
    }
  }, [fetchPersembe, symbol]);

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

    try {
      const data = await baseFetch<CompleteStockAnalysis>(
        `/analysis/complete?symbol=${symbol}`,
        'Tam analiz alınamadı'
      );
      setAnalysis(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (symbol) {
      fetchCompleteAnalysis().catch(err => {
        console.error('useCompleteAnalysis error:', err);
      });
    }
  }, [fetchCompleteAnalysis, symbol]);

  return { analysis, loading, error, refresh: fetchCompleteAnalysis };
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

    try {
      const data = await baseFetch<PhoenixAnalysis>(
        `/analysis/phoenix?symbol=${symbol}&action=analyze`,
        'Phoenix analizi alınamadı'
      );
      setPhoenix(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    if (symbol) {
      fetchPhoenix().catch(err => {
        console.error('usePhoenix error:', err);
      });
    }
  }, [fetchPhoenix, symbol]);

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

    try {
      const data = await baseFetch<ChironRiskDecision>(
        `/analysis/chiron?action=review&symbol=${symbol}&councilScore=${councilScore}&equity=${equity}`,
        'Chiron incelemesi alınamadı'
      );
      setDecision(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [symbol, councilScore, equity]);

  useEffect(() => {
    if (symbol) {
      fetchReview().catch(err => {
        console.error('useChironReview error:', err);
      });
    }
  }, [fetchReview, symbol]);

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

    try {
      const data = await baseFetch<ChironRiskMetrics>(
        `/analysis/chiron?action=portfolioRisk&equity=${equity}`,
        'Risk metrikleri alınamadı'
      );
      setMetrics(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [equity]);

  useEffect(() => {
    fetchRisk().catch(err => {
      console.error('useChironRisk error:', err);
    });
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

    try {
      const data = await baseFetch<PositionSizeResult>(
        `/analysis/chiron?action=positionSize&equity=${equity}&price=${price}&confidence=${confidence}&method=${method}`,
        'Position size hesaplanamadı'
      );
      setPositionSize(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [equity, price, confidence, method]);

  useEffect(() => {
    fetchPositionSize().catch(err => {
      console.error('useChironPositionSize error:', err);
    });
  }, [fetchPositionSize]);

  return { positionSize, loading, error, refresh: fetchPositionSize };
};

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
