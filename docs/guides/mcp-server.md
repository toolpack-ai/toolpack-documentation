---
sidebar_position: 11
description: "MCP in Toolpack SDK: consume external MCP servers as tools (client), or expose Toolpack's 100+ built-in tools to any MCP client (server) with auth, search mode, and agent exposure."
keywords: [MCP server, MCP client, Model Context Protocol, startMcpServer, McpChannel, tool search, bearer auth, JWT, Toolpack SDK MCP]
---

# MCP — Client & Server

Toolpack SDK supports the Model Context Protocol (MCP) in **both directions**:

- **MCP Client** — bridge any external MCP server into Toolpack as first-class tools
- **MCP Server** — expose Toolpack's 100+ built-in tools (or a filtered subset) to any MCP client: Claude Desktop, Cursor, or your own agents

## What is MCP?

The Model Context Protocol is an open standard that defines how AI models can interact with external tools and data sources. MCP servers provide a standardized way to expose tools, resources, and prompts to AI assistants.

## MCP Client — Consuming External MCP Servers

## Setting Up MCP Servers

To integrate MCP servers with Toolpack, you need to:

1. Configure your MCP server connections
2. Create an MCP tool project
3. Register the tools with your Toolpack instance

### Basic Configuration

```typescript
import { Toolpack, createMcpToolProject } from 'toolpack-sdk';

const mcpConfig = {
  servers: [
    {
      name: 'filesystem',
      displayName: 'File System Tools',
      command: 'npx',
      args: ['-y', '@modelcontextprotocol/server-filesystem', '/path/to/allowed/directory'],
      autoConnect: true,
      toolPrefix: 'mcp.fs.',
    },
    {
      name: 'chrome-devtools',
      displayName: 'Chrome DevTools',
      command: 'npx',
      args: ['-y', 'chrome-devtools-mcp'],
      autoConnect: true,
      toolPrefix: 'mcp.chrome.',
    },
  ],
  defaultTimeoutMs: 30000,
  autoReconnect: true,
};

const mcpTools = await createMcpToolProject(mcpConfig);

const sdk = await Toolpack.init({
  provider: 'openai',
  tools: true,
  customTools: [mcpTools],
});
```

### Configuration Options

| Property | Type | Description |
|----------|------|-------------|
| `servers` | `McpServerConfig[]` | Array of MCP server configurations |
| `defaultTimeoutMs` | `number` | Default timeout for tool calls (30 seconds) |
| `autoReconnect` | `boolean` | Automatically reconnect to servers on failure |

### Server Configuration

Each server in the `servers` array supports:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Unique identifier for the server |
| `displayName` | `string` | No | Human-readable name for the server |
| `command` | `string` | Yes | Command to start the MCP server |
| `args` | `string[]` | No | Arguments to pass to the command |
| `autoConnect` | `boolean` | No | Connect automatically on startup |
| `toolPrefix` | `string` | No | Prefix for tool names from this server |

## Using MCP Tools

Once configured, MCP tools are automatically available to your AI agents:

```typescript
// List all available MCP tools
const allTools = await sdk.listTools();
const mcpTools = allTools.filter(tool => tool.category === 'mcp');
console.log('MCP Tools:', mcpTools.map(t => t.name));

// Use MCP tools in AI queries
const response = await sdk.generate(
  'Use the filesystem tools to list files in the current directory and analyze their contents.',
  'openai'
);
console.log(response.content);
```

## Advanced Usage

### Tool Restrictions and Modes

You can restrict MCP tools to specific modes or workflows:

```typescript
import { createMode } from 'toolpack-sdk';

// Create a mode that only allows filesystem MCP tools
const fileMode = createMode({
  name: 'file-explorer',
  description: 'Mode for file system exploration using MCP tools',
  toolFilter: (tool) => tool.name.startsWith('mcp.fs.'),
});

const sdk = await Toolpack.init({
  provider: 'openai',
  tools: true,
  customTools: [mcpTools],
  modes: [fileMode],
});
```

### Error Handling

MCP tool calls can fail due to network issues or server errors. Toolpack handles these gracefully:

```typescript
try {
  const response = await sdk.generate('Execute an MCP tool operation', 'openai');
  console.log(response.content);
} catch (error) {
  if (error.message.includes('MCP')) {
    console.log('MCP server error:', error.message);
  } else {
    console.log('Other error:', error.message);
  }
}
```

## Cleanup

Always disconnect MCP servers when shutting down:

```typescript
import { disconnectMcpToolProject } from 'toolpack-sdk';

await disconnectMcpToolProject(mcpTools);
await sdk.shutdown?.();
```

## Available MCP Servers

Popular MCP servers you can integrate:

- **File System Server**: Access and manipulate files and directories
- **Chrome DevTools**: Control web browsers and inspect pages
- **Git Server**: Interact with Git repositories
- **SQLite Server**: Query SQLite databases
- **GitHub Server**: Access GitHub APIs and repositories

## Troubleshooting

### Common Issues

1. **Server Connection Failed**: Ensure the MCP server command and arguments are correct
2. **Tool Not Found**: Verify the server is running and exposing the expected tools
3. **Timeout Errors**: Increase `defaultTimeoutMs` for long-running operations
4. **Permission Denied**: Check that the server has appropriate access to required resources

### Debugging

Enable detailed logging to troubleshoot MCP issues:

```typescript
const sdk = await Toolpack.init({
  provider: 'openai',
  tools: true,
  customTools: [mcpTools],
  logLevel: 'debug',
});
```

---

## MCP Server — Exposing Toolpack to MCP Clients

`sdk.startMcpServer()` turns Toolpack into a fully-spec-compliant MCP server. Any MCP client — Claude Desktop, Cursor, or your own code — can connect and call Toolpack's tools.

### Minimal HTTP server

```typescript
const sdk = await Toolpack.init({ provider: 'anthropic', tools: true });

const handle = await sdk.startMcpServer({
  transport: 'http',
  port: 3000,
});

console.log(`MCP server on port ${handle.port}, ${handle.toolCount} tools exposed`);
// handle.stop() to shut down
```

### stdio (Claude Desktop / Cursor)

```typescript
await sdk.startMcpServer({ transport: 'stdio' });
```

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "toolpack": {
      "command": "node",
      "args": ["path/to/your-server.js"]
    }
  }
}
```

### Filtering exposed tools

```typescript
// Expose only filesystem and git tools
await sdk.startMcpServer({
  transport: 'http',
  port: 3000,
  expose: { categories: ['filesystem', 'version-control'] },
});

// Expose specific tools by name
await sdk.startMcpServer({
  transport: 'http',
  port: 3000,
  expose: { tools: ['fs.read_file', 'fs.write_file', 'git.commit'] },
});
```

### Authentication

Three auth modes are supported for HTTP transport. When `auth` is omitted, the server accepts all requests (safe for localhost only).

#### Static tokens (dev / self-hosted)

```typescript
await sdk.startMcpServer({
  transport: 'http',
  port: 3000,
  auth: {
    mode: 'static',
    tokens: [process.env.MCP_TOKEN!],
    // Pass multiple tokens for zero-downtime rotation
  },
});
```

#### JWT (Auth0, Supabase, Clerk)

```typescript
await sdk.startMcpServer({
  transport: 'http',
  port: 3000,
  auth: {
    mode: 'jwt',
    jwksUrl: 'https://your-tenant.auth0.com/.well-known/jwks.json',
    audience: 'https://your-mcp-server.example.com',
    issuer:   'https://your-tenant.auth0.com/',
    requiredScopes: ['tools:read'],
  },
});
```

#### Custom verification

```typescript
await sdk.startMcpServer({
  transport: 'http',
  port: 3000,
  auth: {
    mode: 'custom',
    verifyAccessToken: async (token) => {
      const user = await db.findByToken(token);
      if (!user) throw new Error('invalid token');
      return { token, clientId: user.id, scopes: user.scopes };
    },
  },
});
```

### Search mode

When `searchMode: true`, `tools/list` returns only `tool.search` instead of all 100+ tools. MCP clients call `tool.search` to discover tools on demand — dramatically reducing context token usage for large tool sets.

```typescript
const sdk = await Toolpack.init({
  provider: 'anthropic',
  tools: true,
  modeOverrides: {
    default: { toolSearch: { enabled: true } },
  },
});

await sdk.startMcpServer({
  transport: 'http',
  port: 3000,
  searchMode: true,
});
```

Add the following to your MCP client's system prompt:

```
This server exposes tools via tool.search. Before calling any tool, use tool.search
with a short keyword query to discover available tools. Then call the tool by name.
```

### Exposing agents as MCP tools

Use `McpChannel` from `@toolpack-sdk/agents` to expose a Toolpack agent as an MCP tool. The agent appears in `tools/list` as `agent.<name>`.

```typescript
import { McpChannel } from '@toolpack-sdk/agents';

const ch = new McpChannel();
const agent = new PrReviewerAgent({ channels: [ch] });
await agent.start();

await sdk.startMcpServer({
  transport: 'stdio',
  agents: [ch.asAgentDefinition(agent)],
});
```

Alternatively, use a plain object — no `@toolpack-sdk/agents` dependency required:

```typescript
await sdk.startMcpServer({
  transport: 'stdio',
  agents: [{
    name: 'pr_reviewer',
    description: 'Reviews a pull request end-to-end.',
    inputSchema: {
      type: 'object',
      properties: { pr_url: { type: 'string' } },
      required: ['pr_url'],
    },
    invoke: async (args) => {
      const result = await prReviewer.invokeAgent({ data: args });
      return result.output;
    },
  }],
});
```

### `McpServerHandle`

`startMcpServer()` returns a handle:

| Property / Method | Description |
|---|---|
| `handle.port` | Bound port (HTTP only). Useful with `port: 0` (OS-assigned free port). |
| `handle.toolCount` | Number of tools currently exposed. |
| `handle.stop()` | Gracefully shut down the server. |

### port: 0 — OS-assigned port

Pass `port: 0` to let the OS choose a free port. Read the actual port from `handle.port`:

```typescript
const handle = await sdk.startMcpServer({ transport: 'http', port: 0 });
console.log(`Listening on port ${handle.port}`);
```

## Next Steps

- See `packages/toolpack-sdk/docs/examples/mcp-server-example.ts` for a full working example
- Explore the MCP specification for protocol details
- Learn about [McpChannel](../agents/channels.md) for exposing agents over MCP
- Check out available MCP servers to use as a client