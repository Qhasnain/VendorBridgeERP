import { PrismaClient } from '@prisma/client';

let dbUrl = process.env.DATABASE_URL;
let dbError: string | null = null;

let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  });
} catch (err: any) {
  dbError = `Prisma Client initialization error: ${err.message}`;
  console.error(`[PRISMA INIT] Error:`, err);
  prisma = null as any;
}

export { dbError };
export default prisma;
