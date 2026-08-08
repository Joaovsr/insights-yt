# YT Signals

Aplicação local que usa o Codex e o MCP do YouTube já configurado para transformar comentários em um mapa visual de temas, sentimentos e conexões entre até dois vídeos.

## Como funciona

```text
Browser → API local → codex exec → MCP youtube → JSON estruturado → mapa SVG
```

O servidor não recebe prompts livres. Ele valida até duas URLs do YouTube, executa o Codex em sandbox somente leitura e valida novamente a resposta antes de enviá-la ao navegador.

## Executar

Pré-requisitos:

- Node.js 20+
- Codex CLI autenticado
- MCP `youtube` habilitado no Codex

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:5173`. Use **Ver demonstração** para explorar a interface sem consumir chamadas do YouTube/Codex.

## Verificações

```bash
npm run check
npm run build
```

## Limites atuais

- Até dois vídeos por análise.
- Até 100 comentários relevantes consultados por vídeo.
- O mapa recebe temas agregados e comentários representativos para reduzir tokens.
- A análise real depende da autenticação do Codex e do MCP `youtube` no computador onde o servidor roda.
