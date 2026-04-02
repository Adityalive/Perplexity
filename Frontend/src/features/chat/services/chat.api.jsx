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
