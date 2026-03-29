---
sidebar_position: 4
description: "Create custom AI provider adapters for Toolpack SDK. Implement the ProviderAdapter interface to integrate any LLM service with streaming and tool calling support."
keywords: [custom AI provider, ProviderAdapter, custom LLM integration, Toolpack SDK provider, AI provider adapter, xAI integration]
---

# Custom Providers

You can create your own provider adapters to integrate any AI service with Toolpack SDK.

## Creating a Custom Provider

Implement the `ProviderAdapter` abstract class:

```typescript
import { 
    ProviderAdapter, 
    CompletionRequest, 
    CompletionResponse, 
    CompletionChunk,
    EmbeddingRequest, 
    EmbeddingResponse,
    ProviderModelInfo 
} from 'toolpack-sdk';

class MyCustomProvider extends ProviderAdapter {
    name = 'my-provider';  // Required: unique provider name
    
    private apiKey: string;
    
    constructor(apiKey: string) {
        super();
        this.apiKey = apiKey;
    }
    
    async generate(request: CompletionRequest): Promise<CompletionResponse> {
        // Implement your API call here
        const response = await fetch('https://my-api.com/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: request.messages,
                model: request.model,
            }),
        });
        
        const data = await response.json();
        
        return {
            content: data.text,
            usage: {
                prompt_tokens: data.usage?.input_tokens || 0,
                completion_tokens: data.usage?.output_tokens || 0,
                total_tokens: data.usage?.total_tokens || 0,
            },
        };
    }
    
    async *stream(request: CompletionRequest): AsyncGenerator<CompletionChunk> {
        // Implement streaming here
        const response = await fetch('https://my-api.com/chat/stream', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: request.messages,
                model: request.model,
                stream: true,
            }),
        });
        
        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');
        
        const decoder = new TextDecoder();
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = decoder.decode(value);
            yield { delta: text };
        }
    }
    
    async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
        // Implement embeddings (or throw if not supported)
        throw new Error('Embeddings not supported by this provider');
    }
    
    // Optional: provide model list
    async getModels(): Promise<ProviderModelInfo[]> {
        return [
            {
                id: 'my-model-v1',
                displayName: 'My Model v1',
                capabilities: {
                    chat: true,
                    streaming: true,
                    toolCalling: false,
                    embeddings: false,
                    vision: false,
                },
            },
        ];
    }
    
    // Optional: customize display name
    getDisplayName(): string {
        return 'My Custom Provider';
    }
}
```

## Registering Custom Providers

### Array Syntax

```typescript
const myProvider = new MyCustomProvider('api-key');

const toolpack = await Toolpack.init({
    customProviders: [myProvider],
    // No need to specify 'provider' - first custom provider becomes default
});
```

### Record Syntax

```typescript
const toolpack = await Toolpack.init({
    customProviders: {
        'my-provider': new MyCustomProvider('api-key'),
        'another-provider': new AnotherProvider('key'),
    },
    defaultProvider: 'my-provider',
});
```

### Mixing with Built-in Providers

```typescript
const toolpack = await Toolpack.init({
    providers: {
        openai: { apiKey: process.env.OPENAI_API_KEY },
    },
    customProviders: {
        'my-provider': new MyCustomProvider('api-key'),
    },
    defaultProvider: 'openai',
});

// Use built-in
await toolpack.generate('Hello!');

// Switch to custom
toolpack.setProvider('my-provider');
await toolpack.generate('Hello from custom!');
```

## Required Methods

Your custom provider must implement these methods:

| Method | Description |
|--------|-------------|
| `generate(request)` | Generate a complete response |
| `stream(request)` | Stream response chunks |
| `embed(request)` | Generate embeddings |

## Optional Methods

| Method | Description |
|--------|-------------|
| `getModels()` | Return available models |
| `getDisplayName()` | Return human-readable name |

## Request and Response Types

### CompletionRequest

```typescript
interface CompletionRequest {
    messages: Message[];
    model: string;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    stream?: boolean;
    tools?: ToolCallRequest[];
    tool_choice?: 'auto' | 'none' | 'required';
    signal?: AbortSignal;
}
```

### CompletionResponse

```typescript
interface CompletionResponse {
    content: string | null;
    usage?: Usage;
    finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
    tool_calls?: ToolCallResult[];
}
```

### CompletionChunk

```typescript
interface CompletionChunk {
    delta: string;
    usage?: Usage;
    finish_reason?: 'stop' | 'length' | 'tool_calls' | 'content_filter' | 'error';
    tool_calls?: ToolCallResult[];
}
```

## Tool Calling Support

If your provider supports function/tool calling, handle the `tools` and `tool_choice` fields in the request, and return `tool_calls` in the response:

```typescript
async generate(request: CompletionRequest): Promise<CompletionResponse> {
    // Pass tools to your API
    const response = await this.callApi({
        messages: request.messages,
        model: request.model,
        tools: request.tools?.map(t => ({
            type: 'function',
            function: t.function,
        })),
        tool_choice: request.tool_choice,
    });
    
    // Return tool calls if present
    return {
        content: response.text,
        tool_calls: response.tool_calls?.map(tc => ({
            id: tc.id,
            name: tc.function.name,
            arguments: JSON.parse(tc.function.arguments),
        })),
        finish_reason: response.tool_calls ? 'tool_calls' : 'stop',
    };
}
```

The SDK will automatically execute tools and continue the conversation.
