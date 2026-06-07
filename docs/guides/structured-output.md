---
sidebar_position: 9
description: "Use Zod schemas with Toolpack SDK's response_format to get fully-typed structured output from any provider. response.data is inferred automatically from your schema."
keywords: [structured output, Zod, response_format, typed output, JSON schema, Toolpack SDK]
---

# Structured Output

Toolpack SDK supports **Zod-schema structured output** across all providers. Pass a Zod schema as `response_format` and the SDK enforces the shape server-side (where the provider supports it) and validates the result — returning a fully-typed `response.data` object.

## Basic usage

```typescript
import { z } from 'zod';
import { Toolpack } from 'toolpack-sdk';

const sdk = await Toolpack.init({ provider: 'openai' });

const SentimentSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  score: z.number().min(0).max(1),
  summary: z.string(),
});

const result = await sdk.generate(
  'Analyse the sentiment of: "The product works great but shipping was slow."',
  { response_format: SentimentSchema }
);

// result.data is typed as { sentiment: 'positive' | 'negative' | 'neutral', score: number, summary: string }
console.log(result.data.sentiment); // 'positive'
console.log(result.data.score);     // e.g. 0.72
```

## How it works

| `response_format` value | What you get |
|---|---|
| `'text'` (default) | `response.content` — plain string |
| `'json_object'` | `response.content` — raw JSON string (you parse it) |
| `ZodType<T>` | `response.data` — parsed, validated, fully typed as `T` |

When a Zod schema is provided:

1. **OpenAI** — uses `zodResponseFormat()` (native structured output, enforced at token level)
2. **Anthropic** — uses `zodOutputFormat()` with extended thinking output config
3. **Gemini / Vertex AI** — converts schema to `responseSchema` JSON Schema via `zodToJsonSchema`
4. **Ollama** — falls back to JSON mode; validation is done by the SDK after generation

After the model responds, the SDK calls `schema.parse()` on the raw JSON. If validation fails, an error is thrown with the Zod validation details.

## Nested schemas

```typescript
const ReviewSchema = z.object({
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  verdict: z.object({
    rating: z.number().int().min(1).max(5),
    recommended: z.boolean(),
  }),
});

const result = await sdk.generate(
  'Review the MacBook Pro M4.',
  { response_format: ReviewSchema }
);

console.log(result.data.verdict.rating);     // 5
console.log(result.data.pros);               // ['Fast CPU', 'Great display', ...]
```

## Using with `sdk.chat()`

`response_format` works the same way in `sdk.chat()`:

```typescript
const result = await sdk.chat(
  [
    { role: 'system', content: 'You extract structured data from user messages.' },
    { role: 'user', content: 'My name is Alice and I am 30 years old.' },
  ],
  { response_format: z.object({ name: z.string(), age: z.number() }) }
);

console.log(result.data); // { name: 'Alice', age: 30 }
```

## Using with modes

Set `response_format` on a mode to enforce structured output for every call that uses it:

```typescript
import { createMode } from 'toolpack-sdk';

const extractionMode = createMode({
  name: 'data-extractor',
  description: 'Extracts structured data from unstructured text.',
  response_format: z.object({
    entities: z.array(z.object({
      type: z.enum(['person', 'org', 'location']),
      value: z.string(),
    })),
  }),
});
```

## Combining with tools

When `tools` are enabled, providers typically cannot guarantee structured output at the same time. Gemini and Vertex AI will skip `responseSchema` when tools are active. For best results, use structured output in tool-free modes or in the final summarisation step of a workflow.

## TypeScript inference

The generic flows automatically — no manual type annotation needed:

```typescript
// result is CompletionResponse<{ count: number; items: string[] }>
const result = await sdk.generate('List 3 fruits.', {
  response_format: z.object({
    count: z.number(),
    items: z.array(z.string()),
  }),
});

// result.data is { count: number; items: string[] }
result.data?.items.forEach(item => console.log(item));
```

## Provider compatibility

| Provider | Native enforcement | SDK-side validation |
|---|---|---|
| OpenAI | Yes (token-level) | Yes |
| Anthropic | Yes (output config) | Yes |
| Gemini | Yes (responseSchema) | Yes |
| Vertex AI | Yes (responseSchema) | Yes |
| Ollama | No (JSON mode only) | Yes |
