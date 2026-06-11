import { PrismaClient } from "@/generated/prisma";

function createPrismaClient() {
  // Vercel/Neon ortamında WebSocket tabanlı adapter kullan
  if (process.env.NEON_DATABASE_URL || process.env.DATABASE_URL?.includes("neon.tech")) {
    // Neon serverless adapter (Vercel için)
    const { neon } = require("@neondatabase/serverless");
    const { PrismaNeon } = require("@prisma/adapter-neon");
    const sql = neon(process.env.DATABASE_URL!);
    const adapter = new PrismaNeon(sql);
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  // Yerel geliştirme: standart pg adapter
  const { PrismaPg } = require("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL ?? "" });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
