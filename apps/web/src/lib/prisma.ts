/**
 * Pantheon Prisma Client Singleton
 * Production'da connection pool sorunlarını önlemek için singleton pattern
 *
 * Lazy loading: Prisma client sadece runtime'da initialize olur,
 * build-time "page data collection" sorunlarını önler.
 */

// Prisma client tipi (runtime'da dinamik yüklenir)
type PrismaClientType = {
  user: any;
  portfolio: any;
  PortfolioPosition: any;
  PortfolioTransaction: any;
  session: any;
  watchlist: any;
  WatchlistItem: any;
  stock: any;
  [key: string]: any;
};

// @ts-ignore - Dynamic require
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType;
};

// Lazy Prisma client getter
function getPrismaClient(): PrismaClientType {
  if (!globalForPrisma.prisma) {
    // Dynamic import to avoid build-time initialization
    const { PrismaClient: PrismaClientClass } = require('@pantheon/db');
    globalForPrisma.prisma = new PrismaClientClass({
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  }
  return globalForPrisma.prisma;
}

// Proxy that delegates to the actual client with proper typing
export const prisma = new Proxy({} as PrismaClientType, {
  get(_target, prop) {
    const client = getPrismaClient();
    return client[prop as string];
  },
});

export default prisma;
