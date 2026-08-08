import type { AnalysisResult, Sentiment } from "../lib/analysis";

const examples = (
  prefix: string,
  rows: Array<[string, string, number]>,
) => rows.map(([author, text, likes], index) => ({ id: `${prefix}-${index}`, author, text, likes }));

const tag = (
  id: string,
  label: string,
  description: string,
  commentCount: number,
  sentiment: Sentiment,
  keywords: string[],
  rows: Array<[string, string, number]>,
) => ({ id, label, description, commentCount, sentiment, keywords, examples: examples(id, rows) });

export const demoAnalysis: AnalysisResult = {
  generatedAt: "2026-08-08T15:00:00.000Z",
  overview:
    "Demonstração de como dois públicos convergem em torno de foco e disciplina, mas divergem no tom: o primeiro debate tolerância ao tédio; o segundo enfatiza hábitos e consistência.",
  videos: [
    {
      videoId: "_RvNczunfsQ",
      url: "https://www.youtube.com/watch?v=_RvNczunfsQ",
      title: "Master boredom to get ahead",
      channel: "Daniel Barada",
      thumbnail: "https://i.ytimg.com/vi/_RvNczunfsQ/hqdefault.jpg",
      commentCountAnalyzed: 100,
      summary: "A audiência se reconhece na baixa tolerância ao tédio e transforma a duração do vídeo em um teste prático de atenção.",
      sentiment: { positive: 72, neutral: 20, negative: 8 },
      tags: [
        tag("boredom", "Tolerância ao tédio", "Reconhecimento do tédio como habilidade treinável.", 34, "positive", ["tédio", "paciência", "foco"], [
          ["@themilacardz", "When I master boredom I’ll come back and watch your videos", 3034],
          ["@skillmaster9116", "This video in itself is a boredom test", 859],
          ["@niksachan", "It’s like he brainwashed me to enjoy boredom 😂", 0],
        ]),
        tag("attention", "Atenção fragmentada", "Celular, rolagem e estímulo constante aparecem como antagonistas.", 23, "negative", ["phone", "scroll", "attention"], [
          ["@Kev.94", "Mama was right it is the damn phone", 184],
          ["@DjTic64", "Me reading the comments to stay stimulated", 143],
          ["@mattt688", "Paused this video 5 times to scroll", 74],
        ]),
        tag("identity", "Identidade e trabalho", "Persistir até o esforço deixar de parecer uma tentativa.", 17, "positive", ["trabalho", "identidade", "repetição"], [
          ["@ezrajake", "Trying is exhausting, being is natural.", 11],
          ["@sebvitug", "Any of them can work, if I just stick with one.", 0],
        ]),
        tag("adhd", "ADHD e estímulo", "Experiências pessoais conectam neurodivergência e busca por novidade.", 11, "neutral", ["ADHD", "estímulo", "criatividade"], [
          ["@Kristijan607", "This video saved me from selfdiagnosing myself with adhd.", 628],
          ["@siclucealucks", "Boredom tolerance is the core bottleneck.", 2],
        ]),
        tag("meta", "O vídeo como teste", "A forma longa e sóbria vira parte da própria mensagem.", 9, "positive", ["meta", "duração", "formato"], [
          ["@LaserMaser899", "An hour long when it could have been seven minutes.", 330],
          ["@arynkhndlwal", "Every second felt boring, but every second was exactly what I needed.", 0],
        ]),
      ],
    },
    {
      videoId: "dQw4w9WgXcQ",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      title: "Demo: consistência em prática",
      channel: "Canal de demonstração",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      commentCountAnalyzed: 100,
      summary: "Neste conjunto demonstrativo, a audiência valoriza consistência, pequenos avanços e sistemas simples que reduzem decisões.",
      sentiment: { positive: 81, neutral: 15, negative: 4 },
      tags: [
        tag("consistency", "Consistência", "Pequenas ações repetidas são percebidas como vantagem cumulativa.", 39, "positive", ["rotina", "repetição", "progresso"], [
          ["@builder", "Small work every day changed the whole trajectory.", 482],
          ["@maker", "The boring reps are finally paying off.", 219],
        ]),
        tag("systems", "Sistemas simples", "A audiência prefere ambientes e regras a depender de motivação.", 24, "positive", ["sistemas", "ambiente", "hábitos"], [
          ["@focusmode", "Make the good action the easiest action.", 187],
          ["@steady", "My calendar became more useful than motivation.", 91],
        ]),
        tag("progress", "Progresso invisível", "O intervalo sem recompensa é visto como a etapa mais difícil.", 18, "neutral", ["progresso", "paciência", "resultado"], [
          ["@slowgrowth", "Nothing happened for months, then everything compounded.", 344],
          ["@dayone", "Learning to trust work before the result appears.", 63],
        ]),
        tag("focus-two", "Foco deliberado", "Eliminar opções protege energia e continuidade.", 12, "positive", ["foco", "escolhas", "energia"], [
          ["@onepath", "Choosing one path was the real productivity hack.", 128],
          ["@deepworker", "Less switching, more finishing.", 77],
        ]),
        tag("friction", "Fricção digital", "Notificações e feeds são tratados como custos ambientais.", 7, "negative", ["notificações", "feeds", "celular"], [
          ["@offline", "The phone was deciding what I did next.", 203],
          ["@quietmode", "Turning notifications off gave me my mornings back.", 116],
        ]),
      ],
    },
  ],
  sharedThemes: [
    { label: "Paciência", description: "Os dois públicos valorizam permanecer no processo antes da recompensa.", videoIds: ["_RvNczunfsQ", "dQw4w9WgXcQ"], evidence: [
      { videoId: "_RvNczunfsQ", author: "@mood55-o5c", text: "Survive the boredom of doing unsexy work every day." },
      { videoId: "dQw4w9WgXcQ", author: "@slowgrowth", text: "Nothing happened for months, then everything compounded." },
    ] },
    { label: "Foco", description: "Reduzir estímulos e escolhas aparece como condição para concluir.", videoIds: ["_RvNczunfsQ", "dQw4w9WgXcQ"], evidence: [
      { videoId: "_RvNczunfsQ", author: "@Kev.94", text: "Mama was right it is the damn phone." },
      { videoId: "dQw4w9WgXcQ", author: "@onepath", text: "Choosing one path was the real productivity hack." },
    ] },
    { label: "Repetição", description: "O trabalho repetitivo é reinterpretado como vantagem competitiva.", videoIds: ["_RvNczunfsQ", "dQw4w9WgXcQ"], evidence: [
      { videoId: "_RvNczunfsQ", author: "@sebvitug", text: "Any of them can work, if I just stick with one." },
      { videoId: "dQw4w9WgXcQ", author: "@maker", text: "The boring reps are finally paying off." },
    ] },
  ],
  takeaways: [
    "A baixa tolerância ao tédio é a dor mais reconhecida no primeiro público.",
    "Consistência e desenho do ambiente conectam as duas audiências.",
    "Comentários autorreferentes e humorísticos concentram grande parte do engajamento.",
  ],
};
