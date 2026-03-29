# Knowledge Module (RAG)

The Knowledge module provides **Retrieval-Augmented Generation (RAG)** capabilities for the Toolpack SDK. It enables AI agents to search and retrieve relevant information from your documents, databases, and other data sources during conversations.

## Overview

The Knowledge module consists of four main components:

| Component | Purpose |
|-----------|---------|
| **Knowledge** | Main orchestrator that manages sources, embedders, and providers |
| **Sources** | Load and chunk content from various formats (Markdown, JSON, SQLite) |
| **Embedders** | Convert text into vector embeddings (OpenAI, Ollama, Gemini) |
| **Providers** | Store and query vector embeddings (`MemoryProvider`, `PersistentKnowledgeProvider`) |

## Quick Start

```typescript
import {
  Toolpack,
  Knowledge,
  PersistentKnowledgeProvider,
  MarkdownSource,
} from 'toolpack-sdk';

// 1. Create a knowledge base
const kb = await Knowledge.create({
  provider: new PersistentKnowledgeProvider({ namespace: 'docs' }),
  source: new MarkdownSource('./docs'),
  reSync: false, // skip re-embedding if cached chunks already exist
});

// 2. Initialize Toolpack with knowledge
const toolpack = await Toolpack.init({
  provider: 'openai',
  knowledge: kb,
});

// 3. AI can now search the knowledge base automatically
const response = await toolpack.generate({
  messages: [{ role: 'user', content: 'What does the documentation say about authentication?' }]
});
```

When you provide a `knowledge` option to `Toolpack.init()`, the SDK automatically:
- Registers a `knowledge_search` tool
- Adds it to `alwaysLoadedTools` for all modes
- The AI can call it whenever it needs to retrieve information

## Sources

Sources are responsible for loading content and splitting it into searchable chunks.

### MarkdownSource

Loads and chunks Markdown files with intelligent heading-based splitting.

```typescript
import { MarkdownSource } from 'toolpack-sdk';

// Load all .md files from a directory
const source = new MarkdownSource('./docs');

// Or use a glob pattern
const source = new MarkdownSource('./content/**/*.md');

// Or a single file
const source = new MarkdownSource('./README.md');

// With options
const source = new MarkdownSource('./docs', {
  namespace: 'documentation',
  maxChunkSize: 2000,
  chunkOverlap: 200,
  minChunkSize: 100,
  watch: true, // Enable file watching for live updates
});
```

**Features:**
- Heading-based chunking (splits on `#`, `##`, `###`, etc.)
- Frontmatter extraction (YAML metadata)
- Wikilink detection (`[[link]]`)
- Hashtag extraction (`#tag`)
- Code block preservation
- Automatic chunk size management

### JSONSource

Loads and chunks JSON files or arrays.

```typescript
import { JSONSource } from 'toolpack-sdk';

// Chunk each array item
const source = new JSONSource('./data/products.json', {
  chunkBy: 'item',
  contentFields: ['name', 'description'],
  metadataFields: ['id', 'category'],
});

// Chunk by JSONPath
const source = new JSONSource('./data/nested.json', {
  chunkBy: '$.items[*]',
  contentFields: ['title', 'body'],
});

// With watch mode
const source = new JSONSource('./data/config.json', {
  namespace: 'config',
  watch: true,
});
```

**Options:**
- `chunkBy`: `'item'` (array items) or a JSONPath expression
- `contentFields`: Fields to include in chunk content
- `metadataFields`: Fields to include in chunk metadata
- `namespace`: Identifier for this source
- `watch`: Enable file watching

### SQLiteTextSource

Loads text-heavy content from SQLite databases.

```typescript
import { SQLiteTextSource } from 'toolpack-sdk';

const source = new SQLiteTextSource('./data/articles.db', {
  table: 'articles',
  contentColumns: ['title', 'body'],
  metadataColumns: ['id', 'author', 'created_at'],
  where: 'published = 1',
  pollInterval: 30000, // Poll for changes every 30 seconds
});
```

**Options:**
- `table`: Table name to query
- `contentColumns`: Columns to concatenate for chunk content
- `metadataColumns`: Columns to include as metadata
- `where`: Optional WHERE clause filter
- `namespace`: Identifier for this source
- `pollInterval`: Polling interval for watch mode (ms)

## Embedders

Embedders convert text into vector representations for semantic search.

### Auto-Detection

By default, `Knowledge.create()` auto-detects an available embedder:

1. **Ollama** (if running locally at `http://localhost:11434`)
2. **OpenAI** (if `TOOLPACK_OPENAI_KEY` or `OPENAI_API_KEY` is set)

```typescript
// Auto-detect embedder
const kb = await Knowledge.create({
  provider: new MemoryProvider(),
  source: new MarkdownSource('./docs'),
  // embedder is auto-detected
});
```

### OllamaEmbedder

Uses a local Ollama instance for embeddings (free, private, no API key needed).

```typescript
import { OllamaEmbedder } from 'toolpack-sdk';

const kb = await Knowledge.create({
  provider: new MemoryProvider(),
  source: new MarkdownSource('./docs'),
  embedder: new OllamaEmbedder({
    model: 'nomic-embed-text', // default
    baseUrl: 'http://localhost:11434', // default
  }),
});
```

**Requirements:**
- Ollama must be running locally
- Pull an embedding model: `ollama pull nomic-embed-text`

### OpenAIEmbedder

Uses OpenAI's embedding API.

```typescript
import { OpenAIEmbedder } from 'toolpack-sdk';

const kb = await Knowledge.create({
  provider: new MemoryProvider(),
  source: new MarkdownSource('./docs'),
  embedder: new OpenAIEmbedder({
    model: 'text-embedding-3-small', // default
    apiKey: process.env.OPENAI_API_KEY, // or TOOLPACK_OPENAI_KEY
    retries: 3,
    timeout: 30000,
  }),
});
```

**Models:**
| Model | Dimensions | Notes |
|-------|------------|-------|
| `text-embedding-3-small` | 1536 | Default, good balance |
| `text-embedding-3-large` | 3072 | Higher quality |
| `text-embedding-ada-002` | 1536 | Legacy |

### GeminiEmbedder

Uses Google's Gemini embedding API.

```typescript
import { GeminiEmbedder } from 'toolpack-sdk';

const kb = await Knowledge.create({
  provider: new MemoryProvider(),
  source: new MarkdownSource('./docs'),
  embedder: new GeminiEmbedder({
    model: 'text-embedding-004', // default
    apiKey: process.env.GOOGLE_GENERATIVE_AI_KEY, // or TOOLPACK_GEMINI_KEY
  }),
});
```

## Providers

Providers store vector embeddings and handle similarity search.

### MemoryProvider

In-memory vector storage with cosine similarity search.

```typescript
import { MemoryProvider } from 'toolpack-sdk';

const provider = new MemoryProvider({
  maxChunks: 10000, // Optional limit
});
```

**Features:**
- Fast in-memory search
- Cosine similarity scoring
- Metadata filtering
- No external dependencies

**Note:** Data is lost when the process exits. For persistence, consider implementing a custom provider with a vector database like Pinecone, Weaviate, or pgvector.

### PersistentKnowledgeProvider

Persist embeddings on disk so repeated launches skip re-embedding.

```typescript
import { PersistentKnowledgeProvider, MarkdownSource } from 'toolpack-sdk';

const provider = new PersistentKnowledgeProvider({
	namespace: 'docs',
	// storagePath: '/custom/path' // optional override
});

const kb = await Knowledge.create({
	provider,
	sources: [new MarkdownSource('./docs', {namespace: 'docs'})],
	reSync: false, // only embed when cache is empty
});
```

- Default storage lives at `~/.toolpack/knowledge/<namespace>` and each chunk is saved as a JSON file containing the content, metadata, and embedding vector.
- `Knowledge.create({ reSync: false })` now calls `provider.hasStoredChunks()` so existing caches are reused automatically. Set `reSync: true` (default) or delete the namespace directory when sources change.
- Because chunks are plain files, you can pre-populate the directory (e.g., in CI or during app installation) to deliver instant knowledge availability.

## Querying

### Direct Query

You can query the knowledge base directly:

```typescript
const results = await kb.query('authentication flow', {
  limit: 5,
  threshold: 0.3, // Minimum similarity score (0-1)
  filter: { type: 'documentation' }, // Metadata filter
});

for (const result of results) {
  console.log(`Score: ${result.score}`);
  console.log(`Content: ${result.chunk.content}`);
  console.log(`Metadata:`, result.chunk.metadata);
}
```

### Agent Integration

When integrated with `Toolpack.init()`, the AI automatically has access to `knowledge_search`:

```typescript
const toolpack = await Toolpack.init({
  provider: 'openai',
  knowledge: kb,
});

// The AI will call knowledge_search when needed
const response = await toolpack.stream({
  messages: [{ role: 'user', content: 'How do I configure the database?' }]
});
```

The `knowledge_search` tool is automatically added to `alwaysLoadedTools` for all modes, so the AI can use it without needing to discover it via `tool.search`.

## Multiple Sources

You can combine multiple sources:

```typescript
const kb = await Knowledge.create({
  provider: new MemoryProvider(),
  sources: [
    new MarkdownSource('./docs', { namespace: 'docs' }),
    new JSONSource('./data/faq.json', { namespace: 'faq' }),
    new SQLiteTextSource('./data/articles.db', { 
      namespace: 'articles',
      table: 'articles',
      contentColumns: ['title', 'body'],
    }),
  ],
});
```

## Watch Mode

Enable live updates when source files change:

```typescript
const kb = await Knowledge.create({
  provider: new MemoryProvider(),
  source: new MarkdownSource('./docs', { watch: true }),
});

// Knowledge base automatically updates when files change
// Call kb.stop() to stop watching
```

## Sync Events

Listen for sync events:

```typescript
const kb = await Knowledge.create({
  provider: new MemoryProvider(),
  source: new MarkdownSource('./docs'),
  onSync: (event) => {
    console.log(`Sync ${event.type}: ${event.chunksAffected} chunks`);
  },
});
```

## Embedding Progress Events

Track embedding progress during initialization (useful for loading indicators):

```typescript
const kb = await Knowledge.create({
  provider: new MemoryProvider(),
  source: new MarkdownSource('./docs'),
  onEmbeddingProgress: (event) => {
    switch (event.phase) {
      case 'start':
        console.log('🔄 Starting embedding process...');
        break;
      case 'progress':
        console.log(`📊 Processed ${event.processedChunks} chunks from ${event.currentSource}`);
        break;
      case 'complete':
        console.log(`✅ Embedding complete! Total chunks: ${event.totalChunks}`);
        break;
    }
  },
});
```

**Event Structure:**

```typescript
interface EmbeddingProgressEvent {
  phase: 'start' | 'progress' | 'complete';
  totalChunks?: number;        // Available in 'start', 'progress', and 'complete' phases
  processedChunks?: number;    // Available in 'progress' and 'complete' phases
  currentSource?: string;      // Available in 'progress' phase
  percentage?: number;         // Available in 'progress' and 'complete' phases
}
```

**Progress Frequency:**
- `start`: Emitted once at the beginning of sync (includes `totalChunks`)
- `progress`: Emitted at 10% intervals (10%, 20%, 30%, ..., 90%)
- `complete`: Emitted once when all chunks are embedded (percentage: 100)

## Error Handling

Handle errors during ingestion:

```typescript
const kb = await Knowledge.create({
  provider: new MemoryProvider(),
  source: new MarkdownSource('./docs'),
  onError: (error, context) => {
    console.error(`Error in ${context.file}:`, error.message);
    return 'skip'; // 'skip' | 'retry' | 'abort'
  },
});
```

**Error Types:**
- `KnowledgeError` - General knowledge module errors
- `EmbeddingError` - Embedding API failures
- `IngestionError` - Source loading/parsing failures
- `ChunkTooLargeError` - Chunk exceeds size limits

## Configuration Reference

### Knowledge Options

```typescript
interface KnowledgeOptions {
  provider: KnowledgeProvider;
  source?: KnowledgeSource;
  sources?: KnowledgeSource[];
  embedder?: Embedder;
  onSync?: (event: SyncEvent) => void;
  onEmbeddingProgress?: (event: EmbeddingProgressEvent) => void;
  onError?: (error: Error, context: ErrorContext) => ErrorAction;
}
```

### Query Options

```typescript
interface QueryOptions {
  limit?: number;           // Max results (default: 10)
  threshold?: number;       // Min similarity 0-1 (default: 0.3)
  filter?: Record<string, any>; // Metadata filter
  includeMetadata?: boolean;    // Include metadata (default: true)
  includeVectors?: boolean;     // Include vectors (default: false)
}
```

### Chunk Structure

```typescript
interface Chunk {
  id: string;              // Unique identifier
  content: string;         // Text content
  metadata: {
    source: string;        // Source file/path
    namespace?: string;    // Source namespace
    [key: string]: any;    // Additional metadata
  };
  vector?: number[];       // Embedding vector (if included)
}
```

## Best Practices

1. **Choose the right embedder:**
   - Use **Ollama** for privacy-sensitive data or offline use
   - Use **OpenAI** for highest quality embeddings
   - Use **Gemini** as an alternative cloud option

2. **Optimize chunk sizes:**
   - Smaller chunks (500-1000 chars) for precise retrieval
   - Larger chunks (1500-2500 chars) for more context

3. **Use namespaces:**
   - Organize sources with namespaces for easier filtering
   - Filter queries by namespace when relevant

4. **Handle errors gracefully:**
   - Use `onError` callback to handle ingestion failures
   - Return `'skip'` to continue with other chunks

5. **Monitor sync events:**
   - Use `onSync` to track ingestion progress
   - Log chunk counts for debugging

## Example: Documentation Search Bot

```typescript
import {
  Toolpack,
  Knowledge,
  MemoryProvider,
  MarkdownSource,
} from 'toolpack-sdk';

async function main() {
  // Create knowledge base from documentation
  const kb = await Knowledge.create({
    provider: new MemoryProvider(),
    source: new MarkdownSource('./docs', {
      namespace: 'documentation',
      watch: true,
    }),
    onSync: (event) => {
      console.log(`📚 Synced ${event.chunksAffected} chunks`);
    },
  });

  // Initialize Toolpack with knowledge
  const toolpack = await Toolpack.init({
    provider: 'openai',
    model: 'gpt-4.1',
    knowledge: kb,
  });

  // Chat with the documentation
  const response = await toolpack.generate({
    messages: [
      { role: 'user', content: 'How do I set up authentication?' }
    ],
  });

  console.log(response.content);
}

main();
```
