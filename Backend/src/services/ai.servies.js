import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai"
import { HumanMessage, SystemMessage, AIMessage, tool, createAgent } from "langchain";
import * as z from "zod";
import { searchInternet } from "./internet.service.js";

const geminiModel = new ChatGoogleGenerativeAI({
    model: "gemini-flash-latest",
    apiKey: process.env.GEMINI_API_KEY
});

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
    tools: [ searchInternetTool ],
})

export async function generateResponse(messages) {
    console.log(messages)

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
- The question involves current events, recent news, live data (prices, scores, weather), or anything time-sensitive.
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
            ...(messages.map(msg => {
                if (msg.role == "user") {
                    return new HumanMessage(msg.content)
                } else if (msg.role == "ai") {
                    return new AIMessage(msg.content)
                }
            })) ]
    });

    return response.messages[ response.messages.length - 1 ].text;

}

export async function generateChatTitle(message) {

    const response = await mistralModel.invoke([
        new SystemMessage(`
            You are a helpful assistant that generates concise and descriptive titles for chat conversations.
            
            User will provide you with the first message of a chat conversation, and you will generate a title that captures the essence of the conversation in 2-4 words. The title should be clear, relevant, and engaging, giving users a quick understanding of the chat's topic.    
        `),
        new HumanMessage(`
            Generate a title for a chat conversation based on the following first message:
            "${message}"
            `)
    ])

    return response.text;

}

