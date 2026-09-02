# Insights YT

Aplicação React + Node que transforma os comentários de um vídeo do YouTube em um mapa visual de temas e sentimentos. Frontend e backend vivem neste projeto e usam um único `package.json`.

## Como funciona

```text
Browser → Node → YouTube Data API → OpenAI Responses API → JSON validado → grafo interativo
```

O navegador extrai o ID de uma URL válida do YouTube e chama o backend na mesma origem com `{ "maxComments": 100 }`. O backend coleta metadados e comentários, solicita uma análise estruturada à OpenAI e valida as referências antes de responder. O frontend valida novamente o contrato com Zod antes de atualizar a tela ou o histórico em `localStorage`. Nenhuma chave chega ao browser.

## Desenvolvimento local

Requisito: Node.js 20+.

```bash
npm install
cp .env.example .env
# preencher YOUTUBE_API_KEY e OPENAI_API_KEY
npm run dev
```

Abra `http://127.0.0.1:5173`. O Vite executa a interface e o backend no mesmo processo de desenvolvimento.

## Produção

Gere o frontend e inicie o servidor Node:

```bash
npm run build
npm start
```

Por padrão, o servidor escuta o `HTTP_ADDRESS` definido no `.env`, serve os arquivos de `dist` e expõe a API na mesma origem. Em plataformas gerenciadas, `HTTP_HOST` e `PORT` substituem `HTTP_ADDRESS` quando estiverem definidos.

Endpoints:

- `GET /health`
- `POST /api/v1/videos/{videoId}/comment-analysis`

## Verificações

```bash
npm run check
npm run build
```

Os testes usam clientes falsos para YouTube e OpenAI; não consomem as chaves do `.env`.

## Limites atuais

- Um vídeo por análise.
- Até 100 comentários relevantes por mapa.
- Cada comentário analisado aparece uma vez, ligado à sua tag temática principal.
- O tamanho e o brilho das tags acompanham o volume real de comentários.
- Uma análise pode levar até três minutos; o frontend propaga cancelamento e aplica timeout.
