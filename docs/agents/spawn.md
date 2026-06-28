---
sidebar_position: 3
sidebar_label: Agent Spawning
description: "AI-driven dynamic agent spawning — let the LLM instantiate one-off helper agents mid-conversation using spawn_agent and spawn_agents_parallel tools."
keywords: [spawn, agent spawning, ephemeral agent, sub-agent, parallel agents, dynamic agents, spawn_agent, spawn_agents_parallel]
---

# Agent Spawning

Agent spawning lets the LLM instantiate lightweight helper agents on-demand during a `run()` call. When `spawn` is configured on a `BaseAgent`, two tools are automatically injected: `spawn_agent` (single) and `spawn_agents_parallel`. The LLM calls these tools to hand off focused sub-tasks, collects the results, and continues — all within a single top-level conversation turn.

Spawned agents are **ephemeral**: no channels, no registry entry, discarded after their task completes.

## Contents

- [When to use spawning](#when-to-use-spawning)
- [Basic setup](#basic-setup)
- [Templates](#templates)
- [Parallel spawning](#parallel-spawning)
- [Self-replication](#self-replication)
- [Depth control](#depth-control)
- [Prompt addition](#prompt-addition)
- [EphemeralAgent directly](#ephemeralagent-directly)
- [API reference](#api-reference)

---

## When to use spawning

Use spawning when:

- A single agent needs to fan out work to specialised sub-agents (e.g. a coordinator that spawns a researcher, a coder, and a reviewer)
- Sub-tasks are independent enough to run concurrently (`spawn_agents_parallel`)
- You want the LLM itself to decide which specialist to call, rather than hard-coding delegation logic

Spawning is different from [delegation](transport.md):

| | Delegation | Spawning |
|---|---|---|
| Agent lifecycle | Persistent, registered | Ephemeral, discarded after use |
| Who decides | Code (`delegateAndWait()`) | The LLM (tool call) |
| Requires registry | Yes | No |
| Concurrency | Sequential or fire-and-forget | Parallel built-in |
| Channels | Own channels | None |

---

## Basic setup

```typescript
import { BaseAgent } from '@toolpack-sdk/agents';
import type { AgentSpawnConfig } from '@toolpack-sdk/agents';

class OrchestratorAgent extends BaseAgent {
  name = 'orchestrator';
  description = 'Coordinates research and coding sub-tasks';
  mode = 'agent';

  spawn: AgentSpawnConfig = {
    enabled: true,
    templates: [
      {
        name: 'researcher',
        description: 'Searches the web and summarises findings on a specific topic.',
        systemPrompt: (task) =>
          `You are a focused research agent. Your task: ${task}\n` +
          `Search the web, gather relevant information, and return a concise summary.`,
      },
      {
        name: 'coder',
        description: 'Writes, refactors, or reviews code for a specific request.',
        systemPrompt: (task) =>
          `You are a senior software engineer. Your task: ${task}\n` +
          `Write clean, well-structured code. Return only the code and a brief explanation.`,
        model: 'claude-opus-4-8',  // override model for this template
      },
    ],
    maxDepth: 3,  // default
  };

  async invokeAgent(input) {
    return this.run(input.message);
  }
}
```

When `run()` is called, the LLM sees two additional tools:

- `spawn_agent` — spawn one helper agent for a single task
- `spawn_agents_parallel` — spawn multiple agents simultaneously

The LLM picks the right template based on its `name` and `description`, invokes the tool, and gets the result back as a tool response.

---

## Templates

Each template is an `AgentSpawnTemplate` — a plain config object, no subclassing required.

```typescript
interface AgentSpawnTemplate {
  name: string;                           // unique identifier shown to the LLM
  description: string;                    // purpose — LLM reads this to pick the right template
  systemPrompt: (task: string) => string; // factory called at spawn time with the task string
  model?: string;                         // model override — inherits parent when omitted
  allowPromptAddition?: boolean;          // allow LLM to append extra instructions (default: false)
}
```

The `systemPrompt` factory receives the task string the LLM passed to `spawn_agent`. This lets you embed the task cleanly into the system prompt rather than relying on the message:

```typescript
{
  name: 'summariser',
  description: 'Summarises a piece of text into bullet points.',
  systemPrompt: (task) => `Summarise the following into 5 bullet points:\n\n${task}`,
}
```

---

## Parallel spawning

Use `spawn_agents_parallel` when sub-tasks are independent. The LLM passes an array of `{ template, task }` objects and all agents run concurrently via `Promise.all`.

Example — the LLM might call:

```json
{
  "tasks": [
    { "template": "researcher", "task": "Find the top 3 AI chip manufacturers by revenue in 2025" },
    { "template": "researcher", "task": "Summarise recent TSMC earnings reports" },
    { "template": "coder",      "task": "Write a Python script to parse the attached CSV" }
  ]
}
```

All three run simultaneously. The tool returns:

```json
{
  "results": [
    { "output": "...", "spawnedTemplate": "researcher", "depth": 1 },
    { "output": "...", "spawnedTemplate": "researcher", "depth": 1 },
    { "output": "...", "spawnedTemplate": "coder",      "depth": 1 }
  ]
}
```

---

## Self-replication

Add a template named `'self'` to allow the LLM to spawn a replica of the current agent. The replica inherits the parent's mode and system prompt, with the template's `systemPrompt(task)` result appended:

```typescript
spawn: {
  enabled: true,
  templates: [
    {
      name: 'self',
      description: 'Spawn a copy of this agent to handle a parallel sub-task independently.',
      systemPrompt: (task) => `Focus exclusively on this sub-task: ${task}`,
    },
  ],
}
```

Self-replicas have the same mode, tools, and model as the parent. They do **not** share conversation history — each gets a fresh `conversationId`.

---

## Depth control

Spawned agents can themselves spawn (they inherit the parent's `spawn` config). The `maxDepth` option caps the recursion:

```typescript
spawn: {
  enabled: true,
  templates: [...],
  maxDepth: 2,  // parent can spawn → spawned can spawn → but no further
}
```

When a spawned agent reaches `maxDepth`, the `spawn_agent` and `spawn_agents_parallel` tools are **not injected** into its `run()` call. The chain stops silently — no error is thrown.

Default `maxDepth` is `3`.

---

## Prompt addition

Set `allowPromptAddition: true` on a template to let the LLM append custom instructions at spawn time via a `systemPromptAddition` parameter on the tool:

```typescript
{
  name: 'analyst',
  description: 'Analyses data and produces structured reports.',
  systemPrompt: (task) => `You are a data analyst. Task: ${task}`,
  allowPromptAddition: true,
}
```

When enabled, the LLM can call:

```json
{
  "template": "analyst",
  "task": "Analyse Q3 revenue by region",
  "systemPromptAddition": "Output must be in JSON. Use ISO 3166 country codes."
}
```

The `systemPromptAddition` is appended after `systemPrompt(task)`. Only enable this for templates where LLM-driven prompt customisation is safe — it gives the model significant control over the spawned agent's behaviour.

Templates without `allowPromptAddition: true` silently ignore any `systemPromptAddition` value even if the LLM tries to pass one.

---

## EphemeralAgent directly

`EphemeralAgent` is exported and can be instantiated directly for testing or advanced orchestration without the full spawn machinery.

**Standalone use** — pass `apiKey` and call `start()` to initialise the Toolpack client:

```typescript
import { EphemeralAgent } from '@toolpack-sdk/agents';
import { AGENT_MODE } from 'toolpack-sdk';

const ephemeral = new EphemeralAgent(
  'helper',
  'One-off helper agent',
  {
    ...AGENT_MODE,
    systemPrompt: 'You are a concise summariser. Return bullet points only.',
  },
  { apiKey: process.env.ANTHROPIC_API_KEY! },
);

await ephemeral.start(); // initialises the Toolpack client

const result = await ephemeral.invokeAgent({
  message: 'Summarise the key points of this article: ...',
  conversationId: `helper-${Date.now()}`,
});

console.log(result.output);
```

**Inside a BaseAgent subclass** — pass `{ toolpack: this.toolpack }` to share the parent's already-initialised client (no `start()` needed since the toolpack is already set):

```typescript
class MyAgent extends BaseAgent {
  async invokeAgent(input) {
    const ephemeral = new EphemeralAgent(
      'helper', 'desc', mode,
      { toolpack: this.toolpack }, // protected, accessible here
    );
    return ephemeral.invokeAgent({ message: input.message });
  }
}
```

`EphemeralAgent` has no channels, no interceptors, and no registry entry.

---

## API reference

### AgentSpawnConfig

```typescript
interface AgentSpawnConfig {
  enabled: boolean;                // must be true for tools to be injected
  templates: AgentSpawnTemplate[]; // available spawn targets shown to the LLM
  maxDepth?: number;               // max recursive spawn depth (default: 3)
}
```

### AgentSpawnTemplate

```typescript
interface AgentSpawnTemplate {
  name: string;
  description: string;
  systemPrompt: (task: string) => string;
  model?: string;
  allowPromptAddition?: boolean;   // default: false
}
```

### spawn_agent tool (injected)

| Parameter | Type | Description |
|-----------|------|-------------|
| `template` | `string` | Template name to spawn. Use `'self'` for a self-replica (if that template is listed). |
| `task` | `string` | Task message passed to the spawned agent. |
| `systemPromptAddition` | `string` | _(Only present in schema when at least one template has `allowPromptAddition: true`.)_ Extra instructions appended to the system prompt. Ignored by templates without `allowPromptAddition: true`. |

Returns: `{ output: string; spawnedTemplate: string; depth: number; metadata?: Record<string, unknown> }`

### spawn_agents_parallel tool (injected)

| Parameter | Type | Description |
|-----------|------|-------------|
| `tasks` | `Array<{ template, task, systemPromptAddition? }>` | List of agents to spawn simultaneously. `systemPromptAddition` only appears in the schema when at least one template has `allowPromptAddition: true`. |

Returns: `{ results: Array<{ output, spawnedTemplate, depth, metadata? }> }`

### EphemeralAgent

```typescript
class EphemeralAgent extends BaseAgent {
  constructor(
    name: string,
    description: string,
    mode: ModeConfig | string,
    options: BaseAgentOptions,   // pass { toolpack } to share parent's API client
  );
}
```
