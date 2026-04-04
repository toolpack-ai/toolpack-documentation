---
slug: understanding-modes-in-toolpack-sdk
title: "Understanding Modes in Toolpack SDK"
authors: [sajeer-babu]
tags: [modes, configuration, tools, agent, architecture]
description: "How modes work in Toolpack SDK: built-in Agent and Chat modes, tool filtering, system prompt injection, workflow control, runtime switching, and creating custom modes."
---

An AI agent that can read files, run shell commands, and hit external APIs is useful. An AI agent that does all of that when you only asked it to answer a question is a problem.

Modes are how Toolpack SDK draws that line. A mode defines three things: which tools the AI can access, what system prompt shapes its behavior, and whether the workflow engine (planning, step execution, retries) is active. You set the mode once at init or switch it at runtime, and the SDK enforces the constraints on every request.

<!-- truncate -->

## The Two Built-in Modes

### Agent Mode

Agent mode gives the AI access to everything. All tool categories are allowed, nothing is blocked. The workflow engine is enabled with planning, step-based execution, retry on failure, and dynamic step insertion.

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,
    defaultMode: 'agent',
});
```

The agent mode system prompt instructs the AI to use the tools provided to accomplish tasks end-to-end. It also tells the AI to use `tool.search` to discover tools before giving up, and to verify its actions after each step.

Tool access in agent mode:

- `allowedToolCategories: []` (empty means all categories are allowed)
- `blockedToolCategories: []` (nothing blocked)
- Filesystem, execution, network, database, git, coding, system: all available

Workflow configuration:

```typescript
workflow: {
    planning: { enabled: true },
    steps: {
        enabled: true,
        retryOnFailure: true,
        allowDynamicSteps: true,
    },
    progress: { enabled: true },
}
```

Agent mode also configures tool search to always load a set of commonly needed tools without requiring a search call: `fs.read_file`, `fs.write_file`, `fs.list_dir`, `web.search`, `web.fetch`, `skill.search`, and `skill.read`.

### Chat Mode

Chat mode restricts the AI to conversation and web access. No local filesystem, no command execution, no database operations. The workflow engine is disabled entirely.

```typescript
toolpack.setMode('chat');
```

The system prompt explicitly tells the AI it does not have access to local files or code modification, and suggests switching to Agent mode if the user asks for those things.

Tool access in chat mode:

- `allowedToolCategories: ['network']` (only web tools)
- `blockedToolCategories: ['filesystem', 'execution', 'system', 'coding', 'git', 'database']`
- Tool search always loads `web.search` and `web.fetch`

Base context injection is also different: `includeWorkingDirectory` is `false` in chat mode (the AI doesn't need to know about the local directory), while agent mode sets it to `true`.

## How Tool Filtering Works

When a request goes through the SDK, the active mode's tool configuration determines which tools are included. The filtering logic in the SDK follows a clear priority:

1. If `blockAllTools` is `true`, the request goes out with zero tools
2. `blockedTools` and `blockedToolCategories` are checked first and always win
3. If `allowedTools` or `allowedToolCategories` have entries, a tool must match at least one to be included
4. Empty allow lists mean everything is allowed (minus blocks)

This means you can express both "allow only these categories" and "allow everything except these categories" depending on how you configure the arrays.

## System Prompt Injection

Modes don't replace the system prompt, they layer on top of it. The SDK injects prompts in this order:

1. **Base agent context** (working directory, available tool categories)
2. **Override system prompt** (from `modeOverrides` in config)
3. **Mode system prompt** (the mode's own `systemPrompt` field)

If there's already a system message in the request, the mode prompt gets prepended to it. If there isn't one, the SDK creates a new system message.

This layering means you can use `modeOverrides` to customize a built-in mode's prompt without replacing it entirely:

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,
    defaultMode: 'agent',
    modeOverrides: {
        agent: {
            systemPrompt: 'You are a senior TypeScript engineer working on a React codebase.',
        },
    },
});
```

The override replaces the mode's system prompt. `toolSearch` overrides are deep-merged, so you can extend the always-loaded tools without losing the defaults.

## Switching Modes at Runtime

The SDK provides several methods for mode management:

```typescript
// Get current mode
const mode = toolpack.getMode();
console.log(mode?.name);        // 'agent'
console.log(mode?.displayName); // 'Agent'

// Switch mode (throws if name not found)
toolpack.setMode('chat');

// Get the display name directly
console.log(toolpack.getActiveModeName()); // 'Chat'

// List all registered modes
const modes = toolpack.getModes();
for (const m of modes) {
    console.log(`${m.name}: ${m.description}`);
}

// Cycle to the next mode (wraps around)
const next = toolpack.cycleMode();
console.log(next.name); // next mode in registration order
```

`setMode()` does two things internally: it updates the active mode on the AI client (which affects system prompt injection and tool filtering on the next request), and it reconfigures the workflow executor to match the mode's workflow settings.

`cycleMode()` is useful for UIs with a mode toggle button. It walks through modes in their registration order and wraps back to the first after the last.

## Creating Custom Modes

Register custom modes via `customModes` in the init config:

```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,
    defaultMode: 'code-review',
    customModes: [
        {
            name: 'code-review',
            displayName: 'Code Review',
            description: 'Read-only code analysis with no write access',
            systemPrompt: 'You are a code reviewer. Analyze code for bugs, performance issues, and style. Do not modify files.',
            allowedToolCategories: ['filesystem', 'coding'],
            blockedToolCategories: [],
            allowedTools: ['fs.read_file', 'fs.list_dir', 'fs.search_files'],
            blockedTools: ['fs.write_file', 'fs.delete', 'fs.move'],
            blockAllTools: false,
        },
    ],
});
```

You can also register modes after initialization:

```typescript
toolpack.registerMode({
    name: 'research',
    displayName: 'Research',
    description: 'Web research only',
    systemPrompt: 'You are a research assistant. Search the web and summarize findings.',
    allowedToolCategories: ['network'],
    blockedToolCategories: [],
    allowedTools: [],
    blockedTools: [],
    blockAllTools: false,
});

toolpack.setMode('research');
```

Custom modes participate in `cycleMode()` in the order they were registered.

## The ModeConfig Structure

Every mode, built-in or custom, follows the same interface:

```typescript
interface ModeConfig {
    name: string;                    // Unique identifier
    displayName: string;             // Human-readable label
    description: string;             // Short description
    systemPrompt: string;            // Injected into every request

    allowedToolCategories: string[]; // Empty = all allowed
    blockedToolCategories: string[]; // Takes precedence over allowed
    allowedTools: string[];          // Empty = all allowed
    blockedTools: string[];          // Takes precedence over allowed
    blockAllTools: boolean;          // Nuclear option

    baseContext?: {
        includeWorkingDirectory?: boolean;
        includeToolCategories?: boolean;
        custom?: string;
    } | false;

    workflow?: WorkflowConfig;       // Planning, steps, retry, progress

    toolSearch?: {
        enabled?: boolean;
        alwaysLoadedTools?: string[];
        alwaysLoadedCategories?: string[];
    };
}
```

The `createMode()` helper provides defaults for the optional fields, so you only need to specify what matters for your use case.

## When to Use Modes vs. Direct Tool Config

If you just need to limit which tools are available globally, the `enabledToolCategories` and `enabledTools` options in `toolpack.config.json` are simpler. Modes are the right choice when:

- You need to **switch** tool access patterns at runtime based on user intent or context
- Different tasks need **different system prompts** and tool sets together
- You want the **workflow engine** enabled for some operations and disabled for others
- You're building a UI with a **mode selector** that changes agent behavior

Modes bundle system prompt, tool filtering, workflow config, base context, and tool search into a single switchable unit. That's what makes them more than just tool configuration.

---

**Questions or feedback?** Open an issue or start a discussion on [GitHub](https://github.com/toolpack-ai/toolpack-sdk/discussions).
