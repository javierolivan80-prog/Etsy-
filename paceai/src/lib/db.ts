/**
 * Prisma client singleton.
 *
 * Only instantiated when DATABASE_URL is present; the rest of the app goes
 * through src/lib/data.ts, which falls back to demo data without a database.
 */
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient();
  }
  return globalForPrisma.prisma;
}
