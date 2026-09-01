import { useEffect, useRef, useState, type FormEvent } from "react";
import { InsightGraph } from "./components/InsightGraph";
import { analyzeVideo } from "./lib/api";
import type { AnalysisResult } from "./lib/analysis";
import type { GraphNode } from "./lib/graph";
import {
  clearSearchHistory,
  readSearchHistory,
  rememberSearch,
  type SearchHistoryItem,
} from "./lib/history";
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
  return Number.isNaN(date.getTime())
    ? "agora"
    : new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(date);
}

export default function App() {
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => readSearchHistory());
  const [url, setUrl] = useState(() => history[0]?.url ?? "");
  const [result, setResult] = useState<AnalysisResult | null>(() => history[0]?.result ?? null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => () => {
    const request = activeRequest.current;
    activeRequest.current = null;
    request?.abort();
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const submittedUrl = url.trim();
    setError(null);
    setSelected(null);
    if (!submittedUrl) {
      setError("Cole uma URL do YouTube.");
      return;
    }

    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    try {
      const analysis = await analyzeVideo(submittedUrl, controller.signal);
      setResult(analysis);
      setHistory(rememberSearch(submittedUrl, analysis));
    } catch (caught) {
      if (activeRequest.current === controller) {
        setError(caught instanceof Error ? caught.message : "Falha inesperada ao analisar o vídeo.");
      }
    } finally {
      if (activeRequest.current === controller) {
        activeRequest.current = null;
        setLoading(false);
      }
    }
  };

  const openHistoryItem = (item: SearchHistoryItem) => {
    const request = activeRequest.current;
    activeRequest.current = null;
    request?.abort();
    setLoading(false);
    setUrl(item.url);
    setResult(item.result);
    setSelected(null);
    setError(null);
  };

  const clearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="YT Signals — início">
          <Logo />
          <span>YT SIGNALS</span>
        </a>
      </header>

      <section className="workspace" id="top">
        <div className="canvas-panel">
          <div className="canvas-heading">
            <div>
              <h1>{result ? result.video.title : "Mapa de comentários"}</h1>
              <p className="canvas-subtitle">
                {result ? result.overview : "Envie um vídeo para visualizar os temas da conversa."}
              </p>
            </div>
          </div>

          <div className={`graph-stage${loading ? " is-loading" : ""}`}>
            {result ? (
              <InsightGraph result={result} selectedId={selected?.id} onSelect={setSelected} />
            ) : (
              <div className="empty-map" aria-label="Mapa aguardando um vídeo">
                <div className="empty-message">
                  <Logo />
                  <h2>Envie um vídeo</h2>
                  <p>Cole um link do YouTube no campo ao lado para começar.</p>
                </div>
              </div>
            )}

            {loading && (
              <div className="loading-layer" role="status">
                <div className="radar-loader"><span /><span /><i /></div>
                <strong>Analisando comentários</strong>
                <span>A API está organizando os principais temas da audiência.</span>
              </div>
            )}
          </div>
        </div>

        <aside className="control-panel">
          <div className="panel-intro">
            <h2>Analisar vídeo</h2>
            <p>Cole um link do YouTube para gerar o mapa.</p>
          </div>

          <form onSubmit={submit}>
            <label className="video-input">
              <span>LINK DO YOUTUBE</span>
              <div>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.07.07l2-2a5 5 0 0 0-7.07-7.07l-1.15 1.15m3.15 5.85a5 5 0 0 0-7.07-.07l-2 2A5 5 0 0 0 12 20l1.15-1.15" /></svg>
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="youtube.com/watch?v=..."
                  aria-label="URL do vídeo"
                  disabled={loading}
                />
              </div>
            </label>

            {error && <div className="error-message" role="alert">{error}</div>}

            <button type="submit" className="analyze-button" disabled={loading}>
              <span>{loading ? "Analisando…" : "Gerar mapa"}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </button>
          </form>

          {selected ? (
            <section className="node-inspector" aria-live="polite">
              <div className="inspector-heading">
                <span className="inspector-color" style={{ background: selected.color }} />
                <p className="kicker">{selected.eyebrow}</p>
              </div>
              <h3>{selected.label}</h3>
              <p>{selected.description}</p>
              <div className="meta-chips">
                {selected.meta.map((item, index) => <span key={`${index}:${item}`}>{item}</span>)}
              </div>
              {selected.evidence && selected.evidence.length > 0 && (
                <div className="evidence-list">
                  <p className="kicker">EVIDÊNCIAS</p>
                  {selected.evidence.map((item, index) => <blockquote key={`${index}:${item}`}>{item}</blockquote>)}
                </div>
              )}
            </section>
          ) : result ? (
            <section className="takeaways">
              <p className="kicker">PRINCIPAIS SINAIS</p>
              <ol>
                {result.takeaways.slice(0, 3).map((takeaway, index) => <li key={`${index}:${takeaway}`}>{takeaway}</li>)}
              </ol>
            </section>
          ) : null}

          {history.length > 0 && (
            <section className="recent-searches">
              <div className="recent-heading">
                <p className="kicker">BUSCAS RECENTES</p>
                <button type="button" onClick={clearHistory}>Limpar</button>
              </div>
              <div className="recent-list">
                {history.map((item) => (
                  <button type="button" key={item.id} onClick={() => openHistoryItem(item)}>
                    <span>{item.title}</span>
                    <small>{item.channel} · {formatDate(item.searchedAt)}</small>
                  </button>
                ))}
              </div>
            </section>
          )}
        </aside>
      </section>
    </main>
  );
}
