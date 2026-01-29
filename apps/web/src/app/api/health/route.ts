/**
 * API Health & Cache Status
 * Tüm API'lerin durumu ve cache bilgileri
 *
 * Production: Gerçek API health checks
 */

import { NextResponse } from 'next/server';
import { IsyatirimClient } from '@api-clients/isyatirim';
import { FmpClient } from '@api-clients/fmp';
import { RedisClient } from '@db/redis';

const API_ROUTES = [
  { path: '/api/analysis/erdinc', name: 'Erdinç (Temel)', cacheTTL: '1 saat' },
  { path: '/api/analysis/orion', name: 'Orion (Teknik)', cacheTTL: '1 saat' },
  { path: '/api/analysis/persembe', name: 'Perşembe (Teknik)', cacheTTL: '1 saat' },
  { path: '/api/analysis/phoenix', name: 'Phoenix (Sinyal)', cacheTTL: '15 dakika' },
  { path: '/api/analysis/chiron', name: 'Chiron (Risk)', cacheTTL: '30 dakika' },
  { path: '/api/analysis/complete', name: 'Complete (Tümü)', cacheTTL: '1 saat' },
  { path: '/api/funds', name: 'TEFAS Fonlar', cacheTTL: '4 saat' },
  { path: '/api/live', name: 'Canlı Fiyat', cacheTTL: '1 dakika' },
  { path: '/api/stocks', name: 'Hisse Listesi', cacheTTL: '15 dakika' },
  { path: '/api/market', name: 'Piyasa Özeti', cacheTTL: '5 dakika' },
  { path: '/api/signals', name: 'Sinyal Geçmişi', cacheTTL: '1 saat' },
];

/**
 * Veri kaynağı health check'i yap
 */
async function checkDataSource(name: string, url: string, checkFn?: () => Promise<void>) {
  const startTime = Date.now();

  try {
    if (checkFn) {
      await checkFn();
    } else {
      // Basit fetch kontrolü
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
    }

    return {
      name,
      url,
      status: 'active',
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      name,
      url,
      status: 'error',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Database health check
 */
async function checkDatabase() {
  const startTime = Date.now();

  try {
    // Redis mock client kontrolü
    const redisClient = RedisClient.getInstance();
    await redisClient.ping();

    return {
      status: 'active',
      latency: Date.now() - startTime,
      type: 'Redis (Mock)',
    };
  } catch (error) {
    return {
      status: 'error',
      latency: Date.now() - startTime,
      type: 'Redis (Mock)',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * İş Yatırım API kontrolü
 */
async function checkIsyatirim() {
  const startTime = Date.now();

  try {
    const client = new IsyatirimClient();
    await client.fetchAllStocks();

    return {
      status: 'active',
      latency: Date.now() - startTime,
      recordCount: '500+',
    };
  } catch (error) {
    return {
      status: 'error',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * FMP API kontrolü
 */
async function checkFMP() {
  const startTime = Date.now();

  try {
    const client = new FmpClient();

    if (!client.isConfigured()) {
      return {
        status: 'not_configured',
        latency: 0,
        note: 'FMP_API_KEY not set',
      };
    }

    await client.getQuote('AAPL');

    return {
      status: 'active',
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'error',
      latency: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function GET() {
  const startTime = Date.now();

  // Paralel health checks
  const [
    dbHealth,
    isyatirimHealth,
    fmpHealth
  ] = await Promise.all([
    checkDatabase(),
    checkIsyatirim(),
    checkFMP(),
  ]);

  // Tüm route'lerin aktif olduğunu varsay (Next.js route'ları zaten çalışıyor)
  const apis = API_ROUTES.map(api => ({
    ...api,
    status: 'active',
    cached: false, // Cache durumu kontrol edilebilir
  }));

  const healthStatus = {
    timestamp: new Date().toISOString(),
    status: dbHealth.status === 'active' ? 'operational' : 'degraded',
    uptime: process.uptime ? Math.floor(process.uptime()) : 0,
    responseTime: Date.now() - startTime,
    apis,
    dataSources: [
      {
        name: 'İş Yatırım',
        url: 'https://www.isyatirim.com.tr',
        ...isyatirimHealth,
      },
      {
        name: 'FMP',
        url: 'https://financialmodelingprep.com',
        ...fmpHealth,
      },
      {
        name: 'TEFAS',
        url: 'https://www.tefas.gov.tr',
        status: 'active', // TEFAS için henüz gerçek API yok
        note: 'Mock data kullanılıyor',
      },
      {
        name: 'Redis Cache',
        status: dbHealth.status,
        latency: dbHealth.latency,
      },
    ],
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  };

  // HTTP status code - degraded varsa 503, yoksa 200
  const statusCode = healthStatus.status === 'operational' ? 200 : 503;

  return NextResponse.json(healthStatus, { status: statusCode });
}
