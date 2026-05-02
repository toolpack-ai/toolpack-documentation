---
sidebar_position: 3
description: "Learn about Toolpack SDK workflows. Use direct execution for simple tasks or planned workflows for complex multi-step AI operations with progress tracking."
keywords: [AI workflows, planned execution, step-by-step AI, workflow engine, AI task planning, Toolpack SDK workflows]
---

# Workflows

Toolpack SDK supports two workflow types for AI execution: **Direct** and **Planned**.

## Direct Workflow (Default)

In direct mode, the AI responds immediately and executes tools as needed in a single flow:

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,
    defaultMode: 'chat',  // Chat mode uses direct workflow
});

// AI responds directly, executing tools inline
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'What is 2 + 2?' }],
    model: 'gpt-4o',
});
```

## Planned Workflow (Agent Mode)

In planned mode, the AI first creates a plan, then executes it step by step:

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,
    defaultMode: 'agent',  // Agent mode uses planned workflow
});

// AI creates a plan, then executes each step
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Refactor the utils.ts file to use async/await' }],
    model: 'gpt-4o',
});

for await (const chunk of stream) {
    // Chunks include step information
    if (chunk.workflowStep) {
        console.log(`Step ${chunk.workflowStep.number}: ${chunk.workflowStep.description}`);
    }
    process.stdout.write(chunk.delta);
}
```

## Workflow Events

Listen to workflow events for progress tracking:

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,
    defaultMode: 'agent',
});

// Plan created
toolpack.on('workflow:plan_created', (plan) => {
    console.log('Plan created:', plan.steps.map(s => s.description));
});

// Execution started
toolpack.on('workflow:started', (plan) => {
    console.log('Execution started');
});

// Step events
toolpack.on('workflow:step_start', (step, plan) => {
    console.log(`Starting: ${step.description}`);
});

toolpack.on('workflow:step_complete', (step, plan) => {
    console.log(`Completed: ${step.description}`);
});

toolpack.on('workflow:step_failed', (step, error, plan) => {
    console.log(`Failed: ${step.description}`, error.message);
});

// Progress updates
toolpack.on('workflow:progress', (progress) => {
    console.log(`Progress: ${progress.percentage}% - ${progress.currentStepDescription}`);
});

// Completion
toolpack.on('workflow:completed', (plan, result) => {
    console.log('Workflow completed:', result.metrics);
});

toolpack.on('workflow:failed', (plan, error) => {
    console.log('Workflow failed:', error.message);
});
```

## Workflow Configuration

Configure workflow behavior in custom modes:

```typescript
const customMode: ModeConfig = {
    name: 'careful-agent',
    displayName: 'Careful Agent',
    description: 'Plans carefully with approval',
    systemPrompt: '...',
    allowedToolCategories: [],
    blockedToolCategories: [],
    allowedTools: [],
    blockedTools: [],
    blockAllTools: false,
    
    workflow: {
        planning: {
            enabled: true,
            requireApproval: true,  // Pause for user approval
            maxSteps: 10,
        },
        steps: {
            enabled: true,
            retryOnFailure: true,
            maxRetries: 3,
            allowDynamicSteps: true,
            maxTotalSteps: 20,
        },
        progress: {
            enabled: true,
            reportPercentage: true,
        },
        onFailure: {
            strategy: 'ask_user',  // 'abort' | 'skip' | 'ask_user'
        },
    },
};
```

### Planning Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | false | Enable planning phase |
| `requireApproval` | boolean | false | Pause for user approval before executing |
| `planningPrompt` | string | - | Custom system prompt for plan generation |
| `maxSteps` | number | 20 | Maximum steps allowed in a plan |

### Step Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | false | Enable step-by-step execution |
| `retryOnFailure` | boolean | true | Retry failed steps |
| `maxRetries` | number | 3 | Maximum retry attempts per step |
| `allowDynamicSteps` | boolean | true | Allow adding steps during execution |
| `maxTotalSteps` | number | 50 | Maximum total steps including dynamic |

### Progress Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | true | Emit progress events |
| `reportPercentage` | boolean | true | Include completion percentage |

### Failure Strategies

| Strategy | Description |
|----------|-------------|
| `abort` | Stop execution immediately |
| `skip` | Skip the failed step and continue |
| `ask_user` | Pause and wait for user decision |

## Accessing the Workflow Executor

For advanced control:

```typescript
const executor = toolpack.getWorkflowExecutor();

// Configure at runtime
executor.setConfig({
    planning: { enabled: true },
    steps: { enabled: true, maxRetries: 5 },
});
```
