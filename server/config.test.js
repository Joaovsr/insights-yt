import { describe, expect, it } from "vitest";
import { loadConfig, parseDuration, parseHttpAddress } from "./config.js";

describe("server config", () => {
  it("accepts the duration and address formats from the Go .env", () => {
    const config = loadConfig({
      YOUTUBE_API_KEY: "youtube",
      OPENAI_API_KEY: "openai",
      OPENAI_TIMEOUT: "2m30s",
    });

    expect(config.openaiTimeoutMs).toBe(150_000);
    expect(parseHttpAddress({ HTTP_ADDRESS: "127.0.0.1:9090" }))
      .toEqual({ host: "127.0.0.1", port: 9090 });
  });

  it("rejects missing secrets and invalid durations", () => {
    expect(() => loadConfig({})).toThrow("are required");
    expect(() => parseDuration("soon")).toThrow("positive duration");
  });
});
