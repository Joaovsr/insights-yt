import { z } from "zod";

export const sentimentSchema = z.enum(["positive", "neutral", "negative"]);

export const analyzedCommentSchema = z.object({
  id: z.string().min(1),
  author: z.string().min(1),
  text: z.string().min(1),
  likes: z.number().int().nonnegative(),
});

export const tagSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(36),
  description: z.string().min(1).max(180),
  commentCount: z.number().int().nonnegative(),
  sentiment: sentimentSchema,
  keywords: z.array(z.string().min(1).max(30)).max(6),
  comments: z.array(analyzedCommentSchema).min(1).max(100),
});

export const videoAnalysisSchema = z.object({
  videoId: z.string().regex(/^[\w-]{11}$/),
  url: z.string().url(),
  title: z.string().min(1).max(160),
  channel: z.string().min(1).max(100),
  thumbnail: z.string().url(),
  commentCountAnalyzed: z.number().int().min(1).max(100),
  summary: z.string().min(1).max(360),
  sentiment: z.object({
    positive: z.number().min(0).max(100),
    neutral: z.number().min(0).max(100),
    negative: z.number().min(0).max(100),
  }).refine(
    (value) => Math.abs(value.positive + value.neutral + value.negative - 100) < 0.01,
    "Os percentuais de sentimento devem totalizar 100.",
  ),
  tags: z.array(tagSchema).min(4).max(10),
}).superRefine((video, context) => {
  if (video.url !== `https://www.youtube.com/watch?v=${video.videoId}`) {
    context.addIssue({ code: "custom", path: ["url"], message: "A URL não corresponde ao videoId." });
  }
  if (video.thumbnail !== `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`) {
    context.addIssue({ code: "custom", path: ["thumbnail"], message: "A thumbnail não corresponde ao videoId." });
  }
  const tagIds = video.tags.map((tag) => tag.id);
  if (new Set(tagIds).size !== tagIds.length) {
    context.addIssue({ code: "custom", path: ["tags"], message: "IDs de tags devem ser únicos." });
  }
  const commentIds = video.tags.flatMap((tag) => tag.comments.map((comment) => comment.id));
  if (new Set(commentIds).size !== commentIds.length) {
    context.addIssue({ code: "custom", path: ["tags"], message: "Cada comentário deve pertencer a uma única tag." });
  }
  video.tags.forEach((tag, index) => {
    if (tag.commentCount !== tag.comments.length) {
      context.addIssue({
        code: "custom",
        path: ["tags", index, "commentCount"],
        message: "A contagem da tag deve corresponder aos comentários incluídos.",
      });
    }
  });
  if (commentIds.length !== video.commentCountAnalyzed) {
    context.addIssue({
      code: "custom",
      path: ["commentCountAnalyzed"],
      message: "Todos os comentários analisados devem estar presentes em uma tag.",
    });
  }
});

export const analysisResultSchema = z.object({
  generatedAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), "Data ISO-8601 inválida."),
  overview: z.string().min(1).max(420),
  video: videoAnalysisSchema,
  takeaways: z.array(z.string().min(1).max(220)).min(2).max(6),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type VideoAnalysis = z.infer<typeof videoAnalysisSchema>;
export type TagAnalysis = z.infer<typeof tagSchema>;
export type AnalyzedComment = z.infer<typeof analyzedCommentSchema>;
export type Sentiment = z.infer<typeof sentimentSchema>;
