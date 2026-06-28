import { config } from "dotenv";
import { readFileSync } from "fs";
import { join } from "path";
import { Client } from "pg";

config({ path: join(process.cwd(), ".env.local") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set in .env.local");
  console.error("See .env.example for the expected format.");
  process.exit(1);
}

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

async function run() {
  const client = new Client({ connectionString: DATABASE_URL });
  await client.connect();
  console.log("Connected to database.");

  // Ensure migrations tracking table exists.
  await client.query(`
    create table if not exists _forged_migrations (
      id serial primary key,
      filename text unique not null,
      applied_at timestamptz not null default now()
    )
  `);

  const migrationFiles = [
    "0001_init.sql",
  ].map((f) => join(MIGRATIONS_DIR, f));

  for (const file of migrationFiles) {
    const filename = file.split("/").pop()!;
    const { rows } = await client.query(
      "select id from _forged_migrations where filename = $1",
      [filename]
    );
    if (rows.length > 0) {
      console.log(`  ⏭  ${filename} already applied — skipping`);
      continue;
    }
    const sql = readFileSync(file, "utf8");
    console.log(`  ▶  Applying ${filename}...`);
    await client.query(sql);
    await client.query(
      "insert into _forged_migrations (filename) values ($1)",
      [filename]
    );
    console.log(`  ✓  ${filename} applied`);
  }

  await client.end();
  console.log("\nMigrations complete.");
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
