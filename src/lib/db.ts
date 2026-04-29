import { Pool } from "pg";

declare global {
  var __chcPgPool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Add it to your environment variables.");
  }
  return new Pool({ connectionString });
}

export const pgPool = global.__chcPgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  global.__chcPgPool = pgPool;
}

