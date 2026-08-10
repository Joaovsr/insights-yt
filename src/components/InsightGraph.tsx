import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import type { AnalysisResult } from "../lib/analysis";
import { createInsightGraph, type GraphEdge, type GraphNode } from "../lib/graph";

type Props = {
  result: AnalysisResult;
  selectedId?: string;
  onSelect: (node: GraphNode) => void;
};

type Size = { width: number; height: number };

function endpointId(endpoint: GraphEdge["source"]): string {
  return typeof endpoint === "string" ? endpoint : endpoint.id;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]!);
}

export function InsightGraph({ result, selectedId, onSelect }: Props) {
  const shellRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods<GraphNode, GraphEdge> | undefined>(undefined);
  const fittedRef = useRef(false);
  const graph = useMemo(() => createInsightGraph(result), [result]);
  const graphData = useMemo(
    () => ({ nodes: graph.nodes, links: graph.edges }),
    [graph],
  );
  const [size, setSize] = useState<Size>({ width: 900, height: 620 });
  const [hoveredId, setHoveredId] = useState<string>();
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const element = shellRef.current;
    if (!element) return;
    const updateSize = () => setSize({
      width: Math.max(element.clientWidth, 320),
      height: Math.max(element.clientHeight, 420),
    });
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    fittedRef.current = false;
  }, [graph]);

  const activeId = hoveredId ?? selectedId;
  const relatedIds = useMemo(() => {
    if (!activeId) return null;
    const ids = new Set([activeId]);
    graph.edges.forEach((edge) => {
      const source = endpointId(edge.source);
      const target = endpointId(edge.target);
      if (source === activeId) ids.add(target);
      if (target === activeId) ids.add(source);
    });
    return ids;
  }, [activeId, graph]);

  const paintNode = useCallback((node: GraphNode, context: CanvasRenderingContext2D, globalScale: number) => {
    const active = node.id === activeId;
    const related = !relatedIds || relatedIds.has(node.id);
    const radius = node.radius;

    context.save();
    context.globalAlpha = related ? 1 : 0.14;
    context.beginPath();
    context.arc(node.x ?? 0, node.y ?? 0, radius, 0, Math.PI * 2);
    context.fillStyle = node.color;
    context.shadowColor = node.color;
    context.shadowBlur = active ? 18 : node.kind === "tag" ? 10 : 2;
    context.fill();

    context.shadowBlur = 0;
    context.lineWidth = (active ? 2.2 : 0.8) / globalScale;
    context.strokeStyle = active ? "#ffffff" : "rgba(255,255,255,0.5)";
    context.stroke();

    if (active || node.kind === "video") {
      context.beginPath();
      context.arc(node.x ?? 0, node.y ?? 0, radius + 7 / globalScale, 0, Math.PI * 2);
      context.lineWidth = 1.2 / globalScale;
      context.strokeStyle = active ? node.color : "rgba(255,255,255,0.38)";
      context.stroke();
    }

    if (node.kind === "tag") {
      context.fillStyle = "#0a0d11";
      context.font = `700 ${Math.max(8, 10 / globalScale)}px Inter, sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(node.commentCount ?? 0), node.x ?? 0, node.y ?? 0);
    }

    if (node.kind !== "comment") {
      const fontSize = Math.max(9, (node.kind === "video" ? 12 : 10) / globalScale);
      const maxLength = node.kind === "video" ? 31 : 24;
      const label = node.label.length > maxLength ? `${node.label.slice(0, maxLength - 1)}…` : node.label;
      context.font = `${node.kind === "video" ? 700 : 560} ${fontSize}px Inter, sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "top";
      context.lineWidth = 3 / globalScale;
      context.strokeStyle = "#080a0d";
      context.strokeText(label, node.x ?? 0, (node.y ?? 0) + radius + 9 / globalScale);
      context.fillStyle = node.kind === "video" ? "#f4f4f0" : "#b7bec8";
      context.fillText(label, node.x ?? 0, (node.y ?? 0) + radius + 9 / globalScale);
    }
    context.restore();
  }, [activeId, relatedIds]);

  const paintPointerArea = useCallback((node: GraphNode, color: string, context: CanvasRenderingContext2D) => {
    context.fillStyle = color;
    context.beginPath();
    context.arc(node.x ?? 0, node.y ?? 0, Math.max(node.radius, 7), 0, Math.PI * 2);
    context.fill();
  }, []);

  const changeZoom = (delta: number) => {
    const instance = graphRef.current;
    if (!instance) return;
    instance.zoom(Math.min(3, Math.max(0.35, instance.zoom() + delta)), 260);
  };

  return (
    <div className="graph-shell" ref={shellRef} aria-label="Mapa interativo de temas e comentários">
      <ForceGraph2D<GraphNode, GraphEdge>
        ref={graphRef}
        width={size.width}
        height={size.height}
        graphData={graphData}
        backgroundColor="rgba(0,0,0,0)"
        dagMode="radialout"
        dagLevelDistance={115}
        warmupTicks={90}
        cooldownTicks={180}
        autoPauseRedraw
        nodeCanvasObjectMode={() => "replace"}
        nodeCanvasObject={paintNode}
        nodePointerAreaPaint={paintPointerArea}
        nodeLabel={(node) => `<div class="graph-tooltip"><strong>${escapeHtml(node.label)}</strong><span>${escapeHtml(node.eyebrow)}</span><p>${escapeHtml(node.description)}</p></div>`}
        linkColor={(edge) => {
          if (!activeId) return edge.color;
          const connected = endpointId(edge.source) === activeId || endpointId(edge.target) === activeId;
          return connected ? edge.color : "rgba(70,76,86,0.18)";
        }}
        linkWidth={(edge) => edge.strength === "strong" ? 1.15 : 0.42}
        minZoom={0.3}
        maxZoom={3.2}
        enableNodeDrag
        onNodeHover={(node) => setHoveredId(node?.id)}
        onNodeClick={(node) => onSelect(node)}
        onZoomEnd={({ k }) => setZoom(k)}
        onEngineStop={() => {
          if (fittedRef.current) return;
          fittedRef.current = true;
          graphRef.current?.zoomToFit(650, 62);
        }}
      />

      <div className="zoom-controls" aria-label="Controles de zoom">
        <button type="button" onClick={() => changeZoom(-0.22)} aria-label="Diminuir zoom">−</button>
        <button className="zoom-fit" type="button" onClick={() => graphRef.current?.zoomToFit(450, 62)} aria-label="Enquadrar mapa">
          {Math.round(zoom * 100)}%
        </button>
        <button type="button" onClick={() => changeZoom(0.22)} aria-label="Aumentar zoom">+</button>
      </div>

      <div className="sr-only" aria-label="Nós do mapa">
        {graph.nodes.map((node) => (
          <button type="button" key={node.id} onClick={() => onSelect(node)}>
            {node.eyebrow}: {node.label}
          </button>
        ))}
      </div>
    </div>
  );
}
