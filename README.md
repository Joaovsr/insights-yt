# YT Signals

Aplicação local que usa o Codex e o MCP do YouTube já configurado para transformar os comentários de um vídeo em um mapa visual de temas e sentimentos.

## Como funciona

```text
Browser → API local → codex exec → MCP youtube → JSON estruturado → mapa SVG
```

O servidor não recebe prompts livres. Ele valida uma URL do YouTube, executa o Codex em sandbox somente leitura e valida novamente a resposta antes de enviá-la ao navegador.

As análises recentes são mantidas no `localStorage` do navegador e podem ser reabertas sem uma nova chamada ao Codex.

## Executar

Pré-requisitos:

- Node.js 20+
- Codex CLI autenticado
- MCP `youtube` habilitado no Codex

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:5173` e envie a URL de um vídeo.

## Verificações

```bash
npm run check
npm run build
```

## Limites atuais

- Um vídeo por análise.
- Até 100 comentários relevantes consultados.
- O mapa recebe temas agregados e comentários representativos para reduzir tokens.
- A análise real depende da autenticação do Codex e do MCP `youtube` no computador onde o servidor roda.
