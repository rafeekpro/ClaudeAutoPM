# First Project

Creating your first project with ClaudeAutoPM is a streamlined process that sets up everything you need for AI-powered project management. This guide walks you through initialization, configuration, and verification steps.

## Prerequisites

Before creating your first project, ensure you have:

1. **Node.js** (v16.0.0 or higher)
2. **npm** (v8.0.0 or higher)
3. **Git** installed and configured
4. **ClaudeAutoPM** installed globally:
   ```bash
   npm install -g claude-autopm
   ```

## Creating a New Project

### Option 1: Interactive Initialization (Recommended)

The simplest way to create a new project is using the interactive `autopm init` command:

```bash
autopm init my-awesome-project
```

This command performs the following steps:

1. **Creates project directory**: `my-awesome-project/`
2. **Initializes Git repository**: Sets up `.git/` with initial commit
3. **Runs installation wizard**: Launches the configuration process

### Option 2: Install in Existing Project

If you already have a project directory:

```bash
cd /path/to/your/project
autopm install
```

## Configuration Process

During installation, you'll be presented with configuration options:

### 1. Select Installation Scenario

```
┌──────────────────────────────────────────┐
│  ClaudeAutoPM Installation Configurator  │
└──────────────────────────────────────────┘

Select your installation scenario:

1) Minimal - Sequential execution, no Docker/K8s
2) Docker-only - Adaptive execution with Docker
3) Full DevOps - Adaptive execution with all features
4) Performance - Hybrid parallel execution
5) Custom - Provide your own configuration

Enter choice [1-5]:
```

**Recommendations:**
- **Beginners**: Choose option 1 (Minimal)
- **Most users**: Choose option 3 (Full DevOps)
- **Performance-focused**: Choose option 4 (Performance)

### 2. Automatic Setup

Based on your selection, the installer will:

1. **Copy framework files**: Agents, commands, rules, scripts
2. **Generate CLAUDE.md**: Customized project instructions
3. **Configure environment**: Create `.env` from template
4. **Setup Git hooks**: Install pre-commit and pre-push hooks
5. **Initialize strategies**: Configure execution strategy

## What Gets Installed

After successful installation, your project will have:

```
my-awesome-project/
├── .claude/                    # Claude configuration
│   ├── agents/                # AI agent definitions
│   ├── commands/              # PM command definitions
│   ├── rules/                 # Development rules
│   ├── scripts/               # Utility scripts
│   ├── strategies/            # Execution strategies
│   └── .env                   # Environment configuration
├── .claude-code/              # Claude Code settings
│   └── config.json           # Editor configuration
├── .github/                   # GitHub workflows
│   └── workflows/            # CI/CD pipelines
├── scripts/                   # Project scripts
│   ├── safe-commit.sh        # Safe commit utility
│   └── setup-hooks.sh        # Hook installer
├── CLAUDE.md                  # Project instructions
├── PLAYBOOK.md                # Usage guidelines
└── COMMIT_CHECKLIST.md        # Quality checklist
```

## Verification Steps

After installation, verify everything is working:

### 1. Check Installation Status

```bash
# Validate installation
autopm validate

# Expected output:
✅ ClaudeAutoPM installation validated successfully
- Framework files: Present
- Configuration: Valid
- Git hooks: Installed
```

### 2. Test PM Commands

Open your project in Claude Code and try:

```
/pm:help
```

You should see available project management commands.

### 3. Verify Agents

List available agents:

```bash
ls .claude/agents/
```

Test an agent in Claude Code:

```
@code-analyzer review this file for issues
```

### 4. Check Git Hooks

Test the safe commit script:

```bash
./scripts/safe-commit.sh "test: initial commit"
```

This should run pre-commit validations.

## Next Steps

With your project initialized:

1. **Configure environment variables**: Edit `.claude/.env` for your setup
2. **Review the PLAYBOOK**: Read `PLAYBOOK.md` for usage guidelines
3. **Explore agents**: Check `.claude/agents/AGENT-REGISTRY.md`
4. **Start using PM commands**: Try `/pm:init` to initialize project management

## Common Issues

### Installation Fails

If installation fails:

```bash
# Check for errors
npm list -g claude-autopm

# Reinstall if needed
npm uninstall -g claude-autopm
npm install -g claude-autopm
```

### Permission Errors

On Unix systems, you might need:

```bash
sudo npm install -g claude-autopm
```

Or configure npm to use a different directory:

```bash
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
```

### Git Not Initialized

If you see "Not a git repository":

```bash
git init
git add .
git commit -m "Initial commit"
```

## Example: Full Project Setup

Here's a complete example of setting up a new React project:

```bash
# 1. Create and initialize project
autopm init my-react-app

# 2. Choose "Full DevOps" configuration
# Enter: 3

# 3. Navigate to project
cd my-react-app

# 4. Configure for React development
echo "REACT_APP=true" >> .claude/.env

# 5. Initialize React app (in Docker)
docker run -it --rm -v $(pwd):/app -w /app node:18 \
  npx create-react-app . --template typescript

# 6. Start using Claude Code with PM commands
# Open in Claude Code and use:
# /pm:init
# @react-ui-expert help me build a dashboard
```

## Configuration Presets

The installer offers these presets:

| Preset | Docker | Kubernetes | Parallel | Best For |
|--------|--------|------------|----------|----------|
| Minimal | ❌ | ❌ | ❌ | Simple projects |
| Docker-only | ✅ | ❌ | Adaptive | Most projects |
| Full DevOps | ✅ | ✅ | Adaptive | Enterprise |
| Performance | ✅ | ✅ | ✅ | Power users |

## Resources

- [Configuration Options](Configuration-Options)
- [Environment Variables](Environment-Variables)
- [Docker First Development](Docker-First-Development)
- [Agent Selection Guide](Agent-Selection-Guide)