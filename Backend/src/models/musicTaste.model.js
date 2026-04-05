import mongoose from "mongoose";

const songSchema = {
  title: { type: String },
  artist: { type: String },
  videoId: { type: String },
  thumbnail: { type: String },
};

const musicTasteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Cookie-based connection
    ytCookie: { type: String, default: "" },
    connected: { type: Boolean, default: false },
    lastSyncedAt: { type: Date, default: null },
    // Manual onboarding
    favoriteGenres: { type: [String], default: [] },
    favoriteArtists: { type: [String], default: [] },
    onboarded: { type: Boolean, default: false },
    // Real library data from YT Music
    syncedHistory: [songSchema],      // Recently played
    syncedLibrary: [songSchema],      // Library songs
    syncedLiked: [songSchema],        // Liked songs
    // In-app feedback
    likedSongs: [songSchema],
    dislikedSongs: [
      {
        title: { type: String },
        artist: { type: String },
        videoId: { type: String },
      },
    ],
    // AI-generated playlists (cached)
    playlists: [
      {
        name: { type: String },
        description: { type: String },
        songs: [songSchema],
        generatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const MusicTaste = mongoose.model("MusicTaste", musicTasteSchema);
export default MusicTaste;
