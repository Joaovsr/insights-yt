import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("HTTP app", () => {
  it("reports its health", async () => {
    const response = await request(createApp(), "GET", "/health");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("application/json");
    expect(response.json).toEqual({
      name: "yt-signals",
      status: "ok",
    });
  });

  it("returns a stable JSON error for unknown routes", async () => {
    const response = await request(createApp(), "GET", "/unknown");

    expect(response.status).toBe(404);
    expect(response.json).toEqual({
      error: { code: "not_found", message: "Recurso não encontrado." },
    });
  });
});

async function request(app, method, url) {
  const headers = {};
  let body = "";
  const response = {
    statusCode: 200,
    setHeader(name, value) {
      headers[name.toLowerCase()] = value;
    },
    end(value = "") {
      body += value;
    },
  };
  await app({ method, url }, response);
  return {
    status: response.statusCode,
    headers,
    json: JSON.parse(body),
  };
}
