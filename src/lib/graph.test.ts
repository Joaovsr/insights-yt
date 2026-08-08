import { describe, expect, it } from "vitest";
import { demoAnalysis } from "../data/demo";
import { createInsightGraph } from "./graph";

describe("createInsightGraph", () => {
  it("creates video, tag, comment and shared-theme nodes", () => {
    const graph = createInsightGraph(demoAnalysis);
    expect(graph.nodes.filter((node) => node.kind === "video")).toHaveLength(2);
    expect(graph.nodes.filter((node) => node.kind === "tag")).toHaveLength(10);
    expect(graph.nodes.some((node) => node.kind === "comment")).toBe(true);
    expect(graph.nodes.filter((node) => node.kind === "shared")).toHaveLength(3);
    expect(graph.edges.length).toBeGreaterThan(graph.nodes.length / 2);
    expect(graph.nodes.filter((node) => node.kind === "shared").every((node) => node.y >= 190 && node.y <= 580)).toBe(true);
  });
});
