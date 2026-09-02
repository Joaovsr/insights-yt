import type { IncomingMessage, ServerResponse } from "node:http";

export type AnalysisService = {
  analyze(
    videoId: string,
    limit: number,
    options?: { signal?: AbortSignal },
  ): Promise<{ video: { commentCountAnalyzed: number }; [key: string]: unknown }>;
};

export function createApp(options?: {
  analysisService?: AnalysisService;
  logger?: { info?: (...values: unknown[]) => void } | null;
}): (
  request: IncomingMessage,
  response: ServerResponse,
  next?: (error?: unknown) => void | Promise<void>,
) => Promise<void>;

export function writeJson(response: ServerResponse, status: number, value: unknown): void;
