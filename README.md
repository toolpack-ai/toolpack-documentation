# Toolpack SDK Documentation

Official documentation for [Toolpack SDK](https://github.com/toolpack-ai/toolpack-sdk) - a unified TypeScript SDK for building AI-powered applications with OpenAI, Anthropic, Gemini, and Ollama.

Built with [Docusaurus](https://docusaurus.io/).

## Development

### Install dependencies

```bash
npm install
```

### Start dev server

```bash
npm start
```

Runs at `http://localhost:3000`. Changes hot-reload automatically.

### Build for production

```bash
npm run build
```

Generates static files in the `build/` directory.

### Preview production build

```bash
npm run serve
```

## Deployment

Deploy the `build/` directory to any static hosting service:

- **Firebase Hosting** - `firebase deploy`
- **Vercel** - `vercel --prod`
- **Netlify** - drag & drop `build/` folder
- **GitHub Pages** - use `npm run deploy`

## Project Structure

```
docs/
├── intro.md              # Landing page
├── getting-started/      # Installation & quick start
├── guides/               # Providers, modes, workflows, CLI
├── tools/                # 77 built-in tools documentation
└── reference/            # API reference & configuration
```

## SEO

The documentation is optimized for search engines:

- Meta descriptions and keywords on all pages
- JSON-LD structured data
- Auto-generated sitemap (`sitemap.xml`)
- robots.txt configured
- Open Graph and Twitter Card meta tags
