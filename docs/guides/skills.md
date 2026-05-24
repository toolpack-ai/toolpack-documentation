---
sidebar_position: 10
description: "Learn how to use the Skills module in Toolpack SDK — define reusable behavioral instructions in .skill.md files, auto-inject them via BM25 search, and manage the skill library at runtime with LLM-callable tools."
keywords: [skills, skill interceptor, createSkillInterceptor, createSkillTools, BM25, behavioral instructions, skill.md, Toolpack SDK skills]
---

# Skills

The skills system lets you define **reusable behavioral instructions** in Markdown files and automatically inject them into agent requests based on message relevance. Skills require zero agent code changes — add a `.skill.md` file to your skills directory and the interceptor handles the rest.

## Quick Start

```typescript
import { Toolpack, createSkillInterceptor, createSkillTools } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
  provider: 'anthropic',
  interceptors: [
    createSkillInterceptor({ dir: '.toolpack/skills', maxSkills: 3, minScore: 0.3 }),
  ],
  customTools: [
    createSkillTools({ dir: '.toolpack/skills' }),
  ],
});
```

Create your first skill at `.toolpack/skills/code-review.skill.md`:

```markdown
---
name: code-review
title: Code Review
version: 1.0.0
tags: ["coding", "quality"]
updated: 2026-01-15T10:00:00.000Z
---

## Description

Guides the agent through a structured code review process. Used for PR reviews, security audits, and quality checks.

## Triggers

- "review this code"
- "check my pull request"
- "code review"

## Instructions

When reviewing code:
1. Check for security vulnerabilities first
2. Verify test coverage exists
3. Flag naming inconsistencies
4. Be constructive — suggest improvements, not just problems
5. Format feedback as inline comments where possible

## Examples

[Optional — loaded on-demand via skill.read only, never auto-injected]
```

Now when a user sends a message like "review this PR", the interceptor automatically injects the code-review instructions before the LLM sees the message.

---

## The `.skill.md` Format

Every skill file must follow this exact structure:

### Frontmatter

```markdown
---
name: code-review         # Required. Kebab-case identifier.
title: Code Review        # Required. Human-readable display name.
version: 1.0.0            # Required. Semver version string.
tags: ["coding", "quality"] # Optional. Array of tag strings.
updated: 2026-01-15T10:00:00.000Z  # Optional. ISO 8601 timestamp.
---
```

### Sections

| Section | Purpose | Injected? | Limit |
|---------|---------|-----------|-------|
| `## Description` | Used for BM25 indexing. Not visible to the LLM. | No | 300 chars |
| `## Triggers` | Example phrases used for BM25 indexing. Not visible to the LLM. | No | 1–10 triggers, 100 chars each |
| `## Instructions` | The only section injected into the agent's context. | **Yes** | 2000 chars |
| `## Examples` | Loaded on-demand via `skill.read`. Never auto-injected. | No | 3000 chars |

### Character Limits

| Field | Limit | Validation |
|-------|-------|------------|
| `name` | 50 chars | Must match `^[a-z][a-z0-9-]*$` |
| `title` | 100 chars | Any string |
| `tags` | 10 tags max, 30 chars each | Array of strings |
| `## Description` | 300 chars | Required section |
| `## Triggers` | 1–10 triggers, 100 chars each | At least one required |
| `## Instructions` | 2000 chars | Required section |
| `## Examples` | 3000 chars | Optional section |

---

## Directory Layout

Skills can be organized in subdirectories. The folder name becomes the skill's `category` field automatically:

```
.toolpack/
  skills/
    code-review.skill.md           # category: (none)
    coding/
      security-review.skill.md    # category: coding
      performance-review.skill.md # category: coding
    communication/
      email-writing.skill.md      # category: communication
```

---

## The Skill Interceptor

`createSkillInterceptor` registers an SDK-level interceptor that runs before every `Toolpack.generate()` call. It performs BM25 search on the last user message and injects matching skill instructions into the request.

### Setup

```typescript
import { Toolpack, createSkillInterceptor } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
  provider: 'anthropic',
  interceptors: [
    createSkillInterceptor({
      dir: '.toolpack/skills',
      maxSkills: 3,
      minScore: 0.3,
      onValidationError: 'fail',
    }),
  ],
});
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dir` | string | `.toolpack/skills` | Path to the skill files directory |
| `maxSkills` | number | `3` | Maximum number of skills injected per message |
| `minScore` | number | `0.3` | BM25 relevance threshold. Skills scoring below this are ignored |
| `onValidationError` | `'fail'` \| `'warn'` | `'fail'` | How to handle invalid `.skill.md` files at startup |

### Activation Flow

1. A message arrives and `Toolpack.generate()` is called.
2. The interceptor extracts the last user message text.
3. BM25 searches all skill files using weighted fields:
   - Name and title — weight ×3
   - Tags and triggers — weight ×2
   - Description — weight ×1
4. Skills scoring above `minScore` are selected (up to `maxSkills`).
5. Their `## Instructions` sections are prepended to the user message as a `<skill-instructions>` XML block.
6. The LLM runs with behavioral instructions already in context.

### Startup Validation

The interceptor validates all `.skill.md` files eagerly at `Toolpack.init()` time — not lazily on the first message.

**`'fail'` mode (default):** Any invalid file throws at startup with a clear error listing the file and exactly what is wrong. The process refuses to start.

**`'warn'` mode:** Invalid skills are skipped and logged to stderr. Valid skills load normally.

### BM25 Index

- Built in-memory at startup — no external dependency.
- Automatically reindexes when any `.skill.md` file's mtime changes.
- Worst-case context cost: `maxSkills(3) × instructions_limit(2000 chars) = 6000 chars`.

---

## The Skill Tools

`createSkillTools` registers four LLM-callable tools that let the agent manage the skill library at runtime. This is useful for agents that refine their own behaviors or help users create new skills.

### Setup

```typescript
import { Toolpack, createSkillInterceptor, createSkillTools } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
  provider: 'anthropic',
  interceptors: [
    createSkillInterceptor({ dir: '.toolpack/skills' }),
  ],
  customTools: [
    createSkillTools({ dir: '.toolpack/skills' }),
  ],
});
```

Both functions should point to the same `dir` so that skills created via `skill.create` are immediately visible to the interceptor.

### Available Tools

| Tool | Description |
|------|-------------|
| `skill.create` | Write a new `.skill.md` file |
| `skill.read` | Read a skill by name, optionally a specific section |
| `skill.update` | Update fields of an existing skill |
| `skill.list` | List all skills, optionally filtered by tag |

See the [Skill Tools reference](/tools/skills) for full parameter details.

---

## Best Practices

1. **Keep instructions concise.** The 2000-character limit exists for a reason — instructions that are too long dilute focus. If a skill needs more space, split it into two targeted skills.

2. **Write specific triggers.** BM25 matching works best when triggers are representative of the exact phrases users send. Include short forms, long forms, and common misspellings.

3. **Use the description for context, not instructions.** The description is only used for indexing. Write it as a sentence explaining when this skill applies, not what the agent should do.

4. **Organize by category.** Use subdirectories (`coding/`, `communication/`) to group related skills. The directory name becomes a filterable `category` field.

5. **Use `onValidationError: 'warn'` during development.** Switch to `'fail'` before deploying to production so invalid skills never silently slip through.

6. **Set `minScore` deliberately.** A threshold of `0.3` works well for general use. Raise it if unrelated skills are injecting too often; lower it if relevant skills are being missed.

---

## Related

- [Skill Tools Reference](/tools/skills) — Full parameter reference for the 4 skill management tools
- [Custom Tools Guide](/guides/custom-tools) — How to build other kinds of custom tools
- [Interceptors](/agents/interceptors) — How interceptors work in the agent pipeline
