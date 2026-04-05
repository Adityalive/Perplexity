import YTMusic from "ytmusic-api";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage } from "langchain";
import MusicTaste from "../models/musicTaste.model.js";

const ytmusic = new YTMusic();
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    await ytmusic.initialize();
    initialized = true;
  }
}

const mistralModel = new ChatMistralAI({
  model: "mistral-medium-latest",
  apiKey: process.env.MISTRAL_API_KEY,
});

/**
 * Search YouTube Music for songs
 */
export async function searchMusic(query) {
  await ensureInitialized();
  const results = await ytmusic.searchSongs(query);
  return results.slice(0, 10).map((song) => ({
    title: song.name,
    artist: song.artist?.name || "Unknown Artist",
    videoId: song.videoId,
    duration: song.duration,
    thumbnail:
      song.thumbnails?.[song.thumbnails.length - 1]?.url ||
      `https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg`,
  }));
}

/**
 * AI-powered recommendations based on user taste
 */
export async function getRecommendations(userId) {
  await ensureInitialized();

  // Get user's taste profile
  let taste = await MusicTaste.findOne({ user: userId });

  // If no taste data, return trending/popular music
  if (!taste || taste.likedSongs.length === 0) {
    const defaultQueries = [
      "trending songs 2025",
      "popular hits",
      "top music today",
    ];
    const randomQuery =
      defaultQueries[Math.floor(Math.random() * defaultQueries.length)];
    return await searchMusic(randomQuery);
  }

  // Build a taste summary from liked songs
  const likedSummary = taste.likedSongs
    .slice(-15)
    .map((s) => `${s.title} by ${s.artist}`)
    .join(", ");

  const dislikedSummary = taste.dislikedSongs
    .slice(-10)
    .map((s) => `${s.title} by ${s.artist}`)
    .join(", ");

  // Ask AI to generate search queries based on taste
  const aiResponse = await mistralModel.invoke([
    new SystemMessage(`You are a music recommendation expert. Based on the user's liked and disliked songs, generate exactly 3 diverse YouTube Music search queries that would find songs they'd love.
Return ONLY a JSON array of 3 search query strings. No explanation, no markdown.
Example: ["indie rock 2024 chill vibes", "electronic ambient study music", "alt rock guitar driven songs"]`),
    new HumanMessage(
      `Liked songs: ${likedSummary}\n${dislikedSummary ? `Disliked songs: ${dislikedSummary}` : ""}\n\nGenerate 3 search queries as a JSON array.`
    ),
  ]);

  let queries = [];
  try {
    const raw = aiResponse.text?.trim();
    const match = raw.match(/\[[\s\S]*?\]/);
    if (match) queries = JSON.parse(match[0]);
  } catch (e) {
    queries = ["popular music 2025"];
  }

  if (queries.length === 0) queries = ["popular music 2025"];

  // Search for each query and combine results
  const allResults = [];
  const seenIds = new Set(taste.dislikedSongs.map((s) => s.videoId));
  // Also exclude already liked songs to show fresh content
  taste.likedSongs.forEach((s) => seenIds.add(s.videoId));

  for (const query of queries.slice(0, 3)) {
    try {
      const results = await searchMusic(query);
      for (const song of results) {
        if (!seenIds.has(song.videoId)) {
          seenIds.add(song.videoId);
          allResults.push(song);
        }
      }
    } catch (e) {
      console.warn("Search failed for query:", query, e.message);
    }
  }

  return allResults.slice(0, 12);
}

/**
 * Like a song — add to taste profile
 */
export async function likeSong(userId, song) {
  let taste = await MusicTaste.findOne({ user: userId });
  if (!taste) {
    taste = await MusicTaste.create({ user: userId, likedSongs: [], dislikedSongs: [] });
  }

  // Avoid duplicates
  const alreadyLiked = taste.likedSongs.some((s) => s.videoId === song.videoId);
  if (!alreadyLiked) {
    taste.likedSongs.push({
      title: song.title,
      artist: song.artist,
      videoId: song.videoId,
      thumbnail: song.thumbnail,
    });

    // Remove from disliked if it was there
    taste.dislikedSongs = taste.dislikedSongs.filter(
      (s) => s.videoId !== song.videoId
    );

    await taste.save();
  }
  return taste;
}

/**
 * Dislike a song — add to dislike list
 */
export async function dislikeSong(userId, song) {
  let taste = await MusicTaste.findOne({ user: userId });
  if (!taste) {
    taste = await MusicTaste.create({ user: userId, likedSongs: [], dislikedSongs: [] });
  }

  const alreadyDisliked = taste.dislikedSongs.some(
    (s) => s.videoId === song.videoId
  );
  if (!alreadyDisliked) {
    taste.dislikedSongs.push({
      title: song.title,
      artist: song.artist,
      videoId: song.videoId,
    });

    // Remove from liked if it was there
    taste.likedSongs = taste.likedSongs.filter(
      (s) => s.videoId !== song.videoId
    );

    await taste.save();
  }
  return taste;
}
