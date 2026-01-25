/**
 * Database Package - Pantheon Investment Platform
 *
 * Prisma client ve Redis cache export
 */

import { redis } from './redis.js';
export { redis, RedisClient, Cache, CacheInvalidate, CacheTTL } from './redis.js';

// Prisma client'ı da export et
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export * from '@prisma/client';

export default {
  redis,
  prisma,
};
