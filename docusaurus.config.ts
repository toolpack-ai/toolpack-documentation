import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

async function fetchLatestNpmVersion(): Promise<string> {
  try {
    const res = await fetch('https://registry.npmjs.org/toolpack-sdk/latest');
    const data = await res.json() as { version: string };
    return data.version;
  } catch {
    return '';
  }
}

export default async function createConfig(): Promise<Config> {
  const version = await fetchLatestNpmVersion();

  return {
    title: 'Toolpack SDK – TypeScript SDK for Production AI Agents',
    tagline: '100+ built-in tools. 8 channel integrations. Persistent agent cognition. Production-ready TypeScript.',
    favicon: 'img/favicon.ico',

    future: {
      v4: true,
    },

    url: 'https://toolpacksdk.com',
    baseUrl: '/',
    trailingSlash: false,

    organizationName: 'toolpack-ai',
    projectName: 'toolpack-sdk',

    onBrokenLinks: 'throw',

    i18n: {
      defaultLocale: 'en',
      locales: ['en'],
    },

    headTags: [
      // Google Search Console verification — replace XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
      // with your actual verification code from Search Console → Settings → Ownership verification → HTML tag
      {
        tagName: 'meta',
        attributes: { name: 'google-site-verification', content: 'google-site-verification=05FzJotPxP4xD3pRB8DOVS4HubjNUPDco3fwvOVTcqU' },
      },
      // JSON-LD structured data for rich search results
      {
        tagName: 'script',
        attributes: { type: 'application/ld+json' },
        innerHTML: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareSourceCode',
          name: 'Toolpack SDK',
          description: 'The TypeScript SDK for building production AI agents. 100+ built-in tools, 8 channel integrations (Slack, Discord, Telegram, SMS, Email, Webhook, Scheduled, MCP), AgentMind persistent cognitive layer, Knowledge/RAG, and multi-provider support (OpenAI, Anthropic, Gemini, Ollama).',
          url: 'https://toolpacksdk.com',
          codeRepository: 'https://github.com/toolpack-ai/toolpack-sdk',
          programmingLanguage: 'TypeScript',
          runtimePlatform: 'Node.js',
          license: 'https://github.com/toolpack-ai/toolpack-sdk/blob/main/LICENSE',
          operatingSystem: 'Cross-platform',
          applicationCategory: 'DeveloperApplication',
          keywords: 'AI agent, TypeScript AI SDK, production AI agents, AI tools, Slack bot, AI channels, AgentMind, RAG, knowledge base, OpenAI, Anthropic, Gemini, Ollama, LLM, multi-provider, tool calling',
        }),
      },
      // Preconnect to GitHub for faster external link loading
      {
        tagName: 'link',
        attributes: { rel: 'preconnect', href: 'https://github.com' },
      },
      // DNS prefetch for npm
      {
        tagName: 'link',
        attributes: { rel: 'dns-prefetch', href: 'https://www.npmjs.com' },
      },
    ],

    presets: [
      [
        'classic',
        {
          docs: {
            sidebarPath: './sidebars.ts',
            routeBasePath: '/',
            editUrl: 'https://github.com/toolpack-ai/toolpack-sdk/tree/main/documentation/',
            showLastUpdateTime: true,
          },
          blog: {
            showReadingTime: true,
            routeBasePath: '/blog',
            postsPerPage: 10,
            blogSidebarCount: 'ALL',
            blogSidebarTitle: 'All posts',
            authorsMapPath: 'authors.yml',
            onInlineAuthors: 'ignore',
            onUntruncatedBlogPosts: 'warn',
            feedOptions: {
              type: ['rss', 'atom'],
              title: 'Toolpack SDK Blog',
              description: 'Product updates, tutorials, and best practices for Toolpack SDK.',
            },
            editUrl: 'https://github.com/toolpack-ai/toolpack-sdk/tree/main/documentation/',
          },
          theme: {
            customCss: './src/css/custom.css',
          },
          sitemap: {
            lastmod: 'date',
            changefreq: null,  // Omit changefreq — Google ignores it; cleaner sitemap
            priority: null,    // Managed per-URL via createSitemapItems below
            filename: 'sitemap.xml',
            ignorePatterns: ['/blog/tags/**'],  // Exclude low-value tag index pages
            createSitemapItems: async (params) => {
              const { defaultCreateSitemapItems, ...rest } = params;
              const items = await defaultCreateSitemapItems(rest);
              return items.map((item) => {
                const url = item.url;
                // Homepage
                if (url === 'https://toolpacksdk.com/' || url === 'https://toolpacksdk.com') {
                  return { ...item, priority: 1.0 };
                }
                // Getting Started — highest-value entry pages
                if (url.includes('/getting-started/')) {
                  return { ...item, priority: 0.9 };
                }
                // Guides, Agents, Tools docs — core content
                if (
                  url.includes('/guides/') ||
                  url.includes('/agents/') ||
                  url.includes('/tools/')
                ) {
                  return { ...item, priority: 0.8 };
                }
                // Blog posts (not listing/archive pages)
                if (url.includes('/blog/') && !url.match(/\/blog\/?$/) && !url.includes('/page/') && !url.includes('/archive') && !url.includes('/authors')) {
                  return { ...item, priority: 0.7 };
                }
                // Reference, migration, blog listing
                if (url.includes('/reference/') || url.includes('/migration/')) {
                  return { ...item, priority: 0.6 };
                }
                // Everything else (blog archive, authors, etc.)
                return { ...item, priority: 0.5 };
              });
            },
          },
          gtag: {
            trackingID: 'G-0E5T0WC6M3',
            anonymizeIP: true,
          },
        } satisfies Preset.Options,
      ],
    ],

    themeConfig: {
      image: 'img/og-image.png',
      colorMode: {
        respectPrefersColorScheme: true,
      },
      metadata: [
        // Theme color
        { name: 'theme-color', content: '#09090b', media: '(prefers-color-scheme: dark)' },
        { name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },

        // Primary meta tags (non-OG — Docusaurus generates og:* and twitter:* per page from frontmatter)
        { name: 'keywords', content: 'Toolpack SDK, AI SDK, TypeScript AI, OpenAI SDK, Anthropic SDK, Gemini SDK, Ollama SDK, LLM framework, AI tools, tool calling, multi-provider AI, AI agent framework, Node.js AI' },
        { name: 'author', content: 'Toolpack AI' },
        { name: 'robots', content: 'index, follow' },

        // Open Graph — only static tags that Docusaurus doesn't generate per-page
        { property: 'og:site_name', content: 'Toolpack SDK' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:locale', content: 'en_US' },

        // Twitter Card type (Docusaurus generates the rest per page)
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      navbar: {
        title: 'TOOLPACK SDK',
        logo: {
          alt: 'Toolpack SDK - TypeScript SDK for Production AI Agents',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Docs',
          },
          ...(version ? [{
            type: 'html' as const,
            position: 'left' as const,
            value: `<a href="/releases/v${version}" class="navbar-version">v${version}</a>`,
          }] : []),
          {
            to: '/blog',
            label: 'Blog',
            position: 'left',
          },
          {
            href: 'https://github.com/toolpack-ai/toolpack-sdk',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://www.npmjs.com/package/toolpack-sdk',
            label: 'npm',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Documentation',
            items: [
              {
                label: 'Getting Started',
                to: '/getting-started/installation',
              },
              {
                label: 'Guides',
                to: '/guides/providers',
              },
              {
                label: 'Tools',
                to: '/tools/overview',
              },
              {
                label: 'API Reference',
                to: '/reference/api',
              },
              {
                label: 'Blog',
                to: '/blog',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/toolpack-ai/toolpack-sdk',
              },
              {
                label: 'npm',
                href: 'https://www.npmjs.com/package/toolpack-sdk',
              },
              {
                label: 'Issues',
                href: 'https://github.com/toolpack-ai/toolpack-sdk/issues',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Toolpack SDK.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ['bash', 'json'],
      },
    } satisfies Preset.ThemeConfig,
  };
}
