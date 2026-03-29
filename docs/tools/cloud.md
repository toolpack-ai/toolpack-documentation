---
sidebar_position: 11
description: "Toolpack SDK cloud tools for deploying applications to Netlify. Deploy directories, check deployment status, and list recent deployments programmatically."
keywords: [cloud deployment, Netlify deploy, AI deployment, cloud tools, deployment status, Toolpack SDK cloud]
---

# Cloud Tools

Category: `cloud` · 3 tools

Deploy applications to cloud platforms.

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `cloud.deploy` | `siteId`, `dir`, `message?` | Deploy a directory to Netlify |
| `cloud.status` | `siteId`, `deployId` | Check deployment status |
| `cloud.list` | `siteId`, `limit?` | List recent deployments |

## Examples

### Deploying

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Deploy this project to Netlify' }],
    model: 'gpt-4o',
});
// AI uses cloud.deploy
```

### Checking Status

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'What is the status of my last deployment?' }],
    model: 'gpt-4o',
});
// AI uses cloud.status
```

### Listing Deployments

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Show me all my deployments' }],
    model: 'gpt-4o',
});
// AI uses cloud.list
```

## Supported Providers

- **Netlify** - Static sites and serverless functions

## Configuration

Set your Netlify token in environment:

```bash
export NETLIFY_AUTH_TOKEN="your-token"
```
