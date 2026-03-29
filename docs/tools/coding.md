---
sidebar_position: 7
description: "Toolpack SDK coding tools for AI-powered code analysis. Find symbols, get imports, rename variables, extract functions, and perform multi-file edits."
keywords: [coding tools, code analysis, symbol search, refactoring, extract function, rename symbol, AI code tools, Toolpack SDK coding]
---

# Coding Tools

Category: `coding` · 12 tools

AST-aware code analysis, symbol navigation, and refactoring for JavaScript/TypeScript.

## Symbol Navigation

| Tool | Parameters | Description |
|------|------------|-------------|
| `coding.find_symbol` | `symbol`, `path` | Find function/class/variable definitions |
| `coding.get_symbols` | `file` | List all symbols in a file |
| `coding.find_references` | `symbol`, `path` | Find all references to a symbol |
| `coding.go_to_definition` | `file`, `line`, `column` | Jump to symbol definition |

## Code Analysis

| Tool | Parameters | Description |
|------|------------|-------------|
| `coding.get_imports` | `file` | List all import statements |
| `coding.get_exports` | `file` | List all exported symbols |
| `coding.get_outline` | `file` | Get hierarchical file outline |
| `coding.get_diagnostics` | `file` | Get syntax errors and warnings |
| `coding.get_call_hierarchy` | `file`, `line`, `column` | Show callers and callees |

## Refactoring

| Tool | Parameters | Description |
|------|------------|-------------|
| `coding.refactor_rename` | `symbol`, `newName`, `path` | Rename symbol across codebase |
| `coding.extract_function` | `file`, `startLine`, `startColumn`, `endLine`, `endColumn`, `newFunctionName` | Extract code into new function |
| `coding.multi_file_edit` | `edits` | Edit multiple files atomically |

## Examples

### Finding Symbols

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Find where the handleSubmit function is defined' }],
    model: 'gpt-4o',
});
// AI uses coding.find_symbol
```

### Code Analysis

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'What does this file export?' }],
    model: 'gpt-4o',
});
// AI uses coding.get_exports
```

### Refactoring

```typescript
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Rename the User class to UserAccount everywhere' }],
    model: 'gpt-4o',
});
// AI uses coding.refactor_rename
```

## Supported Languages

- JavaScript (.js, .jsx)
- TypeScript (.ts, .tsx)

The coding tools use Babel for AST parsing, providing accurate symbol resolution and refactoring.
