import type { AnalysisResult } from "../lib/analysis";

export const analysisFixture: AnalysisResult = {
  generatedAt: "2026-08-08T15:00:00.000Z",
  overview: "A audiência discute foco, constância e tolerância ao tédio.",
  videos: [{
    videoId: "_RvNczunfsQ",
    url: "https://www.youtube.com/watch?v=_RvNczunfsQ",
    title: "Master boredom to get ahead",
    channel: "Daniel Barada",
    thumbnail: "https://i.ytimg.com/vi/_RvNczunfsQ/hqdefault.jpg",
    commentCountAnalyzed: 100,
    summary: "A audiência reconhece a baixa tolerância ao tédio como obstáculo.",
    sentiment: { positive: 70, neutral: 20, negative: 10 },
    tags: Array.from({ length: 4 }, (_, index) => ({
      id: `tag-${index}`,
      label: `Tema ${index + 1}`,
      description: "Descrição do tema identificado nos comentários.",
      commentCount: 10 + index,
      sentiment: "positive" as const,
      keywords: ["foco", "constância"],
      examples: [{
        id: `comment-${index}`,
        author: "@viewer",
        text: "Comentário representativo da audiência.",
        likes: index,
      }],
    })),
  }],
  takeaways: ["Persistência é o tema central.", "Distrações digitais aparecem com frequência."],
};
