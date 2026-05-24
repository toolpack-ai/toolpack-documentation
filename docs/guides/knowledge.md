---
sidebar_position: 1
description: "Learn how to use the @toolpack-sdk/knowledge package for RAG (Retrieval-Augmented Generation) with your AI agents. Set up knowledge bases from Markdown, JSON, SQLite, PostgreSQL, and web sources with vector embeddings. Includes web crawling, API data ingestion, hybrid search, and streaming ingestion."
keywords: [knowledge, RAG, retrieval, embeddings, vector search, knowledge base, MemoryProvider, PersistentKnowledgeProvider, MarkdownSource, WebUrlSource, ApiDataSource, JSONSource, SQLiteSource, PostgresSource, hybrid search, streaming ingestion, OpenAI embedder, Ollama embedder, VertexAI embedder, OpenRouter embedder]
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

const source = new WebUrlSource(['https://example.com/docs'], {
  maxDepth: 2,                 // Follow links up to this many levels (default: 1)
  maxPagesPerDomain: 20,       // Cap pages crawled per domain (default: 10)
  sameDomainOnly: true,        // Only follow links on the same domain (default: true)
  delayMs: 1000,               // Delay between requests in ms (default: 1000)
  userAgent: 'MyApp/1.0',      // Custom user agent
  timeoutMs: 30000,            // Request timeout in ms (default: 30000)
  maxChunkSize: 2000,          // Max tokens per chunk (default: 2000)
  chunkOverlap: 200,           // Overlap between chunks (default: 200)
  minChunkSize: 100,           // Min chunk size (default: 100)
  namespace: 'web',            // Chunk ID prefix (default: 'web')
  metadata: { source: 'web' }, // Added to all chunks
});
```

**Constructor:** `new WebUrlSource(urls: string[], options?: WebUrlSourceOptions)`

**Features:**
- Recursive website crawling with depth control
- Automatic HTML text extraction (removes scripts, styles, nav, header, footer)
- Link discovery and following
- Per-domain rate limiting and page caps
- Metadata includes title, URL, chunk index

### ApiDataSource

Index data from REST APIs with pagination support:

```typescript
import { ApiDataSource } from '@toolpack-sdk/knowledge';

const source = new ApiDataSource('https://api.github.com/repos/org/repo/issues', {
  method: 'GET',                        // 'GET' | 'POST' (default: 'GET')
  headers: {
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
  },
  body: undefined,                      // Request body for POST requests
  pagination: {
    param: 'page',                      // Query parameter name for the page number
    start: 1,                           // Starting page number
    step: 1,                            // Page increment per request
    maxPages: 5,                        // Max pages to fetch
  },
  dataPath: '',                         // Dot-separated JSON path to data array (e.g. 'data.items')
  contentExtractor: (item: any) =>      // Custom content extraction (optional)
    `${item.title}\n\n${item.body}`,
  metadataExtractor: (item: any) => ({  // Custom metadata extraction (optional)
    id: item.id,
    state: item.state,
  }),
  timeoutMs: 30000,                     // Request timeout in ms (default: 30000)
  maxChunkSize: 2000,                   // Max tokens per chunk (default: 2000)
  chunkOverlap: 200,                    // Overlap between chunks (default: 200)
  namespace: 'api',                     // Chunk ID prefix (default: 'api')
  metadata: { source: 'github' },       // Added to all chunks
});
```

**Constructor:** `new ApiDataSource(url: string, options?: ApiDataSourceOptions)`

When no `contentExtractor` is provided, the source automatically looks for common fields (`content`, `text`, `description`, `body`, `message`) in each item and falls back to JSON serialization. When no `metadataExtractor` is provided, it extracts common fields (`id`, `title`, `name`, `created_at`, `updated_at`, `author`, `tags`).

**Features:**
- REST API data ingestion (GET/POST)
- Automatic pagination handling with configurable start, step, and max pages
- Custom content and metadata extractors
- JSON path support for nested data via `dataPath`
- Configurable timeout and chunking

### JSONSource

Index data from local JSON files:

```typescript
import { JSONSource } from '@toolpack-sdk/knowledge';

const source = new JSONSource('./data/products.json', {
  toContent: (item: any) => `${item.name}\n\n${item.description}`,  // Required
  filter: (item: any) => item.active === true,                       // Optional: filter items
  chunkSize: 100,                                                     // Items per chunk (default: 100)
  namespace: 'products',                                              // Chunk ID prefix (default: 'json')
  metadata: { source: 'products-db' },                               // Added to all chunks
});
```

**Constructor:** `new JSONSource(filePath: string, options: JSONSourceOptions)`

The `toContent` callback is **required**. The source handles both JSON arrays (with optional item-level `filter`) and single JSON objects.

**Features:**
- Parses JSON arrays or single objects
- Optional item-level filtering
- Configurable items per chunk
- Metadata includes source filename, chunk index range, and total item count

### SQLiteSource

Index rows from a SQLite database. Requires the `better-sqlite3` package:

```bash
npm install better-sqlite3
```

```typescript
import { SQLiteSource } from '@toolpack-sdk/knowledge';

const source = new SQLiteSource('./data/app.db', {
  query: 'SELECT id, title, body FROM articles WHERE published = 1',  // Optional SQL query
  toContent: (row) => `${row.title}\n\n${row.body}`,                  // Required
  chunkSize: 50,                                                        // Rows per chunk (default: 100)
  namespace: 'articles',                                                // Chunk ID prefix (default: 'sqlite')
  metadata: { source: 'sqlite' },                                       // Added to all chunks
  preLoadCSV: {                          // Optional: load a CSV into the DB before querying
    tableName: 'articles',
    csvPath: './data/articles.csv',
    delimiter: ',',                      // Column delimiter (default: ',')
    headers: true,                       // First row is a header (default: true)
  },
});
```

**Constructor:** `new SQLiteSource(dbPath: string, options: SQLiteSourceOptions)`

The `toContent` callback is **required**. If `query` is not provided it defaults to `SELECT * FROM sqlite_master WHERE type = "table"`.

**Features:**
- Arbitrary SQL queries
- Required `toContent` callback to control what gets embedded
- Optional CSV/TSV pre-loading into the database before querying
- Metadata includes source filename, query, and row index range

### PostgresSource

Index rows from a PostgreSQL database. Requires the `pg` package:

```bash
npm install pg
```

```typescript
import { PostgresSource } from '@toolpack-sdk/knowledge';

// Using a connection string
const source = new PostgresSource({
  connectionString: process.env.DATABASE_URL,
  query: 'SELECT id, title, content FROM docs WHERE status = $1',
  toContent: (row) => `${row.title}\n\n${row.content}`,  // Required
  chunkSize: 50,
  namespace: 'docs',
  metadata: { source: 'postgres' },
  ssl: true,
});

// Using individual connection parameters
const source2 = new PostgresSource({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'admin',
  password: process.env.DB_PASSWORD,
  query: 'SELECT title, body FROM posts',
  toContent: (row) => `${row.title}\n\n${row.body}`,
});
```

**Constructor:** `new PostgresSource(options: PostgresSourceOptions)`

The `query` and `toContent` fields are **required**. Use either `connectionString` or the individual `host`/`port`/`database`/`user`/`password` fields.

**Features:**
- Arbitrary SQL queries
- Connection via connection string or individual parameters
- SSL support
- Required `toContent` callback to control what gets embedded
- Metadata includes query and row index range

## Embedders

Embedders convert text to vector embeddings for semantic search:

### OllamaEmbedder

Local embeddings using Ollama (zero API cost):

```typescript
import { OllamaEmbedder } from '@toolpack-sdk/knowledge';

const embedder = new OllamaEmbedder({
  model: 'nomic-embed-text',           // or 'mxbai-embed-large', 'all-minilm', etc.
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

### OpenRouterEmbedder

Embeddings via OpenRouter, giving access to OpenAI embedding models through a single API key:

```typescript
import { OpenRouterEmbedder } from '@toolpack-sdk/knowledge';

const embedder = new OpenRouterEmbedder({
  model: 'openai/text-embedding-3-small',  // Required
  apiKey: process.env.OPENROUTER_API_KEY!, // Required
  dimensions: 1536,                         // Optional: override auto-detected dimensions
  retries: 3,                               // Default: 3
  retryDelay: 1000,                         // ms, default: 1000
  timeout: 30000,                           // ms, default: 30000
});
```

**Known models (dimensions auto-detected):**
- `openai/text-embedding-3-small` (1536 dimensions)
- `openai/text-embedding-3-large` (3072 dimensions)
- `openai/text-embedding-ada-002` (1536 dimensions)
- `nvidia/llama-nemotron-embed-vl-1b-v2` (4096 dimensions)

For any model not in the list above, pass `dimensions` explicitly.

### VertexAIEmbedder

Google Cloud Vertex AI embedding models. Authenticates via [Application Default Credentials (ADC)](https://cloud.google.com/docs/authentication/application-default-credentials):

```typescript
import { VertexAIEmbedder } from '@toolpack-sdk/knowledge';

const embedder = new VertexAIEmbedder({
  projectId: 'my-gcp-project',   // Required (or set VERTEX_AI_PROJECT / GOOGLE_CLOUD_PROJECT env var)
  location: 'us-central1',       // GCP region (default: 'us-central1')
  model: 'gemini-embedding-001', // Embedding model (default: 'gemini-embedding-001')
  outputDimensionality: 3072,    // Optional: override output dimensions
  retries: 3,                    // Default: 3
  retryDelay: 1000,              // ms, default: 1000
});
```

If `projectId` is not set in options, the embedder falls back to the `VERTEX_AI_PROJECT`, `TOOLPACK_VERTEXAI_PROJECT`, or `GOOGLE_CLOUD_PROJECT` environment variables. If none are set, it throws at construction time.

**Supported models:**
- `gemini-embedding-001` (3072 dimensions, default)
- `text-embedding-005` (768 dimensions)
- `text-multilingual-embedding-002` (768 dimensions)

For any other model pass `outputDimensionality` explicitly.

**Important:** Changing `outputDimensionality` after initial indexing requires wiping the knowledge store, as the dimension count must be consistent.

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

## Utility Functions

The package exports two utility functions for building custom search pipelines:

### keywordSearch

```typescript
import { keywordSearch } from '@toolpack-sdk/knowledge';

const score = keywordSearch(text, query);
// Returns a number between 0 and 1.
// Returns 1.0 on exact substring match.
// Returns a fractional score based on the proportion of query words found in text.
// Returns 0.0 when no query words (longer than 2 characters) are found.
```

### combineScores

```typescript
import { combineScores } from '@toolpack-sdk/knowledge';

const combined = combineScores(semanticScore, keywordScore, semanticWeight);
// semanticWeight defaults to 0.7 (70% semantic, 30% keyword).
// Returns: semanticScore * semanticWeight + keywordScore * (1 - semanticWeight)
```

Use these functions when implementing custom hybrid search logic outside of `hybridQuery`.

## Streaming Ingestion

Process large datasets with real-time progress tracking:

```typescript
// Traditional sync (blocks until complete)
await kb.sync();

// Streaming sync (progress updates)
for await (const progress of kb.syncStream()) {
  switch (progress.type) {
    case 'count':
      console.log(`Total chunks to process: ${progress.total}`);
      break;
    case 'progress':
      console.log(`Processed ${progress.processed}/${progress.total} chunks (${progress.percent}%)`);
      break;
    case 'complete':
      console.log(`Sync complete! Processed ${progress.total} chunks`);
      break;
    case 'error':
      console.error('Sync failed:', progress.error);
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
  reSync?: boolean;                 // default: true
  streamingBatchSize?: number;      // Chunks processed per batch (default: 100)
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
   - Use `sameDomainOnly: true` (the default) to stay within your site
   - Limit `maxDepth` and `maxPagesPerDomain` to avoid excessive crawling
   - Check `robots.txt` compliance manually

7. **API data ingestion:**
   - Use `contentExtractor` for complex data structures
   - Use `dataPath` to target nested arrays in API responses
   - Configure `pagination` for large datasets

8. **Hybrid search optimization:**
   - Use hybrid search for technical content with proper nouns
   - Adjust `keywordWeight` higher for exact term matching
   - Use `semanticWeight` higher for conceptual searches

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
new MarkdownSource('./docs/**/*.md')  // correct
new MarkdownSource('.\\docs\\**\\*.md')  // incorrect
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
// Use sameDomainOnly to limit crawling scope
const source = new WebUrlSource(['https://example.com'], {
  userAgent: 'MyApp/1.0 (contact@example.com)',
  delayMs: 2000,
  sameDomainOnly: true,
});
```

**VertexAI authentication errors:**
```typescript
// Ensure Application Default Credentials are configured
// Run: gcloud auth application-default login
// Or set GOOGLE_APPLICATION_CREDENTIALS env var to a service account key file
const embedder = new VertexAIEmbedder({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  location: 'us-central1',
});
```

**SQLiteSource or PostgresSource peer dependency missing:**
```bash
# SQLiteSource requires better-sqlite3
npm install better-sqlite3

# PostgresSource requires pg
npm install pg
```

**Hybrid search not returning expected results:**
```typescript
// Adjust weights based on content type
// Technical docs: higher keywordWeight
// General content: higher semanticWeight
const results = await kb.hybridQuery(query, {
  keywordWeight: 0.4,    // Increase for technical terms
  semanticWeight: 0.6,   // Increase for concepts
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
