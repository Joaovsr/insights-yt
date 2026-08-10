# YT Signals

Frontend React que transforma os comentários de um vídeo do YouTube em um mapa visual de temas e sentimentos.

## Como funciona

```text
Browser → insights-yt-api → YouTube Data API → OpenAI Responses API → JSON validado → grafo interativo
```

O navegador extrai o ID de uma URL válida do YouTube e chama a API Go com `{ "maxComments": 100 }`. A resposta é validada com Zod antes de atualizar a tela ou o histórico em `localStorage`. Nenhuma chave ou prompt livre chega ao browser.

## Desenvolvimento local

Requisitos: Node.js 20+ e a aplicação `insights-yt-api` disponível em `127.0.0.1:8080`.

```bash
npm install
npm run dev
```

Abra `http://127.0.0.1:5173`. O Vite encaminha `/api/v1` para a API Go, evitando diferenças de CORS no desenvolvimento.

## Produção

Defina a URL pública da API no build do frontend, sem barra final:

```bash
VITE_API_BASE_URL=https://api.example.com npm run build
```

A API deve permitir exatamente a origem pública do frontend em `CORS_ALLOWED_ORIGIN`.

## Verificações

```bash
npm run check
npm run build
```

## Limites atuais

- Um vídeo por análise.
- Até 100 comentários relevantes por mapa.
- Cada comentário analisado aparece uma vez, ligado à sua tag temática principal.
- O tamanho e o brilho das tags acompanham o volume real de comentários.
- Uma análise pode levar até três minutos; o frontend propaga cancelamento e aplica timeout.
