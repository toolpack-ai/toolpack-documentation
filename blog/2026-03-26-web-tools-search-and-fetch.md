---
slug: web-tools-search-and-fetch
title: "Web Tools in Toolpack SDK: Search, Fetch, and the Smart Fallback System"
authors: [sajeer-babu]
tags: [tools, web, search, api]
description: "Learn how Toolpack SDK's web search tools work with Tavily, Brave, and DuckDuckGo Lite fallback hierarchy, plus web fetch capabilities for building AI agents that interact with the web."
---

AI agents need to access real-time information from the web. Whether it's searching for current events, fetching documentation, or scraping data, **Toolpack SDK's web tools** make it seamless.

In this post, we'll explore the **web search fallback system** (Tavily → Brave → DuckDuckGo Lite) and the **web fetch tools** that power web-aware AI applications.

<!-- truncate -->

## Why Web Tools Matter

LLMs have a knowledge cutoff—they don't know what happened yesterday, they can't access your company's internal docs, and they can't fetch live data from APIs. Web tools bridge this gap:

- **Web Search**: Find current information, news, documentation, or answers to questions
- **Web Fetch**: Retrieve HTML, JSON, or raw content from URLs
- **Web Scraping**: Extract structured data from web pages
- **Screenshots & PDFs**: Capture visual snapshots of web content

Toolpack SDK includes all of these out of the box.

## Web Search: The Smart Fallback System

The most powerful web tool is `web.search`. It doesn't just search—it intelligently falls back across three providers to ensure your agent always gets results.

### The Fallback Hierarchy

```
Tavily → Brave → DuckDuckGo Lite
```

Here's how it works:

1. **Tavily (Tier 1)**: If you provide a Tavily API key, Toolpack SDK uses it first. Tavily is purpose-built for AI search—it returns clean, structured results optimized for LLM consumption.

2. **Brave (Tier 2)**: If Tavily isn't configured or fails, Toolpack SDK falls back to Brave Search. Brave offers privacy-focused search with a generous free tier and excellent result quality.

3. **DuckDuckGo Lite (Tier 3)**: If neither Tavily nor Brave is available, Toolpack SDK uses DuckDuckGo Lite. This is **completely free**, requires **no API key**, and works out of the box. It's the default fallback.

This means your AI agent can always search the web, even if you haven't set up any API keys yet.

## Setting Up API Keys

### Tavily (Recommended for Production)

Tavily is the best option for production AI search. It's designed specifically for LLMs and returns results in a clean, structured format.

**1. Get an API Key**

Sign up at [tavily.com](https://tavily.com) and create an API key.

**2. Configure Toolpack SDK**

Set the environment variable:

```bash
export TOOLPACK_TAVILY_API_KEY=tvly-xxxxxxxxxxxxx
```

Toolpack SDK will automatically detect it when you initialize with tools enabled:

```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
});
```

Alternatively, configure it in `toolpack.config.json`:

```json
{
  "tools": {
    "additionalConfigurations": {
      "webSearch": {
        "tavilyApiKey": "tvly-xxxxxxxxxxxxx"
      }
    }
  }
}
```

**3. Use Web Search**

```typescript
const response = await toolpack.generate({
  messages: [{ 
    role: 'user', 
    content: 'What are the latest developments in AI agents?' 
  }],
});
```

The LLM will call `web.search` automatically, and Toolpack SDK will use Tavily.

### Brave Search (Alternative)

Brave Search offers a generous free tier (2,500 queries/month) and is a great alternative to Tavily.

**1. Get an API Key**

Sign up at [brave.com/search/api](https://brave.com/search/api) and create an API key.

**2. Configure Toolpack SDK**

Set the environment variable:

```bash
export TOOLPACK_BRAVE_API_KEY=BSAxxxxxxxxxxxxx
```

Toolpack SDK will automatically detect it when you initialize with tools enabled:

```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
});
```

Alternatively, configure it in `toolpack.config.json`:

```json
{
  "tools": {
    "additionalConfigurations": {
      "webSearch": {
        "braveApiKey": "BSAxxxxxxxxxxxxx"
      }
    }
  }
}
```

**3. Fallback Behavior**

If you configure both Tavily and Brave, Toolpack SDK will try Tavily first. If Tavily fails (rate limit, network error, etc.), it automatically falls back to Brave.

### DuckDuckGo Lite (Free, No Setup)

If you don't configure any API keys, Toolpack SDK uses DuckDuckGo Lite by default. It's:

- **Completely free**
- **No API key required**
- **Privacy-focused**
- **Works out of the box**

This is perfect for:
- Development and testing
- Personal projects
- Demos and prototypes
- Situations where you don't want to manage API keys

**No configuration needed:**

```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
  // No API keys needed - DuckDuckGo Lite is the default
});
```

## Web Fetch Tools

Beyond search, Toolpack SDK includes tools for fetching and processing web content:

### `http.get` - Fetch Raw Content

Retrieve HTML, JSON, or any content from a URL:

```typescript
const response = await toolpack.generate({
  messages: [{ 
    role: 'user', 
    content: 'Fetch the content from https://example.com/api/data' 
  }],
});
```

The LLM will call `http.get` and receive the response body.

### `web.scrape` - Extract Structured Data

Scrape web pages and extract specific information:

```typescript
const response = await toolpack.generate({
  messages: [{ 
    role: 'user', 
    content: 'Scrape the pricing table from https://example.com/pricing' 
  }],
});
```

Toolpack SDK uses intelligent scraping to extract clean, structured data from HTML.

### `web.screenshot` - Capture Visual Content

Take screenshots of web pages (useful for visual verification):

```typescript
const response = await toolpack.generate({
  messages: [{ 
    role: 'user', 
    content: 'Take a screenshot of https://example.com' 
  }],
});
```

### `web.pdf` - Convert to PDF

Generate PDFs from web pages:

```typescript
const response = await toolpack.generate({
  messages: [{ 
    role: 'user', 
    content: 'Convert https://example.com/report to PDF' 
  }],
});
```

## Real-World Use Cases

Here are some practical applications of web tools:

### Research Assistant

```typescript
// Set TOOLPACK_TAVILY_API_KEY environment variable first
const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
});

const response = await toolpack.generate({
  messages: [{ 
    role: 'user', 
    content: 'Research the latest trends in TypeScript and summarize the top 3 developments' 
  }],
});
```

The agent will:
1. Search the web using Tavily
2. Fetch relevant articles
3. Synthesize the information
4. Return a structured summary

### Competitive Intelligence

```typescript
const response = await toolpack.generate({
  messages: [{ 
    role: 'user', 
    content: 'Compare the pricing of the top 3 project management tools' 
  }],
});
```

The agent will:
1. Search for project management tools
2. Scrape pricing pages
3. Extract pricing data
4. Generate a comparison table

### Documentation Lookup

```typescript
const response = await toolpack.generate({
  messages: [{ 
    role: 'user', 
    content: 'How do I use React hooks? Fetch the official docs.' 
  }],
});
```

The agent will:
1. Search for React hooks documentation
2. Fetch the official docs
3. Extract relevant sections
4. Explain the concept with examples

## Best Practices

### 1. Use Tavily for Production

While DuckDuckGo Lite is great for development, Tavily provides:
- Better result quality
- Structured responses optimized for LLMs
- Faster response times
- More reliable uptime

### 2. Set Rate Limits

If you're using Tavily or Brave, be mindful of rate limits:

```typescript
// Set TOOLPACK_TAVILY_API_KEY or TOOLPACK_BRAVE_API_KEY environment variable first
const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
});

// Note: toolConfig for rate limiting is not directly supported in init.
// Rate limits are controlled by the search provider's API limits.
```

### 3. Cache Results

For frequently searched queries, consider caching:

```typescript
const cache = new Map();

const response = await toolpack.generate({
  messages: [{ 
    role: 'user', 
    content: 'What is the weather in San Francisco?' 
  }],
  onToolCall: (tool, args) => {
    if (tool === 'web.search') {
      const cacheKey = JSON.stringify(args);
      if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
      }
    }
  },
});
```

### 4. Handle Fallbacks Gracefully

The fallback system is automatic, but you can monitor which provider was used:

```typescript
const response = await toolpack.generate({
  messages: [{ role: 'user', content: 'Search for AI news' }],
  onToolCall: (tool, args, result) => {
    if (tool === 'web.search') {
      console.log('Search provider:', result.provider); // 'tavily', 'brave', or 'duckduckgo'
    }
  },
});
```

## Comparison: Tavily vs Brave vs DuckDuckGo Lite

| Feature | Tavily | Brave | DuckDuckGo Lite |
|---------|--------|-------|-----------------|
| **Cost** | Paid (free tier available) | Free tier (2,500/month) | Completely free |
| **API Key Required** | Yes | Yes | No |
| **Result Quality** | Excellent (AI-optimized) | Very good | Good |
| **Response Format** | Structured JSON | Structured JSON | HTML parsing |
| **Speed** | Fast | Fast | Moderate |
| **Rate Limits** | Varies by plan | 2,500/month (free) | Unlimited |
| **Best For** | Production AI apps | Personal projects, startups | Development, testing |

## What's Next?

We're working on:

- **Web monitoring**: Track changes on web pages and trigger actions
- **Batch search**: Search multiple queries in parallel
- **Custom search engines**: Configure domain-specific search
- **Web automation**: Interact with web forms and buttons

---

**Want to try web search?** Initialize Toolpack SDK with `tools: true` and start asking questions that require web access.

**Need help with API keys?** Check out the [Configuration Guide](/reference/configuration) for detailed setup instructions.

Have questions or want to share how you're using web tools? Open an issue on [GitHub](https://github.com/toolpack-ai/toolpack-sdk) or join the discussion.
