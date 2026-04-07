import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import { MathJax } from "better-react-mathjax";
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
    handleSendImageMessage,
  } = useChat();
  const { chats, currentChatId, isLoading } = useSelector((state) => state.chat);
  const { slug, chatId: routeChatId } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [viewMode, setViewMode] = useState("home"); // home, chat, library
  const [selectedImage, setSelectedImage] = useState(null); // { file, previewUrl }
  const textareaRef = useRef(null);
  const imageInputRef = useRef(null);

  const activeChat = currentChatId ? chats[currentChatId] : null;
  const activeMessages = activeChat?.messages ?? [];

  // Sync URL -> Chat State
  useEffect(() => {
    if (routeChatId && chats) {
      if (currentChatId !== routeChatId) {
        handleOpenChat(routeChatId, chats).catch(e => console.error("URL Load Error:", e));
      }
      setViewMode("chat");
    } else if (!routeChatId) {
      // No chatId in URL = new chat / home screen — always clear active chat
      dispatch(setCurrentChatId(null));
      setViewMode("home");
    }
  }, [routeChatId]); // Only re-run when the URL chatId changes

  const chatList = useMemo(() => {
    return Object.values(chats || {}).sort(
      (a, b) => new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt)
    );
  }, [chats]);

  function generateSlug(title) {
    if (!title || typeof title !== 'string') return "chat";
    return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") || "chat";
  }

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

  // Bootstrap — only load chat list on mount, NEVER auto-open a chat
  // (auto-opening the first chat was causing new messages to go to the wrong chat)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await handleGetChats();
        // If the URL already has a chatId, the URL-sync effect above will open it.
        // If URL is '/', stay on home — do NOT auto-open anything.
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
    try { 
      await handleOpenChat(chatId, chats);
      const chatTitle = chats[chatId]?.title || "chat";
      const newSlug = generateSlug(chatTitle);
      navigate(`/search/${newSlug}/${chatId}`);
    } catch (e) { console.error(e); }
  }

  async function onSubmit(queryText) {
    const message = (queryText || draft).trim();
    if (isLoading) return;

    // Immediately switch to chat view so UI updates
    setViewMode("chat");

    let data;

    if (selectedImage) {
      // Send image (with optional text)
      try {
        data = await handleSendImageMessage({
          file: selectedImage.file,
          content: message,
          chatId: currentChatId,
        });
      } catch (e) { console.error(e); }
      finally {
        clearSelectedImage();
        setDraft("");
        if (imageInputRef.current) imageInputRef.current.value = "";
      }
    } else {
      if (!message) return;
      setDraft("");
      try {
        data = await handleSendMessage({ message, chatId: currentChatId });
      } catch (e) { console.error(e); }
    }

    if (data) {
      const returnedChatId = data.chat?._id || currentChatId;
      const returnedTitle = data.title || data.chat?.title || "chat";
      
      // If we just created a new chat, push the new URL to address bar
      if (!currentChatId || currentChatId !== returnedChatId) {
        navigate(`/search/${generateSlug(returnedTitle)}/${returnedChatId}`);
      }
    }
  }

  function handleImageSelection(e) {
    const file = e.target.files?.[0];
    if (!file || isLoading) return;
    const previewUrl = URL.createObjectURL(file);
    setSelectedImage({ file, previewUrl });
    // Reset input so the same file can be re-selected if needed
    e.target.value = "";
  }

  function clearSelectedImage() {
    if (selectedImage?.previewUrl) URL.revokeObjectURL(selectedImage.previewUrl);
    setSelectedImage(null);
  }

  function triggerImagePicker() {
    imageInputRef.current?.click();
  }

  function startNewConversation() {
    dispatch(setCurrentChatId(null));  // clear active chat in Redux
    setViewMode("home");               // switch UI back to home screen
    setDraft("");
    clearSelectedImage();
    navigate("/");                     // clear chatId from URL
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="plx-root">
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="plx-hidden-file-input"
        onChange={handleImageSelection}
      />

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

        {/* Music */}
        <button 
          className="plx-icon-btn" 
          title="Music" 
          onClick={() => navigate("/music")}
        >
          <span className="material-symbols-outlined">music_note</span>
        </button>

        {/* Research */}
        <button 
          className="plx-icon-btn" 
          title="Deep Research" 
          onClick={() => navigate("/research")}
        >
          <span className="material-symbols-outlined">biotech</span>
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
              {/* Image preview inside the card */}
              {selectedImage && (
                <div className="plx-image-preview-strip">
                  <div className="plx-image-preview-thumb">
                    <img src={selectedImage.previewUrl} alt="Selected" />
                    <button className="plx-image-preview-remove" onClick={clearSelectedImage} title="Remove image">
                      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span>
                    </button>
                  </div>
                </div>
              )}
              {/* Text area */}
              <textarea
                ref={textareaRef}
                className="plx-card-textarea"
                placeholder={selectedImage ? "Add a message (optional)..." : "Type @ for connectors and sources"}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              {/* Card bottom toolbar */}
              <div className="plx-card-toolbar">
                <div className="plx-card-toolbar-left">
                  <button className="plx-toolbar-btn" title="Attach image" onClick={triggerImagePicker} disabled={isLoading}>
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
                  {(draft.trim() || selectedImage) ? (
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
                      {/* Sources / Citations — only on AI messages */}
                      {msg.role === "ai" && msg.sources?.length > 0 && (
                        <div className="plx-sources-row">
                          {msg.sources.map((src, i) => (
                            <a
                              key={i}
                              href={src.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="plx-source-card"
                              title={src.title}
                            >
                              <img
                                src={src.favicon}
                                alt={src.domain}
                                className="plx-source-favicon"
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                              <span className="plx-source-domain">{src.domain}</span>
                            </a>
                          ))}
                        </div>
                      )}
                      {msg.image ? (
                        <img src={msg.image} alt="Uploaded message" className="plx-msg-image" />
                      ) : null}
                      {msg.content ? (
                        <MathJax dynamic>
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </MathJax>
                      ) : null}

                      {/* Follow-up suggestions — only on last AI message */}
                      {msg.role === "ai" && msg.followUps?.length > 0 && idx === activeMessages.length - 1 && (
                        <div className="plx-followups-row">
                          {msg.followUps.map((q, fi) => (
                            <button
                              key={fi}
                              className="plx-followup-chip"
                              onClick={() => {
                                setDraft(q);
                                textareaRef.current?.focus();
                              }}
                            >
                              <span className="material-symbols-outlined plx-followup-icon">arrow_forward</span>
                              {q}
                            </button>
                          ))}
                        </div>
                      )}
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
                <div className="plx-chat-input-box plx-chat-input-box--has-preview">
                  {/* Image preview inside the input box */}
                  {selectedImage && (
                    <div className="plx-image-preview-strip">
                      <div className="plx-image-preview-thumb">
                        <img src={selectedImage.previewUrl} alt="Selected" />
                        <button className="plx-image-preview-remove" onClick={clearSelectedImage} title="Remove image">
                          <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>close</span>
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="plx-chat-input-row">
                    <button className="plx-toolbar-btn" onClick={triggerImagePicker} disabled={isLoading}>
                      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>add</span>
                    </button>
                    <textarea
                      ref={textareaRef}
                      className="plx-chat-textarea gpt-scrollbar"
                      placeholder={selectedImage ? "Add a message (optional)..." : "Ask anything..."}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={1}
                    />
                    <div className="plx-chat-input-actions">
                      <button className="plx-toolbar-btn">
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>mic</span>
                      </button>
                      {(draft.trim() || selectedImage) && (
                        <button className="plx-send-btn" onClick={() => onSubmit()} disabled={isLoading}>
                          <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>arrow_upward</span>
                        </button>
                      )}
                    </div>
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
