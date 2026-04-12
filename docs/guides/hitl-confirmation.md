---
sidebar_position: 7
description: "Configure Human-in-the-Loop (HITL) confirmations for high-risk tool operations. Control which tools require user approval before execution."
keywords: [HITL, human-in-the-loop, tool confirmation, security, approval flow, bypass rules, risk levels]
---

# Human-in-the-Loop (HITL) Confirmation

The **HITL (Human-in-the-Loop)** system provides user confirmation for high-risk tool operations before they execute. This adds a safety layer to prevent unintended destructive actions like deleting files, running shell commands, or modifying databases.

## Overview

HITL confirmation allows you to:

- **Require approval** before executing high-risk tools
- **Configure bypass rules** to skip confirmation for trusted operations
- **Filter by risk level** (high-only, all, or off)
- **Dynamically reload** configuration without restarting

## Configuration

HITL is configured in your `toolpack.config.json` file under the `hitl` section.

### Basic Configuration

```json
{
  "hitl": {
    "enabled": true,
    "confirmationMode": "all",
    "bypass": {
      "tools": [],
      "categories": [],
      "levels": []
    }
  }
}
```

### Configuration Options

#### `enabled` (boolean)
- **Default**: `true`
- Master switch for HITL confirmation
- When `false`, all tools bypass confirmation

```json
{
  "hitl": {
    "enabled": false  // Disable all confirmations
  }
}
```

#### `confirmationMode` (string)
- **Default**: `"all"`
- **Options**: `"off"` | `"high-only"` | `"all"`

| Mode | Description |
|------|-------------|
| `"off"` | No confirmations (same as `enabled: false`) |
| `"high-only"` | Only confirm high-risk operations |
| `"all"` | Confirm both high and medium risk operations |

```json
{
  "hitl": {
    "confirmationMode": "high-only"  // Only confirm high-risk tools
  }
}
```

#### `bypass` (object)
Configure which tools, categories, or risk levels should skip confirmation.

**Bypass by Tool Name:**
```json
{
  "hitl": {
    "bypass": {
      "tools": ["fs.write_file", "fs.delete_file"]
    }
  }
}
```

**Bypass by Category:**
```json
{
  "hitl": {
    "bypass": {
      "categories": ["filesystem", "execution"]
    }
  }
}
```

**Bypass by Risk Level:**
```json
{
  "hitl": {
    "bypass": {
      "levels": ["medium"]  // Only bypass medium-risk tools
    }
  }
}
```

## Tool Names vs Display Names

:::warning Important
Bypass rules use the **tool name** (e.g., `"fs.write_file"`), **not** the display name (e.g., `"Write File"`).

Tool names use underscores and dots, while display names use spaces and are human-readable.
:::

### Finding Tool Names

Tool names follow the pattern: `<category>.<action>`

Common examples:

| Tool Name | Display Name | Risk Level |
|-----------|--------------|------------|
| `fs.write_file` | Write File | high |
| `fs.delete_file` | Delete File | high |
| `fs.delete_dir` | Delete Directory | high |
| `exec.run` | Run Command | high |
| `exec.run_shell` | Run Shell Command | high |
| `db.insert` | Insert Record | medium |
| `db.update` | Update Record | medium |
| `db.delete` | Delete Record | high |
| `git.commit` | Git Commit | medium |

## Risk Levels

Tools are classified into two risk levels:

### High Risk (`"high"`)
Operations that can cause permanent data loss or system changes:
- File deletion (`fs.delete_file`, `fs.delete_dir`)
- File overwrites (`fs.write_file`, `fs.batch_write`)
- File moves (`fs.move`)
- Command execution (`exec.run`, `exec.run_shell`, `exec.run_background`)
- Database deletion (`db.delete`)
- Code refactoring (`coding.refactor_rename`, `coding.multi_file_edit`)
- HTTP mutations (`http.delete`, `http.post`, `http.put`)

### Medium Risk (`"medium"`)
Operations that modify state but are generally reversible:
- Database inserts/updates (`db.insert`, `db.update`)
- Git commits (`git.commit`)
- File copies (`fs.copy`)

## API Reference

### `addBypassRule()`

Programmatically add a bypass rule to the configuration.

```typescript
import { addBypassRule } from 'toolpack-sdk';

// Bypass a specific tool
await addBypassRule({
  type: 'tool',
  value: 'fs.write_file'
});

// Bypass an entire category
await addBypassRule({
  type: 'category',
  value: 'filesystem'
});

// Bypass a risk level
await addBypassRule({
  type: 'level',
  value: 'medium'
});

// Specify custom config path
await addBypassRule({
  type: 'tool',
  value: 'fs.delete_file',
  configPath: '/path/to/toolpack.config.json'
});
```

**Parameters:**
- `type`: `'tool'` | `'category'` | `'level'`
- `value`: The tool name, category, or risk level to bypass
- `configPath` (optional): Path to config file (auto-discovered if not provided)

**Returns:** `Promise<void>`

**Throws:** `SDKError` if config write fails

### `removeBypassRule()`

Remove a bypass rule from the configuration.

```typescript
import { removeBypassRule } from 'toolpack-sdk';

// Remove a tool bypass
await removeBypassRule({
  type: 'tool',
  value: 'fs.write_file'
});

// Remove a category bypass
await removeBypassRule({
  type: 'category',
  value: 'filesystem'
});
```

**Parameters:** Same as `addBypassRule()`

**Returns:** `Promise<void>`

### `reloadConfig()`

Reload the configuration to apply changes without restarting.

```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY
});

// After modifying config
await addBypassRule({ type: 'tool', value: 'fs.write_file' });

// Reload to apply immediately
toolpack.reloadConfig();
```

**Parameters:**
- `configPath` (optional): Path to config file to reload

**Returns:** `void`

## Best Practices

### 1. Start Strict, Relax Gradually

Begin with all confirmations enabled and add bypass rules only for operations you trust:

```json
{
  "hitl": {
    "enabled": true,
    "confirmationMode": "all"
  }
}
```

### 2. Use Category Bypasses Carefully

Bypassing entire categories can skip many tools. Prefer specific tool bypasses:

```json
{
  "hitl": {
    "bypass": {
      "tools": ["fs.write_file"]  // ✅ Specific
      // "categories": ["filesystem"]  // ⚠️ Too broad
    }
  }
}
```

### 3. Never Bypass High-Risk in Production

For production environments, avoid bypassing high-risk operations:

```json
{
  "hitl": {
    "confirmationMode": "high-only",  // Always confirm high-risk
    "bypass": {
      "levels": ["medium"]  // Only bypass medium-risk
    }
  }
}
```

### 4. Use `high-only` for Development

During development, you may want to skip medium-risk confirmations:

```json
{
  "hitl": {
    "confirmationMode": "high-only"
  }
}
```

## Examples

### Example 1: Development Environment

Allow all filesystem operations but confirm commands:

```json
{
  "hitl": {
    "enabled": true,
    "confirmationMode": "all",
    "bypass": {
      "categories": ["filesystem"]
    }
  }
}
```

### Example 2: Production Environment

Confirm all high-risk operations, bypass medium-risk:

```json
{
  "hitl": {
    "enabled": true,
    "confirmationMode": "high-only"
  }
}
```

### Example 3: Trusted Automation

Bypass specific tools for automated workflows:

```json
{
  "hitl": {
    "enabled": true,
    "bypass": {
      "tools": [
        "fs.write_file",
        "git.commit",
        "db.insert"
      ]
    }
  }
}
```

### Example 4: Programmatic Control

```typescript
import { Toolpack, addBypassRule } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  configPath: './toolpack.config.json'
});

// Set up custom confirmation handler
toolpack.getClient().onToolConfirm = async (tool, args) => {
  console.log(`Confirm ${tool.displayName}?`);
  const response = await getUserInput(); // Your custom prompt
  
  if (response === 'always') {
    await addBypassRule({ type: 'tool', value: tool.name });
    toolpack.reloadConfig();
    return 'allow';
  }
  
  return response; // 'allow', 'deny', or 'cancel'
};
```

## Troubleshooting

### Bypass Rules Not Working

1. **Check tool name format**: Use `tool.name` (e.g., `"fs.write_file"`), not `tool.displayName` (e.g., `"Write File"`)
2. **Reload config**: Call `toolpack.reloadConfig()` after modifying the config file
3. **Verify enabled state**: Ensure `hitl.enabled` is not explicitly set to `false`

### All Tools Bypassing

Check if HITL is disabled:

```json
{
  "hitl": {
    "enabled": false  // ❌ This disables all confirmations
  }
}
```

Or if confirmation mode is off:

```json
{
  "hitl": {
    "confirmationMode": "off"  // ❌ This also disables all confirmations
  }
}
```

### Config Changes Not Applying

After modifying the config file, reload it:

```typescript
toolpack.reloadConfig('/path/to/toolpack.config.json');
```

## Related

- [Custom Tools](/guides/custom-tools) - Learn how to add confirmation metadata to your custom tools
- [Configuration Reference](/reference/configuration) - Complete config file documentation
