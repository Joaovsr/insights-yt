import "dotenv/config";
import { createServer } from "node:http";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { createServiceFromEnv } from "./bootstrap.js";
import { parseHttpAddress } from "./config.js";
import { createStaticHandler } from "./static.js";

const { host, port } = parseHttpAddress();
const analysisService = createServiceFromEnv();
const app = createApp({ analysisService });
const staticHandler = createStaticHandler(resolve(dirname(fileURLToPath(import.meta.url)), "../dist"));
const server = createServer((request, response) => {
  Promise.resolve(app(request, response, () => staticHandler(request, response)))
    .catch((error) => {
      console.error("Unhandled HTTP error", error);
      if (!response.headersSent) {
        response.statusCode = 500;
        response.setHeader("Content-Type", "text/plain; charset=utf-8");
      }
      if (!response.writableEnded) response.end("Internal server error\n");
    });
});

server.listen(port, host, () => {
  console.log(`yt-signals listening on http://${host}:${port}`);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.once(signal, () => {
    server.close((error) => {
      if (error) {
        console.error("HTTP shutdown failed", error);
        process.exitCode = 1;
      }
    });
  });
}
