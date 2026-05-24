---
sidebar_position: 1
description: "Complete configuration reference for Toolpack SDK. Configure tools, logging, modes, system prompts, and environment variables via toolpack.config.json or programmatically."
keywords: [Toolpack SDK configuration, toolpack.config.json, environment variables, API key config, logging config, mode overrides, SDK settings]
---

# Configuration

Toolpack SDK supports a hierarchical configuration system with multiple layers.

## Configuration Hierarchy

Configuration is loaded and merged in the following priority order (highest priority first):

| Priority | Location | Description |
|----------|----------|-------------|
| 1 (highest) | `.toolpack/config/toolpack.config.json` | Workspace-local config |
| 2 | `~/.toolpack/config/toolpack.config.json` | Global user config |
| 3 (lowest) | `toolpack.config.json` | Project root config |

Values from higher-priority configs override lower-priority ones. Objects are deep-merged, arrays are replaced.

### Example

```
~/.toolpack/config/toolpack.config.json (global)
{
    "tools": { "enabled": true, "maxToolRounds": 5 }
}

.toolpack/config/toolpack.config.json (local)
{
    "tools": { "maxToolRounds": 20 }
}

# Result: tools.enabled = true, tools.maxToolRounds = 20
```

## Configuration File

Create `toolpack.config.json` in your project root (or use the hierarchy above):

```json
{
    "systemPrompt": "You are a helpful coding assistant.",
    "baseContext": true,
    "tools": {
        "enabled": true,
        "autoExecute": true,
        "maxToolRounds": 10
    },
    "logging": {
        "enabled": false,
        "level": "info"
    }
}
```

## Top-Level Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `systemPrompt` | string | - | Custom system prompt for all requests |
| `baseContext` | boolean | true | Include working directory and tool info in context |
| `disableBaseContext` | boolean | false | Disable base context injection |
| `modeOverrides` | object | - | Override system prompts per mode |
| `logging` | object | - | Logging configuration |

## Tools Configuration

```json
{
    "tools": {
        "enabled": true,
        "autoExecute": true,
        "maxToolRounds": 10,
        "toolChoicePolicy": "auto",
        "enabledTools": [],
        "enabledToolCategories": [],
        "intelligentToolDetection": {
            "enabled": false,
            "maxFollowUpMessages": 5
        },
        "toolSearch": {
            "enabled": false,
            "alwaysLoadedTools": [],
            "alwaysLoadedCategories": [],
            "searchResultLimit": 5,
            "cacheDiscoveredTools": true
        },
        "additionalConfigurations": {
            "MY_CUSTOM_API_KEY": "123456"
        }
    }
}
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

### Intelligent Tool Detection

When enabled, the SDK analyzes conversation context to decide if tools are needed:

```json
{
    "tools": {
        "intelligentToolDetection": {
            "enabled": true,
            "maxFollowUpMessages": 5
        }
    }
}
```

### Tool Search

For large tool sets, enable on-demand tool discovery:

```json
{
    "tools": {
        "toolSearch": {
            "enabled": true,
            "alwaysLoadedTools": ["fs.read_file", "exec.run"],
            "alwaysLoadedCategories": ["filesystem"],
            "searchResultLimit": 5,
            "cacheDiscoveredTools": true
        }
    }
}
```

## Logging Configuration

```json
{
    "logging": {
        "enabled": true,
        "filePath": "./toolpack-sdk.log",
        "verbose": true
    }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | false | Enable file logging |
| `filePath` | string | `./toolpack-sdk.log` | Log file path |
| `level` | string | `info` | Log level (`error`, `warn`, `info`, `debug`, `trace`) |

You can also enable logging via environment variables:

```bash
# Set a log file path (also enables logging)
export TOOLPACK_SDK_LOG_FILE="./toolpack-sdk.log"

# Override log level
export TOOLPACK_SDK_LOG_LEVEL="debug"
```

## Mode Overrides

Override system prompts for specific modes:

```json
{
    "modeOverrides": {
        "agent": {
            "systemPrompt": "You are a careful coding assistant. Always explain before making changes."
        },
        "chat": {
            "systemPrompt": "You are a friendly research assistant."
        }
    }
}
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

`AgentRunOptions.maxToolRounds` sets a per-run hard cap on the number of tool-call rounds the agent may execute. It overrides the `tools.maxToolRounds` value in `toolpack.config.json` and bypasses the query-classifier adjustment for that specific run.

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

## Programmatic Configuration

All options can also be set programmatically:

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    apiKey: 'sk-...',
    model: 'gpt-4o',
    tools: true,
    customModes: [...],
    defaultMode: 'agent',
    modeOverrides: {
        agent: { systemPrompt: '...' }
    },
});
```

See [ToolpackInitConfig](/reference/api#toolpackinitconfig) for all options.
