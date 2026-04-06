import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useNavigate } from "react-router-dom";
import { runDeepResearch } from "../services/research.api.js";
import "./ResearchPage.css";

const preprocessMath = (content) => {
  if (!content) return content;
  return content
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$')
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
};

const EXAMPLE_TOPICS = [
  "Quantum Computing",
  "CRISPR Gene Editing",
  "Large Language Models",
  "Climate Change Mitigation",
  "Blockchain Technology",
  "Neuroplasticity",
  "Dark Matter",
  "Microbiome & Human Health",
];

const PHASES = [
  { label: "Generating targeted sub-queries", icon: "🧠" },
  { label: "Running 5 deep web searches in parallel", icon: "🔍" },
  { label: "Collecting & deduplicating sources", icon: "📚" },
  { label: "Synthesizing research document", icon: "✍️" },
];

export default function ResearchPage() {
  const navigate = useNavigate();
  const inputRef = useRef(null);

  const [topic, setTopic]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [phase, setPhase]       = useState(-1);   // current loading phase index
  const [result, setResult]     = useState(null); // { report, sources, queries }
  const [error, setError]       = useState(null);

  // Cycle through phases while loading
  useEffect(() => {
    if (!loading) { setPhase(-1); return; }
    setPhase(0);
    const timers = PHASES.slice(1).map((_, i) =>
      setTimeout(() => setPhase(i + 1), (i + 1) * 9000)
    );
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  async function handleResearch(topicOverride) {
    const q = (topicOverride || topic).trim();
    if (!q || loading) return;
    setTopic(q);
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await runDeepResearch(q);
      setResult(data);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Research failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setTopic("");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <div className="rp-root">
      {/* Nav */}
      <nav className="rp-nav">
        <button className="rp-nav-back" onClick={() => navigate("/")}>
          ← Back
        </button>
        <div className="rp-nav-title">
          <div className="rp-nav-icon">🔬</div>
          Deep Research
        </div>
      </nav>

      {/* Hero + Input (always visible when no result) */}
      {!result && !loading && (
        <div className="rp-hero">
          <div className="rp-hero-label">Powered by Tavily + Mistral AI</div>
          <h1>Research Anything, Deeply</h1>
          <p>
            Enter any topic. The AI runs 5 targeted web searches in parallel,<br />
            collects sources, and synthesizes a structured research document.
          </p>

          <div className="rp-search-wrap">
            <input
              ref={inputRef}
              className="rp-input"
              placeholder="e.g. Quantum Computing, CRISPR, Climate Change..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleResearch()}
              autoFocus
            />
            <button
              className="rp-btn"
              onClick={() => handleResearch()}
              disabled={!topic.trim() || loading}
            >
              🔬 Research
            </button>
          </div>

          {/* Example chips */}
          <div className="rp-chips">
            {EXAMPLE_TOPICS.map((t) => (
              <button key={t} className="rp-chip" onClick={() => handleResearch(t)}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="rp-loading">
          <div className="rp-progress-wrap">
            <div className="rp-progress-title">Researching: "{topic}"</div>
            <div className="rp-progress-sub">This takes about 30-60 seconds. Grab a coffee ☕</div>

            <div className="rp-steps">
              {PHASES.map((p, i) => (
                <div
                  key={i}
                  className={`rp-step ${i < phase ? "done" : i === phase ? "active" : ""}`}
                >
                  <div className="rp-step-dot">
                    {i < phase ? "✓" : i === phase ? p.icon : String(i + 1)}
                  </div>
                  {p.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rp-error">
          ⚠️ {error}
          <br /><br />
          <button className="rp-new-btn" onClick={reset}>Try Again</button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rp-result">
          {/* Header */}
          <div className="rp-result-header">
            <div>
              <div className="rp-result-topic">📄 {topic}</div>
              <div className="rp-result-meta">
                {result.sources?.length || 0} sources · {result.queries?.length || 0} search queries
              </div>
            </div>
            <button className="rp-new-btn" onClick={reset}>＋ New Research</button>
          </div>

          {/* Sources */}
          {result.sources?.length > 0 && (
            <div className="rp-sources">
              <div className="rp-sources-label">Sources</div>
              <div className="rp-sources-list">
                {result.sources.slice(0, 18).map((s, i) => (
                  <a key={i} href={s.url} target="_blank" rel="noreferrer" className="rp-source-chip">
                    <img src={s.favicon} alt="" onError={(e) => { e.target.style.display = "none"; }} />
                    {s.domain}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Report */}
          <div className="rp-report">
            <ReactMarkdown
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {preprocessMath(result.report)}
            </ReactMarkdown>
          </div>

          {/* Queries used */}
          {result.queries?.length > 0 && (
            <div className="rp-queries">
              <div className="rp-queries-title">Search Queries Used</div>
              {result.queries.map((q, i) => (
                <div key={i} className="rp-query-item">
                  <span className="rp-query-num">{i + 1}</span>
                  {q}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
