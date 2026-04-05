import { createSlice } from "@reduxjs/toolkit";

const chatSlice = createSlice({
    name: "chat",
    initialState: {
        chats: {},
        currentChatId: null,
        isLoading: false,
        error: null,
    },
    reducers: {
        setChats: (state, action) => {
            state.chats = action.payload;
        },
        createNewChat: (state, action) => {
            const { chatId, title } = action.payload;
            state.chats[chatId] = {
                id: chatId,
                title,
                messages: [],
                lastUpdated: new Date().toISOString(),
            };
        },
        addNewMessage: (state, action) => {
            const { chatId, content, role, image = null, messageType = "text", sources = [], followUps = [] } = action.payload;
            state.chats[chatId].messages.push({ content, role, image, messageType, sources, followUps });
        },
        addMessages: (state, action) => {
            const { chatId, messages } = action.payload;
            state.chats[chatId].messages.push(...messages);
        },
        setCurrentChatId: (state, action) => {
            state.currentChatId = action.payload;
        },
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
    },
});

export const {
    setChats,
    createNewChat,
    addNewMessage,
    addMessages,
    setCurrentChatId,
    setLoading,
    setError,
} = chatSlice.actions;

export default chatSlice.reducer;
