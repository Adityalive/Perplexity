<div align="center">
  <img src="https://assets-global.website-files.com/62c9035e59bbf2336ec8e1c7/62cb34a7ad04d73ec5428a2a_Perplexity.jpg" alt="Holos AI Logo" width="120" style="border-radius: 20px;"/>
  <h1>🌌 Holos (Perplexity Clone)</h1>
  <p><strong>A Next-Generation AI Search & Answer Engine built with MERN, LangChain, and Together AI.</strong></p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#installation">Installation</a> •
    <a href="#environment-variables">Env Variables</a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Status-Active-success.svg" alt="Status">
    <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License">
    <img src="https://img.shields.io/badge/React-19.2.4-61DAFB.svg?logo=react" alt="React">
    <img src="https://img.shields.io/badge/Node.js-Express-339933.svg?logo=nodedotjs" alt="Node.js">
  </p>
</div>

---

## ⚡ Overview

**Holos** is an advanced AI-powered search application inspired by Perplexity AI. It combines the power of large language models (LLMs) with real-time web search capabilities to deliver accurate, conversational, and context-aware answers to user queries, complete with source citations, math rendering, and multi-model fallbacks.

---

## ✨ Key Features

- 🧠 **Conversational AI search** with intelligent context retention.
- 🌐 **Real-time Web Search Integration** powered by Tavily and LangChain.
- 📝 **Beautiful Markdown & Math Rendering** using KaTeX and React-Markdown.
- fallback mechanisms routing between Together AI, Google Gemini, and OpenAI.
- 🔐 **Robust Authentication** handled seamlessly by Clerk.
- 🔌 **Real-time Updates** via Socket.io for dynamic chat streaming.
- 🎵 **Media support** including YouTube integration and custom image generation capabilities.

---

## 💻 Tech Stack

### Frontend (Client)
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4
- **State Management:** Redux Toolkit
- **Auth:** Clerk React
- **Markdown & Math:** `react-markdown`, `katex`, `rehype-katex`, `remark-math`
- **Real-time:** `socket.io-client`

### Backend (Server)
- **Runtime Environment:** Node.js + Express.js
- **Database:** MongoDB (using Mongoose)
- **AI & Orchestration:** LangChain (`@langchain/core`, `@tavily/core`)
- **LLM Providers:** Together AI, Google GenAI, OpenAI, MistralAI
- **Authentication:** Clerk Express Middleware
- **Real-time:** Socket.io Server

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally or a MongoDB Atlas URI
- API Keys for Clerk, Together AI, Tavily, etc.

### 1. Clone the repository

```bash
git clone https://github.com/your-username/holos.git
cd holos
```

### 2. Setup the Backend

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory (see Environment Variables section below), then run:

```bash
npm run dev
```
*(The server will start using nodemon)*

### 3. Setup the Frontend

Open a new terminal window:

```bash
cd Frontend
npm install
```

Create a `.env` file in the `Frontend` directory, then start the Vite development server:

```bash
npm run dev
```

---

## 🔑 Environment Variables

To properly run Holos, you need to configure the `.env` files in both the `Backend` and `Frontend` directories.

### Backend (`Backend/.env`)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# AI Providers
TOGETHER_API_KEY=your_together_ai_api_key
TAVILY_API_KEY=your_tavily_api_key
OPENAI_API_KEY=your_openai_api_key
GOOGLE_API_KEY=your_google_gemini_api_key
```

### Frontend (`Frontend/.env` or `.env.local`)
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

---

## 📂 Project Structure

```text
Holos/
├── Backend/               # Express server, MongoDB models, LangChain logic
│   ├── src/
│   │   ├── middleware/    # Auth and error handlers
│   │   ├── models/        # Mongoose schemas
│   │   ├── sockets/       # Socket.io event controllers
│   │   └── app.js         # Express app configuration
│   └── server.js          # Entry point
│
└── Frontend/              # React/Vite application
    ├── src/
    │   ├── components/    # Reusable UI elements (Chat, Markdown renderers)
    │   ├── store/         # Redux slices
    │   └── main.jsx       # React DOM implementation
    ├── index.html
    └── tailwind.config.js
```

---

## 🛡️ License

This project is licensed under the MIT License. Feel free to use, modify, and distribute it as you see fit.

<div align="center">
  <p>Built with ❤️ for the future of AI search.</p>
</div>
