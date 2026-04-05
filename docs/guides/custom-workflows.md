---
sidebar_position: 6
description: "Create custom workflows in Toolpack SDK. Use workflow presets or build custom configurations with planning prompts, step prompts, and execution strategies."
keywords: [custom workflows, workflow presets, planning prompts, step prompts, AI workflow customization, Toolpack SDK workflows]
---

# Custom Workflows

Create custom workflows to control how the AI plans and executes tasks. Use built-in presets or define your own planning and execution behavior.

## Workflow Presets

Toolpack SDK provides three built-in workflow presets:

```typescript
import { AGENT_WORKFLOW, CODING_WORKFLOW, CHAT_WORKFLOW } from 'toolpack-sdk';
```

### Agent Workflow

Full planning for complex tasks.

```typescript
import { AGENT_WORKFLOW } from 'toolpack-sdk';

const myMode = createMode({
    name: 'my-agent',
    displayName: 'My Agent',
    workflow: AGENT_WORKFLOW,
});
```

**Features:**
- Detailed planning phase
- Step-by-step execution
- Full failure handling with retries

### Coding Workflow

Concise planning optimized for software development tasks.

```typescript
import { CODING_WORKFLOW } from 'toolpack-sdk';

const codingMode = createMode({
    name: 'my-coding',
    displayName: 'My Coding Mode',
    workflow: CODING_WORKFLOW,
});
```

**Features:**
- Concise planning prompts
- Minimal conversational output
- Focused on file operations and code changes
- Efficient for refactoring and debugging

### Chat Workflow

Direct execution without planning for conversational tasks.

```typescript
import { CHAT_WORKFLOW } from 'toolpack-sdk';

const chatMode = createMode({
    name: 'my-chat',
    displayName: 'My Chat Mode',
    workflow: CHAT_WORKFLOW,
});
```

**Features:**
- No planning phase
- Direct tool execution
- Fast response times
- Best for simple Q&A and web queries

## Creating Custom Workflows

Define a custom workflow configuration:

```typescript
import { ModeConfig } from 'toolpack-sdk';

const customMode: ModeConfig = {
    name: 'research-agent',
    displayName: 'Research Agent',
    description: 'Gathers information with web search and documents findings',
    systemPrompt: 'You are a research assistant...',
    
    workflow: {
        name: 'research',
        planning: {
            enabled: true,
            requireApproval: false,
            maxSteps: 15,
            planningPrompt: `You are a research planning assistant.
            
            Create a step-by-step plan for gathering information on the user's topic.
            Each step should focus on one research action:
            1. Search for overview information
            2. Deep dive into specific aspects
            3. Cross-reference sources
            4. Synthesize findings
            
            Keep plans concise and focused on information gathering.`,
        },
        steps: {
            enabled: true,
            retryOnFailure: true,
            maxRetries: 2,
            allowDynamicSteps: true,
            maxTotalSteps: 25,
            stepPrompt: `Execute the current research step.
            
            Use available tools to gather information efficiently.
            Document sources and key findings for each step.
            If a search yields insufficient results, try alternative queries.`,
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

## Custom Planning Prompts

Override the default planning behavior with custom prompts:

```typescript
const analysisWorkflow = {
    planning: {
        enabled: true,
        planningPrompt: `You are a code analysis planner.
        
        Create a plan to analyze the requested code:
        1. First, read and understand the file structure
        2. Identify key components and dependencies
        3. Analyze each component systematically
        4. Provide findings with specific line references
        
        Focus on concrete observations, not assumptions.`,
    },
};
```

## Custom Step Prompts

Control how individual steps are executed:

```typescript
const codingWorkflow = {
    steps: {
        enabled: true,
        stepPrompt: `Execute this coding task step.
        
        Guidelines:
        - Show only the code changes, no conversational filler
        - Use diff format when modifying existing code
        - Verify changes compile before proceeding
        - Keep responses concise and technical`,
    },
};
```

## Workflow Configuration Reference

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
| `stepPrompt` | string | - | Custom system prompt for step execution |
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

## Complete Example: Code Review Mode

```typescript
import { createMode } from 'toolpack-sdk';

const codeReviewMode = createMode({
    name: 'code-review',
    displayName: 'Code Review',
    description: 'Analyzes code and provides structured feedback',
    systemPrompt: 'You are a code reviewer providing structured feedback.',
    
    allowedToolCategories: ['filesystem', 'coding'],
    blockedTools: ['fs.write_file', 'fs.delete_file'],
    
    workflow: {
        name: 'code-review',
        planning: {
            enabled: true,
            planningPrompt: `Plan a comprehensive code review:
            1. Read and understand the target file(s)
            2. Analyze code structure and patterns
            3. Check for common issues (security, performance, style)
            4. Review documentation and comments
            5. Synthesize findings into actionable feedback`,
        },
        steps: {
            enabled: true,
            stepPrompt: `Focus on specific aspects in each step:
            - Note exact line numbers for issues
            - Categorize findings (critical, warning, suggestion)
            - Provide concrete improvement examples
            - Keep feedback constructive and specific`,
            allowDynamicSteps: false,  // Stick to the plan
        },
    },
});
```

## Best Practices

- **Start with presets** - Use `AGENT_WORKFLOW`, `CODING_WORKFLOW`, or `CHAT_WORKFLOW` as a baseline
- **Customize incrementally** - Start with one custom prompt, test, then refine
- **Keep prompts focused** - Specific, task-oriented prompts yield better results
- **Test thoroughly** - Verify workflow behavior with various task types
- **Document behavior** - Use clear `name` and `description` for the workflow

## See Also

- [Workflows](/guides/workflows) - Learn about workflow types and events
- [Custom Modes](/guides/custom-modes) - Combine custom workflows with mode configurations
- [Modes](/guides/modes) - Understand built-in modes and their workflows
