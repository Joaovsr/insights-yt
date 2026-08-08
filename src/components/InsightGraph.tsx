import { useMemo, useState } from "react";
import type { AnalysisResult } from "../lib/analysis";
import { createInsightGraph, type GraphNode } from "../lib/graph";

type Props = {
  result: AnalysisResult;
  selectedId?: string;
  onSelect: (node: GraphNode) => void;
};

const WIDTH = 1140;
const HEIGHT = 780;

export function InsightGraph({ result, selectedId, onSelect }: Props) {
  const graph = useMemo(() => createInsightGraph(result), [result]);
  const [zoom, setZoom] = useState(1);
  const nodeById = useMemo(() => new Map(graph.nodes.map((node) => [node.id, node])), [graph]);

  const changeZoom = (delta: number) => {
    setZoom((current) => Math.min(1.45, Math.max(0.68, Number((current + delta).toFixed(2)))));
  };

  return (
    <div className="graph-shell">
      <svg
        className="insight-graph"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Mapa de temas e comentários dos vídeos"
      >
        <defs>
          <pattern id="dot-grid" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#5f6772" opacity="0.14" />
          </pattern>
          <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <rect width={WIDTH} height={HEIGHT} fill="url(#dot-grid)" />
        <g transform={`translate(${WIDTH / 2} ${HEIGHT / 2}) scale(${zoom}) translate(${-WIDTH / 2} ${-HEIGHT / 2})`}>
          <g className="graph-edges">
            {graph.edges.map((edge) => {
              const from = nodeById.get(edge.from);
              const to = nodeById.get(edge.to);
              if (!from || !to) return null;
              return (
                <line
                  key={edge.id}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={edge.color}
                  className={`graph-edge graph-edge--${edge.strength}`}
                />
              );
            })}
          </g>
          <g className="graph-nodes">
            {graph.nodes.map((node) => {
              const selected = selectedId === node.id;
              const labelVisible = node.kind !== "comment";
              return (
                <g
                  key={node.id}
                  className={`graph-node graph-node--${node.kind}${selected ? " is-selected" : ""}`}
                  transform={`translate(${node.x} ${node.y})`}
                  role="button"
                  tabIndex={0}
                  aria-label={`${node.eyebrow}: ${node.label}`}
                  onClick={() => onSelect(node)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") onSelect(node);
                  }}
                >
                  <circle className="node-halo" r={node.radius + 9} fill={node.color} />
                  <circle
                    className="node-core"
                    r={node.radius}
                    fill={node.color}
                    filter={selected ? "url(#node-glow)" : undefined}
                  />
                  {node.kind === "video" && <circle className="node-ring" r={node.radius + 6} />}
                  {labelVisible && (
                    <text className={`node-label node-label--${node.kind}`} y={node.radius + 20} textAnchor="middle">
                      {node.label.length > 26 ? `${node.label.slice(0, 24)}…` : node.label}
                    </text>
                  )}
                  <title>{`${node.eyebrow}\n${node.label}\n${node.description}`}</title>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      <div className="zoom-controls" aria-label="Controles de zoom">
        <button type="button" onClick={() => changeZoom(-0.12)} aria-label="Diminuir zoom">−</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => changeZoom(0.12)} aria-label="Aumentar zoom">+</button>
      </div>

      <div className="graph-legend">
        <span><i className="legend-dot legend-dot--video" /> vídeo</span>
        <span><i className="legend-dot legend-dot--tag" /> tag</span>
        <span><i className="legend-dot legend-dot--comment" /> comentário</span>
        {result.videos.length === 2 && <span><i className="legend-dot legend-dot--shared" /> conexão</span>}
      </div>
    </div>
  );
}
