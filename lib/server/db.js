import "server-only";
import { PrismaClient } from "@prisma/client";

// Reuse one client across hot reloads in dev so we do not exhaust MySQL connections.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.__suaraPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.__suaraPrisma = prisma;
}
