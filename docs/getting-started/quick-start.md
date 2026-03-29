---
sidebar_position: 2
description: "Get started with Toolpack SDK in under 5 minutes. Learn to initialize providers, stream AI responses, and use built-in tools with TypeScript."
keywords: [Toolpack SDK quick start, AI app tutorial, TypeScript AI example, streaming AI responses, tool calling example]
---

# Quick Start

This guide walks you through building a simple AI assistant with Toolpack SDK.

## Basic Usage

### Initialize the SDK

```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
    provider: 'openai',     // or 'anthropic', 'gemini', 'ollama'
    model: 'gpt-4o',        // optional: specify a model
    tools: true,            // enable built-in tools
});
```

### Generate a Response

For simple one-shot completions:

```typescript
const response = await toolpack.generate({
    messages: [{ role: 'user', content: 'What is TypeScript?' }],
    model: 'gpt-4o',
});

console.log(response.content);
```

Or use the shorthand:

```typescript
const response = await toolpack.generate('What is TypeScript?');
console.log(response.content);
```

### Stream a Response

For real-time streaming (recommended for chat interfaces):

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Explain async/await in JavaScript' }],
    model: 'gpt-4o',
});

for await (const chunk of stream) {
    process.stdout.write(chunk.delta);
}
```

## Using Tools

When `tools: true` is set, the AI can automatically use built-in tools to accomplish tasks:

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,  // Enable 77 built-in tools
});

// The AI will automatically use fs.list_dir to answer this
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'List all TypeScript files in the src folder' }],
    model: 'gpt-4o',
});

for await (const chunk of stream) {
    process.stdout.write(chunk.delta);
}
```

The SDK handles tool execution automatically - you just see the final response.

## Conversation History

Maintain context across multiple messages:

```typescript
const messages = [];

// First message
messages.push({ role: 'user', content: 'My name is Alice' });
const response1 = await toolpack.generate({ messages, model: 'gpt-4o' });
messages.push({ role: 'assistant', content: response1.content });

// Follow-up message
messages.push({ role: 'user', content: 'What is my name?' });
const response2 = await toolpack.generate({ messages, model: 'gpt-4o' });
console.log(response2.content); // "Your name is Alice"
```

## Switching Providers

Change providers at runtime:

```typescript
// Initialize with multiple providers
const toolpack = await Toolpack.init({
    providers: {
        openai: { /* Optional - apiKey: process.env.OPENAI_API_KEY */ },
        anthropic: { /* Optional - apiKey: process.env.ANTHROPIC_API_KEY */ },
    },
    defaultProvider: 'openai',
});

// Use OpenAI (default)
await toolpack.generate('Hello from OpenAI!');

// Switch to Anthropic
toolpack.setProvider('anthropic');
await toolpack.generate('Hello from Anthropic!');
```

## Using Modes

Switch between Agent mode (full tool access) and Chat mode (web-only):

```typescript
// Agent mode (default) - full access to all tools
toolpack.setMode('agent');

// Chat mode - only web/HTTP tools, no filesystem or execution
toolpack.setMode('chat');
```

## Next Steps

- [Providers](/guides/providers) - Configure different AI providers
- [Modes](/guides/modes) - Understand Agent vs Chat modes
- [Tools](/tools/overview) - Explore available tools
- [Workflows](/guides/workflows) - Learn about planning and step-by-step execution
