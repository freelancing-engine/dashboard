import { Pool } from "pg";

const TEST_DB = process.env.POSTGRES_DB || "freelancing_engine_test";

/**
 * Global teardown: drop test database.
 */
export default async function globalTeardown() {
  const adminPool = new Pool({
    host: process.env.POSTGRES_HOST || "localhost",
    port: parseInt(process.env.POSTGRES_PORT || "5432"),
    database: "postgres",
    user: process.env.POSTGRES_USER || "postgres",
    password: process.env.POSTGRES_PASSWORD || "postgres",
  });

  // Terminate connections and drop test database
  await adminPool.query(
    `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1`,
    [TEST_DB],
  );
  await adminPool.query(`DROP DATABASE IF EXISTS "${TEST_DB}"`);
  await adminPool.end();
}
