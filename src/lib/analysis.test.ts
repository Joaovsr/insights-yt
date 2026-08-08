import { describe, expect, it } from "vitest";
import { analysisFixture } from "../test/analysisFixture";
import { analysisResultSchema } from "./analysis";

describe("analysisResultSchema", () => {
  it("accepts the complete analysis contract", () => {
    expect(analysisResultSchema.safeParse(analysisFixture).success).toBe(true);
  });

  it("rejects sentiment percentages that do not total 100", () => {
    const input = structuredClone(analysisFixture);
    input.videos[0].sentiment = { positive: 50, neutral: 20, negative: 5 };
    expect(analysisResultSchema.safeParse(input).success).toBe(false);
  });

  it("rejects video URLs that do not match the video ID", () => {
    const input = structuredClone(analysisFixture);
    input.videos[0].url = "https://www.youtube.com/watch?v=aaaaaaaaaaa";
    expect(analysisResultSchema.safeParse(input).success).toBe(false);
  });

  it("rejects more than one video", () => {
    const input = structuredClone(analysisFixture);
    input.videos.push(structuredClone(input.videos[0]));
    expect(analysisResultSchema.safeParse(input).success).toBe(false);
  });
});
