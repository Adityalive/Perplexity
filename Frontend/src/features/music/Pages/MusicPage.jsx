import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import {
  getRecommendations,
  searchMusic,
  likeSong,
  dislikeSong,
} from "../services/music.api.js";
import "./MusicPage.css";

export default function MusicPage() {
  const [songs, setSongs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());
  const [dislikedIds, setDislikedIds] = useState(new Set());
  const [queue, setQueue] = useState([]);
  const playerRef = useRef(null);

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
    return () => links.forEach((l) => document.head.removeChild(l));
  }, []);

  // Fetch AI recommendations on mount
  useEffect(() => {
    loadRecommendations();
  }, []);

  async function loadRecommendations() {
    setLoading(true);
    try {
      const data = await getRecommendations();
      setSongs(data.songs || []);
      setQueue(data.songs || []);
      // Auto-play first recommended song
      if (data.songs?.length > 0) {
        setCurrentSong(data.songs[0]);
        setIsPlaying(true);
      }
    } catch (e) {
      console.error("Failed to load recommendations:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const data = await searchMusic(searchQuery.trim());
      setSongs(data.songs || []);
    } catch (e) {
      console.error("Search failed:", e);
    } finally {
      setLoading(false);
    }
  }

  function playSong(song) {
    setCurrentSong(song);
    setIsPlaying(true);
  }

  function playNext() {
    if (!currentSong || queue.length === 0) return;
    const idx = queue.findIndex((s) => s.videoId === currentSong.videoId);
    const next = queue[(idx + 1) % queue.length];
    if (next) playSong(next);
  }

  function playPrev() {
    if (!currentSong || queue.length === 0) return;
    const idx = queue.findIndex((s) => s.videoId === currentSong.videoId);
    const prev = queue[(idx - 1 + queue.length) % queue.length];
    if (prev) playSong(prev);
  }

  async function handleLike(song) {
    try {
      await likeSong(song);
      setLikedIds((prev) => new Set(prev).add(song.videoId));
      setDislikedIds((prev) => {
        const n = new Set(prev);
        n.delete(song.videoId);
        return n;
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDislike(song) {
    try {
      await dislikeSong(song);
      setDislikedIds((prev) => new Set(prev).add(song.videoId));
      setLikedIds((prev) => {
        const n = new Set(prev);
        n.delete(song.videoId);
        return n;
      });
    } catch (e) {
      console.error(e);
    }
  }

  function togglePlayPause() {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
    setIsPlaying(!isPlaying);
  }

  function formatDuration(seconds) {
    if (!seconds) return "—";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  const playerOpts = {
    height: "0",
    width: "0",
    playerVars: {
      autoplay: 1,
      controls: 0,
    },
  };

  return (
    <div className="music-root">
      {/* Header */}
      <header className="music-header">
        <div className="music-header-left">
          <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
            music_note
          </span>
          <h1>Music</h1>
        </div>
        <form className="music-search-form" onSubmit={handleSearch}>
          <span className="material-symbols-outlined music-search-icon">
            search
          </span>
          <input
            className="music-search-input"
            placeholder="Search songs, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
        <button className="music-refresh-btn" onClick={loadRecommendations} title="Refresh AI Recommendations">
          <span className="material-symbols-outlined">auto_awesome</span>
          <span>AI Recommend</span>
        </button>
      </header>

      {/* Song Grid */}
      <main className="music-grid-area">
        {loading ? (
          <div className="music-loading">
            <div className="plx-loading-dot" style={{ animationDelay: "0ms" }} />
            <div className="plx-loading-dot" style={{ animationDelay: "150ms" }} />
            <div className="plx-loading-dot" style={{ animationDelay: "300ms" }} />
          </div>
        ) : songs.length === 0 ? (
          <div className="music-empty">No songs found. Try a different search or refresh recommendations.</div>
        ) : (
          <div className="music-grid">
            {songs.map((song) => (
              <div
                key={song.videoId}
                className={`music-card ${currentSong?.videoId === song.videoId ? "music-card--active" : ""}`}
                onClick={() => playSong(song)}
              >
                <div className="music-card-thumb-wrap">
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="music-card-thumb"
                  />
                  <div className="music-card-play-overlay">
                    <span className="material-symbols-outlined">
                      {currentSong?.videoId === song.videoId && isPlaying ? "pause" : "play_arrow"}
                    </span>
                  </div>
                </div>
                <div className="music-card-info">
                  <div className="music-card-title">{song.title}</div>
                  <div className="music-card-artist">{song.artist}</div>
                </div>
                <div className="music-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className={`music-action-btn ${likedIds.has(song.videoId) ? "music-action-btn--liked" : ""}`}
                    onClick={() => handleLike(song)}
                    title="Like"
                  >
                    <span className="material-symbols-outlined">thumb_up</span>
                  </button>
                  <button
                    className={`music-action-btn ${dislikedIds.has(song.videoId) ? "music-action-btn--disliked" : ""}`}
                    onClick={() => handleDislike(song)}
                    title="Dislike"
                  >
                    <span className="material-symbols-outlined">thumb_down</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Player Bar */}
      {currentSong && (
        <footer className="music-player-bar">
          <div className="music-player-info">
            <img
              src={currentSong.thumbnail}
              alt={currentSong.title}
              className="music-player-thumb"
            />
            <div className="music-player-text">
              <div className="music-player-title">{currentSong.title}</div>
              <div className="music-player-artist">{currentSong.artist}</div>
            </div>
          </div>

          <div className="music-player-controls">
            <button className="music-ctrl-btn" onClick={playPrev} title="Previous">
              <span className="material-symbols-outlined">skip_previous</span>
            </button>
            <button className="music-ctrl-btn music-ctrl-btn--play" onClick={togglePlayPause}>
              <span className="material-symbols-outlined">
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>
            <button className="music-ctrl-btn" onClick={playNext} title="Next">
              <span className="material-symbols-outlined">skip_next</span>
            </button>
          </div>

          <div className="music-player-extra">
            <button
              className={`music-action-btn ${likedIds.has(currentSong.videoId) ? "music-action-btn--liked" : ""}`}
              onClick={() => handleLike(currentSong)}
            >
              <span className="material-symbols-outlined">thumb_up</span>
            </button>
            <button
              className={`music-action-btn ${dislikedIds.has(currentSong.videoId) ? "music-action-btn--disliked" : ""}`}
              onClick={() => handleDislike(currentSong)}
            >
              <span className="material-symbols-outlined">thumb_down</span>
            </button>
          </div>
        </footer>
      )}

      {/* Hidden YouTube player */}
      {currentSong && (
        <div className="music-yt-hidden">
          <YouTube
            videoId={currentSong.videoId}
            opts={playerOpts}
            onReady={(e) => {
              playerRef.current = e.target;
            }}
            onEnd={playNext}
            onStateChange={(e) => {
              // 1 = playing, 2 = paused
              if (e.data === 1) setIsPlaying(true);
              if (e.data === 2) setIsPlaying(false);
            }}
          />
        </div>
      )}
    </div>
  );
}
