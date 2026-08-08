const entities: Record<string, string> = {
  "&amp;": "&",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&lt;": "<",
  "&gt;": ">",
};

export function cleanYouTubeText(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<a\b[^>]*>(.*?)<\/a>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|quot|#39|apos|lt|gt);/g, (entity) => entities[entity] ?? entity)
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
