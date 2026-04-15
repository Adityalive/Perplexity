import { Router } from "express";
import { authverify } from "../middleware/auth.middleware.js";

const imageGenerateRouter = Router();

imageGenerateRouter.post("/generate-image", authverify, async (req, res) => {
  try {
    const { prompt, model = "flux", width = 1024, height = 1024, seed } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const encodedPrompt = encodeURIComponent(prompt.trim());

    // Pollinations.ai is free, no API key, no rate limit for image URL generation
    let imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=${encodeURIComponent(model)}&width=${width}&height=${height}&nologo=true`;

    if (seed !== undefined && seed !== null && seed !== "") {
      imageUrl += `&seed=${encodeURIComponent(seed)}`;
    }

    return res.json({
      success: true,
      imageUrl,
      prompt,
      model,
      width,
      height,
      seed: seed ?? null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default imageGenerateRouter;
