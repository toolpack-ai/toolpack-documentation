---
sidebar_position: 1
description: "Explore the built-in tools in Toolpack SDK across 10 categories: filesystem, execution, system, HTTP, web, coding, git, diff, database, and cloud deployment."
keywords: [AI tools, built-in tools, tool calling, LLM tools, filesystem tools, HTTP tools, database tools, git tools, Toolpack SDK tools]
---

# Tools Overview

Toolpack SDK includes **built-in tools** across 10 categories. When you enable tools, the AI can automatically use them to accomplish tasks.

## Enabling Tools

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,  // Enable all built-in tools
});
```

## Tool Categories

| Category | Tools | Description |
|----------|-------|-------------|
| [File System](/tools/filesystem) | 18 | Read, write, search, and manage files |
| [Execution](/tools/execution) | 6 | Run commands and manage processes |
| [System](/tools/system) | 5 | System info, environment, disk usage |
| [HTTP](/tools/http) | 5 | HTTP requests (GET, POST, PUT, DELETE) |
| [Web](/tools/web) | 9 | Web search (Tavily/Brave/DuckDuckGo), scraping, metadata, feeds |
| [Coding](/tools/coding) | 12 | AST-aware code analysis and refactoring |
| [Git](/tools/git) | 9 | Version control operations |
| [Diff](/tools/diff) | 3 | Create and apply patches |
| [Database](/tools/database) | 7 | SQL queries and database operations |
| [Cloud](/tools/cloud) | 3 | Deploy to cloud platforms |

## How Tools Work

When the AI needs to perform an action, it automatically calls the appropriate tool:

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'List all .ts files in src/' }],
    model: 'gpt-4o',
});

// The AI will:
// 1. Recognize it needs to list files
// 2. Call fs.list_dir or fs.glob
// 3. Return the results in its response
```

The SDK handles tool execution automatically - you just see the final response.

## Tool Events

Listen to tool execution events:

```typescript
const client = toolpack.getClient();

client.on('tool:progress', (event) => {
    console.log(`Tool: ${event.toolName}`);
    console.log(`Status: ${event.status}`);  // 'started' | 'completed' | 'failed'
    if (event.result) {
        console.log(`Result: ${event.result}`);
    }
});

client.on('tool:log', (event) => {
    // Full tool execution log
    console.log(`${event.name}: ${event.duration}ms`);
});
```

## Restricting Tools

Control which tools are available using modes:

```typescript
// Only allow web tools
const webOnlyMode: ModeConfig = {
    name: 'web-only',
    displayName: 'Web Only',
    description: 'Only web access',
    systemPrompt: '...',
    allowedToolCategories: ['network'],
    blockedToolCategories: [],
    allowedTools: [],
    blockedTools: [],
    blockAllTools: false,
};

const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,
    customModes: [webOnlyMode],
    defaultMode: 'web-only',
});
```

Or block specific tools:

```typescript
const safeMode: ModeConfig = {
    name: 'safe',
    displayName: 'Safe',
    description: 'No dangerous operations',
    systemPrompt: '...',
    allowedToolCategories: [],
    blockedToolCategories: [],
    allowedTools: [],
    blockedTools: ['exec.run', 'exec.run_shell', 'fs.delete_file', 'fs.delete_dir'],
    blockAllTools: false,
};
```

## Tool Configuration

Configure tool behavior in `toolpack.config.json`:

```json
{
    "tools": {
        "enabled": true,
        "autoExecute": true,
        "maxToolRounds": 10
    }
}
```

See [Configuration](/reference/configuration) for all options.
