# ClaudeAutoPM Configuration Guide

Complete configuration reference for ClaudeAutoPM.

## Configuration File

ClaudeAutoPM uses `.claude/config.json` for project configuration:

```json
{
  "version": "1.12.3",
  "installed": "2025-09-30T10:00:00Z",
  "execution_strategy": "adaptive",
  "tools": {
    "docker": { "enabled": true, "first": true },
    "kubernetes": { "enabled": true }
  }
}
```

## Environment Variables

### GitHub Configuration

```bash
# Required for GitHub integration
export GITHUB_TOKEN="ghp_your_token_here"

# Optional - auto-detected from git config
export GITHUB_OWNER="your-username"
export GITHUB_REPO="your-repo"
```

### Azure DevOps Configuration

```bash
# Required for Azure DevOps integration
export AZURE_DEVOPS_PAT="your_pat_here"

# Required - set via autopm config
export AZURE_DEVOPS_ORG="your-organization"
export AZURE_DEVOPS_PROJECT="your-project"
```

### MCP Configuration

```bash
# Context7 MCP Server
export CONTEXT7_API_KEY="your_context7_key"
export CONTEXT7_WORKSPACE="your_workspace"

# Optional MCP settings
export CONTEXT7_MCP_URL="https://mcp.context7.com/mcp"
export CONTEXT7_API_URL="https://context7.com/api/v1"
```

## Configuration Commands

### View Configuration

```bash
# Show all settings
autopm config show

# Show specific provider
autopm config show --provider github
autopm config show --provider azure
```

### Set Configuration

```bash
# Set provider
autopm config set provider github
autopm config set provider azure

# GitHub settings
autopm config set github.owner username
autopm config set github.repo repository

# Azure DevOps settings
autopm config set azure.organization org-name
autopm config set azure.project project-name
```

### Switch Providers

```bash
# Quick switch
autopm config switch github
autopm config switch azure

# Validates and switches in one command
```

### Validate Configuration

```bash
# Check if config is valid
autopm config validate

# Tests provider connection
# Verifies tokens and permissions
```

## Installation Presets

### Minimal

```json
{
  "execution_strategy": "sequential",
  "tools": {
    "docker": { "enabled": false },
    "kubernetes": { "enabled": false }
  }
}
```

**Use for:**
- Small projects
- Learning ClaudeAutoPM
- No Docker environment

### Docker-only

```json
{
  "execution_strategy": "adaptive",
  "tools": {
    "docker": { "enabled": true, "first": false },
    "kubernetes": { "enabled": false }
  }
}
```

**Use for:**
- Medium projects
- Local development
- Docker available

### Full DevOps (Recommended)

```json
{
  "execution_strategy": "adaptive",
  "tools": {
    "docker": { "enabled": true, "first": true },
    "kubernetes": { "enabled": true }
  }
}
```

**Use for:**
- Production projects
- CI/CD pipelines
- Enterprise environments

### Performance

```json
{
  "execution_strategy": "hybrid",
  "parallel_limit": 5,
  "tools": {
    "docker": { "enabled": true, "first": false },
    "kubernetes": { "enabled": true }
  }
}
```

**Use for:**
- Large codebases
- Powerful machines
- Maximum speed

## Execution Strategies

### Sequential
- One agent at a time
- Safest option
- Predictable behavior

### Adaptive
- Intelligent parallelization
- Adjusts based on task complexity
- Good balance of speed and safety

### Hybrid
- Maximum parallelization
- Up to 5-8 agents in parallel
- Requires monitoring

## Agent Teams

### Team Configuration

Located in `.claude/teams.json`:

```json
{
  "active_team": "devops",
  "teams": {
    "base": {
      "agents": ["code-analyzer", "file-analyzer", "test-runner"]
    },
    "devops": {
      "inherits": "base",
      "agents": [
        "docker-containerization-expert",
        "kubernetes-orchestrator",
        "github-operations-specialist"
      ]
    }
  }
}
```

### Managing Teams

```bash
# List teams
autopm team list

# Load team
autopm team load devops

# Check active team
autopm team current
```

## Provider-Specific Settings

### GitHub

**Required Scopes:**
- `repo` - Repository access
- `workflow` - GitHub Actions

**Optional Settings:**
```bash
autopm config set github.defaultBranch main
autopm config set github.autoCreateIssues true
```

### Azure DevOps

**Required Permissions:**
- Work Items: Read, Write, & Manage
- Code: Read & Write

**Optional Settings:**
```bash
autopm config set azure.workItemType Task
autopm config set azure.iterationPath "MyProject\\Sprint 1"
```

## Advanced Configuration

### MCP Servers

Edit `.claude/mcp-servers.json`:

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["@context7/mcp-server"],
      "env": {
        "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY:-}",
        "CONTEXT7_MCP_URL": "${CONTEXT7_MCP_URL:-https://mcp.context7.com/mcp}"
      }
    }
  }
}
```

### Git Hooks

Enable automatic validation:

```bash
bash scripts/setup-githooks.sh
```

Hooks installed:
- `pre-commit` - Format and lint checks
- `pre-push` - Test execution
- `post-checkout` - Auto team switching (optional)

### Custom Strategies

Create custom execution strategy in `.claude/strategies/`:

```markdown
# Custom Strategy

## Execution Rules
- Max parallel agents: 3
- Docker first: true
- Kubernetes tests: on-demand

## Agent Selection
- Code changes → code-analyzer
- API changes → python-backend-engineer
- UI changes → react-frontend-engineer
```

## Troubleshooting

### Config File Corrupted

```bash
rm .claude/config.json
autopm install
```

### Provider Authentication Fails

```bash
# Check tokens
echo $GITHUB_TOKEN
echo $AZURE_DEVOPS_PAT

# Validate
autopm config validate
```

### Wrong Configuration

```bash
# Reset to defaults
autopm install --force
```

## Best Practices

1. **Environment Variables**
   - Store tokens in `.claude/.env`
   - Never commit tokens to git
   - Use different tokens per environment

2. **Team Configuration**
   - Start with base team
   - Add specialized teams as needed
   - Use inheritance to avoid duplication

3. **Provider Settings**
   - Validate after configuration
   - Test with simple command first
   - Keep tokens secure

4. **Updates**
   - Config preserved during updates
   - Review changes after update
   - Test after major version updates

## Next Steps

- [Quick Start Guide](./QUICKSTART.md)
- [Installation Guide](./INSTALL.md)
- [FAQ](./FAQ.md)
- [Command Reference](../COMMANDS.md)