---
sidebar_position: 6
description: "Toolpack SDK web tools for searching the web via Tavily, Brave, or DuckDuckGo, scraping page content, extracting metadata, and mapping website structure."
keywords: [web scraping tools, web search, Tavily search, Brave search, DuckDuckGo search, AI web scraper, website mapping, Toolpack SDK web tools]
---

# Web Tools

Category: `network` · 9 tools

Search the web, scrape content, and extract information from websites.

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `web.fetch` | `url`, `headers?` | Fetch raw content from URL |
| `web.search` | `query`, `max_results?`, `include_answer?`, `freshness?` | Web search with provider fallback |
| `web.scrape` | `url`, `section?`, `selector?`, `max_length?` | Extract clean text from webpage |
| `web.extract_links` | `url`, `filter?` | Extract all links from page |
| `web.map` | `url` | Get page structure (headings outline) |
| `web.metadata` | `url` | Extract page metadata (title, description, OpenGraph) |
| `web.sitemap` | `url` | Parse and return sitemap URLs |
| `web.feed` | `url` | Parse RSS/Atom feeds |
| `web.screenshot` | `url`, `fullPage?` | Capture webpage screenshot (requires Puppeteer) |

## Examples

### Web Search

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Search for the latest TypeScript features' }],
    model: 'gpt-4o',
});
// AI uses web.search
```

### Scraping Content

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Get the main content from this article URL' }],
    model: 'gpt-4o',
});
// AI uses web.scrape
```

### Page Analysis

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'What sections are on this webpage?' }],
    model: 'gpt-4o',
});
// AI uses web.map to get headings outline
```

### Link Extraction

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Find all documentation links on this page' }],
    model: 'gpt-4o',
});
// AI uses web.extract_links
```

## Search Provider Fallback

The `web.search` tool uses a cascading fallback strategy for maximum reliability:

1. **Tavily** (if API key configured) - Best quality results with optional AI-generated answers
2. **Brave Search** (if API key configured) - Fast, privacy-focused search with summarization
3. **DuckDuckGo Lite** (default fallback) - No API key required, always available

### Configuring Search Providers

Set API keys as environment variables so they apply to every project automatically:

```bash
export TOOLPACK_TAVILY_API_KEY="tvly-..."
export TOOLPACK_BRAVE_API_KEY="BSA..."
```

The config loader prioritizes values from `toolpack.config.json` and falls back to the environment variables above when the file does not specify a key.

### Search with AI Answer

When using Tavily or Brave, you can request an AI-generated answer along with search results:

```typescript
// The AI will use web.search with include_answer: true
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'What is the current price of Bitcoin? Give me a direct answer.' }],
    model: 'gpt-4o',
});
```

## Notes

- **Fallback guaranteed** - Even without API keys, DuckDuckGo Lite provides basic search
- **Content extraction** - `web.scrape` automatically strips navigation, ads, and other junk
- **Rate limiting** - Be mindful of making too many requests to the same domain
- **Screenshot** - `web.screenshot` requires Puppeteer as an optional dependency
