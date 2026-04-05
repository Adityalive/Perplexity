import { generateChatTitle, generateResponse } from "../services/ai.servies.js";
import { processImage } from "../services/image.process.js";
import chatModel from "../models/chat.model.js";
import messageModel from "../models/message.model.js";
import { uploadToImageKit } from "../services/imagekit.services.js";
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
  const { text: result, sources } = await generateResponse(messages);

  const aiMessage = await messageModel.create({
    chat: resolvedChatId,
    content: result,
    role: "ai",
    sources: sources || [],
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
export async function sendImageMessage(req, res) {
  try {
    const { chat: chatId, content } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    let chat = null;
    let title = null;

    if (!chatId) {
      title = await generateChatTitle(content || "Image message");
      chat = await chatModel.create({
        user: req.user.id,
        title,
      });
    }

    const resolvedChatId = chatId || chat._id;

    const uploadedImage = await uploadToImageKit(req.file);

    // Convert local buffer to base64 Data URL for Gemini
    const base64Image = req.file.buffer.toString("base64");
    const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    const userMessage = await messageModel.create({
      chat: resolvedChatId,
      content: content || "",
      image: uploadedImage.url,
      role: "user",
      messageType: "image",
    });

    // Send image Data URL + user text to Gemini for AI response
    const aiResult = await processImage(dataUrl, content || "");

    const aiMessage = await messageModel.create({
      chat: resolvedChatId,
      content: aiResult,
      role: "ai",
    });

    return res.status(200).json({
      message: "Image message sent successfully",
      chat,
      userMessage,
      aiMessage,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message || "Failed to send image message",
    });
  }
}

