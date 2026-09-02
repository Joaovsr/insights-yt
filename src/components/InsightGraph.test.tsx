// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { analysisFixture } from "../test/analysisFixture";
import type { GraphNode } from "../lib/graph";
import { InsightGraph } from "./InsightGraph";

type ForceGraphProps = {
  graphData: { nodes: GraphNode[] };
  nodeLabel: (node: GraphNode) => string;
  onNodeClick: (node: GraphNode) => void;
};

const forceGraphState = vi.hoisted(() => ({ props: null as ForceGraphProps | null }));

vi.mock("react-force-graph-2d", async () => {
  const React = await import("react");
  return { default: React.forwardRef(function FakeForceGraph(props: ForceGraphProps, ref) {
    forceGraphState.props = props;
    React.useImperativeHandle(ref, () => ({
      zoom: () => 1,
      zoomToFit: () => undefined,
    }));
    const comment = props.graphData.nodes.find((node) => node.kind === "comment")!;
    return <button type="button" onClick={() => props.onNodeClick(comment)}>Selecionar comentário</button>;
  }) };
});

class ResizeObserverStub implements ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe("InsightGraph", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  });

  afterEach(() => {
    cleanup();
    forceGraphState.props = null;
    vi.unstubAllGlobals();
  });

  it("passes every API comment to the graph and reports node selection", async () => {
    const onSelect = vi.fn<(node: GraphNode) => void>();
    const user = userEvent.setup();
    render(<InsightGraph result={analysisFixture} onSelect={onSelect} />);

    expect(forceGraphState.props?.graphData.nodes).toHaveLength(105);

    await user.click(screen.getByRole("button", { name: "Selecionar comentário" }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(onSelect.mock.calls[0][0].kind).toBe("comment");
  });

  it("escapes API text before placing it in the canvas tooltip", () => {
    const input = structuredClone(analysisFixture);
    input.video.title = "<img src=x onerror=alert(1)>";
    render(<InsightGraph result={input} onSelect={() => undefined} />);

    const videoNode = forceGraphState.props?.graphData.nodes.find((node) => node.kind === "video");
    const tooltip = forceGraphState.props?.nodeLabel(videoNode!);

    expect(tooltip).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(tooltip).not.toContain("<img");
  });
});
