import express from "express";

const router = express.Router();

router.post("/generate-image", async (req, res) => {
  try {
    const { prompt, model = "flux", width = 768, height = 1024, seed } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const encodedPrompt = encodeURIComponent(prompt.trim());

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

export default router;
