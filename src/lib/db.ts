import { PrismaClient } from "@prisma/client";

// In dev, Next.js ricarica i moduli spesso (hot reload): senza questo trucco
// ogni reload creerebbe una nuova connessione a Postgres. Il singleton globale
// evita di esaurire le connessioni disponibili.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
