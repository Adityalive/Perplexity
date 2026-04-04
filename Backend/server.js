import app from "./src/app.js";
import http from "http";
import { initsocket } from "./src/sockets/server.socket.js";
const PORT = process.env.PORT || 3000;

const httpServer = http.createServer(app);
initsocket({httpServer});

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
})
