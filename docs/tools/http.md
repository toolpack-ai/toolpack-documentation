---
sidebar_position: 5
description: "Toolpack SDK HTTP tools for making API requests. Perform GET, POST, PUT, DELETE operations with custom headers and body. Download files from URLs."
keywords: [HTTP tools, API requests, REST API, GET POST PUT DELETE, file download, AI HTTP client, Toolpack SDK HTTP]
---

# HTTP Tools

Category: `network` · 5 tools

Make HTTP requests to APIs and download files.

## Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `http.get` | `url`, `headers?` | HTTP GET request |
| `http.post` | `url`, `body`, `headers?` | HTTP POST request |
| `http.put` | `url`, `body`, `headers?` | HTTP PUT request |
| `http.delete` | `url`, `headers?` | HTTP DELETE request |
| `http.download` | `url`, `path`, `headers?` | Download file to disk |

## Examples

### API Requests

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Get the current weather from api.weather.com' }],
    model: 'gpt-4o',
});
// AI uses http.get
```

### Downloading Files

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Download the logo from example.com/logo.png' }],
    model: 'gpt-4o',
});
// AI uses http.download
```

### POST Requests

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Send a POST request to the webhook with this data' }],
    model: 'gpt-4o',
});
// AI uses http.post
```
