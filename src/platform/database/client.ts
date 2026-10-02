import { Prisma, PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** Either the root client or a transaction client. Repositories accept this so callers control transactions. */
export type DbClient = PrismaClient | Prisma.TransactionClient;

/** Runs `work` in a single database transaction; everything inside commits or rolls back together. */
export function runInTransaction<T>(work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  return prisma.$transaction(work);
}
