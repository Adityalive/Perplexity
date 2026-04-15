import { io } from "socket.io-client";

let socketInstance = null;

export const initializeSocketConnection = () => {
    if (socketInstance) {
        return socketInstance;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || (import.meta.env.PROD ? window.location.origin : "http://localhost:3000");
    socketInstance = io(socketUrl, {
        withCredentials: true,
    });

    socketInstance.on("connect", () => {
        console.log("Connected to Socket.IO server")
    });

    return socketInstance;
};

export const disconnectSocketConnection = () => {
    if (!socketInstance) {
        return;
    }

    socketInstance.disconnect();
    socketInstance = null;
};
