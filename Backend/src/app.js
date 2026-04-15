import "dotenv/config";
import cookieParser from "cookie-parser";
import express from "express";
import { clerkMiddleware } from '@clerk/express';
import userRouter from "./routes/user.route.js";
import connectDB from "./config/database.js";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import chatRouter from "./routes/chat.route.js";
import musicRouter from "./routes/music.route.js";
import researchRouter from "./routes/research.route.js";
import imageGenerateRouter from "./routes/image.generate.route.js";

connectDB();

const app = express();
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || true, // Allow production domain automatically
  credentials: true
}));
app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json());

app.use(clerkMiddleware({
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  secretKey: process.env.CLERK_SECRET_KEY
}));

// Normalize URL paths
app.use((req, _res, next) => {
  req.url = req.url.replace(/%0A/gi, "").replace(/%0D/gi, "").replace(/[\r\n]/g, "");
  next();
});

// Serve static files from the Frontend build
const frontendBuildPath = path.join(process.cwd(), "../Frontend/dist");
console.log("Serving Frontend from:", frontendBuildPath);

app.use(express.static(frontendBuildPath));

// API Routes
app.use("/api/users", userRouter);
app.use("/api/chats", chatRouter);
app.use("/api/music", musicRouter);
app.use("/api/research", researchRouter);
app.use("/api/images", imageGenerateRouter);

// Catch-all to serve index.html for React Router
app.get("*", (req, res) => {
  res.sendFile(path.join(frontendBuildPath, "index.html"));
});

export default app;
