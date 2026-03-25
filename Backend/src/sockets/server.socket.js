import {Server} from "socket.io";

export function initsocket({httpServer}) {
    const io = new Server(httpServer,{
        cors: {
            origin: "http://localhost:3000",
            credentials: true
        },
    });
    console.log("Socket is running")
    io.on("connection", (socket) => {
        console.log("a user connected"+socket.id);
        socket.on("disconnect", () => {
            console.log("user disconnected");
        });
    });

     function getSocket() {
        if (!io) {throw new Error("Socket is not initialized"); }
        
    }
    return io;
}