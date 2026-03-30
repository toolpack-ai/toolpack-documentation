---
slug: mastering-custom-modes
title: "Mastering Custom Modes in Toolpack SDK"
authors: [sajeer-babu]
tags: [modes, customization, tools, behavior]
description: "Learn how to use Custom Modes in the Toolpack SDK to strictly control your AI agent's behavior, restrict tool access, adjust workflows, and define completely new personas for your applications."
---

By default, the Toolpack SDK provides a unified AI agent runtime with full access to an extensive toolset. But giving an AI full runtime access is not always the correct architectural choice. Sometimes you need a chat-only assistant, a read-only DevOps reviewer, or a highly specialized agent confined to a strict workflow.

This is exactly what **Modes** solve. A "Mode" shapes the AI's persona, its capabilities, and its operational boundaries. In this guide, we will explore what modes do, how the built-in modes work, and how to create powerful custom ones from scratch.

<!-- truncate -->

## What is a Mode?

A `ModeConfig` in Toolpack defines the behavioral configuration for the AI client for a given turn. It encompasses:
- **System Prompt**: The underlying persona, context, and operational instructions sent to the AI.
- **Tool Filtering**: Explicit lists dictating which tool categories (or exact tools) the agent is allowed to use--and which ones to explicitly block.
- **Workflow Engine Rules**: Directives on whether the agent should plan, iterate through multi-step executions, or respond in a single turn.
- **Base Context Injection**: Instructions on whether the current working directory, filesystem structure, and available tools are dynamically injected into the system prompt.
- **Discovery**: How the agent discovers available tools natively (`alwaysLoadedTools`).

## Built-In Modes

The SDK ships with two out-of-the-box modes:

- **`agent` Mode (Default)**: Full autonomous access. The agent is strictly instructed to use tools, retry failures, construct multi-step plans, and browse the filesystem.
- **`chat` Mode**: A conversational assistant with limited web access. Code modification and local execution are disabled. Workflow loops are turned off to provide a single-turn, snappy chat experience.

But what if you need an AI behavior perfectly tailored to your internal company use-case? You build a **Custom Mode**.

## Building Custom Modes

The `createMode` utility function is the easiest way to generate a custom mode. It builds a `ModeConfig` with sensible defaults (where everything unmentioned is implicitly allowed or "pass-through") and lets you overwrite the specifics.

### Example 1: Pure Chat (No Tools Allowed)

Let's imagine you are building a UI where you want a raw, unstructured chat--absolutely zero tools loaded. We can easily achieve this using the `blockAllTools` attribute.

```typescript
import { createMode } from 'toolpack-sdk';

const simpleChat = createMode({
  name: 'simpleChat',
  displayName: 'Simple Chat',
  description: 'Pure conversational chat without access to any external tools.',
  systemPrompt: 'You are a helpful assistant. Provide clear and concise responses without attempting to interact with the system.',
  blockAllTools: true,
});
```

Because `blockAllTools` is `true`, Toolpack strips all tools from the LLM prompt. Even if the SDK is initialized with `tools: true`, in this mode, the model remains contained.

### Example 2: The Strict Code Reviewer

Now, suppose you are building an automated Pull Request reviewer. The agent must be allowed to read files, search the codebase, and report problems. However, it must **never** be allowed to overwrite files or run terminal commands. 

We can achieve this by heavily leveraging the filtering properties:

```typescript
import { createMode } from 'toolpack-sdk';

const reviewerMode = createMode({
  name: 'code-reviewer',
  displayName: 'Code Reviewer',
  description: 'Read-only access to evaluate and review the codebase.',
  systemPrompt: 'You are an expert security and performance code reviewer. Read the provided files and comment on structural optimizations. Do not attempt to fix the files yourself.',
  
  // We allow tools in the filesystem, network, and source control categories.
  allowedToolCategories: ['filesystem', 'git'],
  
  // But we strictly block the ability to edit or delete any files.
  // Block lists take precedence over allow lists.
  blockedTools: ['fs.write_file', 'fs.delete_file', 'fs.move_file'],
  
  // Explicitly block any dangerous tool categories
  blockedToolCategories: ['execution', 'system'],
  
  baseContext: {
    includeWorkingDirectory: true,
    includeToolCategories: true,
  },
  
  workflow: {
    planning: { enabled: true, requireApproval: false },
    steps: { enabled: true, retryOnFailure: false },
    progress: { enabled: true }
  }
});
```

In `reviewerMode`, the agent retains the cognitive ability to do multi-step workflows (reading files dynamically), but its boundaries are actively enforced by the SDK. If the AI attempts to hallucinate a `fs.write_file` invocation, the SDK will automatically block it.

## Registering Your Custom Mode

Once your modes are defined, you register them inside `Toolpack.init()` using the `customModes` array. You can also define which mode is active by default.

```typescript
import { Toolpack } from 'toolpack-sdk';
// Assume simpleChat and reviewerMode are imported here

const toolpack = await Toolpack.init({
  providers: { openai: {} },
  defaultProvider: 'openai',
  
  // Initialize standard tools
  tools: true,
  
  // Register custom modes alongside built-in ones
  customModes: [simpleChat, reviewerMode],
  
  // Optionally start in your custom mode
  defaultMode: 'code-reviewer',
});
```

## Mode Overrides: Tweaking Built-in Modes

Often, you do not need to build a mode entirely from scratch. Perhaps the built-in `agent` mode works fine, but you want to append a specific rule to its system prompt (e.g., "you are a python expert") or change how tools are loaded.

The `Toolpack.init()` configuration supports **Mode Overrides**, a strategic way to patch behavior on top of an existing mode definition.

```typescript
const toolpack = await Toolpack.init({
  providers: { openai: {} },
  defaultProvider: 'openai',
  tools: true,
  defaultMode: 'agent',

  // Selectively overwrite configuration on existing modes
  modeOverrides: {
    agent: {
      // Overriding the default agent prompt to include specific company knowledge commands
      systemPrompt: [
        'You are an autonomous AI agent with full access to all available tools.',
        'You must use the tools provided to accomplish tasks end-to-end proactively.',
        'If you require a capability that is not listed in your current tools, ALWAYS use `tool.search` to find it before improvising or giving up.',
        'You also have access to `skill.search` and `skill.read` tools to find reusable instructions if needed.',
        'Verify your actions and check for success or failure states.',
        'Explain your actions briefly as you go.',
      ].join('\n'),

      // Overriding how tools are mapped and cached natively
      toolSearch: {
        alwaysLoadedTools: [
          // If you supply an empty array, the AI is forced to manually
          // use `tool.search` to retrieve all operational procedures dynamically!
        ],
      },
    },
  },
});
```

In this case, the underlying `agent` mode is patched at runtime, merging your override attributes flawlessly into the master configuration.

## Changing Modes Dynamically

Because modern applications require switching context rapidly, you can change the SDK's mode at runtime. The change takes effect on the very next `generate()` or `stream()` call.

```typescript
// Explicitly switch to a named mode
toolpack.setMode('simpleChat');

// Generate using simpleChat rules (no tools executed)
const response = await toolpack.generate({
  model: 'gpt-4.1',
  messages: [{ role: 'user', content: 'Tell me a joke.' }]
});

// Cycles through all registered modes sequentially
toolpack.cycleMode(); 
```

You can view the list of currently registered modes inside your runtime state using:
```typescript
const availableModes = toolpack.getModes();
const currentMode = toolpack.getMode();

console.log(`Currently acting as: ${currentMode?.displayName}`);
```

## Key Takeaways

1. **Safety via Boundaries**: Use `allowedToolCategories` and `blockedTools` extensively. Do not rely entirely on the LLM "behaving itself"--the SDK's runtime filters are an objective safety barrier.
2. **Workflow Controls**: Customize `workflow` properties inside your mode. Conversational workflows should turn off step planning entirely for snappier generation.
3. **Override over Rebuild**: If a built-in mode like `agent` has 90% of what you need, use `modeOverrides` through `Toolpack.init()` to inject custom prompts or adapt tool searching, rather than rebuilding it via `createMode`.
4. **Registration**: Ensure modes are fully registered via the `customModes` array during initialization. 
