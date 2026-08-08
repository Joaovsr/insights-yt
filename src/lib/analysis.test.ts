import { describe, expect, it } from "vitest";
import { demoAnalysis } from "../data/demo";
import { analysisResultSchema } from "./analysis";

describe("analysisResultSchema", () => {
  it("accepts the complete analysis contract", () => {
    expect(analysisResultSchema.safeParse(demoAnalysis).success).toBe(true);
  });

  it("rejects sentiment percentages that do not total 100", () => {
    const input = structuredClone(demoAnalysis);
    input.videos[0].sentiment = { positive: 50, neutral: 20, negative: 5 };
    expect(analysisResultSchema.safeParse(input).success).toBe(false);
  });

  it("rejects video URLs that do not match the video ID", () => {
    const input = structuredClone(demoAnalysis);
    input.videos[0].url = "https://www.youtube.com/watch?v=aaaaaaaaaaa";
    expect(analysisResultSchema.safeParse(input).success).toBe(false);
  });

  it("requires shared themes and evidence to reference both videos", () => {
    const input = structuredClone(demoAnalysis);
    input.sharedThemes[0].videoIds = ["_RvNczunfsQ", "_RvNczunfsQ"];
    input.sharedThemes[0].evidence = input.sharedThemes[0].evidence.filter(
      (item) => item.videoId === "_RvNczunfsQ",
    );
    expect(analysisResultSchema.safeParse(input).success).toBe(false);
  });
});
