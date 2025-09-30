import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'ClaudeAutoPM',
  description: 'Automated project management system for spec-driven development',
  base: '/ClaudeAutoPM/',

  head: [
    ['link', { rel: 'icon', href: '/ClaudeAutoPM/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#5f67ee' }],
    ['meta', { name: 'og:type', content: 'website' }],
    ['meta', { name: 'og:locale', content: 'en' }],
    ['meta', { name: 'og:site_name', content: 'ClaudeAutoPM' }]
  ],

  ignoreDeadLinks: true,

  themeConfig: {
    // Navigation
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Commands', link: '/commands/overview' },
      { text: 'Agents', link: '/agents/registry' },
      { text: 'Development', link: '/development/docker-first' },
      { text: 'Reference', link: '/reference/configuration' },
      {
        text: 'Resources',
        items: [
          { text: 'GitHub', link: 'https://github.com/rafeekpro/ClaudeAutoPM' },
          { text: 'NPM', link: 'https://www.npmjs.com/package/claude-autopm' },
          { text: 'Changelog', link: 'https://github.com/rafeekpro/ClaudeAutoPM/blob/main/CHANGELOG.md' }
        ]
      }
    ],

    // Sidebar
    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/guide/getting-started' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Interactive Setup', link: '/guide/interactive-setup' },
            { text: 'Installation Guide', link: '/guide/installation' },
            { text: 'First Project', link: '/guide/first-project' }
          ]
        }
      ],
      '/commands/': [
        {
          text: 'Command Reference',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/commands/overview' },
            { text: 'CLI Reference', link: '/commands/cli-reference' },
            { text: 'PM Commands', link: '/commands/pm-commands' },
            { text: 'Azure DevOps', link: '/commands/azure-devops' }
          ]
        }
      ],
      '/agents/': [
        {
          text: 'Agent System',
          collapsed: false,
          items: [
            { text: 'Agent Registry', link: '/agents/registry' },
            { text: 'Selection Guide', link: '/agents/selection-guide' },
            { text: 'Custom Agents', link: '/agents/custom-agents' }
          ]
        }
      ],
      '/development/': [
        {
          text: 'Development Guide',
          collapsed: false,
          items: [
            { text: 'Docker First Development', link: '/development/docker-first' },
            { text: 'Testing Strategies', link: '/development/testing' },
            { text: 'Quality Assurance', link: '/development/quality' },
            { text: 'GitHub Actions', link: '/development/github-actions' }
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Configuration',
          collapsed: false,
          items: [
            { text: 'Configuration Options', link: '/reference/configuration' },
            { text: 'Environment Variables', link: '/reference/environment-vars' },
            { text: 'Feature Toggles', link: '/reference/feature-toggles' }
          ]
        },
        {
          text: 'Templates & Guides',
          collapsed: false,
          items: [
            { text: 'CLAUDE Templates', link: '/reference/claude-templates' },
            { text: 'Troubleshooting', link: '/reference/troubleshooting' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'System Architecture',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/architecture/overview' }
          ]
        }
      ]
    },

    // Search
    search: {
      provider: 'local',
      options: {
        detailedView: true,
        placeholder: 'Search documentation...',
        _render(src, env, md) {
          const html = md.render(src, env)
          if (env.frontmatter?.search === false) return ''
          return html
        }
      }
    },

    // Social Links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/rafeekpro/ClaudeAutoPM' },
      { icon: 'x', link: 'https://x.com/rafeekpro' }
    ],

    // Edit Link
    editLink: {
      pattern: 'https://github.com/rafeekpro/ClaudeAutoPM/edit/main/docs-site/docs/:path',
      text: 'Edit this page on GitHub'
    },

    // Footer
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present ClaudeAutoPM Contributors'
    },

    // Page Data
    lastUpdated: {
      text: 'Updated at',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium'
      }
    },

    // Outline
    outline: {
      level: [2, 3],
      label: 'On this page'
    },

    // External Link Icons
    externalLinkIcon: true
  }
})