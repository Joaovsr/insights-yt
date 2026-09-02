import { createAnalysisService } from "./analysis-service.js";
import { loadConfig } from "./config.js";
import { createOpenAIAnalyzer } from "./openai.js";
import { createYouTubeClient } from "./youtube.js";

export function createServiceFromEnv(env = process.env) {
  const config = loadConfig(env);
  const source = createYouTubeClient({ apiKey: config.youtubeApiKey });
  const analyzer = createOpenAIAnalyzer({
    apiKey: config.openaiApiKey,
    model: config.openaiModel,
    effort: config.reasoningEffort,
    timeout: config.openaiTimeoutMs,
    debugPayloads: config.debugPayloads,
  });
  return createAnalysisService({
    source,
    analyzer,
    maxCommentCharacters: 200,
    debugPayloads: config.debugPayloads,
  });
}
