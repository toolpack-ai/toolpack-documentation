---
sidebar_position: 1
slug: /
description: "Toolpack SDK is an open source unified TypeScript SDK for building AI-powered applications. Use OpenAI, Anthropic, Gemini, or Ollama with one API. Built-in tools, streaming, workflows, and zero vendor lock-in."
keywords: [Toolpack SDK, AI SDK, TypeScript, OpenAI, Anthropic, Gemini, Ollama, LLM, tool calling, multi-provider, AI agent, Node.js]
---

# Toolpack SDK

**Core Packages:**  
[![SDK GitHub](https://img.shields.io/badge/GitHub-toolpack--sdk-blue?logo=github)](https://github.com/toolpack-ai/toolpack-sdk) [![SDK npm](https://img.shields.io/npm/v/toolpack-sdk?logo=npm&label=SDK)](https://www.npmjs.com/package/toolpack-sdk) [![Knowledge npm](https://img.shields.io/npm/v/@toolpack-sdk/knowledge?logo=npm&label=Knowledge)](https://www.npmjs.com/package/@toolpack-sdk/knowledge)

**CLI:**  
[![CLI GitHub](https://img.shields.io/badge/GitHub-toolpack--cli-green?logo=github)](https://github.com/toolpack-ai/toolpack-cli) [![CLI npm](https://img.shields.io/npm/v/@toolpack-sdk/cli?logo=npm&label=CLI)](https://www.npmjs.com/package/@toolpack-sdk/cli)

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

The **Toolpack SDK** is an **open source** unified TypeScript SDK for building AI-powered applications. It provides a single, consistent API to work with multiple AI providers - OpenAI, Anthropic, Gemini, and Ollama - without vendor lock-in.

## Why Toolpack SDK?

- **Multi-Provider Support** - Switch between OpenAI, Anthropic, Gemini, or Ollama with a single line of code
- **79 Built-in Tools** - File system, command execution, web scraping, database operations, and more
- **No Subscription Required** - Use your own API keys directly with providers
- **Three Built-in Modes** - Agent mode (full tool access), Coding mode (development-focused), and Chat mode (web-only access)
- **Workflow Engine** - Automatic planning and step-by-step execution for complex tasks
- **Fully Extensible** - Create custom providers, modes, and tools

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
| **Tools** | 79 built-in tools across 10 categories |
| **Modes** | Agent (full access), Coding (development-focused), Chat (web-only), or custom |
| **Workflows** | Direct execution or planned step-by-step |
| **Streaming** | Real-time token streaming with tool execution |
| **Multimodal** | Text + image inputs across all vision-capable providers |
| **Type Safety** | Full TypeScript support with comprehensive types |

## Getting Started

Ready to build? Head to the [Installation](/getting-started/installation) guide to get started in minutes.

