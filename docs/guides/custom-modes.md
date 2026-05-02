---
sidebar_position: 5
description: "Create custom AI modes in Toolpack SDK. Define tool access patterns, blocked categories, system prompts, and workflow configuration for specialized AI behavior."
keywords: [custom AI modes, tool access control, mode configuration, Toolpack SDK custom mode, createMode, AI behavior control]
---

# Custom Modes

Create your own modes to define specific tool access and behavior patterns for the AI.

## Creating a Custom Mode

Define a mode configuration object:

```typescript
import { Toolpack, ModeConfig } from 'toolpack-sdk';

const readOnlyMode: ModeConfig = {
    name: 'readonly',
    displayName: 'Read Only',
    description: 'Can read files but not modify anything',
    systemPrompt: 'You are a helpful assistant that can read and analyze files but cannot modify them.',
    
    // Tool access control
    allowedToolCategories: ['filesystem', 'coding'],
    blockedToolCategories: [],
    allowedTools: [],
    blockedTools: ['fs.write_file', 'fs.delete_file', 'fs.append_file'],
    blockAllTools: false,
    
    // Context injection
    baseContext: {
        includeWorkingDirectory: true,
        includeToolCategories: true,
    },
};

const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,
    customModes: [readOnlyMode],
    defaultMode: 'readonly',
});
```

## Mode Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `name` | string | Unique identifier |
| `displayName` | string | Human-readable name |
| `description` | string | Short description |
| `systemPrompt` | string | System prompt injected into requests |
| `allowedToolCategories` | string[] | Categories to allow (empty = all) |
| `blockedToolCategories` | string[] | Categories to block |
| `allowedTools` | string[] | Specific tools to allow |
| `blockedTools` | string[] | Specific tools to block |
| `blockAllTools` | boolean | Block all tools entirely |
| `baseContext` | object | Context injection settings |
| `workflow` | object | Workflow configuration |

## Tool Categories

Use these category names in `allowedToolCategories` or `blockedToolCategories`:

| Category | Tools |
|----------|-------|
| `filesystem` | fs.read_file, fs.write_file, fs.list_dir, etc. |
| `execution` | exec.run, exec.run_shell, exec.run_background, etc. |
| `system` | system.info, system.env, system.cwd, etc. |
| `network` | http.get, http.post, web.search, web.scrape, etc. |
| `coding` | coding.find_symbol, coding.get_imports, etc. |
| `version-control` | git.status, git.diff, git.commit, etc. |
| `diff` | diff.create, diff.apply, diff.preview |
| `database` | db.query, db.schema, db.tables, etc. |
| `cloud` | cloud.deploy, cloud.status, cloud.list |

## Example Modes

### Web Research Mode

Only allow web access, no local file operations:

```typescript
const webResearchMode: ModeConfig = {
    name: 'web-research',
    displayName: 'Web Research',
    description: 'Web search and scraping only',
    systemPrompt: 'You are a research assistant. You can search and scrape the web, but cannot access local files or execute commands.',
    allowedToolCategories: ['network'],
    blockedToolCategories: [],
    allowedTools: [],
    blockedTools: [],
    blockAllTools: false,
};
```

### Code Review Mode

Read-only access to code analysis tools:

```typescript
const codeReviewMode: ModeConfig = {
    name: 'code-review',
    displayName: 'Code Review',
    description: 'Analyze code without modifications',
    systemPrompt: 'You are a code reviewer. Analyze code quality, find issues, and suggest improvements. You cannot modify files.',
    allowedToolCategories: ['filesystem', 'coding', 'version-control'],
    blockedToolCategories: [],
    allowedTools: [],
    blockedTools: ['fs.write_file', 'fs.delete_file', 'fs.append_file', 'git.commit', 'git.add'],
    blockAllTools: false,
};
```

## Registering Modes at Runtime

You can register modes after initialization:

```typescript
// Register a new mode after initialization
toolpack.registerMode({
    name: 'minimal',
    displayName: 'Minimal',
    description: 'No tools at all',
    systemPrompt: 'You are a simple chatbot with no tool access.',
    allowedToolCategories: [],
    blockedToolCategories: [],
    allowedTools: [],
    blockedTools: [],
    blockAllTools: true,
});

// Switch to the new mode
toolpack.setMode('minimal');
```

## Using the createMode Helper

The SDK provides a `createMode` helper for cleaner syntax:

```typescript
import { createMode } from 'toolpack-sdk';

const myMode = createMode({
    name: 'my-mode',
    displayName: 'My Mode',
    systemPrompt: 'Custom system prompt',
    blockAllTools: true,
});

const toolpack = await Toolpack.init({
    provider: 'openai',
    customModes: [myMode],
    defaultMode: 'my-mode',
});
```

## Workflow Configuration in Modes

Modes can configure workflow behavior for planned execution:

```typescript
const plannerMode: ModeConfig = {
    name: 'planner',
    displayName: 'Planner',
    description: 'Plans before executing',
    systemPrompt: 'You are a careful AI that plans before acting.',
    allowedToolCategories: [],
    blockedToolCategories: [],
    allowedTools: [],
    blockedTools: [],
    blockAllTools: false,
    
    workflow: {
        planning: { 
            enabled: true,
            requireApproval: false,
        },
        steps: {
            enabled: true,
            retryOnFailure: true,
            allowDynamicSteps: true,
        },
        progress: { enabled: true },
    },
};
```

See [Workflows](/guides/workflows) for more details on workflow configuration.

## Best Practices

- **Clear naming** - Use descriptive `name` and `displayName` values
- **Specific prompts** - Tailor `systemPrompt` to the mode's purpose
- **Minimal permissions** - Only allow tools needed for the mode's function
- **Test thoroughly** - Verify tool restrictions work as expected
- **Document behavior** - Use `description` to explain what the mode does
