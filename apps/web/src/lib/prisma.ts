/**
 * Pantheon Prisma Client Singleton
 * Production'da connection pool sorunlarını önlemek için singleton pattern
 */

import { prisma as dbPrisma } from '@pantheon/db';

export const prisma = dbPrisma;
export default prisma;
