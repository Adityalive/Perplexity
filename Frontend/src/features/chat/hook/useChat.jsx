import { useCallback } from "react";
import { useDispatch } from "react-redux";
import {
  addMessages,
  addNewMessage,
  createNewChat,
  setChats,
  setCurrentChatId,
  setError,
  setLoading,
} from "../chat.slice";
import {
  getChats,
  getMessages,
  sendMessage,
  sendImageMessage,
} from "../services/chat.api";
import {
  disconnectSocketConnection,
  initializeSocketConnection,
} from "../services/chat.socket";

export function useChat() {
  const dispatch = useDispatch();

  async function handleSendMessage({ message, chatId }) {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const data = await sendMessage({ message, chat: chatId });

      const resolvedChatId = chatId || data.chat?._id;

      // Register new chat in Redux FIRST before adding messages
      if (!chatId && data.chat) {
        dispatch(createNewChat({ chatId: data.chat._id, title: data.chat.title }));
        dispatch(setCurrentChatId(data.chat._id));
      }

      dispatch(addNewMessage({ chatId: resolvedChatId, content: message, role: "user" }));
      dispatch(addNewMessage({
        chatId: resolvedChatId,
        content: data.aiMessage.content,
        role: data.aiMessage.role,
        sources: data.aiMessage.sources || [],
        followUps: data.aiMessage.followUps || [],
      }));

      if (chatId) dispatch(setCurrentChatId(resolvedChatId));

      return data;
    } catch (error) {
      dispatch(setError(error.response?.data?.message || error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function handleGetChats() {
    try {
      dispatch(setLoading(true));

      const data = await getChats();
      const formattedChats = data.chats.reduce((acc, chat) => {
        acc[chat._id] = {
          id: chat._id,
          title: chat.title,
          messages: [],
          lastUpdated: chat.updatedAt,
        };
        return acc;
      }, {});

      dispatch(setChats(formattedChats));
      return data;
    } catch (error) {
      dispatch(setError(error.response?.data?.message || error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function handleSendImageMessage({ file, content, chatId }) {
    try {
      dispatch(setLoading(true));

      const data = await sendImageMessage({
        file,
        content,
        chat: chatId,
      });

      const resolvedChatId = chatId || data.chat?._id;

      if (!chatId && data.chat) {
        dispatch(
          createNewChat({
            chatId: data.chat._id,
            title: data.chat.title,
          })
        );
      }

      dispatch(
        addNewMessage({
          chatId: resolvedChatId,
          content: data.userMessage.content,
          image: data.userMessage.image,
          messageType: data.userMessage.messageType || "image",
          role: data.userMessage.role,
        })
      );

      // Add the AI response to the chat
      if (data.aiMessage) {
        dispatch(
          addNewMessage({
            chatId: resolvedChatId,
            content: data.aiMessage.content,
            role: data.aiMessage.role,
          })
        );
      }

      dispatch(setCurrentChatId(resolvedChatId));
      return data;
    } catch (error) {
      dispatch(setError(error.response?.data?.message || error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }

  async function handleOpenChat(chatId, chats) {
    try {
      dispatch(setLoading(true));

      if ((chats[chatId]?.messages?.length || 0) === 0) {
        const data = await getMessages(chatId);
        const formattedMessages = data.messages.map((msg) => ({
          content: msg.content,
          image: msg.image || null,
          messageType: msg.messageType || (msg.image ? "image" : "text"),
          role: msg.role,
        }));

        dispatch(
          addMessages({
            chatId,
            messages: formattedMessages,
          })
        );
      }

      dispatch(setCurrentChatId(chatId));
    } catch (error) {
      dispatch(setError(error.response?.data?.message || error.message));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }

  const handleInitializeSocketConnection = useCallback(() => {
    return initializeSocketConnection();
  }, []);

  const handleDisconnectSocketConnection = useCallback(() => {
    disconnectSocketConnection();
  }, []);

  return {
    initializeSocketConnection: handleInitializeSocketConnection,
    disconnectSocketConnection: handleDisconnectSocketConnection,
    handleSendMessage,
    handleSendImageMessage,
    handleGetChats,
    handleOpenChat,
  };
}
export default useChat
