---
title: Installation
description: Complete installation guide for ClaudeAutoPM with all scenarios and configuration options
---

# Installation Guide

This guide covers all installation methods and configuration options for ClaudeAutoPM.

## System Requirements

### Prerequisites

| Requirement | Minimum Version |
|-------------|-----------------|
| Node.js | >= 16.0.0 |
| npm | >= 8.0.0 |
| Git | Latest stable |

### Platform Support

- **macOS**: Intel and Apple Silicon
- **Linux**: Ubuntu, Debian, CentOS, RHEL, and other distributions
- **Windows**: Git Bash, WSL, PowerShell

### Optional Dependencies

- **Docker**: For Docker-first development scenarios
- **Kubernetes CLI (kubectl)**: For K8s testing
- **GitHub CLI (gh)**: Automatically installed during setup if needed

## Installation Methods

### Global Installation (Recommended)

The npm-based global installation is the fastest and most reliable method:

```bash
# Install ClaudeAutoPM globally
npm install -g claude-autopm

# Verify installation
autopm --version

# Navigate to your project
cd your-project

# Install the framework
autopm install
```

### Using npx (No Global Install)

If you prefer not to install globally:

```bash
# Run directly without installation
npx claude-autopm install

# Other commands work the same way
npx claude-autopm merge
npx claude-autopm setup-env
```

### Legacy Shell Installation

For environments where npm is not available:

**Unix/Linux/macOS:**
```bash
curl -sSL https://raw.githubusercontent.com/rafeekpro/ClaudeAutoPM/main/install/install.sh | bash
```

**Windows PowerShell:**
```powershell
iwr -useb https://raw.githubusercontent.com/rafeekpro/ClaudeAutoPM/main/install/install.sh | iex
```

::: warning Note
Legacy shell installation is provided for compatibility. npm installation is recommended for better reliability and automatic updates.
:::

## Installation Scenarios

During interactive installation, you'll choose from six pre-configured scenarios:

### 0. Lite

**Best for**: Quick setup, minimal context usage

```bash
autopm install --yes --config lite
```

- Core PM essentials only (~50 commands)
- Minimal context footprint
- No Docker or Kubernetes
- Sequential execution strategy

### 1. Standard (Default)

**Best for**: Most projects, balanced features

```bash
autopm install --yes --config standard
```

- Core + languages + PM commands (~55 commands)
- Native tooling support
- Sequential or adaptive execution
- Recommended starting point

### 2. Azure

**Best for**: Teams using Azure DevOps

```bash
autopm install --yes --config azure
```

- Standard + Azure DevOps integration (~95 commands)
- Work item synchronization
- Azure Boards integration
- Sprint and iteration support

### 3. Docker

**Best for**: Containerized development environments

```bash
autopm install --yes --config docker
```

- Full PM + Docker-first development
- 7 plugins enabled
- Container orchestration support
- Adaptive execution strategy

### 4. Full DevOps (Recommended for Teams)

**Best for**: Production deployments, enterprise teams

```bash
autopm install --yes --config devops
```

- Complete CI/CD pipeline support
- 10 plugins enabled
- Kubernetes-native testing
- Security scanning with Trivy
- Helm chart support

### 5. Performance

**Best for**: Power users, complex projects

```bash
autopm install --yes --config performance
```

- Maximum parallel execution
- 12 plugins enabled
- Hybrid parallel strategy
- Advanced optimization features

### 6. Custom

**Best for**: Specific requirements

```bash
autopm install --yes --config custom
```

Allows you to provide your own configuration file.

## Scenario Comparison

| Feature | Lite | Standard | Azure | Docker | DevOps | Performance |
|---------|------|----------|-------|--------|--------|-------------|
| Commands | ~50 | ~55 | ~95 | ~85 | ~100 | ~120 |
| Docker | - | - | - | Yes | Yes | Yes |
| Kubernetes | - | - | - | - | Yes | Yes |
| Azure DevOps | - | - | Yes | - | Yes | Yes |
| Parallel Exec | - | - | - | Adaptive | Adaptive | Hybrid |

## Non-Interactive Installation

For CI/CD pipelines and automated setups:

```bash
# Minimal setup
autopm install --yes --config lite --no-env --no-hooks

# Standard with GitHub Actions
autopm install -y -c standard --cicd github-actions

# DevOps setup
autopm install -y -c devops --cicd azure-devops

# Skip specific steps
autopm install -y -c performance --no-env --no-hooks
```

### Available CLI Options

| Option | Short | Description |
|--------|-------|-------------|
| `--yes` | `-y` | Auto-accept all prompts (non-interactive) |
| `--config` | `-c` | Preset: `lite`, `standard`, `azure`, `docker`, `devops`, `performance` |
| `--cicd` | | CI/CD system: `github-actions`, `azure-devops`, `gitlab-ci`, `jenkins`, `none` |
| `--no-env` | | Skip .env setup |
| `--no-hooks` | | Skip git hooks installation |
| `--no-backup` | | Skip creating backups |
| `--verbose` | | Enable verbose output |

## Post-Installation Setup

After installation, complete these setup steps:

### 1. Initialize Project Management

```bash
# In Claude Code, run:
/pm:init
```

This command will:
- Install GitHub CLI if needed
- Authenticate with GitHub
- Create necessary directories
- Update `.gitignore`

### 2. Configure Environment (Optional)

```bash
# Interactive environment setup
autopm setup-env

# Or configure a specific directory
autopm setup-env ~/my-project
```

### 3. Enable MCP Servers (Optional)

```bash
# List available MCP servers
autopm mcp list

# Enable recommended servers
autopm mcp enable context7
autopm mcp enable github-mcp

# Sync configuration
autopm mcp sync
```

## Verify Installation

### Check Installed Files

```bash
# Verify ClaudeAutoPM CLI
autopm --version

# Check directory structure
ls -la .claude/
```

Expected structure:
```
.claude/
├── agents/           # AI agent definitions
├── commands/         # Command definitions
├── rules/            # Development rules
├── scripts/          # Utility scripts
├── checklists/       # Quality checklists
└── context/          # Project context
```

### Test Core Commands

In Claude Code:
```
/pm:help          # Show available commands
/pm:validate      # Validate configuration
```

## Troubleshooting

### Permission Denied Errors

**Linux/macOS:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Or use nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
```

**Windows:**
```powershell
# Run PowerShell as Administrator
npm install -g claude-autopm
```

### Node.js Version Issues

```bash
# Check current version
node --version

# Upgrade using n
npm install -g n
n latest

# Or use nvm
nvm install node
nvm use node
```

### Installation Hangs

```bash
# Clear npm cache
npm cache clean --force

# Use verbose mode for debugging
autopm install --verbose

# Skip problematic steps
autopm install --no-env --no-hooks
```

### Git Not Found

**Linux (Ubuntu/Debian):**
```bash
sudo apt update && sudo apt install git
```

**macOS:**
```bash
xcode-select --install
```

**Windows:**
Download from https://git-scm.com/download/win

## Updates and Maintenance

### Updating ClaudeAutoPM

```bash
# Update global package
npm update -g claude-autopm

# Update existing project installation
autopm update

# Force update with latest templates
autopm install --no-backup
```

### Backup and Recovery

ClaudeAutoPM automatically creates backups during updates:

```bash
# Backups stored in:
.claude/.backups/

# Manual backup
cp -r .claude .claude.backup.$(date +%Y%m%d)

# Restore from backup
cp -r .claude.backup.20240314 .claude
```

## Next Steps

With ClaudeAutoPM installed, proceed to:

- [Your First Project](./first-project.md) - Create your first PRD and start development
- [Configuration](./configuration.md) - Customize your setup
