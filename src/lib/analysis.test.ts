import { describe, expect, it } from "vitest";
import { analysisFixture } from "../test/analysisFixture";
import { analysisResultSchema } from "./analysis";

describe("analysisResultSchema", () => {
  it("accepts every analyzed comment instead of limiting a topic to five samples", () => {
    const comments = Array.from({ length: 12 }, (_, index) => ({
      id: `comment-${index}`,
      author: `@viewer-${index}`,
      text: `Comentário ${index}`,
      likes: index,
    }));
    const candidate = structuredClone(analysisFixture);
    candidate.video.commentCountAnalyzed = comments.length;
    candidate.video.tags = candidate.video.tags.map((tag, tagIndex) => {
      const start = tagIndex * 3;
      const tagComments = comments.slice(start, start + 3);
      return { ...tag, commentCount: tagComments.length, comments: tagComments };
    });

    expect(analysisResultSchema.safeParse(candidate).success).toBe(true);
  });

  it("accepts the complete analysis contract", () => {
    expect(analysisResultSchema.safeParse(analysisFixture).success).toBe(true);
  });

  it("accepts fewer classified comments than the requested maximum", () => {
    const input = structuredClone(analysisFixture);
    input.video.tags[3].comments.splice(-2);
    input.video.tags[3].commentCount -= 2;
    input.video.commentCountAnalyzed = 98;

    expect(analysisResultSchema.safeParse(input).success).toBe(true);
  });

  it("rejects sentiment percentages that do not total 100", () => {
    const input = structuredClone(analysisFixture);
    input.video.sentiment = { positive: 50, neutral: 20, negative: 5 };
    expect(analysisResultSchema.safeParse(input).success).toBe(false);
  });

  it("rejects video URLs that do not match the video ID", () => {
    const input = structuredClone(analysisFixture);
    input.video.url = "https://www.youtube.com/watch?v=aaaaaaaaaaa";
    expect(analysisResultSchema.safeParse(input).success).toBe(false);
  });

  it("rejects the removed videos collection", () => {
    const input = structuredClone(analysisFixture);
    const legacy = { ...input, videos: [input.video] };
    delete (legacy as Partial<typeof legacy>).video;
    expect(analysisResultSchema.safeParse(legacy).success).toBe(false);
  });

  it("rejects analyses that omit comments or repeat them across tags", () => {
    const omitted = structuredClone(analysisFixture);
    omitted.video.tags[0].comments.pop();
    expect(analysisResultSchema.safeParse(omitted).success).toBe(false);

    const repeated = structuredClone(analysisFixture);
    repeated.video.tags[1].comments[0].id = repeated.video.tags[0].comments[0].id;
    expect(analysisResultSchema.safeParse(repeated).success).toBe(false);
  });
});
