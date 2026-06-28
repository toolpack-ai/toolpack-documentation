---
sidebar_position: 11
sidebar_label: Hot Reload
description: "Watch source files and .env for changes, compile TypeScript automatically, and restart agents gracefully without dropping in-flight conversations."
keywords: [hot reload, graceful restart, HotReloadWatcher, scheduleRestart, file watcher, live reload, agent restart]
---

# Hot Reload & Graceful Restart

`HotReloadWatcher` watches your source files and `.env` files for changes. When a change stabilises (after a configurable debounce window) it compiles TypeScript (for `.ts`/`.tsx` changes) or reloads immediately (for `.env*` changes), then triggers a graceful restart — waiting until all active conversations finish before calling `process.exit(0)`. A process manager (PM2, systemd) then brings the process back up with the new compiled output and environment variables.

## Contents

- [How it works](#how-it-works)
- [Setup](#setup)
- [Debounce behaviour](#debounce-behaviour)
- [scheduleRestart options](#schedulerestart-options)
- [Persistent conversation history](#persistent-conversation-history)
- [Dynamic agent management](#dynamic-agent-management)
- [Self-evolving agents](#self-evolving-agents)
- [API reference](#api-reference)

---

## How it works

```
file change detected
        │
        ▼
  debounce timer resets           ← resets on every new change
        │  (30 s of silence)
        ▼
  ┌─────────────────────────────────────┐
  │  .ts / .tsx change?                 │
  │    → npx tsc --build                │
  │      ├─ exit 0  → onRestartNeeded() │
  │      └─ exit 1  → onCompileError()  │
  │                                     │
  │  .env* change?                      │
  │    → onRestartNeeded() directly     │
  └─────────────────────────────────────┘
        │
        ▼
  registry.scheduleRestart()
        │
        ▼
  wait for all conversations to finish
  (or max 30 min deadline)
        │
        ▼
  process.exit(0)
        │
        ▼
  PM2 / systemd restarts with new dist/ + .env
```

---

## Setup

```typescript
import { AgentRegistry, HotReloadWatcher } from '@toolpack-sdk/agents';

const registry = new AgentRegistry([myAgent]);
await registry.start();

const watcher = new HotReloadWatcher({
  watchPaths: ['./src'],      // directories or files to watch
  cwd: process.cwd(),         // working directory for tsc --build
  debounceMs: 30_000,         // default: 30 seconds
  onRestartNeeded: () => registry.scheduleRestart(),
  onCompileError: (msg) => console.error('[tsc]', msg),
});
watcher.start();
```

`watcher.stop()` closes all file watchers and cancels any pending debounce timer.

### PM2 example

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'my-agent',
    script: './dist/index.js',
    watch: false,          // let HotReloadWatcher handle watching
    autorestart: true,     // restart on process.exit(0)
    exp_backoff_restart_delay: 100,
  }],
};
```

---

## Debounce behaviour

The debounce timer **resets on every new file change**. Compile fires only after the specified period of silence:

```
edit a.ts   ──┐
edit b.ts   ──┤── debounce resets each time
edit c.ts   ──┘
              │  (30 s of silence)
              ▼
          tsc --build  ← one compile, regardless of how many files changed
```

This means rapid edits (saving multiple files in quick succession) produce exactly one compile run. The default 30 seconds is chosen for agent development where you might edit several files across a minute or two before wanting the agent to pick up the changes.

Adjust with `debounceMs`:

```typescript
// Faster feedback during active development
new HotReloadWatcher({ debounceMs: 5_000, ... });

// Longer wait for slow typists or teams making many interconnected changes
new HotReloadWatcher({ debounceMs: 60_000, ... });
```

---

## scheduleRestart options

```typescript
registry.scheduleRestart({
  maxWaitMinutes: 30, // force restart after this many minutes even if conversations are still active
});
```

`scheduleRestart()` is **idempotent** — if multiple file changes trigger `onRestartNeeded` before the restart executes, only the first call has any effect. Subsequent calls are ignored.

The deadline timer ensures the process never stays alive indefinitely waiting for a conversation that never finishes (e.g., a stalled long-running task).

---

## Persistent conversation history

In-memory conversation history (`InMemoryConversationStore`) is lost when the process exits. Use `SQLiteConversationStore` from `toolpack-sdk` so history survives restarts.

First, install the peer dependency:

```bash
npm install better-sqlite3
```

```typescript
import { SQLiteConversationStore } from 'toolpack-sdk';

class MyAgent extends BaseAgent {
  name = 'my-agent';
  description = 'My agent';
  mode = 'chat';

  conversationHistory = new SQLiteConversationStore({ dbPath: './conversations.db' });

  async invokeAgent(input) {
    return this.run(input.message);
  }
}
```

The SQLite file survives `process.exit(0)`. When the process restarts, the new instance re-opens the same file and picks up full conversation history. Users can continue a conversation mid-thread as if nothing happened — they just see a brief gap (typically a few seconds) while PM2 brings the process back up.

See [conversation-history.md](conversation-history.md) for the full `ConversationStore` API and alternative implementations.

---

## Dynamic agent management

`AgentRegistry` supports adding and removing agents at runtime after `start()` — useful if the restart involves swapping out specific agents without a full process restart:

```typescript
// Add an agent after the registry is already running
const newAgent = new ResearchAgent({ apiKey: process.env.ANTHROPIC_API_KEY });
await registry.addAgent(newAgent); // wired + started immediately

// Remove an agent by name — stops it and unregisters its channels
await registry.removeAgent('old-agent');
```

`isAllIdle()` returns `true` when no agent has an active conversation lock:

```typescript
if (registry.isAllIdle()) {
  console.log('Safe to restart now');
}
```

---

## Self-evolving agents

If an agent uses a `CodingAgent` sub-agent to edit its own source files, here is the full sequence:

```
orchestrator.invokeAgent() called
        │
        ├─ conversation lock acquired
        │
        ├─ delegates to CodingAgent
        │    └─ CodingAgent edits src/my-agent.ts
        │         └─ HotReloadWatcher detects the change
        │              └─ 30s debounce starts (resets on each change)
        │
        ├─ CodingAgent returns result
        │
        └─ orchestrator returns result
             └─ conversation lock released

        (30 s of silence after last edit)
        │
        └─ tsc --build succeeds → onRestartNeeded() → scheduleRestart()
             └─ isAllIdle() → true (lock already released)
                  └─ _executeRestart() → process.exit(0)
                       └─ PM2 restarts with new compiled code
```

The debounce and compile happen after the edits stabilise — typically after the CodingAgent and orchestrator have already finished. `scheduleRestart()` checks `isAllIdle()` immediately on first call; if all conversations are already done it restarts right away, otherwise it waits for the next `agent:complete` event.

---

## API reference

### HotReloadWatcher

```typescript
import { HotReloadWatcher } from '@toolpack-sdk/agents';
import type { HotReloadWatcherOptions, WatchFn, SpawnFn } from '@toolpack-sdk/agents';

class HotReloadWatcher {
  constructor(options: HotReloadWatcherOptions);
  start(): void;   // begin watching all watchPaths
  stop(): void;    // close all watchers, cancel pending debounce timer
}
```

#### HotReloadWatcherOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `watchPaths` | `string[]` | **required** | Directories or files to watch |
| `cwd` | `string` | `process.cwd()` | Working directory for `tsc --build` |
| `debounceMs` | `number` | `30_000` | Silence window (ms) before acting on changes |
| `onRestartNeeded` | `() => void` | **required** | Called after a successful compile or an `.env*` change |
| `onCompileError` | `(stderr: string) => void` | — | Called when `tsc --build` exits non-zero. Restart is **not** triggered. |
| `spawnFn` | `SpawnFn` | `child_process.spawn` | Override spawn (for testing) |
| `watchFn` | `WatchFn` | `fs.watch` | Override file watcher (for testing) |

### AgentRegistry — restart methods

```typescript
class AgentRegistry {
  // Returns true when every agent has no active conversation locks
  isAllIdle(): boolean;

  // Schedule a graceful restart. Idempotent — subsequent calls are ignored.
  scheduleRestart(options?: { maxWaitMinutes?: number }): void;

  // Add an agent. Wired + started immediately if registry is already running.
  addAgent(agent: BaseAgent): Promise<void>;

  // Remove an agent by name. Stops it and unregisters its channels.
  removeAgent(name: string): Promise<void>;
}
```
