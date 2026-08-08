import express from "express";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ZodError } from "zod";
import { analyzeWithCodex } from "./codex.js";
import { parseVideoRequest } from "./youtube.js";

const app = express();
const port = Number(process.env.PORT ?? 8787);
let analysisInFlight = false;

app.disable("x-powered-by");
app.use(express.json({ limit: "12kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, codex: "configured-locally" });
});

app.post("/api/analyze", async (request, response) => {
  if (analysisInFlight) {
    response.status(429).json({ error: "Já existe uma análise em andamento. Aguarde a conclusão." });
    return;
  }

  try {
    const videoIds = parseVideoRequest(request.body);
    analysisInFlight = true;
    const result = await analyzeWithCodex(videoIds);
    response.json(result);
  } catch (error) {
    const message = error instanceof ZodError
      ? "Dados de entrada ou resposta do Codex fora do formato esperado."
      : error instanceof Error
        ? error.message
        : "Falha inesperada ao analisar os vídeos.";
    response.status(error instanceof ZodError ? 422 : 400).json({ error: message });
  } finally {
    analysisInFlight = false;
  }
});

const distPath = resolve(process.cwd(), "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*splat", (_request, response) => response.sendFile(resolve(distPath, "index.html")));
}

app.listen(port, "127.0.0.1", () => {
  console.log(`YT Signals API disponível em http://127.0.0.1:${port}`);
});
