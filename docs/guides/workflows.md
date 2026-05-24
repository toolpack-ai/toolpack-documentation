---
sidebar_position: 3
description: "Learn about Toolpack SDK workflows. Use direct execution for simple tasks or plan-direct workflows for complex AI operations with parallel tool orchestration."
keywords: [AI workflows, plan-direct execution, workflow engine, AI task planning, parallel tools, Toolpack SDK workflows]
---

# Workflows

Toolpack SDK supports two workflow modes for AI execution: **Direct** and **Plan-direct**.

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

## Plan-direct Workflow (Agent Mode)

In plan-direct mode, the AI first generates a structured plan, then executes the entire plan in a single `generate()` call with full parallel tool orchestration:

```typescript
const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,
    defaultMode: 'agent',  // Agent mode uses plan-direct workflow
});

// AI creates a plan, injects it as context, then executes in one call
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Refactor the utils.ts file to use async/await' }],
    model: 'gpt-4o',
});

for await (const chunk of stream) {
    process.stdout.write(chunk.delta);
}
```

The plan steps are advisory guidance for the LLM — not enforced execution units. Tools run in parallel automatically via dependency graph analysis.

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

// Plan decision (approval flow)
toolpack.on('workflow:plan_decision', (plan, decision) => {
    console.log('Plan decision:', decision);
});

// Execution started
toolpack.on('workflow:started', (plan) => {
    console.log('Execution started');
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
        progress: {
            enabled: true,
            reportPercentage: true,
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

### Progress Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | true | Emit progress events |
| `reportPercentage` | boolean | true | Include completion percentage |

## Accessing the Workflow Executor

For advanced control:

```typescript
const executor = toolpack.getWorkflowExecutor();

// Configure at runtime
executor.setConfig({
    planning: { enabled: true },
});
```
