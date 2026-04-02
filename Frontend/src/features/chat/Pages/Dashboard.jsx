import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ReactMarkdown from "react-markdown";
import { useChat } from "../hook/useChat";
import { setCurrentChatId } from "../chat.slice";
import "./Dashboard.css";

export default function Dashboard() {
  const dispatch = useDispatch();
  const { initializeSocketConnection, handleGetChats, handleOpenChat, handleSendMessage } = useChat();
  const { chats, currentChatId, isLoading, error } = useSelector((state) => state.chat);
  const [draft, setDraft] = useState("");
  const [hasBootstrapped, setHasBootstrapped] = useState(false);

  const activeChat = currentChatId ? chats[currentChatId] : null;
  const activeMessages = activeChat?.messages ?? [];
  const chatList = useMemo(() => {
    return Object.values(chats || {}).sort((a,b) => new Date(b.lastUpdated || b.createdAt) - new Date(a.lastUpdated || a.createdAt));
  }, [chats]);

  useEffect(() => {
    const linkInter = document.createElement("link");
    linkInter.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    linkInter.rel = "stylesheet";
    document.head.appendChild(linkInter);

    const linkSymbols = document.createElement("link");
    linkSymbols.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap";
    linkSymbols.rel = "stylesheet";
    document.head.appendChild(linkSymbols);

    initializeSocketConnection();
    return () => {
      document.head.removeChild(linkInter);
      document.head.removeChild(linkSymbols);
    };
  }, [initializeSocketConnection]);

  useEffect(() => {
    let isMounted = true;
    async function bootstrapDashboard() {
      try {
        const data = await handleGetChats();
        if (!isMounted) return;
        const firstChatId = data?.chats?.[0]?._id;
        if (firstChatId) await handleOpenChat(firstChatId, Object.keys(chats).length ? chats : data.chats);
      } catch (err) {
        console.error("Bootstrap error:", err);
      } finally {
        if (isMounted) setHasBootstrapped(true);
      }
    }
    bootstrapDashboard();
    return () => { isMounted = false; };
  }, []);

  async function openChat(chatId) {
    try { await handleOpenChat(chatId, chats); } catch (err) { console.error("Open error:", err); }
  }

  async function onSubmit(e) {
    if (e) e.preventDefault();
    const message = draft.trim();
    if (!message || isLoading) return;
    try {
      const response = await handleSendMessage({ message, chatId: currentChatId });
      if (!currentChatId && response?.chat?._id) {
        await handleOpenChat(response.chat._id, { ...chats });
      }
      setDraft("");
    } catch (err) { console.error("Send error:", err); }
  }

  function startNewConversation() {
    dispatch(setCurrentChatId(null));
    setDraft("");
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="gpt-dashboard">
      <aside className="gpt-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-top-icons">
            <button className="icon-btn" title="Toggle sidebar">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <button onClick={startNewConversation} className="icon-btn" title="New chat">
              <span className="material-symbols-outlined">edit_square</span>
            </button>
          </div>
        </div>

        <nav className="nav-menu gpt-scrollbar">
          <div className="menu-section">
            <div className="menu-item" onClick={startNewConversation}>
              <span className="material-symbols-outlined">edit_square</span>
              <span>New chat</span>
            </div>
            <div className="menu-item">
              <span className="material-symbols-outlined">search</span>
              <span>Search chats</span>
            </div>
          </div>

          <div className="menu-section">
            <div className="menu-eyebrow" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
              Your chats <span className="material-symbols-outlined" style={{ fontSize: '14px', marginLeft: '4px' }}>expand_more</span>
            </div>
            {chatList.map((chat, idx) => (
              <div 
                key={chat._id || chat.id} 
                onClick={() => openChat(chat._id || chat.id)}
                className={`menu-item ${currentChatId === (chat._id || chat.id) ? 'active' : ''}`}
                style={{ justifyContent: 'space-between' }}
              >
                <div className="chat-title-text" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, fontSize: '0.85rem' }}>
                  <ReactMarkdown>{chat.title || "Untitled Chat"}</ReactMarkdown>
                </div>
                {idx < 2 && (
                  <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--text-dim)' }}>push_pin</span>
                )}
              </div>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="profile-card">
            <div className="profile-avatar">KR</div>
            <div className="profile-info">
              <span className="profile-name">Aditya Kumar</span>
              <span className="profile-subtitle">Go</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="gpt-main">
        <header className="gpt-header">
          <div className="header-brand">
            <span>ChatGPT</span>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#b4b4b4' }}>expand_more</span>
          </div>
          <div className="header-actions">
           <button className="icon-btn">
              <span className="material-symbols-outlined">person_add</span>
            </button>
            <button className="icon-btn">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
        </header>

        <main className="gpt-chat-area gpt-scrollbar">
          {activeMessages.length > 0 ? (
            activeMessages.map((msg, idx) => (
              <div key={idx} className={`message-wrapper message-wrapper--${msg.role === 'user' ? 'user' : 'assistant'}`}>
                <div className={`message-bubble ${msg.role === 'assistant' ? 'assistant-bubble' : 'user-bubble'}`}>
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
                <ReactMarkdown># What's on the agenda today?</ReactMarkdown>
            </div>
          )}
          
          {isLoading && (
            <div className="loading-state-wrap" style={{ width: '100%', maxWidth: '800px', margin: '20px auto', padding: '0 24px' }}>
              <p className="loading-label" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                <ReactMarkdown>*Recalling First Message...*</ReactMarkdown>
              </p>
              <div className="animate-loading-bar" style={{ width: '100%', height: '2px', background: 'rgba(255,255,255,0.05)', overflow: 'hidden', borderRadius: '2px' }}>
                <div className="loading-progress" style={{ height: '100%', background: 'white', width: '30%', animation: 'loading-bar 2s infinite ease-in-out' }}></div>
              </div>
            </div>
          )}
        </main>

        <div className="gpt-input-section">
          <div className="gpt-input-container">
            <div className="input-pill">
              <button className="btn-action">
                <span className="material-symbols-outlined">add</span>
              </button>
              <textarea 
                className="chat-textarea gpt-scrollbar" 
                placeholder="Ask anything" 
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button className="btn-action">
                  <span className="material-symbols-outlined">mic</span>
                </button>
                 <button className="btn-action">
                  <span className="material-symbols-outlined">headphones</span>
                </button>
               {draft.trim() && (
                 <button onClick={onSubmit} disabled={isLoading} className="btn-send">
                    <span className="material-symbols-outlined" style={{ fontWeight: 600, fontSize: '20px' }}>arrow_upward</span>
                  </button>
               )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
