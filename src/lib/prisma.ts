import { PrismaClient } from "@prisma/client";

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "";
  const log = process.env.NODE_ENV === "development"
    ? (["error", "warn"] as const)
    : (["error"] as const);

  // Vercel / Neon ortamı — WebSocket tabanlı serverless adapter
  if (url.includes("neon.tech")) {
    const { neonConfig } = require("@neondatabase/serverless");
    const ws = require("ws");
    // Node.js ortamında WebSocket constructor'ını ayarla
    if (typeof WebSocket === "undefined") {
      neonConfig.webSocketConstructor = ws;
    }
    const { PrismaNeon } = require("@prisma/adapter-neon");
    const adapter = new PrismaNeon({ connectionString: url });
    return new PrismaClient({ adapter, log: [...log] });
  }

  // Yerel geliştirme — standart pg adapter
  const { PrismaPg } = require("@prisma/adapter-pg");
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter, log: [...log] });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
