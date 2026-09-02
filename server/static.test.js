import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createStaticHandler } from "./static.js";

const directories = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, {
    recursive: true,
    force: true,
  })));
});

describe("production static handler", () => {
  it("serves assets and falls back to the SPA entry point", async () => {
    const root = await mkdtemp(join(tmpdir(), "insights-yt-static-"));
    directories.push(root);
    await writeFile(join(root, "index.html"), "<main>app</main>");
    await writeFile(join(root, "app.js"), "console.log('app')");
    const handler = createStaticHandler(root);

    const asset = await request(handler, "/app.js");
    const route = await request(handler, "/history/video");

    expect(asset).toMatchObject({ status: 200, body: "console.log('app')" });
    expect(asset.headers["content-type"]).toContain("text/javascript");
    expect(route).toMatchObject({ status: 200, body: "<main>app</main>" });
    expect(route.headers["cache-control"]).toBe("no-cache");
  });

  it("does not use the SPA fallback for missing assets", async () => {
    const root = await mkdtemp(join(tmpdir(), "insights-yt-static-"));
    directories.push(root);
    await writeFile(join(root, "index.html"), "app");

    const response = await request(createStaticHandler(root), "/missing.js");

    expect(response.status).toBe(404);
  });
});

async function request(handler, url) {
  const response = {
    statusCode: 200,
    headers: {},
    body: "",
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(value = "") {
      this.body += value?.toString() ?? "";
    },
  };
  await handler({ method: "GET", url }, response);
  return { status: response.statusCode, headers: response.headers, body: response.body };
}
