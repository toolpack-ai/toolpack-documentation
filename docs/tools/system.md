---
sidebar_position: 4
description: "Toolpack SDK system tools for querying system information, managing environment variables, checking disk usage, and getting the current working directory."
keywords: [system tools, system info, environment variables, disk usage, AI system tools, Toolpack SDK system]
---

# System Tools

Category: `system` · 5 tools

Query system information, environment variables, and disk usage.

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `system.info` | - | Get OS, CPU, memory, architecture info |
| `system.env` | `key?` | Get environment variable(s) |
| `system.set_env` | `key`, `value` | Set environment variable for session |
| `system.cwd` | - | Get current working directory |
| `system.disk_usage` | `path?` | Get disk usage information |

## Examples

### System Information

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'What operating system am I running?' }],
    model: 'gpt-4o',
});
// AI uses system.info
```

### Environment Variables

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'What is my NODE_ENV set to?' }],
    model: 'gpt-4o',
});
// AI uses system.env
```

### Disk Space

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'How much disk space is available?' }],
    model: 'gpt-4o',
});
// AI uses system.disk_usage
```
