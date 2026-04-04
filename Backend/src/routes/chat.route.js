import {authverify} from '../middleware/auth.middleware.js';
import { Router } from "express";
import { sendMessage, getChats, getMessages,sendImageMessage  } from "../controller/chat.controller.js";
import multer from "multer";
import upload from "../middleware/upload.middlweare.js";
const chatRouter = Router();

chatRouter.post("/message", authverify, sendMessage);
chatRouter.get("/chats", authverify, getChats);
chatRouter.get("/messages/:chatId", authverify, getMessages);
chatRouter.post("/image-message", authverify, upload.single("image"), sendImageMessage);

export default chatRouter;