import { describe, expect, it } from "vitest";
import { analysisFixture } from "../test/analysisFixture";
import { createInsightGraph } from "./graph";

describe("createInsightGraph", () => {
  it("creates video, tag and comment nodes", () => {
    const graph = createInsightGraph(analysisFixture);
    expect(graph.nodes.filter((node) => node.kind === "video")).toHaveLength(1);
    expect(graph.nodes.filter((node) => node.kind === "tag")).toHaveLength(4);
    expect(graph.nodes.some((node) => node.kind === "comment")).toBe(true);
    expect(graph.edges.length).toBeGreaterThan(graph.nodes.length / 2);
  });
});
