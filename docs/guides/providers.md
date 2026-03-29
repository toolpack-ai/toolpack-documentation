---
sidebar_position: 1
description: "Configure AI providers in Toolpack SDK. Use OpenAI, Anthropic, Gemini, or Ollama with multi-provider support, custom base URLs, and API key management."
keywords: [AI providers, OpenAI provider, Anthropic provider, Gemini provider, Ollama local AI, multi-provider SDK, LLM configuration]
---

# Providers

Toolpack SDK supports multiple AI providers out of the box. You use your own API keys directly - there are no subscription plans or middleman services.

## Built-in Providers

| Provider | Models | API Key Env Variable |
|----------|--------|---------------------|
| **OpenAI** | GPT-4o, o1, o3, and more | `OPENAI_API_KEY` |
| **Anthropic** | Claude Sonnet, Haiku, Opus, and more | `ANTHROPIC_API_KEY` |
| **Gemini** | Gemini Flash, Pro, and more | `GEMINI_API_KEY` |
| **Ollama** | Any locally installed model | None (local) |

## Single Provider Setup

The simplest configuration uses one provider:

```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
    provider: 'openai',
    model: 'gpt-4o',  // optional default model
});
```

The SDK automatically reads API keys from environment variables:
- `OPENAI_API_KEY` or `TOOLPACK_OPENAI_KEY`
- `ANTHROPIC_API_KEY` or `TOOLPACK_ANTHROPIC_KEY`
- `GEMINI_API_KEY` or `TOOLPACK_GEMINI_KEY`

Or pass the key directly:

```typescript
const toolpack = await Toolpack.init({
    provider: 'anthropic',
    apiKey: 'sk-ant-...',
});
```

## Multi-Provider Setup

Configure multiple providers and switch between them:

```typescript
const toolpack = await Toolpack.init({
    providers: {
        openai: { 
            /* Optional - apiKey: process.env.OPENAI_API_KEY, */
        },
        anthropic: { 
            /* Optional - apiKey: process.env.ANTHROPIC_API_KEY, */
        },
        gemini: {
            /* Optional - apiKey: process.env.GEMINI_API_KEY, */
        },
    },
    defaultProvider: 'openai',
});

// Use default provider (OpenAI)
await toolpack.generate('Hello!');

// Switch to Anthropic
toolpack.setProvider('anthropic');
await toolpack.generate('Hello from Claude!');

// Or specify per-request
await toolpack.generate(
    { messages: [{ role: 'user', content: 'Hello!' }], model: 'gpt-4o' },
    'openai'  // provider name
);
```

## Ollama (Local Models)

Ollama runs models locally - no API key required:

```typescript
const toolpack = await Toolpack.init({
    provider: 'ollama',
});

// List available local models
const providers = await toolpack.listProviders();
console.log(providers);

// Use a specific model
const response = await toolpack.generate({
    messages: [{ role: 'user', content: 'Hello!' }],
    model: 'llama3.2',
});
```

Configure a custom Ollama host:

```typescript
const toolpack = await Toolpack.init({
    providers: {
        ollama: {
            baseUrl: 'http://192.168.1.100:11434',
        },
    },
    defaultProvider: 'ollama',
});
```

## Custom Base URLs

Use OpenAI-compatible APIs (like Azure OpenAI, local proxies, or other compatible services):

```typescript
const toolpack = await Toolpack.init({
    providers: {
        openai: {
            apiKey: 'your-key',
            baseUrl: 'https://your-openai-compatible-api.com/v1',
        },
    },
    defaultProvider: 'openai',
});
```

## Listing Available Models

Get all models from all configured providers:

```typescript
// List all providers and their models
const providers = await toolpack.listProviders();
for (const provider of providers) {
    console.log(`${provider.displayName}:`);
    for (const model of provider.models) {
        console.log(`  - ${model.id} (${model.displayName})`);
    }
}

// Or get a flat list of all models
const models = await toolpack.listModels();
console.log(models);
```

## Custom Providers

You can create and inject your own provider adapters. See [Custom Providers](/guides/custom-providers) for details.
