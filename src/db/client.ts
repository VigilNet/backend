import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { env } from "../config/env.js";
import * as schema from "./schema/index.js";

export function createDbClient(databaseUrl = env.databaseUrl) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to create a database client");
  }

  const pool = new pg.Pool({
    connectionString: databaseUrl,
  });

  return {
    db: drizzle(pool, { schema }),
    pool,
  };
}

let dbContext: DbContext | undefined;

export function getDbContext() {
  dbContext ??= createDbClient();

  return dbContext;
}

export type DbContext = ReturnType<typeof createDbClient>;
export type DbClient = DbContext["db"];
