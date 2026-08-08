import { z } from "zod";

const requestSchema = z.object({
  url: z.string().trim().min(1),
}).strict();

const videoIdSchema = z.string().regex(/^[A-Za-z0-9_-]{11}$/);

export function extractVideoId(value: string): string | null {
  const trimmed = value.trim();

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }

  const hostname = url.hostname.replace(/^www\./, "").toLowerCase();
  let candidate: string | null = null;

  if (hostname === "youtu.be") {
    candidate = url.pathname.split("/").filter(Boolean)[0] ?? null;
  } else if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
    candidate = url.searchParams.get("v");
    if (!candidate) {
      const parts = url.pathname.split("/").filter(Boolean);
      if (["shorts", "embed", "live"].includes(parts[0] ?? "")) {
        candidate = parts[1] ?? null;
      }
    }
  }

  return candidate && videoIdSchema.safeParse(candidate).success ? candidate : null;
}

export function parseVideoRequest(input: unknown): string {
  const { url } = requestSchema.parse(input);
  const id = extractVideoId(url);
  if (!id) throw new Error(`URL do YouTube inválida: ${url}`);
  return id;
}
