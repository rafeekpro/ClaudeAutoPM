# ClaudeAutoPM

[![NPM Version](https://img.shields.io/npm/v/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![NPM Downloads](https://img.shields.io/npm/dm/claude-autopm)](https://www.npmjs.com/package/claude-autopm)
[![MIT License](https://img.shields.io/badge/License-MIT-28a745)](https://github.com/rafeekpro/ClaudeAutoPM/blob/main/LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/rafeekpro/ClaudeAutoPM?style=social)](https://github.com/rafeekpro/ClaudeAutoPM)
&nbsp;
[![Follow on 𝕏](https://img.shields.io/badge/𝕏-@rafeekpro-1c9bf0)](http://x.com/intent/follow?screen_name=rafeekpro)

**Automated project management system to ship ~~faster~~ _better_ using spec-driven development and AI agents running in parallel**

Stop losing context. Stop blocking on tasks. Stop shipping bugs. ClaudeAutoPM transforms PRDs into epics, epics into issues, and issues into production code – with full traceability at every step.

## 🚀 Get Started in 5 Minutes

### 1. Install (30 seconds)

```bash
npm install -g claude-autopm
```

### 2. Setup Your Project (2 minutes)

```bash
# Navigate to your project
cd your-project/

# Install ClaudeAutoPM framework
autopm install

# Choose configuration:
# 1) Minimal - Traditional development (no Docker/K8s)
# 2) Docker-only - Container-first development
# 3) Full DevOps - Enterprise with Docker + K8s
```

### 3. Initialize PM System (1 minute)

```bash
# In Claude Code, run:
/pm:init

# Create your CLAUDE.md with repository info:
/init include rules from .claude/CLAUDE.md
```

### 4. Ship Your First Feature (90 seconds)

```bash
# Create a PRD through guided brainstorming
/pm:prd-new user-auth

# Transform PRD into technical epic with tasks
/pm:prd-parse user-auth

# Push to GitHub and start building
/pm:epic-oneshot user-auth
/pm:issue-start 1234
```

**That's it!** You're now using structured, spec-driven development with AI agents.

## 🎯 Core Workflow: Crawl → Walk → Run

### Crawl: Basic Commands
```bash
/pm:prd-new feature        # Create product requirements
/pm:epic-oneshot feature   # Plan, decompose, and sync to GitHub
/pm:issue-start 1234       # Start working on a task
/pm:next                   # Get next priority task
```

### Walk: Team Collaboration
```bash
/pm:status                 # Project dashboard
/pm:standup               # Daily standup report
/pm:issue-sync 1234       # Push progress to GitHub
/pm:blocked               # Show blocked tasks
```

### Run: Advanced Features
- **50+ Specialized AI Agents** - Python, React, K8s, AWS, and more
- **Parallel Execution** - Multiple agents working simultaneously
- **Cross-Platform** - GitHub, Azure DevOps, GitLab (coming soon)
- **MCP Integration** - Context management and browser automation

## 📚 Full Documentation

For comprehensive guides, advanced features, and detailed configuration:

**👉 [Visit the ClaudeAutoPM Wiki](https://github.com/rafeekpro/ClaudeAutoPM/wiki)**

### Popular Topics
- [Configuration Options](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Configuration-Options)
- [Agent Registry (50+ agents)](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Agent-Registry)
- [Command Reference](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Command-Reference)
- [Docker & Kubernetes](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Docker-Kubernetes)
- [Azure DevOps Integration](https://github.com/rafeekpro/ClaudeAutoPM/wiki/Azure-DevOps)

## 💡 What Makes This Different?

| Traditional Development | ClaudeAutoPM System |
|------------------------|----------------------|
| Context lost between sessions | **Persistent context** across all work |
| Serial task execution | **Parallel agents** on independent tasks |
| "Vibe coding" from memory | **Spec-driven** with full traceability |
| Progress hidden in branches | **Transparent audit trail** in GitHub |
| Manual task coordination | **Intelligent prioritization** with `/pm:next` |

## 🔑 Key Principles

1. **No Vibe Coding** - Every line traces back to a specification
2. **GitHub as Database** - Issues are the single source of truth
3. **Parallel by Default** - Multiple agents, maximum velocity
4. **Context Preservation** - Never lose project state again

## 🛠️ System Requirements

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Git** (system installation)
- **Claude Code** or compatible AI assistant

## 🌟 Support This Project

If ClaudeAutoPM helps your team ship better:

- ⭐ **[Star this repository](https://github.com/rafeekpro/ClaudeAutoPM)**
- 📦 **[Try on npm](https://www.npmjs.com/package/claude-autopm)**
- 🐦 **[Follow @rafeekpro on X](https://x.com/rafeekpro)**

---

**Built by developers who ship, for developers who ship.**

> Inspired by [CCPM](https://github.com/automazeio/ccpm) - Building upon the foundation of AI-powered project management.