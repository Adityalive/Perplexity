import OpenAI from "openai";

let groq = null;

export async function processImage(image, userPrompt = "") {
    const finalPrompt = userPrompt.trim()
        ? `Please solve or answer the following based on the provided image: ${userPrompt}`
        : "Please analyze this image and return a detailed description of what it contains.";

    const imageUrl = typeof image === "string" ? image : image.url;
    const groqKey = process.env.GROQ_API_KEY?.trim();

    if (!groqKey) {
        throw new Error("GROQ_API_KEY is not configured in .env file.");
    }

    if (!imageUrl) {
        throw new Error("No valid image URL provided.");
    }

    if (!groq) {
        groq = new OpenAI({
            apiKey: groqKey,
            baseURL: "https://api.groq.com/openai/v1",
        });
    }

    try {
        const response = await groq.chat.completions.create({
            model: "meta-llama/llama-4-scout-17b-16e-instruct",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: finalPrompt },
                        {
                            type: "image_url",
                            image_url: { url: imageUrl },
                        },
                    ],
                },
            ],
        });

        console.log("Groq AI response received successfully");
        return response.choices?.[0]?.message?.content || "No response returned from Groq.";
    } catch (error) {
        console.error("Groq image processing failed:", error?.message || error);
        throw error;
    }
}
