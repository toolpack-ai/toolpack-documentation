---
sidebar_position: 8
description: "Toolpack SDK git tools for AI-powered version control. Check status, view diffs, commit changes, blame files, manage branches, and view commit history."
keywords: [git tools, AI git, version control, git status, git diff, git commit, git blame, branch management, Toolpack SDK git]
---

# Git Tools

Category: `version-control` · 9 tools

Version control operations for Git repositories.

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `git.status` | `path?` | Get modified, staged, untracked files |
| `git.diff` | `path?`, `staged?` | Show changes (staged or unstaged) |
| `git.log` | `maxCount?`, `path?` | Get recent commit history |
| `git.add` | `path` | Stage files for commit |
| `git.commit` | `message` | Commit staged changes |
| `git.blame` | `path` | Show who changed what |
| `git.branch_list` | `remote?` | List all branches |
| `git.branch_create` | `name` | Create a new branch |
| `git.checkout` | `branch` | Switch branches |

## Examples

### Checking Status

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'What files have I changed?' }],
    model: 'gpt-4o',
});
// AI uses git.status
```

### Viewing Changes

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Show me the diff for utils.ts' }],
    model: 'gpt-4o',
});
// AI uses git.diff
```

### Committing

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Stage and commit these changes with message "Fix bug"' }],
    model: 'gpt-4o',
});
// AI uses git.add then git.commit
```

### Branch Management

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Create a new branch called feature/auth' }],
    model: 'gpt-4o',
});
// AI uses git.branch_create
```
