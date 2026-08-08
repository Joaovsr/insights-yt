import { useMemo, useState, type FormEvent } from "react";
import { InsightGraph } from "./components/InsightGraph";
import { demoAnalysis } from "./data/demo";
import { analysisResultSchema, type AnalysisResult } from "./lib/analysis";
import type { GraphNode } from "./lib/graph";
import "./styles.css";

function Logo() {
  return (
    <div className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
      <i />
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "agora" : new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export default function App() {
  const [urls, setUrls] = useState([""]);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  const totalComments = useMemo(
    () => result?.videos.reduce((sum, video) => sum + video.commentCountAnalyzed, 0) ?? 0,
    [result],
  );

  const updateUrl = (index: number, value: string) => {
    setUrls((current) => current.map((url, itemIndex) => itemIndex === index ? value : url));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSelected(null);
    setIsDemo(false);
    const submittedUrls = urls.map((url) => url.trim()).filter(Boolean);
    if (submittedUrls.length === 0) {
      setError("Cole pelo menos uma URL do YouTube.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: submittedUrls }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) {
        const message = typeof payload === "object" && payload && "error" in payload
          ? String(payload.error)
          : "Não foi possível concluir a análise.";
        throw new Error(message);
      }
      setResult(analysisResultSchema.parse(payload));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Falha inesperada ao analisar os vídeos.");
    } finally {
      setLoading(false);
    }
  };

  const showDemo = () => {
    setResult(demoAnalysis);
    setIsDemo(true);
    setSelected(null);
    setError(null);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="YT Signals — início">
          <Logo />
          <span>YT SIGNALS</span>
        </a>
        <div className="topbar-status">
          <span className="status-pulse" /> Codex + YouTube MCP
        </div>
      </header>

      <section className="workspace" id="top">
        <div className="canvas-panel">
          <div className="canvas-heading">
            <div>
              <p className="kicker">MAPA DE PERCEPÇÃO</p>
              <h1>{result ? "O que a audiência está dizendo" : "Comentários viram sinais."}</h1>
              <p className="canvas-subtitle">
                {result ? result.overview : "Encontre padrões, tensões e temas escondidos em até dois vídeos."}
              </p>
            </div>
            {result && (
              <div className="summary-metrics">
                <div><strong>{totalComments}</strong><span>comentários</span></div>
                <div><strong>{result.videos.reduce((sum, video) => sum + video.tags.length, 0)}</strong><span>tags</span></div>
                <div><strong>{result.sharedThemes.length}</strong><span>conexões</span></div>
              </div>
            )}
          </div>

          <div className={`graph-stage${loading ? " is-loading" : ""}`}>
            {result ? (
              <InsightGraph result={result} selectedId={selected?.id} onSelect={setSelected} />
            ) : (
              <div className="empty-map" aria-label="Mapa aguardando um vídeo">
                <div className="empty-orbit empty-orbit--one"><span>sentimento</span></div>
                <div className="empty-orbit empty-orbit--two"><span>temas</span></div>
                <div className="empty-orbit empty-orbit--three"><span>comentários</span></div>
                <button type="button" className="empty-core" onClick={showDemo}>
                  <Logo />
                  <strong>Explore o mapa</strong>
                  <span>ver demonstração</span>
                </button>
              </div>
            )}

            {loading && (
              <div className="loading-layer" role="status">
                <div className="radar-loader"><span /><span /><i /></div>
                <p className="kicker">CODEX EM AÇÃO</p>
                <strong>Lendo a conversa da audiência</strong>
                <span>Consultando até 100 comentários por vídeo e agrupando os sinais.</span>
              </div>
            )}

            {isDemo && <span className="demo-badge">dados demonstrativos</span>}
          </div>
        </div>

        <aside className="control-panel">
          <div className="panel-intro">
            <span className="step-number">01</span>
            <div>
              <p className="kicker">FONTE</p>
              <h2>Escolha os vídeos</h2>
            </div>
          </div>

          <form onSubmit={submit}>
            <div className="input-list">
              {urls.map((url, index) => (
                <label className="video-input" key={index}>
                  <span>VÍDEO {String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15m3.15 5.85a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15" /></svg>
                    <input
                      value={url}
                      onChange={(event) => updateUrl(index, event.target.value)}
                      placeholder="youtube.com/watch?v=..."
                      aria-label={`URL do vídeo ${index + 1}`}
                      disabled={loading}
                    />
                    {urls.length === 2 && (
                      <button
                        type="button"
                        className="remove-input"
                        onClick={() => setUrls((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        aria-label={`Remover vídeo ${index + 1}`}
                      >×</button>
                    )}
                  </div>
                </label>
              ))}
            </div>

            {urls.length < 2 && (
              <button type="button" className="add-video" onClick={() => setUrls((current) => [...current, ""])} disabled={loading}>
                <span>+</span> Comparar com outro vídeo
              </button>
            )}

            {error && <div className="error-message" role="alert">{error}</div>}

            <button type="submit" className="analyze-button" disabled={loading}>
              <span>{loading ? "Analisando…" : "Gerar mapa de insights"}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
            <p className="form-note">O Codex usa o MCP local. Nenhuma chave é enviada ao navegador.</p>
          </form>

          <div className="panel-divider" />

          {selected ? (
            <section className="node-inspector" aria-live="polite">
              <div className="inspector-heading">
                <span className="inspector-color" style={{ background: selected.color }} />
                <p className="kicker">{selected.eyebrow}</p>
              </div>
              <h3>{selected.label}</h3>
              <p>{selected.description}</p>
              <div className="meta-chips">
                {selected.meta.map((item) => <span key={item}>{item}</span>)}
              </div>
              {selected.evidence && selected.evidence.length > 0 && (
                <div className="evidence-list">
                  <p className="kicker">EVIDÊNCIAS</p>
                  {selected.evidence.slice(0, 3).map((item) => <blockquote key={item}>{item}</blockquote>)}
                </div>
              )}
            </section>
          ) : result ? (
            <section className="takeaways">
              <p className="kicker">LEITURA RÁPIDA</p>
              <h3>Sinais principais</h3>
              <ol>
                {result.takeaways.map((takeaway, index) => (
                  <li key={takeaway}><span>{String(index + 1).padStart(2, "0")}</span>{takeaway}</li>
                ))}
              </ol>
              <p className="generated-at">Análise gerada em {formatDate(result.generatedAt)}</p>
            </section>
          ) : (
            <section className="how-it-works">
              <p className="kicker">COMO LER</p>
              <div><i className="guide-icon guide-icon--center" /><span><strong>Núcleo</strong> representa cada vídeo.</span></div>
              <div><i className="guide-icon guide-icon--tag" /><span><strong>Órbitas</strong> agrupam temas recorrentes.</span></div>
              <div><i className="guide-icon guide-icon--comment" /><span><strong>Pontos</strong> revelam comentários-chave.</span></div>
            </section>
          )}

          <footer className="panel-footer">
            <span>LOCAL-FIRST</span>
            <span>100 COMENTÁRIOS / VÍDEO</span>
          </footer>
        </aside>
      </section>
    </main>
  );
}
