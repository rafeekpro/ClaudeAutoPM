import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ClaudeAutoPM',
  description: 'AI-Powered Project Management Framework for Claude Code',

  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }]
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/getting-started/' },
      { text: 'User Guide', link: '/user-guide/' },
      { text: 'Commands', link: '/commands/overview' },
      { text: 'Agents', link: '/agents/registry' },
      { text: 'Developer', link: '/developer-guide/' }
    ],

    sidebar: {
      '/getting-started/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/getting-started/' },
            { text: 'Installation', link: '/getting-started/installation' },
            { text: 'First Project', link: '/getting-started/first-project' },
            { text: 'Configuration', link: '/getting-started/configuration' }
          ]
        }
      ],

      '/user-guide/': [
        {
          text: 'User Guide',
          items: [
            { text: 'Overview', link: '/user-guide/' },
            { text: 'PM Workflow', link: '/user-guide/pm-workflow' },
            { text: 'Commands Overview', link: '/user-guide/commands-overview' },
            { text: 'Agents Overview', link: '/user-guide/agents-overview' },
            { text: 'MCP Servers', link: '/user-guide/mcp-servers' },
            { text: 'Best Practices', link: '/user-guide/best-practices' }
          ]
        }
      ],

      '/commands/': [
        {
          text: 'Commands',
          items: [
            { text: 'Overview', link: '/commands/overview' },
            { text: 'PM Commands', link: '/commands/pm-commands' },
            { text: 'CLI Reference', link: '/commands/cli-reference' },
            { text: 'Azure DevOps', link: '/commands/azure-devops' }
          ]
        }
      ],

      '/agents/': [
        {
          text: 'Agents',
          items: [
            { text: 'Agent Registry', link: '/agents/registry' },
            { text: 'Selection Guide', link: '/agents/selection-guide' },
            { text: 'Custom Agents', link: '/agents/custom-agents' }
          ]
        }
      ],

      '/developer-guide/': [
        {
          text: 'Developer Guide',
          items: [
            { text: 'Overview', link: '/developer-guide/' },
            { text: 'Architecture', link: '/developer-guide/architecture' },
            { text: 'Plugin Development', link: '/developer-guide/plugin-development' },
            { text: 'Agent Development', link: '/developer-guide/agent-development' },
            { text: 'Command Development', link: '/developer-guide/command-development' },
            { text: 'Testing', link: '/developer-guide/testing' },
            { text: 'Contributing', link: '/developer-guide/contributing' }
          ]
        }
      ],

      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Configuration', link: '/reference/configuration' },
            { text: 'Environment Variables', link: '/reference/environment-vars' },
            { text: 'Feature Toggles', link: '/reference/feature-toggles' },
            { text: 'Claude Templates', link: '/reference/claude-templates' },
            { text: 'Troubleshooting', link: '/reference/troubleshooting' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/rafeekpro/ClaudeAutoPM' }
    ],

    search: {
      provider: 'local'
    },

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2024-present ClaudeAutoPM Team'
    },

    editLink: {
      pattern: 'https://github.com/rafeekpro/ClaudeAutoPM/edit/main/docs-site/docs/:path',
      text: 'Edit this page on GitHub'
    }
  }
})
