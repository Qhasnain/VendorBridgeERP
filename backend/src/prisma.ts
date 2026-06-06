import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let dbUrl = process.env.DATABASE_URL;
let dbError: string | null = null;

// If running in Vercel's serverless environment, copy the SQLite file to /tmp
if (process.env.VERCEL) {
  try {
    const sourceDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    const targetDbPath = '/tmp/dev.db';

    console.log(`[VERCEL DB SETUP] Source DB path: ${sourceDbPath}`);
    console.log(`[VERCEL DB SETUP] Target DB path: ${targetDbPath}`);

    if (fs.existsSync(sourceDbPath)) {
      if (!fs.existsSync(targetDbPath)) {
        fs.copyFileSync(sourceDbPath, targetDbPath);
        // Grant write permissions to the file
        fs.chmodSync(targetDbPath, 0o666);
        console.log(`[VERCEL DB SETUP] SQLite DB successfully copied to /tmp`);
      } else {
        console.log(`[VERCEL DB SETUP] SQLite DB already exists at ${targetDbPath}`);
      }
      dbUrl = 'file:/tmp/dev.db';
      process.env.DATABASE_URL = dbUrl;
    } else {
      // Find what files exist in the cwd to debug the path
      let filesInCwd: string[] = [];
      try {
        filesInCwd = fs.readdirSync(process.cwd());
      } catch (dirErr: any) {
        filesInCwd = [dirErr.message];
      }
      
      throw new Error(
        `Source database not found at ${sourceDbPath}. process.cwd() is ${process.cwd()} containing: [${filesInCwd.join(', ')}]`
      );
    }
  } catch (err: any) {
    dbError = `Database Setup Failure: ${err.message}`;
    console.error(`[VERCEL DB SETUP] Error during copy:`, err);
  }
}

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
  dbError = dbError 
    ? `${dbError} | Prisma Client initialization error: ${err.message}`
    : `Prisma Client initialization error: ${err.message}`;
  console.error(`[PRISMA INIT] Error:`, err);
  prisma = null as any;
}

export { dbError };
export default prisma;
