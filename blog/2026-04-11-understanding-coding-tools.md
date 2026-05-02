---
slug: coding-tools
title: "Coding Tools in Toolpack SDK: AI-Powered Code Analysis and Refactoring"
authors: [sajeer-babu]
tags: [tools, coding, refactoring, ast, symbol-navigation, code-analysis]
description: "Learn how Toolpack SDK's 12 coding tools enable AI agents to navigate codebases, analyze symbols, find references, and perform safe refactoring operations with AST-aware precision."
---

AI agents that can understand and refactor code become truly powerful development companions. Whether it's finding function definitions, renaming variables across files, or extracting code into reusable functions, **Toolpack SDK's coding tools** give your agents the ability to navigate and modify JavaScript/TypeScript codebases with AST-level precision.

In this post, we'll explore all 12 tools in the `coding` category — from symbol navigation to multi-file refactoring with atomic edits.

<!-- truncate -->

## Why Coding Tools Matter

Most AI coding assistants can generate code, but few can truly understand existing codebases. A developer asks "Where is the `handleSubmit` function defined?" or "Rename `User` to `UserAccount` everywhere" — without coding tools, the AI has to rely on text search and guesswork, often missing references or breaking code.

Toolpack SDK solves this with AST-aware tools:

- **Symbol Navigation**: Find definitions, references, and jump to declarations
- **Code Analysis**: Extract imports, exports, outlines, and diagnostics
- **Safe Refactoring**: Rename symbols and extract functions with precision
- **Multi-File Edits**: Atomic operations across multiple files
- **Multi-Language Support**: JavaScript, TypeScript, Python, Go, Rust, Java, C, and C++

All 12 coding tools are available as soon as you initialize Toolpack SDK with `tools: true`.

## The Twelve Coding Tools

### Symbol Navigation

| Tool | Parameters | Description |
|------|------------|-------------|
| `coding.find_symbol` | `symbol`, `path` | Find function/class/variable definitions |
| `coding.get_symbols` | `file` | List all symbols in a file |
| `coding.find_references` | `symbol`, `path` | Find all references to a symbol |
| `coding.go_to_definition` | `file`, `line`, `column` | Jump to symbol definition |

### Code Analysis

| Tool | Parameters | Description |
|------|------------|-------------|
| `coding.get_imports` | `file` | List all import statements |
| `coding.get_exports` | `file` | List all exported symbols |
| `coding.get_outline` | `file` | Get hierarchical file outline |
| `coding.get_diagnostics` | `file` | Get syntax errors and warnings |
| `coding.get_call_hierarchy` | `file`, `line`, `column` | Show callers and callees |

### Refactoring

| Tool | Parameters | Description |
|------|------------|-------------|
| `coding.refactor_rename` | `symbol`, `newName`, `path` | Rename symbol across codebase |
| `coding.extract_function` | `file`, `startLine`, `startColumn`, `endLine`, `endColumn`, `newFunctionName` | Extract code into new function |
| `coding.multi_file_edit` | `edits` | Edit multiple files atomically |

## Setting Up

Coding tools use AST parsing (Babel for JavaScript/TypeScript, Tree-sitter for other languages) and require no external services. They work with your codebase the moment you enable tools:

```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
});
```

That's it. All 12 `coding` tools are available to the LLM automatically.

## Usage Examples

### Finding Symbol Definitions

Use `coding.find_symbol` to locate where functions, classes, or variables are defined:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Find where the handleSubmit function is defined' }],
  model: 'gpt-4o',
});
// AI uses coding.find_symbol with: { symbol: 'handleSubmit', path: '.' }
```

Returns:
```json
{
  "symbol": "handleSubmit",
  "found": 1,
  "locations": [
    {
      "file": "./src/components/Form.tsx",
      "line": 42,
      "column": 10,
      "kind": "function",
      "name": "handleSubmit"
    }
  ]
}
```

### Listing File Symbols

Get all symbols in a file with `coding.get_symbols`:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'What functions are in src/utils/api.ts?' }],
  model: 'gpt-4o',
});
// AI uses coding.get_symbols with: { file: 'src/utils/api.ts' }
```

Returns:
```json
{
  "file": "src/utils/api.ts",
  "count": 3,
  "symbols": [
    { "name": "fetchUser", "kind": "function", "line": 5, "column": 0 },
    { "name": "updateUser", "kind": "function", "line": 15, "column": 0 },
    { "name": "deleteUser", "kind": "function", "line": 25, "column": 0 }
  ]
}
```

### Finding All References

Use `coding.find_references` to find everywhere a symbol is used:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Show me all places where the User class is used' }],
  model: 'gpt-4o',
});
// AI uses coding.find_references with: { symbol: 'User', path: '.' }
```

Returns all files and locations where `User` is referenced.

### Analyzing Imports and Exports

Check what a file imports or exports:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'What does this file export?' }],
  model: 'gpt-4o',
});
// AI uses coding.get_exports
```

Returns:
```json
{
  "file": "src/utils/helpers.ts",
  "exports": [
    { "name": "formatDate", "kind": "function", "line": 5, "column": 0 },
    { "name": "parseJSON", "kind": "function", "line": 12, "column": 0 },
    { "name": "DEFAULT_CONFIG", "kind": "variable", "line": 20, "column": 0 }
  ]
}
```

### Getting File Outline

Use `coding.get_outline` for a hierarchical view of file structure:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Show me the structure of the UserService class' }],
  model: 'gpt-4o',
});
// AI uses coding.get_outline on the file containing UserService
```

Returns a tree structure showing classes, methods, and nested symbols.

### Checking for Errors

Get syntax errors and warnings with `coding.get_diagnostics`:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Are there any syntax errors in this file?' }],
  model: 'gpt-4o',
});
// AI uses coding.get_diagnostics
```

Returns:
```json
{
  "file": "src/app.ts",
  "diagnostics": [
    {
      "severity": "error",
      "message": "Cannot find name 'undefinedVar'",
      "line": 23,
      "column": 5
    }
  ]
}
```

### Renaming Symbols

Use `coding.refactor_rename` to safely rename symbols across the entire codebase:

```typescript
const stream = toolpack.stream({
  messages: [{ role: 'user', content: 'Rename the User class to UserAccount everywhere' }],
  model: 'gpt-4o',
});
// AI uses coding.refactor_rename with:
// { symbol: 'User', newName: 'UserAccount', path: '.' }
```

This will:
1. Find all references to `User`
2. Rename the class definition
3. Update all imports and usages
4. Preserve code structure and formatting

### Extracting Functions

Use `coding.extract_function` to refactor code into reusable functions:

```typescript
const stream = toolpack.stream({
  messages: [{
    role: 'user',
    content: 'Extract lines 15-20 in src/app.ts into a new function called validateInput'
  }],
  model: 'gpt-4o',
});
// AI uses coding.extract_function with:
// {
//   file: 'src/app.ts',
//   startLine: 15,
//   startColumn: 0,
//   endLine: 20,
//   endColumn: 999,
//   newFunctionName: 'validateInput'
// }
```

This will:
1. Extract the selected code
2. Create a new function with the specified name
3. Replace the original code with a function call

Note: The current implementation provides a basic extraction. For production use, you may need to manually adjust parameters and return values.

### Multi-File Edits

Use `coding.multi_file_edit` for atomic operations across multiple files:

```typescript
const stream = toolpack.stream({
  messages: [{
    role: 'user',
    content: 'Update the API endpoint from /api/v1 to /api/v2 in all files'
  }],
  model: 'gpt-4o',
});
// AI uses coding.multi_file_edit with an array of edits
```

All edits succeed or fail together — no partial updates.

## Real-World Use Cases

### Code Navigation Assistant

```typescript
const toolpack = await Toolpack.init({
  provider: 'anthropic',
  tools: true,
});

const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `I need to understand how authentication works.
    
    Find the login function, show me what it imports,
    and trace where it's called from.`
  }],
  model: 'claude-sonnet-4',
});
```

The agent will:
1. Use `coding.find_symbol` to locate the login function
2. Use `coding.get_imports` to see dependencies
3. Use `coding.find_references` to find all callers
4. Use `coding.get_call_hierarchy` to show the call chain

### Refactoring Assistant

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Refactor the codebase:
    1. Rename all instances of 'getUserData' to 'fetchUserProfile'
    2. Extract the validation logic in handleSubmit into a separate function
    3. Update all affected imports`
  }],
});
```

The agent will:
1. Use `coding.refactor_rename` for the function rename
2. Use `coding.extract_function` for the validation logic
3. Use `coding.get_imports` to verify import updates
4. Use `coding.multi_file_edit` if needed for complex changes

### Code Quality Checker

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Analyze the codebase for issues:
    1. Check all files for syntax errors
    2. Find unused exports
    3. Identify duplicate function names`
  }],
});
```

The agent will:
1. Use `coding.get_diagnostics` on each file
2. Use `coding.get_exports` and `coding.find_references` to find unused exports
3. Use `coding.get_symbols` across files to detect duplicates

### Import Cleanup

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Clean up imports in src/components/:
    1. List all imports in each file
    2. Find which ones are actually used
    3. Remove unused imports`
  }],
});
```

The agent will:
1. Use `coding.get_imports` to list all imports
2. Use `coding.find_references` to check usage
3. Use `coding.multi_file_edit` to remove unused imports

### Dependency Analysis

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Show me the dependency graph:
    1. What does UserService import?
    2. What files import UserService?
    3. What's the full call hierarchy for the createUser method?`
  }],
});
```

The agent will:
1. Use `coding.get_imports` on UserService
2. Use `coding.find_references` for UserService
3. Use `coding.get_call_hierarchy` for createUser

## Best Practices

### 1. Use Symbol Navigation Before Refactoring

Always find all references before renaming:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Before renaming the Config class:
    1. Find all references to Config
    2. Show me the files that will be affected
    3. Then proceed with the rename to AppConfig`
  }],
});
```

### 2. Verify Diagnostics After Refactoring

Check for errors after making changes:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `After extracting the function:
    1. Run coding.get_diagnostics on the modified file
    2. Report any new errors or warnings`
  }],
});
```

### 3. Use Multi-File Edits for Atomic Changes

When updating multiple files, use `coding.multi_file_edit` to ensure consistency:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Update the API base URL in all config files atomically.
    If any edit fails, roll back all changes.`
  }],
});
```

### 4. Combine with File System Tools

Navigate the codebase structure before analyzing:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `First use fs.tree to explore the src/ directory,
    then analyze the symbols in each TypeScript file.`
  }],
});
```

### 5. Leverage Call Hierarchy for Impact Analysis

Before modifying a function, understand its impact:

```typescript
const response = await toolpack.generate({
  messages: [{
    role: 'user',
    content: `Before changing the signature of processData:
    1. Show me all functions that call it
    2. Show me all functions it calls
    3. Estimate the impact of adding a new parameter`
  }],
});
```

## Supported Languages

The coding tools use dual parsing strategies for comprehensive language support:

### Babel Parser (Full Feature Set)
- **JavaScript**: `.js`, `.jsx`, `.mjs`, `.cjs`
- **TypeScript**: `.ts`, `.tsx`

Babel-parsed files support all features including:
- Import/export statements
- Class declarations and expressions
- Function declarations and arrow functions
- Variable declarations (const, let, var)
- Type annotations (TypeScript)
- ES modules and CommonJS

### Tree-sitter Parser (Symbol Navigation)
- **Python**: `.py`
- **Go**: `.go`
- **Rust**: `.rs`
- **Java**: `.java`
- **C**: `.c`, `.h`
- **C++**: `.cpp`, `.hpp`, `.cc`

Tree-sitter parsed files support symbol navigation and analysis tools. Refactoring tools (`coding.refactor_rename`, `coding.extract_function`, `coding.multi_file_edit`) currently work best with JavaScript/TypeScript files.

## Security Considerations

Coding tools can read and modify files. Use modes to restrict access:

```typescript
const readOnlyMode = {
  name: 'code-analysis-only',
  displayName: 'Code Analysis Only',
  description: 'Read code but no refactoring',
  systemPrompt: 'You can analyze code but cannot perform refactoring operations.',
  allowedToolCategories: [],
  blockedToolCategories: [],
  allowedTools: [
    'coding.find_symbol',
    'coding.get_symbols',
    'coding.find_references',
    'coding.go_to_definition',
    'coding.get_imports',
    'coding.get_exports',
    'coding.get_outline',
    'coding.get_diagnostics',
    'coding.get_call_hierarchy',
  ],
  blockedTools: [
    'coding.refactor_rename',
    'coding.extract_function',
    'coding.multi_file_edit',
  ],
  blockAllTools: false,
};

const toolpack = await Toolpack.init({
  provider: 'openai',
  tools: true,
  customModes: [readOnlyMode],
  defaultMode: 'code-analysis-only',
});
```

## Tool Summary

| Tool | Use Case |
|------|----------|
| `coding.find_symbol` | Locate function/class/variable definitions |
| `coding.get_symbols` | List all symbols in a file |
| `coding.find_references` | Find all usages of a symbol |
| `coding.go_to_definition` | Jump to symbol declaration |
| `coding.get_imports` | Analyze file dependencies |
| `coding.get_exports` | See what a file exposes |
| `coding.get_outline` | Get hierarchical file structure |
| `coding.get_diagnostics` | Find syntax errors and warnings |
| `coding.get_call_hierarchy` | Trace function call chains |
| `coding.refactor_rename` | Safely rename symbols everywhere |
| `coding.extract_function` | Refactor code into reusable functions |
| `coding.multi_file_edit` | Atomic edits across multiple files |

## What's Next?

The coding tools are one of 10+ tool categories in Toolpack SDK. Coming up in this series:

- **Git Tools**: Stage, commit, diff, and manage branches with AI
- **Database Tools**: Query and manage databases with natural language
- **Knowledge Tools**: Store and retrieve contextual information
- **Web Tools**: Search the web and scrape content

---

**Want to try coding tools?** Initialize Toolpack SDK with `tools: true` and start asking your agent to navigate and refactor your codebase.

**Exploring other tool categories?** Check out the [Tools Overview](/tools/overview) for the full list.

Have questions or a use case you'd like to share? Open an issue on [GitHub](https://github.com/toolpack-ai/toolpack-sdk) or join the discussion.
