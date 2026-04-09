/**
 * @jest-environment node
 */
import { GET } from "@/app/api/health/route";

// Mock the pg pool
const mockQuery = jest.fn();
jest.mock("@/lib/db", () => ({
  __esModule: true,
  default: { query: (...args: unknown[]) => mockQuery(...args) },
}));

describe("GET /api/health", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 when database is healthy", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.service).toBe("freelancing-engine-dashboard");
    expect(body.checks.database.status).toBe("ok");
    expect(typeof body.checks.database.latency_ms).toBe("number");
    expect(typeof body.uptime_seconds).toBe("number");
  });

  it("returns 503 when database is down", async () => {
    mockQuery.mockRejectedValueOnce(new Error("connection refused"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.status).toBe("degraded");
    expect(body.checks.database.status).toBe("error");
    expect(body.checks.database.latency_ms).toBeNull();
  });

  it("includes version field", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });

    const response = await GET();
    const body = await response.json();

    expect(body.version).toBeDefined();
    expect(typeof body.version).toBe("string");
  });

  it("includes uptime_seconds field", async () => {
    mockQuery.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });

    const response = await GET();
    const body = await response.json();

    expect(body.uptime_seconds).toBeGreaterThanOrEqual(0);
  });
});
