import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { runMigrations } from "./db/migrate.js";

// Run migrations before accepting traffic so a fresh DB is always up-to-date.
if (env.databaseUrl) {
  try {
    console.log("[migrate] Starting migrations against:", env.databaseUrl.replace(/:[^:@]+@/, ':***@'));
    await runMigrations(env.databaseUrl);
  } catch (err) {
    console.error("[migrate] FATAL ERROR running migrations:", err);
    process.exit(1);
  }
} else {
  console.warn("[migrate] DATABASE_URL not set — skipping migrations");
}

const app = await buildApp();

try {
  await app.listen({
    host: env.host,
    port: env.port,
  });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
