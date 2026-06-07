---
sidebar_position: 1
description: "Configure AI providers in Toolpack SDK. Use OpenAI, Anthropic, Gemini, Ollama, or OpenRouter to power your production AI agents — custom base URLs, API key management, and zero vendor lock-in."
keywords: [AI providers, OpenAI provider, Anthropic provider, Gemini provider, Ollama local AI, OpenRouter provider, LLM configuration, production AI agents, Toolpack SDK]
---

# Providers

Toolpack SDK supports multiple AI providers out of the box. You use your own API keys directly - there are no subscription plans or middleman services.

## Built-in Providers

| Provider | Models | API Key Env Variable |
|----------|--------|---------------------|
| **OpenAI** | GPT-4o, o1, o3, and more | `OPENAI_API_KEY` |
| **Anthropic** | Claude Sonnet, Haiku, Opus, and more | `ANTHROPIC_API_KEY` |
| **Gemini** | Gemini Flash, Pro, and more | `GOOGLE_GENERATIVE_AI_KEY` |
| **Vertex AI** | Gemini 2.5/2.0/1.5 models on GCP | None (uses ADC / service account) |
| **Ollama** | Any locally installed model | None (local) |
| **OpenRouter** | 300+ models (auto-discovered) | `OPENROUTER_API_KEY` |

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
- `GOOGLE_GENERATIVE_AI_KEY` or `TOOLPACK_GEMINI_KEY`
- `OPENROUTER_API_KEY` or `TOOLPACK_OPENROUTER_KEY`

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
            /* Optional - apiKey: process.env.GOOGLE_GENERATIVE_AI_KEY, */
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

## OpenRouter

[OpenRouter](https://openrouter.ai) gives you access to 300+ models from providers like OpenAI, Anthropic, Google, Meta, and more — all through a single OpenAI-compatible API.

```typescript
const toolpack = await Toolpack.init({
    provider: 'openrouter',
    // Reads OPENROUTER_API_KEY from env, or pass directly:
    // apiKey: 'sk-or-...',
});

// OpenRouter auto-discovers all available models
const models = await toolpack.listModels();

// Use any model by its OpenRouter ID
const response = await toolpack.generate({
    model: 'anthropic/claude-sonnet-4',
    messages: [{ role: 'user', content: 'Hello!' }],
});
```

### With attribution options

```typescript
const toolpack = await Toolpack.init({
    providers: {
        openrouter: {
            apiKey: process.env.OPENROUTER_API_KEY,
            siteUrl: 'https://your-app.com',   // Optional: for OpenRouter leaderboard
            siteName: 'Your App Name',          // Optional: for OpenRouter leaderboard
        },
    },
});
```

### Capability notes

| Feature | Support |
|---------|---------|
| Chat completions | ✅ |
| Streaming | ✅ |
| Tool/function calling | ✅ |
| Embeddings | ❌ |
| Vision | ✅ (model-dependent) |
| Model discovery | Dynamic (via `/models` endpoint) |

## Google Vertex AI

[Vertex AI](https://cloud.google.com/vertex-ai) gives you access to Gemini models hosted on Google Cloud Platform with enterprise-grade infrastructure and IAM-based access control. No API key is needed — authentication uses [Application Default Credentials (ADC)](https://cloud.google.com/docs/authentication/application-default-credentials).

### Install dependencies

```bash
npm install @google-cloud/vertexai
```

### Configuration fields

| Field | Type | Description |
|-------|------|-------------|
| `projectId` | string | GCP project ID. Falls back to `TOOLPACK_VERTEXAI_PROJECT`, `VERTEX_AI_PROJECT`, or `GOOGLE_CLOUD_PROJECT` env vars. |
| `location` | string | GCP region (default: `us-central1`). Falls back to `TOOLPACK_VERTEXAI_LOCATION` or `VERTEX_AI_LOCATION`. |
| `googleAuthOptions.keyFilename` | string | Path to a service account key JSON file. |
| `googleAuthOptions.credentials` | object | Inline service account credentials object. |

When `googleAuthOptions` is omitted, ADC is used automatically (e.g. `gcloud auth application-default login` or a workload identity attached to a GKE pod).

### Supported models

| Model ID | Display name | Context window |
|----------|--------------|----------------|
| `gemini-2.5-pro-preview-05-06` | Gemini 2.5 Pro Preview | 1 M tokens |
| `gemini-2.5-flash-preview-04-17` | Gemini 2.5 Flash Preview | 1 M tokens |
| `gemini-2.0-flash-001` | Gemini 2.0 Flash | 1 M tokens |
| `gemini-1.5-pro-002` | Gemini 1.5 Pro | 2 M tokens |
| `gemini-1.5-flash-002` | Gemini 1.5 Flash | 1 M tokens |

All models support chat, streaming, tool/function calling, and vision. Embeddings are not supported by this adapter — use the `gemini` provider with `text-embedding-004` instead.

### Example — ADC (recommended)

```typescript
const toolpack = await Toolpack.init({
    provider: 'vertexai',
    projectId: 'my-gcp-project',   // or set GOOGLE_CLOUD_PROJECT env var
    location: 'us-central1',        // optional, default
});

const response = await toolpack.generate({
    model: 'gemini-2.5-flash-preview-04-17',
    messages: [{ role: 'user', content: 'Hello!' }],
});
```

### Example — Service account key file

```typescript
const toolpack = await Toolpack.init({
    provider: 'vertexai',
    projectId: 'my-gcp-project',
    googleAuthOptions: {
        keyFilename: '/path/to/service-account.json',
    },
});
```

### Example — Multi-provider setup

```typescript
const toolpack = await Toolpack.init({
    providers: {
        vertexai: {
            projectId: process.env.GOOGLE_CLOUD_PROJECT,
            location: 'europe-west4',
        },
        openai: {},
    },
    defaultProvider: 'vertexai',
});
```

### Capability notes

| Feature | Support |
|---------|---------|
| Chat completions | ✅ |
| Streaming | ✅ |
| Tool/function calling | ✅ |
| Embeddings | ❌ |
| Vision | ✅ |
| Model discovery | Static list |

---

## Custom Providers

You can create and inject your own provider adapters. See [Custom Providers](/guides/custom-providers) for details.
