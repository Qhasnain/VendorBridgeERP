import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let dbUrl = process.env.DATABASE_URL;

// If running in Vercel's serverless environment, copy the SQLite file to /tmp
if (process.env.VERCEL) {
  const sourceDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  const targetDbPath = '/tmp/dev.db';

  try {
    if (!fs.existsSync(targetDbPath)) {
      console.log(`[VERCEL DB SETUP] Copying SQLite DB from ${sourceDbPath} to ${targetDbPath}`);
      fs.copyFileSync(sourceDbPath, targetDbPath);
      // Grant write permissions to the file
      fs.chmodSync(targetDbPath, 0o666);
    } else {
      console.log(`[VERCEL DB SETUP] SQLite DB already exists at ${targetDbPath}`);
    }
    dbUrl = 'file:/tmp/dev.db';
    process.env.DATABASE_URL = dbUrl;
  } catch (err: any) {
    console.error(`[VERCEL DB SETUP] Failed to copy SQLite DB to /tmp: ${err.message}`);
  }
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

export default prisma;
