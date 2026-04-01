import {authverify} from '../middleware/auth.middleware.js';
import { Router } from "express";
import { sendMessage, getChats, getMessages,  } from "../controller/chat.controller.js";

const chatRouter = Router();

chatRouter.post("/message", authverify, sendMessage);
chatRouter.get("/chats", authverify, getChats);
chatRouter.get("/messages/:chatId", authverify, getMessages);

export default chatRouter;