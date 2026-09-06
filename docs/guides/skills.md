---
sidebar_position: 11
description: "Learn how to use the Skills module in Toolpack SDK — define reusable behavioral instructions in .skill.md files and manage the skill library at runtime with LLM-callable tools."
keywords: [skills, createSkillTools, BM25, behavioral instructions, skill.md, Toolpack SDK skills]
---

# Skills

The skills system lets you define **reusable behavioral instructions** in Markdown files and expose them to the agent at runtime via LLM-callable tools. The agent can create, read, update, and list `.skill.md` files from within a session.

## Quick Start

```typescript
import { createSkillTools } from 'toolpack-sdk';

const skillTools = createSkillTools({ dir: '.toolpack/skills' });

// Attach skill tools per agent via ModeConfig.customTools:
// agent.mode = { ...agentMode, customTools: [...skillTools.tools] };
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
- "look over my PR"
- "find bugs in my implementation"
- "audit this for security issues"

## Instructions

When reviewing code:
1. Check for security vulnerabilities first
2. Verify test coverage exists
3. Flag naming inconsistencies
4. Be constructive — suggest improvements, not just problems
5. Format feedback as inline comments where possible

## Examples

### Input

A PR that adds a password reset endpoint with no rate limiting.

### Output

**Security**: No rate limiting on the reset endpoint — an attacker can enumerate valid emails. Add a per-IP limit (e.g. 5 requests per 15 minutes).

**Missing test**: No test for the case where the reset token is expired. Add one.

**Naming**: `resetUserPwd` → `resetPassword` — avoid abbreviations in public-facing method names.
```

Now when the agent needs to apply code-review behaviour, it calls `skill.read("code-review")` and the instructions are returned in the tool response for the LLM to act on.

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
| `## Instructions` | Returned to the LLM via `skill.read`. | **Yes — via `skill.read`** | 5000 chars |
| `## Examples` | Loaded on-demand via `skill.read`. Never auto-injected. | No | 3000 chars |

### Character Limits

| Field | Limit | Validation |
|-------|-------|------------|
| `name` | 50 chars | Must match `^[a-z][a-z0-9-]*$` |
| `title` | 100 chars | Any string |
| `tags` | 10 tags max, 30 chars each | Array of strings |
| `## Description` | 300 chars | Required section |
| `## Triggers` | 1–10 triggers, 100 chars each | At least one required |
| `## Instructions` | 5000 chars | Required section |
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

## The Skill Tools

`createSkillTools` registers four LLM-callable tools that let the agent manage the skill library at runtime. This is useful for agents that refine their own behaviors or help users create new skills.

### Setup

```typescript
import { createSkillTools } from 'toolpack-sdk';

const skillTools = createSkillTools({ dir: '.toolpack/skills' });

// Attach skill tools per agent via ModeConfig.customTools:
// agent.mode = { ...agentMode, customTools: [...skillTools.tools] };
```

### Available Tools

| Tool | Description |
|------|-------------|
| `skill.create` | Write a new `.skill.md` file |
| `skill.read` | Read a skill by name, optionally a specific section |
| `skill.update` | Update fields of an existing skill |
| `skill.list` | List all skills, optionally filtered by tag |

See the [Skill Tools reference](/tools/skills) for full parameter details.

---

## Writing Effective Triggers

Triggers are the most important part of a skill. BM25 is a keyword search — it can only match words that appear in the triggers you write. If a user asks "make my queries faster" and your triggers only say "optimize database", it won't match.

**Aim for 5–8 triggers.** A skill with fewer than 3 will generate a validation warning at startup.

**Cover the vocabulary space:**

| What to cover | Example (for a "database optimization" skill) |
|---|---|
| Short form | `"optimize queries"` |
| Long form | `"my database queries are running slow"` |
| Synonyms | `"speed up database"`, `"DB performance"` |
| User vocabulary | `"why is my SQL so slow"` |
| Domain term | `"query plan"`, `"index tuning"` |

**Avoid single-word triggers.** A trigger like `"database"` matches too broadly and will fire the skill on unrelated messages. Two-to-five words is the right size.

**Write from the user's perspective, not the developer's.** Think about what someone would actually type, not how you would name the feature:

```markdown
## Triggers

# Too generic — will match unrelated messages
- "database"
- "query"
- "performance"

# Too narrow — covers only one exact phrasing
- "optimize my PostgreSQL query execution plan"

# Good — diverse, natural, varied length
- "optimize database queries"
- "my queries are slow"
- "speed up database performance"
- "SQL performance tuning"
- "why is my database slow"
- "improve query speed"
```

**If a skill isn't being used when it should**, add more trigger phrases covering the vocabulary the user actually used.

---

## Writing Effective Examples

The `## Examples` section is never auto-injected. It's loaded on-demand when the agent calls `skill.read` — making it the right place for reference material that's useful sometimes, not always.

**Structure as input/output pairs, not prose.** The model applies examples as patterns. Prose descriptions of what good output looks like are much weaker than showing the actual output:

```markdown
## Examples

### Input

A PR that adds a new authentication endpoint with no tests.

### Output

**Security**: The endpoint accepts `role` from the request body — never trust client-supplied role values. Derive the role from the authenticated session instead.

**Tests**: No tests for the new endpoint. Add at minimum: happy path, missing auth token (401), and invalid role (403).

**Naming**: `createUserSession` is clearer than `doLogin`.

---

### Input

A React component that fetches user data in a `useEffect` with no error handling.

### Output

**Error handling**: The fetch has no error state. If the request fails, the component renders stale or empty data silently. Add an `error` state and a fallback UI.

**Performance**: Missing dependency array on `useEffect` — add `[userId]` to avoid fetching on every render.
```

Use `---` to separate examples so the model can clearly tell where one ends and the next begins.

**Keep examples generalisable.** An example about a specific auth module causes the model to apply auth-specific framing to unrelated code. Use generic scenarios that illustrate the *structure* of good output, not a specific domain.

**Tell the agent when to load them.** The examples section is only useful if the agent knows to reach for it. Add a cue at the end of your instructions:

```markdown
## Instructions

When reviewing code:
1. Check for security vulnerabilities first
2. Verify test coverage exists
3. Flag naming inconsistencies
4. Be constructive — suggest improvements, not just problems
5. Format feedback as inline comments where possible

For complex reviews or unfamiliar codebases, load the examples section first:
skill.read("code-review", "examples")
```

**When the agent should load examples:**
- The task is complex and the instructions leave room for interpretation
- The user asks "show me an example" or "how would you handle X"
- The skill is being used for the first time in a session

---

## Best Practices

1. **Keep instructions focused.** The 5000-character limit gives plenty of room — but longer isn't better. Instructions that are too long dilute the model's attention. If a skill is growing large, split it into two targeted skills.

2. **Write 5–8 diverse triggers.** Cover synonyms, short forms, long forms, and the vocabulary your users actually reach for. See [Writing Effective Triggers](#writing-effective-triggers) above. The validator will warn if you have fewer than 3.

3. **Use the description for context, not instructions.** The description is only used for indexing. Write it as a sentence explaining when this skill applies, not what the agent should do.

4. **Organize by category.** Use subdirectories (`coding/`, `communication/`) to group related skills. The directory name becomes a filterable `category` field.

5. **Write examples as input/output pairs, not prose.** Narrative descriptions of good output are far weaker than showing the actual output. See [Writing Effective Examples](#writing-effective-examples) above. Always tell the agent at the end of your instructions when to call `skill.read` to load them.

---

## Related

- [Skill Tools Reference](/tools/skills) — Full parameter reference for the 4 skill management tools
- [Custom Tools Guide](/guides/custom-tools) — How to build other kinds of custom tools
- [Interceptors](/agents/interceptors) — How interceptors work in the agent pipeline
