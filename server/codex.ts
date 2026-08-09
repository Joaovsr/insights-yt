import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { analysisResultSchema, type AnalysisResult } from "../src/lib/analysis.js";
import { cleanYouTubeText } from "./text.js";
import { normalizeCodexPayload } from "./normalize.js";

const serverDirectory = dirname(fileURLToPath(import.meta.url));
const schemaPath = resolve(serverDirectory, "analysis-schema.json");
const MAX_OUTPUT_BYTES = 2_000_000;
const CODEX_TIMEOUT_MS = 240_000;

function buildPrompt(videoId: string): string {
  return `Você é um analista de audiência do YouTube. Use exclusivamente o MCP youtube já configurado.

Vídeo: ${videoId}

Para o vídeo:
1. Use getVideoDetails para título, canal e metadados.
2. Use getVideoComments com maxResults=100, order=relevance, commentDetail=SNIPPET e maxReplies=0.
3. Classifique TODOS os comentários retornados em 4 a 10 tags temáticas claras em português. Cada comentário deve pertencer a exatamente uma tag principal; não repita o mesmo comentário em tags diferentes.
4. Em cada tag, inclua em comments TODOS os comentários atribuídos a ela, preservando id, texto e autor originais. commentCount deve ser exatamente o tamanho de comments, e commentCountAnalyzed deve ser a soma dos comments de todas as tags.
5. Calcule percentuais aproximados de sentimento; positive + neutral + negative deve totalizar 100.

Regras:
- Não use busca web nem outras fontes.
- Não invente comentários ou métricas.
- Mantenha textos curtos e úteis para visualização.
- A URL canônica deve ser https://www.youtube.com/watch?v=VIDEO_ID.
- A thumbnail deve ser https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg.
- generatedAt deve ser uma data ISO-8601.
- Retorne somente o JSON no schema solicitado.`;
}

export async function analyzeWithCodex(videoId: string): Promise<AnalysisResult> {
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

    child.stdin.end(buildPrompt(videoId));
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new CodexRunError("O Codex retornou uma resposta inválida.");
  }

  const validation = analysisResultSchema.safeParse(normalizeCodexPayload(parsed));
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
    video: {
      ...validation.data.video,
      tags: validation.data.video.tags.map((tag) => ({
        ...tag,
        comments: tag.comments.map((comment) => ({
          ...comment,
          text: cleanYouTubeText(comment.text),
        })),
      })),
    },
  } satisfies AnalysisResult;
  if (result.video.videoId !== videoId) {
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
