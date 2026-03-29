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
