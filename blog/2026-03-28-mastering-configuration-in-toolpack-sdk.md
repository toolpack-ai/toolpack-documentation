---
slug: mastering-configuration-in-toolpack-sdk
title: "Mastering Configuration in Toolpack SDK: A Deep Dive into the Hierarchical Config System"
authors: [sajeer-babu]
tags: [configuration, architecture, best-practices]
description: "Explore Toolpack SDK's sophisticated configuration system: understand the three-tier hierarchy, config merging strategies, and how to leverage workspace, global, and base configurations for maximum flexibility."
---

Configuration is the backbone of any flexible SDK. **Toolpack SDK** implements a sophisticated hierarchical configuration system that balances simplicity for quick starts with power for complex production deployments. Whether you're integrating AI into your app or managing multiple projects, understanding how configuration works will unlock the full potential of the SDK.

Let's dive deep into how `toolpack.config.json` works, the three-tier hierarchy, and best practices for managing configurations across different environments.

<!-- truncate -->

## The Configuration Philosophy

Toolpack SDK's configuration system is built on three core principles:

1. **Sensible Defaults** - Works out of the box with zero configuration
2. **Hierarchical Overrides** - Project-specific settings override global defaults
3. **Environment Awareness** - Seamlessly integrates with environment variables

This means you can start with a simple config and progressively enhance it as your needs grow, without breaking existing setups.

## Understanding the Three-Tier Hierarchy

Toolpack uses **three distinct configuration locations**, each serving a specific purpose:

### 1. SDK Base Config (Build-Time)

**Location:** `<project-root>/toolpack.config.json`

This is your project's static configuration, committed to version control. It defines the baseline behavior for your application.

```json
{
  "systemPrompt": "You are a helpful coding assistant.",
  "tools": {
    "enabled": true,
    "maxToolRounds": 5,
    "enabledToolCategories": ["fs", "web"]
  },
  "logging": {
    "enabled": true,
    "filePath": "./toolpack.log"
  }
}
```

**Use cases:**
- Shared team settings in a repository
- Default configuration for SDK direct usage
- Template for applications built with the SDK

### 2. Global Config (User-Wide Defaults)

**Location:** `~/.toolpack/config/toolpack.config.json`

This is your personal default configuration that applies to all projects unless overridden. This location is used by applications built with the SDK (like the Toolpack CLI) for user-wide defaults.

```json
{
  "tools": {
    "additionalConfigurations": {
      "webSearch": {
        "tavilyApiKey": "tvly-your-key-here"
      }
    }
  },
  "ollama": {
    "baseUrl": "http://localhost:11434",
    "models": [
      { "model": "llama3", "label": "Llama 3" },
      { "model": "codestral", "label": "Codestral" }
    ]
  }
}
```

**Use cases:**
- Personal API keys and credentials (for applications using the SDK)
- Preferred AI models
- User-specific tool preferences across all SDK-based applications

### 3. Workspace Local Config (Highest Priority)

**Location:** `<workspace>/.toolpack/config/toolpack.config.json`

Project-specific overrides that take precedence over everything else. Perfect for per-project customization.

```json
{
  "systemPrompt": "You are a Python expert specializing in data science.",
  "tools": {
    "enabledToolCategories": ["fs", "python", "data"],
    "maxToolRounds": 10
  }
}
```

**Use cases:**
- Project-specific AI behavior
- Restricted tool access for specific projects
- Custom logging paths

## Configuration Priority & Merging

The SDK uses a **deep merge strategy** with clear priority rules:

```
Workspace Local > Global > SDK Base > Defaults
```

### How Merging Works

When loading configuration, Toolpack:

1. Starts with hardcoded defaults
2. Deep merges SDK base config
3. Deep merges global config
4. Deep merges workspace local config

**Important:** Arrays are **overwritten**, not merged. Objects are **deep merged**.

```typescript
// Example: If base config has
{
  "tools": {
    "enabledTools": ["fs.read_file", "fs.write_file"],
    "maxToolRounds": 5
  }
}

// And global config has
{
  "tools": {
    "enabledTools": ["web.search"],  // Overwrites, doesn't append!
    "autoExecute": false
  }
}

// Result:
{
  "tools": {
    "enabledTools": ["web.search"],  // Array replaced
    "maxToolRounds": 5,               // Preserved from base
    "autoExecute": false              // Added from global
  }
}
```

## Complete Configuration Schema

Here's the full structure of `toolpack.config.json`:

### Global Options

```typescript
{
  // Override the base system prompt
  "systemPrompt": "string",
  
  // Agent context configuration
  "baseContext": {
    "includeWorkingDirectory": true,
    "includeToolCategories": true,
    "custom": "Additional context here"
  },
  // Or disable entirely: "baseContext": false
  
  // Mode-specific overrides
  "modeOverrides": {
    "code": {
      "systemPrompt": "You are a senior software engineer.",
      "toolSearch": { "enabled": true }
    }
  }
}
```

### Tools Configuration

```typescript
{
  "tools": {
    // Enable/disable the entire tool system
    "enabled": true,
    
    // Auto-execute tool calls from AI
    "autoExecute": true,
    
    // Maximum tool execution rounds per request
    "maxToolRounds": 5,
    
    // Tool choice policy: "auto" | "required" | "required_for_actions"
    "toolChoicePolicy": "auto",
    
    // Maximum characters in tool results
    "resultMaxChars": 20000,
    
    // Whitelist specific tools (empty = all enabled)
    "enabledTools": ["fs.read_file", "fs.write_file"],
    
    // Whitelist tool categories (empty = all enabled)
    "enabledToolCategories": ["fs", "web"],
    
    // Tool search configuration (Anthropic-style)
    "toolSearch": {
      "enabled": false,
      "alwaysLoadedTools": ["fs.read_file", "fs.write_file"],
      "alwaysLoadedCategories": [],
      "searchResultLimit": 5,
      "cacheDiscoveredTools": true
    },
    
    // Tool-specific configurations
    "additionalConfigurations": {
      "webSearch": {
        "tavilyApiKey": "tvly-...",
        "braveApiKey": "BSA..."
      }
    }
  }
}
```

### Logging Configuration

```typescript
{
  "logging": {
    // Enable file logging (opt-in, disabled by default)
    "enabled": false,
    
    // Log file path (relative to CWD)
    "filePath": "toolpack-sdk.log",
    
    // Log level: "error" | "warn" | "info" | "debug" | "trace"
    "level": "info"
  }
}
```

### Ollama Provider Configuration

```typescript
{
  "ollama": {
    // Base URL for Ollama API
    "baseUrl": "http://localhost:11434",
    
    // Available models
    "models": [
      {
        "model": "llama3",
        "label": "Llama 3"
      },
      {
        "model": "phi3:mini",
        "label": "Phi-3 Mini"
      }
    ]
  }
}
```

## Environment Variable Integration

Toolpack automatically injects environment variables for sensitive data:

```bash
# Web search API keys
export TOOLPACK_TAVILY_API_KEY="tvly-your-key"
export TOOLPACK_BRAVE_API_KEY="BSA-your-key"

# Logging configuration
export TOOLPACK_SDK_LOG_ENABLED="true"
export TOOLPACK_SDK_LOG_FILE="./toolpack.log"
export TOOLPACK_SDK_LOG_LEVEL="debug"
```

**Priority:** Config file values **override** environment variables. This allows you to:
- Use environment variables for local development
- Override with config files for production
- Keep secrets out of version control

## Practical Configuration Patterns

### Pattern 1: Development vs Production

**Base config (committed):**
```json
{
  "tools": {
    "enabled": true,
    "maxToolRounds": 5
  }
}
```

**Local override (gitignored):**
```json
{
  "tools": {
    "maxToolRounds": 20,
    "additionalConfigurations": {
      "webSearch": {
        "tavilyApiKey": "tvly-dev-key"
      }
    }
  },
  "logging": {
    "enabled": true,
    "level": "debug"
  }
}
```

### Pattern 2: Team Collaboration

**Shared base config:**
```json
{
  "systemPrompt": "You are a TypeScript expert for our e-commerce platform.",
  "tools": {
    "enabledToolCategories": ["fs", "web", "git"],
    "maxToolRounds": 5
  }
}
```

Each team member can override in their global config:
```json
{
  "logging": {
    "enabled": true,
    "filePath": "/Users/alice/logs/toolpack.log"
  },
  "ollama": {
    "baseUrl": "http://my-ollama-server:11434"
  }
}
```

### Pattern 3: Multi-Project Setup

Use global config for shared settings:
```json
{
  "tools": {
    "additionalConfigurations": {
      "webSearch": {
        "tavilyApiKey": "tvly-shared-key"
      }
    }
  }
}
```

Override per project:
```json
// Project A: Data science
{
  "systemPrompt": "You are a Python data science expert.",
  "tools": {
    "enabledToolCategories": ["fs", "python", "data"]
  }
}

// Project B: Web development
{
  "systemPrompt": "You are a full-stack web developer.",
  "tools": {
    "enabledToolCategories": ["fs", "web", "git"]
  }
}
```

## Configuration Discovery & Status

The SDK provides utilities to check which config is active:

```typescript
import { getRuntimeConfigStatus } from 'toolpack-sdk/utils/runtime-config-loader';

const status = getRuntimeConfigStatus();
console.log(status);
// {
//   isFirstRun: false,
//   activeConfigPath: '/workspace/.toolpack/config/toolpack.config.json',
//   configSource: 'local'  // 'local' | 'global' | 'base' | 'default'
// }
```

Applications built with the SDK can use this to display configuration status to users.

## First-Run Initialization

Applications built with the SDK can implement first-run initialization using the SDK's utilities:

1. Create `~/.toolpack/config/` directory
2. Search for a template config in order:
   - Workspace local config
   - SDK base config
   - Discovered config in cwd
3. Copy the template to global config

The SDK provides `initializeGlobalConfigIfFirstRun()` to handle this automatically, ensuring a smooth onboarding experience while preserving your project's defaults.

## Best Practices

### 1. Version Control Strategy

**DO commit:**
- SDK base config (`toolpack.config.json` in root)
- Team-shared settings
- Default tool categories

**DON'T commit:**
- Workspace local config (`.toolpack/config/`)
- API keys and credentials
- User-specific paths

Add to `.gitignore`:
```
.toolpack/
```

### 2. Security

- **Never** commit API keys to version control
- Use environment variables for secrets
- Store credentials in global config (`~/.toolpack/config/`)
- Use workspace local config for project-specific overrides

### 3. Tool Management

Start restrictive, expand as needed:
```json
{
  "tools": {
    // Start with specific tools
    "enabledTools": ["fs.read_file", "fs.list_dir"],
    
    // Later, enable categories
    "enabledToolCategories": ["fs"],
    
    // Finally, enable all (empty array)
    "enabledToolCategories": []
  }
}
```

### 4. Logging Strategy

Development:
```json
{
  "logging": {
    "enabled": true,
    "level": "debug",
    "filePath": "./toolpack-dev.log"
  }
}
```

Production:
```json
{
  "logging": {
    "enabled": true,
    "level": "warn",
    "filePath": "/var/log/toolpack/app.log"
  }
}
```

## Advanced: Programmatic Configuration

You can also load and merge configs programmatically:

```typescript
import { loadFullConfig, loadToolsConfig } from 'toolpack-sdk/tools/config-loader';
import { loadRuntimeConfig } from 'toolpack-sdk/utils/runtime-config-loader';

// Load full config from specific path
const fullConfig = loadFullConfig('/path/to/toolpack.config.json');

// Load only tools section
const toolsConfig = loadToolsConfig();

// Load runtime config with full hierarchy
const runtimeConfig = loadRuntimeConfig('/workspace/path');
```

## Troubleshooting

### Config Not Loading?

1. Check file exists: `ls -la .toolpack/config/toolpack.config.json`
2. Validate JSON syntax: `cat toolpack.config.json | jq .`
3. Check permissions: `ls -l ~/.toolpack/config/`

### Settings Not Taking Effect?

Remember the priority order:
```
Workspace Local > Global > SDK Base > Defaults
```

A higher-priority config might be overriding your changes.

### Array Settings Being Merged?

Arrays are **replaced**, not merged. If you want to extend an array, you must include all values:

```json
// Base config
{ "enabledTools": ["fs.read_file", "fs.write_file"] }

// To add web.search, you must include ALL tools:
{ "enabledTools": ["fs.read_file", "fs.write_file", "web.search"] }
```

## Conclusion

Toolpack SDK's configuration system is designed to grow with your needs:

- **Zero config** to get started
- **Global defaults** for personal preferences
- **Project overrides** for team collaboration
- **Environment variables** for secrets
- **Deep merging** for flexibility

By understanding the three-tier hierarchy and leveraging the right configuration location for each use case, you can build robust, maintainable AI applications that work seamlessly across development, staging, and production environments.

---

**Questions or feedback?** Join the discussion on [GitHub](https://github.com/toolpack-ai/toolpack-sdk/discussions) or open an issue if you encounter any configuration challenges.
