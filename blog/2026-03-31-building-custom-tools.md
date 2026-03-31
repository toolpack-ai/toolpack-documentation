---
slug: building-custom-tools
title: "Building Custom Tools for Toolpack SDK"
authors: [sajeer-babu]
tags: [tools, customization, development]
description: "A practical guide to creating custom tools for Toolpack SDK. Learn how to build tool projects that extend your AI agent's capabilities with working code examples."
---

Toolpack SDK ships with a lot of built-in tools across categories like file system, web, databases, Git, and code analysis. But every project has unique needs - internal APIs, proprietary systems, domain-specific operations. Custom tools let you extend your AI agent's capabilities without limits.

This guide shows you exactly how to build custom tools, based on real production implementations from the Toolpack CLI project.

<!-- truncate -->

## What is a Custom Tool?

A tool is a function that an AI can call during a conversation. Each tool has:

1. **Name and description** - Tells the AI what it does
2. **JSON schema** - Defines the parameters it accepts
3. **Execute function** - Runs when the AI calls it

Here's the simplest possible tool:

```typescript
import { ToolDefinition } from 'toolpack-sdk';

const greetTool: ToolDefinition = {
  name: 'greet',
  displayName: 'Greet User',
  description: 'Returns a personalized greeting message',
  category: 'custom',
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

When the AI decides it needs to greet someone, it calls this tool with `{ name: "Alice" }`, and the tool returns `"Hello, Alice!"`.

## Tool Projects: Organizing Multiple Tools

For production use, bundle related tools into a **Tool Project**. This gives you:

- **Versioning** - Track changes to your tools
- **Dependencies** - Declare npm packages your tools need
- **Metadata** - Author, repository, description
- **Namespacing** - Group tools by category (e.g., `weather.current`, `weather.forecast`)

Use the `createToolProject` helper:

```typescript
import { createToolProject, ToolDefinition } from 'toolpack-sdk';

const getCurrentWeather: ToolDefinition = {
  name: 'weather.current',
  displayName: 'Get Current Weather',
  description: 'Get current weather for a city',
  category: 'weather',
  parameters: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'City name' },
    },
    required: ['city'],
  },
  execute: async (args) => {
    // Call weather API
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${process.env.WEATHER_API_KEY}&q=${args.city}`
    );
    const data = await response.json();
    return JSON.stringify({
      city: args.city,
      temp: data.current.temp_c,
      condition: data.current.condition.text,
    });
  },
};

const getForecast: ToolDefinition = {
  name: 'weather.forecast',
  displayName: 'Get Weather Forecast',
  description: 'Get 3-day weather forecast for a city',
  category: 'weather',
  parameters: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'City name' },
      days: { type: 'integer', description: 'Number of days (1-3)', default: 3 },
    },
    required: ['city'],
  },
  execute: async (args) => {
    const days = args.days || 3;
    const response = await fetch(
      `https://api.weatherapi.com/v1/forecast.json?key=${process.env.WEATHER_API_KEY}&q=${args.city}&days=${days}`
    );
    const data = await response.json();
    return JSON.stringify(data.forecast.forecastday);
  },
};

export const weatherTools = createToolProject({
  key: 'weather-tools',
  name: 'weather-tools',
  displayName: 'Weather Tools',
  version: '1.0.0',
  description: 'Tools for weather information',
  category: 'weather',
  author: 'Your Name',
  tools: [getCurrentWeather, getForecast],
});
```

Key points:
- **`key`** - Unique identifier (kebab-case, no spaces)
- **`name`** - Package name (used internally)
- **`category`** - Groups tools for filtering
- **`tools`** - Array of `ToolDefinition` objects

## Using the ToolContext

The `execute` function receives a second parameter: `ToolContext`. This gives you:

```typescript
interface ToolContext {
  workspaceRoot: string;              // Absolute path to project root
  config: Record<string, any>;        // Tool-specific config
  log: (message: string) => void;     // Logger (writes to toolpack-sdk.log)
}
```

Example using context:

```typescript
const readProjectFile: ToolDefinition = {
  name: 'project.read-file',
  displayName: 'Read Project File',
  description: 'Read a file from the project directory',
  category: 'project',
  parameters: {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Relative path from project root' },
    },
    required: ['path'],
  },
  execute: async (args, ctx) => {
    if (!ctx) {
      return JSON.stringify({ error: 'No context provided' });
    }

    ctx.log(`Reading file: ${args.path}`);

    const fullPath = path.join(ctx.workspaceRoot, args.path);
    
    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      ctx.log(`Successfully read ${content.length} bytes`);
      return content;
    } catch (error) {
      ctx.log(`Error reading file: ${error.message}`);
      return JSON.stringify({ 
        error: 'file_not_found',
        message: `Could not read ${args.path}` 
      });
    }
  },
};
```

The `log()` function is especially useful for debugging - all logs go to `toolpack-sdk.log` in your project root.

## Registering Custom Tools

### Method 1: At Initialization

Load custom tools when you initialize Toolpack:

```typescript
import { Toolpack } from 'toolpack-sdk';
import { weatherTools } from './custom-tools/weather';

const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,              // Load built-in tools
  customTools: [weatherTools],  // Add custom tools
});
```

### Method 2: Runtime Loading

Add tools dynamically after initialization:

```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
});

// Later, load custom tools
await toolpack.loadToolProject(weatherTools);
```

This is useful for:
- Lazy loading tools based on user actions
- Hot-reloading tools during development
- Conditional tool loading based on environment

## Real-World Example: Skill Management Tools

The Toolpack CLI includes a production-grade custom tool project for managing "skills" - structured markdown files that document AI agent capabilities. Here's how it's built:

### Project Structure

```
skill-tools/
├── index.ts              # Main export
└── tools/
    ├── create/
    │   ├── index.ts      # Tool implementation
    │   └── schema.ts     # Parameter schema
    ├── read/
    ├── update/
    ├── list/
    └── search/           # BM25-powered search
```

### Main Project File

```typescript
import { ToolProject } from 'toolpack-sdk';
import { skillCreateTool } from './tools/create/index.js';
import { skillReadTool } from './tools/read/index.js';
import { skillUpdateTool } from './tools/update/index.js';
import { skillListTool } from './tools/list/index.js';
import { skillSearchTool } from './tools/search/index.js';

export const skillToolsProject: ToolProject = {
  manifest: {
    key: 'skill',
    name: 'skill-tools',
    displayName: 'Skill Tools',
    version: '1.0.0',
    description: 'Tools for managing SKILL.md files - structured documentation for AI agent skills',
    author: 'Toolpack Team',
    tools: [
      'skill.create',
      'skill.read',
      'skill.update',
      'skill.list',
      'skill.search',
    ],
    category: 'productivity',
  },
  tools: [
    skillCreateTool,
    skillReadTool,
    skillUpdateTool,
    skillListTool,
    skillSearchTool,
  ],
};
```

### Individual Tool Implementation

Here's the `skill.create` tool (simplified):

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import { ToolDefinition } from 'toolpack-sdk';

export const skillCreateTool: ToolDefinition = {
  name: 'skill.create',
  displayName: 'Create Skill',
  description: 'Create a new SKILL.md file with structured documentation',
  category: 'productivity',
  parameters: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Skill name (kebab-case)',
      },
      title: {
        type: 'string',
        description: 'Human-readable title',
      },
      description: {
        type: 'string',
        description: 'What the skill does',
      },
      triggers: {
        type: 'array',
        items: { type: 'string' },
        description: 'Phrases that activate this skill',
      },
      instructions: {
        type: 'string',
        description: 'How the AI should behave when using this skill',
      },
      examples: {
        type: 'array',
        items: { type: 'string' },
        description: 'Example interactions',
      },
      tags: {
        type: 'array',
        items: { type: 'string' },
        description: 'Tags for categorization',
      },
    },
    required: ['name', 'title', 'description', 'instructions'],
  },
  execute: async (args) => {
    const skillName = args.name as string;
    const title = args.title as string;
    const desc = args.description as string;
    const triggers = (args.triggers as string[]) || [];
    const instructions = args.instructions as string;
    const examples = (args.examples as string[]) || [];
    const tags = (args.tags as string[]) || [];

    // Validate skill name
    if (!/^[a-z][a-z0-9-]*$/.test(skillName)) {
      return JSON.stringify({
        error: 'invalid_name',
        message: 'Skill name must be kebab-case',
      });
    }

    // Ensure .skills directory exists
    const skillsDir = path.join(process.cwd(), '.skills');
    await fs.mkdir(skillsDir, { recursive: true });

    // Check if skill already exists
    const skillPath = path.join(skillsDir, `${skillName}.skill.md`);
    try {
      await fs.access(skillPath);
      return JSON.stringify({
        error: 'skill_exists',
        message: `Skill "${skillName}" already exists`,
      });
    } catch {
      // File doesn't exist, we can create it
    }

    // Generate SKILL.md content
    const now = new Date().toISOString();
    const content = `---
name: ${skillName}
title: ${title}
version: 1.0.0
created: ${now}
updated: ${now}
tags: [${tags.map(t => `"${t}"`).join(', ')}]
---

# ${title}

## Description

${desc}

## Triggers

${triggers.length > 0 ? triggers.map(t => `- "${t}"`).join('\n') : '(No triggers defined)'}

## Instructions

${instructions}

## Examples

${examples.length > 0 ? examples.map((ex, i) => `### Example ${i + 1}\n\n${ex}`).join('\n\n') : '(No examples provided)'}
`;

    // Write the file
    await fs.writeFile(skillPath, content, 'utf-8');

    return JSON.stringify({
      success: true,
      path: skillPath,
      message: `Skill "${skillName}" created successfully`,
    });
  },
};
```

Key patterns:
- **Validation** - Check inputs before processing
- **Error handling** - Return structured JSON errors
- **File operations** - Use `fs/promises` for async I/O
- **Structured output** - Return JSON for complex results

## Using Custom Tools

Once registered, the AI can use your custom tools automatically:

```typescript
const response = await toolpack.generate({
  model: 'gpt-4o',
  messages: [
    { role: 'user', content: 'What is the weather in San Francisco?' }
  ],
});

console.log(response.content);
// "The current weather in San Francisco is 18°C and Foggy."
```

The AI will:
1. Recognize it needs weather information
2. Call `weather.current` with `{ city: "San Francisco" }`
3. Receive the result
4. Formulate a natural language response

You can also check which tools were called:

```typescript
if (response.tool_calls) {
  console.log('Tools called:', response.tool_calls.map(tc => tc.name));
  // ["weather.current"]
}
```

## Best Practices

### 1. Return Structured Data

Return JSON for complex results so the AI can parse them reliably:

```typescript
execute: async (args) => {
  const result = await fetchData(args.query);
  return JSON.stringify({
    success: true,
    data: result,
    timestamp: new Date().toISOString(),
  });
}
```

### 2. Handle Errors Gracefully

Never throw errors - return structured error messages:

```typescript
execute: async (args) => {
  try {
    const result = await riskyOperation(args);
    return JSON.stringify({ success: true, data: result });
  } catch (error) {
    return JSON.stringify({
      error: 'operation_failed',
      message: error.message,
    });
  }
}
```

### 3. Use Descriptive Names and Descriptions

The AI relies on these to decide when to use your tool:

```typescript
// Bad
name: 'tool1',
description: 'Does stuff',

// Good
name: 'database.query-users',
description: 'Query the users table with filters for email, role, or creation date. Returns user records matching the criteria.',
```

### 4. Validate Inputs

Always validate parameters before processing:

```typescript
execute: async (args) => {
  if (!args.email || !args.email.includes('@')) {
    return JSON.stringify({
      error: 'invalid_email',
      message: 'Email must be a valid email address',
    });
  }
  
  // Process valid input
  const user = await findUserByEmail(args.email);
  return JSON.stringify(user);
}
```

### 5. Use the Logger

Log important operations for debugging:

```typescript
execute: async (args, ctx) => {
  ctx?.log(`Querying database for user: ${args.email}`);
  
  const user = await db.findUser(args.email);
  
  ctx?.log(`Found user: ${user ? user.id : 'not found'}`);
  
  return JSON.stringify(user);
}
```

### 6. Keep Tools Focused

Each tool should do one thing well. Instead of:

```typescript
// Bad - too many responsibilities
name: 'user.manage',
description: 'Create, update, delete, or query users',
```

Create separate tools:

```typescript
// Good - focused responsibilities
name: 'user.create',
name: 'user.update',
name: 'user.delete',
name: 'user.query',
```

## Advanced: Tool Dependencies

If your tools need external packages, declare them in the project:

```typescript
import { createToolProject } from 'toolpack-sdk';

export const databaseTools = createToolProject({
  key: 'database-tools',
  name: 'database-tools',
  displayName: 'Database Tools',
  version: '1.0.0',
  description: 'Tools for database operations',
  category: 'database',
  tools: [queryTool, insertTool],
  dependencies: {
    'pg': '^8.11.0',           // PostgreSQL client
    'mysql2': '^3.6.0',        // MySQL client
  },
});
```

The SDK will validate that these packages are installed when loading the project.

## Tool Categories

Organize tools by category for better discoverability:

- **`custom`** - General custom tools
- **`productivity`** - Workflow and automation
- **`database`** - Database operations
- **`api`** - External API integrations
- **`file`** - File operations
- **`web`** - Web scraping, HTTP requests
- **`code`** - Code analysis, generation
- **`git`** - Version control operations

You can filter tools by category in your config:

```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: {
    enabled: true,
    enabledToolCategories: ['custom', 'productivity', 'file'],
  },
  customTools: [weatherTools, skillTools],
});
```

## Listing Available Tools

Inspect all registered tools:

```typescript
const registry = toolpack.getClient().getToolRegistry();

// Get all tool names
const toolNames = registry.getNames();
console.log('Available tools:', toolNames);

// Get tools by category
const customTools = registry.getByCategory('custom');
console.log('Custom tools:', customTools.map(t => t.name));

// Check if a specific tool exists
if (registry.has('weather.current')) {
  console.log('Weather tool is available');
}
```

## Key Takeaways

- **Tools extend AI capabilities** - Let your agent interact with any system
- **Use `createToolProject`** - Bundle related tools with metadata and versioning
- **Return structured JSON** - Makes results parsable and reliable
- **Handle errors gracefully** - Never throw, always return error objects
- **Validate inputs** - Check parameters before processing
- **Keep tools focused** - One tool, one responsibility
- **Use the logger** - Debug with `ctx.log()` for visibility
- **Declare dependencies** - List npm packages your tools need

Custom tools turn your AI agent from a chatbot into a production-ready automation system. Build tools for your internal APIs, databases, file systems, or any domain-specific operations your project needs.
