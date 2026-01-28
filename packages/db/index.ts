/**
 * Database Package - Pantheon Investment Platform
 *
 * Prisma client ve Redis cache export
 */

import { redis } from './redis';
export { redis, RedisClient, Cache, CacheInvalidate, CacheTTL } from './redis';

// Prisma client'ı da export et
import { PrismaClient, type Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Explicitly export Prisma types and client instead of export *
export { PrismaClient };
export type { Prisma };

export default {
  redis,
  prisma,
};
