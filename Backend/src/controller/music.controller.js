import {
  searchMusic,
  getRecommendations,
  likeSong,
  dislikeSong,
} from "../services/music.service.js";

export async function getMusicRecommendations(req, res) {
  try {
    const songs = await getRecommendations(req.user.id);
    res.status(200).json({ message: "Recommendations fetched", songs });
  } catch (error) {
    console.error("Recommendation error:", error);
    res
      .status(500)
      .json({ message: error.message || "Failed to get recommendations" });
  }
}

export async function searchMusicHandler(req, res) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: "Query is required" });

    const songs = await searchMusic(q);
    res.status(200).json({ message: "Search results", songs });
  } catch (error) {
    console.error("Search error:", error);
    res
      .status(500)
      .json({ message: error.message || "Search failed" });
  }
}

export async function likeSongHandler(req, res) {
  try {
    const { title, artist, videoId, thumbnail } = req.body;
    if (!videoId) return res.status(400).json({ message: "videoId is required" });

    const taste = await likeSong(req.user.id, {
      title,
      artist,
      videoId,
      thumbnail,
    });
    res.status(200).json({ message: "Song liked", taste });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to like song" });
  }
}

export async function dislikeSongHandler(req, res) {
  try {
    const { title, artist, videoId } = req.body;
    if (!videoId) return res.status(400).json({ message: "videoId is required" });

    const taste = await dislikeSong(req.user.id, { title, artist, videoId });
    res.status(200).json({ message: "Song disliked", taste });
  } catch (error) {
    res
      .status(500)
      .json({ message: error.message || "Failed to dislike song" });
  }
}
