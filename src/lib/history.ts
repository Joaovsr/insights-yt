import { z } from "zod";
import { analysisResultSchema, type AnalysisResult } from "./analysis";

const HISTORY_KEY = "yt-signals:search-history:v1";
const MAX_HISTORY_ITEMS = 6;

const searchHistoryItemSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  title: z.string().min(1),
  channel: z.string().min(1),
  searchedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Data inválida."),
  result: analysisResultSchema,
});

const searchHistorySchema = z.array(searchHistoryItemSchema).max(MAX_HISTORY_ITEMS);

export type SearchHistoryItem = z.infer<typeof searchHistoryItemSchema>;

export function readSearchHistory(storage: Storage = window.localStorage): SearchHistoryItem[] {
  try {
    const raw = storage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    const validation = searchHistorySchema.safeParse(parsed);
    return validation.success ? validation.data : [];
  } catch {
    return [];
  }
}

export function rememberSearch(
  url: string,
  result: AnalysisResult,
  storage: Storage = window.localStorage,
): SearchHistoryItem[] {
  const video = result.video;
  const item: SearchHistoryItem = {
    id: `${video.videoId}:${result.generatedAt}`,
    url,
    title: video.title,
    channel: video.channel,
    searchedAt: new Date().toISOString(),
    result,
  };
  const next = [item, ...readSearchHistory(storage).filter((entry) => entry.result.video.videoId !== video.videoId)]
    .slice(0, MAX_HISTORY_ITEMS);
  try {
    storage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {
    // Keep the current session usable when localStorage is unavailable or full.
  }
  return next;
}

export function clearSearchHistory(storage: Storage = window.localStorage): void {
  try {
    storage.removeItem(HISTORY_KEY);
  } catch {
    // Clearing persisted history should not break the UI.
  }
}
