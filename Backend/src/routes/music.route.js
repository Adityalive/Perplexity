import { Router } from "express";
import { authverify } from "../middleware/auth.middleware.js";
import {
  connectHandler,
  syncHandler,
  playlistsHandler,
  cachedPlaylistsHandler,
  libraryHandler,
  onboardHandler,
  statusHandler,
  searchMusicHandler,
  likeSongHandler,
  dislikeSongHandler,
} from "../controller/music.controller.js";

const musicRouter = Router();

musicRouter.post("/connect", authverify, connectHandler);
musicRouter.post("/sync", authverify, syncHandler);
musicRouter.post("/playlists/generate", authverify, playlistsHandler);
musicRouter.get("/playlists", authverify, cachedPlaylistsHandler);
musicRouter.get("/library", authverify, libraryHandler);
musicRouter.post("/onboard", authverify, onboardHandler);
musicRouter.get("/status", authverify, statusHandler);
musicRouter.get("/search", authverify, searchMusicHandler);
musicRouter.post("/like", authverify, likeSongHandler);
musicRouter.post("/dislike", authverify, dislikeSongHandler);

export default musicRouter;
