---
# https://vitepress.dev/reference/default-theme-home-page
layout: home

hero:
  name: "ClaudeAutoPM"
  text: "Automated Project Management"
  tagline: Ship faster and better with spec-driven development and AI agents
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: Interactive Setup
      link: /guide/interactive-setup
    - theme: alt
      text: View on GitHub
      link: https://github.com/rafeekpro/ClaudeAutoPM

features:
  - icon: 🚀
    title: Quick Setup
    details: Get started in 5 minutes with our interactive guide. No extensive documentation reading required.
  - icon: 🤖
    title: AI-Powered Agents
    details: 96 professional CLI commands with parallel AI agent execution for maximum efficiency.
  - icon: 🔗
    title: Multi-Provider Support
    details: Seamless integration with GitHub Issues and Azure DevOps for complete project management.
  - icon: 📊
    title: Spec-Driven Development
    details: Transform PRDs into epics, epics into issues, and issues into production code with full traceability.
  - icon: ⚡
    title: Smart Context Management
    details: Never lose track of your work with intelligent context preservation and optimization.
  - icon: 🔄
    title: Automated Workflows
    details: From requirements to deployment - automate your entire development pipeline.

---

<style>
.content-container {
  max-width: 1152px;
  margin: 0 auto;
  padding: 48px 24px 96px;
}

.content-container h2 {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 2em;
  font-weight: 600;
}

.content-container h2:first-child {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.content-container .language-bash {
  margin: 24px 0;
}

.content-container p {
  font-size: 1.1em;
  line-height: 1.7;
  margin: 16px 0;
}

.content-container ul {
  padding-left: 1.5rem;
  margin: 24px 0;
}

.content-container li {
  margin: 12px 0;
  line-height: 1.7;
  font-size: 1.05em;
}

.content-container strong {
  font-weight: 600;
  color: var(--vp-c-brand);
}
</style>

<div class="content-container">

## Quick Start

```bash
# Install globally
npm install -g claude-autopm

# Run the interactive setup guide
autopm guide
```

## Why ClaudeAutoPM?

**Stop losing context. Stop blocking on tasks. Stop shipping bugs.**

ClaudeAutoPM transforms your development workflow by:

- **Automating project management** - From PRD to production with full traceability
- **Parallel agent execution** - Multiple specialized AI agents working simultaneously
- **Provider flexibility** - Works with your existing GitHub or Azure DevOps setup
- **Context optimization** - Intelligent management prevents information loss

</div>
