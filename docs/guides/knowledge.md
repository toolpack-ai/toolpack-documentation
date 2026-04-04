---
sidebar_position: 8
description: "Learn how to use the @toolpack-sdk/knowledge package for RAG (Retrieval-Augmented Generation) with your AI agents. Set up knowledge bases from Markdown, JSON, and SQLite sources with vector embeddings."
keywords: [knowledge, RAG, retrieval, embeddings, vector search, knowledge base, MemoryProvider, PersistentKnowledgeProvider, MarkdownSource, OpenAI embedder, Ollama embedder]
---

# Knowledge Package

The `@toolpack-sdk/knowledge` package provides **Retrieval-Augmented Generation (RAG)** capabilities for your AI agents. Build knowledge bases from documentation, code, or any text source and enable semantic search within your agent conversations.

## Installation

```bash
npm install @toolpack-sdk/knowledge
```

## Quick Start

### Development Setup (Memory Provider)

Perfect for prototyping and development with zero configuration:

```typescript
import { Knowledge, MemoryProvider, MarkdownSource, OllamaEmbedder } from '@toolpack-sdk/knowledge';

const kb = await Knowledge.create({
  provider: new MemoryProvider(),
  sources: [new MarkdownSource('./docs/**/*.md')],
  embedder: new OllamaEmbedder({ model: 'nomic-embed-text' }),
  description: 'Documentation for search queries',
});

// Search your knowledge base
const results = await kb.query('how to configure authentication');
console.log(results[0].chunk.content);
```

### Production Setup (Persistent Provider)

For CLI tools and production applications with persistent storage:

```typescript
import { Knowledge, PersistentKnowledgeProvider, MarkdownSource, OpenAIEmbedder } from '@toolpack-sdk/knowledge';

const kb = await Knowledge.create({
  provider: new PersistentKnowledgeProvider({
    namespace: 'my-app',
    reSync: false,  // Use existing index if available
  }),
  sources: [new MarkdownSource('./docs/**/*.md')],
  embedder: new OpenAIEmbedder({
    model: 'text-embedding-3-small',
    apiKey: process.env.OPENAI_API_KEY!,
  }),
  description: 'My application documentation',
  onEmbeddingProgress: (event) => {
    console.log(`Embedding: ${event.percent}% (${event.current}/${event.total})`);
  },
});
```

## Providers

Providers handle vector storage and similarity search. Choose based on your use case:

### MemoryProvider

In-memory storage ideal for development:

```typescript
import { MemoryProvider } from '@toolpack-sdk/knowledge';

const provider = new MemoryProvider({
  maxChunks: 10000,  // Optional: limit memory usage
});
```

**Best for:** Development, prototyping, short-lived processes  
**Limitations:** Data lost on process exit, memory constraints

### PersistentKnowledgeProvider

SQLite-backed persistent storage:

```typescript
import { PersistentKnowledgeProvider } from '@toolpack-sdk/knowledge';

const provider = new PersistentKnowledgeProvider({
  namespace: 'my-app',           // Creates ~/.toolpack/knowledge/my-app.db
  storagePath: './custom/path',  // Optional: override default location
  reSync: false,                 // Skip re-indexing if DB exists
});
```

**Best for:** CLI tools, desktop apps, production workloads  
**Features:** WAL mode, transactions, metadata filtering

## Sources

Sources extract and chunk content from various formats:

### MarkdownSource

Chunks Markdown files by heading hierarchy:

```typescript
import { MarkdownSource } from '@toolpack-sdk/knowledge';

const source = new MarkdownSource('./docs/**/*.md', {
  maxChunkSize: 2000,      // Max tokens per chunk
  chunkOverlap: 200,       // Overlap between chunks
  minChunkSize: 100,       // Merge small sections
  namespace: 'docs',       // Prefix for chunk IDs
  metadata: { type: 'documentation' },  // Added to all chunks
});
```

**Features:**
- Heading-based chunking (preserves document structure)
- YAML frontmatter extraction
- Code block detection (`hasCode: true` metadata)
- Deterministic chunk IDs for deduplication

## Embedders

Embedders convert text to vector embeddings for semantic search:

### OllamaEmbedder

Local embeddings using Ollama (zero API cost):

```typescript
import { OllamaEmbedder } from '@toolpack-sdk/knowledge';

const embedder = new OllamaEmbedder({
  model: 'nomic-embed-text',           // or 'mxbai-embed-large', 'all-minilm'
  baseUrl: 'http://localhost:11434',   // default
  retries: 3,
  retryDelay: 1000,
});
```

**Supported models:**
- `nomic-embed-text` (768 dimensions)
- `mxbai-embed-large` (1024 dimensions)
- `all-minilm` (384 dimensions)
- Custom models with `dimensions` override

### OpenAIEmbedder

OpenAI text-embedding models:

```typescript
import { OpenAIEmbedder } from '@toolpack-sdk/knowledge';

const embedder = new OpenAIEmbedder({
  model: 'text-embedding-3-small',    // or 'text-embedding-3-large'
  apiKey: process.env.OPENAI_API_KEY!,
  retries: 3,
  retryDelay: 1000,
  timeout: 30000,
});
```

**Supported models:**
- `text-embedding-3-small` (1536 dimensions)
- `text-embedding-3-large` (3072 dimensions)
- `text-embedding-ada-002` (1536 dimensions)

## Integration with Toolpack SDK

Connect your knowledge base to Toolpack SDK agents:

```typescript
import { Toolpack } from 'toolpack-sdk';
import { Knowledge, MemoryProvider, MarkdownSource, OllamaEmbedder } from '@toolpack-sdk/knowledge';

const kb = await Knowledge.create({
  provider: new MemoryProvider(),
  sources: [new MarkdownSource('./docs/**/*.md')],
  embedder: new OllamaEmbedder({ model: 'nomic-embed-text' }),
  description: 'Search this when users ask about setup, configuration, or API usage.',
});

const toolpack = await Toolpack.init({
  provider: 'anthropic',
  knowledge: kb,  // Automatically registers knowledge_search tool
});

// The agent can now search your knowledge base
const response = await toolpack.chat('How do I configure authentication?');
```

## Querying

### Basic Search

```typescript
const results = await kb.query('authentication setup');
// Returns: Array of { chunk, score, distance }
```

### Advanced Options

```typescript
const results = await kb.query('authentication setup', {
  limit: 5,              // Max results (default: 10)
  threshold: 0.8,        // Minimum similarity 0-1 (default: 0.7)
  filter: {              // Metadata filters
    hasCode: true,
    category: { $in: ['api', 'guide'] },
  },
  includeMetadata: true,  // Include chunk metadata (default: true)
  includeVectors: false,  // Include embedding vectors (default: false)
});
```

### Metadata Filters

```typescript
// Exact match
{ category: 'api' }

// In array
{ category: { $in: ['api', 'guide', 'tutorial'] } }

// Numeric comparisons
{ priority: { $gt: 5 } }
{ priority: { $lt: 10 } }
```

## Error Handling

Handle embedding failures gracefully:

```typescript
const kb = await Knowledge.create({
  provider,
  sources,
  embedder,
  description: 'Knowledge base',
  onError: (error, context) => {
    console.error(`Failed: ${context.file} — ${error.message}`);
    
    if (error instanceof EmbeddingError) {
      return 'skip';  // Skip this chunk, continue with others
    }
    return 'abort';   // Stop the entire process
  },
});
```

**Error Types:**
- `KnowledgeError` — Base error class
- `EmbeddingError` — Embedding API failures
- `IngestionError` — Source parsing failures
- `DimensionMismatchError` — Vector dimension mismatch
- `KnowledgeProviderError` — Provider operation failures
- `ChunkTooLargeError` — Chunk exceeds max size

## API Reference

### Knowledge.create()

```typescript
interface KnowledgeOptions {
  provider: KnowledgeProvider;
  sources: KnowledgeSource[];
  embedder: Embedder;
  description: string;              // Required: used as tool description
  reSync?: boolean;                   // default: true
  onError?: ErrorHandler;
  onSync?: SyncEventHandler;
  onEmbeddingProgress?: EmbeddingProgressHandler;
}
```

### Sync Events

```typescript
onSync: (event) => {
  // event.type: 'start' | 'file' | 'chunk' | 'complete' | 'error'
  // event.file?: string
  // event.chunksAffected?: number
  // event.error?: Error
}
```

### Embedding Progress

```typescript
onEmbeddingProgress: (event) => {
  // event.source: string
  // event.current: number
  // event.total: number
  // event.percent: number
}
```

## Best Practices

1. **Choose the right provider:**
   - Development: `MemoryProvider`
   - Production CLI: `PersistentKnowledgeProvider`

2. **Use appropriate chunk sizes:**
   - Small docs: 1000-1500 tokens
   - Large docs: 2000-3000 tokens
   - Code: 1500-2000 tokens (with `hasCode` metadata)

3. **Handle embedding failures:**
   - Always provide `onError` for production
   - Use `skip` for transient failures
   - Use `abort` for critical errors

4. **Leverage metadata filtering:**
   - Tag chunks with `category`, `hasCode`, `version`
   - Filter by relevance in queries

5. **Monitor progress:**
   - Use `onEmbeddingProgress` for large knowledge bases
   - Show loading indicators in CLI apps

## Troubleshooting

### Common Issues

**"Dimension mismatch" error:**
```typescript
// Ensure embedder dimensions match provider
// OllamaEmbedder with nomic-embed-text = 768 dimensions
// PersistentKnowledgeProvider persists dimensions in DB
```

**"No files found" with MarkdownSource:**
```typescript
// Check glob pattern - use forward slashes even on Windows
new MarkdownSource('./docs/**/*.md')  // ✓
new MarkdownSource('.\\docs\\**\\*.md')  // ✗
```

**Slow embedding:**
```typescript
// Use embedBatch() when possible
// OllamaEmbedder.embedBatch is optimized
// OpenAIEmbedder.embedBatch makes single API call
```
