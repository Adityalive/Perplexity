import { tavily as Tavily } from "@tavily/core";
import { ChatMistralAI } from "@langchain/mistralai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";

const tavilyClient = Tavily({ apiKey: process.env.TAVILY_API_KEY });

const mistral = new ChatMistralAI({
    model: "mistral-medium-latest",
    apiKey: process.env.MISTRAL_API_KEY,
    maxTokens: 4096,
});

// ════════════════════════════════════════════════════════
//  STEP 1 : Generate sub-queries to cover the topic from all angles
// ════════════════════════════════════════════════════════
async function generateSubQueries(topic) {
    const response = await mistral.invoke([
        new SystemMessage(`You are an elite research strategist who generates search queries designed to extract MAXIMUM information from the web.

Your job: given a topic, produce exactly 7 highly targeted, search-engine-optimized queries that a professional researcher would use.

## Rules for query generation:
1. Each query must target a DIFFERENT information layer — never overlap.
2. Use specific, long-tail phrasing (e.g. "how X works step by step" NOT just "X overview").
3. Include year markers like "2024" or "2025" for recency-sensitive queries.
4. At least one query must target expert-level or academic-level content (e.g. "research papers on X", "meta-analysis of X").
5. At least one query must surface real-world data, stats, or case studies.
6. Adapt to the topic type:
   - For TECHNOLOGY topics → include architecture, implementation, benchmarks
   - For SCIENCE topics → include methodology, peer-reviewed findings, ongoing research
   - For SOCIAL/POLICY topics → include stakeholder perspectives, policy frameworks, demographics
   - For BUSINESS topics → include market size, competitors, revenue models

## The 7 angles to cover:
1. **What** — Core definition, how it works, key concepts
2. **Why** — Origin story, historical context, what problem it solves
3. **Now** — Current state, latest news, 2024-2025 developments  
4. **Who** — Key players, leading researchers, companies, communities
5. **How** — Real-world applications, case studies, implementation examples
6. **Limits** — Criticisms, open problems, ethical concerns, failure cases
7. **Data** — Statistics, benchmarks, comparisons, research papers

Return ONLY a JSON array of 7 strings. No markdown. No explanation.`),
        new HumanMessage(`Research topic: "${topic}"`),
    ]);

    try {
        const raw = response.text?.trim();
        const match = raw.match(/\[[\s\S]*?\]/);
        if (match) return JSON.parse(match[0]);
    } catch (_) {}

    // Fallback: crafted queries
    return [
        `what is ${topic} explained in depth how it works`,
        `history and origin of ${topic} timeline`,
        `${topic} latest developments 2024 2025 breakthroughs`,
        `${topic} key companies researchers leaders`,
        `${topic} real world applications case studies examples`,
        `${topic} problems criticisms ethical concerns limitations`,
        `${topic} statistics data research papers benchmarks`,
    ];
}

// ════════════════════════════════════════════════════════
//  STEP 2 : Run all sub-queries in parallel with deep search
// ════════════════════════════════════════════════════════
async function runParallelSearches(queries) {
    const searchPromises = queries.map((q) =>
        tavilyClient.search(q, {
            maxResults: 4,
            searchDepth: "advanced",      // Full page content
            includeAnswer: true,          // Tavily's own summarized answer
        }).catch((e) => {
            console.warn(`[Researcher] Search failed for "${q}":`, e.message);
            return { results: [], answer: "" };
        })
    );

    const results = await Promise.all(searchPromises);

    // Collect all unique sources
    const allSources = [];
    const seenUrls = new Set();

    results.forEach((r) => {
        (r.results || []).forEach((item) => {
            if (!seenUrls.has(item.url)) {
                seenUrls.add(item.url);
                allSources.push({
                    title: item.title || new URL(item.url).hostname,
                    url: item.url,
                    favicon: `https://www.google.com/s2/favicons?domain=${new URL(item.url).hostname}&sz=32`,
                    domain: new URL(item.url).hostname.replace("www.", ""),
                    snippet: item.content?.slice(0, 400) || "",
                });
            }
        });
    });

    // Build a condensed context string for the AI
    const contextChunks = results.map((r, i) => {
        const queryLabel = queries[i];
        const snippets = (r.results || [])
            .map((item) => `[${item.title}]: ${item.content?.slice(0, 600) || ""}`)
            .join("\n\n");
        const answer = r.answer ? `Summary: ${r.answer}` : "";
        return `### Query: ${queryLabel}\n${answer}\n${snippets}`;
    });

    return { context: contextChunks.join("\n\n---\n\n"), sources: allSources };
}

// ════════════════════════════════════════════════════════
//  STEP 3 : Synthesize into a research paper structure
// ════════════════════════════════════════════════════════
async function synthesizeReport(topic, context) {
    const response = await mistral.invoke([
        new SystemMessage(`You are a world-class research analyst and academic writer.
Your job is to synthesize raw web search data into a comprehensive, structured research document.

STRICT RULES:
1. Structure the output EXACTLY as follows using markdown headings:
   ## Abstract
   ## 1. Background & Definition
   ## 2. Historical Context
   ## 3. Current State & Recent Developments
   ## 4. Applications & Use Cases
   ## 5. Challenges, Limitations & Criticisms
   ## 6. Key Findings (bullet points — objective facts only)
   
2. DO NOT write a Conclusion section. Present findings only — do not synthesize or judge unless explicitly asked.
3. Every claim must be directly supported by the search data provided.
4. Write in clear, precise, academic but readable prose.
5. Use markdown tables where comparing multiple items.
6. Be exhaustive — this is a deep research document, not a summary.
7. Return ONLY the markdown text. DO NOT wrap the entire response in a \`\`\`markdown code block. DO NOT use 4-space indentation for paragraphs.`),

        new HumanMessage(`Research Topic: "${topic}"

=== WEB SEARCH DATA ===
${context}
=== END DATA ===

Write the full structured research document now.`),
    ]);

    // Strip wrapping ```markdown and ``` if the AI still returns them
    let cleanText = response.text || "";
    cleanText = cleanText.replace(/^```markdown\s*/i, "").replace(/```$/i, "").trim();

    return cleanText;
}

// ════════════════════════════════════════════════════════
//  MAIN EXPORT — deepResearch(topic)
// ════════════════════════════════════════════════════════
export async function deepResearch(topic) {
    console.log(`[Researcher] Starting deep research on: "${topic}"`);

    // Phase 1: generate sub-queries
    const queries = await generateSubQueries(topic);
    console.log("[Researcher] Sub-queries:", queries);

    // Phase 2: parallel web searches
    const { context, sources } = await runParallelSearches(queries);
    console.log(`[Researcher] Collected ${sources.length} unique sources`);

    // Phase 3: synthesize research paper
    const report = await synthesizeReport(topic, context);

    return {
        report,
        sources,
        queries,
    };
}
