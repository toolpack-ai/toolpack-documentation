---
slug: execution-tools
title: "Execution Tools in Toolpack SDK: Run Commands, Manage Processes, and Automate Tasks"
authors: [sajeer-babu]
tags: [tools, execution, shell, commands, processes]
description: "Learn how Toolpack SDK's 6 execution tools enable AI agents to run shell commands, manage background processes, and execute code with proper timeouts and security controls."
---

AI agents that can run commands and manage processes become truly powerful automation tools. Whether it's running tests, starting development servers, or executing deployment scripts, **Toolpack SDK's execution tools** give your agents the ability to interact with the system shell safely and effectively.

In this post, we'll explore all 6 tools in the `execution` category — from simple command execution to background process management with full lifecycle control.

<!-- truncate -->

## Why Execution Tools Matter

Most real-world AI workflows eventually need to run external commands. A code assistant needs to run the test suite. A DevOps agent needs to execute deployment scripts. A development companion needs to start and manage local servers. Without execution capabilities, your AI agent is limited to advising rather than doing.

Toolpack SDK bridges that gap:

- **Command Execution**: Run commands with or without shell interpretation
- **Background Processes**: Start long-running processes and manage them independently
- **Process Lifecycle**: Read output, check status, and terminate processes cleanly
- **Safety Controls**: Timeout protection and mode-based access restrictions

All 6 tools are available as soon as you initialize Toolpack SDK with `tools: true`.

## The Six Execution Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `exec.run` | `command`, `cwd?`, `timeout?` | Execute a command and return output |
| `exec.run_shell` | `command`, `cwd?`, `timeout?` | Execute through shell (supports pipes, redirects) |
| `exec.run_background` | `command`, `cwd?` | Start a background process |
| `exec.read_output` | `process_id` | Read stdout/stderr from background process |
| `exec.kill` | `process_id` | Kill a running process |
| `exec.list_processes` | - | List managed background processes |

### Command Execution vs Shell Execution

The distinction between `exec.run` and `exec.run_shell` is important:

- **`exec.run`**: Direct execution without shell interpretation — faster and safer for simple commands
- **`exec.run_shell`**: Full shell execution — supports pipes (`|`), redirects (`>`, `<`), and shell features

Choose `exec.run` for straightforward commands. Use `exec.run_shell` when you need shell features like piping output between commands.

## Setting Up

Execution tools require no API keys and no external services. They work with your local system the moment you enable tools:

```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
});
```

That's it. All 6 `execution` tools are available to the LLM automatically.

## Usage Examples

### Running Simple Commands

Use `exec.run` for straightforward command execution:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Run the tests' }],
  model: 'gpt-4o',
});
// AI uses exec.run with: { command: 'npm test' }
```

Returns:
```json
{
  "stdout": "✓ 42 tests passed",
  "stderr": "",
  "exitCode": 0
}
```

### Shell Commands with Pipes

Use `exec.run_shell` when you need pipes, redirects, or other shell features:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Count the lines of TypeScript code' }],
  model: 'gpt-4o',
});
// AI uses exec.run_shell with: { command: 'find . -name "*.ts" | xargs wc -l' }
```

### Background Processes

Start long-running processes like development servers:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Start the development server' }],
  model: 'gpt-4o',
});
// AI uses exec.run_background with: { command: 'npm run dev' }
```

Returns a process ID for later management:
```json
{
  "process_id": "proc_abc123",
  "pid": 12345,
  "command": "npm run dev",
  "status": "running"
}
```

### Reading Background Output

Check on a background process's output:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Check if the dev server has finished starting' }],
  model: 'gpt-4o',
});
// AI uses exec.read_output with: { process_id: 'proc_abc123' }
```

Returns:
```json
{
  "stdout": "> Ready on http://localhost:3000",
  "stderr": "",
  "exitCode": null,
  "status": "running"
}
```

### Managing Processes

List and terminate managed processes:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Stop the development server' }],
  model: 'gpt-4o',
});
// AI might:
// 1. exec.list_processes to find the server
// 2. exec.kill with the process_id
```

### Working Directory and Timeouts

Execute commands in specific directories with timeout protection. Both `exec.run` and `exec.run_shell` have a default timeout of **30 seconds (30000ms)**. For longer-running commands, specify a custom timeout:

```typescript
const stream = toolpack.stream({
  messages: [{
    role: 'user',
    content: 'Run the build in the ./packages/app directory with a 5 minute timeout'
  }],
  model: 'gpt-4o',
});
// AI uses exec.run with:
// { command: 'npm run build', cwd: './packages/app', timeout: 300000 }
```

## Real-World Use Cases

### Test Automation

```typescript
const toolpack = await Toolpack.init({
  provider: 'anthropic',
  tools: true,
});

const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Run the test suite and report results.
    
    If tests fail, capture the error output and suggest fixes.`
  }],
  model: 'claude-sonnet-4',
});
```

The agent will:
1. Use `exec.run` to execute the test command
2. Parse the output to determine pass/fail status
3. Capture error details if tests fail

### Development Server Management

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Start the dev server, wait for it to be ready,
    then run the Cypress tests against it.`
  }],
});
```

The agent will:
1. Use `exec.run_background` to start the server
2. Use `exec.read_output` to poll for "ready" signal
3. Execute tests once server is up
4. Clean up with `exec.kill` when done

### Build and Deployment Pipeline

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Deploy the application:
    1. Run lint checks
    2. Build for production
    3. Run the deployment script
    
    Stop immediately if any step fails.`
  }],
});
```

The agent will:
1. Use `exec.run` for each step sequentially
2. Check exit codes to detect failures
3. Abort the pipeline on error

### Code Analysis with Shell Pipes

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: 'Find the 10 largest JavaScript files and show their line counts'
  }],
});
```

The agent will:
1. Use `exec.run_shell` with a piped command:
   `find . -name "*.js" -exec wc -l {} + | sort -rn | head -10`

## Best Practices

### 1. Prefer `exec.run` Over `exec.run_shell`

Use direct execution when you don't need shell features:

```typescript
// Good: Direct execution
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: 'Run: node script.js'
  }],
});

// Good: Shell features needed
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: 'Count lines: find . -name "*.ts" | xargs wc -l'
  }],
});
```

### 2. Always Set Timeouts for Potentially Long Commands

Prevent indefinite hangs:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Build the project with a 10 minute timeout.
    
    If it times out, report that the build is taking too long.`
  }],
});
```

### 3. Clean Up Background Processes

Always terminate background processes when done:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Start the test server in background,
    run the integration tests,
    then stop the server and report results.`
  }],
});
```

### 4. Check Exit Codes

Instruct the agent to verify command success:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Run the database migration.
    Check the exit code and report success or failure clearly.`
  }],
});
```

### 5. Combine with System Tools for Safer Execution

Check system state before running commands:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Before running the data processing script:
    1. Check available disk space with system.disk_usage
    2. Verify NODE_ENV is set correctly
    3. Then execute the script`
  }],
});
```

## Security Considerations

Execution tools are powerful and potentially dangerous. Use modes to restrict access:

```typescript
const safeMode = {
  name: 'no-exec',
  displayName: 'No Execution',
  description: 'No command execution',
  systemPrompt: 'You cannot execute commands.',
  allowedToolCategories: [],
  blockedToolCategories: ['execution'],
  allowedTools: [],
  blockedTools: [],
  blockAllTools: false,
};

const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
  customModes: [safeMode],
  defaultMode: 'no-exec',
});
```

## Tool Summary

| Tool | Use Case |
|------|----------|
| `exec.run` | Direct command execution without shell overhead |
| `exec.run_shell` | Commands requiring pipes, redirects, shell features |
| `exec.run_background` | Long-running processes (servers, watchers) |
| `exec.read_output` | Check output from background processes |
| `exec.kill` | Terminate managed background processes |
| `exec.list_processes` | Discover and monitor running processes |

## What's Next?

The execution tools are one of 10+ tool categories in Toolpack SDK. Coming up in this series:

- **Git Tools**: Stage, commit, diff, and manage branches with AI
- **Database Tools**: Query and manage databases with natural language
- **Coding Tools**: Lint, format, and analyze code
- **Knowledge Tools**: Store and retrieve contextual information

---

**Want to try execution tools?** Initialize Toolpack SDK with `tools: true` and start asking your agent to run commands and manage processes.

**Exploring other tool categories?** Check out the [Tools Overview](/tools/overview) for the full list.

Have questions or a use case you'd like to share? Open an issue on [GitHub](https://github.com/toolpack-ai/toolpack-sdk) or join the discussion.
