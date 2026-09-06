---
sidebar_position: 12
description: "Learn how to use the Rules system in Toolpack SDK — define always-on behavioral constraints in Markdown files, auto-discovered by mode name and shared __global__ folder."
keywords: [rules, agent rules, rulesDir, behavioral constraints, guardrails, createMode, Toolpack SDK rules]
---

# Rules

Rules let you define **always-on behavioral constraints** for your agents in Markdown files. Unlike [Skills](/guides/skills) which are BM25-matched and injected only when relevant, rules are injected into every request — the LLM always sees them before it reads the conversation.

## Quick Start

Create a rules directory for your agent:

```
.warren/rules/
  __global__/
    compliance.md
  equity-analyst/
    india-only.md
```

Then point your mode at it:

```typescript
import { Toolpack, createMode } from 'toolpack-sdk';

const equityAnalyst = createMode({
  name: 'equity-analyst',
  displayName: 'Equity Analyst',
  systemPrompt: 'You are an equity market analyst...',
  rulesDir: '.warren/rules',
});

const toolpack = await Toolpack.init({
  provider: 'vertexai',
  customModes: [equityAnalyst],
  defaultMode: 'equity-analyst',
});
```

Every request the agent handles will now include the rules from `__global__/` and `equity-analyst/` in its system prompt.

---

## Rule File Format

Rule files are plain Markdown. The only convention is:

- A top-level `# heading` (e.g. `# RULES`) is **stripped** — it is redundant inside the `<rules>` block the SDK assembles
- All `##` sub-headings and their content are **kept** — use them to group related rules

```markdown
# RULES

## Privacy
1. Do not store or log personally identifiable information
2. Mask phone numbers and emails in any output

## Market Scope
1. Only operate on Indian equity markets (NSE / BSE)
2. Reject queries about foreign stocks or forex

## Integrity
1. Never fabricate financial data or price levels
2. Always cite the source when quoting a statistic
```

The assembled `<rules>` block the LLM sees:

```
<rules>
## Privacy
1. Do not store or log personally identifiable information
2. Mask phone numbers and emails in any output

## Market Scope
1. Only operate on Indian equity markets (NSE / BSE)
2. Reject queries about foreign stocks or forex
</rules>
```

File names are never exposed to the LLM — only the content.

---

## Directory Structure

Set `rulesDir` on a mode to point to a rules root directory. The SDK then auto-discovers two subfolders:

```
<rulesDir>/
  __global__/       ← loaded for ALL modes sharing this rulesDir
    compliance.md
    no-pii.md
  equity-analyst/   ← loaded only when mode name is "equity-analyst"
    india-only.md
  news-fetcher/     ← loaded only when mode name is "news-fetcher"
    sources.md
```

### `__global__/`

Rules in `__global__/` are injected for every mode that uses the same `rulesDir`. Use this for cross-cutting constraints that apply to your entire agent — compliance rules, privacy policies, output formatting standards.

### `<mode-name>/`

Rules in a folder matching the mode's `name` are injected only for that mode. Use this for mode-specific constraints — an equity analyst mode rejecting non-Indian stocks, a news fetcher mode limiting to approved sources.

Both folders are scanned **recursively**, so you can organize rule files into subfolders:

```
__global__/
  legal/
    gdpr.md
    data-retention.md
  output/
    formatting.md
```

---

## Multiple Modes Sharing a Rules Directory

All modes in the same agent can point to the same `rulesDir`. Each mode gets the `__global__/` rules plus its own named folder:

```typescript
const equityAnalyst = createMode({
  name: 'equity-analyst',
  systemPrompt: '...',
  rulesDir: '.warren/rules',
});

const newsFetcher = createMode({
  name: 'news-fetcher',
  systemPrompt: '...',
  rulesDir: '.warren/rules',
});
```

```
.warren/rules/
  __global__/         ← both modes get these
    compliance.md
  equity-analyst/     ← equity-analyst only
    india-only.md
  news-fetcher/       ← news-fetcher only
    sources.md
```

---

## Default Rules Directory

If `rulesDir` is not set on a mode, the SDK falls back to `.toolpack/rules`. This means rules work out of the box for standard Toolpack projects without any configuration:

```
.toolpack/rules/
  __global__/
    default-rules.md
  my-mode/
    specific-rules.md
```

For agent projects that use a custom folder (e.g. `.warren/`), set `rulesDir` explicitly on each mode.

---

## How Rules Are Injected

Rules are appended to the system prompt on every request, after the mode's `systemPrompt`:

```
[mode system prompt]

[base agent context]

<rules>
## Privacy
...

## Market Scope
...
</rules>

--- conversation ---
user: ...
```

This position — after the persona, just before the conversation — uses the **recency effect**: the LLM reads the rules immediately before processing the user's message, so they are fresh in context when the model decides how to respond.

Rules are loaded once and cached per mode. Adding new rule files requires restarting the process.

---

## Rules vs Skills

| | Rules | Skills |
|---|---|---|
| **When injected** | Every request | Only when BM25 matches the user message |
| **Purpose** | Behavioral constraints — what the agent must not do | Behavioral knowledge — how the agent should approach a task |
| **Format** | Plain Markdown | Structured `.skill.md` with frontmatter and sections |
| **Best for** | Compliance, privacy, scope limits | Domain expertise, step-by-step procedures |

Use rules and skills together — rules define the boundaries, skills define the expertise within those boundaries.

---

## Best Practices

1. **Keep rules short and specific.** Vague rules like "be helpful" are ignored in practice. Precise rules like "only operate on NSE/BSE listed stocks" are reliably followed.

2. **Use `##` sub-headings to group rules.** The LLM applies rules more consistently when they are categorized — it can reason about "Privacy" rules as a group rather than treating a flat list of constraints as unrelated.

3. **Numbered lists outperform bullet points.** Models trained on instruction-following data respond better to numbered sequences than unordered lists for constraints.

4. **Put cross-cutting rules in `__global__/`**, mode-specific rules in the mode's named folder. Avoid duplicating rules across files — if a rule changes, it should only need to change in one place.

5. **Rules are behavioral guardrails, not security boundaries.** The LLM interprets rules as instructions and follows them reliably in normal use. For hard capability limits (e.g. "never call this tool"), use `blockedTools` in `createMode()` — that is enforced at the SDK level regardless of what the LLM decides.

---

## Related

- [Custom Modes](/guides/custom-modes) — Full mode configuration reference, including `rulesDir`
- [Skills](/guides/skills) — BM25-matched behavioral instructions for on-demand injection
- [Modes Overview](/guides/modes) — Overview of built-in and custom modes
