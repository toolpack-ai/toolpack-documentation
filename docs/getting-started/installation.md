---
sidebar_position: 1
description: "Install Toolpack SDK via npm. Set up API keys for OpenAI, Anthropic, Gemini, or Ollama and start building AI-powered TypeScript applications in minutes."
keywords: [install Toolpack SDK, npm install, AI SDK setup, TypeScript AI, API key setup, OpenAI setup, Anthropic setup]
---

# Installation

## Requirements

- **Node.js** 20 or higher
- **npm**

## Install the Package

```bash
npm install toolpack-sdk
```

## Set Up API Keys

Toolpack SDK uses your own API keys - there are no subscription plans or middleman services. Set the appropriate environment variable for your provider:

```bash
# OpenAI
export OPENAI_API_KEY="sk-..."

# Anthropic
export ANTHROPIC_API_KEY="sk-ant-..."

# Google Gemini
export GEMINI_API_KEY="..."

# Ollama (no API key required - runs locally)
```

You can also pass API keys directly in code:

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    apiKey: 'sk-...',  // Direct API key
});
```

## Verify Installation

Create a simple test file:

```typescript
import { Toolpack } from 'toolpack-sdk';

async function main() {
    const toolpack = await Toolpack.init({
        provider: 'openai',
    });

    const response = await toolpack.generate('Hello, world!');
    console.log(response.content);
}

main();
```

Run it:

```bash
npx tsx test.ts
```

If you see a response from the AI, you're ready to go!

## Next Steps

- [Quick Start](/getting-started/quick-start) - Build your first AI application
- [Providers](/guides/providers) - Learn about supported AI providers
- [Tools](/tools/overview) - Explore the 90 built-in tools

## Source Code

- [GitHub - Toolpack SDK](https://github.com/toolpack-ai/toolpack-sdk)
