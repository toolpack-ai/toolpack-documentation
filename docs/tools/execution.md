---
sidebar_position: 3
description: "Toolpack SDK execution tools for running shell commands, background processes, and process management. Execute commands with timeouts, read output, and kill processes."
keywords: [execution tools, run command, shell execution, process management, AI command execution, Toolpack SDK exec tools]
---

# Execution Tools

Category: `execution` · 6 tools

Run commands, manage processes, and automate tasks.

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `exec.run` | `command`, `cwd?`, `timeout?` | Execute a command and return output |
| `exec.run_shell` | `command`, `cwd?`, `timeout?` | Execute through shell (supports pipes, redirects) |
| `exec.run_background` | `command`, `cwd?` | Start a background process |
| `exec.read_output` | `process_id` | Read stdout/stderr from background process |
| `exec.kill` | `process_id` | Kill a running process |
| `exec.list_processes` | - | List managed background processes |

## Examples

### Running Commands

```typescript
// AI uses exec.run or exec.run_shell
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Run the tests' }],
    model: 'gpt-4o',
});
```

### Background Processes

```typescript
// AI starts a dev server in background
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Start the development server' }],
    model: 'gpt-4o',
});
```

### Shell Commands

```typescript
// AI uses exec.run_shell for pipes
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Count the lines of TypeScript code' }],
    model: 'gpt-4o',
});
// AI might run: find . -name "*.ts" | xargs wc -l
```

## Security Note

Execution tools are powerful and potentially dangerous. Use modes to restrict access:

```typescript
const safeMode: ModeConfig = {
    name: 'no-exec',
    displayName: 'No Execution',
    description: 'No command execution',
    systemPrompt: '...',
    allowedToolCategories: [],
    blockedToolCategories: ['execution'],
    allowedTools: [],
    blockedTools: [],
    blockAllTools: false,
};
```
