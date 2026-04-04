import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/chats",
  withCredentials: true,
});

export async function getChats() {
  try {
    const response = await api.get("/chats");
    return response.data;
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw error;
  }
}

export async function sendMessage({ message, chat }) {
  try {
    const response = await api.post("/message", { message, chat });
    return response.data;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

export async function getMessages(chatId) {
  try {
    const response = await api.get(`/messages/${chatId}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
}
export async function sendImageMessage({ chat, content,file }) {
  try {
    const formData = new FormData();
    formData.append("image", file);
    if (chat) {
      formData.append("chat", chat);
    }
    formData.append("content", content);
    const response = await api.post("/image-message", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error sending image message:", error);
    throw error;
  }
}
