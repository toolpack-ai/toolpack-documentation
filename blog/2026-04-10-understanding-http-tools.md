---
slug: http-tools
title: "HTTP Tools in Toolpack SDK: Making API Requests and Downloading Files"
authors: [sajeer-babu]
tags: [tools, http, api, network, requests]
description: "Learn how Toolpack SDK's 5 HTTP tools enable AI agents to make REST API requests (GET, POST, PUT, DELETE) and download files with custom headers and body payloads."
---

AI agents that can interact with APIs and download files become truly powerful integration tools. Whether it's fetching data from REST endpoints, sending webhooks, or downloading resources, **Toolpack SDK's HTTP tools** give your agents the ability to communicate with external services seamlessly.

In this post, we'll explore all 5 tools in the `network` category — from simple GET requests to file downloads with custom headers.

<!-- truncate -->

## Why HTTP Tools Matter

Most real-world AI workflows need to interact with external APIs. A coding assistant might need to fetch documentation from an API. A data processing agent might need to POST results to a webhook. A file management agent might need to download resources from URLs. Without HTTP capabilities, your AI agent is isolated from the broader web ecosystem.

Toolpack SDK bridges that gap:

- **REST API Support**: Full support for GET, POST, PUT, DELETE operations
- **Custom Headers**: Send authentication tokens, content-type headers, and more
- **Request Bodies**: POST and PUT with JSON, form data, or raw payloads
- **File Downloads**: Save remote files directly to disk
- **No Configuration**: Works immediately with `tools: true`

All 5 HTTP tools are available as soon as you initialize Toolpack SDK with `tools: true`.

## The Five HTTP Tools

| Tool | Parameters | Description |
|------|------------|-------------|
| `http.get` | `url`, `headers?` | HTTP GET request |
| `http.post` | `url`, `body`, `headers?` | HTTP POST request |
| `http.put` | `url`, `body`, `headers?` | HTTP PUT request |
| `http.delete` | `url`, `headers?` | HTTP DELETE request |
| `http.download` | `url`, `path`, `headers?` | Download file to disk |

### HTTP Methods at a Glance

The distinction between the HTTP methods follows standard REST conventions:

- **`http.get`**: Retrieve data from a server — safe and idempotent
- **`http.post`**: Submit data to create resources — sends a body payload
- **`http.put`**: Update existing resources — replaces the target resource
- **`http.delete`**: Remove resources from the server
- **`http.download`**: Save remote files locally with streaming support

Choose the appropriate method based on the API's REST conventions.

## Setting Up

HTTP tools require no API keys and no external services. They work with any publicly accessible URL the moment you enable tools:

```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
});
```

That's it. All 5 `network` tools are available to the LLM automatically.

## Usage Examples

### GET Requests

Use `http.get` to fetch data from APIs:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Get the current weather from api.weather.com/v1/current' }],
  model: 'gpt-4o',
});
// AI uses http.get with: { url: 'https://api.weather.com/v1/current' }
```

Returns a string with status and body:
```
HTTP 200 OK
{"temperature": 72, "conditions": "sunny"}
```

### GET with Custom Headers

Send authentication tokens or custom headers:

```typescript
const stream = toolpack.stream({
  messages: [{ 
    role: 'user', 
    content: 'Fetch my profile from the API with the bearer token' 
  }],
  model: 'gpt-4o',
});
// AI uses http.get with:
// {
//   url: 'https://api.example.com/profile',
//   headers: { 'Authorization': 'Bearer token123' }
// }
```

### POST Requests

Send data to create resources:

```typescript
const stream = toolpack.stream({
  messages: [{ 
    role: 'user', 
    content: 'Create a new user with name "John" and email "john@example.com"' 
  }],
  model: 'gpt-4o',
});
// AI uses http.post with:
// {
//   url: 'https://api.example.com/users',
//   body: '{"name": "John", "email": "john@example.com"}',
//   headers: { 'Content-Type': 'application/json' }
// }
```

### PUT Requests

Update existing resources:

```typescript
const stream = toolpack.stream({
  messages: [{ 
    role: 'user', 
    content: 'Update user 123 with the new phone number' 
  }],
  model: 'gpt-4o',
});
// AI uses http.put with:
// {
//   url: 'https://api.example.com/users/123',
//   body: '{"phone": "+1-555-0123"}',
//   headers: { 'Content-Type': 'application/json' }
// }
```

### DELETE Requests

Remove resources:

```typescript
const stream = toolpack.stream({
  messages: [{ 
    role: 'user', 
    content: 'Delete the old webhook at /webhooks/old-hook-123' 
  }],
  model: 'gpt-4o',
});
// AI uses http.delete with:
// { url: 'https://api.example.com/webhooks/old-hook-123' }
```

### Downloading Files

Save remote files to disk:

```typescript
const stream = toolpack.stream({
  messages: [{ 
    role: 'user', 
    content: 'Download the logo from https://example.com/logo.png to ./assets/' 
  }],
  model: 'gpt-4o',
});
// AI uses http.download with:
// {
//   url: 'https://example.com/logo.png',
//   path: './assets/logo.png'
// }
```

Returns a confirmation string:
```
Downloaded https://example.com/logo.png → ./assets/logo.png (15432 bytes)
```

### Download with Authentication

Download protected files with headers:

```typescript
const stream = toolpack.stream({
  messages: [{ 
    role: 'user', 
    content: 'Download the report using my API token' 
  }],
  model: 'gpt-4o',
});
// AI uses http.download with:
// {
//   url: 'https://api.example.com/reports/annual.pdf',
//   path: './reports/annual.pdf',
//   headers: { 'Authorization': 'Bearer token123' }
// }
```

## Real-World Use Cases

### API Integration

```typescript
const toolpack = await Toolpack.init({
  provider: 'anthropic',
  tools: true,
});

const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Fetch the latest 10 posts from the JSONPlaceholder API
    and summarize the titles.`
  }],
  model: 'claude-sonnet-4',
});
```

The agent will:
1. Use `http.get` to fetch posts from `https://jsonplaceholder.typicode.com/posts`
2. Parse the JSON response
3. Extract and summarize the titles

### Webhook Notifications

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Send a webhook notification to https://hooks.slack.com/services/xxx
    with the message "Build completed successfully" and a green color.`
  }],
});
```

The agent will:
1. Use `http.post` with the Slack webhook URL
2. Format the payload with the message and color
3. Send the notification

### File Synchronization

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Download the latest dataset from https://data.example.com/dataset.csv
    to ./data/latest.csv, then read it and tell me how many rows it has.`
  }],
});
```

The agent will:
1. Use `http.download` to save the file
2. Use `fs.read_file` to read the downloaded CSV
3. Count the rows and report back

### REST API CRUD Operations

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Manage the todo items:
    1. Get all todos from https://api.example.com/todos
    2. Delete completed ones
    3. Create a new todo "Review PRs"`
  }],
});
```

The agent will:
1. Use `http.get` to fetch all todos
2. Use `http.delete` for each completed todo
3. Use `http.post` to create the new todo

### Image Processing Pipeline

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Download the product images from the API,
    save them to ./images/products/, and list what was downloaded.`
  }],
});
```

The agent will:
1. Use `http.get` to fetch the product list with image URLs
2. Use `http.download` for each image
3. Return a summary of downloaded files

## Best Practices

### 1. Handle API Errors Gracefully

Instruct the agent to check response status:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Fetch the user profile from the API.
    If it returns 404, report "User not found".
    If it returns 5xx, report "Server error, try again later".`
  }],
});
```

### 2. Use Appropriate Content-Type Headers

When sending JSON data:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `POST to the API with this JSON data: {"name": "Test"}.
    Make sure to set the Content-Type header to application/json.`
  }],
});
```

### 3. Validate Download Paths

Ensure download directories exist:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Download the file to ./downloads/report.pdf.
    First check if the downloads directory exists, create it if needed.`
  }],
});
```

### 4. Secure Sensitive Headers

Don't expose API keys in prompts. Use environment variables:

```typescript
// Set API_KEY in environment, not in the prompt
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Fetch data from the protected API endpoint.
    Use the API key from the environment.`
  }],
});
```

### 5. Confirm Destructive Operations

`http.post`, `http.put`, and `http.delete` require **high confirmation** by default. The user will be prompted to approve these actions before execution, showing the URL and body (for POST/PUT). This protects against unintended modifications.

### 6. Combine with File System Tools

Chain HTTP downloads with file operations:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Download https://example.com/data.json,
    then read it and extract the "users" array.`
  }],
});
```

## Security Considerations

HTTP tools can access any URL. Use modes to restrict access to specific domains:

```typescript
const safeMode = {
  name: 'http-restricted',
  displayName: 'HTTP Restricted',
  description: 'Limited HTTP access',
  systemPrompt: 'Only access internal APIs at api.internal.com domain.',
  allowedToolCategories: ['network'],
  blockedToolCategories: [],
  allowedTools: [],
  blockedTools: [],
  blockAllTools: false,
};

const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
  customModes: [safeMode],
  defaultMode: 'http-restricted',
});
```

## Tool Summary

| Tool | Use Case |
|------|----------|
| `http.get` | Fetch data from APIs and web pages |
| `http.post` | Create resources, send webhooks, submit forms |
| `http.put` | Update existing resources |
| `http.delete` | Remove resources |
| `http.download` | Save remote files to local disk |

## What's Next?

The HTTP tools are one of 10+ tool categories in Toolpack SDK. Coming up in this series:

- **Web Tools**: Search the web and scrape content with Tavily, Brave, and DuckDuckGo
- **Database Tools**: Query and manage databases with natural language
- **Git Tools**: Stage, commit, diff, and manage branches with AI
- **Execution Tools**: Run shell commands and manage processes

---

**Want to try HTTP tools?** Initialize Toolpack SDK with `tools: true` and start making API requests.

**Exploring other tool categories?** Check out the [Tools Overview](/tools/overview) for the full list.

Have questions or a use case you'd like to share? Open an issue on [GitHub](https://github.com/toolpack-ai/toolpack-sdk) or join the discussion.
