---
slug: building-knowledge-bases-with-toolpack-sdk
title: "Building Knowledge Bases with @toolpack-sdk/knowledge"
authors: [sajeer-babu]
tags: [knowledge, RAG, embeddings, vector-search, ollama, openai, markdown]
description: "A practical guide to building knowledge bases with the @toolpack-sdk/knowledge package. Learn to set up RAG (Retrieval-Augmented Generation) with Markdown sources, vector embeddings, and semantic search for your AI agents."
---

The `@toolpack-sdk/knowledge` package provides **Retrieval-Augmented Generation (RAG)** capabilities for your AI agents. Build knowledge bases from documentation, code, or any text source and enable semantic search within your agent conversations. This post covers everything you need to know about creating knowledge bases, configuring providers and embedders, and integrating with the Toolpack SDK.

<!-- truncate -->

## What is RAG?

**Retrieval-Augmented Generation** combines the power of large language models with your own data. Instead of relying solely on the model's training data, RAG retrieves relevant information from a knowledge base and provides it as context for the AI to generate more accurate, up-to-date responses.

The `@toolpack-sdk/knowledge` package handles the entire pipeline: chunking your documents, generating vector embeddings, storing them efficiently, and performing semantic search at query time.

## Installation

```bash
npm install @toolpack-sdk/knowledge
```

## Quick Start

### Development Setup (Memory Provider)

For prototyping and development, use the `MemoryProvider` with zero configuration:

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

The `MemoryProvider` stores vectors in memory using a JavaScript Map. Data is lost when the process exits, making it perfect for development and short-lived processes.

### Production Setup (Persistent Provider)

For CLI tools and production applications, use the `PersistentKnowledgeProvider` with SQLite storage:

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

The `PersistentKnowledgeProvider` creates a SQLite database at `~/.toolpack/knowledge/{namespace}.db` with WAL mode enabled for better concurrency. The `reSync: false` option skips re-indexing if the database already exists.

## Architecture Overview

The knowledge system has three core components:

### 1. Providers (Storage)

Providers handle vector storage and similarity search:

**MemoryProvider** — In-memory Map storage for development:
```typescript
const provider = new MemoryProvider({
  maxChunks: 10000,  // Optional: limit memory usage
});
```

**PersistentKnowledgeProvider** — SQLite-backed storage for production:
```typescript
const provider = new PersistentKnowledgeProvider({
  namespace: 'my-app',           // Creates ~/.toolpack/knowledge/my-app.db
  storagePath: './custom/path',  // Optional: override default location
  reSync: false,                 // Skip re-indexing if DB exists
});
```

### 2. Sources (Ingestion)

Sources extract and chunk content from various formats. The `MarkdownSource` chunks files by heading hierarchy:

```typescript
const source = new MarkdownSource('./docs/**/*.md', {
  maxChunkSize: 2000,      // Max tokens per chunk (default: 2000)
  chunkOverlap: 200,       // Overlap between chunks (default: 200)
  minChunkSize: 100,       // Merge small sections (default: 100)
  namespace: 'docs',       // Prefix for chunk IDs (default: 'markdown')
  metadata: { type: 'documentation' },  // Added to all chunks
});
```

Features of MarkdownSource:
- Heading-based chunking preserves document structure
- YAML frontmatter extraction into metadata
- Code block detection (adds `hasCode: true` metadata)
- Deterministic chunk IDs using MD5 hashing for deduplication
- Fast-glob pattern matching with Windows path normalization

### 3. Embedders (Vector Generation)

Embedders convert text to vector embeddings for semantic search.

**OllamaEmbedder** — Local embeddings using Ollama:
```typescript
const embedder = new OllamaEmbedder({
  model: 'nomic-embed-text',           // or 'mxbai-embed-large', 'all-minilm'
  baseUrl: 'http://localhost:11434',   // default
  retries: 3,
  retryDelay: 1000,
});
```

Supported models with predefined dimensions:
- `nomic-embed-text` — 768 dimensions
- `mxbai-embed-large` — 1024 dimensions  
- `all-minilm` — 384 dimensions
- `snowflake-arctic-embed` — 1024 dimensions
- `bge-m3`, `bge-large` — 1024 dimensions

You can override dimensions for custom models using the `dimensions` option.

**OpenAIEmbedder** — Cloud embeddings via OpenAI API:
```typescript
const embedder = new OpenAIEmbedder({
  model: 'text-embedding-3-small',    // or 'text-embedding-3-large', 'text-embedding-ada-002'
  apiKey: process.env.OPENAI_API_KEY!,
  retries: 3,
  retryDelay: 1000,
  timeout: 30000,
});
```

Supported models:
- `text-embedding-3-small` — 1536 dimensions
- `text-embedding-3-large` — 3072 dimensions
- `text-embedding-ada-002` — 1536 dimensions

Both embedders implement the `Embedder` interface with `embed()` and `embedBatch()` methods.

## Integration with Toolpack SDK

Connect your knowledge base to Toolpack SDK agents for RAG-powered conversations:

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

When you pass a `Knowledge` instance to `Toolpack.init()`, the SDK automatically registers a `knowledge_search` tool. The tool's description comes from your `description` field, helping the AI understand when to search the knowledge base.

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

The `filter` option supports multiple operators:

```typescript
// Exact match
{ category: 'api' }

// In array
{ category: { $in: ['api', 'guide', 'tutorial'] } }

// Numeric comparisons
{ priority: { $gt: 5 } }
{ priority: { $lt: 10 } }
```

Filters are evaluated using the `matchesFilter()` utility which checks each condition against chunk metadata.

## Error Handling

Handle embedding failures gracefully with the `onError` callback:

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

Error types available:
- `KnowledgeError` — Base error class with optional `code` property
- `EmbeddingError` — Embedding API failures with optional `statusCode`
- `IngestionError` — Source parsing failures with optional `file` path
- `DimensionMismatchError` — Vector dimension mismatch with `expected` and `actual` properties
- `KnowledgeProviderError` — Provider operation failures
- `ChunkTooLargeError` — Chunk exceeds max size with `chunkSize` property

## Progress Monitoring

Track embedding progress for large knowledge bases:

```typescript
const kb = await Knowledge.create({
  provider,
  sources,
  embedder,
  description: 'Documentation',
  onSync: (event) => {
    // event.type: 'start' | 'complete' | 'error'
    // event.chunksAffected?: number (for 'complete' events)
    // event.error?: Error (for 'error' events)
  },
  onEmbeddingProgress: (event) => {
    // event.source: string
    // event.current: number
    // event.total: number  
    // event.percent: number
    console.log(`Progress: ${event.percent}%`);
  },
});
```

## How It Works

### Creation Flow

When you call `Knowledge.create()`:

1. **Dimension Validation** — The provider validates that the embedder's dimensions match any existing stored dimensions (for persistent providers)
2. **Sync Decision** — If `reSync !== false` and the provider indicates it should re-sync (or is new), the sync process starts
3. **Chunk Loading** — Each source's `load()` method yields chunks asynchronously
4. **Embedding** — Chunks are embedded in batches using `embedBatch()` for efficiency
5. **Storage** — Embedded chunks are added to the provider

### Query Flow

When you call `kb.query()`:

1. **Embedding** — The query text is embedded using the same embedder
2. **Search** — The provider performs cosine similarity search across all stored vectors
3. **Filtering** — Results are filtered by metadata if a `filter` option is provided
4. **Threshold** — Results below the similarity threshold are discarded
5. **Ranking** — Results are sorted by score (descending) and limited

The cosine similarity calculation:
```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

## Best Practices

### 1. Choose the Right Provider

- **Development**: Use `MemoryProvider` for fast iteration
- **Production CLI**: Use `PersistentKnowledgeProvider` with `reSync: false` after initial indexing
- **Size Limits**: Set `maxChunks` on `MemoryProvider` to prevent memory issues

### 2. Optimize Chunk Sizes

- Small docs (README, guides): 1000-1500 tokens
- Large docs (API reference): 2000-3000 tokens
- Code files: 1500-2000 tokens with `hasCode` metadata for filtering

### 3. Handle Embedding Failures

Always provide `onError` for production use:
- Return `'skip'` for transient failures (network timeouts)
- Return `'abort'` for critical errors (invalid API keys)

### 4. Leverage Metadata Filtering

Tag chunks strategically:
```typescript
const source = new MarkdownSource('./docs/**/*.md', {
  metadata: { 
    category: 'api',
    version: 'v2',
    hasCode: true 
  },
});
```

Then filter queries:
```typescript
const results = await kb.query('authentication', {
  filter: { category: 'api', version: 'v2' },
});
```

### 5. Monitor Progress

Show loading indicators in CLI apps:
```typescript
onEmbeddingProgress: (event) => {
  if (event.percent % 10 === 0) {
    console.log(`Indexing: ${event.percent}%`);
  }
}
```

## Troubleshooting

### "Dimension mismatch" Error

This occurs when changing embedders with a persistent provider:

```typescript
// Clear the database or use a different namespace
const provider = new PersistentKnowledgeProvider({
  namespace: 'my-app-v2',  // New namespace
  reSync: true,            // Force re-indexing
});
```

### "No files found" with MarkdownSource

Use forward slashes in glob patterns (even on Windows):
```typescript
new MarkdownSource('./docs/**/*.md')  // Correct
new MarkdownSource('.\\docs\\**\\*.md')  // Incorrect
```

The source automatically normalizes Windows backslashes to forward slashes for fast-glob compatibility.

### Slow Embedding

Use `embedBatch()` when possible:
- `OpenAIEmbedder.embedBatch()` makes a single API call for all texts
- `OllamaEmbedder.embedBatch()` processes sequentially but can be optimized

### High Memory Usage

For large knowledge bases:
- Use `PersistentKnowledgeProvider` instead of `MemoryProvider`
- Set `maxChunks` on `MemoryProvider`

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

### QueryResult Structure

```typescript
interface QueryResult {
  chunk: {
    id: string;
    content: string;
    metadata: Record<string, unknown>;
    vector?: number[];  // Only if includeVectors: true
  };
  score: number;      // Cosine similarity (0-1)
  distance?: number;  // 1 - score
}
```

The `@toolpack-sdk/knowledge` package provides a complete, production-ready RAG solution that integrates seamlessly with the Toolpack SDK. Start with the `MemoryProvider` and `OllamaEmbedder` for development, then switch to `PersistentKnowledgeProvider` and `OpenAIEmbedder` for production deployments.
