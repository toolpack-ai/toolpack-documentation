---
slug: working-with-providers-in-toolpack-sdk
title: "Working with AI Providers in Toolpack SDK"
authors: [sajeer-babu]
tags: [providers, openai, anthropic, gemini, ollama, configuration]
description: "A practical guide to configuring and switching between AI providers in Toolpack SDK — single provider, multi-provider, Ollama, custom base URLs, runtime switching, and model discovery."
---

Toolpack SDK supports four built-in AI providers out of the box: **OpenAI**, **Anthropic**, **Gemini**, and **Ollama**. You use your own API keys directly — no subscriptions, no middleman. This post covers everything you need to know about configuring providers, switching between them at runtime, and listing available models.

<!-- truncate -->

## Single Provider Setup

The quickest way to get started is the single-provider shorthand. Pass a `provider` name to `Toolpack.init()` and you're done:

```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
    provider: 'openai',
});

const response = await toolpack.generate('What is the capital of France?');
console.log(response.content);
```

You can also pass a default `model` to avoid specifying it on every request:

```typescript
const toolpack = await Toolpack.init({
    provider: 'anthropic',
    model: 'claude-sonnet-4-6',
});
```

### How API Keys Are Resolved

When you don't pass an `apiKey` directly, the SDK resolves it from environment variables. The lookup order is:

1. `apiKey` in the init config (highest priority)
2. `TOOLPACK_<PROVIDER>_KEY` (e.g., `TOOLPACK_OPENAI_KEY`)
3. `<PROVIDER>_API_KEY` (e.g., `OPENAI_API_KEY`)

So for each provider the variables are:

| Provider   | Primary env var          | Fallback env var         |
|------------|--------------------------|--------------------------|
| OpenAI     | `TOOLPACK_OPENAI_KEY`    | `OPENAI_API_KEY`         |
| Anthropic  | `TOOLPACK_ANTHROPIC_KEY` | `ANTHROPIC_API_KEY`      |
| Gemini     | `TOOLPACK_GEMINI_KEY`    | `GEMINI_API_KEY`         |
| Ollama     | *(no key needed)*        | *(local inference)*      |

If no key is found for a cloud provider, the SDK throws immediately with a descriptive message telling you exactly which env var to set.

You can always pass the key explicitly when you prefer:

```typescript
const toolpack = await Toolpack.init({
    provider: 'anthropic',
    apiKey: process.env.MY_CUSTOM_KEY,
});
```

## Multi-Provider Setup

When you need to route different tasks to different providers, use the `providers` object along with a `defaultProvider`:

```typescript
const toolpack = await Toolpack.init({
    providers: {
        openai: {},
        anthropic: {},
        gemini: {},
    },
    defaultProvider: 'openai',
});
```

API keys are still resolved from environment variables per-provider. You can also pass them inline:

```typescript
const toolpack = await Toolpack.init({
    providers: {
        openai: { apiKey: 'sk-...' },
        anthropic: { apiKey: 'sk-ant-...' },
    },
    defaultProvider: 'openai',
});
```

### Generating with a Specific Provider

Once multiple providers are registered, you can direct individual requests to any of them by passing the provider name as the second argument to `generate()` or `stream()`:

```typescript
// Uses defaultProvider (openai)
const r1 = await toolpack.generate('Summarize this text...');

// Explicitly use Anthropic for this request
const r2 = await toolpack.generate(
    { messages: [{ role: 'user', content: 'Review this code...' }], model: 'claude-sonnet-4-6' },
    'anthropic'
);

// Explicitly use Gemini
const r3 = await toolpack.generate(
    { messages: [{ role: 'user', content: 'Translate to Spanish...' }], model: 'gemini-3-flash-preview' },
    'gemini'
);
```

### Switching the Active Provider

`setProvider()` changes the default for all subsequent calls. This is useful when your application transitions between tasks that favour different models:

```typescript
// Switch everything to Anthropic
toolpack.setProvider('anthropic');

// Now generate() uses Anthropic by default
const response = await toolpack.generate('Hello from Claude!');

// Switch back
toolpack.setProvider('openai');
```

If the name you pass to `setProvider()` doesn't match a registered provider, it throws immediately.

## Ollama — Running Models Locally

Ollama lets you run models on your own machine without an API key. Just set `provider: 'ollama'` and point the SDK at your Ollama instance:

```typescript
const toolpack = await Toolpack.init({
    provider: 'ollama',
});

const response = await toolpack.generate({
    messages: [{ role: 'user', content: 'Explain recursion.' }],
    model: 'llama3.2',
});
```

The SDK connects to `http://localhost:11434` by default. To use a remote Ollama host, pass a `baseUrl`:

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

You can also configure the base URL globally in `toolpack.config.json`, so you don't have to repeat it in code:

```json
{
  "ollama": {
    "baseUrl": "http://192.168.1.100:11434"
  }
}
```

The precedence for Ollama's base URL is: `baseUrl` in init config → `ollama.baseUrl` in config file → `http://localhost:11434`.

### Listing Available Ollama Models

Unlike cloud providers, Ollama discovers models dynamically by querying `/api/tags` from the running Ollama daemon. This means `listProviders()` and `listModels()` (covered below) reflect whatever models are currently installed on your machine.

## Custom Base URLs

OpenAI and Anthropic both support a `baseUrl` override, which lets you point the SDK at any OpenAI-compatible or Anthropic-compatible endpoint — such as a local proxy, an Azure OpenAI deployment, or a self-hosted gateway:

```typescript
const toolpack = await Toolpack.init({
    providers: {
        openai: {
            apiKey: 'your-key',
            baseUrl: 'https://your-openai-compatible-api.com/v1',
        },
        anthropic: {
            apiKey: 'your-key',
            baseUrl: 'https://your-anthropic-proxy.com',
        },
    },
    defaultProvider: 'openai',
});
```

> **Note:** Gemini does not support a custom `baseUrl` — it always connects to Google's API.

## Discovering Available Models

### List All Providers

`listProviders()` returns metadata about every registered provider, including its available models:

```typescript
const providers = await toolpack.listProviders();

for (const provider of providers) {
    console.log(`${provider.displayName} [${provider.type}]`);
    for (const model of provider.models) {
        console.log(`  - ${model.id} (${model.displayName})`);
    }
}
```

Each provider entry has:
- `name` — registration key (e.g., `'openai'`)
- `displayName` — human-readable label
- `type` — `'built-in'` or `'custom'`
- `models` — array of model objects

If a provider is unreachable or has no models configured, `listProviders()` logs a warning and returns an empty `models` array for that provider rather than throwing.

### Flat Model List

When you just need a list of all models across all providers, `listModels()` gives you a flat array with each model's `provider` field filled in:

```typescript
const models = await toolpack.listModels();

for (const model of models) {
    console.log(`${model.provider}/${model.id} — ${model.displayName}`);
    console.log(`  Chat: ${model.capabilities.chat}, Streaming: ${model.capabilities.streaming}`);
}
```

Each model object includes a `capabilities` field with boolean flags: `chat`, `streaming`, `toolCalling`, `embeddings`, `vision`, and optionally `reasoning` and `fileUpload`.

## Mixing Providers in a Real Application

A common pattern is to use a fast, cost-efficient model for routine tasks and a more capable model for complex ones — routing per request:

```typescript
const toolpack = await Toolpack.init({
    providers: {
        openai: {},
        anthropic: {},
    },
    defaultProvider: 'openai',
    tools: true,
    defaultMode: 'agent',
});

// Quick classification — use a fast model
const label = await toolpack.generate(
    { messages: [{ role: 'user', content: 'Classify this support ticket: ...' }], model: 'gpt-4.1-mini' },
    'openai'
);

// In-depth code review — use a stronger model
const review = await toolpack.generate(
    { messages: [{ role: 'user', content: 'Review this PR diff: ...' }], model: 'claude-opus-4-6' },
    'anthropic'
);

// Embeddings
const embedding = await toolpack.embed(
    { model: 'text-embedding-3-small', input: 'search query' },
    'openai'
);
```

## Error Handling

The SDK exports typed error classes so you can handle provider failures consistently regardless of which underlying API is involved:

```typescript
import {
    AuthenticationError,
    RateLimitError,
    InvalidRequestError,
    ConnectionError,
} from 'toolpack-sdk';

try {
    const response = await toolpack.generate('Hello!', 'anthropic');
} catch (error) {
    if (error instanceof AuthenticationError) {
        console.error('Check your API key.');
    } else if (error instanceof RateLimitError) {
        console.error('Rate limited. Retry after:', error.retryAfter);
    } else if (error instanceof ConnectionError) {
        console.error('Could not reach the provider.');
    } else if (error instanceof InvalidRequestError) {
        console.error('Bad request:', error.message);
    } else {
        throw error;
    }
}
```

All error classes extend the base `SDKError`, which includes a `code` string and optional `statusCode` — useful for logging and alerting.

## Going Further

If none of the four built-in providers fits your needs, you can build a custom adapter by extending `ProviderAdapter` and registering it via `customProviders`. See the [Building Custom Providers](https://toolpacksdk.com/blog/custom-providers-guide) post for a complete walkthrough using a real xAI (Grok) adapter.

---

**Questions or feedback?** Open an issue or start a discussion on [GitHub](https://github.com/toolpack-ai/toolpack-sdk/discussions).
