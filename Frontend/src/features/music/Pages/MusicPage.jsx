import { useEffect, useRef, useState } from "react";
import YouTube from "react-youtube";
import {
  searchMusic,
  likeSong,
  dislikeSong,
  savePreferences,
  getStatus,
  connectYTMusic,
  syncLibrary,
  generatePlaylists,
  getCachedPlaylists,
  getLibrary,
} from "../services/music.api.js";
import "./MusicPage.css";

const GENRE_OPTIONS = [
  "Pop","Rock","Hip-Hop","R&B","Jazz","Classical","Electronic","Indie",
  "Metal","Country","Latin","K-Pop","Bollywood","Lofi","Punk","Blues","Reggae","Soul",
];
const ARTIST_SUGGESTIONS = [
  "Taylor Swift","The Weeknd","Drake","Dua Lipa","Ed Sheeran","Billie Eilish",
  "Arijit Singh","BTS","Coldplay","Arctic Monkeys","Kendrick Lamar","Daft Punk",
  "Radiohead","Bad Bunny","Imagine Dragons","Adele","Post Malone","Travis Scott",
];

export default function MusicPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());
  const [dislikedIds, setDislikedIds] = useState(new Set());
  const [queue, setQueue] = useState([]);
  const playerRef = useRef(null);

  // Status & playlists
  const [onboarded, setOnboarded] = useState(false);
  const [connected, setConnected] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [library, setLibrary] = useState({ history: [], library: [], liked: [] });
  const [generatingPlaylists, setGeneratingPlaylists] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Onboarding
  const [selectedGenres, setSelectedGenres] = useState(new Set());
  const [selectedArtists, setSelectedArtists] = useState(new Set());
  const [customArtist, setCustomArtist] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Cookie modal
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [cookieInput, setCookieInput] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("playlists"); // playlists | library | search

  useEffect(() => {
    const links = [
      "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
      "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
    ].map((href) => {
      const el = document.createElement("link");
      el.href = href; el.rel = "stylesheet";
      document.head.appendChild(el); return el;
    });
    return () => links.forEach((l) => document.head.removeChild(l));
  }, []);

  useEffect(() => { init(); }, []);

  async function init() {
    try {
      const s = await getStatus();
      setOnboarded(s.onboarded);
      setConnected(s.connected);
      if (s.onboarded || s.connected) {
        // Load cached playlists first
        const cached = await getCachedPlaylists();
        if (cached.playlists?.length) {
          setPlaylists(cached.playlists);
          // auto-play first song of first playlist
          const firstSong = cached.playlists[0]?.songs?.[0];
          if (firstSong) { setCurrentSong(firstSong); setIsPlaying(true); setQueue(cached.playlists[0].songs); }
        }
        // Load library data
        if (s.connected) {
          const lib = await getLibrary();
          setLibrary(lib);
        }
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  async function handleConnect() {
    if (!cookieInput.trim()) return;
    setConnectLoading(true);
    setStatusMsg("Connecting your YT Music account...");
    try {
      await connectYTMusic(cookieInput.trim());
      setConnected(true);
      setShowCookieModal(false);
      setCookieInput("");

      // Auto-sync library after connecting
      setStatusMsg("Syncing your library (liked songs, history, playlists)...");
      setSyncing(true);
      const syncResult = await syncLibrary();
      setStatusMsg(`Synced ${syncResult.total} songs! Generating your playlists...`);

      // Load library
      const lib = await getLibrary();
      setLibrary(lib);

      // Auto-generate playlists
      setGeneratingPlaylists(true);
      const data = await generatePlaylists();
      setPlaylists(data.playlists || []);
      if (data.playlists?.[0]?.songs?.[0]) {
        setCurrentSong(data.playlists[0].songs[0]);
        setIsPlaying(true);
        setQueue(data.playlists[0].songs);
      }
      setStatusMsg("");
    } catch (e) {
      setStatusMsg("Connection failed — check cookie.");
    } finally {
      setConnectLoading(false);
      setSyncing(false);
      setGeneratingPlaylists(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setStatusMsg("Re-syncing your YT Music library...");
    try {
      const result = await syncLibrary();
      const lib = await getLibrary();
      setLibrary(lib);
      setStatusMsg(`Synced ${result.total} songs! Regenerating playlists...`);
      await handleGeneratePlaylists();
      setStatusMsg("");
    } catch (e) {
      setStatusMsg("Sync failed — cookie may be expired.");
    } finally { setSyncing(false); }
  }

  async function handleGeneratePlaylists() {
    setGeneratingPlaylists(true);
    setStatusMsg("AI is analyzing your music taste...");
    try {
      const data = await generatePlaylists();
      setPlaylists(data.playlists || []);
      setStatusMsg("");
      setActiveTab("playlists");
    } catch (e) {
      setStatusMsg("Playlist generation failed.");
    } finally { setGeneratingPlaylists(false); }
  }

  async function handleSavePreferences() {
    if (selectedGenres.size === 0 && selectedArtists.size === 0) return;
    setSavingPrefs(true);
    try {
      await savePreferences({ genres: [...selectedGenres], artists: [...selectedArtists] });
      setOnboarded(true);
      setStatusMsg("Generating your playlists...");
      await handleGeneratePlaylists();
    } catch (e) { console.error(e); }
    finally { setSavingPrefs(false); }
  }

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setActiveTab("search");
    try {
      const data = await searchMusic(searchQuery.trim());
      setSearchResults(data.songs || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  function playSong(song, songList) {
    setCurrentSong(song);
    setIsPlaying(true);
    if (songList) setQueue(songList);
  }

  function playNext() {
    if (!currentSong || !queue.length) return;
    const idx = queue.findIndex((s) => s.videoId === currentSong.videoId);
    playSong(queue[(idx + 1) % queue.length]);
  }
  function playPrev() {
    if (!currentSong || !queue.length) return;
    const idx = queue.findIndex((s) => s.videoId === currentSong.videoId);
    playSong(queue[(idx - 1 + queue.length) % queue.length]);
  }

  async function handleLike(song) {
    try { await likeSong(song); setLikedIds((p) => new Set(p).add(song.videoId)); setDislikedIds((p) => { const n = new Set(p); n.delete(song.videoId); return n; }); } catch {}
  }
  async function handleDislike(song) {
    try { await dislikeSong(song); setDislikedIds((p) => new Set(p).add(song.videoId)); setLikedIds((p) => { const n = new Set(p); n.delete(song.videoId); return n; }); } catch {}
  }
  function togglePlayPause() {
    if (!playerRef.current) return;
    isPlaying ? playerRef.current.pauseVideo() : playerRef.current.playVideo();
    setIsPlaying(!isPlaying);
  }

  function toggleGenre(g) { setSelectedGenres((p) => { const n = new Set(p); n.has(g) ? n.delete(g) : n.add(g); return n; }); }
  function toggleArtist(a) { setSelectedArtists((p) => { const n = new Set(p); n.has(a) ? n.delete(a) : n.add(a); return n; }); }
  function addCustomArtist() { if (customArtist.trim()) { setSelectedArtists((p) => new Set(p).add(customArtist.trim())); setCustomArtist(""); } }

  const playerOpts = { height: "0", width: "0", playerVars: { autoplay: 1, controls: 0 } };

  // ── Song Card ──
  const SongCard = ({ song, songList }) => (
    <div className={`music-card ${currentSong?.videoId === song.videoId ? "music-card--active" : ""}`} onClick={() => playSong(song, songList)}>
      <div className="music-card-thumb-wrap">
        <img src={song.thumbnail} alt={song.title} className="music-card-thumb" />
        <div className="music-card-play-overlay">
          <span className="material-symbols-outlined">{currentSong?.videoId === song.videoId && isPlaying ? "pause" : "play_arrow"}</span>
        </div>
      </div>
      <div className="music-card-info">
        <div className="music-card-title">{song.title}</div>
        <div className="music-card-artist">{song.artist}</div>
      </div>
      <div className="music-card-actions" onClick={(e) => e.stopPropagation()}>
        <button className={`music-action-btn ${likedIds.has(song.videoId)?"music-action-btn--liked":""}`} onClick={()=>handleLike(song)}><span className="material-symbols-outlined">thumb_up</span></button>
        <button className={`music-action-btn ${dislikedIds.has(song.videoId)?"music-action-btn--disliked":""}`} onClick={()=>handleDislike(song)}><span className="material-symbols-outlined">thumb_down</span></button>
      </div>
    </div>
  );

  // ── Cookie Modal ──
  const CookieModal = () => (
    <div className="music-modal-overlay" onClick={() => setShowCookieModal(false)}>
      <div className="music-modal" onClick={(e) => e.stopPropagation()}>
        <div className="music-modal-header">
          <h2>Connect YouTube Music</h2>
          <button className="music-modal-close" onClick={() => setShowCookieModal(false)}><span className="material-symbols-outlined">close</span></button>
        </div>
        <div className="music-modal-body">
          <p className="music-modal-desc">Paste your browser cookie to sync your real library:</p>
          <ol className="music-modal-steps">
            <li>Open <a href="https://music.youtube.com" target="_blank" rel="noopener noreferrer">music.youtube.com</a> → log in</li>
            <li>Press <strong>F12</strong> → <strong>Network</strong> tab</li>
            <li>Click any song → filter for <code>browse</code></li>
            <li>Click request → <strong>Headers</strong> → find <code>cookie:</code></li>
            <li>Copy the full value and paste below</li>
          </ol>
          <textarea className="music-cookie-input" placeholder="Paste cookie here..." value={cookieInput} onChange={(e) => setCookieInput(e.target.value)} rows={4} />
          <button className="music-connect-submit-btn" onClick={handleConnect} disabled={connectLoading || !cookieInput.trim()}>
            {connectLoading ? "Connecting & Syncing..." : "Connect & Sync My Music"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── ONBOARDING ──
  if (!onboarded && !connected && !loading) {
    return (
      <div className="music-root">
        <div className="music-onboard">
          <span className="material-symbols-outlined music-onboard-icon">headphones</span>
          <h1 className="music-onboard-title">What music do you love?</h1>
          <p className="music-onboard-sub">Connect your YT Music for the best experience, or pick manually.</p>
          <button className="music-yt-connect-btn" onClick={() => setShowCookieModal(true)}>
            <span className="material-symbols-outlined">link</span> Connect YouTube Music Account
          </button>
          <p className="music-onboard-divider">— or pick your taste manually —</p>
          <h3 className="music-onboard-section">Genres</h3>
          <div className="music-chip-grid">
            {GENRE_OPTIONS.map((g) => (<button key={g} className={`music-chip ${selectedGenres.has(g)?"music-chip--selected":""}`} onClick={()=>toggleGenre(g)}>{g}</button>))}
          </div>
          <h3 className="music-onboard-section">Artists</h3>
          <div className="music-chip-grid">
            {ARTIST_SUGGESTIONS.map((a) => (<button key={a} className={`music-chip ${selectedArtists.has(a)?"music-chip--selected":""}`} onClick={()=>toggleArtist(a)}>{a}</button>))}
          </div>
          <div className="music-custom-artist-row">
            <input className="music-custom-artist-input" placeholder="Add another artist..." value={customArtist} onChange={(e)=>setCustomArtist(e.target.value)} onKeyDown={(e)=>e.key==="Enter"&&addCustomArtist()} />
            <button className="music-custom-artist-btn" onClick={addCustomArtist}><span className="material-symbols-outlined">add</span></button>
          </div>
          <button className="music-onboard-go" onClick={handleSavePreferences} disabled={savingPrefs||(selectedGenres.size===0&&selectedArtists.size===0)}>
            {savingPrefs ? "Setting up..." : "🎵 Start Listening"}
          </button>
        </div>
        {showCookieModal && <CookieModal />}
      </div>
    );
  }

  // ── MAIN SCREEN ──
  return (
    <div className="music-root">
      {/* Header */}
      <header className="music-header">
        <div className="music-header-left">
          <span className="material-symbols-outlined" style={{fontSize:28}}>music_note</span>
          <h1>Music</h1>
        </div>
        <form className="music-search-form" onSubmit={handleSearch}>
          <span className="material-symbols-outlined music-search-icon">search</span>
          <input className="music-search-input" placeholder="Search songs, artists..." value={searchQuery} onChange={(e)=>setSearchQuery(e.target.value)} />
        </form>
        <button className="music-refresh-btn" onClick={handleGeneratePlaylists} disabled={generatingPlaylists}>
          <span className="material-symbols-outlined">auto_awesome</span>
          <span>{generatingPlaylists ? "Generating..." : "AI Playlists"}</span>
        </button>
        {connected ? (
          <>
            <button className="music-sync-btn" onClick={handleSync} disabled={syncing}>
              <span className="material-symbols-outlined">sync</span>
              <span>{syncing ? "Syncing..." : "Sync"}</span>
            </button>
            <div className="music-status-badge">
              <span className="material-symbols-outlined" style={{fontSize:14,color:"#4ade80"}}>check_circle</span>
              <span>YT Music</span>
            </div>
          </>
        ) : (
          <button className="music-yt-connect-btn" onClick={()=>setShowCookieModal(true)}>
            <span className="material-symbols-outlined">link</span>
            <span>Connect YT Music</span>
          </button>
        )}
      </header>

      {/* Status Bar */}
      {statusMsg && <div className="music-status-bar">{statusMsg}</div>}

      {/* Tab Nav */}
      <div className="music-tabs">
        <button className={`music-tab ${activeTab==="playlists"?"music-tab--active":""}`} onClick={()=>setActiveTab("playlists")}>
          <span className="material-symbols-outlined">queue_music</span> Playlists
        </button>
        {connected && (
          <button className={`music-tab ${activeTab==="library"?"music-tab--active":""}`} onClick={()=>setActiveTab("library")}>
            <span className="material-symbols-outlined">library_music</span> Your Library
          </button>
        )}
        {searchResults.length > 0 && (
          <button className={`music-tab ${activeTab==="search"?"music-tab--active":""}`} onClick={()=>setActiveTab("search")}>
            <span className="material-symbols-outlined">search</span> Search
          </button>
        )}
      </div>

      {/* Content */}
      <main className="music-grid-area">
        {loading ? (
          <div className="music-loading">
            <div className="plx-loading-dot" style={{animationDelay:"0ms"}} />
            <div className="plx-loading-dot" style={{animationDelay:"150ms"}} />
            <div className="plx-loading-dot" style={{animationDelay:"300ms"}} />
          </div>
        ) : activeTab === "playlists" ? (
          playlists.length > 0 ? (
            playlists.map((pl, i) => (
              <div key={i} className="music-playlist-section">
                <div className="music-playlist-header">
                  <h2 className="music-playlist-name">{pl.name}</h2>
                  <p className="music-playlist-desc">{pl.description}</p>
                  <button className="music-play-all-btn" onClick={() => { if (pl.songs[0]) playSong(pl.songs[0], pl.songs); }}>
                    <span className="material-symbols-outlined">play_arrow</span> Play All
                  </button>
                </div>
                <div className="music-playlist-grid">
                  {pl.songs.map((song) => <SongCard key={song.videoId} song={song} songList={pl.songs} />)}
                </div>
              </div>
            ))
          ) : (
            <div className="music-empty">
              <span className="material-symbols-outlined" style={{fontSize:48,color:"rgba(255,255,255,0.15)"}}>queue_music</span>
              <p>{connected ? 'Click "AI Playlists" to generate your personalized playlists!' : 'Connect your YT Music or pick preferences to get AI playlists.'}</p>
            </div>
          )
        ) : activeTab === "library" ? (
          <div className="music-library-sections">
            {library.history.length > 0 && (
              <div className="music-playlist-section">
                <div className="music-playlist-header">
                  <h2 className="music-playlist-name">⏱️ Recently Played</h2>
                  <button className="music-play-all-btn" onClick={() => { if (library.history[0]) playSong(library.history[0], library.history); }}>
                    <span className="material-symbols-outlined">play_arrow</span> Play All
                  </button>
                </div>
                <div className="music-playlist-grid">
                  {library.history.map((song) => <SongCard key={song.videoId} song={song} songList={library.history} />)}
                </div>
              </div>
            )}
            {library.liked.length > 0 && (
              <div className="music-playlist-section">
                <div className="music-playlist-header">
                  <h2 className="music-playlist-name">❤️ Liked Songs</h2>
                  <button className="music-play-all-btn" onClick={() => { if (library.liked[0]) playSong(library.liked[0], library.liked); }}>
                    <span className="material-symbols-outlined">play_arrow</span> Play All
                  </button>
                </div>
                <div className="music-playlist-grid">
                  {library.liked.map((song) => <SongCard key={song.videoId} song={song} songList={library.liked} />)}
                </div>
              </div>
            )}
            {library.library.length > 0 && (
              <div className="music-playlist-section">
                <div className="music-playlist-header">
                  <h2 className="music-playlist-name">📚 Library Songs</h2>
                  <button className="music-play-all-btn" onClick={() => { if (library.library[0]) playSong(library.library[0], library.library); }}>
                    <span className="material-symbols-outlined">play_arrow</span> Play All
                  </button>
                </div>
                <div className="music-playlist-grid">
                  {library.library.map((song) => <SongCard key={song.videoId} song={song} songList={library.library} />)}
                </div>
              </div>
            )}
            {library.history.length === 0 && library.liked.length === 0 && library.library.length === 0 && (
              <div className="music-empty"><p>No library data yet. Click "Sync" to fetch your YT Music library.</p></div>
            )}
          </div>
        ) : (
          /* Search results */
          <div className="music-playlist-section">
            <div className="music-playlist-header">
              <h2 className="music-playlist-name">🔍 Search Results</h2>
            </div>
            <div className="music-playlist-grid">
              {searchResults.map((song) => <SongCard key={song.videoId} song={song} songList={searchResults} />)}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Player */}
      {currentSong && (
        <footer className="music-player-bar">
          <div className="music-player-info">
            <img src={currentSong.thumbnail} alt={currentSong.title} className="music-player-thumb" />
            <div className="music-player-text">
              <div className="music-player-title">{currentSong.title}</div>
              <div className="music-player-artist">{currentSong.artist}</div>
            </div>
          </div>
          <div className="music-player-controls">
            <button className="music-ctrl-btn" onClick={playPrev}><span className="material-symbols-outlined">skip_previous</span></button>
            <button className="music-ctrl-btn music-ctrl-btn--play" onClick={togglePlayPause}><span className="material-symbols-outlined">{isPlaying?"pause":"play_arrow"}</span></button>
            <button className="music-ctrl-btn" onClick={playNext}><span className="material-symbols-outlined">skip_next</span></button>
          </div>
          <div className="music-player-extra">
            <button className={`music-action-btn ${likedIds.has(currentSong.videoId)?"music-action-btn--liked":""}`} onClick={()=>handleLike(currentSong)}><span className="material-symbols-outlined">thumb_up</span></button>
            <button className={`music-action-btn ${dislikedIds.has(currentSong.videoId)?"music-action-btn--disliked":""}`} onClick={()=>handleDislike(currentSong)}><span className="material-symbols-outlined">thumb_down</span></button>
          </div>
        </footer>
      )}

      {currentSong && (
        <div className="music-yt-hidden">
          <YouTube videoId={currentSong.videoId} opts={playerOpts} onReady={(e)=>{playerRef.current=e.target;}} onEnd={playNext} onStateChange={(e)=>{if(e.data===1)setIsPlaying(true);if(e.data===2)setIsPlaying(false);}} />
        </div>
      )}

      {showCookieModal && <CookieModal />}
    </div>
  );
}
