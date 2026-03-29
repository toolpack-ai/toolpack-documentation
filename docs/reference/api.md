---
sidebar_position: 2
description: "Complete API reference for Toolpack SDK. Covers Toolpack.init(), stream(), generate(), mode management, events, CompletionRequest/Response types, and ProviderAdapter interface."
keywords: [Toolpack SDK API, TypeScript API reference, stream API, generate API, CompletionRequest, ProviderAdapter, tool events, SDK documentation]
---

# API Reference

## Toolpack Class

The main entry point for the SDK.

### Initialization

```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init(config: ToolpackInitConfig);
```

### ToolpackInitConfig

```typescript
interface ToolpackInitConfig {
    // Single provider (shorthand)
    provider?: string;           // 'openai' | 'anthropic' | 'gemini' | 'ollama'
    apiKey?: string;             // API key for the provider
    model?: string;              // Default model
    
    // Multi-provider
    providers?: Record<string, ProviderOptions>;
    defaultProvider?: string;
    
    // Custom providers
    customProviders?: ProviderAdapter[] | Record<string, ProviderAdapter>;
    
    // Tools
    tools?: boolean;             // Enable built-in tools
    customTools?: ToolProject[]; // Custom tool projects
    
    // Modes
    customModes?: ModeConfig[];  // Custom modes
    defaultMode?: string;        // Default mode name
    modeOverrides?: Record<string, { systemPrompt?: string }>;
}
```

### Methods

#### generate()

Generate a completion (non-streaming).

```typescript
// Full request
const response = await toolpack.generate({
    messages: [{ role: 'user', content: 'Hello' }],
    model: 'gpt-4o',
});

// Shorthand
const response = await toolpack.generate('Hello');

// With specific provider
const response = await toolpack.generate(request, 'anthropic');
```

#### stream()

Stream a completion.

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Hello' }],
    model: 'gpt-4o',
});

for await (const chunk of stream) {
    process.stdout.write(chunk.delta);
}
```

#### embed()

Generate embeddings.

```typescript
const response = await toolpack.embed({
    input: 'Hello world',
    model: 'text-embedding-3-small',
});

console.log(response.embeddings); // number[][]
```

#### setProvider()

Switch the active provider.

```typescript
toolpack.setProvider('anthropic');
```

#### getProvider()

Get the current provider adapter.

```typescript
const provider = toolpack.getProvider();
```

#### loadToolProject()

Load a custom tool project dynamically at runtime.

```typescript
import { myCustomTools } from './my-tools';

await toolpack.loadToolProject(myCustomTools);
```

#### listProviders()

List all configured providers and their models.

```typescript
const providers = await toolpack.listProviders();
// [{ name, displayName, type, models }]
```

#### listModels()

Get a flat list of all models.

```typescript
const models = await toolpack.listModels();
// [{ id, displayName, capabilities, provider }]
```

#### setMode()

Switch the active mode.

```typescript
toolpack.setMode('chat');
```

#### getMode()

Get the current mode configuration.

```typescript
const mode = toolpack.getMode();
```

#### getModes()

Get all registered modes.

```typescript
const modes = toolpack.getModes();
```

#### cycleMode()

Cycle to the next mode.

```typescript
const nextMode = toolpack.cycleMode();
```

#### registerMode()

Register a custom mode at runtime.

```typescript
toolpack.registerMode(modeConfig);
```

#### getClient()

Get the underlying AIClient instance.

```typescript
const client = toolpack.getClient();
client.on('tool:progress', handler);
```

#### getWorkflowExecutor()

Get the workflow executor.

```typescript
const executor = toolpack.getWorkflowExecutor();
```

#### disconnect()

Disconnect the active provider.

```typescript
await toolpack.disconnect();
```

## Types

### Message

```typescript
interface Message {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string | MessageContent[] | null;
    name?: string;
    tool_call_id?: string;
    tool_calls?: ToolCallMessage[];
}
```

### CompletionRequest

```typescript
interface CompletionRequest {
    messages: Message[];
    model: string;
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    response_format?: 'text' | 'json_object';
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
    workflowStep?: { number: number; description: string };
}
```

### ModeConfig

```typescript
interface ModeConfig {
    name: string;
    displayName: string;
    description: string;
    systemPrompt: string;
    allowedToolCategories: string[];
    blockedToolCategories: string[];
    allowedTools: string[];
    blockedTools: string[];
    blockAllTools: boolean;
    baseContext?: { ... } | false;
    workflow?: WorkflowConfig;
}
```

### ProviderAdapter

```typescript
abstract class ProviderAdapter {
    name?: string;
    abstract generate(request: CompletionRequest): Promise<CompletionResponse>;
    abstract stream(request: CompletionRequest): AsyncGenerator<CompletionChunk>;
    abstract embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;
    async getModels(): Promise<ProviderModelInfo[]>;
    getDisplayName(): string;
}
```

### ToolContext

Context passed to custom tools during execution.

```typescript
interface ToolContext {
    workspaceRoot: string;
    config: Record<string, any>; // from toolpack.config.json
    log: (msg: string) => void;
}
```

### createToolProject

Factory function to build and validate a `ToolProject`.

```typescript
import { createToolProject, ToolDefinition, ToolProject } from 'toolpack-sdk';

const myToolProject: ToolProject = createToolProject({
    key: 'my-project',
    name: 'My Custom Tools',
    displayName: 'My Custom Tools Package',
    version: '1.0.0',
    description: 'Example custom tool project',
    category: 'custom',
    tools: [ /* ToolDefinition objects */ ]
});
```

## Events

### Toolpack Events

```typescript
toolpack.on('status', (message: string) => {});
toolpack.on('workflow:plan_created', (plan) => {});
toolpack.on('workflow:started', (plan) => {});
toolpack.on('workflow:step_start', (step, plan) => {});
toolpack.on('workflow:step_complete', (step, plan) => {});
toolpack.on('workflow:step_failed', (step, error, plan) => {});
toolpack.on('workflow:progress', (progress) => {});
toolpack.on('workflow:completed', (plan, result) => {});
toolpack.on('workflow:failed', (plan, error) => {});
```

### Client Events

```typescript
const client = toolpack.getClient();
client.on('tool:progress', (event: ToolProgressEvent) => {});
client.on('tool:log', (event: ToolLogEvent) => {});
```
