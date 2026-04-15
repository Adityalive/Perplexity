<div align="center">

# 🌌 HOLOS

### *The AI Platform That Thinks, Searches, Researches, Plays Music — and Sees.*

<br/>

[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io)
[![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://langchain.com)
[![Tailwind](https://img.shields.io/badge/Tailwind_v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

<br/>

**Holos isn't just a chatbot. It's a full AI operating system for your curiosity.**

Ask it anything → it searches the live web, cites its sources, renders math beautifully,<br/>
generates images, writes deep research papers, and even builds personalized music playlists<br/>
by syncing with your YouTube Music account.

<br/>

[Features](#-what-holos-can-do) · [Architecture](#-architecture) · [Setup](#-getting-started) · [Tech Stack](#-tech-stack) · [API Routes](#-api-routes)

</div>

---

## 🧠 The Problem

Most AI chat apps are **wrappers around a single LLM call.** They can't search the web, they hallucinate facts, they can't show you *where* the information came from, and they definitely can't play you music.

**Holos fixes all of that.**

---

## 🚀 What Holos Can Do

### 💬 AI Chat with Live Web Search
> *"What happened in the stock market today?"*

Holos doesn't guess — it **searches the internet in real-time** using Tavily, then synthesizes the results into a clean, cited answer. Every response includes clickable source cards with favicons.

- 🔍 **Agentic search** — the AI decides *when* to search and crafts its own queries
- 📎 **Source citations** — every claim links back to the original page
- 💡 **Follow-up questions** — AI auto-generates 3 relevant follow-ups to keep you exploring
- 🧮 **Math rendering** — LaTeX equations render beautifully with KaTeX

### 📸 Image Understanding (Vision AI)
> *Upload a photo of a math problem → get the solution*

Powered by **Groq's Llama 4 Scout** (with multi-provider fallback), Holos can analyze images, solve visual problems, and describe what it sees.

### 🖼️ Image Generation
> *"Generate a cyberpunk cityscape at sunset"*

Type a prompt, get an AI-generated image via **Pollinations AI** — with customizable resolution, model, and seed controls.

### 📚 Deep Research Mode
> *"Research quantum computing"*

This isn't a Google search. Holos runs a **3-phase research pipeline:**

| Phase | What happens |
|-------|-------------|
| **1. Query Expansion** | AI generates 7 targeted sub-queries covering: definition, history, current state, key players, applications, limitations, and data |
| **2. Parallel Search** | All 7 queries hit Tavily simultaneously with `advanced` search depth |
| **3. Synthesis** | Mistral AI synthesizes everything into a structured research paper with Abstract, Background, Applications, Challenges, and Key Findings |

The result? A full, source-backed research document — generated in under 30 seconds.

### 🎵 AI Music Engine (YouTube Music Integration)
> *Your personal DJ that actually knows your taste*

This is arguably the most unique feature. Holos connects to your **YouTube Music account** and:

1. **Syncs your library** — pulls your listening history, playlists, and liked songs via YT Music's internal API
2. **Analyzes your taste** — feeds your music data to Gemini AI
3. **Generates 3 personalized playlists:**
   - 🎧 **Daily Mix** — comfort zone music matching your exact taste
   - 🔁 **On Repeat** — songs similar to your most-played tracks
   - ✨ **Discover New** — surprising finds outside your usual genres
4. **Like/dislike feedback loop** — your reactions refine future recommendations

Every song is playable directly in the app via embedded YouTube player.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React 19 + Vite)           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐  ┌─────────┐  │
│  │ Dashboard │  │ Research │  │  Music  │  │ Landing │  │
│  │  (Chat)   │  │   Page   │  │  Page   │  │  Page   │  │
│  └─────┬─────┘  └────┬─────┘  └────┬────┘  └─────────┘  │
│        │              │             │                    │
│  ┌─────┴──────────────┴─────────────┴──────┐             │
│  │     Redux Toolkit (State Management)     │            │
│  │     Socket.io Client (Real-time)         │            │
│  │     Clerk React (Auth)                   │            │
│  └──────────────────┬──────────────────────┘             │
└─────────────────────┼───────────────────────────────────┘
                      │ HTTP + WebSocket
┌─────────────────────┼───────────────────────────────────┐
│                 BACKEND (Express 5 + Node.js)            │
│                      │                                   │
│  ┌───────────────────┴────────────────────────┐          │
│  │            API Routes Layer                 │         │
│  │  /api/chats  /api/research  /api/music      │         │
│  │  /api/users  /api/images                    │         │
│  └───────┬──────────┬──────────┬──────────────┘          │
│          │          │          │                          │
│  ┌───────┴───┐ ┌────┴────┐ ┌──┴──────────┐              │
│  │ AI Agent  │ │ Deep    │ │ Music       │              │
│  │ (LangChain│ │Research │ │ Engine      │              │
│  │  + Tools) │ │ Pipeline│ │ (YT Music   │              │
│  └───────┬───┘ └────┬────┘ │  + Gemini)  │              │
│          │          │      └──────┬──────┘              │
│  ┌───────┴──────────┴─────────────┴──────┐              │
│  │          External Services             │              │
│  │  Tavily · Mistral · Gemini · Groq     │              │
│  │  Pollinations · ImageKit · YT Music   │              │
│  └────────────────────┬──────────────────┘              │
│                       │                                  │
│  ┌────────────────────┴──────────────────┐              │
│  │          MongoDB (Mongoose)            │              │
│  │  Users · Chats · Messages · MusicTaste│              │
│  └───────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| **React 19** | UI framework with latest concurrent features |
| **Vite 8** | Lightning-fast dev server and build tool |
| **Tailwind CSS v4** | Utility-first styling |
| **Redux Toolkit** | Global state management (auth, chat, music) |
| **React Router v7** | Client-side routing with protected routes |
| **Socket.io Client** | Real-time chat streaming |
| **Clerk React** | Drop-in authentication (OAuth, email, SSO) |
| **KaTeX + remark-math** | Beautiful mathematical equation rendering |
| **React Markdown** | Rich markdown rendering for AI responses |
| **React YouTube** | In-app music playback |

### Backend
| Technology | Purpose |
|-----------|---------|
| **Express 5** | Fast, minimal HTTP server |
| **MongoDB + Mongoose** | Document database for chats, users, music taste |
| **LangChain** | AI agent orchestration with tool-calling |
| **Mistral AI** | Primary LLM for chat, research synthesis, and title generation |
| **Gemini 1.5 Flash** | Music taste analysis and playlist generation |
| **Groq (Llama 4 Scout)** | Vision model for image understanding |
| **Tavily** | Real-time web search API (used by both chat agent and research pipeline) |
| **Pollinations AI** | Free image generation API |
| **ImageKit** | Image upload and CDN delivery |
| **Socket.io** | WebSocket server for real-time streaming |
| **Clerk Express** | Server-side auth middleware with JWT verification |
| **Zod** | Runtime schema validation |

---

## ⚡ Getting Started

### Prerequisites
- **Node.js** v18+
- **MongoDB** (local or Atlas)
- API keys for: Clerk, Tavily, Mistral, Gemini, Groq

### 1. Clone

```bash
git clone https://github.com/your-username/holos.git
cd holos
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create `Backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/holos

# Auth (Clerk)
CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# AI Providers
MISTRAL_API_KEY=your_mistral_key
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=tvly-...

# Optional
OPENAI_API_KEY=sk-...
YOUTUBE_API_KEY=your_youtube_key
CLIENT_ORIGIN=http://localhost:5173
```

```bash
npm run dev
```

### 3. Frontend Setup

```bash
cd Frontend
npm install
```

Create `Frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=pk_...
```

```bash
npm run dev
```

### 4. Open

Navigate to **http://localhost:5173** 🚀

---

## 📡 API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/users/register` | Register a new user |
| `POST` | `/api/users/login` | Authenticate user |
| `GET` | `/api/chats` | Get all chats for current user |
| `POST` | `/api/chats` | Create a new chat |
| `POST` | `/api/chats/:id/message` | Send a message (triggers AI response) |
| `POST` | `/api/research` | Run deep research on a topic |
| `POST` | `/api/music/connect` | Connect YouTube Music account |
| `POST` | `/api/music/sync` | Sync music library |
| `POST` | `/api/music/playlists/generate` | Generate AI playlists |
| `GET` | `/api/music/playlists` | Get cached playlists |
| `POST` | `/api/images/generate-image` | Generate an image from prompt |

---

## 📂 Project Structure

```
holos/
├── Backend/
│   ├── server.js                    # HTTP + Socket.io entry
│   └── src/
│       ├── app.js                   # Express config, middleware, routes
│       ├── config/
│       │   └── database.js          # MongoDB connection
│       ├── controller/              # Request handlers
│       ├── middleware/
│       │   └── auth.middleware.js    # Clerk JWT verification
│       ├── models/
│       │   ├── user.model.js        # User schema
│       │   ├── chat.model.js        # Chat sessions
│       │   ├── message.model.js     # Messages with sources & follow-ups
│       │   └── musicTaste.model.js  # Music preferences & playlists
│       ├── routes/                  # API route definitions
│       ├── services/
│       │   ├── ai.servies.js        # LangChain agent + tool calling
│       │   ├── internet.service.js  # Tavily web search integration
│       │   ├── researcher.service.js # 3-phase deep research pipeline
│       │   ├── music.service.js     # YT Music sync + AI playlists
│       │   ├── image.process.js     # Vision AI (Groq/Llama)
│       │   └── image.genrate.js     # Image generation (Pollinations)
│       ├── sockets/                 # Real-time event handlers
│       └── validate/                # Request validation schemas
│
└── Frontend/
    ├── index.html
    ├── vite.config.js
    └── src/
        ├── main.jsx                 # React entry point
        ├── app/
        │   ├── App.jsx              # Root component
        │   ├── app.routes.jsx       # Protected routing
        │   └── store.js             # Redux store config
        ├── components/
        │   └── HolosLogo.jsx        # Animated brand logo
        └── features/
            ├── auth/                # Login, Register, Protected route
            ├── chat/                # Dashboard, chat logic, socket hooks
            ├── landing/             # Landing page
            ├── music/               # Music player, playlists, sync
            └── research/            # Deep research interface
```

---

## 🧩 How the AI Agent Works

Holos uses **LangChain's `createAgent`** with a custom tool for internet search:

```
User message
     ↓
┌─────────────────┐
│  Mistral Agent   │ ← System prompt: "Search the internet when needed"
│  (LangChain)     │
└────────┬─────────┘
         │
    Does the query need live data?
         │
    ┌────┴────┐
   YES        NO
    │          │
    ↓          ↓
┌────────┐  ┌──────────┐
│ Tavily │  │ Direct   │
│ Search │  │ LLM      │
│ Tool   │  │ Response │
└───┬────┘  └──────────┘
    │
    ↓
Agent reads search results
    ↓
Synthesized answer + source citations + 3 follow-up questions
```

---

## 🎵 Music Engine Flow

```
Connect YT Music cookie
        ↓
Sync: Home Feed → Playlists → Library
        ↓
Store 50 songs per category in MongoDB
        ↓
Feed to Gemini → "Generate search queries for 3 playlists"
        ↓
Search YT Music for each query → Deduplicate → Save
        ↓
🎧 Daily Mix  |  🔁 On Repeat  |  ✨ Discover New
```

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — use it, fork it, build on it.

---

<div align="center">

**Built by a human who believes AI should do more than just chat.**

⭐ Star this repo if Holos impressed you.

</div>
