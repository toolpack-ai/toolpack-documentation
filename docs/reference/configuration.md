---
sidebar_position: 1
description: "Complete configuration reference for Toolpack SDK. Configure tools, logging, HITL, and environment variables via Toolpack.init()."
keywords: [Toolpack SDK configuration, environment variables, API key config, logging config, toolsConfig, hitl, SDK settings]
---

# Configuration

All Toolpack SDK configuration is passed directly to `Toolpack.init()`. There is no file-based config discovery — settings are explicit code.

## Toolpack.init() Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `provider` | string | — | Single provider shorthand (`'openai'`, `'anthropic'`, `'gemini'`, etc.) |
| `apiKey` | string | — | API key override (defaults to env var) |
| `model` | string | — | Default model name |
| `tools` | boolean | `false` | Enable built-in tools |
| `toolsConfig` | `Partial<ToolsConfig>` | `{}` | Tool behavior overrides |
| `customModes` | `ModeConfig[]` | `[]` | Additional modes to register |
| `defaultMode` | string | `'default'` | Mode to activate on init |
| `logging` | `LoggingConfig` | — | File logging settings |
| `hitl` | `HitlConfig` | — | Human-in-the-loop confirmation |
| `onToolConfirm` | callback | — | Confirmation handler (also enables HITL) |
| `contextWindow` | `ContextWindowConfig` | — | Automatic conversation pruning/summarization |

## Tools Configuration

Pass `toolsConfig` to `Toolpack.init()`:

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,
    toolsConfig: {
        enabled: true,
        autoExecute: true,
        maxToolRounds: 10,
        toolChoicePolicy: 'auto',
        enabledTools: [],
        enabledToolCategories: [],
        toolSearch: {
            enabled: false,
            alwaysLoadedTools: [],
            alwaysLoadedCategories: [],
            searchResultLimit: 5,
            cacheDiscoveredTools: true,
        },
        additionalConfigurations: {
            MY_CUSTOM_API_KEY: process.env.MY_CUSTOM_API_KEY,
        },
    },
});
```

### Tools Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | true | Enable tool system |
| `autoExecute` | boolean | true | Automatically execute tool calls |
| `maxToolRounds` | number | 5 | Max tool execution rounds per request |
| `toolChoicePolicy` | string | "auto" | "auto", "required", or "required_for_actions" |
| `enabledTools` | string[] | [] | Specific tools to enable (empty = all) |
| `enabledToolCategories` | string[] | [] | Categories to enable (empty = all) |
| `additionalConfigurations` | object | {} | Key-value config passed dynamically to custom tools via `ToolContext` |

### Tool Categories

| Category | Description |
|----------|-------------|
| `filesystem` | File system operations |
| `execution` | Command execution |
| `system` | System information |
| `network` | HTTP and web tools |
| `coding` | Code analysis tools |
| `version-control` | Git operations |
| `diff` | Diff and patch tools |
| `database` | Database operations |
| `cloud` | Cloud deployment |

### Tool Search

For large tool sets, enable on-demand tool discovery:

```typescript
toolsConfig: {
    toolSearch: {
        enabled: true,
        alwaysLoadedTools: ['fs.read_file', 'exec.run'],
        alwaysLoadedCategories: ['filesystem'],
        searchResultLimit: 5,
        cacheDiscoveredTools: true,
    },
}
```

## Logging Configuration

Pass `logging` to `Toolpack.init()`:

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    logging: {
        enabled: true,
        filePath: './toolpack-sdk.log',
        level: 'debug',
        console: false,
    },
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable file logging |
| `filePath` | string | `toolpack-sdk.log` | Log file path (relative to CWD) |
| `level` | string | `info` | Log level (`error`, `warn`, `info`, `debug`, `trace`) |
| `console` | boolean | `false` | Mirror log output to console |

Environment variables override programmatic config (highest precedence):

```bash
export TOOLPACK_SDK_LOG_FILE="./toolpack-sdk.log"   # also enables logging
export TOOLPACK_SDK_LOG_LEVEL="debug"
export TOOLPACK_SDK_LOG_ENABLED="true"
export TOOLPACK_SDK_LOG_CONSOLE="true"
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `TOOLPACK_OPENAI_KEY` | Alternative OpenAI key |
| `TOOLPACK_ANTHROPIC_KEY` | Alternative Anthropic key |
| `TOOLPACK_GEMINI_KEY` | Alternative Gemini key |
| `TOOLPACK_SDK_LOG_FILE` | Log file path (enables logging) |
| `TOOLPACK_SDK_LOG_LEVEL` | Log level override (`error`, `warn`, `info`, `debug`, `trace`) |
| `NETLIFY_AUTH_TOKEN` | Netlify deployment token |

## Context Window Management

The `contextWindow` init option controls automatic conversation pruning and summarization. When the accumulated message history approaches the model's context limit, the SDK either prunes old messages or summarizes them before the next request.

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    contextWindow: {
        enabled: true,                  // default: true
        strategy: 'prune',              // 'prune' | 'summarize' | 'fail'
        pruneThreshold: 85,             // trigger at 85% of context window
        maxMessageHistoryLength: 100,   // optional hard cap on message count
        summarizerModel: 'gpt-4.1-mini', // only used when strategy = 'summarize'
        retainSystemMessages: true,     // never prune system messages (default: true)
        outputTokenBuffer: 1.15,        // 15% safety buffer above maxOutputTokens
    },
});
```

### ContextWindowConfig fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `enabled` | boolean | `true` | Master switch for context window management |
| `strategy` | `'prune' \| 'summarize' \| 'fail'` | `'prune'` | What to do when the threshold is reached |
| `pruneThreshold` | number | `85` | Percentage of the context window that triggers cleanup |
| `maxMessageHistoryLength` | number | — | Optional cap on total message count, independent of token counting |
| `summarizerModel` | string | *(current model)* | Model to use for summarization — set to a faster/cheaper model to reduce cost |
| `retainSystemMessages` | boolean | `true` | Whether system messages are exempt from pruning |
| `outputTokenBuffer` | number | `1.15` | Safety multiplier applied to `maxOutputTokens` before computing available input space |

**Strategies:**
- `'prune'` — removes the oldest non-system messages until the history fits.
- `'summarize'` — calls the LLM to produce a summary of removed messages and inserts it as a system message before continuing.
- `'fail'` — throws an error instead of modifying the history.

---

## maxToolRounds in AgentRunOptions

`AgentRunOptions.maxToolRounds` sets a per-run hard cap on the number of tool-call rounds the agent may execute. It overrides the `toolsConfig.maxToolRounds` value from `Toolpack.init()` and bypasses the query-classifier adjustment for that specific run.

```typescript
// In your BaseAgent subclass:
const result = await this.run(prompt, {
    maxToolRounds: 1,   // single-shot: the LLM may call at most one tool round
});
```

```typescript
interface AgentRunOptions {
    /** One-off workflow override for this specific run */
    workflow?: Record<string, unknown>;

    /**
     * Hard cap on tool-call rounds for this specific run.
     * Overrides ToolsConfig.maxToolRounds and bypasses the query-classifier
     * adjustment. Use for agents that should only make one tool call per
     * invocation (e.g. single-shot routers using delegate_to_agent).
     */
    maxToolRounds?: number;
}
```

`maxToolRounds` can also be set at the `CompletionRequest` level when calling `toolpack.generate()` directly:

```typescript
await toolpack.generate({
    messages: [{ role: 'user', content: 'Which agent should handle this?' }],
    model: 'gpt-4o',
    maxToolRounds: 1,
});
```

---

## Full Example

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4o',
    tools: true,
    toolsConfig: {
        maxToolRounds: 10,
        additionalConfigurations: { MY_API_KEY: process.env.MY_API_KEY },
    },
    logging: { enabled: true, filePath: './toolpack.log', level: 'debug' },
    hitl: { enabled: true, confirmationMode: 'all' },
    onToolConfirm: async (tool) => askUser(`Allow ${tool.displayName}?`),
    customModes: [...],
    defaultMode: 'agent',
});
```

See [ToolpackInitConfig](/reference/api#toolpackinitconfig) for all options.
