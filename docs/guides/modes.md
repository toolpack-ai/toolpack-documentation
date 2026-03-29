---
sidebar_position: 2
description: "Learn about Agent and Chat modes in Toolpack SDK. Agent mode provides full tool access, while Chat mode restricts to web-only. Switch modes dynamically at runtime."
keywords: [AI modes, agent mode, chat mode, tool access control, Toolpack SDK modes, AI assistant modes]
---

# Modes

Modes control what the AI can do. They define which tools are available and shape the AI's behavior through system prompts.

## Built-in Modes

Toolpack SDK includes two built-in modes:

### Agent Mode (Default)

Full autonomous access to all tools. The AI can read/write files, execute commands, access the web, and more.

```typescript
toolpack.setMode('agent');
```

**Capabilities:**
- All 77 built-in tools available
- File system operations (read, write, delete, search)
- Command execution (run shell commands, background processes)
- Web access (search, scrape, HTTP requests)
- Database operations
- Git operations
- Code analysis

**Best for:** Coding assistants, automation agents, DevOps bots, file management

### Chat Mode

Conversational assistant with web-only access. No local filesystem or command execution.

```typescript
toolpack.setMode('chat');
```

**Capabilities:**
- Web search and scraping
- HTTP requests
- No filesystem access
- No command execution
- No database access

**Best for:** General Q&A, research assistants, customer support bots

## Switching Modes

```typescript
// Check current mode
const currentMode = toolpack.getMode();
console.log(currentMode?.name); // 'agent' or 'chat'

// Switch mode
toolpack.setMode('chat');

// Get display name
console.log(toolpack.getActiveModeName()); // 'Chat'

// List all available modes
const modes = toolpack.getModes();
console.log(modes.map(m => m.name)); // ['agent', 'chat', ...]

// Cycle to next mode
const nextMode = toolpack.cycleMode();
```

## Custom Modes

You can create your own modes to define specific tool access patterns and behavior. See [Custom Modes](/guides/custom-modes) for details.
