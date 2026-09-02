import type { AnalysisResult, Sentiment } from "./analysis";

export type GraphNodeKind = "video" | "tag" | "comment";

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  x?: number;
  y?: number;
  radius: number;
  color: string;
  label: string;
  eyebrow: string;
  description: string;
  meta: string[];
  evidence?: string[];
  commentCount?: number;
};

export type GraphEdge = {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  color: string;
  strength: "soft" | "strong";
};

export type InsightGraph = { nodes: GraphNode[]; edges: GraphEdge[] };

const palette = ["#ff7ca8", "#ff9369", "#be7cff", "#f1c75b", "#64d493", "#e56b74", "#9b8cff"];

const sentimentLabel: Record<Sentiment, string> = {
  positive: "Positivo",
  neutral: "Neutro",
  negative: "Negativo",
};

function polar(cx: number, cy: number, radius: number, angle: number) {
  return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
}

export function createInsightGraph(result: AnalysisResult): InsightGraph {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const center = { x: 0, y: 0 };

  const video = result.video;
  const videoNodeId = `video:${video.videoId}`;
  const baseColor = "#ff7ca8";
  nodes.push({
    id: videoNodeId,
    kind: "video",
    x: center.x,
    y: center.y,
    radius: 35,
    color: baseColor,
    label: video.title,
    eyebrow: `Vídeo · ${video.channel}`,
    description: video.summary,
    meta: [
      `${video.commentCountAnalyzed} comentários analisados`,
      `${Math.round(video.sentiment.positive)}% positivos`,
    ],
    commentCount: video.commentCountAnalyzed,
  });

  video.tags.forEach((tag, tagIndex) => {
    const angle = -Math.PI + (Math.PI * 2 * (tagIndex + 0.5)) / video.tags.length;
    const tagPosition = polar(center.x, center.y, 190 + (tagIndex % 2) * 35, angle);
    const tagNodeId = `tag:${video.videoId}:${tag.id}`;
    const color = palette[tagIndex % palette.length];
    nodes.push({
      id: tagNodeId,
      kind: "tag",
      x: tagPosition.x,
      y: tagPosition.y,
      radius: 11 + Math.sqrt(tag.commentCount) * 2.4,
      color,
      label: tag.label,
      eyebrow: `Tag · ${sentimentLabel[tag.sentiment]}`,
      description: tag.description,
      meta: [
        `${tag.commentCount} comentários`,
        ...(tag.keywords.length > 0 ? [tag.keywords.join(" · ")] : []),
      ],
      evidence: tag.comments.map((comment) => `${comment.author}: ${comment.text}`),
      commentCount: tag.commentCount,
    });
    edges.push({ id: `${videoNodeId}-${tagNodeId}`, source: videoNodeId, target: tagNodeId, color, strength: "strong" });

    tag.comments.forEach((comment, commentIndex) => {
      const fan = -0.8 + (1.6 * (commentIndex + 0.5)) / tag.comments.length;
      const commentPosition = polar(
        tagPosition.x,
        tagPosition.y,
        68 + (commentIndex % 4) * 16,
        angle + fan,
      );
      const commentNodeId = `comment:${video.videoId}:${tag.id}:${comment.id}`;
      nodes.push({
        id: commentNodeId,
        kind: "comment",
        x: commentPosition.x,
        y: commentPosition.y,
        radius: 4.8 + Math.min(Math.log10(comment.likes + 1), 3) * 1.8,
        color,
        label: comment.author,
        eyebrow: `Comentário · ${comment.likes.toLocaleString("pt-BR")} likes`,
        description: comment.text,
        meta: [tag.label, video.title],
      });
      edges.push({ id: `${tagNodeId}-${commentNodeId}`, source: tagNodeId, target: commentNodeId, color, strength: "soft" });
    });
  });

  return { nodes, edges };
}
