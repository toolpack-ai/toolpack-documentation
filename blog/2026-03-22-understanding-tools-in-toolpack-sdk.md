---
slug: understanding-tools-in-toolpack-sdk
title: "Understanding Tools in Toolpack SDK: Built-in Catalog and Custom Extensions"
authors: [sajeer-babu]
tags: [tools, development, extensibility]
description: "Deep dive into Toolpack SDK's tool system: how the built-in catalog works, how to create custom tools, and best practices for building production-ready AI agents."
---

Tools are the foundation of what makes AI agents useful. While LLMs are great at reasoning and generating text, they need tools to interact with the real world—reading files, making API calls, querying databases, and executing code.

**Toolpack SDK** ships with a deep catalog of built-in tools (with more landing every release) and makes it trivial to add your own. Let's explore how the tool system works and why it matters.

<!-- truncate -->

<div style={{position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '16px', marginBottom: '24px'}}>
  <iframe
    src="https://www.youtube.com/embed/5xJSkGyaeI8"
    title="Understanding Tools in Toolpack SDK"
    style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%'}}
    frameBorder="0"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
  />
</div>

## What Are Tools in Toolpack SDK?

A tool is a function that an LLM can call during a conversation. Each tool has:

1. **A name and description** that tells the LLM what it does
2. **A JSON schema** that defines its parameters
3. **An execute function** that runs when the LLM calls it

Here's the simplest possible tool:

```typescript
import { ToolDefinition } from 'toolpack-sdk';

const greetTool: ToolDefinition = {
  name: 'greet',
  description: 'Returns a greeting message',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Name to greet' },
    },
    required: ['name'],
  },
  execute: async (args) => {
    return `Hello, ${args.name}!`;
  },
};
```

When you register this tool with Toolpack SDK, the LLM can call it automatically when a user asks for a greeting.

## The Built-in Tool Catalog

Toolpack SDK includes dozens of production-ready tools organized into categories such as:

### File System
- `fs.read`, `fs.write`, `fs.append`, `fs.delete`
- `fs.list`, `fs.search`, `fs.move`, `fs.copy`
- `fs.mkdir`, `fs.exists`, `fs.stat`, `fs.watch`
- `fs.chmod`, `fs.zip`, `fs.unzip`

### Web & HTTP
- `http.get`, `http.post`, `http.put`, `http.delete`
- `web.scrape`, `web.screenshot`, `web.pdf`
- `web.search`, `web.download`, `web.upload`
- `http.webhook`, `http.proxy`

### Command Execution
- `exec.run`, `exec.shell`, `exec.spawn`
- `exec.kill`, `exec.ps`, `exec.env`
- `exec.cron`, `exec.background`

### Database
- `db.query`, `db.insert`, `db.update`, `db.delete`
- `db.transaction`, `db.migrate`, `db.backup`
- `db.sqlite`, `db.postgres`, `db.mysql`

### Data Processing
- `data.parse-json`, `data.parse-csv`, `data.parse-xml`
- `data.transform`, `data.filter`, `data.aggregate`
- `data.validate`, `data.schema`, `data.convert`

### Git & Version Control
- `git.clone`, `git.pull`, `git.push`, `git.commit`
- `git.branch`, `git.diff`, `git.log`

### Cloud & APIs
- `cloud.s3-upload`, `cloud.s3-download`, `cloud.s3-list`
- `api.rest`, `api.graphql`, `api.webhook`

### System & Monitoring
- `sys.info`, `sys.metrics`, `sys.logs`
- `sys.notify`, `sys.alert`

### Security & Auth
- `auth.token`, `auth.encrypt`, `auth.decrypt`

### Utilities
- `util.sleep`, `util.random`

Each tool is:
- **Provider-agnostic**: Works with OpenAI, Anthropic, Gemini, and Ollama
- **Type-safe**: Full TypeScript support with parameter validation
- **Production-ready**: Error handling, retries, and logging built-in

## How Tools Work Under the Hood

When you initialize Toolpack SDK with tools enabled:

```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true, // Loads the built-in catalog
});
```

Here's what happens:

1. **Registration**: All tools are registered in the internal tool registry
2. **Schema conversion**: Tool schemas are converted to the provider's function-calling format (OpenAI, Anthropic, etc.)
3. **LLM awareness**: The LLM receives the tool definitions and can call them during generation
4. **Execution**: When the LLM calls a tool, Toolpack SDK validates parameters, executes the function, and returns the result
5. **Continuation**: The result is sent back to the LLM, which continues the conversation

This loop continues until the LLM decides it has enough information to respond to the user.

## Modes: Controlling Tool Access

Not every conversation needs access to all 77 tools. Toolpack SDK uses **modes** to control which tools are available:

### Agent Mode (Full Access)
```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  mode: 'agent', // All 77 tools available
});
```

Use this for autonomous agents that need full system access.

### Chat Mode (Web-Only)
```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  mode: 'chat', // Only web/HTTP tools
});
```

Use this for chatbots that should only access web resources, not local files or commands.

### Custom Modes
```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  mode: {
    name: 'data-analyst',
    tools: ['db.*', 'data.*', 'fs.read', 'fs.write'],
  },
});
```

Create specialized modes for specific use cases.

## Building Custom Tools

Here's a real-world example: a tool that fetches cryptocurrency prices:

```typescript
import { ToolDefinition } from 'toolpack-sdk';

const cryptoPriceTool: ToolDefinition = {
  name: 'crypto.get-price',
  displayName: 'Get Crypto Price',
  description: 'Fetches current price for a cryptocurrency',
  category: 'finance',
  parameters: {
    type: 'object',
    properties: {
      symbol: {
        type: 'string',
        description: 'Crypto symbol (e.g., BTC, ETH)',
        enum: ['BTC', 'ETH', 'SOL', 'AVAX'],
      },
      currency: {
        type: 'string',
        description: 'Target currency',
        default: 'USD',
      },
    },
    required: ['symbol'],
  },
  execute: async (args, context) => {
    const { symbol, currency = 'USD' } = args;
    
    // Log execution (appears in toolpack-sdk.log)
    context?.log(`Fetching ${symbol} price in ${currency}`);
    
    try {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=${currency}`
      );
      const data = await response.json();
      
      return {
        symbol,
        price: data[symbol.toLowerCase()][currency.toLowerCase()],
        currency,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch price: ${error.message}`);
    }
  },
};
```

Register it with Toolpack SDK:

```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  customTools: [{
    key: 'crypto-tools',
    name: 'Cryptocurrency Tools',
    tools: [cryptoPriceTool],
  }],
});
```

Now the LLM can call it:

```typescript
const response = await toolpack.generate({
  messages: [{ 
    role: 'user', 
    content: 'What is the current price of Bitcoin?' 
  }],
});
```

## Best Practices for Custom Tools

### 1. Clear Descriptions
The LLM relies on your description to know when to call the tool. Be specific:

```typescript
// ❌ Vague
description: 'Gets data'

// ✅ Clear
description: 'Fetches current weather data for a given city using OpenWeatherMap API'
```

### 2. Validate Parameters
Use JSON schema constraints to prevent invalid calls:

```typescript
parameters: {
  type: 'object',
  properties: {
    temperature: {
      type: 'number',
      minimum: -273.15, // Absolute zero
      maximum: 1000,
    },
    unit: {
      type: 'string',
      enum: ['celsius', 'fahrenheit', 'kelvin'],
    },
  },
}
```

### 3. Handle Errors Gracefully
Return useful error messages that help the LLM recover:

```typescript
execute: async (args) => {
  try {
    return await fetchData(args.id);
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return { error: 'Resource not found. Try a different ID.' };
    }
    throw error; // Re-throw unexpected errors
  }
}
```

### 4. Use Context for Logging
The `context` parameter gives you access to logging and workspace info:

```typescript
execute: async (args, context) => {
  context?.log(`Processing request for user ${args.userId}`);
  const workspaceRoot = context?.workspaceRoot;
  // Use workspaceRoot for file operations
}
```

### 5. Keep Tools Focused
One tool should do one thing well. Instead of a giant `database` tool, create:
- `db.query` for SELECT queries
- `db.insert` for INSERT operations
- `db.update` for UPDATE operations

This makes it easier for the LLM to choose the right tool.

## Tool Projects: Packaging Multiple Tools

For larger tool collections, use **Tool Projects**:

```typescript
import { createToolProject } from 'toolpack-sdk';

export const weatherTools = createToolProject({
  key: 'weather-tools',
  name: 'Weather Tools',
  displayName: 'Weather & Climate Tools',
  version: '1.0.0',
  description: 'Tools for weather data and forecasts',
  category: 'weather',
  tools: [
    currentWeatherTool,
    forecastTool,
    historicalWeatherTool,
    airQualityTool,
  ],
});
```

Load it like any other tool project:

```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  customTools: [weatherTools],
});
```

## Real-World Use Cases

Here are some custom tools teams have built with Toolpack SDK:

- **E-commerce**: Product search, inventory check, order placement
- **DevOps**: Deploy to Kubernetes, check service health, roll back releases
- **Data Science**: Run SQL queries, generate visualizations, train models
- **Customer Support**: Fetch user data, create tickets, search knowledge base
- **Content**: Generate images, translate text, summarize documents

The built-in catalog handles the common cases. Custom tools handle your domain-specific logic.

## What's Next?

We're working on (alongside more built-in tools):

- **Tool Marketplace**: Share and discover community-built tools
- **Tool Composition**: Chain tools together declaratively
- **Tool Analytics**: Track which tools are called most often
- **Tool Versioning**: Manage breaking changes in tool schemas

---

**Want to explore the built-in tools?** Check out the [Tools Reference](/tools/overview).

**Ready to build custom tools?** See the [Custom Tools Guide](/guides/custom-tools) for more examples.

Have questions or want to share your custom tools? Open an issue on [GitHub](https://github.com/toolpack-ai/toolpack-sdk) or join the discussion.
