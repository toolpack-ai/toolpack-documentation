---
slug: building-ai-workflows
title: "Building AI Workflows with Toolpack SDK"
authors: [sajeer-babu]
tags: [workflows, agent, planning, development]
description: "A practical guide to using the Toolpack SDK workflow engine. Learn how to build AI agents that plan, execute, and recover from complex multi-step tasks with working code examples."
---

Toolpack SDK ships with a workflow engine that turns a basic AI chat into a goal-driven agent. Instead of responding once and waiting, it plans a series of steps, executes them one by one, handles failures, and reports progress the whole time.

This guide walks you through both workflow types, how to configure them, how to listen to events, and patterns you can use in real applications.

<!-- truncate -->

## What is a Workflow?

When you ask an AI to "refactor this entire codebase" or "build a REST API with authentication", a single response isn't enough. It needs to:

1. **Plan** — Break the task into steps
2. **Execute** — Run each step using tools
3. **Adapt** — Add new steps if something unexpected comes up
4. **Recover** — Retry or reroute if a step fails

Toolpack's workflow engine handles all of this. You configure it through modes, listen to events, and let the engine drive the execution.

## Two Workflow Types

### Direct Workflow (Default)

The default mode. The AI responds immediately and executes any required tool calls inline — no planning overhead, no step tracking.

This is the right choice for conversational use, quick lookups, or any task that doesn't benefit from structured planning.

```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
  defaultMode: 'chat', // Chat mode uses direct workflow
});

const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'What files are in the src directory?' }],
  model: 'gpt-4o',
});

for await (const chunk of stream) {
  process.stdout.write(chunk.delta);
}
```

The AI may call `fs.list_dir` under the hood, but it happens invisibly in a single round.

### Planned Workflow (Agent Mode)

In planned mode, the AI generates a structured plan first, then executes each step. This is suited for tasks that are multi-step, non-trivial, or where the user wants visibility into what's happening.

```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
  defaultMode: 'agent', // Agent mode uses planned workflow
});

const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Refactor the utils.ts file to use async/await' }],
  model: 'gpt-4o',
});

for await (const chunk of stream) {
  if (chunk.workflowStep) {
    console.log(`Step ${chunk.workflowStep.number}: ${chunk.workflowStep.description}`);
  }
  process.stdout.write(chunk.delta);
}
```

Each chunk from the stream may include a `workflowStep` field with the step number and description. This is what powers step-by-step progress UIs.

## Listening to Workflow Events

The workflow engine emits events throughout the lifecycle. You access these through the `WorkflowExecutor`:

```typescript
const executor = toolpack.getWorkflowExecutor();

// Plan created — fires before execution begins
executor.on('workflow:plan_created', (plan) => {
  console.log('Plan:', plan.steps.map(s => s.description));
});

// Execution started
executor.on('workflow:started', (plan) => {
  console.log(`Starting ${plan.steps.length}-step execution`);
});

// Step lifecycle
executor.on('workflow:step_start', (step, plan) => {
  console.log(`→ Starting: ${step.description}`);
});

executor.on('workflow:step_complete', (step, plan) => {
  console.log(`[SUCCESS] Completed: ${step.description}`);
});

executor.on('workflow:step_failed', (step, error, plan) => {
  console.log(`[FAILED] Failed: ${step.description} — ${error.message}`);
});

executor.on('workflow:step_retry', (step, attempt, plan) => {
  console.log(`↻ Retrying: ${step.description} (attempt ${attempt})`);
});

// Dynamic steps — when the AI adds new steps mid-execution
executor.on('workflow:step_added', (step, plan) => {
  console.log(`+ Dynamic step added: ${step.description}`);
});

// Progress updates — ideal for status bars and shimmer text
executor.on('workflow:progress', (progress) => {
  console.log(`[${progress.percentage}%] ${progress.currentStepDescription}`);
  // progress.status: 'planning' | 'awaiting_approval' | 'executing' | 'completed' | 'failed'
  // progress.currentStep, progress.totalSteps, progress.percentage
});

// Completion
executor.on('workflow:completed', (plan, result) => {
  const { stepsCompleted, totalDuration } = result.metrics;
  console.log(`Done! ${stepsCompleted} steps in ${totalDuration}ms`);
});

executor.on('workflow:failed', (plan, error) => {
  console.log(`Workflow failed: ${error.message}`);
});
```

Events are the right place to power your UI — status bars, step logs, progress spinners. They fire on the executor, not inside the stream, so they're decoupled from the response content.

## Configuring Workflow Behavior

You configure workflows through a `WorkflowConfig` inside a mode. Here's the full shape:

```typescript
interface WorkflowConfig {
  planning?: {
    enabled: boolean;           // Enable planning phase
    requireApproval?: boolean;  // Pause before executing — wait for user confirmation
    planningPrompt?: string;    // Custom system prompt used during plan generation
    maxSteps?: number;          // Max steps in a plan (default: 20)
  };

  steps?: {
    enabled: boolean;           // Enable step-by-step execution
    retryOnFailure?: boolean;   // Retry failed steps automatically (default: true)
    maxRetries?: number;        // Max retries per step (default: 3)
    allowDynamicSteps?: boolean; // Allow AI to add new steps mid-execution
    maxTotalSteps?: number;     // Max steps including dynamic additions (default: 50)
  };

  progress?: {
    enabled: boolean;           // Emit progress events (default: true)
    reportPercentage?: boolean; // Include completion percentage in events
  };

  onFailure?: {
    strategy: 'abort' | 'skip' | 'ask_user' | 'try_alternative';
  };
}
```

### Failure Strategies

| Strategy | Behavior |
| --- | --- |
| `abort` | Stop execution immediately on failure |
| `skip` | Skip the failed step and continue |
| `ask_user` | Pause and wait for a user decision |
| `try_alternative` | Let the AI attempt a different approach |

## Custom Modes with Workflow

The most powerful use of the workflow system is through custom modes. You can tune planning behavior, tool access, and failure handling for specific use cases.

### Example: Careful Agent with Approval

```typescript
import { createMode, Toolpack } from 'toolpack-sdk';

const carefulAgent = createMode({
  name: 'careful-agent',
  displayName: 'Careful Agent',
  description: 'Plans carefully and waits for user approval before executing',
  systemPrompt: 'You are a careful AI agent. Always plan thoroughly before acting. Explain your reasoning at each step.',
  allowedToolCategories: ['filesystem', 'coding', 'version-control'],
  blockedTools: ['fs.delete_file'], // Never delete files in this mode
  workflow: {
    planning: {
      enabled: true,
      requireApproval: true, // Pause after planning — show the plan to the user before running
      maxSteps: 10,
    },
    steps: {
      enabled: true,
      retryOnFailure: true,
      maxRetries: 2,
      allowDynamicSteps: false, // Stick to the approved plan
    },
    progress: {
      enabled: true,
      reportPercentage: true,
    },
    onFailure: {
      strategy: 'ask_user',
    },
  },
});

const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
  customModes: [carefulAgent],
  defaultMode: 'careful-agent',
});
```

### Example: Read-Only Code Reviewer

```typescript
const reviewMode = createMode({
  name: 'review',
  displayName: 'Code Review',
  description: 'Reviews code thoroughly — never writes or deletes anything',
  systemPrompt: 'You are a senior code reviewer. Read files, analyze them, and provide actionable feedback. Never modify anything.',
  allowedToolCategories: ['filesystem', 'coding', 'version-control'],
  blockedTools: [
    'fs.write_file',
    'fs.delete_file',
    'fs.append_file',
    'fs.move_file',
  ],
  workflow: {
    planning: {
      enabled: true,
      maxSteps: 15,
    },
    steps: {
      enabled: true,
      retryOnFailure: true,
      maxRetries: 3,
      allowDynamicSteps: true, // Allow the reviewer to dig deeper if needed
    },
    progress: { enabled: true },
    onFailure: {
      strategy: 'skip', // If one file fails to read, move on to the next
    },
  },
});
```

### Example: Fast Chat (No Planning)

```typescript
const fastChat = createMode({
  name: 'fast-chat',
  displayName: 'Fast Chat',
  description: 'Direct responses, no planning overhead',
  systemPrompt: 'You are a helpful assistant. Respond quickly and concisely.',
  allowedToolCategories: ['network'],
  // No workflow config — uses direct execution
});
```

When there's no `workflow` config, the mode behaves like `chat` — direct execution with no planning phase.

## Building a Progress UI

The `workflow:progress` event is designed for building status UIs. Here's a simple terminal progress display:

```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
  defaultMode: 'agent',
});

const executor = toolpack.getWorkflowExecutor();

// Update a status line in the terminal
executor.on('workflow:progress', (progress) => {
  const bar = '█'.repeat(Math.floor(progress.percentage / 5)).padEnd(20, '░');
  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`[${bar}] ${progress.percentage}% — ${progress.currentStepDescription}`);
});

executor.on('workflow:completed', (plan, result) => {
  process.stdout.write('\n');
  console.log(`\nCompleted ${result.metrics.stepsCompleted} steps in ${result.metrics.totalDuration}ms`);
});

// Kick off a complex task
await toolpack.generate({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Audit the project for security vulnerabilities' }],
});
```

For web UIs, the same events power real-time step lists, spinners, or percentage rings — just pipe `workflow:progress` into your state.

## Handling Approval Gates

When `requireApproval: true` is set, the workflow pauses after planning. The `workflow:progress` event fires with `status: 'awaiting_approval'`. This is where you show the plan and confirm before any tools execute.

```typescript
executor.on('workflow:plan_created', (plan) => {
  console.log('\nPlanned steps:');
  plan.steps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step.description}`);
  });
});

// Listen to the progress event to catch the approval pause
executor.on('workflow:progress', async (progress) => {
  if (progress.status === 'awaiting_approval') {
    const answer = await promptUser('Proceed with this plan? (y/n): ');
    
    if (answer === 'y') {
      executor.approvePlan(progress.planId); // Execute the plan
    } else {
      executor.rejectPlan(progress.planId); // Cancel the workflow
      console.log('Workflow cancelled.');
    }
  }
});
```

This pattern is useful any time you want a human in the loop before the agent starts writing files or calling external APIs.

## Accessing the Executor Directly

For advanced control, get the `WorkflowExecutor` directly:

```typescript
const executor = toolpack.getWorkflowExecutor();

// Reconfigure at runtime
executor.setConfig({
  planning: { enabled: true, maxSteps: 5 },
  steps: { enabled: true, maxRetries: 1 },
  onFailure: { strategy: 'abort' },
});

// Access active configuration
const config = executor.getConfig();
```

This is useful when you need to change behavior dynamically — for example, switching to a stricter config for production versus a more permissive one during local development.

## Best Practices

### 1. Match the Workflow to the Task

Not every task needs planning. Use `chat` mode for conversational queries and `agent` mode (or a custom planned mode) only when the task is multi-step or benefits from structured execution.

```typescript
// Conversational — no planning needed
sdk.setMode('chat');
await sdk.generate('What is the weather today?');

// Multi-step task — use planned workflow
sdk.setMode('agent');
await sdk.generate('Set up a new Express project with TypeScript and ESLint');
```

### 2. Set Sensible Step Limits

The defaults (`maxSteps: 20`, `maxTotalSteps: 50`) are generous. For tightly scoped use cases, set lower limits to prevent runaway execution:

```typescript
workflow: {
  planning: { enabled: true, maxSteps: 5 },
  steps: { enabled: true, maxTotalSteps: 8 },
}
```

### 3. Choose Your Failure Strategy Deliberately

Don't default to `abort` for everything. Think about what makes sense for the task:

```typescript
// Auditing: if one file fails, skip it and continue
onFailure: { strategy: 'skip' }

// Destructive operations: fail fast, don't proceed
onFailure: { strategy: 'abort' }

// Interactive tools: pause and let the user decide
onFailure: { strategy: 'ask_user' }

// Exploratory tasks: let the AI find another way
onFailure: { strategy: 'try_alternative' }
```

### 4. Use Dynamic Steps for Exploratory Tasks

When `allowDynamicSteps: true`, the AI can add steps mid-execution as it discovers more about the task. This is powerful for open-ended tasks like codebase audits or research:

```typescript
steps: {
  enabled: true,
  allowDynamicSteps: true,
  maxTotalSteps: 30, // Set a cap so it doesn't run forever
}
```

Disable dynamic steps when you've required user approval of the plan — you don't want the agent deviating from what the user agreed to.

### 5. Use `planningPrompt` to Shape the Plan

The `planningPrompt` field lets you inject a custom system prompt specifically for the planning phase:

```typescript
planning: {
  enabled: true,
  planningPrompt: `
    Break tasks into small, atomic steps. 
    Each step should accomplish exactly one thing. 
    Prefer reading before writing. 
    Never plan more than 8 steps.
  `,
}
```

This is separate from the mode's main `systemPrompt` and only applies during plan generation.

### 6. Always Handle `workflow:failed`

A workflow can fail if it hits `maxTotalSteps`, if all retries are exhausted, or if the strategy is `abort` and a step fails. Always handle this event:

```typescript
executor.on('workflow:failed', (plan, error) => {
  const failedStep = plan.steps.find(s => s.status === 'failed');
  const stepInfo = failedStep ? ` at step ${failedStep.number}` : '';
  console.error(`Workflow failed${stepInfo}: ${error.message}`);
  // Log, notify, or present the partial results to the user
});
```

## Key Takeaways

- **Two workflow types** — `direct` for conversation, `planned` for multi-step tasks
- **Workflows live in modes** — configure `WorkflowConfig` inside `createMode()`
- **Events are first-class** — use `workflow:progress`, `workflow:step_start`, and friends to build rich UIs
- **Approval gates** — use `requireApproval: true` and the `approvePlan()`/`rejectPlan()` methods to show the plan before executing
- **Dynamic steps** — let the AI adapt mid-execution for exploratory tasks
- **Failure strategies** — pick between `abort`, `skip`, `ask_user`, and `try_alternative` per use case
- **Direct executor access** — `sdk.getWorkflowExecutor()` for runtime config changes

The workflow engine is what separates a helpful chatbot from a production AI agent. Configure it intentionally, listen to its events, and you get full visibility and control over what your agent does — and why.