---
sidebar_position: 14
sidebar_label: 'Skills'
description: "Toolpack SDK skill tools for creating, reading, updating, and listing behavioral skill files at runtime via LLM-callable tools."
keywords: [skill tools, skill.create, skill.read, skill.update, skill.list, behavioral skills, skill.md, Toolpack SDK skills]
---

# Skill Tools

Category: `skills` · 4 tools

LLM-callable tools for managing the skill library at runtime — create, read, update, and list `.skill.md` files from within an agent session.

## Setup

### Import

```typescript
import { createSkillTools } from 'toolpack-sdk';
```

### Wire up with Toolpack

Pair `createSkillTools` with `createSkillInterceptor` so that skills created at runtime are immediately picked up by the interceptor:

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

Both functions must point to the same `dir`.

## Tools

| Tool | Required Parameters | Optional Parameters | Description |
|------|---------------------|---------------------|-------------|
| `skill.create` | `name`, `title`, `description`, `triggers`, `instructions` | `tags`, `version` | Write a new `.skill.md` file to the skills directory |
| `skill.read` | `name` | `section` | Read a skill by name, optionally a specific section |
| `skill.update` | `name` | `title`, `description`, `triggers`, `instructions`, `addExamples`, `addTags` | Update fields of an existing skill |
| `skill.list` | — | `tag`, `verbose` | List all skills, optionally filtered by tag |

## Tool Reference

### `skill.create`

Write a new `.skill.md` file to the skills directory. The file name is derived from `name` (e.g., `code-review` → `code-review.skill.md`). Validation runs before writing — the call fails if any field violates the character limits or format rules.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Unique skill identifier in kebab-case (`^[a-z][a-z0-9-]*$`), max 50 chars |
| `title` | string | Yes | Human-readable display name, max 100 chars |
| `description` | string | Yes | Short description used for BM25 indexing (not injected into context), max 300 chars |
| `triggers` | string[] | Yes | 1–10 example phrases that should activate this skill, each max 100 chars |
| `instructions` | string | Yes | Behavioral instructions injected into the agent's context when the skill matches, max 5000 chars |
| `tags` | string[] | No | Optional tags for filtering. Max 10 tags, each max 30 chars |
| `version` | string | No | Semver version string (default: `1.0.0`) |

### `skill.read`

Read a skill file by name. When `section` is omitted the full file content is returned. Use this to inspect a skill before updating it, or to load the `examples` section (which is never auto-injected by the interceptor).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Skill identifier (kebab-case, without the `.skill.md` suffix) |
| `section` | string | No | Which section to return: `all` (default), `metadata`, `description`, `triggers`, `instructions`, or `examples` |

### `skill.update`

Update one or more fields of an existing skill. Only the fields provided are changed — all others remain as they are. The `updated` timestamp in the frontmatter is refreshed automatically on every write.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Identifier of the skill to update |
| `title` | string | No | New display name, max 100 chars |
| `description` | string | No | New description for BM25 indexing, max 300 chars |
| `triggers` | string[] | No | Replacement trigger list (1–10 items, each max 100 chars). Replaces the existing list entirely |
| `instructions` | string | No | Replacement instructions text, max 5000 chars. Replaces the existing instructions entirely |
| `addExamples` | string | No | Content to append to the `## Examples` section (creates the section if it does not exist) |
| `addTags` | string[] | No | Tags to add to the existing tag list. Duplicates are ignored |

### `skill.list`

List all `.skill.md` files found in the skills directory, including subdirectories. In default mode returns name, title, category, and tags. In verbose mode also includes description and triggers.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `tag` | string | No | Filter results to skills that include this tag |
| `verbose` | boolean | No | When `true`, include `description` and `triggers` in the output for each skill |

## Examples

### Creating a Skill

```typescript
const stream = toolpack.stream({
  messages: [{
    role: 'user',
    content: 'Create a skill for writing concise commit messages',
  }],
  model: 'claude-sonnet-4-20250514',
});
// AI uses skill.create with name "commit-messages", appropriate triggers, and instructions
```

### Reading a Skill's Examples

```typescript
const stream = toolpack.stream({
  messages: [{
    role: 'user',
    content: 'Show me the examples section of the code-review skill',
  }],
  model: 'claude-sonnet-4-20250514',
});
// AI uses skill.read with name "code-review" and section "examples"
```

### Refining Instructions

```typescript
const stream = toolpack.stream({
  messages: [{
    role: 'user',
    content: 'Update the code-review skill to also require a summary comment at the top of each review',
  }],
  model: 'claude-sonnet-4-20250514',
});
// AI uses skill.read to get current instructions, then skill.update with revised instructions
```

### Listing Skills by Tag

```typescript
const stream = toolpack.stream({
  messages: [{
    role: 'user',
    content: 'What coding skills do we have available?',
  }],
  model: 'claude-sonnet-4-20250514',
});
// AI uses skill.list with tag "coding" and verbose true
```

## Related

- [Skills Guide](/guides/skills) — Full guide covering the `.skill.md` format, interceptor setup, BM25 details, and best practices
