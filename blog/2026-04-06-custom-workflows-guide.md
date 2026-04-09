---
slug: custom-workflows-guide
title: "Mastering Custom Workflows in Toolpack SDK"
authors: [sajeer-babu]
tags: [workflows, customization, planning, agent, development]
description: "Learn how to create custom workflows in Toolpack SDK. Master workflow presets, build custom planning prompts, control step execution, and design AI agents tailored to your specific use cases."
---

The Toolpack SDK workflow engine is powerful out of the box, but its real strength emerges when you customize it. Instead of relying solely on the built-in `AGENT_WORKFLOW`, `CODING_WORKFLOW`, or `CHAT_WORKFLOW` presets, you can craft workflows that match your exact requirements—whether that's a research agent, a code reviewer, or a deployment orchestrator.

This guide shows you how to build custom workflows from scratch, tune planning behavior, control step execution, and design workflows that fit your specific use cases.

<!-- truncate -->

## Why Custom Workflows?

The built-in workflow presets are designed for general-purpose tasks. But real-world applications often need specialized behavior:

- **Research agents** that methodically gather and synthesize information
- **Code reviewers** that analyze without modifying files
- **Deployment orchestrators** that require approval gates before executing
- **Data processors** that handle failures gracefully and continue
- **Exploratory agents** that adapt their plan as they discover new information

Custom workflows let you encode these behaviors directly into your mode configuration.

## Understanding Workflow Presets

Before building custom workflows, let's understand what the presets provide:

### AGENT_WORKFLOW

Full planning for complex, multi-step tasks.

```typescript
import { AGENT_WORKFLOW, createMode } from 'toolpack-sdk';

const myAgent = createMode({
  name: 'my-agent',
  displayName: 'My Agent',
  workflow: AGENT_WORKFLOW,
});
```

**Characteristics:**
- Detailed planning phase with up to 20 steps
- Step-by-step execution with progress tracking
- Automatic retry on failure (up to 3 attempts)
- Fixed plan execution (dynamic steps disabled)
- Complexity routing enabled for simple queries

### CODING_WORKFLOW

Concise planning optimized for software development.

```typescript
import { CODING_WORKFLOW, createMode } from 'toolpack-sdk';

const codingMode = createMode({
  name: 'my-coding',
  displayName: 'My Coding Mode',
  workflow: CODING_WORKFLOW,
});
```

**Characteristics:**
- Concise planning prompts focused on code changes
- Minimal conversational output
- Optimized for file operations and refactoring
- Efficient retry logic
- Best for debugging and code modifications

### CHAT_WORKFLOW

Direct execution without planning overhead.

```typescript
import { CHAT_WORKFLOW, createMode } from 'toolpack-sdk';

const chatMode = createMode({
  name: 'my-chat',
  displayName: 'My Chat Mode',
  workflow: CHAT_WORKFLOW,
});
```

**Characteristics:**
- No planning phase—direct tool execution
- Fast response times
- Single-turn execution
- Best for conversational tasks and quick queries

## Building Your First Custom Workflow

Let's build a research agent that gathers information systematically and documents findings.

```typescript
import { createMode, ModeConfig } from 'toolpack-sdk';

const researchAgent: ModeConfig = createMode({
  name: 'research-agent',
  displayName: 'Research Agent',
  description: 'Gathers information with web search and documents findings',
  systemPrompt: 'You are a research assistant. Gather information methodically, cite sources, and synthesize findings clearly.',
  
  allowedToolCategories: ['network', 'filesystem'],
  
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
      strategy: 'skip',  // Continue researching even if one source fails
    },
  },
});
```

### Key Components Explained

**Planning Configuration:**
- `enabled: true` — Activates the planning phase
- `maxSteps: 15` — Limits the initial plan to 15 steps
- `planningPrompt` — Custom instructions for how to structure the plan

**Step Configuration:**
- `retryOnFailure: true` — Automatically retry failed steps
- `maxRetries: 2` — Try each step up to 2 additional times
- `allowDynamicSteps: true` — Let the agent add new steps as it discovers more
- `maxTotalSteps: 25` — Hard cap including dynamic additions
- `stepPrompt` — Instructions for executing each individual step

**Failure Strategy:**
- `skip` — If a step fails after retries, skip it and continue (perfect for research where one failed source shouldn't stop everything)

## Custom Planning Prompts

The `planningPrompt` is where you shape how the AI thinks about breaking down tasks. Here's an example for a code analysis workflow:

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

Focus on concrete observations, not assumptions.
Each step should be atomic and verifiable.`,
  },
};
```

**Planning Prompt Best Practices:**
- Be specific about the order of operations
- Define what constitutes a single step
- Set clear boundaries (what to do vs. what to avoid)
- Include domain-specific guidance
- Keep it concise—the AI will use this alongside the main system prompt

## Custom Step Prompts

The `stepPrompt` controls how individual steps are executed. This is separate from planning and fires for each step in the workflow.

```typescript
const codingWorkflow = {
  steps: {
    enabled: true,
    stepPrompt: `Execute this coding task step.

Guidelines:
- Show only the code changes, no conversational filler
- Use diff format when modifying existing code
- Verify changes compile before proceeding
- Keep responses concise and technical

If a step fails, explain the error clearly and suggest alternatives.`,
  },
};
```

**Step Prompt Best Practices:**
- Define output format expectations
- Specify error handling behavior
- Set tone and verbosity level
- Include verification requirements
- Provide fallback instructions

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

| Strategy | Description | Best For |
|----------|-------------|----------|
| `abort` | Stop execution immediately | Critical operations where partial completion is dangerous |
| `skip` | Skip the failed step and continue | Data collection tasks where some failures are acceptable |
| `ask_user` | Pause and wait for user decision | Interactive workflows requiring human judgment |

**Note:** These are the only supported failure strategies in the current SDK version.

## Real-World Example: Code Review Mode

Let's build a complete code review workflow that analyzes code without modifying it:

```typescript
import { createMode } from 'toolpack-sdk';

const codeReviewMode = createMode({
  name: 'code-review',
  displayName: 'Code Review',
  description: 'Analyzes code and provides structured feedback',
  systemPrompt: 'You are a senior code reviewer. Provide structured, actionable feedback with specific line references.',
  
  allowedToolCategories: ['filesystem', 'coding', 'version-control'],
  blockedTools: ['fs.write_file', 'fs.delete_file', 'fs.append_file', 'fs.move_file'],
  
  workflow: {
    name: 'code-review',
    planning: {
      enabled: true,
      requireApproval: false,
      maxSteps: 12,
      planningPrompt: `Plan a comprehensive code review:

1. Read and understand the target file(s)
2. Analyze code structure and patterns
3. Check for common issues (security, performance, style)
4. Review documentation and comments
5. Synthesize findings into actionable feedback

Each step should focus on one specific aspect of the review.
Keep the plan focused and systematic.`,
    },
    steps: {
      enabled: true,
      retryOnFailure: true,
      maxRetries: 2,
      allowDynamicSteps: false,  // Stick to the approved plan
      stepPrompt: `Focus on specific aspects in each step:

- Note exact line numbers for issues
- Categorize findings (critical, warning, suggestion)
- Provide concrete improvement examples
- Keep feedback constructive and specific
- Reference language best practices when relevant`,
    },
    progress: {
      enabled: true,
      reportPercentage: true,
    },
    onFailure: {
      strategy: 'skip',  // If one file can't be read, continue with others
    },
  },
});
```

### Why This Works

**Tool Restrictions:**
- Allows reading files and checking version control
- Blocks all write operations—enforces read-only behavior at the SDK level

**Planning Strategy:**
- Fixed plan (`allowDynamicSteps: false`) ensures the review follows a structured approach
- Limited to 12 steps keeps reviews focused

**Failure Handling:**
- `skip` strategy means if one file fails to read, the review continues with others
- 2 retries handle transient filesystem issues

**Step Execution:**
- Custom `stepPrompt` enforces specific output format
- Requires line numbers and categorization

## Example: Deployment Orchestrator with Approval

Here's a workflow that requires human approval before executing any deployment steps:

```typescript
const deploymentMode = createMode({
  name: 'deployment',
  displayName: 'Deployment Orchestrator',
  description: 'Plans and executes deployments with approval gates',
  systemPrompt: 'You are a deployment orchestrator. Plan carefully, verify prerequisites, and execute deployments systematically.',
  
  allowedToolCategories: ['filesystem', 'execution', 'version-control'],
  
  workflow: {
    name: 'deployment',
    planning: {
      enabled: true,
      requireApproval: true,  // MUST get approval before executing
      maxSteps: 10,
      planningPrompt: `Plan a safe deployment:

1. Verify prerequisites (dependencies, environment variables)
2. Run tests to ensure code quality
3. Build the application
4. Create deployment artifacts
5. Deploy to target environment
6. Verify deployment success
7. Run smoke tests

Each step must be verifiable and reversible if possible.`,
    },
    steps: {
      enabled: true,
      retryOnFailure: true,
      maxRetries: 1,  // Only retry once for deployment steps
      allowDynamicSteps: false,  // No surprises—stick to the approved plan
      stepPrompt: `Execute this deployment step carefully:

- Verify prerequisites before proceeding
- Log all actions for audit trail
- Check for success/failure explicitly
- If a step fails, provide clear rollback instructions`,
    },
    progress: {
      enabled: true,
      reportPercentage: true,
    },
    onFailure: {
      strategy: 'abort',  // Stop immediately on failure—don't continue with a broken deployment
    },
  },
});
```

### Handling the Approval Gate

When `requireApproval: true`, you need to handle the approval in your application:

```typescript
const executor = toolpack.getWorkflowExecutor();

executor.on('workflow:plan_created', (plan) => {
  console.log('\n📋 Deployment Plan:');
  plan.steps.forEach((step, i) => {
    console.log(`  ${i + 1}. ${step.description}`);
  });
});

executor.on('workflow:progress', async (progress) => {
  if (progress.status === 'awaiting_approval') {
    // Show the plan to the user and get confirmation
    const approved = await promptUser('Approve this deployment plan? (yes/no): ');
    
    if (approved === 'yes') {
      executor.approvePlan(progress.planId);
      console.log('✅ Deployment approved. Executing...');
    } else {
      executor.rejectPlan(progress.planId);
      console.log('❌ Deployment cancelled.');
    }
  }
});
```

## Combining Workflows with Mode Configuration

Workflows become even more powerful when combined with other mode features:

```typescript
const secureAgent = createMode({
  name: 'secure-agent',
  displayName: 'Secure Agent',
  description: 'Agent with security-focused workflow and tool restrictions',
  systemPrompt: 'You are a security-conscious agent. Always verify before executing, never expose sensitive data.',
  
  // Tool restrictions
  allowedToolCategories: ['filesystem', 'coding'],
  blockedTools: ['fs.delete_file', 'execution.run_command'],
  
  // Custom workflow
  workflow: {
    planning: {
      enabled: true,
      requireApproval: true,  // Always require approval
      maxSteps: 8,
      planningPrompt: 'Plan carefully. Each step must be safe and reversible. Never plan steps that could expose sensitive data.',
    },
    steps: {
      enabled: true,
      retryOnFailure: true,
      maxRetries: 1,
      allowDynamicSteps: false,  // No dynamic additions—stick to approved plan
    },
    onFailure: {
      strategy: 'ask_user',  // Always ask on failure
    },
  },
  
  // Base context
  baseContext: {
    includeWorkingDirectory: true,
    includeToolCategories: true,
  },
});
```

## Best Practices

### 1. Start with Presets

Don't reinvent the wheel. Start with `AGENT_WORKFLOW`, `CODING_WORKFLOW`, or `CHAT_WORKFLOW` and customize incrementally:

```typescript
import { AGENT_WORKFLOW } from 'toolpack-sdk';

const myWorkflow = {
  ...AGENT_WORKFLOW,
  planning: {
    ...AGENT_WORKFLOW.planning,
    maxSteps: 10,  // Override just what you need
    planningPrompt: 'Your custom planning prompt here',
  },
};
```

### 2. Match Failure Strategy to Task Type

| Task Type | Recommended Strategy | Reason |
|-----------|---------------------|---------|
| Data collection | `skip` | Some failures are acceptable |
| Code modifications | `abort` | Partial changes can break things |
| Interactive tools | `ask_user` | Human judgment needed |
| Deployments | `abort` | Safety first |
| Research | `skip` | Continue gathering from other sources |

**Available strategies:** `abort`, `skip`, `ask_user`

### 3. Set Appropriate Step Limits

```typescript
// Tightly scoped task
workflow: {
  planning: { maxSteps: 5 },
  steps: { maxTotalSteps: 8 },
}

// Exploratory task
workflow: {
  planning: { maxSteps: 15 },
  steps: { maxTotalSteps: 30, allowDynamicSteps: true },
}
```

### 4. Use Dynamic Steps Wisely

Enable `allowDynamicSteps` for exploratory tasks where the agent needs to adapt:

```typescript
// Good for exploration
const auditMode = createMode({
  workflow: {
    steps: {
      allowDynamicSteps: true,  // Let it dig deeper as it finds issues
      maxTotalSteps: 40,
    },
  },
});

// Bad for approved workflows
const deployMode = createMode({
  workflow: {
    planning: { requireApproval: true },
    steps: {
      allowDynamicSteps: false,  // Don't deviate from approved plan
    },
  },
});
```

### 5. Test Your Prompts

Custom prompts are powerful but require testing:

```typescript
// Too vague
planningPrompt: 'Make a plan to do the task.'

// Better
planningPrompt: `Create a systematic plan:
1. Understand requirements
2. Break into atomic steps
3. Identify dependencies
4. Plan verification steps

Each step should accomplish exactly one thing.`
```

### 6. Document Your Workflows

Use clear names and descriptions:

```typescript
const myWorkflow = createMode({
  name: 'security-audit',  // Clear, specific name
  displayName: 'Security Audit',
  description: 'Scans codebase for security vulnerabilities without modifying files',
  workflow: {
    name: 'security-audit-workflow',  // Name the workflow too
    // ...
  },
});
```

## Workflow Events

All workflows emit events through the `WorkflowExecutor`. Use these to build rich UIs:

```typescript
const executor = toolpack.getWorkflowExecutor();

// Track progress
executor.on('workflow:progress', (progress) => {
  console.log(`[${progress.percentage}%] ${progress.currentStepDescription}`);
});

// Monitor step execution
executor.on('workflow:step_start', (step) => {
  console.log(`→ Starting: ${step.description}`);
});

executor.on('workflow:step_complete', (step) => {
  console.log(`✓ Completed: ${step.description}`);
});

// Handle dynamic additions
executor.on('workflow:step_added', (step) => {
  console.log(`+ Added step: ${step.description}`);
});
```

## Key Takeaways

- **Start with presets** — `AGENT_WORKFLOW`, `CODING_WORKFLOW`, and `CHAT_WORKFLOW` provide solid foundations
- **Customize incrementally** — Override only what you need, test thoroughly
- **Planning prompts shape behavior** — Use them to define how tasks are broken down
- **Step prompts control execution** — Define output format, error handling, and verification
- **Match failure strategy to use case** — `abort` for critical tasks, `skip` for data collection, `ask_user` for interactive workflows
- **Use approval gates for safety** — `requireApproval: true` for deployments and destructive operations
- **Combine with tool restrictions** — Workflows + blocked tools = robust safety boundaries
- **Test your workflows** — Verify behavior with various task types before production use

Custom workflows transform the Toolpack SDK from a general-purpose AI runtime into a specialized agent tailored to your exact requirements. Whether you're building a code reviewer, a deployment orchestrator, or a research assistant, custom workflows give you the control and safety guarantees you need for production applications.
