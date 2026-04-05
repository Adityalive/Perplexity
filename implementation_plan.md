# AI Music Recommendation Feature

Build an AI-powered music tab that learns the user's taste and recommends + plays YouTube Music tracks.

## User Review Required

> [!IMPORTANT]
> **YouTube Music Authentication**: You'll need to extract cookies from your browser while logged into `music.youtube.com`. I'll provide instructions after approval.

> [!WARNING]
> **Playback Limitation**: YouTube doesn't allow direct audio streaming via API. We'll embed the official YouTube IFrame Player which plays the full music video. This is how all third-party YT music apps work.

## Proposed Changes

### Backend — New Music Feature

#### [NEW] Backend/src/services/music.service.js
- Initialize `ytmusic-api` with search capabilities
- `searchMusic(query)` — search YouTube Music for songs
- `getRecommendations(userTasteProfile)` — use AI (Mistral) to analyze user's stored taste profile and generate search queries, then fetch matching songs

#### [NEW] Backend/src/models/musicTaste.model.js
- Schema: `{ user, likedSongs: [{ title, artist, genre, videoId }], dislikedSongs: [...], tasteEmbedding: [Number], updatedAt }`
- Stores the user's music preference history for AI-based recommendations

#### [NEW] Backend/src/controller/music.controller.js
- `GET /api/music/recommendations` — AI analyzes taste profile → generates queries → fetches songs via ytmusic-api
- `POST /api/music/like` — User likes a song → adds to taste profile
- `POST /api/music/dislike` — User dislikes → adds to dislike list
- `GET /api/music/search?q=...` — Direct search pass-through

#### [NEW] Backend/src/routes/music.route.js
- Wire up all the above endpoints with `authverify` middleware

---

### Frontend — Music Page

#### [MODIFY] Frontend/src/app/app.routes.jsx
- Add `/music` route pointing to new `MusicPage` component

#### [NEW] Frontend/src/features/music/Pages/MusicPage.jsx
- Full-page music player UI with:
  - AI-recommended tracks grid (album art, title, artist)
  - Search bar for manual search
  - Embedded YouTube player (bottom bar, like Spotify)
  - Like/Dislike buttons on each track card
  - "Refresh Recommendations" button

#### [NEW] Frontend/src/features/music/Pages/MusicPage.css
- Dark-themed music player styling matching the existing Perplexity aesthetic

#### [MODIFY] Frontend/src/features/chat/Pages/Dashboard.jsx
- Add a "Music" icon button to the sidebar navigation

---

### NPM Dependencies

| Package | Purpose |
|---|---|
| `ytmusic-api` (backend) | YouTube Music search & song data |
| `react-youtube` (frontend) | Embedded YouTube player component |

## Verification Plan

### Manual Verification
- Search for a song → verify results appear with correct metadata
- Click play → verify YouTube player embeds and plays the track
- Like a few songs → refresh recommendations → verify AI suggests similar music
- Test the `/music` sidebar navigation from the chat dashboard
