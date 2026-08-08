import { z } from "zod";

export const sentimentSchema = z.enum(["positive", "neutral", "negative"]);

export const commentExampleSchema = z.object({
  id: z.string().min(1),
  author: z.string().min(1),
  text: z.string().min(1).max(280),
  likes: z.number().int().nonnegative(),
});

export const tagSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(36),
  description: z.string().min(1).max(180),
  commentCount: z.number().int().nonnegative(),
  sentiment: sentimentSchema,
  keywords: z.array(z.string().min(1).max(30)).max(6),
  examples: z.array(commentExampleSchema).max(5),
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
  }),
  tags: z.array(tagSchema).min(4).max(10),
});

export const analysisResultSchema = z.object({
  generatedAt: z.string(),
  overview: z.string().min(1).max(420),
  videos: z.array(videoAnalysisSchema).min(1).max(2),
  sharedThemes: z.array(
    z.object({
      label: z.string().min(1).max(36),
      description: z.string().min(1).max(180),
      videoIds: z.array(z.string().regex(/^[\w-]{11}$/)).min(2).max(2),
    }),
  ).max(8),
  takeaways: z.array(z.string().min(1).max(220)).min(2).max(6),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;
export type VideoAnalysis = z.infer<typeof videoAnalysisSchema>;
export type TagAnalysis = z.infer<typeof tagSchema>;
export type CommentExample = z.infer<typeof commentExampleSchema>;
export type Sentiment = z.infer<typeof sentimentSchema>;
