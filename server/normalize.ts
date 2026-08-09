export function normalizeCodexPayload(value: unknown): unknown {
  if (!isRecord(value)) return value;

  const video = isRecord(value.video) ? value.video : value.video;
  return {
    ...value,
    overview: compact(value.overview, 420),
    takeaways: Array.isArray(value.takeaways)
      ? value.takeaways.map((item) => compact(item, 220))
      : value.takeaways,
    video: isRecord(video)
      ? {
          ...video,
          title: compact(video.title, 160),
          channel: compact(video.channel, 100),
          summary: compact(video.summary, 360),
          tags: Array.isArray(video.tags)
            ? video.tags.map(normalizeTag)
            : video.tags,
        }
      : video,
  };
}

function normalizeTag(value: unknown): unknown {
  if (!isRecord(value)) return value;
  return {
    ...value,
    label: compact(value.label, 36),
    description: compact(value.description, 180),
    keywords: Array.isArray(value.keywords)
      ? value.keywords.map((keyword) => compact(keyword, 30))
      : value.keywords,
  };
}

function compact(value: unknown, maxLength: number): unknown {
  if (typeof value !== "string" || value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
