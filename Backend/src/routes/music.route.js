import { Router } from "express";
import { authverify } from "../middleware/auth.middleware.js";
import {
  getMusicRecommendations,
  searchMusicHandler,
  likeSongHandler,
  dislikeSongHandler,
} from "../controller/music.controller.js";

const musicRouter = Router();

musicRouter.get("/recommendations", authverify, getMusicRecommendations);
musicRouter.get("/search", authverify, searchMusicHandler);
musicRouter.post("/like", authverify, likeSongHandler);
musicRouter.post("/dislike", authverify, dislikeSongHandler);

export default musicRouter;
