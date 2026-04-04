import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import { useChat } from "../hook/useChat";
import { setCurrentChatId } from "../chat.slice";
import "./Dashboard.css";

// Suggestion data for the home screen
const SUGGESTIONS = [
  { label: "For you", icon: "auto_awesome", active: true },
  { label: "Research", icon: "science" },
  { label: "Coding", icon: "code" },
  { label: "Writing", icon: "edit" },
];

const SUGGESTED_QUERIES = [
  "Analyze performance bottlenecks in React applications",
  "Explain the differences between REST and GraphQL APIs",
  "Write a Python script for web scraping with BeautifulSoup",
  "Design a scalable microservices architecture",
  "Best practices for securing Node.js backend APIs",
];

export default function Dashboard() {
  const dispatch = useDispatch();
  const {
    initializeSocketConnection,
    disconnectSocketConnection,
    handleGetChats,
    handleOpenChat,
    handleSendMessage,
  } = useChat();
  const { chats, currentChatId, isLoading } = useSelector((state) => state.chat);
  const [draft, setDraft] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [viewMode, setViewMode] = useState("home"); // home, chat, library
  const textareaRef = useRef(null);

  const activeChat = currentChatId ? chats[currentChatId] : null;
  const activeMessages = activeChat?.messages ?? [];

  // Synchronize viewMode with chat interaction
  useEffect(() => {
    if (currentChatId) {
      setViewMode("chat");
    } else if (viewMode === "chat") {
      setViewMode("home");
    }
  }, [currentChatId]);

  const chatList = useMemo(() => {
    return Object.values(chats || {}).sort(
      (a, b) => new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt)
    );
  }, [chats]);

  // Load fonts
  useEffect(() => {
    const links = [
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
    ].map((href) => {
      const el = document.createElement("link");
      el.href = href;
      el.rel = "stylesheet";
      document.head.appendChild(el);
      return el;
    });
    initializeSocketConnection();
    return () => {
      disconnectSocketConnection();
      links.forEach((l) => document.head.removeChild(l));
    };
  }, [disconnectSocketConnection, initializeSocketConnection]);

  // Bootstrap chats on mount
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await handleGetChats();
        if (!alive) return;
        const firstId = data?.chats?.[0]?._id;
        if (firstId) await handleOpenChat(firstId, Object.keys(chats).length ? chats : data.chats);
      } catch (e) {
        console.error("Bootstrap:", e);
      }
    })();
    return () => { alive = false; };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [draft]);

  async function openChat(chatId) {
    try { await handleOpenChat(chatId, chats); } catch (e) { console.error(e); }
  }

  async function onSubmit(queryText) {
    const message = (queryText || draft).trim();
    if (!message || isLoading) return;
    setDraft("");
    try {
      const res = await handleSendMessage({ message, chatId: currentChatId });
      if (!currentChatId && res?.chat?._id) {
        await handleOpenChat(res.chat._id, { ...chats });
      }
    } catch (e) { console.error(e); }
  }

  function startNewConversation() {
    dispatch(setCurrentChatId(null));
    setViewMode("home");
    setDraft("");
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="plx-root">
      {/* ── NARROW ICON SIDEBAR ── */}
      <aside className="plx-sidebar">
        {/* Logo icon */}
        <div className="plx-logo-icon" title="Perplexity" onClick={() => setViewMode("home")}>
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
            <path d="M16 2L2 10V22L16 30L30 22V10L16 2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
            <path d="M16 2V30M2 10L30 22M30 10L2 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <div className="plx-sidebar-spacer" />

        {/* New Thread */}
        <button 
          className={`plx-icon-btn ${viewMode === "home" ? "plx-icon-btn--active" : ""}`} 
          title="New Thread" 
          onClick={startNewConversation}
        >
          <span className="material-symbols-outlined">edit_square</span>
        </button>

        {/* History / Library */}
        <button 
          className={`plx-icon-btn ${viewMode === "library" ? "plx-icon-btn--active" : ""}`} 
          title="History" 
          onClick={() => setViewMode("library")}
        >
          <span className="material-symbols-outlined">history</span>
        </button>

        <div className="plx-sidebar-grow" />
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="plx-main">
        {/* Top-right header actions */}
        <header className="plx-topbar">
          <div className="plx-topbar-right">
            <button className="plx-pill-btn">
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>calendar_month</span>
              <span>Scheduled</span>
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>expand_more</span>
            </button>
            <button className="plx-icon-btn">
              <span className="material-symbols-outlined">grid_view</span>
            </button>
          </div>
        </header>

        {/* ── CONDITIONAL RENDERING BY VIEWMODE ── */}
        
        {viewMode === "home" && (
          <div className="plx-home">
            <h1 className="plx-brand-title">perplexity</h1>

            {/* ── BIG INPUT CARD ── */}
            <div className="plx-input-card">
              {/* Text area */}
              <textarea
                ref={textareaRef}
                className="plx-card-textarea"
                placeholder="Type @ for connectors and sources"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              {/* Card bottom toolbar */}
              <div className="plx-card-toolbar">
                <div className="plx-card-toolbar-left">
                  <button className="plx-toolbar-btn" title="Attach">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                  </button>
                  <div className="plx-source-chip">
                    <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>computer</span>
                    <span>Computer</span>
                    <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>add</span>
                  </div>
                </div>
                <div className="plx-card-toolbar-right">
                  <button className="plx-toolbar-btn-text" title="Choose model">
                    <span>Model</span>
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>expand_more</span>
                  </button>
                  <button className="plx-toolbar-btn" title="Voice input">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>mic</span>
                  </button>
                  {draft.trim() ? (
                    <button
                      className="plx-send-btn"
                      onClick={() => onSubmit()}
                      disabled={isLoading}
                      title="Send"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_upward</span>
                    </button>
                  ) : (
                    <button className="plx-toolbar-btn plx-toolbar-btn--voice-wave" title="Voice">
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>graphic_eq</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Try suggestion */}
            <div className="plx-try-chip">
              <span className="material-symbols-outlined" style={{ fontSize: "15px", opacity: 0.7 }}>computer</span>
              <span>Try Computer</span>
            </div>

            {/* Suggestion pills */}
            <div className="plx-suggestion-tabs">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={s.label}
                  className={`plx-suggestion-pill${activeSuggestion === i ? " plx-suggestion-pill--active" : ""}`}
                  onClick={() => setActiveSuggestion(i)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>

            {/* Query list */}
            <ul className="plx-query-list">
              {SUGGESTED_QUERIES.map((q) => (
                <li key={q} className="plx-query-item" onClick={() => onSubmit(q)}>
                  {q}
                </li>
              ))}
            </ul>
          </div>
        )}

        {viewMode === "chat" && (
          <div className="plx-chat-wrapper">
            {/* HISTORY PANEL — flex sibling, not absolute overlay */}
            {chatList.length > 0 && (
              <div className="plx-history-panel gpt-scrollbar">
                <div className="plx-history-label">
                  <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>history</span>
                  Recent
                </div>
                {chatList.map((chat) => (
                  <div
                    key={chat._id || chat.id}
                    className={`plx-history-item${currentChatId === (chat._id || chat.id) ? " plx-history-item--active" : ""}`}
                    onClick={() => openChat(chat._id || chat.id)}
                  >
                    {typeof chat.title === "string"
                      ? chat.title.replace(/[\*\#\[\]\(\)\`]/g, "").trim() || "Untitled"
                      : "Untitled"}
                  </div>
                ))}
              </div>
            )}

            {/* CHAT COLUMN — takes remaining width, centered content */}
            <div className="plx-chat-column">
              <main className="plx-chat-area gpt-scrollbar">
                {activeMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`plx-msg-row plx-msg-row--${msg.role === "user" ? "user" : "ai"}`}
                  >
                    <div className={`plx-msg-bubble ${msg.role === "user" ? "plx-msg-bubble--user" : "plx-msg-bubble--ai"}`}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="plx-loading-row">
                    <div className="plx-loading-dot" style={{ animationDelay: "0ms" }} />
                    <div className="plx-loading-dot" style={{ animationDelay: "150ms" }} />
                    <div className="plx-loading-dot" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </main>

              {/* Floating input bar */}
              <div className="plx-chat-input-wrap">
                <div className="plx-chat-input-box">
                  <button className="plx-toolbar-btn">
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                  </button>
                  <textarea
                    ref={textareaRef}
                    className="plx-chat-textarea gpt-scrollbar"
                    placeholder="Ask anything..."
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                  />
                  <div className="plx-chat-input-actions">
                    <button className="plx-toolbar-btn">
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>mic</span>
                    </button>
                    {draft.trim() && (
                      <button className="plx-send-btn" onClick={() => onSubmit()} disabled={isLoading}>
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_upward</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {viewMode === "library" && (
          <div className="plx-library-view gpt-scrollbar">
            <div className="plx-library-header">
              <div className="plx-library-title">
                <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>history</span>
                <h2>Library</h2>
              </div>
              <p className="plx-library-subtitle">Your previous threads and research history.</p>
            </div>
            
            <div className="plx-library-list">
              {chatList.length > 0 ? (
                chatList.map((chat) => (
                  <div 
                    key={chat._id || chat.id} 
                    className="plx-library-item"
                    onClick={() => openChat(chat._id || chat.id)}
                  >
                    <div className="plx-library-item-content">
                      <div className="plx-library-item-title">
                        {typeof chat.title === 'string' ? chat.title.replace(/[\*\#\[\]\(\)\`]/g, '') : "Untitled Thread"}
                      </div>
                      <div className="plx-library-item-meta">
                        {new Date(chat.createdAt).toLocaleDateString()} • {chat.messages?.length || 0} messages
                      </div>
                    </div>
                    <span className="material-symbols-outlined plx-library-arrow">chevron_right</span>
                  </div>
                ))
              ) : (
                <div className="plx-library-empty">
                  No previous threads found. Start a new conversation to see them here.
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
