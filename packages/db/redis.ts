/**
 * Redis Cache Client
 *
 * Pantheon Investment Platform için cache katmanı
 * Sık erişilen verileri önbellekte tutarak performansı artırır
 *
 * Kullanım:
 * - İş Yatırım hisse listesi: 1 saat
 * - Piyasa verileri: 5 dakika
 * - Teknik indikatörler: 15 dakika
 * - Analiz sonuçları: 30 dakika
 */

import Redis from 'ioredis';

// === CONFIG ===

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false'; // Varsayılan: açık

// Cache TTL (saniye cinsinden)
export const CacheTTL = {
  ONE_MINUTE: 60,
  FIVE_MINUTES: 5 * 60,
  FIFTEEN_MINUTES: 15 * 60,
  THIRTY_MINUTES: 30 * 60,
  ONE_HOUR: 60 * 60,
  ONE_DAY: 24 * 60 * 60,
} as const;

// === REDIS CLIENT ===

class RedisClient {
  private static instance: RedisClient;
  private client: Redis | null = null;
  private mockCache: Map<string, { value: string; expiry: number }>;
  private enabled: boolean;

  private constructor() {
    this.enabled = REDIS_ENABLED;
    this.mockCache = new Map();

    if (this.enabled) {
      try {
        this.client = new Redis(REDIS_URL, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * 50, 2000),
          lazyConnect: true,
        });

        this.client.on('error', (err) => {
          console.warn('⚠️ Redis bağlantı hatası - Mock cache kullanılıyor:', err.message);
          this.enabled = false;
          this.client = null;
        });

        this.client.on('connect', () => {
          console.log('✅ Redis bağlantısı kuruldu');
        });

        // Bağlantıyı test et
        this.client.connect().catch(() => {
          console.warn('⚠️ Redis sunucusuna bağlanılamadı - Mock cache kullanılıyor');
          this.client = null;
          this.enabled = false;
        });
      } catch (err) {
        console.warn('⚠️ Redis başlatılamadı - Mock cache kullanılıyor');
        this.client = null;
        this.enabled = false;
      }
    } else {
      console.log('ℹ️ Redis devre dışı - Mock cache kullanılıyor');
    }
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  /**
   * Cache'ten değer getir
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) {
      return this.getMock<T>(key);
    }

    try {
      const value = await this.client!.get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (err) {
      console.warn(`Cache get error for key "${key}":`, err);
      return null;
    }
  }

  /**
   * Cache'e değer yaz (TTL ile)
   */
  async set(key: string, value: unknown, ttl: number = CacheTTL.ONE_HOUR): Promise<void> {
    if (!this.enabled) {
      return this.setMock(key, value, ttl);
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client!.setex(key, ttl, serialized);
    } catch (err) {
      console.warn(`Cache set error for key "${key}":`, err);
    }
  }

  /**
   * Cache'ten sil
   */
  async del(key: string): Promise<void> {
    if (!this.enabled) {
      this.mockCache.delete(key);
      return;
    }

    try {
      await this.client!.del(key);
    } catch (err) {
      console.warn(`Cache del error for key "${key}":`, err);
    }
  }

  /**
   * Pattern ile toplu silme (örn: "stocks:*")
   */
  async delPattern(pattern: string): Promise<void> {
    if (!this.enabled) {
      for (const key of this.mockCache.keys()) {
        if (this.matchPattern(key, pattern)) {
          this.mockCache.delete(key);
        }
      }
      return;
    }

    try {
      const keys = await this.client!.keys(pattern);
      if (keys.length > 0) {
        await this.client!.del(...keys);
      }
    } catch (err) {
      console.warn(`Cache delPattern error for pattern "${pattern}":`, err);
    }
  }

  /**
   * Tüm cache'i temizle
   */
  async flush(): Promise<void> {
    if (!this.enabled) {
      this.mockCache.clear();
      return;
    }

    try {
      await this.client!.flushdb();
    } catch (err) {
      console.warn('Cache flush error:', err);
    }
  }

  /**
   * Cache durumunu kontrol et
   */
  async ping(): Promise<boolean> {
    if (!this.enabled) return true;

    try {
      const result = await this.client!.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Bağlantıyı kapat
   */
  async quit(): Promise<void> {
    if (this.client) {
      await this.client.quit();
    }
  }

  // === MOCK CACHE METHODS ===

  private getMock<T>(key: string): T | null {
    const item = this.mockCache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.mockCache.delete(key);
      return null;
    }

    return JSON.parse(item.value) as T;
  }

  private setMock(key: string, value: unknown, ttl: number): void {
    this.mockCache.set(key, {
      value: JSON.stringify(value),
      expiry: Date.now() + ttl * 1000,
    });
  }

  private matchPattern(key: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    return new RegExp(regexPattern).test(key);
  }
}

// === CACHE DECORATOR ===

/**
 * Metot sonuçlarını cache'leyen decorator
 *
 * Kullanım:
 * ```ts
 * class MyService {
 *   @Cache('stocks', CacheTTL.ONE_HOUR)
 *   async getStocks() { ... }
 * }
 * ```
 */
export function Cache(prefix: string, ttl: number = CacheTTL.ONE_HOUR) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cache = RedisClient.getInstance();

      // Cache key oluştur: prefix:method:arg1:arg2
      const argsKey = args.length > 0 ? ':' + args.map((a) => JSON.stringify(a)).join(':') : '';
      const cacheKey = `${prefix}:${propertyKey}${argsKey}`;

      // Önce cache'ten dene
      const cached = await cache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // Cache'te yoksa, metodu çalıştır
      const result = await originalMethod.apply(this, args);

      // Sonucu cache'e yaz
      await cache.set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache invalidate decorator
 * Belirli bir pattern'deki cache'leri siler
 */
export function CacheInvalidate(pattern: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const cache = RedisClient.getInstance();

      // Önce cache'leri temizle
      await cache.delPattern(pattern);

      // Sonra metodu çalıştır
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// === EXPORTS ===

export { RedisClient };
export const redis = RedisClient.getInstance();

export default RedisClient;
