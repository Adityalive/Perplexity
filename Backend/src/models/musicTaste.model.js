import mongoose from "mongoose";

const musicTasteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    likedSongs: [
      {
        title: { type: String },
        artist: { type: String },
        videoId: { type: String },
        thumbnail: { type: String },
      },
    ],
    dislikedSongs: [
      {
        title: { type: String },
        artist: { type: String },
        videoId: { type: String },
      },
    ],
  },
  { timestamps: true }
);

const MusicTaste = mongoose.model("MusicTaste", musicTasteSchema);
export default MusicTaste;
