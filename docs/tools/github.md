---
sidebar_position: 14
sidebar_label: 'GitHub'
description: "Toolpack SDK GitHub tools for PR reviews, file contents, GraphQL queries, and issue comments via the GitHub GraphQL and REST APIs."
keywords: [github tools, GitHub API, pull request review, GraphQL, PR diff, PR files, issue comments, Toolpack SDK GitHub]
---

# GitHub Tools

Category: `network` · 9 tools

GitHub GraphQL/REST tools for PR threads, comments, and contents.

## Setup

### Authentication

GitHub tools support three authentication methods, resolved in priority order:

1. Explicit `token` parameter passed in the tool call
2. `GITHUB_PAT` environment variable (Personal Access Token)
3. GitHub App installation token — minted automatically from `GITHUB_APP_ID` + `GITHUB_APP_PRIVATE_KEY`

```bash
# Option A: Personal Access Token
export GITHUB_PAT=ghp_your_personal_access_token

# Option B: GitHub App
export GITHUB_APP_ID=123456
export GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."
```

> **Note:** Some mutations (e.g. `github.pr.reviewThreads.resolve`) require a PAT with `repo` scope. GitHub App installation tokens receive `FORBIDDEN` for those operations. See the individual tool reference below.

### Import

```typescript
import { githubToolsProject } from 'toolpack-sdk';
```

### Wire up with Toolpack

```typescript
import Toolpack from 'toolpack-sdk';
import { githubToolsProject } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
    provider: 'openai',
    tools: true,
    toolProjects: [githubToolsProject],
});
```

## Tools

| Tool | Required Parameters | Optional Parameters | Description |
|------|---------------------|---------------------|-------------|
| `github.graphql.execute` | `query` | `variables`, `repo`, `token` | Execute a GitHub GraphQL query or mutation |
| `github.contents.getText` | `repo`, `path` | `ref`, `token`, `maxBytes` | Fetch file content as decoded text |
| `github.pr.reviewThreads.list` | `repo`, `number` | `token`, `unresolvedOnly`, `first`, `after`, `commentsFirst`, `includeMeta` | List PR review threads |
| `github.pr.reviewThreads.resolve` | `threadId` | `repo`, `token` | Resolve a PR review thread (PAT required) |
| `github.pr.reviewComments.reply` | `repo`, `number`, `inReplyTo`, `body` | `token` | Reply within an existing PR review thread |
| `github.pr.diff.get` | `repo`, `number` | `token`, `maxBytes` | Fetch the unified diff for a pull request |
| `github.pr.files.list` | `repo`, `number` | `token`, `perPage`, `page` | List files changed in a PR |
| `github.pr.reviews.submit` | `repo`, `number`, `event` | `body`, `comments`, `token` | Submit a PR review |
| `github.issues.comments.create` | `repo`, `number`, `body` | `token` | Create a comment on an issue or PR |

## Tool Reference

### `github.graphql.execute`

Execute a GitHub GraphQL query or mutation with standard headers. Note: GitHub App installation tokens (`ghs_*`) cannot call certain write mutations. The following mutations require a PAT and will return `FORBIDDEN` with an App token: `resolveReviewThread`, `unresolveReviewThread`.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | Yes | GraphQL query string |
| `variables` | object | No | Optional GraphQL variables |
| `repo` | string | No | `owner/name` — used for token resolution when no explicit token is provided |
| `token` | string | No | GitHub token (App installation or PAT). Omit to auto-resolve from server credentials |

### `github.contents.getText`

Fetch file content (decoded text) via the GitHub Contents API.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | string | Yes | `owner/name` (e.g. `octo/repo`) |
| `path` | string | Yes | File path within the repo |
| `ref` | string | No | Branch, tag, or commit SHA |
| `token` | string | No | GitHub token (App installation or PAT) |
| `maxBytes` | integer | No | Optional max bytes of decoded text to return; if exceeded, result is truncated with a footer |

### `github.pr.reviewThreads.list`

List PR review threads via GraphQL, optionally filtering to unresolved threads only.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | string | Yes | `owner/name` |
| `number` | integer | Yes | PR number |
| `token` | string | No | GitHub token (App installation or PAT) |
| `unresolvedOnly` | boolean | No | If true, filter to unresolved threads only |
| `first` | integer | No | Threads page size (max 100). Default 100 |
| `after` | string | No | Cursor for pagination (GraphQL `pageInfo.endCursor`) |
| `commentsFirst` | integer | No | Comments per thread (max 100). Default 20 |
| `includeMeta` | boolean | No | If true, return `{ headRefOid, threads, pageInfo }` instead of an array |

### `github.pr.reviewThreads.resolve`

Resolve a PR review thread via GraphQL `resolveReviewThread` mutation. **Requires a Personal Access Token (PAT) with `repo` scope.** GitHub App installation tokens receive `FORBIDDEN`. If using an App token, post a reply acknowledging the fix instead.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `threadId` | string | Yes | GraphQL node ID of the review thread |
| `repo` | string | No | `owner/name` — used for token resolution when no explicit token is provided |
| `token` | string | No | GitHub token — must be a PAT with `repo` scope |

### `github.pr.reviewComments.reply`

Reply within an existing PR review thread to maintain continuity.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | string | Yes | `owner/name` |
| `number` | integer | Yes | PR number |
| `inReplyTo` | integer | Yes | `databaseId` of the review comment to reply to |
| `body` | string | Yes | Reply body |
| `token` | string | No | GitHub token (App installation or PAT) |

### `github.pr.diff.get`

Fetch the unified diff for a pull request (text/patch).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | string | Yes | `owner/name` |
| `number` | integer | Yes | PR number |
| `token` | string | No | GitHub token (App installation or PAT) |
| `maxBytes` | integer | No | Optional max bytes of diff to return; if exceeded, result is truncated with a footer |

### `github.pr.files.list`

List files changed in a PR with positions metadata.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | string | Yes | `owner/name` |
| `number` | integer | Yes | PR number |
| `token` | string | No | GitHub token (App installation or PAT) |
| `perPage` | integer | No | Results per page (max 100) |
| `page` | integer | No | Page number |

### `github.pr.reviews.submit`

Submit a PR review (`APPROVE`, `REQUEST_CHANGES`, or `COMMENT`), optionally with inline comments.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | string | Yes | `owner/name` |
| `number` | integer | Yes | PR number |
| `event` | string | Yes | Review event: `APPROVE`, `REQUEST_CHANGES`, or `COMMENT` |
| `body` | string | No | Top-level review body |
| `comments` | array | No | Optional inline comments. Each item requires `path` (string), `position` (integer), and `body` (string) |
| `token` | string | No | GitHub token (App installation or PAT) |

### `github.issues.comments.create`

Create a comment on an issue or pull request (conversation tab).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `repo` | string | Yes | `owner/name` |
| `number` | integer | Yes | Issue or PR number |
| `body` | string | Yes | Comment body |
| `token` | string | No | GitHub token (App installation or PAT) |

## Examples

### Reading a File from a Repo

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Show me the contents of src/index.ts in acme/my-app' }],
    model: 'gpt-4o',
});
// AI uses github.contents.getText
```

### Reviewing a Pull Request

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Review PR #42 in acme/my-app and approve it if the changes look good' }],
    model: 'gpt-4o',
});
// AI uses github.pr.diff.get, github.pr.files.list, then github.pr.reviews.submit
```

### Responding to Review Threads

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'List all unresolved review threads on PR #42 in acme/my-app and reply to each one' }],
    model: 'gpt-4o',
});
// AI uses github.pr.reviewThreads.list then github.pr.reviewComments.reply
```

### Running a Custom GraphQL Query

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Get the title and state of the last 5 PRs in acme/my-app using GraphQL' }],
    model: 'gpt-4o',
});
// AI uses github.graphql.execute
```
