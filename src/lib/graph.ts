import type { AnalysisResult, Sentiment } from "./analysis";

export type GraphNodeKind = "video" | "tag" | "comment";

export type GraphNode = {
  id: string;
  kind: GraphNodeKind;
  x: number;
  y: number;
  radius: number;
  color: string;
  label: string;
  eyebrow: string;
  description: string;
  meta: string[];
  evidence?: string[];
};

export type GraphEdge = {
  id: string;
  from: string;
  to: string;
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
  const center = { x: 560, y: 390 };

  result.videos.forEach((video) => {
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
    });

    video.tags.forEach((tag, tagIndex) => {
      const angle = -Math.PI + (Math.PI * 2 * (tagIndex + 0.5)) / video.tags.length;
      const tagPosition = polar(center.x, center.y, 178 + (tagIndex % 2) * 42, angle);
      const tagNodeId = `tag:${video.videoId}:${tag.id}`;
      const color = palette[tagIndex % palette.length];
      nodes.push({
        id: tagNodeId,
        kind: "tag",
        x: tagPosition.x,
        y: tagPosition.y,
        radius: 14 + Math.min(tag.commentCount, 40) * 0.17,
        color,
        label: tag.label,
        eyebrow: `Tag · ${sentimentLabel[tag.sentiment]}`,
        description: tag.description,
      meta: [`${tag.commentCount} comentários`, tag.keywords.join(" · ")],
      evidence: tag.examples.map((example) => `${example.author}: ${example.text}`),
      });
      edges.push({ id: `${videoNodeId}-${tagNodeId}`, from: videoNodeId, to: tagNodeId, color, strength: "strong" });

      tag.examples.forEach((comment, commentIndex) => {
        const fan = (commentIndex - (tag.examples.length - 1) / 2) * 0.24;
        const commentPosition = polar(tagPosition.x, tagPosition.y, 64 + commentIndex * 9, angle + fan);
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
        edges.push({ id: `${tagNodeId}-${commentNodeId}`, from: tagNodeId, to: commentNodeId, color, strength: "soft" });
      });
    });
  });

  return { nodes, edges };
}
