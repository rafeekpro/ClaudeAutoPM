# Getting Started

Welcome to ClaudeAutoPM! This guide will help you get up and running with the automated project management system in just a few minutes.

## Prerequisites

Before installing ClaudeAutoPM, ensure you have:

- **Node.js** version 18.0 or higher
- **npm** version 8.0 or higher
- **Git** installed and configured
- A GitHub or Azure DevOps account with appropriate permissions

## Installation

### Global Installation (Recommended)

Install ClaudeAutoPM globally to use it across all your projects:

```bash
npm install -g claude-autopm
```

Verify the installation:

```bash
autopm --version
```

### Local Installation

For project-specific installation:

```bash
npm install claude-autopm --save-dev
```

Then use with npx:

```bash
npx autopm [command]
```

## Quick Setup with Interactive Guide

The easiest way to get started is using our interactive setup guide:

```bash
autopm guide
```

This will walk you through:

1. **System Requirements Check** - Verifies all dependencies are installed
2. **Provider Configuration** - Sets up GitHub or Azure DevOps integration
3. **First Task Creation** - Creates your first issue/work item
4. **Command Overview** - Shows essential commands for your workflow

## Manual Setup

If you prefer manual setup, follow these steps:

### Step 1: Initialize Your Project

Navigate to your project directory and run:

```bash
cd your-project/
autopm install
```

You'll be prompted to choose a configuration preset:

1. **Minimal** - Basic setup without Docker/Kubernetes
2. **Docker-only** - Includes Docker containerization
3. **Full DevOps** - Complete setup with Docker and Kubernetes
4. **Performance** - Optimized for high-performance workflows
5. **Custom** - Create your own configuration

### Step 2: Configure Your Provider

#### For GitHub

Set up your GitHub integration:

```bash
export GITHUB_TOKEN="your_github_token"
export GITHUB_REPO="owner/repository"
```

Or add to `.env` file:

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_REPO=username/repo-name
```

#### For Azure DevOps

Configure Azure DevOps:

```bash
export AZURE_DEVOPS_TOKEN="your_pat_token"
export AZURE_DEVOPS_ORG="your_organization"
export AZURE_DEVOPS_PROJECT="your_project"
```

Or add to `.env` file:

```bash
AZURE_DEVOPS_TOKEN=xxxxxxxxxxxxxxxxxx
AZURE_DEVOPS_ORG=myorganization
AZURE_DEVOPS_PROJECT=myproject
```

### Step 3: Initialize PM System

In Claude Code, initialize the project management system:

```bash
/pm:init
```

This creates the necessary project structure and configuration files.

### Step 4: Create Your CLAUDE.md

Generate your project instructions file:

```bash
/init include rules from .claude/CLAUDE.md
```

This file helps AI agents understand your project context and requirements.

## Your First Feature

Let's ship your first feature using ClaudeAutoPM:

### 1. Create a PRD

Start with a Product Requirements Document:

```bash
/pm:prd-new authentication-system
```

This launches an interactive brainstorming session to define your feature.

### 2. Parse PRD to Epic

Convert your PRD into a technical epic with tasks:

```bash
/pm:prd-parse authentication-system
```

### 3. Start Development

Begin working on the epic:

```bash
/pm:epic-start authentication-system
```

### 4. Monitor Progress

Check the status of your work:

```bash
/pm:status
```

## Next Steps

Now that you have ClaudeAutoPM set up:

- 📖 Read about [Core Concepts](/guide/project-management)
- 🤖 Learn about [AI Agents](/guide/ai-agents)
- 📝 Explore [Command Reference](/commands/overview)
- 🚀 Check out [Advanced Features](/guide/advanced)

## Getting Help

If you run into issues:

- Run `autopm help` for command documentation
- Check our [Troubleshooting Guide](/guide/troubleshooting)
- Visit [GitHub Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
- Join our [Community Discussions](https://github.com/rafeekpro/ClaudeAutoPM/discussions)

## Video Tutorials

Coming soon! We're working on video tutorials for:

- Complete setup walkthrough
- Creating and managing epics
- Working with AI agents
- Advanced workflow automation

Stay tuned by following [@rafeekpro](https://x.com/rafeekpro) for updates!