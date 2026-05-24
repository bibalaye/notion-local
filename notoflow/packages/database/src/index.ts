import { Plan, PrismaClient } from "./generated/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
      new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
      }));

/** Alias Prisma utilisé dans les routes API (ex. webhooks Stripe). */
export const db = prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { Plan, PrismaClient };
