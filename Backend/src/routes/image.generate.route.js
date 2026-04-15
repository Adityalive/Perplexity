import { Router } from "express";
import { authverify } from "../middleware/auth.middleware.js";

const imageGenerateRouter = Router();

imageGenerateRouter.post("/generate-image", authverify, async (req, res) => {
  try {
    const { prompt, model = "flux", width = 768, height = 1024, seed } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const encodedPrompt = encodeURIComponent(prompt.trim());

    // Pollinations.ai is free, no API key, no rate limit for image URL generation
    let imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&nologo=true`;

    if (seed !== undefined && seed !== null && seed !== "") {
      imageUrl += `&seed=${encodeURIComponent(seed)}`;
    } else {
      // Add a random seed to prevent aggressive caching
      imageUrl += `&seed=${Math.floor(Math.random() * 1000000)}`;
    }

    // Fetch the image on the backend to avoid browser adblockers and CORS issues
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) {
      throw new Error(`Pollinations API responded with status: ${imgResponse.status}`);
    }

    const arrayBuffer = await imgResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = imgResponse.headers.get("content-type") || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    return res.json({
      success: true,
      imageUrl: dataUrl,
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
