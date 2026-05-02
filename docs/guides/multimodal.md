---
sidebar_position: 8
description: "Send images to AI models with Toolpack SDK. Support for file paths, base64 data, and URLs across OpenAI, Anthropic, Gemini, and Ollama."
keywords: [multimodal AI, vision AI, image input, GPT-4 vision, Claude vision, Gemini vision, Toolpack SDK multimodal]
---

# Multimodal Support

Toolpack SDK supports multimodal inputs (text + images) across all vision-capable providers. You can send images alongside text prompts to models like GPT-4o, Claude Sonnet, Gemini Pro Vision, and LLaVA.

## Image Input Formats

Images can be provided in three formats:

### 1. Local File Path

```typescript
import { Toolpack } from 'toolpack-sdk';

const toolpack = await Toolpack.init({ provider: 'openai' });

const response = await toolpack.generate({
    messages: [{
        role: 'user',
        content: [
            { type: 'text', text: 'What is in this image?' },
            { 
                type: 'image_file', 
                image_file: { 
                    path: '/path/to/image.png',
                    detail: 'high'  // 'auto' | 'low' | 'high'
                } 
            }
        ]
    }],
    model: 'gpt-4o',
});
```

### 2. Base64 Data

```typescript
const response = await toolpack.generate({
    messages: [{
        role: 'user',
        content: [
            { type: 'text', text: 'Describe this diagram' },
            { 
                type: 'image_data', 
                image_data: { 
                    data: 'iVBORw0KGgo...', // base64 string
                    mimeType: 'image/png',
                    detail: 'auto'
                } 
            }
        ]
    }],
    model: 'gpt-4o',
});
```

### 3. HTTP URL

```typescript
const response = await toolpack.generate({
    messages: [{
        role: 'user',
        content: [
            { type: 'text', text: 'What breed is this dog?' },
            { 
                type: 'image_url', 
                image_url: { 
                    url: 'https://example.com/dog.jpg',
                    detail: 'low'
                } 
            }
        ]
    }],
    model: 'gpt-4o',
});
```

## Multiple Images

Send multiple images in a single request:

```typescript
const response = await toolpack.generate({
    messages: [{
        role: 'user',
        content: [
            { type: 'text', text: 'Compare these two images' },
            { type: 'image_file', image_file: { path: './image1.png' } },
            { type: 'image_file', image_file: { path: './image2.png' } }
        ]
    }],
    model: 'gpt-4o',
});
```

## Provider Behavior

Different providers handle image inputs differently. The SDK normalizes this automatically:

| Provider | File Path | Base64 | URL |
|----------|-----------|--------|-----|
| **OpenAI** | Converted to base64 | ✓ Native | ✓ Native |
| **Anthropic** | Converted to base64 | ✓ Native | Downloaded → base64 |
| **Gemini** | Converted to base64 | ✓ Native | Downloaded → base64 |
| **Ollama** | Converted to base64 | ✓ Native | Downloaded → base64 |

### Notes

- **File paths** are always read and converted to base64 before sending
- **URLs** are passed directly to OpenAI, but downloaded and converted for other providers
- **Detail level** controls image resolution/token usage (OpenAI-specific, ignored by others)

## TypeScript Types

```typescript
import { ImageFilePart, ImageDataPart, ImageUrlPart } from 'toolpack-sdk';

const filePart: ImageFilePart = {
    type: 'image_file',
    image_file: { path: '/path/to/image.png', detail: 'high' }
};

const dataPart: ImageDataPart = {
    type: 'image_data',
    image_data: { data: 'base64...', mimeType: 'image/png', detail: 'auto' }
};

const urlPart: ImageUrlPart = {
    type: 'image_url',
    image_url: { url: 'https://example.com/image.png', detail: 'low' }
};
```

## Streaming with Images

Multimodal requests work with streaming too:

```typescript
const stream = toolpack.stream({
    messages: [{
        role: 'user',
        content: [
            { type: 'text', text: 'Describe this image in detail' },
            { type: 'image_file', image_file: { path: './photo.jpg' } }
        ]
    }],
    model: 'gpt-4o',
});

for await (const chunk of stream) {
    process.stdout.write(chunk.delta);
}
```

## Vision-Capable Models

Not all models support vision. Check the model's capabilities:

```typescript
const providers = await toolpack.listProviders();
for (const provider of providers) {
    for (const model of provider.models) {
        if (model.capabilities.vision) {
            console.log(`${model.id} supports vision`);
        }
    }
}
```

### Common Vision Models

| Provider | Models |
|----------|--------|
| **OpenAI** | `gpt-4o`, `gpt-4o-mini`, `gpt-4-turbo`, `gpt-4-vision-preview` |
| **Anthropic** | `claude-sonnet-4-*`, `claude-3-5-sonnet-*`, `claude-3-opus-*`, `claude-3-haiku-*` |
| **Gemini** | `gemini-1.5-pro`, `gemini-1.5-flash`, `gemini-2.0-flash` |
| **Ollama** | `llava`, `llava-llama3`, `bakllava`, and other vision models |
