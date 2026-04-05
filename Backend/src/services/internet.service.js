import { tavily as Tavily } from "@tavily/core"

const tavily = Tavily({
    apiKey: process.env.TAVILY_API_KEY,
})

// Stores the last search results so ai.servies.js can pull sources after the agent call
let lastSearchSources = [];

export function getLastSearchSources() {
    return lastSearchSources;
}

export function clearSearchSources() {
    lastSearchSources = [];
}

export const searchInternet = async ({ query }) => {
    const results = await tavily.search(query, {
        maxResults: 5,
    })

    // Parse sources from results
    lastSearchSources = (results.results || []).map((r) => ({
        title: r.title || new URL(r.url).hostname,
        url: r.url,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(r.url).hostname}&sz=32`,
        domain: new URL(r.url).hostname.replace("www.", ""),
    }));

    return JSON.stringify(results)
}