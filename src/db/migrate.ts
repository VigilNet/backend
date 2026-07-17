import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Works both from src/ (dev) and dist/ (prod) — migrations are always at project root/migrations
const MIGRATIONS_DIR = join(__dirname, "../../migrations");

export async function runMigrations(databaseUrl: string): Promise<void> {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    // Create tracking table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id        serial PRIMARY KEY,
        filename  varchar(255) NOT NULL UNIQUE,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Get already-applied migrations
    const { rows } = await client.query<{ filename: string }>(
      "SELECT filename FROM _migrations ORDER BY id"
    );
    const applied = new Set(rows.map((r) => r.filename));

    // Read migration files, sort them lexicographically (001_, 002_, ...)
    const files = (await readdir(MIGRATIONS_DIR))
      .filter((f) => f.endsWith(".sql"))
      .sort();

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`[migrate] skip  ${file} (already applied)`);
        continue;
      }

      const sql = await readFile(join(MIGRATIONS_DIR, file), "utf8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO _migrations (filename) VALUES ($1)",
          [file]
        );
        await client.query("COMMIT");
        console.log(`[migrate] apply ${file}`);
      } catch (err) {
        await client.query("ROLLBACK");
        throw new Error(`Migration ${file} failed: ${String(err)}`);
      }
    }

    console.log("[migrate] all migrations applied");
  } finally {
    await client.end();
  }
}
