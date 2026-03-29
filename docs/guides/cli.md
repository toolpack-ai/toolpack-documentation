---
sidebar_position: 6
description: "Use the Toolpack CLI for an interactive AI terminal experience. Features multi-provider support, tool execution, mode switching, and rich terminal UI."
keywords: [Toolpack CLI, AI terminal, interactive AI, CLI tool, AI command line, terminal assistant, AI REPL]
---

# Toolpack CLI

The **Toolpack CLI** is a rich interactive terminal interface built with the Toolpack SDK. It demonstrates the SDK's capabilities and can be used as a standalone AI assistant.

[![GitHub](https://img.shields.io/badge/GitHub-toolpack--cli-blue?logo=github)](https://github.com/toolpack-ai/toolpack-cli) [![npm](https://img.shields.io/npm/v/toolpack-cli?logo=npm)](https://www.npmjs.com/package/toolpack-cli)

## Installation

```bash
npm install -g toolpack-cli
```

Or run directly with npx:

```bash
npx toolpack-cli
```

## Features

- **Multiple AI Providers** - Switch between OpenAI, Anthropic, Gemini, and Ollama
- **Model Selection** - Choose from available models per provider
- **Tool Execution** - Watch the AI use 77 built-in tools in real-time
- **Mode Switching** - Toggle between Agent and Chat modes
- **Conversation History** - Persistent chat history with SQLite
- **Streaming** - Real-time token streaming with interrupt support
- **Keyboard Shortcuts** - Efficient navigation and control
- **Instant Knowledge Cache** - Bundled embeddings copied to `~/.toolpack/knowledge/cli` so global installs skip re-indexing

## Quick Start

1. Set your API key:
   ```bash
   export OPENAI_API_KEY="sk-..."
   ```

2. Run the CLI:
   ```bash
   toolpack
   ```

3. Select a provider and model from the home screen

4. Start chatting!

## Keyboard Shortcuts

### Home Screen

| Key | Action |
|-----|--------|
| `↑/↓` | Navigate options |
| `Enter` | Select |
| `Esc` | Back |

### Chat Screen

| Key | Action |
|-----|--------|
| `Enter` | Send message |
| `q` | Interrupt streaming |
| `↑/↓` | Scroll history |
| `PgUp/PgDn` | Scroll faster |
| `Esc` | Return to home |

## Commands

Type these in the chat input:

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/clear` | Clear conversation history |
| `/mode` | Show or switch the current mode |
| `/model` | Show or change the current model |
| `/tools` | List available tools |
| `/tool-log` | Show recent tool execution log |
| `/tool-search` | Search for a tool by name or description |
| `/info` | Show system and session info |
| `/version` | Show version information |

## Configuration

The CLI reads from `toolpack.config.json` in your current directory:

```json
{
    "systemPrompt": "You are a helpful coding assistant.",
    "tools": {
        "enabled": true,
        "autoExecute": true
    }
}
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `GEMINI_API_KEY` | Google Gemini API key |

## Building from Source

```bash
# Clone the repository
git clone https://github.com/toolpack-ai/toolpack-sdk.git
cd toolpack-sdk/samples/toolpack-cli

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
npm start
```

During `npm run build` the CLI copies the bundled knowledge assets (`samples/toolpack-cli/knowledge/cli/*.json`) into `dist/knowledge`. On first run the CLI mirrors them into `~/.toolpack/knowledge/cli`, letting the `PersistentKnowledgeProvider` load cached embeddings immediately. Delete that directory or pass `reSync: true` in `ToolpackContext` if you need to regenerate embeddings after editing the Markdown/JSON/SQLite sources.

## Architecture

The CLI is built with:

- **Ink** - React for CLI interfaces
- **Toolpack SDK** - AI provider abstraction and tools
- **SQLite** - Conversation history persistence

It serves as both a useful tool and a reference implementation for building applications with the [Toolpack SDK](https://github.com/toolpack-ai/toolpack-sdk).
