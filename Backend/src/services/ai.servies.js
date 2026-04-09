import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai"
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain";
import * as z from "zod";
import { searchInternet, getLastSearchSources, clearSearchSources } from "./internet.service.js";
import { CliPrettify } from "markdown-table-prettify";



const mistralModel = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: process.env.MISTRAL_API_KEY
})

const searchInternetTool = tool(
    searchInternet,
    {
        name: "searchInternet",
        description: "Use this tool to get the latest information from the internet.",
        schema: z.object({
            query: z.string().describe("The search query to look up on the internet.")
        })
    }
)

const agent = createAgent({
    model: mistralModel,
    tools: [searchInternetTool],
})

function normalizeChatTitle(rawTitle, fallbackMessage = "") {
    const fallback = fallbackMessage
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .slice(0, 4)
        .join(" ");

    const sanitized = String(rawTitle ?? "")
        .replace(/[\r\n]+/g, " ")
        .replace(/["'*#`[\]()]/g, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!sanitized) {
        return fallback || "New Chat";
    }

    const limitedWords = sanitized.split(" ").slice(0, 6).join(" ");
    const limitedChars = limitedWords.slice(0, 60).trim();

    return limitedChars || fallback || "New Chat";
}

export async function generateResponse(messages) {
    clearSearchSources();

    // Only send the last 500 chars of each message to reduce token bloat
    const trimmedMessages = messages.map(msg => {
        if (msg.role == "user") {
            return new HumanMessage(msg.content?.slice(-500) || "")
        } else if (msg.role == "ai") {
            return new AIMessage(msg.content?.slice(-500) || "")
        }
    }).filter(Boolean);

    const response = await agent.invoke({
        messages: [
            new SystemMessage(`
               You are a knowledgeable, precise, and helpful AI assistant. Your goal is to give accurate, well-reasoned answers while being honest about the limits of your knowledge.

## Core Behavior
- Answer questions clearly and concisely, adapting your depth to the complexity of the question.
- If you are uncertain or don't know something, say so directly — never fabricate information.
- Cite your reasoning when helpful, especially for nuanced or complex topics.
- Be direct. Don't pad responses with filler phrases.

## Using the Internet (searchInternet tool)

Use the "searchInternet" tool whenever:
- The question involves current events, recent news, live data (prices, scores, weather,time), or anything time-sensitive.
- The topic may have changed or been updated after your training cutoff.
- You are uncertain whether your knowledge is current enough to answer reliably.

When you use "searchInternet":
1. Search with a clear, targeted query.
2. Read and synthesize the results — don't just dump raw links or snippets.
3. Base your answer on what the search returns, and say so (e.g., "According to recent results...").
4. If results are unclear or conflicting, say that too.

## Honesty Rules

- Never guess and present it as fact.
- If a question is ambiguous, ask a brief clarifying question before answering.
- If a question is outside your capabilities entirely, explain why clearly.

## Tone
Be warm but efficient. Avoid over-explaining unless the user asks for detail. Match the user's register — casual for casual questions, technical for technical ones.
            `),
            ...trimmedMessages]
    });

    let text = response.messages[response.messages.length - 1].text;
    
    // Prettify markdown tables in the response
    try {
        text = CliPrettify.prettify(text);
    } catch (e) {
        console.warn("Table prettification failed:", e.message);
    }

    const sources = getLastSearchSources();
    let followUps = [];
    try {
        const lastUserMsg = messages.filter(m => m.role === "user").at(-1)?.content || "";
        const followUpResponse = await mistralModel.invoke([
            new SystemMessage(`You are an assistant that generates follow-up questions. 
Given a user's question and the AI's answer, generate exactly 3 short, relevant follow-up questions the user might ask next.
Return ONLY a JSON array of 3 strings. No explanation, no markdown, no preamble. Example: ["Question 1?", "Question 2?", "Question 3?"]`),
            new HumanMessage(`User asked: "${lastUserMsg}"\n\nAI answered: "${text.slice(0, 500)}"\n\nGenerate 3 follow-up questions as a JSON array.`)
        ]);
        const raw = followUpResponse.text?.trim();
        const match = raw.match(/\[[\s\S]*?\]/);
        if (match) followUps = JSON.parse(match[0]);
    } catch (e) {
        console.warn("Follow-up generation failed:", e.message);
    }

    return { text, sources, followUps };

}

export async function generateChatTitle(message) {

    const response = await mistralModel.invoke([
        new SystemMessage(`
            You are an expert at generating short, meaningful titles for chat conversations.

Given the user's first message, generate a concise title that:
- Captures the core topic or intent of the conversation
- Is 2–5 words 
- Uses natural, human-readable language (not robotic or overly technical)
- Prioritizes clarity and specificity over generic phrasing

 Rules:
- Return ONLY the title — no quotes, punctuation at the end, labels, markdown, or explanations
- Do NOT start with words like "Chat about", "Discussion on", or "Help with"
- Prefer noun phrases or action-oriented titles (e.g., "Fix Login Bug", "Summarize Research Paper")

        `),
        new HumanMessage(`
            Generate a title for a chat conversation based on the following first message:
            "${message}"
            `)
    ])

    return normalizeChatTitle(response.text, message);

}

