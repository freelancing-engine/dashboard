/**
 * @jest-environment node
 */
import { getLogger } from "@/lib/logger";

describe("getLogger", () => {
  let consoleSpy: {
    log: jest.SpyInstance;
    warn: jest.SpyInstance;
    error: jest.SpyInstance;
  };

  beforeEach(() => {
    consoleSpy = {
      log: jest.spyOn(console, "log").mockImplementation(),
      warn: jest.spyOn(console, "warn").mockImplementation(),
      error: jest.spyOn(console, "error").mockImplementation(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("emits info to console.log as JSON", () => {
    const log = getLogger("test");
    log.info("hello world");

    expect(consoleSpy.log).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(consoleSpy.log.mock.calls[0][0]);
    expect(parsed.level).toBe("info");
    expect(parsed.logger).toBe("test");
    expect(parsed.message).toBe("hello world");
    expect(parsed.timestamp).toBeDefined();
  });

  it("emits warn to console.warn as JSON", () => {
    const log = getLogger("test");
    log.warn("caution");

    expect(consoleSpy.warn).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(consoleSpy.warn.mock.calls[0][0]);
    expect(parsed.level).toBe("warn");
    expect(parsed.message).toBe("caution");
  });

  it("emits error to console.error as JSON", () => {
    const log = getLogger("test");
    log.error("failure");

    expect(consoleSpy.error).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(consoleSpy.error.mock.calls[0][0]);
    expect(parsed.level).toBe("error");
    expect(parsed.message).toBe("failure");
  });

  it("includes extra fields in output", () => {
    const log = getLogger("actions");
    log.info("request completed", { lead_id: "42", status: 200 });

    const parsed = JSON.parse(consoleSpy.log.mock.calls[0][0]);
    expect(parsed.lead_id).toBe("42");
    expect(parsed.status).toBe(200);
    expect(parsed.logger).toBe("actions");
  });

  it("uses the provided logger name", () => {
    const log = getLogger("custom-name");
    log.info("test");

    const parsed = JSON.parse(consoleSpy.log.mock.calls[0][0]);
    expect(parsed.logger).toBe("custom-name");
  });

  it("produces valid JSON for all levels", () => {
    const log = getLogger("json-test");
    log.info("i");
    log.warn("w");
    log.error("e");

    expect(() => JSON.parse(consoleSpy.log.mock.calls[0][0])).not.toThrow();
    expect(() => JSON.parse(consoleSpy.warn.mock.calls[0][0])).not.toThrow();
    expect(() => JSON.parse(consoleSpy.error.mock.calls[0][0])).not.toThrow();
  });
});
