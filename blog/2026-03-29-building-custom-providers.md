---
slug: custom-providers-guide
title: "Building Custom Providers for Toolpack SDK"
authors: [sajeer-babu]
tags: [providers, customization, integration]
description: "A practical guide to integrating any AI provider with Toolpack SDK. Learn how to build a custom provider adapter with working code based on real production implementations."
---

Toolpack SDK ships with built-in support for OpenAI, Anthropic, Gemini, and Ollama. But sometimes you need to integrate a different provider -- xAI's Grok, Groq, DeepSeek, Azure OpenAI, or your company's own model. Custom providers make that possible without giving up any SDK features like tool calling, streaming, or embeddings.

This guide walks through exactly how to build one, based on the real xAI adapter used in the Toolpack CLI project.

<!-- truncate -->

## What You Need to Implement

Every custom provider must implement the `ProviderAdapter` interface. There are three required methods:

- `generate(request: CompletionRequest): Promise<CompletionResponse>` -- standard completions
- `stream(request: CompletionRequest): AsyncGenerator<CompletionChunk>` -- streaming responses
- `embed(request: EmbeddingRequest): Promise<EmbeddingResponse>` -- embeddings (can throw if unsupported)

You also need a `name` property -- the SDK uses it for provider routing and will reject adapters without one.

There are two ways to create an adapter:
- **`extends ProviderAdapter`** -- inherit the abstract base class and get default implementations for optional methods like `getModels()`, `getDisplayName()`, `supportsFileUpload()`
- **`implements ProviderAdapter`** -- implement the interface yourself (more explicit, used in the CLI project)

Both work; the SDK validates adapters via duck-typing.

## Building an xAI (Grok) Adapter

Here is a complete, working adapter based on the one used in the Toolpack CLI. It uses `implements ProviderAdapter` and handles tool calling, streaming with fragment accumulation, and proper error handling.

### Class Setup and Configuration

```typescript
import {
  ProviderAdapter,
  CompletionRequest,
  CompletionResponse,
  CompletionChunk,
  EmbeddingRequest,
  EmbeddingResponse,
  ProviderModelInfo,
} from 'toolpack-sdk';

export interface XAIAdapterConfig {
  /** API key. If omitted, reads from XAI_API_KEY or TOOLPACK_XAI_KEY env vars */
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}

export class XAIAdapter implements ProviderAdapter {
  name = 'xai';
  private apiKey: string | null;
  private baseUrl: string;
  private defaultModel: string;

  constructor(config: XAIAdapterConfig = {}) {
    this.apiKey =
      config.apiKey ||
      process.env['XAI_API_KEY'] ||
      process.env['TOOLPACK_XAI_KEY'] ||
      null;
    this.baseUrl = config.baseUrl || 'https://api.x.ai/v1';
    this.defaultModel = config.defaultModel || 'grok-3-latest';
  }

  getDisplayName(): string {
    return 'xAI (Grok)';
  }

  async getModels(): Promise<ProviderModelInfo[]> {
    return [
      {
        id: 'grok-3-latest',
        displayName: 'Grok 3 (Latest)',
        capabilities: {
          chat: true,
          streaming: true,
          toolCalling: true,
          embeddings: false,
          vision: false,
        },
        contextWindow: 131072,
      },
    ];
  }

  supportsFileUpload(): boolean {
    return false;
  }

  async uploadFile(_request: {
    filePath?: string;
    data?: string | Buffer;
    filename?: string;
    purpose?: string;
  }): Promise<{ id: string; url?: string; expiresAt?: Date }> {
    throw new Error('xAI does not support file uploads.');
  }

  async deleteFile(_fileId: string): Promise<void> {
    throw new Error('xAI does not support file operations.');
  }

  private ensureApiKey(): string {
    if (!this.apiKey) {
      throw new Error(
        'No API key found for xAI. Set XAI_API_KEY or TOOLPACK_XAI_KEY ' +
        'environment variable, or pass apiKey in config.'
      );
    }
    return this.apiKey;
  }

  // methods shown below...
}
```

Key things to notice:
- `name = 'xai'` is declared as a class field, not set inside the constructor
- The API key is optional in the constructor -- it falls back to environment variables
- `ensureApiKey()` defers the error to actual usage time, so the adapter can be constructed even when keys aren't configured yet

### generate()

```typescript
async generate(request: CompletionRequest): Promise<CompletionResponse> {
  const apiKey = this.ensureApiKey();
  const model = request.model || this.defaultModel;

  const response = await fetch(`${this.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      })),
      tools: request.tools?.map(t => ({
        type: 'function',
        function: {
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters,
        },
      })),
      tool_choice: request.tool_choice,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 4096,
      top_p: request.top_p,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`xAI API error: ${response.status} - ${error}`);
  }

  const data = (await response.json()) as any;
  const choice = data.choices[0];

  let toolCalls = undefined;
  if (choice.message.tool_calls) {
    toolCalls = choice.message.tool_calls.map((tc: any) => ({
      id: tc.id,
      name: tc.function.name,
      arguments:
        typeof tc.function.arguments === 'string'
          ? JSON.parse(tc.function.arguments)
          : tc.function.arguments,
    }));
  }

  return {
    content: choice.message.content,
    usage: data.usage
      ? {
          prompt_tokens: data.usage.prompt_tokens,
          completion_tokens: data.usage.completion_tokens,
          total_tokens: data.usage.total_tokens,
        }
      : undefined,
    finish_reason:
      choice.finish_reason === 'tool_calls'
        ? 'tool_calls'
        : choice.finish_reason === 'length'
        ? 'length'
        : 'stop',
    tool_calls: toolCalls,
    raw: data,
  };
}
```

Important details:
- Messages must forward `tool_call_id` and `tool_calls` for the multi-turn tool calling loop to work
- Tool call arguments can arrive as either a string or a parsed object depending on the API -- handle both
- Map `finish_reason` to one of the SDK's values: `'stop'`, `'length'`, `'tool_calls'`, `'content_filter'`, or `'error'`

### stream()

Streaming is the most complex part. Tool calls arrive as **fragments across multiple SSE chunks** and must be accumulated before being emitted:

```typescript
async *stream(request: CompletionRequest): AsyncGenerator<CompletionChunk> {
  const apiKey = this.ensureApiKey();
  const model = request.model || this.defaultModel;

  const response = await fetch(`${this.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: request.messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
        ...(m.tool_calls ? { tool_calls: m.tool_calls } : {}),
      })),
      tools: request.tools?.map(t => ({
        type: 'function',
        function: {
          name: t.function.name,
          description: t.function.description,
          parameters: t.function.parameters,
        },
      })),
      tool_choice: request.tool_choice,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 4096,
      stream: true,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`xAI API error: ${response.status} - ${error}`);
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  // Tool calls come in fragments -- accumulate them
  const toolCallsAccumulator: Map<
    number,
    { id: string; name: string; arguments: string }
  > = new Map();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();

      if (data === '[DONE]') {
        if (toolCallsAccumulator.size > 0) {
          const toolCalls = Array.from(toolCallsAccumulator.values()).map(
            tc => ({
              id: tc.id,
              name: tc.name,
              arguments: JSON.parse(tc.arguments || '{}'),
            })
          );
          yield { delta: '', finish_reason: 'tool_calls', tool_calls: toolCalls };
        }
        return;
      }

      try {
        const chunk = JSON.parse(data);
        const delta = chunk.choices[0]?.delta;
        const finishReason = chunk.choices[0]?.finish_reason;

        if (delta?.content) {
          yield { delta: delta.content };
        }

        // Accumulate tool call fragments
        if (delta?.tool_calls) {
          for (const tc of delta.tool_calls) {
            const idx = tc.index ?? 0;
            if (!toolCallsAccumulator.has(idx)) {
              toolCallsAccumulator.set(idx, { id: '', name: '', arguments: '' });
            }
            const acc = toolCallsAccumulator.get(idx)!;
            if (tc.id) acc.id = tc.id;
            if (tc.function?.name) acc.name = tc.function.name;
            if (tc.function?.arguments) acc.arguments += tc.function.arguments;
          }
        }

        if (finishReason === 'stop') {
          yield { delta: '', finish_reason: 'stop' };
        } else if (finishReason === 'tool_calls') {
          const toolCalls = Array.from(toolCallsAccumulator.values()).map(
            tc => ({
              id: tc.id,
              name: tc.name,
              arguments: JSON.parse(tc.arguments || '{}'),
            })
          );
          yield { delta: '', finish_reason: 'tool_calls', tool_calls: toolCalls };
        } else if (finishReason === 'length') {
          yield { delta: '', finish_reason: 'length' };
        }
      } catch {
        // Ignore parse errors from partial lines
      }
    }
  }
}
```

### embed()

xAI does not support embeddings, so this method simply throws:

```typescript
async embed(_request: EmbeddingRequest): Promise<EmbeddingResponse> {
  throw new Error(
    'xAI does not support embeddings. Use OpenAI or another provider for embeddings.'
  );
}
```

You must still declare the method -- the SDK validates that all three methods exist.

## Registering Your Provider

### Array syntax (recommended)

This is what the Toolpack CLI uses. The adapter's `name` property determines the provider key:

```typescript
import { Toolpack } from 'toolpack-sdk';
import { XAIAdapter } from './custom-providers/XAIAdapter';

const toolpack = await Toolpack.init({
  providers: {
    openai: {},
    anthropic: {},
  },
  defaultProvider: 'openai',
  tools: true,
  defaultMode: 'agent',
  customProviders: [new XAIAdapter()],
});
```

Since `XAIAdapter` sets `name = 'xai'` internally, the provider is registered as `'xai'`. No need to pass the API key here -- the adapter reads it from environment variables.

### Record syntax

You can also use a record where the key becomes the provider name. If the adapter already has a `name` set, the key will not overwrite it. If `name` is not set on the adapter, the key is used:

```typescript
const toolpack = await Toolpack.init({
  customProviders: {
    'xai': new XAIAdapter(),
  },
  defaultProvider: 'xai',
});
```

### Runtime registration

You can add providers after initialization:

```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
});

// Later:
toolpack.getClient().registerProvider('xai', new XAIAdapter());
```

## Using Custom Providers

Once registered, use your custom provider like any built-in one:

```typescript
// Generate (specify provider by name)
const response = await toolpack.generate({
  model: 'grok-3-latest',
  messages: [{ role: 'user', content: 'Explain quantum computing briefly.' }],
}, 'xai');

console.log(response.content);

// Stream
const stream = toolpack.stream({
  model: 'grok-3-latest',
  messages: [{ role: 'user', content: 'Tell me a story.' }],
}, 'xai');

for await (const chunk of stream) {
  if (chunk.delta) {
    process.stdout.write(chunk.delta);
  }
}

// Switch the active provider
toolpack.setProvider('xai');

// Now generate() uses xai by default
const response2 = await toolpack.generate({
  model: 'grok-3-latest',
  messages: [{ role: 'user', content: 'Hello!' }],
});
```

### Mixing providers

You can route different tasks to different providers in a single SDK instance:

```typescript
const toolpack = await Toolpack.init({
  providers: {
    openai: {},
    anthropic: {},
  },
  customProviders: [new XAIAdapter()],
  defaultProvider: 'openai',
  tools: true,
  defaultMode: 'agent',
});

// Complex reasoning
const analysis = await toolpack.generate({
  model: 'gpt-4.1',
  messages: [{ role: 'user', content: 'Analyze this code...' }],
}, 'openai');

// Fast inference
const summary = await toolpack.generate({
  model: 'grok-3-latest',
  messages: [{ role: 'user', content: 'Summarize this.' }],
}, 'xai');

// Embeddings (from a provider that supports them)
const embedding = await toolpack.embed({
  model: 'text-embedding-3-small',
  input: 'search query',
}, 'openai');
```

## Listing Providers and Models

The SDK gives you introspection into all registered providers:

```typescript
const providers = await toolpack.listProviders();

for (const provider of providers) {
  console.log(`${provider.displayName} (${provider.type})`);
  for (const model of provider.models) {
    console.log(`  - ${model.displayName} [${model.id}]`);
  }
}
```

This calls `getModels()` on each adapter, which is why implementing it is useful even though it's optional.

## Error Handling

The SDK provides typed error classes. Use them in your adapter for consistent error handling across providers:

```typescript
import {
  AuthenticationError,
  RateLimitError,
  InvalidRequestError,
} from 'toolpack-sdk';

// In your adapter:
if (response.status === 401) {
  throw new AuthenticationError('Invalid API key');
}
if (response.status === 429) {
  throw new RateLimitError('Rate limit exceeded');
}
if (response.status === 400) {
  throw new InvalidRequestError('Bad request');
}
```

Consumers can catch these uniformly regardless of provider:

```typescript
try {
  await toolpack.generate({ model: 'grok-3-latest', messages: [...] }, 'xai');
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle 401
  } else if (error instanceof RateLimitError) {
    // Handle 429
  }
}
```

## Key Takeaways

- Implement `generate()`, `stream()`, and `embed()` -- all three are required even if one just throws
- Set `name` on your adapter (class field or constructor) -- the SDK rejects adapters without it
- Accumulate tool call fragments in `stream()` -- they arrive as partial chunks across multiple SSE events
- Forward `tool_call_id` and `tool_calls` when mapping messages -- this is required for the tool calling loop
- Prefer array syntax for registration: `customProviders: [new MyAdapter()]`
- Read API keys from environment variables with a constructor override -- follows the pattern used by all built-in providers

---
