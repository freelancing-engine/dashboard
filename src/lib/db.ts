import { Pool } from "pg";

const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl:
          process.env.DATABASE_SSL === "false"
            ? false
            : { rejectUnauthorized: false },
        max: 5,
        idleTimeoutMillis: 30000,
      }
    : {
        host: process.env.POSTGRES_HOST || "localhost",
        port: parseInt(process.env.POSTGRES_PORT || "5432"),
        database: process.env.POSTGRES_DB || "freelancing_engine",
        user: process.env.POSTGRES_USER || "n8n_worker",
        password: process.env.POSTGRES_PASSWORD || "changeme",
        max: 5,
        idleTimeoutMillis: 30000,
      },
);

export default pool;
