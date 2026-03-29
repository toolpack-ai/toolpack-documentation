---
sidebar_position: 9
description: "Toolpack SDK diff tools for creating, applying, and previewing unified diff patches. Generate diffs between content versions and apply patches to files."
keywords: [diff tools, unified diff, patch files, create diff, apply patch, preview diff, Toolpack SDK diff tools]
---

# Diff Tools

Category: `diff` · 3 tools

Create and apply unified diffs for safe, auditable file edits.

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `diff.create` | `oldContent`, `newContent` | Generate a unified diff |
| `diff.apply` | `path`, `patch` | Apply a patch to a file |
| `diff.preview` | `path`, `patch` | Preview patch result without applying |

## Examples

### Creating Diffs

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Show me a diff of the changes you want to make' }],
    model: 'gpt-4o',
});
// AI uses diff.create
```

### Applying Patches

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Apply this patch to the file' }],
    model: 'gpt-4o',
});
// AI uses diff.apply
```

### Previewing Changes

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Preview what this patch would do' }],
    model: 'gpt-4o',
});
// AI uses diff.preview
```

## Use Cases

- **Safe edits** - Preview changes before applying
- **Code review** - Generate diffs for review
- **Rollback** - Create reverse patches
