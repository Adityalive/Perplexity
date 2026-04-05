import {
  searchMusic,
  likeSong,
  dislikeSong,
  savePreferences,
  getUserStatus,
  connectAccount,
  syncLibrary,
  generatePlaylists,
  getCachedPlaylists,
  getSyncedLibrary,
} from "../services/music.service.js";

export async function connectHandler(req, res) {
  try {
    const { cookie } = req.body;
    if (!cookie) return res.status(400).json({ message: "Cookie is required" });
    const result = await connectAccount(req.user.id, cookie);
    res.status(200).json({ message: "YT Music connected", ...result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function syncHandler(req, res) {
  try {
    const result = await syncLibrary(req.user.id);
    res.status(200).json({ message: "Library synced", ...result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function playlistsHandler(req, res) {
  try {
    const playlists = await generatePlaylists(req.user.id);
    res.status(200).json({ message: "Playlists generated", playlists });
  } catch (error) {
    console.error("Playlist error:", error);
    res.status(500).json({ message: error.message });
  }
}

export async function cachedPlaylistsHandler(req, res) {
  try {
    const playlists = await getCachedPlaylists(req.user.id);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).json({ playlists });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function libraryHandler(req, res) {
  try {
    const library = await getSyncedLibrary(req.user.id);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.status(200).json(library);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function onboardHandler(req, res) {
  try {
    const { genres, artists } = req.body;
    const result = await savePreferences(req.user.id, { genres, artists });
    res.status(200).json({ message: "Preferences saved", ...result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function statusHandler(req, res) {
  try {
    const status = await getUserStatus(req.user.id);
    res.status(200).json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function searchMusicHandler(req, res) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query is required" });
    const songs = await searchMusic(q);
    res.status(200).json({ message: "Search results", songs });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function likeSongHandler(req, res) {
  try {
    const { title, artist, videoId, thumbnail } = req.body;
    if (!videoId) return res.status(400).json({ message: "videoId is required" });
    await likeSong(req.user.id, { title, artist, videoId, thumbnail });
    res.status(200).json({ message: "Song liked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

export async function dislikeSongHandler(req, res) {
  try {
    const { title, artist, videoId } = req.body;
    if (!videoId) return res.status(400).json({ message: "videoId is required" });
    await dislikeSong(req.user.id, { title, artist, videoId });
    res.status(200).json({ message: "Song disliked" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
