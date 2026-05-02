---
sidebar_position: 1
description: "Learn how to use the @toolpack-sdk/knowledge package for RAG (Retrieval-Augmented Generation) with your AI agents. Set up knowledge bases from Markdown, JSON, and SQLite sources with vector embeddings. Includes web crawling, API data ingestion, hybrid search, and streaming ingestion."
keywords: [knowledge, RAG, retrieval, embeddings, vector search, knowledge base, MemoryProvider, PersistentKnowledgeProvider, MarkdownSource, WebUrlSource, ApiSource, hybrid search, streaming ingestion, OpenAI embedder, Ollama embedder]
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

### WebUrlSource

Crawl and index websites automatically:

```typescript
import { WebUrlSource } from '@toolpack-sdk/knowledge';

const source = new WebUrlSource('https://example.com/docs', {
  maxDepth: 3,                    // Crawl up to 3 levels deep
  maxPages: 100,                  // Limit to 100 pages
  allowedDomains: ['example.com'], // Only crawl these domains
  delayMs: 1000,                  // Respectful crawling delay
  userAgent: 'MyApp/1.0',         // Custom user agent
  blockedPaths: ['/admin', '/private'], // Skip these paths
  followExternalLinks: false,     // Stay within allowed domains
});
```

**Features:**
- Recursive website crawling with depth control
- Domain and path filtering
- Content extraction (removes scripts, styles, navigation)
- Link discovery and following
- Rate limiting and respectful crawling
- Metadata preservation (title, URL, crawl date, links)

### ApiSource

Index data from REST APIs with pagination support:

```typescript
import { ApiSource } from '@toolpack-sdk/knowledge';

const source = new ApiSource('https://api.example.com', '/posts', {
  method: 'GET',                  // HTTP method
  headers: { 'Accept': 'application/json' },
  auth: {
    type: 'bearer',              // 'bearer' | 'basic' | 'api-key'
    token: process.env.API_TOKEN,
  },
  pagination: {
    type: 'cursor',              // 'offset' | 'cursor' | 'page'
    cursorParam: 'after',
    nextCursorPath: 'data.next_cursor',
    resultsPath: 'data.posts',
  },
  rateLimit: {
    requestsPerSecond: 2,        // Rate limiting
  },
  transformResponse: (data, url) => {
    return data.posts.map((post: any) => ({
      content: `${post.title}\n\n${post.content}`,
      metadata: { id: post.id, author: post.author, tags: post.tags },
    }));
  },
});
```

**Features:**
- REST API data ingestion with authentication
- Multiple pagination strategies (offset, cursor, page-based)
- Rate limiting and request throttling
- Custom response transformation
- Error handling and retries
- Support for all HTTP methods

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

### Enhanced Knowledge Tools

The knowledge base provides a tool with advanced search capabilities:

```typescript
const tool = kb.toTool();

// Semantic search (default)
const semanticResults = await tool.execute({
  query: 'machine learning',
  limit: 5,
});

// Hybrid search (semantic + keyword)
const hybridResults = await tool.execute({
  query: 'machine learning algorithms',
  searchType: 'hybrid',
  keywordWeight: 0.4,
  semanticWeight: 0.6,
  filter: { category: 'tutorial' },
});
```

**Tool parameters:**
- `query`: Search query string
- `searchType`: `'semantic'` or `'hybrid'` (default: `'semantic'`)
- `keywordWeight`: Weight for keyword matching (0-1, default: 0.3)
- `semanticWeight`: Weight for semantic matching (0-1, default: 0.7)
- `limit`: Maximum results (default: 10)
- `threshold`: Minimum similarity score (default: 0.7)
- `filter`: Metadata filters

## Querying

### Basic Semantic Search

```typescript
const results = await kb.query('authentication setup');
// Returns: Array of { chunk, score, distance }
```

### Hybrid Search (Semantic + Keyword)

Combine semantic similarity with keyword matching for better results:

```typescript
const results = await kb.hybridQuery('machine learning algorithms', {
  keywordWeight: 0.3,        // 30% keyword relevance
  semanticWeight: 0.7,       // 70% semantic relevance
  keywordFields: ['content', 'title'], // Fields to search
  limit: 10,
  threshold: 0.7,
});
```

**Hybrid search advantages:**
- Better precision for technical terms and proper nouns
- Improved ranking for exact matches
- Balanced semantic understanding with keyword accuracy

### Advanced Query Options

```typescript
const results = await kb.query('authentication setup', {
  limit: 5,              // Max results (default: 10)
  threshold: 0.8,        // Minimum similarity 0-1 (default: 0.7)
  filter: {              // Metadata filters
    hasCode: true,
    category: { $in: ['api', 'guide'] },
    source: 'web',       // Filter by source type
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

// Source-specific filters
{ source: 'web', url: { $in: ['https://docs.example.com'] } }
{ source: 'api', statusCode: 200 }
```

## Streaming Ingestion

Process large datasets with real-time progress tracking:

```typescript
// Traditional sync (blocks until complete)
await kb.sync();

// Streaming sync (progress updates)
for await (const progress of kb.syncStream()) {
  switch (progress.type) {
    case 'count':
      console.log(`📊 Total chunks to process: ${progress.total}`);
      break;
    case 'progress':
      console.log(`⏳ Processed ${progress.processed}/${progress.total} chunks (${progress.percent}%)`);
      break;
    case 'complete':
      console.log(`✅ Sync complete! Processed ${progress.total} chunks`);
      break;
    case 'error':
      console.error('❌ Sync failed:', progress.error);
      break;
  }
}
```

**Streaming benefits:**
- Real-time progress feedback
- Memory-efficient batch processing (100 chunks per batch)
- Non-blocking UI updates
- Early error detection
- Better user experience for large datasets

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

### Knowledge Methods

#### query(text, options?)
Standard semantic search using vector similarity.

```typescript
async query(text: string, options?: QueryOptions): Promise<QueryResult[]>
```

#### hybridQuery(text, options?)
Advanced search combining semantic similarity with keyword matching.

```typescript
async hybridQuery(text: string, options?: HybridQueryOptions): Promise<QueryResult[]>

interface HybridQueryOptions extends QueryOptions {
  keywordWeight?: number;     // Weight for keyword matching (default: 0.3)
  semanticWeight?: number;    // Weight for semantic matching (default: 0.7)
  keywordFields?: string[];   // Fields to search (default: ['content'])
}
```

#### sync()
Synchronous ingestion of all sources.

```typescript
async sync(): Promise<void>
```

#### syncStream()
Streaming ingestion with progress updates.

```typescript
async *syncStream(): AsyncIterable<SyncProgress>

interface SyncProgress {
  type: 'count' | 'progress' | 'complete' | 'error';
  total?: number;
  processed?: number;
  percent?: number;
  error?: Error;
}
```

#### toTool()
Convert knowledge base to a Toolpack SDK tool.

```typescript
toTool(): KnowledgeTool
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
   - Web content: 1500-2000 tokens (after HTML cleaning)
   - API data: 1000-1500 tokens (depends on content structure)

3. **Handle embedding failures:**
   - Always provide `onError` for production
   - Use `skip` for transient failures
   - Use `abort` for critical errors

4. **Leverage metadata filtering:**
   - Tag chunks with `category`, `hasCode`, `version`
   - Use source-specific metadata (`source`, `url`, `statusCode`)
   - Filter by relevance in queries

5. **Monitor progress:**
   - Use `onEmbeddingProgress` for large knowledge bases
   - Use `syncStream()` for real-time progress in UIs
   - Show loading indicators in CLI apps

6. **Web crawling best practices:**
   - Set appropriate `delayMs` (1000ms+ for respectful crawling)
   - Use `allowedDomains` to stay within your site
   - Limit `maxDepth` and `maxPages` to avoid excessive crawling
   - Check `robots.txt` compliance manually

7. **API data ingestion:**
   - Implement rate limiting to respect API limits
   - Use `transformResponse` for complex data structures
   - Handle pagination correctly for large datasets
   - Cache API responses when possible

8. **Hybrid search optimization:**
   - Use hybrid search for technical content with proper nouns
   - Adjust `keywordWeight` higher for exact term matching
   - Use `semanticWeight` higher for conceptual searches
   - Experiment with `keywordFields` for different content types

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

**Web crawling blocked:**
```typescript
// Check robots.txt and respect site policies
// Add user agent and delay between requests
// Use allowedDomains to limit crawling scope
const source = new WebUrlSource(url, {
  userAgent: 'MyApp/1.0 (contact@example.com)',
  delayMs: 2000,
  allowedDomains: ['example.com'],
});
```

**API rate limiting:**
```typescript
// Implement rate limiting in ApiSource
const source = new ApiSource(baseUrl, endpoint, {
  rateLimit: {
    requestsPerSecond: 1,
    requestsPerMinute: 60,
  },
});
```

**Hybrid search not returning expected results:**
```typescript
// Adjust weights based on content type
// Technical docs: higher keywordWeight
// General content: higher semanticWeight
const results = await kb.hybridQuery(query, {
  keywordWeight: 0.4,    // Increase for technical terms
  semanticWeight: 0.6,   // Increase for concepts
  keywordFields: ['content', 'title', 'metadata.tags'],
});
```

**Streaming sync memory issues:**
```typescript
// Streaming processes in batches automatically
// For very large datasets, consider:
// - Smaller batch sizes (not currently configurable)
// - More frequent progress updates
// - Error handling for partial failures
```
