---
sidebar_position: 11
description: "Integrate Model Context Protocol (MCP) servers with Toolpack SDK to extend AI capabilities with external tools and services."
keywords: [MCP server, Model Context Protocol, tool integration, external tools, Toolpack SDK MCP, MCP tools]
---

# MCP Server Integration

Toolpack SDK supports the Model Context Protocol (MCP), allowing you to integrate external tool servers that expose additional capabilities to your AI agents. MCP enables seamless connection to specialized services like databases, APIs, and development tools.

## What is MCP?

The Model Context Protocol is an open standard that defines how AI models can interact with external tools and data sources. MCP servers provide a standardized way to expose tools, resources, and prompts to AI assistants.

Toolpack SDK includes built-in MCP client support, allowing you to connect to any MCP-compatible server and use its tools within your AI workflows.

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

## Next Steps

- Explore the MCP specification for more details
- Check out available MCP servers
- Learn about custom tools to build your own MCP-compatible servers