import "dotenv/config";

import express from "express";
import userRouter from "./routes/user.route.js";
import connectDB from "./config/database.js";

connectDB();

const app = express();

app.use(express.json());
app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/users", userRouter);

export default app;
