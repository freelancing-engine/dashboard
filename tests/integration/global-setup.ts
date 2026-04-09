import { Pool } from "pg";
import * as fs from "fs";
import * as path from "path";

const TEST_DB = process.env.POSTGRES_DB || "freelancing_engine_test";

/**
 * Find the schema file. Looks in multiple locations:
 * 1. SCHEMA_PATH env var (CI can set this)
 * 2. Local test fixture (committed to repo for CI)
 * 3. Workspace-relative path (local dev with multi-root workspace)
 */
function findSchemaPath(): string {
  const candidates = [
    process.env.SCHEMA_PATH,
    path.resolve(__dirname, "schema.sql"),
    path.resolve(
      __dirname,
      "../../../../docs/freelancing-engine/09-postgres-schema.sql",
    ),
    path.resolve(
      __dirname,
      "../../../docs/freelancing-engine/09-postgres-schema.sql",
    ),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    `Schema file not found. Searched:\n${candidates.join("\n")}\nSet SCHEMA_PATH env var to the correct location.`,
  );
}

/**
 * Global setup: create test database and apply schema.
 * Expects a running Postgres (CI service container or local Docker).
 */
export default async function globalSetup() {
  const adminPool = new Pool({
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    database: "postgres",
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
  });

  // Create test database if it doesn't exist
  const exists = await adminPool.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [TEST_DB],
  );
  if (exists.rowCount === 0) {
    await adminPool.query(`CREATE DATABASE "${TEST_DB}"`);
  }
  await adminPool.end();

  // Apply schema
  const testPool = new Pool({
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    database: TEST_DB,
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
  });

  const schemaPath = findSchemaPath();
  const schema = fs.readFileSync(schemaPath, "utf-8");
  await testPool.query(schema);
  await testPool.end();
}
