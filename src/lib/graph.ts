import type { AnalysisResult, Sentiment } from "./analysis";

export type GraphNodeKind = "video" | "tag" | "comment" | "shared";

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

const palettes = [
  ["#ff7ca8", "#ff9369", "#be7cff", "#f1c75b", "#64d493", "#e56b74", "#9b8cff"],
  ["#4fc6e8", "#4f86f7", "#71d6b2", "#88a7ff", "#50b7a4", "#a3c85d", "#6c96ba"],
];

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
  const centers = result.videos.length === 1
    ? [{ x: 560, y: 390 }]
    : [{ x: 330, y: 390 }, { x: 805, y: 390 }];

  result.videos.forEach((video, videoIndex) => {
    const center = centers[videoIndex];
    const videoNodeId = `video:${video.videoId}`;
    const baseColor = videoIndex === 0 ? "#ff7ca8" : "#4fc6e8";
    nodes.push({
      id: videoNodeId,
      kind: "video",
      x: center.x,
      y: center.y,
      radius: 35,
      color: baseColor,
      label: video.title,
      eyebrow: `Vídeo ${videoIndex + 1} · ${video.channel}`,
      description: video.summary,
      meta: [
        `${video.commentCountAnalyzed} comentários analisados`,
        `${Math.round(video.sentiment.positive)}% positivos`,
      ],
    });

    video.tags.forEach((tag, tagIndex) => {
      const directionOffset = result.videos.length === 2 ? (videoIndex === 0 ? Math.PI : 0) : 0;
      const spread = result.videos.length === 2 ? Math.PI * 1.35 : Math.PI * 2;
      const angle = directionOffset - spread / 2 + (spread * (tagIndex + 0.5)) / video.tags.length;
      const tagPosition = polar(center.x, center.y, 178 + (tagIndex % 2) * 42, angle);
      const tagNodeId = `tag:${video.videoId}:${tag.id}`;
      const color = palettes[videoIndex][tagIndex % palettes[videoIndex].length];
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

  result.sharedThemes.forEach((theme, index) => {
    const id = `shared:${index}`;
    const interval = result.sharedThemes.length > 1 ? 390 / (result.sharedThemes.length - 1) : 0;
    const position = { x: 570, y: 190 + index * interval };
    nodes.push({
      id,
      kind: "shared",
      x: position.x,
      y: position.y,
      radius: 13,
      color: "#f0c75e",
      label: theme.label,
      eyebrow: "Tema compartilhado",
      description: theme.description,
      meta: ["Presente nos dois vídeos"],
      evidence: theme.evidence.map((item) => `${item.author}: ${item.text}`),
    });
    theme.videoIds.forEach((videoId) => {
      edges.push({ id: `${id}-${videoId}`, from: id, to: `video:${videoId}`, color: "#f0c75e", strength: "soft" });
    });
  });

  return { nodes, edges };
}
