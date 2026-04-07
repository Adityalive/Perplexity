import YTMusic from "ytmusic-api";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import MusicTaste from "../models/musicTaste.model.js";

// ── ytmusic-api (search, no auth needed) ──
const ytmusic = new YTMusic();
let ytmusicReady = false;
async function ensureYtmusic() {
  if (!ytmusicReady) {
    await ytmusic.initialize();
    ytmusicReady = true;
  }
}

const gemini = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  maxRetries: 3,
});

// Helper: retry AI calls on 429 with exponential backoff
async function geminiInvokeWithRetry(messages, attempt = 0) {
  try {
    return await gemini.invoke(messages);
  } catch (e) {
    if (e.status === 429 && attempt < 4) {
      const wait = (attempt + 1) * 8000; // 8s, 16s, 24s, 32s
      console.log(`[Gemini] Rate limited. Retrying in ${wait / 1000}s... (attempt ${attempt + 1})`);
      await new Promise((r) => setTimeout(r, wait));
      return geminiInvokeWithRetry(messages, attempt + 1);
    }
    throw e;
  }
}

// ═══════════════════════════════════════════════
//  Direct YT Music Internal API calls (cookie-based)
// ═══════════════════════════════════════════════
const YTM_BASE = "https://music.youtube.com/youtubei/v1";
const YTM_CLIENT = {
  clientName: "WEB_REMIX",
  clientVersion: "1.20241025.01.00",
  hl: "en",
  gl: "IN",
};

async function ytmApiCall(endpoint, body, cookie) {
  // Use environment variable for the API key to prevent secret detection scanners from flagging it.
  // Note: The YT Music web client uses a specific public key pattern. Set YOUTUBE_API_KEY in your .env file.
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("[YTM] Warning: YOUTUBE_API_KEY is not set in environment variables.");
  }
  const url = `${YTM_BASE}/${endpoint}?alt=json&key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "x-origin": "https://music.youtube.com",
      Cookie: cookie,
    },
    body: JSON.stringify({
      context: { client: YTM_CLIENT },
      ...body,
    }),
  });
  if (!res.ok) throw new Error(`YTM API ${endpoint} failed: ${res.status}`);
  return res.json();
}

// ═══════════════════════════════════════════════
//  PARSER LOGIC
// ═══════════════════════════════════════════════

// Deep recursive walker — finds song renderers anywhere in the response tree
function deepFindSongs(obj, depth = 0, found = [], rendererKeys = new Set()) {
  if (!obj || typeof obj !== "object" || depth > 20) return found;

  // Collect any *Renderer keys we encounter for debugging
  for (const key of Object.keys(obj)) {
    if (key.endsWith("Renderer")) rendererKeys.add(key);
  }

  // Check if this node contains a song renderer
  const SONG_RENDERERS = [
    "musicResponsiveListItemRenderer",
    "musicTwoRowItemRenderer",
    "playlistPanelVideoRenderer",
    "musicMultiRowListItemRenderer",
  ];
  for (const rKey of SONG_RENDERERS) {
    if (obj[rKey]) {
      const song = extractSongFromRenderer(obj[rKey]);
      if (song) found.push(song);
      return found; // Don't recurse into a matched renderer
    }
  }

  // Recurse into all array/object children
  for (const val of Object.values(obj)) {
    if (Array.isArray(val)) {
      for (const item of val) deepFindSongs(item, depth + 1, found, rendererKeys);
    } else if (val && typeof val === "object") {
      deepFindSongs(val, depth + 1, found, rendererKeys);
    }
  }
  return found;
}

function extractSongFromRenderer(r) {
  // videoId from navigation or overlay
  const videoId =
    r?.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
      ?.playNavigationEndpoint?.watchEndpoint?.videoId ||
    r?.navigationEndpoint?.watchEndpoint?.videoId ||
    r?.endpoint?.watchEndpoint?.videoId ||
    r?.videoId ||
    null;

  // Title
  const title =
    r?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text ||
    r?.title?.runs?.[0]?.text ||
    r?.headline?.runs?.[0]?.text ||
    "";

  // Artist
  const artist =
    r?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text ||
    r?.subtitle?.runs?.[0]?.text ||
    r?.longBylineText?.runs?.[0]?.text ||
    r?.shortBylineText?.runs?.[0]?.text ||
    "";

  // Thumbnail
  const thumbs =
    r?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
    r?.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails ||
    r?.thumbnail?.thumbnails ||
    [];
  const thumbnail =
    thumbs[thumbs.length - 1]?.url ||
    (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : "");

  if (!videoId || !title) return null;
  return { title, artist, videoId, thumbnail };
}

function parseMusicItems(data) {
  const rendererKeys = new Set();
  const items = deepFindSongs(data, 0, [], rendererKeys);
  console.log("[YTM Parser] All renderer types found:", [...rendererKeys].join(", ") || "NONE");

  // Deduplicate by videoId
  const seen = new Set();
  return items.filter((s) => {
    if (seen.has(s.videoId)) return false;
    seen.add(s.videoId);
    return true;
  });
}

// ═══════════════════════════════════════════════
//  CONNECT ACCOUNT
// ═══════════════════════════════════════════════
export async function connectAccount(userId, cookie) {
  let taste = await MusicTaste.findOne({ user: userId });
  if (!taste) taste = await MusicTaste.create({ user: userId });
  taste.ytCookie = cookie;
  taste.connected = true;
  await taste.save();
  return { connected: true };
}

// ═══════════════════════════════════════════════
//  SYNC LIBRARY — fetch REAL data from YT Music
// ═══════════════════════════════════════════════
export async function syncLibrary(userId) {
  const taste = await MusicTaste.findOne({ user: userId });
  if (!taste || !taste.ytCookie) throw new Error("YT Music not connected");

  const cookie = taste.ytCookie;
  const results = { history: 0, library: 0, liked: 0 };

  // 1) Fetch personalized home page (works even without YT Music history)
  try {
    const homeData = await ytmApiCall("browse", { browseId: "FEmusic_home" }, cookie);
    const homeSongs = parseMusicItems(homeData);
    console.log("[Home] found songs:", homeSongs.length);
    taste.syncedHistory = homeSongs.slice(0, 50);
    results.history = taste.syncedHistory.length;
  } catch (e) {
    console.warn("Home fetch failed:", e.message);
  }

  // 2) Fetch user's playlists, then get songs from the first one
  try {
    const plData = await ytmApiCall("browse", { browseId: "FEmusic_liked_playlists" }, cookie);
    // Find playlist IDs inside the response
    const playlistIds = [];
    const findPlaylists = (obj, depth = 0) => {
      if (!obj || typeof obj !== "object" || depth > 15) return;
      if (obj.browseId && obj.browseId.startsWith("VL")) {
        playlistIds.push(obj.browseId);
      }
      for (const val of Object.values(obj)) {
        if (typeof val === "object") findPlaylists(val, depth + 1);
      }
    };
    findPlaylists(plData);
    console.log("[Playlists] found playlist IDs:", playlistIds.slice(0, 5));

    const likedSongs = [];
    for (const plId of playlistIds.slice(0, 3)) {
      try {
        const plSongsData = await ytmApiCall("browse", { browseId: plId }, cookie);
        const songs = parseMusicItems(plSongsData);
        likedSongs.push(...songs);
      } catch (e) {
        console.warn(`Failed to fetch playlist ${plId}:`, e.message);
      }
    }
    console.log("[Playlists] found songs across playlists:", likedSongs.length);
    taste.syncedLiked = likedSongs.slice(0, 50);
    results.liked = taste.syncedLiked.length;
  } catch (e) {
    console.warn("Playlists fetch failed:", e.message);
  }

  // 3) Fetch library songs — try songs tab
  try {
    const libData = await ytmApiCall(
      "browse",
      { browseId: "FEmusic_library_landing", params: "ggMPOg1uX1ZuTUJrZW1PQTFB" },
      cookie
    );
    const libSongs = parseMusicItems(libData);
    console.log("[Lib] found songs:", libSongs.length);

    if (libSongs.length === 0) {
      // Fallback: try liked songs
      const likedData = await ytmApiCall("browse", { browseId: "FEmusic_liked_videos" }, cookie);
      const liked = parseMusicItems(likedData);
      console.log("[Lib-liked] found songs:", liked.length);
      taste.syncedLibrary = liked.slice(0, 50);
      results.library = liked.length;
    } else {
      taste.syncedLibrary = libSongs.slice(0, 50);
      results.library = libSongs.length;
    }
  } catch (e) {
    console.warn("Library fetch failed:", e.message);
  }

  taste.lastSyncedAt = new Date();
  await taste.save();

  const total = results.history + results.library + results.liked;
  console.log(`\n✅ Sync for user ${userId}: ${total} total. (Home:${results.history} Playlists:${results.liked} Lib:${results.library})\n`);
  return { synced: true, total, ...results };
}
// ═══════════════════════════════════════════════
//  GENERATE MULTIPLE AI PLAYLISTS
// ═══════════════════════════════════════════════
export async function generatePlaylists(userId) {
  await ensureYtmusic();
  const taste = await MusicTaste.findOne({ user: userId });

  // Gather ALL taste data
  const allSongs = [
    ...(taste?.syncedHistory || []),
    ...(taste?.syncedLibrary || []),
    ...(taste?.syncedLiked || []),
    ...(taste?.likedSongs || []),
  ];

  // Deduplicate
  const seen = new Set();
  const uniqueSongs = allSongs.filter((s) => {
    if (!s.videoId || seen.has(s.videoId)) return false;
    seen.add(s.videoId);
    return true;
  });

  // If no synced data, also add genre/artist preferences
  const genres = taste?.favoriteGenres?.length
    ? `Preferred genres: ${taste.favoriteGenres.join(", ")}`
    : "";

  const artists = taste?.favoriteArtists?.length
    ? `Preferred artists: ${taste.favoriteArtists.join(", ")}`
    : "";

  if (uniqueSongs.length === 0 && !genres && !artists) {
    throw new Error("No library data or preferences found. Connect YT Music or pick genres first.");
  }

  // Build a summary for AI
  const songList = uniqueSongs
    .slice(0, 40)
    .map((s) => `"${s.title}" by ${s.artist}`)
    .join("\n");

  const disliked = taste?.dislikedSongs?.length
    ? `\nDisliked songs (AVOID similar): ${taste.dislikedSongs.map((s) => s.title).join(", ")}`
    : "";

  // Ask AI to generate search queries for 3 different playlists
  const aiResponse = await geminiInvokeWithRetry([
    new SystemMessage(`You are a music recommendation expert. The user's music taste:

${songList ? `Songs they listen to:\n${songList}` : ""}
${genres}
${artists}
${disliked}

Generate search queries for 3 different playlists. Return ONLY valid JSON, no markdown or code fences:
{
  "daily_mix": {
    "description": "short 1-line description of this playlist vibe",
    "queries": ["specific search query 1", "specific search query 2", "specific search query 3"]
  },
  "on_repeat": {
    "description": "songs similar to their most played favorites",
    "queries": ["specific search query 1", "specific search query 2"]
  },
  "discover_new": {
    "description": "fresh, surprising discoveries outside their usual taste",
    "queries": ["specific search query 1", "specific search query 2", "specific search query 3"]
  }
}

RULES:
- For "daily_mix": match their exact taste — same artists, genres, moods. Comfort zone music.
- For "on_repeat": find songs VERY similar to their top tracks. Think album tracks, B-sides, collaborations.
- For "discover_new": go broader — adjacent genres, international artists, trending songs they'd surprisingly enjoy.
- Each query should be specific like "Arijit Singh romantic 2024" not generic like "popular music".`),
    new HumanMessage("Generate the 3 playlists as JSON."),
  ]);

  let playlistData;
  try {
    const raw = aiResponse.text?.trim();
    const match = raw.match(/\{[\s\S]*\}/);
    playlistData = JSON.parse(match[0]);
  } catch (e) {
    console.error("AI parse error:", e);
    // Fallback using known preferences
    const topArtists = uniqueSongs.reduce((acc, s) => {
      acc[s.artist] = (acc[s.artist] || 0) + 1;
      return acc;
    }, {});
    const top3 = Object.entries(topArtists).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a);
    playlistData = {
      daily_mix: { description: "Your daily vibes", queries: top3.map((a) => `${a} songs`) },
      on_repeat: { description: "Your favorites on loop", queries: top3.slice(0, 2).map((a) => `best of ${a}`) },
      discover_new: { description: "Try something new", queries: ["trending music 2025", "indie discoveries"] },
    };
  }

  // Search YouTube Music for each playlist
  const playlistNames = {
    daily_mix: "🎧 Daily Mix",
    on_repeat: "🔁 On Repeat",
    discover_new: "✨ Discover New",
  };

  const playlists = [];
  const usedIds = new Set();
  // Exclude songs user already has
  uniqueSongs.forEach((s) => usedIds.add(s.videoId));
  taste?.dislikedSongs?.forEach((s) => usedIds.add(s.videoId));

  for (const [key, data] of Object.entries(playlistData)) {
    const songs = [];
    for (const query of (data.queries || []).slice(0, 3)) {
      try {
        const results = await ytmusic.searchSongs(query);
        for (const song of results.slice(0, 6)) {
          const normalized = {
            title: song.name,
            artist: song.artist?.name || "Unknown",
            videoId: song.videoId,
            thumbnail:
              song.thumbnails?.[song.thumbnails.length - 1]?.url ||
              `https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`,
          };
          if (!usedIds.has(normalized.videoId)) {
            usedIds.add(normalized.videoId);
            songs.push(normalized);
          }
        }
      } catch (e) {
        console.warn(`Search failed for "${query}":`, e.message);
      }
    }

    playlists.push({
      name: playlistNames[key] || key,
      description: data.description || "",
      songs: songs.slice(0, 8),
      generatedAt: new Date(),
    });
  }

  // Save playlists to DB
  taste.playlists = playlists;
  await taste.save();

  return playlists;
}

// ═══════════════════════════════════════════════
//  GET STATUS
// ═══════════════════════════════════════════════
export async function getUserStatus(userId) {
  const taste = await MusicTaste.findOne({ user: userId });
  return {
    onboarded: taste?.onboarded || false,
    connected: taste?.connected || false,
    genres: taste?.favoriteGenres || [],
    artists: taste?.favoriteArtists || [],
    songsCount:
      (taste?.syncedHistory?.length || 0) +
      (taste?.syncedLibrary?.length || 0) +
      (taste?.syncedLiked?.length || 0),
    lastSyncedAt: taste?.lastSyncedAt || null,
    hasPlaylists: taste?.playlists?.length > 0,
  };
}

// ═══════════════════════════════════════════════
//  GET CACHED PLAYLISTS
// ═══════════════════════════════════════════════
export async function getCachedPlaylists(userId) {
  const taste = await MusicTaste.findOne({ user: userId });
  return taste?.playlists || [];
}

// ═══════════════════════════════════════════════
//  GET SYNCED LIBRARY (for display)
// ═══════════════════════════════════════════════
export async function getSyncedLibrary(userId) {
  const taste = await MusicTaste.findOne({ user: userId });
  return {
    history: taste?.syncedHistory || [],
    library: taste?.syncedLibrary || [],
    liked: taste?.syncedLiked || [],
  };
}

// ═══════════════════════════════════════════════
//  SEARCH (public, no auth)
// ═══════════════════════════════════════════════
export async function searchMusic(query) {
  await ensureYtmusic();
  const results = await ytmusic.searchSongs(query);
  return results.slice(0, 10).map((song) => ({
    title: song.name,
    artist: song.artist?.name || "Unknown Artist",
    videoId: song.videoId,
    thumbnail:
      song.thumbnails?.[song.thumbnails.length - 1]?.url ||
      `https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`,
  }));
}

// ═══════════════════════════════════════════════
//  SAVE PREFERENCES (manual onboarding)
// ═══════════════════════════════════════════════
export async function savePreferences(userId, { genres, artists }) {
  let taste = await MusicTaste.findOne({ user: userId });
  if (!taste) taste = await MusicTaste.create({ user: userId });
  taste.favoriteGenres = genres || [];
  taste.favoriteArtists = artists || [];
  taste.onboarded = true;
  await taste.save();
  return { onboarded: true };
}

// ═══════════════════════════════════════════════
//  LIKE / DISLIKE
// ═══════════════════════════════════════════════
export async function likeSong(userId, song) {
  let taste = await MusicTaste.findOne({ user: userId });
  if (!taste) taste = await MusicTaste.create({ user: userId });
  if (!taste.likedSongs.some((s) => s.videoId === song.videoId)) {
    taste.likedSongs.push(song);
    taste.dislikedSongs = taste.dislikedSongs.filter((s) => s.videoId !== song.videoId);
    await taste.save();
  }
}

export async function dislikeSong(userId, song) {
  let taste = await MusicTaste.findOne({ user: userId });
  if (!taste) taste = await MusicTaste.create({ user: userId });
  if (!taste.dislikedSongs.some((s) => s.videoId === song.videoId)) {
    taste.dislikedSongs.push(song);
    taste.likedSongs = taste.likedSongs.filter((s) => s.videoId !== song.videoId);
    await taste.save();
  }
}
