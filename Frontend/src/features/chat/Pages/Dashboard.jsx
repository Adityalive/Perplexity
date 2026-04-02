import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useChat } from "../hook/useChat";
import { setCurrentChatId } from "../chat.slice";
import "./Dashboard.css";

function formatTimestamp(value) {
  if (!value) {
    return "Just now";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const { initializeSocketConnection, handleGetChats, handleOpenChat, handleSendMessage } =
    useChat();
  const { chats, currentChatId, isLoading, error } = useSelector(
    (state) => state.chat
  );
  const [draft, setDraft] = useState("");
  const [hasBootstrapped, setHasBootstrapped] = useState(false);

  const chatList = useMemo(
    () =>
      Object.values(chats).sort((first, second) => {
        return new Date(second.lastUpdated) - new Date(first.lastUpdated);
      }),
    [chats]
  );

  const activeChat = currentChatId ? chats[currentChatId] : null;
  const activeMessages = activeChat?.messages ?? [];

  useEffect(() => {
    initializeSocketConnection();
  }, [initializeSocketConnection]);

  useEffect(() => {
    let isMounted = true;

    async function bootstrapDashboard() {
      try {
        const data = await handleGetChats();
        if (!isMounted) {
          return;
        }

        const firstChatId = data?.chats?.[0]?._id;
        if (firstChatId) {
          await handleOpenChat(firstChatId, chats);
        }
      } catch (bootstrapError) {
        console.error("Unable to bootstrap chats:", bootstrapError);
      } finally {
        if (isMounted) {
          setHasBootstrapped(true);
        }
      }
    }

    bootstrapDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  async function openChat(chatId) {
    try {
      await handleOpenChat(chatId, chats);
    } catch (openError) {
      console.error("Unable to open chat:", openError);
    }
  }

  async function onSubmit(event) {
    event.preventDefault();
    const message = draft.trim();

    if (!message) {
      return;
    }

    try {
      const response = await handleSendMessage({
        message,
        chatId: currentChatId,
      });

      if (!currentChatId && response?.chat?._id) {
        await handleOpenChat(response.chat._id, {
          ...chats,
          [response.chat._id]: chats[response.chat._id] ?? {
            id: response.chat._id,
            title: response.chat.title,
            messages: [],
            lastUpdated: new Date().toISOString(),
          },
        });
      }

      setDraft("");
    } catch (sendError) {
      console.error("Unable to send message:", sendError);
    }
  }

  function startNewConversation() {
    dispatch(setCurrentChatId(null));
    setDraft("");
  }

  return (
    <main className="chat-dashboard">
      <section className="chat-dashboard__shell">
        <aside className="chat-dashboard__sidebar">
          <div className="chat-dashboard__sidebar-header">
            <p className="chat-dashboard__eyebrow">Workspace</p>
            <h1>Chats</h1>
            <span>{chatList.length} saved</span>
          </div>

          <button
            type="button"
            className="chat-dashboard__new-chat"
            onClick={startNewConversation}
          >
            New conversation
          </button>

          <div className="chat-dashboard__chat-list">
            {chatList.length > 0 ? (
              chatList.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  className={`chat-dashboard__chat-card${
                    chat.id === currentChatId ? " is-active" : ""
                  }`}
                  onClick={() => openChat(chat.id)}
                >
                  <strong>{chat.title}</strong>
                  <span>{formatTimestamp(chat.lastUpdated)}</span>
                </button>
              ))
            ) : (
              <div className="chat-dashboard__empty-sidebar">
                <p>No chats yet.</p>
                <span>Send your first question to start one.</span>
              </div>
            )}
          </div>
        </aside>

        <section className="chat-dashboard__content">
          <header className="chat-dashboard__content-header">
            <div>
              <p className="chat-dashboard__eyebrow">Current chat</p>
              <h2>{activeChat?.title || "Start a new conversation"}</h2>
            </div>
            {isLoading ? <span className="chat-dashboard__status">Thinking...</span> : null}
          </header>

          <div className="chat-dashboard__messages">
            {activeMessages.length > 0 ? (
              activeMessages.map((message, index) => (
                <article
                  key={`${message.role}-${index}`}
                  className={`chat-dashboard__message chat-dashboard__message--${message.role}`}
                >
                  <span className="chat-dashboard__message-role">
                    {message.role === "user" ? "You" : "Perplexity"}
                  </span>
                  <p>{message.content}</p>
                </article>
              ))
            ) : (
              <div className="chat-dashboard__empty-state">
                <p>{hasBootstrapped ? "Ask anything to begin." : "Loading your workspace..."}</p>
                <span>
                  Your conversaftion will appear here with a clean split between your messages and
                  the AI replies.
                </span>
              </div>
            )}
          </div>

          <form className="chat-dashboard__composer" onSubmit={onSubmit}>
            <label className="chat-dashboard__composer-label" htmlFor="chat-input">
              Message
            </label>
            <textarea
              id="chat-input"
              className="chat-dashboard__composer-input"
              placeholder="Input your question"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
            />
            <div className="chat-dashboard__composer-footer">
              <p>{error || "Press Enter with Shift for a new line. Use Send when you're ready."}</p>
              <button type="submit" disabled={!draft.trim() || isLoading}>
                Send
              </button>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
