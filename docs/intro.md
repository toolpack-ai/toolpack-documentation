---
sidebar_position: 1
slug: /
description: "Toolpack SDK is the open source TypeScript SDK for building production AI agents — 100+ built-in tools, 8 channel integrations, AgentMind persistent cognitive layer, and Knowledge/RAG."
keywords: [Toolpack SDK, TypeScript AI SDK, production AI agents, AI agent framework, Slack AI agent, Discord bot, Telegram bot, AgentMind, RAG, knowledge base, OpenAI, Anthropic, Gemini, Ollama, LLM, tool calling, Node.js]
---

# Toolpack SDK

**Core Packages:**  
[![SDK GitHub](https://img.shields.io/badge/GitHub-toolpack--sdk-blue?logo=github)](https://github.com/toolpack-ai/toolpack-sdk) [![SDK npm](https://img.shields.io/npm/v/toolpack-sdk?logo=npm&label=SDK)](https://www.npmjs.com/package/toolpack-sdk) [![Knowledge npm](https://img.shields.io/npm/v/@toolpack-sdk/knowledge?logo=npm&label=Knowledge)](https://www.npmjs.com/package/@toolpack-sdk/knowledge) [![Agents npm](https://img.shields.io/npm/v/@toolpack-sdk/agents?logo=npm&label=Agents)](https://www.npmjs.com/package/@toolpack-sdk/agents)

**Organizations:**  
[![GitHub Org](https://img.shields.io/badge/GitHub-toolpack--ai-black?logo=github)](https://github.com/toolpack-ai) [![npm Org](https://img.shields.io/badge/npm-@toolpack--sdk-orange?logo=npm)](https://www.npmjs.com/org/toolpack-sdk)

<div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', marginBottom: '24px'}}>
  <iframe
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
    src="https://www.youtube.com/embed/iepIyGe0tao"
    title="Toolpack SDK Demo"
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  />
</div>

**Toolpack SDK** is the open source **TypeScript SDK for building production AI agents**. It gives you everything you need in one package — tools, channels, cognition, and knowledge — without stitching together five different libraries.

## Why Toolpack SDK?

- **Production-Ready Agents** - Build agents that run on Slack, Discord, Telegram, SMS, Email, Webhook, scheduled jobs, and MCP — 8 channel integrations out of the box
- **100+ Built-in Tools** - File system, Kubernetes, command execution, web scraping, GitHub, database, diff, cloud, and more across 12 categories
- **AgentMind Cognitive Layer** - Persistent goals, beliefs, and reflections that survive across runs — the only TypeScript SDK with a built-in cognitive memory model
- **Knowledge / RAG** - Web crawling, REST API ingestion, hybrid semantic + keyword search, and streaming indexing across 6 source types
- **Multi-Provider** - OpenAI, Anthropic, Gemini, Ollama, OpenRouter — switch with one line, no vendor lock-in
- **Workflow Engine** - Automatic planning and step-by-step execution for complex multi-tool tasks
- **Extensible at Every Layer** - Custom tools, channels, provider adapters, agents, modes, and interceptors — if Toolpack doesn't have it built in, you can build it in using the same interfaces the built-in components use

## Quick Example

```typescript
import { Toolpack } from 'toolpack-sdk';

// Initialize with your preferred provider
const toolpack = await Toolpack.init({
    provider: 'openai',  // or 'anthropic', 'gemini', 'ollama'
    tools: true,         // Enable built-in tools
});

// Stream a response
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'List the files in the current directory' }],
    model: 'gpt-4o',
});

for await (const chunk of stream) {
    process.stdout.write(chunk.delta);
}
```

## Features at a Glance

| Feature | Description |
|---------|-------------|
| **Providers** | OpenAI, Anthropic, Gemini, Ollama + custom providers |
| **Tools** | 100+ built-in tools across 12 categories |
| **Modes** | Agent (full access), Coding (development-focused), Chat (web-only), or custom |
| **Workflows** | Direct execution or planned step-by-step |
| **Streaming** | Real-time token streaming with tool execution |
| **Multimodal** | Text + image inputs across all vision-capable providers |
| **Type Safety** | Full TypeScript support with comprehensive types |

## Getting Started

Ready to build? Head to the [Installation](/getting-started/installation) guide to get started in minutes.

