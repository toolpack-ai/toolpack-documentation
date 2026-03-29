---
sidebar_position: 2
description: "Toolpack SDK filesystem tools for AI-powered file operations. Read, write, copy, move, delete files and directories. Search with glob patterns and read specific line ranges."
keywords: [filesystem tools, AI file operations, read file, write file, file search, glob pattern, Toolpack SDK filesystem]
---

# File System Tools

Category: `filesystem` · 18 tools

Read, write, search, and manage files and directories.

## Core Operations

| Tool | Parameters | Description |
|------|------------|-------------|
| `fs.read_file` | `path`, `encoding?` | Read file contents |
| `fs.write_file` | `path`, `content`, `encoding?` | Write content to file (creates parent dirs) |
| `fs.append_file` | `path`, `content`, `encoding?` | Append content to file |
| `fs.delete_file` | `path` | Delete a file |
| `fs.delete_dir` | `path`, `force?` | Delete a directory recursively |
| `fs.exists` | `path` | Check if file or directory exists |
| `fs.stat` | `path` | Get file info (size, modified date, type) |
| `fs.list_dir` | `path`, `recursive?` | List files and directories |
| `fs.create_dir` | `path`, `recursive?` | Create a directory |
| `fs.move` | `path`, `new_path` | Move or rename file/directory |
| `fs.copy` | `path`, `new_path` | Copy file or directory |

## Advanced Operations

| Tool | Parameters | Description |
|------|------------|-------------|
| `fs.read_file_range` | `path`, `start_line`, `end_line` | Read specific line range |
| `fs.search` | `path`, `query`, `recursive?` | Search for text in files |
| `fs.replace_in_file` | `path`, `search`, `replace` | Find and replace text |
| `fs.glob` | `pattern`, `cwd?` | Find files matching glob pattern |
| `fs.tree` | `path`, `depth?` | Get directory tree representation |

## Batch Operations

| Tool | Parameters | Description |
|------|------------|-------------|
| `fs.batch_read` | `paths`, `encoding?`, `continueOnError?` | Read multiple files at once |
| `fs.batch_write` | `files`, `encoding?`, `atomic?`, `createDirs?` | Write multiple files atomically |

## Examples

### Reading Files

```typescript
// AI automatically uses fs.read_file
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Show me the contents of package.json' }],
    model: 'gpt-4o',
});
```

### Searching Code

```typescript
// AI uses fs.search or fs.glob
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Find all files that import React' }],
    model: 'gpt-4o',
});
```

### Batch Operations

```typescript
// AI uses fs.batch_read for efficiency
const stream = toolpack.stream({
    messages: [{ role: 'user', content: 'Read all the config files in this project' }],
    model: 'gpt-4o',
});
```
