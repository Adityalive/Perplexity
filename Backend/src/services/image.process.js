import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";

const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-2.0-flash",
    apiKey: process.env.GEMINI_API_KEY
});

export async function processImage(image, userPrompt = "") {
    try {
        const finalPrompt = userPrompt.trim() 
            ? `Please solve or answer the following based on the provided image: ${userPrompt}`
            : "Please analyze this image and return a detailed description of what it contains.";

        const message = new HumanMessage({
            content: [
                {
                    type: "text",
                    text: finalPrompt,
                },
                {
                    type: "image_url",
                    image_url: typeof image === 'string' ? image : image.url, 
                },
            ],
        });

        const res = await geminiModel.invoke([message]);
        return res.content;
    } catch (error) {
        console.error("Error processing image with Gemini:", error);
        throw error;
    }
}