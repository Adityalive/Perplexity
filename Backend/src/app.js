import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import userRouter from "./routes/user.route.js";
import connectDB from "./config/database.js";
import cors from "cors";
import morgan from "morgan";
import chatRouter from "./routes/chat.route.js";
connectDB();

const app = express();
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());

// Normalize accidental newline characters in URL paths (e.g. %0A).
app.use((req, _res, next) => {
  req.url = req.url
    .replace(/%0A/gi, "")
    .replace(/%0D/gi, "")
    .replace(/[\r\n]/g, "");
  next();
});

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/users", userRouter);
app.use("/api/chats", chatRouter);

export default app;
