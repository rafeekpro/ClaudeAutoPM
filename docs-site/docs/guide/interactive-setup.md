# Interactive Setup Guide

The `autopm guide` command provides a user-friendly, step-by-step wizard to help you configure ClaudeAutoPM without reading extensive documentation.

## Overview

The interactive guide is perfect for:

- **New users** getting started with ClaudeAutoPM
- **Quick setup** of new projects
- **Resetting** existing configurations
- **Learning** essential commands and workflows

## Running the Guide

Start the interactive setup:

```bash
autopm guide
```

## Guide Walkthrough

### Step 1: Welcome Screen

The guide starts with a friendly welcome screen showing what you'll accomplish:

```
╔═══════════════════════════════════════════════╗
║                                               ║
║     Welcome to ClaudeAutoPM                  ║
║     Interactive Setup Guide                   ║
║                                               ║
╚═══════════════════════════════════════════════╝

This guide will help you:
  • Verify system requirements
  • Configure your project management provider
  • Create your first task
  • Learn essential commands
```

### Step 2: Dependency Verification

The guide automatically checks for required dependencies:

```
📋 Checking Dependencies...

  ✓ Git is installed
  ✓ Node.js is installed
  ✓ npm is installed

✅ All dependencies are installed!
```

If any dependencies are missing, you'll receive instructions on how to install them.

### Step 3: Provider Configuration

Choose your project management provider:

```
⚙️  Provider Configuration

? Which project management provider do you use?
  ❯ GitHub Issues
    Azure DevOps
    Skip for now
```

#### GitHub Configuration

If you select GitHub, you'll be prompted for:

1. **Personal Access Token (PAT)**
   - Must start with `ghp_` or `github_pat_`
   - Needs `repo` scope for private repositories
   - [Create a token here](https://github.com/settings/tokens)

2. **Repository**
   - Format: `owner/repository`
   - Example: `rafeekpro/ClaudeAutoPM`

#### Azure DevOps Configuration

For Azure DevOps, you'll need:

1. **Personal Access Token (PAT)**
   - [Create a token here](https://dev.azure.com/)
   - Needs Work Items read/write permissions

2. **Organization Name**
   - Found in your Azure DevOps URL
   - Example: `https://dev.azure.com/YOUR_ORG`

3. **Project Name**
   - Your Azure DevOps project

### Step 4: First Task Creation (Optional)

The guide offers to create your first task:

```
? Would you like to create your first task? (Y/n)
```

If you choose yes, you'll provide:

- **Task Title** - Brief description of the task
- **Task Description** - Detailed information about what needs to be done

The guide will automatically create the task using the appropriate command for your provider.

### Step 5: Summary and Next Steps

After setup, you'll see:

```
🎉 Setup Complete!

Configuration Summary:
  • Provider: GitHub
  • Repository: rafeekpro/ClaudeAutoPM

📚 Next Steps:

Useful commands:
  autopm pm:status        - View project status
  autopm pm:issue-new     - Create new issue
  autopm pm:issue-list    - List all issues
  autopm pm:help          - Show all commands

📖 Documentation:
  • Full docs: https://github.com/rafeekpro/ClaudeAutoPM
  • Quick start: https://github.com/rafeekpro/ClaudeAutoPM#quick-start

✨ Happy coding with ClaudeAutoPM!
```

## Command Options

The guide supports several options:

### Skip Dependencies Check

If you're confident your system meets requirements:

```bash
autopm guide --skip-deps
```

### Reset Configuration

To start fresh with a new configuration:

```bash
autopm guide --reset
```

This will:
1. Ask for confirmation
2. Remove existing configuration
3. Start the setup process from scratch

## Configuration Storage

The guide saves your configuration to:

```
.autopm/
└── config.json
```

Example configuration file:

```json
{
  "provider": "github",
  "github": {
    "token": "ghp_xxxxxxxxxxxxxxxxxxxx",
    "repository": "owner/repo"
  }
}
```

## Troubleshooting

### Token Validation Failed

If your token is rejected:

- **GitHub**: Ensure token starts with `ghp_` or `github_pat_`
- **Azure**: Verify token has correct permissions
- Check for extra spaces or characters
- Regenerate token if expired

### Can't Create First Task

If task creation fails:

- Verify your token has write permissions
- Check repository/project exists
- Ensure you have internet connectivity
- Try creating manually with displayed command

### Configuration Not Saving

If configuration fails to save:

- Check write permissions in project directory
- Ensure `.autopm/` directory can be created
- Verify disk has available space
- Try running with elevated permissions if needed

## Security Best Practices

### Token Management

- **Never commit tokens** to version control
- Use environment variables for CI/CD
- Rotate tokens regularly
- Use minimal required permissions

### Configuration Files

Add to `.gitignore`:

```text
.autopm/config.json
.env
*.token
```

### Environment Variables

Instead of storing tokens in config, use environment variables:

```bash
export GITHUB_TOKEN="your_token"
export AZURE_DEVOPS_TOKEN="your_token"
```

## Customization

### Custom Configuration Path

Set a custom configuration location:

```bash
AUTOPM_CONFIG_PATH=/custom/path autopm guide
```

### Non-Interactive Mode

For automated setup, provide answers via environment:

```bash
AUTOPM_PROVIDER=github \
AUTOPM_GITHUB_TOKEN=ghp_xxx \
AUTOPM_GITHUB_REPO=owner/repo \
autopm guide --skip-deps
```

## Next Steps

After completing the interactive setup:

1. **Explore Commands**: Run `autopm help` to see all available commands
2. **Create Your First Epic**: Use `/pm:epic-new` in Claude Code
3. **Set Up Automation**: Configure GitHub Actions or Azure Pipelines
4. **Customize Agents**: Learn about [Custom Agents](/guide/custom-agents)
5. **Join Community**: Share your experience and get help

## Feedback

We're constantly improving the interactive guide. If you have suggestions:

- Open an [issue on GitHub](https://github.com/rafeekpro/ClaudeAutoPM/issues)
- Join the [discussions](https://github.com/rafeekpro/ClaudeAutoPM/discussions)
- Tweet [@rafeekpro](https://x.com/rafeekpro) with feedback