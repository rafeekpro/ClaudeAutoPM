# Installation Guide

This comprehensive guide covers all installation methods and configuration options for ClaudeAutoPM.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Global Installation (Recommended)](#global-installation-recommended)
3. [Alternative Installation Methods](#alternative-installation-methods)
4. [Configuration Options](#configuration-options)
5. [Post-Installation Setup](#post-installation-setup)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)
8. [Updates and Maintenance](#updates-and-maintenance)

## System Requirements

### Prerequisites

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0
- **Git** (system installation)
- **Claude Code** or compatible AI coding assistant

### Platform Support

- ✅ **macOS** (Intel & Apple Silicon)
- ✅ **Linux** (Ubuntu, Debian, CentOS, RHEL, etc.)
- ✅ **Windows** (Git Bash, WSL, PowerShell)

### Optional Dependencies

- **Docker** (for Docker-first development)
- **Kubernetes CLI (kubectl)** (for K8s testing)
- **GitHub CLI (gh)** (automatically installed during setup)

## Global Installation (Recommended)

The npm-based installation is the fastest, safest, and most reliable method:

```bash
# Install ClaudeAutoPM globally
npm install -g claude-autopm

# Verify installation
autopm --version

# Navigate to your project
cd path/to/your/project

# Install ClaudeAutoPM framework
autopm install
```

### Advantages of Global Installation

- **Automatic updates** via npm
- **Cross-platform compatibility**
- **Integrated MCP management**
- **Better error handling**
- **Comprehensive logging**

## Alternative Installation Methods

### Using npx (No Global Install)

```bash
# Direct usage without installation
npx autopm install
npx autopm merge
npx autopm setup-env
```

### Legacy Shell Installation

**Unix/Linux/macOS:**

```bash
curl -sSL https://raw.githubusercontent.com/rafeekpro/ClaudeAutoPM/main/install/install.sh | bash
```

**Windows PowerShell:**

```bash
iwr -useb https://raw.githubusercontent.com/rafeekpro/ClaudeAutoPM/main/install/install.sh | iex
```

> **Note**: Legacy methods are provided for compatibility but npm installation is recommended for better reliability and features.

## Configuration Options

ClaudeAutoPM supports multiple installation configurations to match your development workflow:

### 1. 🏃 Minimal Configuration

**Best for:** Simple projects, rapid prototyping, learning

```bash
autopm install --yes --config minimal
```

**Features:**
- Native tooling (npm, pip, local execution)
- Standard test runners and frameworks
- No Docker/Kubernetes requirements
- Sequential execution strategy

**Configuration:**
```yaml
docker_first_development: false
kubernetes_devops_testing: false
github_actions_k8s: false
execution_strategy: sequential
```

### 2. 🐳 Docker-Only Configuration

**Best for:** Team consistency, environment parity

```bash
autopm install --yes --config docker
```

**Features:**
- All code runs in Docker containers
- Docker Compose orchestration
- Hot reload with volume mounts
- No local execution allowed

**Configuration:**
```yaml
docker_first_development: true
enforce_docker_tests: true
kubernetes_devops_testing: false
execution_strategy: adaptive
```

### 3. 🚀 Full DevOps Configuration

**Best for:** Production deployments, enterprise teams

```bash
autopm install --yes --config devops
```

**Features:**
- Local development in Docker containers
- CI/CD testing in Kubernetes (KIND)
- Helm charts and security scanning
- GitHub Actions K8s integration

**Configuration:**
```yaml
docker_first_development: true
kubernetes_devops_testing: true
github_actions_k8s: true
integration_tests: true
execution_strategy: adaptive
```

### 4. ⚡ Performance Configuration

**Best for:** Power users, complex projects

```bash
autopm install --yes --config performance
```

**Features:**
- Hybrid parallel execution
- Maximum agent utilization
- Advanced optimization strategies
- Performance monitoring

**Configuration:**
```yaml
execution_strategy: hybrid-parallel
max_parallel_agents: 8
context_optimization: true
performance_monitoring: true
```

## Non-Interactive Installation

For CI/CD pipelines and automated setups:

```bash
# Minimal setup with all options
autopm install --yes --config minimal --no-env --no-hooks

# DevOps setup with GitHub Actions
autopm install -y -c devops --cicd github-actions

# Docker-only without environment setup
autopm install -y -c docker --no-env

# Custom configuration
autopm install -y -c performance --cicd azure-devops --no-hooks
```

### Available Options

| Option | Short | Description |
|--------|-------|-------------|
| `--yes` | `-y` | Auto-accept all prompts (non-interactive mode) |
| `--config` | `-c` | Preset configuration: `minimal`, `docker`, `devops`, `performance` |
| `--cicd` | | CI/CD system: `github-actions`, `azure-devops`, `gitlab-ci`, `jenkins`, `none` |
| `--no-env` | | Skip .env setup |
| `--no-hooks` | | Skip git hooks installation |
| `--no-backup` | | Skip creating backups (not recommended) |
| `--verbose` | | Verbose output for debugging |

## Post-Installation Setup

### 1. Initialize the System

```bash
# Initialize ClaudeAutoPM (run this first)
/pm:init
```

This command will:
- Install GitHub CLI (if needed)
- Authenticate with GitHub
- Install required extensions
- Create necessary directories
- Update .gitignore

### 2. Create CLAUDE.md Configuration

```bash
# Initialize project with ClaudeAutoPM rules
/init include rules from .claude/CLAUDE.md
```

Or if you already have a CLAUDE.md file:

```bash
# Update existing CLAUDE.md with framework rules
/re-init
```

### 3. Prime the Context System

```bash
# Create project context
/context:create
```

### 4. Environment Configuration

```bash
# Interactive .env setup
autopm setup-env

# Or configure specific directory
autopm setup-env ~/my-project
```

### 5. MCP Server Setup (Optional)

```bash
# List available MCP servers
autopm mcp list

# Enable recommended servers
autopm mcp enable context7
autopm mcp enable github-mcp
autopm mcp enable playwright-mcp

# Sync configuration
autopm mcp sync
```

## Verification

### 1. Check Installation

```bash
# Verify ClaudeAutoPM CLI
autopm --version

# Check installed files
ls -la .claude/
```

Expected directory structure:
```
.claude/
├── agents/            # AI agent definitions
├── commands/          # Command definitions
├── rules/             # Development rules
├── scripts/           # Utility scripts
├── checklists/        # Quality checklists
├── base.md           # Base configuration
└── context/          # Project context
```

### 2. Test Core Commands

```bash
# Test project management commands
/pm:help

# Test agent invocation
@code-analyzer help

# Test MCP integration (if enabled)
autopm mcp validate
```

### 3. Run Validation Tests

```bash
# Run all tests
npm run test:all

# Test installation specifically
npm run test:install:validate

# Check security
npm run test:security
```

## Troubleshooting

### Common Installation Issues

#### 1. Permission Denied Errors

**Linux/macOS:**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm

# Or use nvm for Node.js management
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
```

**Windows:**
```powershell
# Run PowerShell as Administrator, then:
npm install -g claude-autopm
```

#### 2. Git Not Found

**Linux (Ubuntu/Debian):**
```bash
sudo apt update && sudo apt install git
```

**macOS:**
```bash
xcode-select --install
```

**Windows:**
- Download Git from https://git-scm.com/download/win
- Ensure Git is in your PATH

#### 3. Node.js Version Issues

```bash
# Check current version
node --version

# Upgrade Node.js
npm install -g n
n latest

# Or use nvm
nvm install node
nvm use node
```

#### 4. Installation Hangs or Fails

```bash
# Clear npm cache
npm cache clean --force

# Use verbose mode
autopm install --verbose

# Skip problematic steps
autopm install --no-env --no-hooks
```

#### 5. Missing Files Warnings

If you see warnings like "Cannot create template for: FILENAME":

1. **Check source files:**
   ```bash
   ls -la node_modules/claude-autopm/autopm/.claude/
   ```

2. **Verify npm package integrity:**
   ```bash
   npm list claude-autopm
   npm cache verify
   ```

3. **Reinstall if needed:**
   ```bash
   npm uninstall -g claude-autopm
   npm install -g claude-autopm
   ```

#### 6. Windows-Specific Issues

**Git Bash Required:**
```bash
# Ensure Git Bash is available
which bash

# If missing, install Git for Windows
# Download from: https://git-scm.com/download/win
```

**WSL Compatibility:**
```bash
# In WSL, ensure npm is properly configured
npm config get prefix
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Docker Issues

#### Docker Not Found

**Ubuntu/Debian:**
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

**macOS:**
- Install Docker Desktop from https://docker.com/products/docker-desktop

**Windows:**
- Install Docker Desktop or use WSL2 with Docker

#### Permission Issues

```bash
# Linux: Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Test Docker access
docker run hello-world
```

### Kubernetes Issues

#### kubectl Not Found

**Using Package Managers:**
```bash
# macOS
brew install kubectl

# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y kubectl

# Windows (Chocolatey)
choco install kubernetes-cli
```

#### KIND Installation

```bash
# Install KIND for local K8s testing
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.14.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind
```

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

### Configuration Management

```bash
# Reconfigure features
autopm config

# Update environment variables
autopm setup-env

# Manage MCP servers
autopm mcp list
autopm mcp sync
```

### Backup and Recovery

ClaudeAutoPM automatically creates backups during updates:

```bash
# Backups are stored in:
.claude/.backups/

# Manual backup
cp -r .claude .claude.backup.$(date +%Y%m%d)

# Restore from backup
cp -r .claude.backup.20240314 .claude
```

### Health Checks

```bash
# Check system health
npm run pm:health

# Validate configuration
npm run pm:validate

# System metrics
npm run pm:metrics
```

## Next Steps

After successful installation:

1. **Read the [Quick Start Guide](Quick-Start.md)** for your first project
2. **Explore [Configuration Options](Configuration-Options.md)** for customization
3. **Check [Agent Registry](Agent-Registry.md)** for available AI agents
4. **Review [CLI Reference](CLI-Reference.md)** for all commands

## Getting Help

- **Documentation**: [ClaudeAutoPM Wiki](https://github.com/rafeekpro/ClaudeAutoPM/wiki)
- **Issues**: [GitHub Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rafeekpro/ClaudeAutoPM/discussions)

---

*For more detailed configuration options, see [Configuration Options](Configuration-Options.md)*