import { describe, expect, it } from "vitest";
import { analysisFixture } from "../test/analysisFixture";
import { createInsightGraph } from "./graph";

describe("createInsightGraph", () => {
  it("creates video, tag and comment nodes", () => {
    const graph = createInsightGraph(analysisFixture);
    expect(graph.nodes.filter((node) => node.kind === "video")).toHaveLength(1);
    expect(graph.nodes.filter((node) => node.kind === "tag")).toHaveLength(4);
    expect(graph.nodes.filter((node) => node.kind === "comment")).toHaveLength(100);
    expect(graph.edges.length).toBeGreaterThan(graph.nodes.length / 2);
  });

  it("makes topics with more comments visually stronger", () => {
    const graph = createInsightGraph(analysisFixture);
    const tags = graph.nodes.filter((node) => node.kind === "tag");
    expect(tags[3].radius).toBeGreaterThan(tags[0].radius);
    expect(tags[3].commentCount).toBe(28);
  });

  it("does not create an empty metadata chip when a topic has no keywords", () => {
    const input = structuredClone(analysisFixture);
    input.video.tags[0].keywords = [];

    const graph = createInsightGraph(input);
    const tag = graph.nodes.find((node) => node.kind === "tag" && node.label === "Tema 1");

    expect(tag?.meta).toEqual(["22 comentários"]);
  });
});
