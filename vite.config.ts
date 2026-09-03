import "dotenv/config";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { createApp } from "./server/app.js";
import { createServiceFromEnv } from "./server/bootstrap.js";

export default defineConfig({
  plugins: [react(), analysisApi()],
  server: {
    host: "127.0.0.1",
    port: 5173,
  },
});

function analysisApi(): Plugin {
  return {
    name: "yt-signals-analysis-api",
    apply: "serve",
    configureServer(server) {
      const app = createApp({ analysisService: createServiceFromEnv() });
      server.middlewares.use((request, response, next) => {
        Promise.resolve(app(request, response, next)).catch(next);
      });
    },
  };
}
