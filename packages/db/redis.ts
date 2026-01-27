/**
 * Redis Cache Client (Mock Version)
 *
 * Build sırasında hata oluşmaması için ioredis import'u kaldırıldı
 * Gerçek Redis entegrasyonu istenirse dynamik import yapılabilir
 */

// === CONFIG ===

// Cache TTL (saniye cinsinden)
export const CacheTTL = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 5 * 60,
  FIFTEEN_MINUTES: 15 * 60,
  THIRTY_MINUTES: 30 * 60,
  ONE_HOUR: 60 * 60,
  ONE_DAY: 24 * 60 * 60,
} as const;

// === MOCK REDIS CLIENT ===

class MockRedisClient {
  private static instance: MockRedisClient;
  private mockCache: Map<string, { value: string; expiry: number }>;

  private constructor() {
    this.mockCache = new Map();
  }

  public static getInstance(): MockRedisClient {
    if (!MockRedisClient.instance) {
      MockRedisClient.instance = new MockRedisClient();
    }
    return MockRedisClient.instance;
  }

  /**
   * Cache'ten değer getir
   */
  async get<T>(key: string): Promise<T | null> {
    const item = this.mockCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.mockCache.delete(key);
      return null;
    }

    return JSON.parse(item.value) as T;
  }

  /**
   * Cache'e değer yaz (TTL ile)
   */
  async set(key: string, value: unknown, ttl: number = CacheTTL.ONE_HOUR): Promise<void> {
    this.mockCache.set(key, {
      value: JSON.stringify(value),
      expiry: Date.now() + ttl * 1000,
    });
  }

  /**
   * Cache'ten sil
   */
  async del(key: string): Promise<void> {
    this.mockCache.delete(key);
  }

  /**
   * Pattern ile toplu silme (örn: "stocks:*")
   */
  async delPattern(pattern: string): Promise<void> {
    for (const key of this.mockCache.keys()) {
      if (this.matchPattern(key, pattern)) {
        this.mockCache.delete(key);
      }
    }
  }

  /**
   * Tüm cache'i temizle
   */
  async flush(): Promise<void> {
    this.mockCache.clear();
  }

  /**
   * Cache durumunu kontrol et
   */
  async ping(): Promise<boolean> {
    return true;
  }

  /**
   * Bağlantıyı kapat (mock - no-op)
   */
  async quit(): Promise<void> {
    // No-op for mock
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(regexPattern).test(key);
  }
}

// === CACHE DECORATORS ===

/**
 * Metot sonuçlarını cache'leyen decorator
 */
export function Cache(prefix: string, ttl: number = CacheTTL.ONE_HOUR) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cache = MockRedisClient.getInstance();

      const argsKey = args.length > 0 ? ':' + args.map((a) => JSON.stringify(a)).join(':') : '';
      const cacheKey = `${prefix}:${propertyKey}${argsKey}`;

      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      await cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache invalidate decorator
 */
export function CacheInvalidate(pattern: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cache = MockRedisClient.getInstance();
      await cache.delPattern(pattern);
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// === EXPORTS ===

export { MockRedisClient as RedisClient };

// Redis client'ı her zaman null döndür (mock cache kullanılacak)
export const redis = null;

export default MockRedisClient;
