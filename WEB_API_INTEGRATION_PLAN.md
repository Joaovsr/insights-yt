# Plano de integração do web com a API

## Objetivo

Substituir o fluxo local `web -> codex exec -> MCP youtube` por `web -> insights-yt-api -> YouTube Data API + OpenAI Responses API`, preservando a experiência atual do mapa, o histórico local e a validação dos dados.

## Estado atual

- O web recebe uma URL em `POST /api/analyze`, extrai o `videoId` e executa `codex exec` no servidor Node.
- O Codex usa o MCP do YouTube para buscar metadados e até 100 comentários e devolve exatamente o contrato consumido pelo grafo.
- A API Go já busca comentários diretamente pela YouTube Data API e os analisa pela OpenAI Responses API.
- A API Go expõe `POST /api/v1/videos/{videoId}/comment-analysis` com `{ "maxComments": 100 }`.
- Os testes dos dois projetos passam, mas não há `.env` configurado para um teste real.

## Lacunas que impedem a troca direta

| Necessidade do web | API Go atual | Mudança necessária |
| --- | --- | --- |
| título, canal e thumbnail | não retorna metadados | consultar `videos.list` e incluir os metadados |
| comentários individuais por tema | retorna apenas exemplos de tema | retornar cada comentário uma vez, com `id`, autor, texto e likes |
| 4 a 10 tags com descrição, sentimento e keywords | retorna temas simples | ampliar o schema estruturado da análise |
| sentimento em percentuais | retorna contagens | definir um único contrato; recomendação: API retorna percentuais e total analisado |
| `overview` e `takeaways` | retorna summary, perguntas, reclamações e sugestões | mapear ou incorporar esses campos ao contrato da API |
| erro específico no frontend | API responde mensagens genéricas em inglês | padronizar um envelope de erro e traduzir na interface |
| desenvolvimento com uma origem | web usa proxy local implícito | configurar proxy Vite ou `VITE_API_BASE_URL` |

## Decisões propostas

1. Tornar a API Go dona do contrato público de análise. O frontend mantém um schema Zod equivalente para validar a fronteira, mas não transforma uma resposta incompleta.
2. Manter o navegador enviando apenas a URL. Um adaptador fino no web extrai/valida o `videoId` e chama a API Go; nenhuma chave chega ao browser.
3. Preservar inicialmente o formato `AnalysisResult` já usado pelo grafo. Isso reduz a mudança visual e permite remover o Codex/MCP sem reescrever a visualização.
4. Limitar o primeiro corte a 100 comentários, apesar de a API aceitar 200, porque o contrato e a interface atuais têm esse limite.
5. Usar chamada direta do navegador à API em produção, com origem permitida explícita; no desenvolvimento, usar proxy do Vite para evitar diferenças de CORS.
6. Versionar os dois projetos antes da implementação. Hoje somente `insights-yt-web` é um repositório Git; `insights-yt-api` está fora de controle de versão, portanto esta branch não consegue registrar alterações da API.

## Plano de implementação

### 0. Preparar o versionamento

- Decidir entre monorepo e dois repositórios. Recomendação: monorepo na pasta `insights-yt`, mantendo `web/` e `api/` como aplicações independentes.
- Trazer o histórico atual do web sem perder commits, ou criar um repositório próprio para a API caso os deploys devam ser totalmente independentes.
- Criar a branch de implementação a partir deste plano e garantir que mudanças de API e web possam ser revisadas juntas.

Critério de saída: todo arquivo de API e web relevante aparece em `git status` e pode ser incluído no mesmo PR ou em PRs explicitamente vinculados.

### 1. Definir o contrato canônico

- Publicar na API um DTO equivalente ao `AnalysisResult` atual: `generatedAt`, `overview`, `video`, `takeaways`, metadados, sentimento, tags e comentários.
- Adicionar `author` à coleta do YouTube e manter `likeCount` com um nome consistente (`likes` ou `likeCount`) em todas as camadas.
- Garantir no backend:
  - IDs de tags e comentários únicos;
  - cada comentário em exatamente uma tag;
  - `commentCount` igual ao tamanho de `comments`;
  - soma das tags igual a `commentCountAnalyzed`;
  - sentimentos totalizando 100;
  - URL e thumbnail correspondendo ao `videoId`.
- Documentar exemplos de sucesso e erro no README da API.

Critério de saída: testes de contrato da API cobrem uma resposta completa aceita pelo schema Zod atual.

### 2. Enriquecer a coleta e a análise da API

- Criar uma chamada à YouTube Data API `videos.list` para título, canal e thumbnail.
- Incluir `authorDisplayName` na leitura de `commentThreads.list`.
- Atualizar o JSON Schema enviado à Responses API para classificar todos os comentários no formato canônico.
- Tratar comentários como dados não confiáveis e manter a instrução contra prompt injection.
- Validar a resposta da OpenAI no Go antes de responder ao cliente.
- Adicionar testes de paginação, metadados, caracteres Unicode, deduplicação e resposta inválida do modelo.

Critério de saída: um teste de integração com servidores HTTP falsos produz o payload final sem acessar YouTube ou OpenAI reais.

### 3. Criar o cliente de API no web

- Adicionar `src/lib/api.ts` (ou equivalente) com `analyzeVideo(url, signal)`.
- Extrair o `videoId` usando a validação já existente e chamar `POST /api/v1/videos/{videoId}/comment-analysis`.
- Validar a resposta com `analysisResultSchema` antes de atualizar a tela ou o histórico.
- Suportar `AbortSignal`, timeout e mensagens para `400`, `422`, `429`, `502` e indisponibilidade de rede.
- Configurar:
  - desenvolvimento: proxy `/api/v1` para `http://127.0.0.1:8080`;
  - produção: `VITE_API_BASE_URL`, sem segredo.
- Trocar `App.tsx` para usar o cliente e atualizar o texto de loading para não mencionar Codex.

Critério de saída: testes do frontend confirmam URL correta, corpo `{ "maxComments": 100 }`, erro HTTP e payload inválido.

### 4. Remover o fluxo Codex + MCP

- Remover `server/codex.ts`, `server/normalize.ts`, `server/analysis-schema.json` e os testes exclusivos desse fluxo.
- Simplificar ou remover o servidor Express. Mantê-lo somente se ele continuar responsável por servir o build; ele não deve mais executar agentes.
- Retirar do README os pré-requisitos de Codex CLI e MCP YouTube.
- Remover dependências e scripts Node que ficarem sem uso.
- Atualizar o diagrama para `Browser -> API Go -> YouTube Data API -> OpenAI Responses API -> JSON -> grafo`.

Critério de saída: buscar por `codex`, `MCP` e `youtube` no servidor web não encontra dependências de runtime antigas (exceto documentação histórica deliberada).

### 5. Segurança e operação

- Restringir `CORS_ALLOWED_ORIGIN`; não usar `*` em produção.
- Adicionar autenticação e rate limiting antes de expor publicamente, conforme já alertado no README da API.
- Não registrar chaves, conteúdo integral dos comentários ou respostas brutas do modelo.
- Definir limites de corpo, timeouts e cancelamento propagado até YouTube/OpenAI.
- Adicionar logs com request ID, `videoId`, duração, quantidade de comentários e categoria de erro.
- Definir deploy e health check separados para web e API.

Critério de saída: uma análise não autenticada ou acima do limite é rejeitada de forma previsível, e falhas externas podem ser diagnosticadas sem dados sensíveis.

### 6. Teste ponta a ponta e corte

- Subir API e web localmente com chaves de desenvolvimento.
- Testar um vídeo com muitos comentários, um com comentários desativados e uma URL inválida.
- Confirmar que todos os nós abrem, a contagem fecha e o histórico pode reabrir a análise sem nova chamada.
- Executar `make check` na API e `npm run check && npm run build` no web.
- Fazer o corte removendo o endpoint Node antigo somente após o smoke test real.

Critério de saída: um vídeo real completa o fluxo em até 3 minutos e gera um grafo equivalente ao fluxo anterior.

## Execução local da API atual

Na pasta `insights-yt-api`:

```bash
cp .env.example .env
# preencher YOUTUBE_API_KEY e OPENAI_API_KEY
set -a
source .env
set +a
go run .
```

Em outro terminal:

```bash
curl -X POST \
  http://127.0.0.1:8080/api/v1/videos/VIDEO_ID/comment-analysis \
  -H 'Content-Type: application/json' \
  -d '{"maxComments":100}'
```

Esse smoke test já verifica coleta + análise e retorna JSON. Porém, antes das etapas 1 e 2, o JSON ainda não contém informação suficiente para alimentar o grafo atual sem perda de funcionalidade.

## Ordem sugerida de commits

1. `docs: plan web api integration`
2. `feat(api): expose graph analysis contract`
3. `feat(api): fetch video metadata and comment authors`
4. `test(api): cover full analysis pipeline`
5. `feat(web): add comment analysis api client`
6. `feat(web): switch analysis flow to go api`
7. `refactor(web): remove codex mcp runtime`
8. `docs: update local setup and deployment`

## Riscos principais

- A classificação de até 100 comentários com o comentário completo no output pode aproximar limites de tokens; medir e limitar comprimentos sem perder a rastreabilidade.
- Structured Outputs garante forma, não coerência entre contagens e listas; as invariantes precisam continuar validadas em Go.
- CORS sozinho não protege a API. Sem autenticação e rate limiting, as chaves do servidor podem gerar custo por terceiros.
- O histórico em `localStorage` pode guardar payloads antigos. Incluir versão do schema ou ignorar entradas incompatíveis durante a migração.
