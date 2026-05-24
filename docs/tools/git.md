---
sidebar_position: 8
description: "Toolpack SDK git tools for AI-powered version control. Check status, view diffs, commit changes, blame files, manage branches, and view commit history."
keywords: [git tools, AI git, version control, git status, git diff, git commit, git blame, branch management, Toolpack SDK git]
---

# Git Tools

Category: `version-control` · 10 tools

Version control operations for Git repositories.

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `git.clone` | `repo`, `sha`, `filter?`, `depth?`, `cloneRoot?` | Clone a GitHub repository at a specific commit SHA for local inspection |
| `git.status` | `path?` | Get modified, staged, untracked files |
| `git.diff` | `path?`, `staged?` | Show changes (staged or unstaged) |
| `git.log` | `maxCount?`, `path?` | Get recent commit history |
| `git.add` | `path` | Stage files for commit |
| `git.commit` | `message` | Commit staged changes |
| `git.blame` | `path` | Show who changed what |
| `git.branch_list` | `remote?` | List all branches |
| `git.branch_create` | `name` | Create a new branch |
| `git.checkout` | `branch` | Switch branches |

### `git.clone` Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | string | Yes | Repository in `owner/repo` format (e.g. `microsoft/typescript`) |
| `sha` | string | Yes | Commit SHA to checkout (7–40 hex characters). Always use SHAs, not branch names |
| `filter` | string | No | Git partial clone filter. `blob:none` (default) skips file blobs for a fast clone — blobs are fetched on demand. Use `none` when you need immediate access to all file contents |
| `depth` | number | No | Commit history depth. Default 50. Use `0` for full history when you need complete git log or blame across a long-lived file |
| `cloneRoot` | string | No | Override the local directory where clones are stored. Leave unset in almost all cases — the default is managed automatically |

Clones are cached per `repo`+`sha` pair. Repeated calls with the same arguments are instant. Disk is managed automatically with LRU eviction.

## Examples

### Cloning a Repo at a Specific Commit

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Clone acme/my-app at commit abc1234 and show me what changed' }],
    model: 'gpt-4o',
});
// AI uses git.clone, then git.diff or fs.* on the returned cloneDir
```

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
