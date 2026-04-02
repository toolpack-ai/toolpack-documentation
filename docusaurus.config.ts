import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Toolpack SDK – Build AI apps with OpenAI, Anthropic & more',
  tagline: 'Build AI apps with OpenAI, Anthropic, Gemini, and Ollama using one unified TypeScript SDK',
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
    // JSON-LD structured data for rich search results
    {
      tagName: 'script',
      attributes: { type: 'application/ld+json' },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareSourceCode',
        name: 'Toolpack SDK',
        description: 'A unified TypeScript SDK for building AI-powered applications with OpenAI, Anthropic, Gemini, and Ollama. 77 built-in tools, multi-provider support, and zero vendor lock-in.',
        url: 'https://toolpacksdk.com',
        codeRepository: 'https://github.com/toolpack-ai/toolpack-sdk',
        programmingLanguage: 'TypeScript',
        runtimePlatform: 'Node.js',
        license: 'https://github.com/toolpack-ai/toolpack-sdk/blob/main/LICENSE',
        operatingSystem: 'Cross-platform',
        applicationCategory: 'DeveloperApplication',
        keywords: 'AI SDK, TypeScript, OpenAI, Anthropic, Gemini, Ollama, LLM, tool calling, multi-provider, AI agent',
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
          // showLastUpdateTime: true, // Enable after first git commit
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
          lastmod: 'datetime', // Use build time instead of git date
          changefreq: 'weekly',
          priority: 0.5,
          filename: 'sitemap.xml',
          ignorePatterns: ['/tags/**'],
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
        alt: 'Toolpack SDK - Unified TypeScript AI SDK',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Docs',
        },
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

export default config;
