import { describe, expect, it } from "vitest";
import { analysisResultSchema } from "../src/lib/analysis.js";
import { analysisFixture } from "../src/test/analysisFixture.js";
import { normalizeCodexPayload } from "./normalize.js";

describe("normalizeCodexPayload", () => {
  it("compacts tag descriptions that exceed the response contract", () => {
    const payload = structuredClone(analysisFixture);
    payload.video.tags[1].description = "Uma descrição válida, porém longa demais para o mapa. ".repeat(8);
    payload.video.tags[3].description = "Outro tema detalhado pelo Codex. ".repeat(9);

    const normalized = normalizeCodexPayload(payload);
    const validation = analysisResultSchema.safeParse(normalized);

    expect(validation.success).toBe(true);
    if (!validation.success) return;
    expect(validation.data.video.tags[1].description.length).toBeLessThanOrEqual(180);
    expect(validation.data.video.tags[1].description.endsWith("…")).toBe(true);
  });

  it("preserves the complete text of long comments", () => {
    const payload = structuredClone(analysisFixture);
    const longComment = "Comentário detalhado. ".repeat(80);
    payload.video.tags[0].comments[0].text = longComment;

    const normalized = normalizeCodexPayload(payload);
    const validation = analysisResultSchema.safeParse(normalized);

    expect(validation.success).toBe(true);
    if (!validation.success) return;
    expect(validation.data.video.tags[0].comments[0].text).toBe(longComment);
  });
});
