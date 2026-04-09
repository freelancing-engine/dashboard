import { NextResponse } from "next/server";
import pool from "@/lib/db";

const startTime = Date.now();

export async function GET() {
  let dbStatus: "ok" | "error" = "error";
  let dbLatencyMs: number | null = null;

  try {
    const t0 = Date.now();
    await pool.query("SELECT 1");
    dbLatencyMs = Date.now() - t0;
    dbStatus = "ok";
  } catch {
    dbStatus = "error";
  }

  const healthy = dbStatus === "ok";

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      service: "freelancing-engine-dashboard",
      version: process.env.npm_package_version || "1.0.0",
      uptime_seconds: Math.round((Date.now() - startTime) / 1000),
      checks: {
        database: {
          status: dbStatus,
          latency_ms: dbLatencyMs,
        },
      },
    },
    { status: healthy ? 200 : 503 },
  );
}
