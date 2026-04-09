---
slug: system-tools
title: "System Tools in Toolpack SDK: Query OS Info, Environment, and Disk Usage"
authors: [sajeer-babu]
tags: [tools, system, environment, os, disk-usage]
description: "Learn how Toolpack SDK's 5 system tools enable AI agents to query system information, manage environment variables, check disk usage, and get the current working directory."
---

AI agents that modify files or run commands need to know where they are. What OS they're on. How much disk is left. What env vars are set. Without that context, you get an agent that assumes Linux paths on Windows or writes a 2GB file to a disk with 500MB free.

**Toolpack SDK's system tools** give your agents the context they need to operate safely and effectively across different environments.

<!-- truncate -->

## Why System Tools Matter

Most AI agents eventually need to interact with the underlying system. A code refactoring agent needs to know if it's on Windows or Linux before suggesting path changes. An automation script needs to check available disk space before downloading large files. A deployment agent needs to read environment variables to configure services correctly.

Without system context, agents make dangerous assumptions:

- Using `/` as a path separator on Windows
- Writing temp files to the wrong location
- Running out of disk space mid-operation
- Missing critical environment configuration

Toolpack SDK's 5 system tools solve these problems:

- **System Information**: Get platform, architecture, CPU, memory, and more
- **Working Directory**: Know exactly where the agent is operating
- **Environment Variables (Read)**: Read env vars for the current session
- **Environment Variables (Set)**: Set env vars for the current session only
- **Disk Usage**: Check available space before operations

## The Five System Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `system.info` | - | Get OS, CPU, memory, architecture, hostname, uptime, and Node version |
| `system.cwd` | - | Get the current working directory of the process |
| `system.disk_usage` | `path?` | Get disk usage information for a given path |
| `system.env` | `key?` | Get environment variable(s). Returns all if key is omitted |
| `system.set_env` | `key`, `value` | Set environment variable for the current session only |

All 5 tools are available as soon as you initialize Toolpack SDK with `tools: true`.

## Setting Up

System tools require no API keys and no external services. They work with your local system the moment you enable tools:

```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
});
```

That's it. All 5 `system` tools are available to the LLM automatically.

## Usage Examples

### Query System Information

The `system.info` tool returns comprehensive system details:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'What operating system am I running?' }],
  model: 'gpt-4o',
});
// AI uses system.info
```

Returns:
```json
{
  "platform": "darwin",
  "arch": "arm64",
  "release": "23.4.0",
  "hostname": "macbook-pro",
  "uptime": 86400,
  "cpus": {
    "model": "Apple M3 Pro",
    "count": 12
  },
  "memory": {
    "total": 34359738368,
    "free": 8589934592,
    "used": 25769803776
  },
  "homedir": "/Users/sajeer",
  "tmpdir": "/var/folders/abc",
  "nodeVersion": "v20.11.0"
}
```

### Get Current Working Directory

Use `system.cwd` when the agent needs to know its location:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'What directory are we in?' }],
  model: 'gpt-4o',
});
// AI uses system.cwd
```

### Check Disk Usage

The `system.disk_usage` tool checks available space with cross-platform fallback logic:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'How much disk space is available?' }],
  model: 'gpt-4o',
});
// AI uses system.disk_usage
```

Returns (format varies by platform):
```json
{
  "path": "/",
  "filesystem": "statfs",
  "size": "500.0GB",
  "used": "320.5GB",
  "available": "179.5GB",
  "usePercent": "64%"
}
```

Cross-platform implementation:
- **Primary**: `fs.statfsSync()` for fast, native filesystem queries
- **Windows fallback**: PowerShell `Get-PSDrive` when statfs fails
- **Unix fallback**: `df -h` command for POSIX systems

### Read Environment Variables

The `system.env` tool can read a single variable or dump all of them sorted:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'What is my NODE_ENV set to?' }],
  model: 'gpt-4o',
});
// AI uses system.env with key: 'NODE_ENV'
```

Returns: `{ "NODE_ENV": "development" }`

Or get all environment variables:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Show me all environment variables' }],
  model: 'gpt-4o',
});
// AI uses system.env without key parameter
```

Returns all variables sorted alphabetically by key.

### Set Environment Variables

The `system.set_env` tool sets variables for the current session only — no persistence across restarts:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Set DEBUG to true for this session' }],
  model: 'gpt-4o',
});
// AI uses system.set_env with key: 'DEBUG', value: 'true'
```

This is useful when the agent needs to configure something temporarily without touching the user's shell profile.

## Real-World Use Cases

### Safe File Operations

Check disk space before writing large files:

```typescript
const toolpack = await Toolpack.init({
  provider: 'anthropic',
  tools: true,
});

const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Download a 2GB dataset to ./data/dataset.zip.
    
    First check if there's enough disk space available.
    If not, report the error and don't attempt the download.`
  }],
  model: 'claude-sonnet-4',
});
```

### Environment-Aware Code Generation

Generate platform-specific code:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Create a Node.js script that:
    1. Uses system.info to detect the platform
    2. Sets the correct temp directory path (os.tmpdir() already handles this, but show detection)
    3. Uses appropriate path separators for the detected OS`
  }],
  model: 'gpt-4o',
});
```

### Configuration Validation

Verify environment before deployment:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Check if this system is ready for deployment:
    1. Verify NODE_ENV is set
    2. Check DATABASE_URL is configured
    3. Ensure at least 1GB of free disk space
    4. Confirm we're in the correct working directory (/app)`
  }],
  model: 'gpt-4o',
});
```

## Best Practices

### 1. Check Disk Space Before Large Operations

Always verify available space before downloading or writing large files:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Before downloading the 5GB model file, use system.disk_usage to check available space. 
    
    If less than 6GB is available, abort and warn the user.`
  }],
  model: 'gpt-4o',
});
```

### 2. Use Platform Detection for Path Logic

When generating paths or commands, consider the platform:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Create a backup script. 
    
    Use system.info to detect the platform, then generate the appropriate 
    backup command (tar for Unix, robocopy for Windows).`
  }],
  model: 'gpt-4o',
});
```

### 3. Prefer Session-Only Environment Changes

Use `system.set_env` for temporary configuration. For persistent changes, instruct the user to update their shell profile:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Set LOG_LEVEL to debug for this session only.
    
    Report: "LOG_LEVEL set to debug for this session. 
    To make this permanent, add export LOG_LEVEL=debug to your ~/.bashrc or ~/.zshrc"`
  }],
  model: 'gpt-4o',
});
```

### 4. Combine with Filesystem Tools for Context

System tools pair naturally with filesystem tools. An agent can check the working directory, then explore files:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `First confirm the working directory with system.cwd, 
    then use fs.tree to explore the project structure`
  }],
  model: 'gpt-4o',
});
```

## Tool Summary

| Tool | Use Case |
|------|----------|
| `system.info` | Detect platform, architecture, CPU, memory, Node version |
| `system.cwd` | Confirm working directory for path-sensitive operations |
| `system.disk_usage` | Verify available space before writes |
| `system.env` | Read configuration from environment |
| `system.set_env` | Set temporary environment variables |

## What's Next?

The system tools are one of 10+ tool categories in Toolpack SDK. Coming up in this series:

- **Execution Tools**: Run shell commands, scripts, and processes
- **Git Tools**: Stage, commit, diff, and manage branches with AI
- **Database Tools**: Query and manage databases with natural language
- **Coding Tools**: Lint, format, and analyze code

---

**Want to try system tools?** Initialize Toolpack SDK with `tools: true` and start asking your agent about the system it's running on.

**Exploring other tool categories?** Check out the [Tools Overview](/tools/overview) for the full list.

Have questions or a use case you'd like to share? Open an issue on [GitHub](https://github.com/toolpack-ai/toolpack-sdk) or join the discussion.
