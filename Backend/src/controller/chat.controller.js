import { generateChatTitle, generateResponse } from "../services/ai.servies.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";

export async function sendMessage(req, res) {
  const { message, chat: chatId } = req.body;

  let title = null;
  let chat = null;

  if (!chatId) {
    title = await generateChatTitle(message);
    chat = await chatModel.create({
      user: req.user.id,
      title,
    });
  }

  const resolvedChatId = chatId || chat._id;

  const userMessage = await messageModel.create({
    chat: resolvedChatId,
    content: message,
    role: "user",
  });

  const messages = await messageModel.find({ chat: resolvedChatId });
  const result = await generateResponse(messages);

  const aiMessage = await messageModel.create({
    chat: resolvedChatId,
    content: result,
    role: "ai",
  });

  res.status(200).json({
    message: "Message sent successfully",
    title,
    chat,
    userMessage,
    aiMessage,
  });
}

export async function getChats(req, res) {
  const chats = await chatModel.find({ user: req.user.id });

  res.status(200).json({
    message: "Chats retrieved successfully",
    chats,
  });
}

export async function getMessages(req, res) {
  const { chatId } = req.params;

  const chat = await chatModel.findOne({
    _id: chatId,
    user: req.user.id,
  });

  if (!chat) {
    return res.status(404).json({ message: "Chat not found" });
  }

  const messages = await messageModel
    .find({ chat: chatId })
    .sort({ createdAt: 1 });

  res.status(200).json({
    message: "Messages retrieved successfully",
    messages,
  });
}
