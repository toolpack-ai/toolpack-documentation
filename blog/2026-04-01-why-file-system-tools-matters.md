---
slug: filesystem-tools
title: "File System Tools in Toolpack SDK: Read, Write, Search, and Manage Files with AI"
authors: [sajeer-babu]
tags: [tools, filesystem, files, api]
description: "Learn how Toolpack SDK's 18 file system tools enable AI agents to read, write, search, and manage files and directories — including powerful batch and advanced operations."
---

AI agents that can interact with the file system are genuinely useful. Whether it's reading a config file, searching through source code, or writing multiple files in one shot, **Toolpack SDK's file system tools** make it all possible out of the box.

In this post, we'll explore all 18 tools in the `filesystem` category — from core read/write operations to advanced search, glob matching, and atomic batch writes.

<!-- truncate -->

## Why File System Tools Matter

Most real-world AI workflows touch the file system. Code agents need to read source files. Documentation assistants need to write markdown. Automation pipelines need to reorganize directories. Without native file system access, your AI agent is limited to what you manually paste into the prompt.

Toolpack SDK bridges that gap:

- **Read & Write**: Read file contents, write new files, append to existing ones
- **Search & Replace**: Find text across files, do in-place replacements
- **Directory Management**: Create, move, copy, delete, and traverse directories
- **Batch Operations**: Read or write multiple files in a single efficient call

All 18 tools are available as soon as you initialize Toolpack SDK with `tools: true`.

## The Three Tool Groups

### Core Operations

These are the everyday tools that cover the full lifecycle of file and directory management:

| Tool | Parameters | Description |
|------|------------|-------------|
| `fs.read_file` | `path`, `encoding?` | Read file contents |
| `fs.write_file` | `path`, `content`, `encoding?` | Write content to file (creates parent dirs) |
| `fs.append_file` | `path`, `content`, `encoding?` | Append content to file |
| `fs.delete_file` | `path` | Delete a file |
| `fs.delete_dir` | `path`, `force?` | Delete a directory recursively |
| `fs.exists` | `path` | Check if file or directory exists |
| `fs.stat` | `path` | Get file info (size, modified date, type) |
| `fs.list_dir` | `path`, `recursive?` | List files and directories |
| `fs.create_dir` | `path`, `recursive?` | Create a directory |
| `fs.move` | `path`, `new_path` | Move or rename file/directory |
| `fs.copy` | `path`, `new_path` | Copy file or directory |

Notice that `fs.write_file` automatically creates parent directories — no need to separately call `fs.create_dir` before writing a file to a new path.

### Advanced Operations

These tools go beyond basic I/O and are especially powerful for code-aware agents:

| Tool | Parameters | Description |
|------|------------|-------------|
| `fs.read_file_range` | `path`, `start_line`, `end_line` | Read specific line range |
| `fs.search` | `path`, `query`, `recursive?` | Search for text in files |
| `fs.replace_in_file` | `path`, `search`, `replace` | Find and replace text |
| `fs.glob` | `pattern`, `cwd?` | Find files matching glob pattern |
| `fs.tree` | `path`, `depth?` | Get directory tree representation |

`fs.read_file_range` is particularly useful for large files — instead of loading a 5,000-line file into context, your agent can read only the relevant lines. `fs.tree` is great for giving an agent a quick structural overview of a project before it starts working.

### Batch Operations

When your agent needs to work with multiple files, batch tools are the efficient way to do it:

| Tool | Parameters | Description |
|------|------------|-------------|
| `fs.batch_read` | `paths`, `encoding?`, `continueOnError?` | Read multiple files at once |
| `fs.batch_write` | `files`, `encoding?`, `atomic?`, `createDirs?` | Write multiple files atomically |

`fs.batch_write` with `atomic: true` is particularly useful for scaffolding operations — if writing any file fails, the whole batch can be rolled back, keeping your project in a consistent state.

## Setting Up

File system tools require no API keys and no external services. They work with your local file system the moment you enable tools:
```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
});
```

That's it. All 18 `filesystem` tools are available to the LLM automatically.

## Optimizing with Tool Search

If you're using **tool search mode** (on-demand tool discovery), you can configure which file system tools should always be loaded versus discovered on-demand.

### Global Configuration

Set `toolSearch` in the global tools config:

```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: {
    enabled: true,
    toolSearch: {
      enabled: true,
      alwaysLoadedTools: [
        'fs.read_file',
        'fs.write_file',
        'fs.search',
        'fs.tree',
      ],
      searchResultLimit: 5,
    },
  },
});
```

This configuration:
- **Always loads** the most commonly used tools (`fs.read_file`, `fs.write_file`, `fs.search`, `fs.tree`)
- **Discovers on-demand** the other 14 tools when the AI needs them
- Reduces initial context size while keeping essential tools immediately available

### Mode-Specific Configuration

You can also configure `toolSearch` per mode. **Mode settings override global settings**:

```typescript
const customMode = {
  name: 'file-agent',
  displayName: 'File Agent',
  description: 'Specialized for file operations',
  systemPrompt: 'You are a file management specialist.',
  toolSearch: {
    alwaysLoadedCategories: ['filesystem'],  // Override: load all filesystem tools
  },
  allowedToolCategories: ['filesystem'],
  blockedToolCategories: [],
  allowedTools: [],
  blockedTools: [],
  blockAllTools: false,
};

const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: { enabled: true, toolSearch: { enabled: true } },
  customModes: [customMode],
  defaultMode: 'file-agent',
});
```

**Priority:** Mode-specific `toolSearch` settings **completely replace** the corresponding global settings (they don't merge). For example, if global has `alwaysLoadedTools: ['fs.read_file']` and mode has `alwaysLoadedTools: ['fs.tree']`, the result is `['fs.tree']` (mode wins).

### Category-Based Loading

Load the entire `filesystem` category to ensure all 18 tools are always available:

```typescript
tools: {
  enabled: true,
  toolSearch: {
    enabled: true,
    alwaysLoadedCategories: ['filesystem'],
  },
}
```

## Usage Examples

### Reading Files

The LLM automatically calls `fs.read_file` when you ask it to look at a file:
```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Show me the contents of package.json' }],
  model: 'gpt-4o',
});
```

### Searching Code

For text search across files or finding files by pattern, the LLM picks between `fs.search` and `fs.glob` depending on whether you're searching by content or by filename:
```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Find all files that import React' }],
  model: 'gpt-4o',
});
```

### Batch Operations

When your request involves multiple files, the LLM uses `fs.batch_read` to fetch them all efficiently in one tool call:
```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Read all the config files in this project' }],
  model: 'gpt-4o',
});
```

## Real-World Use Cases

### Code Agent
```typescript
const toolpack = await Toolpack.init({
  provider: 'anthropic',
  tools: true,
});

const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: 'Refactor all the utility functions in src/utils to use arrow functions'
  }],
});
```

The agent will:
1. Use `fs.tree` to understand the project structure
2. Use `fs.glob` to find all files in `src/utils`
3. Use `fs.batch_read` to read them all at once
4. Use `fs.replace_in_file` or `fs.write_file` to apply the refactor

### Documentation Generator
```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: 'Generate README.md files for each package in the packages/ directory'
  }],
});
```

The agent will:
1. Use `fs.list_dir` with `recursive: true` to discover packages
2. Use `fs.batch_read` to read each package's `package.json`
3. Use `fs.batch_write` to generate and write all README files atomically

### Project Scaffolder
```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: 'Scaffold a new Express API project with TypeScript in ./my-api'
  }],
});
```

The agent will:
1. Use `fs.create_dir` for the project root and subdirectories
2. Use `fs.batch_write` with `atomic: true` to write all boilerplate files in one shot
3. Use `fs.stat` to confirm everything was created successfully

## Best Practices

### 1. Use `fs.tree` First for Unfamiliar Projects

Before diving into file operations, let the agent get the lay of the land:
```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: 'First understand the project structure, then find all TODO comments in the source files'
  }],
});
```

This produces more accurate results than jumping straight to `fs.search`.

### 2. Prefer `fs.read_file_range` for Large Files

For codebases with large files, instruct your agent to read only the relevant sections:
```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: 'Read lines 100-200 of src/server.ts and explain what the middleware setup is doing'
  }],
});
```

This avoids flooding the context window with irrelevant content.

### 3. Use `fs.batch_write` with `atomic: true` for Scaffolding

When generating multiple files as a unit, atomicity prevents partial writes that could leave your project in a broken state:
```typescript
// The agent will set atomic: true when writing a set of interdependent files
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: 'Create the full MVC folder structure with placeholder files for a new feature called "billing"'
  }],
});
```

### 4. Combine with Web Tools for Richer Agents

File system tools pair naturally with web tools. An agent can search the web for a library's API, then write a fully configured integration file — all in one prompt:
```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: 'Look up the latest Stripe SDK setup guide and create a configured stripe.ts file in src/lib'
  }],
});
```

## Tool Summary

| Group | Tools | Count |
|-------|-------|-------|
| Core Operations | `fs.read_file`, `fs.write_file`, `fs.append_file`, `fs.delete_file`, `fs.delete_dir`, `fs.exists`, `fs.stat`, `fs.list_dir`, `fs.create_dir`, `fs.move`, `fs.copy` | 11 |
| Advanced Operations | `fs.read_file_range`, `fs.search`, `fs.replace_in_file`, `fs.glob`, `fs.tree` | 5 |
| Batch Operations | `fs.batch_read`, `fs.batch_write` | 2 |
| **Total** | | **18** |

## What's Next?

The file system tools are one of 10+ tool categories in Toolpack SDK. Coming up in this series:

- **Execution Tools**: Run shell commands, scripts, and processes
- **Git Tools**: Stage, commit, diff, and manage branches with AI
- **Database Tools**: Query and manage databases with natural language
- **Coding Tools**: Lint, format, and analyze code

---

**Want to try file system tools?** Initialize Toolpack SDK with `tools: true` and start asking your agent to read, write, and search your project files.

**Exploring other tool categories?** Check out the [Tools Overview](/tools/overview) for the full list.

Have questions or a use case you'd like to share? Open an issue on [GitHub](https://github.com/toolpack-ai/toolpack-sdk) or join the discussion.