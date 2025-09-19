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
      { text: 'Architecture', link: '/architecture/overview' },
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
          text: 'Introduction',
          collapsed: false,
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Interactive Setup', link: '/guide/interactive-setup' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Installation Options', link: '/guide/installation-options' }
          ]
        },
        {
          text: 'Core Concepts',
          collapsed: false,
          items: [
            { text: 'Project Management', link: '/guide/project-management' },
            { text: 'AI Agents', link: '/guide/ai-agents' },
            { text: 'Execution Strategies', link: '/guide/execution-strategies' },
            { text: 'Context Management', link: '/guide/context-management' }
          ]
        },
        {
          text: 'Providers',
          collapsed: false,
          items: [
            { text: 'GitHub Integration', link: '/guide/github' },
            { text: 'Azure DevOps', link: '/guide/azure-devops' },
            { text: 'Provider Router', link: '/guide/provider-router' }
          ]
        },
        {
          text: 'Advanced',
          collapsed: false,
          items: [
            { text: 'Custom Agents', link: '/guide/custom-agents' },
            { text: 'Hooks & Automation', link: '/guide/hooks' },
            { text: 'Performance Tuning', link: '/guide/performance' },
            { text: 'Troubleshooting', link: '/guide/troubleshooting' }
          ]
        }
      ],
      '/commands/': [
        {
          text: 'Command Reference',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/commands/overview' },
            { text: 'CLI Usage', link: '/commands/cli-usage' }
          ]
        },
        {
          text: 'Core Commands',
          collapsed: false,
          items: [
            { text: 'autopm guide', link: '/commands/guide' },
            { text: 'autopm install', link: '/commands/install' },
            { text: 'autopm help', link: '/commands/help' }
          ]
        },
        {
          text: 'Project Management',
          collapsed: false,
          items: [
            { text: 'pm:init', link: '/commands/pm-init' },
            { text: 'pm:status', link: '/commands/pm-status' },
            { text: 'pm:sync', link: '/commands/pm-sync' },
            { text: 'Epic Commands', link: '/commands/pm-epic' },
            { text: 'Issue Commands', link: '/commands/pm-issue' },
            { text: 'PRD Commands', link: '/commands/pm-prd' }
          ]
        },
        {
          text: 'Azure DevOps',
          collapsed: true,
          items: [
            { text: 'azure:init', link: '/commands/azure-init' },
            { text: 'Task Commands', link: '/commands/azure-task' },
            { text: 'User Story Commands', link: '/commands/azure-us' },
            { text: 'Feature Commands', link: '/commands/azure-feature' }
          ]
        },
        {
          text: 'Development',
          collapsed: true,
          items: [
            { text: 'Python Scaffolding', link: '/commands/python-scaffold' },
            { text: 'React Scaffolding', link: '/commands/react-scaffold' },
            { text: 'API Documentation', link: '/commands/api-docs' },
            { text: 'Testing Commands', link: '/commands/testing' }
          ]
        }
      ],
      '/architecture/': [
        {
          text: 'System Architecture',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/architecture/overview' },
            { text: 'Project Structure', link: '/architecture/structure' },
            { text: 'Core Components', link: '/architecture/components' }
          ]
        },
        {
          text: 'Agent System',
          collapsed: false,
          items: [
            { text: 'Agent Architecture', link: '/architecture/agent-system' },
            { text: 'Agent Registry', link: '/architecture/agent-registry' },
            { text: 'Execution Strategies', link: '/architecture/execution-strategies' },
            { text: 'Agent Communication', link: '/architecture/agent-communication' }
          ]
        },
        {
          text: 'Technical Details',
          collapsed: false,
          items: [
            { text: 'Provider System', link: '/architecture/providers' },
            { text: 'Command Router', link: '/architecture/command-router' },
            { text: 'Configuration', link: '/architecture/configuration' },
            { text: 'Security', link: '/architecture/security' }
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