import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import { clerkMiddleware } from '@clerk/express';
import userRouter from "./routes/user.route.js";
import connectDB from "./config/database.js";
import cors from "cors";
import morgan from "morgan";
import chatRouter from "./routes/chat.route.js";
import musicRouter from "./routes/music.route.js";
import researchRouter from "./routes/research.route.js";
import imageGenerateRouter from "./routes/image.generate.route.js";
connectDB();

const app = express();
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  credentials: true
}));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());
console.log("Clerk Publishable Key:", process.env.CLERK_PUBLISHABLE_KEY ? "Present" : "Missing");
app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
}));

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
app.use("/api/music", musicRouter);
app.use("/api/research", researchRouter);
app.use("/api/images", imageGenerateRouter);

export default app;
