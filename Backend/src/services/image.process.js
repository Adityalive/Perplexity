import Together from "together-ai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

let together = null;
let geminiModel = null;

export async function processImage(image, userPrompt = "") {
    try {
        const finalPrompt = userPrompt.trim()
            ? `Please solve or answer the following based on the provided image: ${userPrompt}`
            : "Please analyze this image and return a detailed description of what it contains.";

        const imageUrl = typeof image === 'string' ? image : image.url;

        // Prefer Together AI if key is available
        const togetherKey = process.env.TOGETHER_API_KEY;
        if (togetherKey && togetherKey !== "your_together_api_key_here") {
            if (!together) {
                together = new Together({ apiKey: togetherKey });
            }

            const response = await together.chat.completions.create({
                model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: finalPrompt },
                            { type: "image_url", image_url: { url: imageUrl } }
                        ]
                    }
                ]
            });

            return response.choices[0].message.content;
        }

        // Fallback: Use Google Gemini
        console.warn("TOGETHER_API_KEY not set, falling back to Google Gemini for image processing.");
        if (!geminiModel) {
            if (!process.env.GOOGLE_API_KEY) {
                throw new Error("Neither TOGETHER_API_KEY nor GOOGLE_API_KEY is configured.");
            }
            geminiModel = new ChatGoogleGenerativeAI({
                model: "gemini-2.0-flash",
                apiKey: process.env.GOOGLE_API_KEY,
            });
        }

        const message = new HumanMessage({
            content: [
                { type: "text", text: finalPrompt },
                { type: "image_url", image_url: imageUrl },
            ],
        });

        const res = await geminiModel.invoke([message]);
        return res.content;

    } catch (error) {
        console.error("Error processing image:", error);
        throw error;
    }
}