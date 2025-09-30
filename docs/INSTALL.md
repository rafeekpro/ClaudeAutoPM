# ClaudeAutoPM Installation Guide

Complete installation guide for ClaudeAutoPM framework.

## System Requirements

### Minimum Requirements
- **Node.js**: >= 16.0.0
- **npm**: >= 8.0.0
- **Git**: Latest version
- **Operating System**: Windows 10+, macOS 10.15+, or Linux
- **Memory**: 4GB RAM minimum
- **Storage**: 500MB available space

### Optional Requirements (Based on Preset)
- **Docker**: Latest version (for Docker-only, Full DevOps, Performance presets)
- **kubectl**: Latest version (for Full DevOps, Performance presets)
- **Claude Code**: For AI-powered features

## Installation Methods

### Method 1: Quick Install (Recommended)

```bash
# Install globally
npm install -g claude-autopm

# Run interactive guide
autopm guide
```

The interactive guide will:
- ✅ Verify system requirements
- 📦 Install framework with preset selection
- ⚙️ Configure provider (GitHub/Azure DevOps)
- 🤖 Set up agent teams
- 📝 Create first PRD and workflow

### Method 2: Manual Install

#### Step 1: Install Package

```bash
npm install -g claude-autopm
```

#### Step 2: Verify Installation

```bash
autopm --version
# Should display: ClaudeAutoPM v1.12.x
```

#### Step 3: Install Framework

```bash
# Navigate to your project
cd your-project/

# Install framework
autopm install
```

#### Step 4: Choose Configuration Preset

During installation, select from:

| Preset | Requirements | Best For |
|--------|-------------|----------|
| **Minimal** | None | Small projects, beginners |
| **Docker-only** | Docker | Medium projects, local dev |
| **Full DevOps** 🎯 | Docker + kubectl | Production (RECOMMENDED) |
| **Performance** | Docker + kubectl | Large projects, power users |
| **Custom** | Varies | Specific requirements |

The installer automatically detects Docker and kubectl and only shows compatible options.

#### Step 5: Configure Provider

Choose your project management provider:

**GitHub Issues:**
```bash
autopm config set provider github
autopm config set github.owner your-username
autopm config set github.repo your-repo
export GITHUB_TOKEN=your-token
```

**Azure DevOps:**
```bash
autopm config set provider azure
autopm config set azure.organization your-org
autopm config set azure.project your-project
export AZURE_DEVOPS_PAT=your-token
```

**Skip for now:**
- All data stored locally
- Can migrate to provider later

## Platform-Specific Instructions

### macOS

```bash
# Install Node.js via Homebrew
brew install node

# Install Claude AutoPM
npm install -g claude-autopm

# Verify installation
autopm --version
```

### Linux (Ubuntu/Debian)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install ClaudeAutoPM
sudo npm install -g claude-autopm

# Verify installation
autopm --version
```

### Windows

```bash
# Install via npm (after installing Node.js from nodejs.org)
npm install -g claude-autopm

# Or use Windows Package Manager
winget install OpenJS.NodeJS
npm install -g claude-autopm

# Verify installation
autopm --version
```

## Docker Installation (Optional)

For Docker-based workflows:

```bash
# Verify Docker installation
docker --version

# Pull ClaudeAutoPM image (if available)
docker pull rafeekpro/claude-autopm:latest

# Or run installer with Docker preset
autopm install --scenario=docker
```

## Post-Installation

### 1. Initialize PM System

```bash
# In your project root
/pm:init

# Or via CLI
autopm pm:init
```

### 2. Set Up Git Hooks (Optional)

```bash
# Enable automatic team switching based on branch names
bash scripts/setup-githooks.sh
```

### 3. Configure Agent Teams

```bash
# List available teams
autopm team list

# Load a team
autopm team load devops
autopm team load frontend
autopm team load python_backend
```

### 4. Test Installation

```bash
# Check system status
autopm config validate

# View configuration
autopm config show

# Test PM commands
autopm pm:status
```

## Updating ClaudeAutoPM

### Standard Update

```bash
# Update to latest version
autopm update
```

The update command:
- ✅ Detects current version automatically (new in v1.12.3)
- 📦 Creates backup by default
- ⚙️ Preserves configuration files
- 📁 Protects epics, PRDs, and project data
- 🔄 Updates only framework files

### Force Update

```bash
# Force update even if versions match
autopm update --force

# Skip backup creation
autopm update --no-backup

# Don't preserve configuration
autopm update --no-preserve-config
```

### Update to Specific Version

```bash
# Install specific version globally
npm install -g claude-autopm@1.12.2

# Then update framework
autopm update
```

## Troubleshooting

### Installation Issues

**npm permission errors (Linux/macOS):**
```bash
# Fix npm permissions
sudo chown -R $USER /usr/local/lib/node_modules
sudo chown -R $USER /usr/local/bin
```

**Command not found:**
```bash
# Check npm global path
npm config get prefix

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$(npm config get prefix)/bin:$PATH"

# Reload shell
source ~/.bashrc  # or source ~/.zshrc
```

**Version mismatch:**
```bash
# Check Node.js version
node --version  # Should be >= 16.0.0

# Update Node.js if needed
npm install -g n
sudo n stable
```

### Docker Issues

**Docker not detected:**
```bash
# Verify Docker installation
docker --version

# Start Docker daemon
sudo systemctl start docker  # Linux
# or open Docker Desktop on Mac/Windows
```

**kubectl not detected:**
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verify
kubectl version --client
```

### Configuration Issues

**Provider authentication fails:**
```bash
# GitHub - check token scopes
# Required: repo, workflow

# Azure DevOps - check PAT permissions
# Required: Work Items (Read, Write, & Manage), Code (Read & Write)

# Verify token is set
echo $GITHUB_TOKEN
echo $AZURE_DEVOPS_PAT
```

**Config file corrupted:**
```bash
# Remove corrupted config
rm .claude/config.json

# Reinstall framework
autopm install --force
```

### Common Errors

**Error: "EACCES: permission denied"**
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

**Error: "Cannot find module"**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
npm uninstall -g claude-autopm
npm install -g claude-autopm
```

**Error: "Git not found"**
```bash
# Install Git
# macOS
brew install git

# Linux
sudo apt-get install git

# Windows
winget install Git.Git
```

## Verification

After installation, verify everything works:

```bash
# Check installation
autopm --version

# Verify configuration
autopm config show

# Test PM commands
autopm pm:status

# List available commands
autopm --help
```

## Next Steps

1. Read the [Quick Start Guide](./QUICKSTART.md)
2. Configure your [Project Settings](./CONFIG.md)
3. Check the [FAQ](./FAQ.md) for common questions
4. Browse the [Command Reference](../COMMANDS.md)
5. Explore the [Wiki](https://github.com/rafeekpro/ClaudeAutoPM/wiki)

## Uninstallation

To completely remove ClaudeAutoPM:

```bash
# Uninstall global package
npm uninstall -g claude-autopm

# Remove project files (in project directory)
rm -rf .claude .claude-code scripts/safe-commit.sh scripts/setup-hooks.sh

# Remove git hooks (optional)
rm .git/hooks/pre-commit .git/hooks/pre-push
```

## Support

- 📖 [Documentation](https://rafeekpro.github.io/ClaudeAutoPM/)
- 🐛 [Issue Tracker](https://github.com/rafeekpro/ClaudeAutoPM/issues)
- 💬 [Discussions](https://github.com/rafeekpro/ClaudeAutoPM/discussions)
- 🐦 [Follow on X](https://x.com/rafeekpro)