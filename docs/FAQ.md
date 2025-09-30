# ClaudeAutoPM - Frequently Asked Questions

## General Questions

### What is ClaudeAutoPM?

ClaudeAutoPM is an automated project management framework that transforms PRDs (Product Requirements Documents) into executable tasks using AI agents. It provides structured, spec-driven development with full traceability from requirements to production code.

### Do I need Claude Code to use ClaudeAutoPM?

No. ClaudeAutoPM works in two modes:
- **Standalone CLI**: Use `autopm` commands directly in your terminal
- **AI-Enhanced**: Use `/pm:` slash commands in Claude Code for AI-powered features

The CLI provides deterministic operations (templates, scaffolding), while Claude Code adds AI capabilities (analysis, brainstorming, decomposition).

### What's the difference between `autopm` and `/pm:` commands?

- **`autopm pm:command`** - CLI mode, works anywhere, uses templates
- **`/pm:command`** - Claude Code mode, AI-powered, intelligent

Both access the same PM system, just different interfaces.

### Which providers are supported?

- ✅ **GitHub Issues** - Full API integration
- ✅ **Azure DevOps** - Complete 3-level hierarchy (Epic → User Story → Task)
- ⏳ **GitLab** - Coming soon
- ✅ **Local only** - No external sync required

## Installation & Setup

### What are the system requirements?

**Minimum:**
- Node.js >= 16.0.0
- npm >= 8.0.0
- Git

**Optional (based on preset):**
- Docker (for Docker-only, Full DevOps, Performance presets)
- kubectl (for Full DevOps, Performance presets)

### Which installation preset should I choose?

- **Minimal** - Learning, small projects, no Docker
- **Docker-only** - Local development with Docker
- **Full DevOps** 🎯 - Production projects (RECOMMENDED)
- **Performance** - Large projects, power users

The installer auto-detects Docker/kubectl and only shows compatible options.

### Can I change presets later?

Yes! Run `autopm install --force` and select a different preset. Your configuration and project data are preserved.

### How do I update ClaudeAutoPM?

```bash
autopm update
```

This:
- Detects your current version (new in v1.12.3!)
- Creates automatic backup
- Preserves configuration
- Updates only framework files

## Configuration

### Where are configuration files stored?

- `.claude/config.json` - Main configuration
- `.claude/teams.json` - Agent team settings
- `.claude/.env` - Environment variables (tokens)
- `.claude/mcp-servers.json` - MCP server configuration

### How do I get a GitHub token?

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo`, `workflow`
4. Copy token: `ghp_...`
5. Set: `export GITHUB_TOKEN=ghp_...`

### How do I get an Azure DevOps PAT?

1. Go to Azure DevOps → User Settings → Personal access tokens
2. New Token
3. Select: Work Items (Read, Write, & Manage), Code (Read & Write)
4. Copy token
5. Set: `export AZURE_DEVOPS_PAT=your_token`

### Can I use both GitHub and Azure DevOps?

Yes! Configure both and switch between them:

```bash
autopm config switch github
autopm config switch azure
```

## Usage

### What is a PRD?

A Product Requirements Document that describes what to build and why. ClaudeAutoPM uses PRDs as the starting point for all feature development.

### What is an epic?

A large body of work broken down into smaller tasks. In ClaudeAutoPM, epics are created from PRDs and contain all tasks needed to complete a feature.

### How do I create my first feature?

```bash
# Quick way
/pm:epic-oneshot feature-name

# Step by step
/pm:prd-new feature-name
/pm:prd-parse feature-name
/pm:epic-decompose feature-name
/pm:epic-sync feature-name
```

### What does `autopm update` actually update?

**Updates:**
- Framework files in `.claude/`
- Agent definitions
- PM commands
- Rules and strategies

**Preserves:**
- Your config.json
- Environment variables
- Teams configuration
- All epics and PRDs
- Project data

### How do agent teams work?

Teams are collections of specialized AI agents:

- **base** - Core agents for all tasks
- **devops** - Docker, Kubernetes, CI/CD
- **frontend** - React, JavaScript, UX
- **python_backend** - FastAPI, Flask, databases
- **fullstack** - Frontend + Backend combined

Load with: `autopm team load devops`

### Can teams switch automatically?

Yes! Enable git hooks:

```bash
bash scripts/setup-githooks.sh
```

Then use branch naming:
```bash
git checkout -b feature/devops/ci-pipeline    # Loads devops team
git checkout -b fix/frontend/button-css       # Loads frontend team
```

## Troubleshooting

### `autopm: command not found`

**Fix npm PATH:**
```bash
export PATH="$(npm config get prefix)/bin:$PATH"
```

Add to `~/.bashrc` or `~/.zshrc` to make permanent.

### Installation fails with permission errors

**Linux/macOS:**
```bash
sudo chown -R $USER /usr/local/lib/node_modules
sudo chown -R $USER /usr/local/bin
```

**Or install with nvm** (recommended):
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
npm install -g claude-autopm
```

### Provider authentication fails

**Check token:**
```bash
echo $GITHUB_TOKEN
echo $AZURE_DEVOPS_PAT
```

**Validate:**
```bash
autopm config validate
```

**Common issues:**
- Token expired
- Wrong scopes/permissions
- Token not exported

### Update shows "unknown" version

This was fixed in v1.12.3. Update to latest:

```bash
npm install -g claude-autopm@latest
autopm update
```

### Docker/kubectl not detected

**Verify installation:**
```bash
docker --version
kubectl version --client
```

**If not installed:**
- Docker: https://docs.docker.com/get-docker/
- kubectl: https://kubernetes.io/docs/tasks/tools/

**Then reinstall preset:**
```bash
autopm install --force
```

### Commands fail in Claude Code

**Check:**
1. Are you using `/pm:command` format?
2. Is `.claude/` directory present?
3. Did you run `/pm:init`?

**Fix:**
```bash
# Reinitialize
/pm:init

# Or via CLI
autopm pm:init
```

### Config file corrupted

```bash
rm .claude/config.json
autopm install
```

## Advanced Topics

### Can I create custom agents?

Yes! Add to `.claude/agents/custom/`:

```markdown
# my-custom-agent

Expert in [your domain]

## Capabilities
- Skill 1
- Skill 2

## Usage
Use for [specific tasks]
```

Then add to team in `.claude/teams.json`.

### How do I contribute?

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

### Can I use ClaudeAutoPM with other AI assistants?

The CLI (`autopm` commands) works everywhere. The `/pm:` slash commands require Claude Code or compatible AI assistant with slash command support.

### Is there a Docker image?

Docker support is for running your project in containers, not ClaudeAutoPM itself. Install globally with npm.

### How do I report bugs?

[Create an issue](https://github.com/rafeekpro/ClaudeAutoPM/issues) with:
- Description of the problem
- Steps to reproduce
- Error messages
- System info (`autopm --version`, `node --version`)

### Where can I get help?

- 📖 [Documentation](https://rafeekpro.github.io/ClaudeAutoPM/)
- 🐛 [Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
- 💬 [Discussions](https://github.com/rafeekpro/ClaudeAutoPM/discussions)
- 🐦 [X/Twitter](https://x.com/rafeekpro)

## Performance

### How many agents can run in parallel?

Depends on preset:
- **Minimal**: 1 (sequential)
- **Docker-only**: 3
- **Full DevOps**: 5
- **Performance**: 8

### Does ClaudeAutoPM work offline?

Yes! Use local-only mode (skip provider configuration). All data stored in `.claude/`.

### How much disk space does it need?

- Installation: ~500MB
- Per project: ~50-100MB (agents, commands, rules)
- Project data: Varies (epics, PRDs)

## Billing & Licensing

### Is ClaudeAutoPM free?

Yes! MIT licensed, completely free and open source.

### Do I need to pay for Claude Code?

Claude Code usage is separate. ClaudeAutoPM CLI works without it.

### Are there API costs?

Only if using external providers:
- GitHub API - Free (rate limited)
- Azure DevOps - Free (within your Azure subscription)
- Context7 MCP - Depends on your Context7 plan

## Migration

### Can I migrate from CCPM?

Yes, ClaudeAutoPM is inspired by CCPM. The workflow is similar but enhanced. See migration guide (coming soon).

### How do I migrate between providers?

```bash
# Export from current provider
autopm pm:export --format json > backup.json

# Switch provider
autopm config switch azure

# Import to new provider
autopm pm:import backup.json
```

### Can I try it on an existing project?

Absolutely! ClaudeAutoPM is non-destructive. It creates `.claude/` directory and doesn't modify existing code.

```bash
cd existing-project
autopm install
```

## Still have questions?

Ask in [Discussions](https://github.com/rafeekpro/ClaudeAutoPM/discussions) or check the [full documentation](https://rafeekpro.github.io/ClaudeAutoPM/).