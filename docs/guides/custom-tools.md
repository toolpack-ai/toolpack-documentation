---
sidebar_position: 4
---

# Custom Tools

Toolpack SDK comes with a comprehensive set of built-in tools (like file system, HTTP, code execution, web scraping). However, to fully leverage AI agents tailored to your domain, you can build and load **Custom Tool Projects**.

Building custom tools in Toolpack uses the `createToolProject` definition which integrates perfectly with our context-aware tools engine. This allows your tools to log directly to the SDK’s logfiles and read configs seamlessly.

---

## 1. Defining a Tool

Each tool you create must conform to the `ToolDefinition` interface:

```typescript
import { ToolDefinition } from 'toolpack-sdk';

const searchDatabaseTool: ToolDefinition = {
    name: 'acme.searchDatabase', // Use a namespace (e.g. acme)
    displayName: 'Search Acme Database',
    description: 'Searches the user database by email Address.',
    category: 'custom',
    
    // Define the arguments the AI will pass
    parameters: {
        type: 'object',
        properties: {
            email: { type: 'string', description: 'The exact email address to lookup.' }
        },
        required: ['email']
    },
    
    // Define what the tool actually does
    execute: async (args, ctx) => {
        // You have access to ctx for advanced operations
        ctx?.log(`Executing Search on DB with email ${args.email}`);
        
        // Return string answers
        return `Found user Profile: ${args.email}. Name is John Doe.`;
    }
};
```

### The `ToolContext` Object

When your `execute` function runs, Toolpack passes a `ToolContext` object (`ctx`) as the second argument. This gives you contextual power:

| Property | Type | Description |
|-----------|------|-------------|
| `workspaceRoot` | `string` | Absolute path to the current process working directory (where the agent is running). |
| `config` | `Record<string, any>` | Variables dynamically loaded from your `toolpack.config.json` under `tools.additionalConfigurations`. |
| `log` | `(msg: string) => void` | Writes directly to `toolpack-sdk.log` with a specific `[Tool]` prefix format for tracing |

---

## 2. Bundling into a Tool Project

A Tool Project bundles multiple definitions together with manifest metadata.

Use our `createToolProject` factory to safely generate a fully valid package:

```typescript
import { createToolProject } from 'toolpack-sdk';

export const acmeToolsProject = createToolProject({
    key: 'acme-tools',
    name: 'Acme Core Services',
    displayName: 'Acme Corporate DB Tools',
    version: '1.0.0',
    description: 'Tooling to let the AI interact with Acme APIs',
    category: 'custom',
    tools: [searchDatabaseTool, /* other tools */],
});
```

The factory guarantees your tools are correctly namespaced, descriptions are provided, and properties conform to schema validations.

---

## 3. Registering the Custom Tools

### A. Initialization Time

You can pass tools directly at initialization via the `customTools` array:

```typescript
import { Toolpack } from 'toolpack-sdk';
import { acmeToolsProject } from './my-tools';

const sdk = await Toolpack.init({
    provider: 'openai',
    tools: true, // Loads builtins
    customTools: [acmeToolsProject], // Injects your tools!
});
```

### B. Runtime Injection

If you discover plugins or dynamically fetch scripts during runtime, you can load them on the fly:

```typescript
// Assuming `sdk` is an initialized Toolpack instance
await sdk.loadToolProject(dynamicToolProject);

console.log("Dynamically loaded tools into registry.");
```

---

## 4. Configuring Custom Tools

A huge advantage of `ToolContext` is passing configuration API Keys (like a Datadog key, Acme API key) dynamically into tools.

Inside your `toolpack.config.json`:

```json
{
  "tools": {
    "enabled": true,
    "additionalConfigurations": {
      "ACME_API_TOKEN": "super-secret-token"
    }
  }
}
```

In your tool execution:

```typescript
execute: async (args, ctx) => {
    // It's perfectly loaded from the JSON
    const token = ctx?.config?.ACME_API_TOKEN;
    
    const res = await fetch('https://api.acme.com/search', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    return await res.text();
}
```

This prevents hardcoding configuration secrets in your executable tool source files.
