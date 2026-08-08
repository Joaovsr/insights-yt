import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { analysisResultSchema, type AnalysisResult } from "../src/lib/analysis.js";
import { cleanYouTubeText } from "./text.js";

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(serverDirectory, "analysis-schema.json");
const MAX_OUTPUT_BYTES = 2_000_000;
const CODEX_TIMEOUT_MS = 240_000;

function buildPrompt(videoIds: string[]): string {
  const list = videoIds.map((id) => `- ${id}`).join("\n");
  const comparison = videoIds.length === 2
    ? "Compare os vídeos e preencha sharedThemes com os temas realmente presentes nos dois. Em cada tema compartilhado, inclua evidence com pelo menos um comentário real de cada vídeo."
    : "Como há somente um vídeo, retorne sharedThemes como array vazio.";

  return `Você é um analista de audiência do YouTube. Use exclusivamente o MCP youtube já configurado.

Vídeos:
${list}

Para cada vídeo:
1. Use getVideoDetails para título, canal e metadados.
2. Use getVideoComments com maxResults=100, order=relevance, commentDetail=SNIPPET e maxReplies=0.
3. Classifique os comentários em 4 a 10 tags temáticas claras em português.
4. Para cada tag, estime quantos dos comentários consultados pertencem a ela, identifique o sentimento predominante e selecione até 5 comentários representativos. Preserve o texto e autor originais.
5. Calcule percentuais aproximados de sentimento; positive + neutral + negative deve totalizar 100.

${comparison}

Regras:
- Não use busca web nem outras fontes.
- Não invente comentários ou métricas.
- Mantenha textos curtos e úteis para visualização.
- A URL canônica deve ser https://www.youtube.com/watch?v=VIDEO_ID.
- A thumbnail deve ser https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg.
- generatedAt deve ser uma data ISO-8601.
- Retorne somente o JSON no schema solicitado.`;
}

export async function analyzeWithCodex(videoIds: string[]): Promise<AnalysisResult> {
  const args = [
    "exec",
    "--ephemeral",
    "--sandbox",
    "read-only",
    "--skip-git-repo-check",
    "--output-schema",
    schemaPath,
    "-",
  ];

  const raw = await new Promise<string>((resolvePromise, reject) => {
    const child = spawn("codex", args, {
      cwd: resolve(serverDirectory, ".."),
      env: process.env,
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolvePromise(stdout.trim());
    };

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      finish(new CodexRunError("A análise excedeu o limite de 4 minutos.", 504));
    }, CODEX_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
      if (stdout.length > MAX_OUTPUT_BYTES) {
        child.kill("SIGTERM");
        finish(new CodexRunError("A resposta do Codex excedeu o limite permitido."));
      }
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr = (stderr + chunk.toString()).slice(-12_000);
    });

    child.on("error", (error) => {
      console.error("Falha ao iniciar o Codex:", error.message);
      finish(new CodexRunError("Não foi possível iniciar o Codex local."));
    });

    child.on("close", (code) => {
      if (code === 0) finish();
      else {
        console.error(`Codex encerrou com código ${code}:`, stderr.trim());
        finish(new CodexRunError("O Codex não conseguiu concluir a análise."));
      }
    });

    child.stdin.end(buildPrompt(videoIds));
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CodexRunError("O Codex retornou uma resposta inválida.");
  }

  const validation = analysisResultSchema.safeParse(parsed);
  if (!validation.success) {
    const details = validation.error.issues
      .slice(0, 4)
      .map((issue) => `${issue.path.join(".") || "resposta"}: ${issue.message}`)
      .join("; ");
    console.error("Resposta do Codex fora do contrato:", details);
    throw new CodexRunError("A resposta do Codex ficou fora do formato esperado.");
  }
  const result = {
    ...validation.data,
    videos: validation.data.videos.map((video) => ({
      ...video,
      tags: video.tags.map((tag) => ({
        ...tag,
        examples: tag.examples.map((example) => ({
          ...example,
          text: cleanYouTubeText(example.text),
        })),
      })),
    })),
    sharedThemes: validation.data.sharedThemes.map((theme) => ({
      ...theme,
      evidence: theme.evidence.map((item) => ({ ...item, text: cleanYouTubeText(item.text) })),
    })),
  } satisfies AnalysisResult;
  const returnedIds = result.videos.map((video) => video.videoId).sort();
  const requestedIds = [...videoIds].sort();
  if (JSON.stringify(returnedIds) !== JSON.stringify(requestedIds)) {
    throw new CodexRunError("A resposta do Codex não corresponde aos vídeos solicitados.");
  }

  return result;
}

export class CodexRunError extends Error {
  constructor(message: string, public readonly status = 502) {
    super(message);
    this.name = "CodexRunError";
  }
}
