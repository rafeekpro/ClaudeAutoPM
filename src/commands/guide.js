/**
 * Interactive Guide Command
 * Helps new users set up ClaudeAutoPM with a step-by-step wizard
 */

const fs = require('fs-extra');
const path = require('path');
const { exec, execSync } = require('child_process');

// Handle ESM/CJS compatibility for chalk and inquirer
let chalk, inquirer;
try {
  chalk = require('chalk').default || require('chalk');
} catch (e) {
  chalk = {
    cyan: (str) => str,
    green: (str) => str,
    red: (str) => str,
    yellow: (str) => str,
    gray: (str) => str
  };
}

try {
  inquirer = require('inquirer').default || require('inquirer');
} catch (e) {
  inquirer = { prompt: async () => ({}) };
}

module.exports = {
  command: 'guide',
  describe: 'Launch interactive setup guide for new users',
  builder: (yargs) => {
    return yargs
      .option('skip-deps', {
        describe: 'Skip dependency verification',
        type: 'boolean',
        default: false
      })
      .option('reset', {
        describe: 'Reset existing configuration',
        type: 'boolean',
        default: false
      });
  },
  handler: async (argv) => {
    const guide = new InteractiveGuide(argv);
    await guide.run();
  }
};

class InteractiveGuide {
  constructor(options = {}) {
    this.options = options;
    this.configPath = path.join(process.cwd(), '.claude', 'config.json');
    this.envPath = path.join(process.cwd(), '.claude', '.env');
    this.config = {};
    this.projectPath = process.cwd();
  }

  async run() {
    try {
      // Handle reset option
      if (this.options.reset) {
        await this.resetConfiguration();
      }

      // Step 1: Welcome
      await this.showWelcome();

      // Step 2: Verify Dependencies
      if (!this.options.skipDeps) {
        await this.verifyDependencies();
      }

      // Step 3: Choose project location FIRST
      await this.chooseProjectLocation();

      // Step 4: Get project details (name, description)
      await this.getProjectDetails();

      // Step 5: Configure Provider (GitHub/Azure)
      await this.configureProvider();

      // Step 6: Setup version control (git) if needed
      await this.setupVersionControl();

      // Step 7: Install ClaudeAutoPM framework
      await this.installFramework();

      // Step 8: Create First Task (optional)
      await this.createFirstTask();

      // Step 9: Show Summary
      await this.showSummary();

    } catch (error) {
      if (error.message === 'User cancelled') {
        console.log('\n👋 Setup cancelled. Come back anytime by running: autopm guide');
      } else {
        console.error(chalk.red('\n❌ Setup interrupted:'), error.message);
        console.log('\nYou can restart the guide anytime with: autopm guide');
      }
      process.exit(error.message === 'User cancelled' ? 0 : 1);
    }
  }

  async showWelcome() {
    console.clear();
    console.log(chalk.cyan(`
╔═══════════════════════════════════════════════╗
║                                               ║
║     Welcome to ClaudeAutoPM                  ║
║     Interactive Setup Guide                   ║
║                                               ║
╚═══════════════════════════════════════════════╝
`));

    console.log(chalk.gray('This guide will help you:'));
    console.log('  • Choose or create project folder');
    console.log('  • Set up project details');
    console.log('  • Select project management provider (GitHub/Azure)');
    console.log('  • Configure version control if needed');
    console.log('  • Install ClaudeAutoPM framework');
    console.log('  • Create your first PRD or task');
    console.log('  • Learn the complete workflow\n');

    const { continue: shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'continue',
        message: 'Ready to set up ClaudeAutoPM?',
        default: true
      }
    ]);

    if (!shouldContinue) {
      throw new Error('User cancelled');
    }
  }

  async verifyDependencies() {
    console.log(chalk.cyan('\n📋 Checking Dependencies...\n'));

    const dependencies = [
      { name: 'Git', command: 'git --version', required: true },
      { name: 'Node.js', command: 'node --version', required: true },
      { name: 'npm', command: 'npm --version', required: true }
    ];

    let hasErrors = false;

    for (const dep of dependencies) {
      const isInstalled = await this.checkCommand(dep.command);
      if (isInstalled) {
        console.log(chalk.green(`  ✓ ${dep.name} is installed`));
      } else {
        console.log(chalk.red(`  ✗ ${dep.name} is not found`));
        if (dep.required) hasErrors = true;
      }
    }

    if (hasErrors) {
      console.log(chalk.yellow('\n⚠️  Some required dependencies are missing.'));
      console.log('Please install them before continuing.\n');

      const { continue: shouldContinue } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continue',
          message: 'Continue anyway?',
          default: false
        }
      ]);

      if (!shouldContinue) {
        throw new Error('User cancelled');
      }
    } else {
      console.log(chalk.green('\n✅ All dependencies are installed!\n'));
    }
  }

  async checkCommand(command) {
    return new Promise((resolve) => {
      exec(command, (error) => {
        resolve(!error);
      });
    });
  }

  async resetConfiguration() {
    console.log(chalk.yellow('\n⚠️  Resetting configuration...\n'));

    try {
      // Remove existing configuration files
      await fs.remove(this.configPath);
      await fs.remove(this.envPath);
      console.log(chalk.green('  ✓ Configuration reset successfully'));
    } catch (error) {
      console.log(chalk.gray('  No existing configuration found'));
    }
  }

  async chooseProjectLocation() {
    console.log(chalk.cyan('\n📁 Project Location\n'));

    const currentDir = process.cwd();
    const currentDirName = path.basename(currentDir);

    const { location } = await inquirer.prompt([
      {
        type: 'input',
        name: 'location',
        message: `Where should the project be located? (Enter for current: ${currentDirName})`,
        default: '.',
        validate: (input) => {
          if (!input || input === '.') return true;
          // Check if path is valid
          try {
            const resolvedPath = path.resolve(input);
            return true;
          } catch (error) {
            return 'Please enter a valid path';
          }
        }
      }
    ]);

    if (location && location !== '.') {
      // Create directory if it doesn't exist
      const projectPath = path.resolve(location);

      if (!fs.existsSync(projectPath)) {
        const { createDir } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'createDir',
            message: `Directory '${location}' doesn't exist. Create it?`,
            default: true
          }
        ]);

        if (createDir) {
          await fs.ensureDir(projectPath);
          console.log(chalk.green(`  ✓ Created directory: ${projectPath}`));
        } else {
          throw new Error('User cancelled - directory not created');
        }
      }

      // Change to the project directory
      process.chdir(projectPath);
      this.projectPath = projectPath;
      this.configPath = path.join(projectPath, '.claude', 'config.json');
      this.envPath = path.join(projectPath, '.claude', '.env');
      console.log(chalk.green(`  ✓ Working in: ${projectPath}`));
    } else {
      console.log(chalk.green(`  ✓ Using current directory: ${currentDir}`));
    }
  }

  async getProjectDetails() {
    console.log(chalk.cyan('\n📝 Project Details\n'));

    const defaultName = path.basename(this.projectPath || process.cwd());

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'projectName',
        message: 'Enter your project name:',
        default: defaultName,
        validate: (input) => input.length > 0 ? true : 'Project name is required'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Enter project description:',
        default: 'A project managed with ClaudeAutoPM'
      }
    ]);

    this.projectName = answers.projectName;
    this.projectDescription = answers.description;

    console.log(chalk.green(`\n  ✓ Project: ${this.projectName}`));
    console.log(chalk.gray(`  ${this.projectDescription}`));
  }

  async setupVersionControl() {
    console.log(chalk.cyan('\n🔧 Version Control Setup\n'));

    // Only setup git if using GitHub provider
    if (this.config.provider === 'github') {
      // Check if we're in an existing git repository
      const gitExists = await this.checkCommand('git rev-parse --git-dir 2>/dev/null');

      if (!gitExists) {
        console.log(chalk.yellow('⚠️  GitHub requires a git repository'));

        const { initGit } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'initGit',
            message: 'Initialize a new git repository?',
            default: true
          }
        ]);

        if (initGit) {
          // Initialize git repository
          try {
            execSync('git init', { stdio: 'pipe' });
            console.log(chalk.green('  ✓ Git repository initialized'));

            // Create initial .gitignore
            const gitignoreContent = `# Dependencies
node_modules/

# Environment
.env
.env.local
.claude/.env

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/

# Logs
*.log
npm-debug.log*

# ClaudeAutoPM
.claude/epics/
.claude/prds/
.claude/*.backup-*
`;
            await fs.writeFile('.gitignore', gitignoreContent);
            execSync('git add .gitignore', { stdio: 'pipe' });
            execSync('git commit -m "Initial commit - ClaudeAutoPM setup"', { stdio: 'pipe' });
            console.log(chalk.green('  ✓ Initial commit created'));
          } catch (error) {
            console.log(chalk.yellow('  ⚠️  Could not initialize git repository'));
            console.log(chalk.gray('  You may need to initialize it manually later'));
          }
        } else {
          console.log(chalk.yellow('  ⚠️  Skipping git initialization'));
          console.log(chalk.gray('  You\'ll need to set up git manually to use GitHub features'));
        }
      } else {
        console.log(chalk.green('  ✓ Git repository already exists'));
      }
    } else if (this.config.provider === 'azure') {
      console.log(chalk.gray('  Azure DevOps can work with or without local git'));

      // Optional git setup for Azure
      const gitExists = await this.checkCommand('git rev-parse --git-dir 2>/dev/null');
      if (!gitExists) {
        const { wantGit } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'wantGit',
            message: 'Would you like to initialize git for version control? (optional)',
            default: false
          }
        ]);

        if (wantGit) {
          try {
            execSync('git init', { stdio: 'pipe' });
            console.log(chalk.green('  ✓ Git repository initialized'));
          } catch (error) {
            console.log(chalk.yellow('  ⚠️  Could not initialize git repository'));
          }
        }
      } else {
        console.log(chalk.green('  ✓ Git repository already exists'));
      }
    } else {
      // No provider selected or 'none'
      console.log(chalk.gray('  Skipping version control setup (no provider selected)'));
    }
  }

  async installFramework() {
    console.log(chalk.cyan('\n📦 Installing ClaudeAutoPM Framework\n'));

    const claudeExists = await fs.pathExists(path.join(process.cwd(), '.claude'));

    if (claudeExists) {
      console.log(chalk.green('  ✓ ClaudeAutoPM already installed'));

      // Check if CLAUDE.md exists
      const claudeMdExists = await fs.pathExists(path.join(process.cwd(), 'CLAUDE.md'));
      if (!claudeMdExists) {
        await this.generateClaudeMd();
      }
      return;
    }

    const { installNow } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'installNow',
        message: 'Install ClaudeAutoPM framework in this project?',
        default: true
      }
    ]);

    if (!installNow) {
      console.log(chalk.yellow('  ⚠️  Skipping framework installation'));
      console.log(chalk.gray('  You can install it later with: autopm install'));
      return;
    }

    // Show scenario explanations
    console.log(chalk.cyan('\n📋 Installation Scenarios Explained:\n'));

    // Quick comparison
    console.log(chalk.gray('┌─────────────┬──────────────┬───────────┬──────────┬────────────┐'));
    console.log(chalk.gray('│ Scenario    │ Complexity   │ Speed     │ Features │ Best For   │'));
    console.log(chalk.gray('├─────────────┼──────────────┼───────────┼──────────┼────────────┤'));
    console.log(chalk.gray('│ Minimal     │ ⭐           │ Fast      │ Basic    │ Learning   │'));
    console.log(chalk.gray('│ Docker      │ ⭐⭐         │ Moderate  │ Container│ Microservices│'));
    console.log(chalk.gray('│ ') + chalk.green('Full DevOps') + chalk.gray(' │ ⭐⭐⭐       │ Adaptive  │ ') + chalk.green('All') + chalk.gray('      │ ') + chalk.green('Production') + chalk.gray(' │'));
    console.log(chalk.gray('│ Performance │ ⭐⭐⭐⭐     │ ') + chalk.yellow('Parallel') + chalk.gray('  │ Advanced │ Large Apps │'));
    console.log(chalk.gray('│ Custom      │ ⭐⭐⭐⭐⭐   │ Variable  │ Custom   │ Special    │'));
    console.log(chalk.gray('└─────────────┴──────────────┴───────────┴──────────┴────────────┘\n'));

    console.log(chalk.yellow('1. Minimal') + chalk.gray(' - Best for:'));
    console.log(chalk.gray('   • Small personal projects (< 10 files)'));
    console.log(chalk.gray('   • Learning ClaudeAutoPM basics'));
    console.log(chalk.gray('   • Simple scripts and utilities'));
    console.log(chalk.gray('   • Projects without CI/CD needs\n'));

    console.log(chalk.yellow('2. Docker-only') + chalk.gray(' - Best for:'));
    console.log(chalk.gray('   • Microservices and containerized apps'));
    console.log(chalk.gray('   • Projects requiring consistent environments'));
    console.log(chalk.gray('   • Teams using Docker for development'));
    console.log(chalk.gray('   • Cloud-native applications\n'));

    console.log(chalk.green('3. Full DevOps (RECOMMENDED)') + chalk.gray(' - Best for:'));
    console.log(chalk.gray('   • Production applications'));
    console.log(chalk.gray('   • Team projects with CI/CD pipelines'));
    console.log(chalk.gray('   • Enterprise software development'));
    console.log(chalk.gray('   • Projects needing all automation features\n'));

    console.log(chalk.yellow('4. Performance') + chalk.gray(' - Best for:'));
    console.log(chalk.gray('   • Large codebases (1000+ files)'));
    console.log(chalk.gray('   • High-performance computing projects'));
    console.log(chalk.gray('   • Teams with powerful development machines'));
    console.log(chalk.gray('   • Projects requiring maximum parallelization\n'));

    console.log(chalk.yellow('5. Custom') + chalk.gray(' - Best for:'));
    console.log(chalk.gray('   • Unique project requirements'));
    console.log(chalk.gray('   • Hybrid cloud/on-premise setups'));
    console.log(chalk.gray('   • Projects with specific compliance needs'));
    console.log(chalk.gray('   • Advanced users who want full control\n'));

    // Ask for installation scenario
    const { scenario } = await inquirer.prompt([
      {
        type: 'list',
        name: 'scenario',
        message: 'Choose your installation scenario:',
        choices: [
          { name: chalk.green('Full DevOps (RECOMMENDED)') + ' - All features, CI/CD, team collaboration', value: 3 },
          { name: chalk.yellow('Docker-only') + ' - Containerized development, microservices', value: 2 },
          { name: chalk.yellow('Minimal') + ' - Simple projects, learning, basic features', value: 1 },
          { name: chalk.yellow('Performance') + ' - Large codebases, maximum speed', value: 4 },
          { name: chalk.gray('Custom') + ' - Configure everything manually', value: 5 }
        ],
        default: 3
      }
    ]);

    // Store the scenario for later use in the installation
    this.installationScenario = scenario;

    try {
      console.log(chalk.gray('  Installing framework files...'));

      // Run autopm install with selected scenario
      const installScript = require('../node/install.js');
      await installScript.run(scenario);

      console.log(chalk.green('\n  ✓ ClaudeAutoPM framework installed successfully'));

      // Generate CLAUDE.md if not created by install
      const claudeMdExists = await fs.pathExists(path.join(process.cwd(), 'CLAUDE.md'));
      if (!claudeMdExists) {
        await this.generateClaudeMd();
      }
    } catch (error) {
      console.log(chalk.yellow('\n  ⚠️  Could not install framework automatically'));
      console.log(chalk.gray('  Please run manually: autopm install'));
    }
  }

  async generateClaudeMd() {
    console.log(chalk.cyan('\n📝 Generating CLAUDE.md\n'));

    const projectName = this.projectName || path.basename(process.cwd());
    const projectDescription = this.projectDescription || 'A project managed with ClaudeAutoPM';
    const repoUrl = this.config.provider === 'github' && this.config.github
      ? `https://github.com/${this.config.github.repository}`
      : this.config.provider === 'azure' && this.config.azure
      ? `https://dev.azure.com/${this.config.azure.organization}/${this.config.azure.project}`
      : 'https://github.com/your-org/your-repo';

    const claudeMdContent = `# ${projectName}

${projectDescription}

> Project managed by ClaudeAutoPM framework
> Repository: ${repoUrl}

## Project Overview

This project uses ClaudeAutoPM for automated project management and AI-assisted development.

## Quick Start

1. **View project status**: \`/pm:status\`
2. **Create new feature**: \`/pm:prd-new feature-name\`
3. **Get next task**: \`/pm:next\`
4. **View all commands**: \`/pm:help\`

## Project Structure

\`\`\`
${projectName}/
├── .claude/              # ClaudeAutoPM configuration
│   ├── agents/          # AI agents for specialized tasks
│   ├── commands/        # PM commands
│   ├── rules/           # Development rules
│   └── strategies/      # Execution strategies
├── src/                 # Source code
├── test/                # Test files
└── CLAUDE.md           # This file - project context
\`\`\`

## Development Workflow

1. **Create PRD**: Define what you want to build
   - \`/pm:prd-new feature-name\`

2. **Parse to Epic**: Convert PRD to actionable tasks
   - \`/pm:prd-parse feature-name\`

3. **Start Working**: Pick up tasks
   - \`/pm:issue-start task-id\`

4. **Sync Progress**: Update GitHub
   - \`/pm:issue-sync task-id\`

## Configuration

- **Provider**: ${this.config.provider || 'github'}
- **Repository**: ${this.config.github?.repository || 'Not configured'}
- **Config File**: \`.claude/config.json\`
- **Credentials**: \`.claude/.env\`

## Available Agents

The project includes 50+ specialized AI agents:
- \`@python-backend-engineer\` - Python development
- \`@react-frontend-engineer\` - React components
- \`@test-runner\` - Run and analyze tests
- \`@code-analyzer\` - Code review and optimization
- And many more in \`.claude/agents/\`

## Testing

\`\`\`bash
# Run tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
\`\`\`

## Contributing

1. Create feature branch
2. Make changes with TDD
3. Run tests
4. Create PR with detailed description

## Support

- Documentation: https://github.com/rafeekpro/ClaudeAutoPM
- Issues: https://github.com/rafeekpro/ClaudeAutoPM/issues

---

Generated by ClaudeAutoPM - ${new Date().toISOString()}
`;

    try {
      await fs.writeFile(path.join(process.cwd(), 'CLAUDE.md'), claudeMdContent);
      console.log(chalk.green('  ✓ CLAUDE.md created successfully'));
      console.log(chalk.gray('  This file provides context for Claude Code about your project'));
    } catch (error) {
      console.log(chalk.yellow('  ⚠️  Could not create CLAUDE.md'));
      console.log(chalk.gray('  You can create it manually later'));
    }
  }

  async configureProvider() {
    console.log(chalk.cyan('\n⚙️  Provider Configuration\n'));

    const { provider } = await inquirer.prompt([
      {
        type: 'list',
        name: 'provider',
        message: 'Which project management provider do you use?',
        choices: [
          { name: 'GitHub Issues', value: 'github' },
          { name: 'Azure DevOps', value: 'azure' },
          { name: 'Skip for now', value: 'skip' }
        ]
      }
    ]);

    if (provider === 'skip') {
      this.config.provider = 'none';
      return;
    }

    this.config.provider = provider;

    if (provider === 'github') {
      await this.configureGitHub();
    } else if (provider === 'azure') {
      await this.configureAzure();
    }

    // Save configuration
    await this.saveConfiguration();
  }

  async configureGitHub() {
    console.log(chalk.cyan('\n🔐 GitHub Configuration\n'));
    console.log(chalk.gray('To use GitHub integration, you need:'));
    console.log('  1. A GitHub repository (we can help create one)');
    console.log('  2. A Personal Access Token for API access\n');

    console.log(chalk.yellow('💡 How to get a GitHub Personal Access Token:'));
    console.log(chalk.gray('  1. Go to: ') + chalk.cyan('https://github.com/settings/tokens'));
    console.log(chalk.gray('  2. Click "Generate new token (classic)"'));
    console.log(chalk.gray('  3. Name it: "ClaudeAutoPM"'));
    console.log(chalk.gray('  4. Select scopes: ') + chalk.yellow('repo, workflow'));
    console.log(chalk.gray('  5. Click "Generate token" and copy it'));
    console.log(chalk.gray('  6. Save it securely - you won\'t see it again!\n'));

    // First ask for username
    let { githubUsername } = await inquirer.prompt([
      {
        type: 'input',
        name: 'githubUsername',
        message: 'Enter your GitHub username:',
        validate: (input) => {
          if (!input) return 'GitHub username is required';
          if (!/^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/.test(input)) {
            return 'Invalid GitHub username format';
          }
          return true;
        }
      }
    ]);

    // Generate a sensible repository name based on current directory
    const currentDirName = path.basename(process.cwd()).toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '')
      .replace(/^-+|-+$/g, '');
    const suggestedRepoName = currentDirName || this.projectName || 'my-project';

    // Then ask for repository name with suggestion
    const { repoName, githubToken } = await inquirer.prompt([
      {
        type: 'input',
        name: 'repoName',
        message: 'Enter repository name:',
        default: suggestedRepoName,
        validate: (input) => {
          if (!input) return 'Repository name is required';
          if (!/^[a-zA-Z0-9._-]+$/.test(input)) {
            return 'Repository name can only contain letters, numbers, dots, hyphens, and underscores';
          }
          return true;
        }
      },
      {
        type: 'password',
        name: 'githubToken',
        message: 'GitHub Personal Access Token (press Enter to skip and add later):',
        validate: (input) => {
          if (!input) return true; // Allow empty

          // GitHub token formats (with flexible lengths based on real-world tokens):
          // Classic PAT: ghp_ followed by 36-40 alphanumeric characters
          // Fine-grained PAT: github_pat_ followed by 82+ alphanumeric characters
          // OAuth: gho_ followed by 36-40 alphanumeric characters
          // User-to-server: ghu_ followed by 36-40 alphanumeric characters
          // Server-to-server: ghs_ followed by 36-40 alphanumeric characters
          // Refresh token: ghr_ followed by 36-40 alphanumeric characters

          const tokenPatterns = {
            'ghp_': { minLength: 36, maxLength: 40, name: 'Classic Personal Access Token' },
            'github_pat_': { minLength: 82, maxLength: 100, name: 'Fine-grained Personal Access Token' },
            'gho_': { minLength: 36, maxLength: 40, name: 'OAuth Access Token' },
            'ghu_': { minLength: 36, maxLength: 40, name: 'User-to-Server Token' },
            'ghs_': { minLength: 36, maxLength: 40, name: 'Server-to-Server Token' },
            'ghr_': { minLength: 36, maxLength: 40, name: 'Refresh Token' }
          };

          let tokenType = null;
          let minExpectedLength = 0;
          let maxExpectedLength = 0;
          let matchedPrefix = null;

          for (const [prefix, info] of Object.entries(tokenPatterns)) {
            if (input.startsWith(prefix)) {
              tokenType = info.name;
              minExpectedLength = prefix.length + info.minLength;
              maxExpectedLength = prefix.length + info.maxLength;
              matchedPrefix = prefix;
              break;
            }
          }

          if (!tokenType) {
            return 'Invalid token format. GitHub tokens should start with: ghp_, github_pat_, gho_, ghu_, ghs_, or ghr_';
          }

          if (input.length < minExpectedLength || input.length > maxExpectedLength) {
            return `Invalid ${tokenType} length. Expected ${minExpectedLength}-${maxExpectedLength} characters, got ${input.length}`;
          }

          // Check if the token contains only valid characters (alphanumeric and underscore)
          const tokenBody = input.substring(matchedPrefix.length);
          if (!/^[A-Za-z0-9_]+$/.test(tokenBody)) {
            return 'Token contains invalid characters. Only letters, numbers, and underscores are allowed after the prefix';
          }

          console.log(chalk.gray(`\n  Detected: ${tokenType}`));
          return true;
        }
      }
    ]);

    let fullRepoPath = `${githubUsername}/${repoName}`;

    console.log(chalk.gray(`\n  Repository will be: `) + chalk.cyan(`https://github.com/${fullRepoPath}`));

    // Test the token if provided
    if (githubToken) {
      process.stdout.write(chalk.gray('\n  Testing GitHub connection...'));

      try {
        // Test token by getting authenticated user info
        const testCommand = 'gh api user --jq .login';
        const env = { ...process.env, GITHUB_TOKEN: githubToken };
        const authenticatedUser = execSync(testCommand, { env, stdio: 'pipe', encoding: 'utf-8' }).trim();

        process.stdout.clearLine();
        process.stdout.cursorTo(0);

        if (authenticatedUser.toLowerCase() !== githubUsername.toLowerCase()) {
          console.log(chalk.yellow(`\n⚠️  Token belongs to user '${authenticatedUser}', but you entered '${githubUsername}'`));

          const { useTokenUser } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'useTokenUser',
              message: `Use '${authenticatedUser}' as the GitHub username instead?`,
              default: true
            }
          ]);

          if (useTokenUser) {
            githubUsername = authenticatedUser;
            fullRepoPath = `${githubUsername}/${repoName}`;
            console.log(chalk.gray(`  Updated repository: `) + chalk.cyan(`https://github.com/${fullRepoPath}`));
          } else {
            console.log(chalk.yellow(`  ⚠️  Continuing with mismatched username. Repository operations may fail.`));
          }
        } else {
          console.log(chalk.green(`✓ Token validated for user: ${authenticatedUser}`));
        }

        // Check token scopes
        const scopeCommand = 'gh api user --include';
        const scopeResult = execSync(scopeCommand, { env, stdio: 'pipe', encoding: 'utf-8' });

        // Extract X-OAuth-Scopes header from the response
        const scopeMatch = scopeResult.match(/X-OAuth-Scopes: ([^\r\n]*)/i);
        if (scopeMatch) {
          const scopes = scopeMatch[1].split(', ').filter(s => s);

          const requiredScopes = ['repo'];
          const hasRequiredScopes = requiredScopes.every(scope =>
            scopes.some(s => s === scope || s.startsWith(scope + ':'))
          );

          if (!hasRequiredScopes) {
            console.log(chalk.yellow(`\n⚠️  Token missing required scopes`));
            console.log(chalk.gray(`  Current scopes: ${scopes.join(', ') || 'none'}`));
            console.log(chalk.gray(`  Required: repo`));
            console.log(chalk.gray(`  Some operations may fail. Generate a new token with correct scopes.`));
          } else {
            console.log(chalk.gray(`  Token scopes: ${scopes.join(', ')}`));
          }
        }

      } catch (error) {
        process.stdout.clearLine();
        process.stdout.cursorTo(0);

        const errorMessage = error.stderr ? error.stderr.toString() : error.message;

        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
          console.log(chalk.red(`\n❌ Invalid token - authentication failed`));
          console.log(chalk.gray(`  The token is not valid or has been revoked`));
          githubToken = ''; // Clear invalid token
        } else if (errorMessage.includes('gh: command not found')) {
          console.log(chalk.yellow(`\n⚠️  GitHub CLI not installed - cannot validate token`));
          console.log(chalk.gray(`  Install from: https://cli.github.com`));
        } else if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
          console.log(chalk.yellow(`\n⚠️  Token lacks required permissions`));
          console.log(chalk.gray(`  Generate a new token with 'repo' scope`));
        } else {
          console.log(chalk.yellow(`\n⚠️  Could not validate token`));
          console.log(chalk.gray(`  Error: ${errorMessage}`));
        }
      }
    }

    const answers = {
      githubRepo: fullRepoPath,
      githubToken
    };

    this.config.github = {
      token: answers.githubToken || '',
      repository: answers.githubRepo
    };

    // Check if repository exists and offer to create it
    if (answers.githubToken) {
      try {
        // Check if repo exists using gh CLI
        const checkCommand = `gh repo view ${answers.githubRepo} --json name`;
        const env = { ...process.env, GITHUB_TOKEN: answers.githubToken };

        try {
          const result = execSync(checkCommand, { env, stdio: 'pipe', encoding: 'utf-8' });
          console.log(chalk.green(`\n✓ Repository ${answers.githubRepo} exists and is accessible`));
        } catch (checkError) {
          // Repo doesn't exist or other error, offer to create it
          const checkErrorMessage = checkError.stderr ? checkError.stderr.toString() : '';

          if (checkErrorMessage.includes('Could not resolve to a Repository') || checkErrorMessage.includes('404')) {
            // Repository doesn't exist - expected case
            const { createRepo } = await inquirer.prompt([
              {
                type: 'confirm',
                name: 'createRepo',
                message: `Repository ${answers.githubRepo} not found. Create it?`,
                default: true
              }
            ]);

          if (createRepo) {
            try {
              const [owner, repoName] = answers.githubRepo.split('/');
              // Remove deprecated --confirm flag, use 'y' as input instead
              const createCommand = `echo y | gh repo create ${answers.githubRepo} --public --description "${this.projectDescription || 'Project managed with ClaudeAutoPM'}"`;

              // Show the command being run in verbose mode
              if (process.env.VERBOSE || process.env.DEBUG) {
                console.log(chalk.gray('\n  Running command: ') + chalk.blue(createCommand));
              }

              execSync(createCommand, { env, stdio: 'pipe', encoding: 'utf-8', shell: true });
              console.log(chalk.green(`✓ Repository created: https://github.com/${answers.githubRepo}`));

              // Set up git remote if in a git repo
              const gitExists = await this.checkCommand('git rev-parse --git-dir 2>/dev/null');
              if (gitExists) {
                try {
                  execSync(`git remote add origin https://github.com/${answers.githubRepo}.git`, { stdio: 'pipe' });
                  console.log(chalk.green(`✓ Git remote 'origin' added`));
                } catch (e) {
                  // Remote might already exist
                  console.log(chalk.gray(`  Git remote already configured`));
                }
              }
            } catch (error) {
              console.log(chalk.red('\n❌ Repository creation failed'));

              // Extract and display the actual error message
              const errorMessage = error.stderr ? error.stderr.toString() : error.message;
              console.log(chalk.yellow('  Error details: ') + chalk.gray(errorMessage));

              // Provide helpful troubleshooting based on common errors
              if (errorMessage.includes('already exists')) {
                console.log(chalk.yellow('\n📝 This repository already exists'));
                console.log(chalk.gray('  Options:'));
                console.log(chalk.gray('  1. Use a different repository name'));
                console.log(chalk.gray('  2. Delete the existing repository first'));
                console.log(chalk.gray('  3. Use the existing repository'));
              } else if (errorMessage.includes('authentication') || errorMessage.includes('401') || errorMessage.includes('403')) {
                console.log(chalk.yellow('\n🔑 Authentication issue detected'));
                console.log(chalk.gray('  Possible causes:'));
                console.log(chalk.gray('  1. Invalid or expired token'));
                console.log(chalk.gray('  2. Token lacks required permissions (needs "repo" scope)'));
                console.log(chalk.gray('  3. Token belongs to different account than username provided'));
                console.log(chalk.cyan('\n  Get a new token at: https://github.com/settings/tokens'));
              } else if (errorMessage.includes('gh: command not found')) {
                console.log(chalk.yellow('\n⚙️  GitHub CLI not installed'));
                console.log(chalk.gray('  Install it from: ') + chalk.cyan('https://cli.github.com'));
              } else {
                console.log(chalk.gray('\n  Manual creation: ') + chalk.cyan('https://github.com/new'));
              }
            }
          }
          } else {
            // Other error during repository check
            console.log(chalk.yellow('\n⚠️  Could not check repository status'));
            console.log(chalk.gray('  Error: ') + chalk.red(checkErrorMessage));

            if (checkErrorMessage.includes('authentication') || checkErrorMessage.includes('401') || checkErrorMessage.includes('403')) {
              console.log(chalk.yellow('\n🔑 Authentication issue detected'));
              console.log(chalk.gray('  Please verify your token has the correct permissions'));
            }
          }
        }
      } catch (error) {
        console.log(chalk.yellow('\n⚠️  Could not verify repository (gh CLI may not be installed)'));
        console.log(chalk.gray('  Install gh CLI: ') + chalk.cyan('https://cli.github.com'));
      }
    } else {
      console.log(chalk.yellow('\n⚠️  Without a token, we cannot verify or create the repository'));
      console.log(chalk.gray('  Add your token later to: .claude/.env'));
      console.log(chalk.gray('  Create repository manually at: ') + chalk.cyan('https://github.com/new'));
    }
  }

  async configureAzure() {
    console.log(chalk.cyan('\n🔐 Azure DevOps Configuration\n'));
    console.log(chalk.gray('To use Azure DevOps integration, you need:'));
    console.log('  1. Azure DevOps organization');
    console.log('  2. Project name');
    console.log('  3. Personal Access Token (PAT)\n');

    console.log(chalk.yellow('💡 How to get an Azure DevOps PAT:'));
    console.log(chalk.gray('  1. Go to your Azure DevOps organization'));
    console.log(chalk.gray('  2. Click User Settings (top right) → Personal Access Tokens'));
    console.log(chalk.gray('  3. Click "+ New Token"'));
    console.log(chalk.gray('  4. Name it: "ClaudeAutoPM"'));
    console.log(chalk.gray('  5. Set expiration (recommend 90 days)'));
    console.log(chalk.gray('  6. Select scopes: ') + chalk.yellow('Work Items (Read & Write), Code (Read & Write)'));
    console.log(chalk.gray('  7. Click "Create" and copy the token'));
    console.log(chalk.gray('  8. Save it securely - you won\'t see it again!\n'));

    // First ask for organization name
    const { azureOrg } = await inquirer.prompt([
      {
        type: 'input',
        name: 'azureOrg',
        message: 'Enter your Azure DevOps organization name:',
        validate: (input) => {
          if (!input) return 'Organization name is required';
          // Azure DevOps org names can contain letters, numbers, and hyphens
          if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,48}[a-zA-Z0-9])?$/.test(input)) {
            return 'Invalid organization name format (letters, numbers, hyphens only)';
          }
          return true;
        }
      }
    ]);

    // Generate a sensible project name based on current directory
    const currentDirName = path.basename(process.cwd())
      .replace(/\s+/g, '-')
      .replace(/[^a-zA-Z0-9-_]/g, '')
      .replace(/^-+|-+$/g, '');
    const suggestedProjectName = currentDirName || this.projectName || 'MyProject';

    // Then ask for project name with suggestion
    const { azureProject, azureToken } = await inquirer.prompt([
      {
        type: 'input',
        name: 'azureProject',
        message: 'Enter project name:',
        default: suggestedProjectName,
        validate: (input) => {
          if (!input) return 'Project name is required';
          // Azure DevOps project names are more flexible but let's keep it simple
          if (input.length > 64) {
            return 'Project name must be 64 characters or less';
          }
          return true;
        }
      },
      {
        type: 'password',
        name: 'azureToken',
        message: 'Azure DevOps PAT (press Enter to skip and add later):',
        validate: (input) => true // Allow empty
      }
    ]);

    console.log(chalk.gray(`\n  Project URL will be: `) + chalk.cyan(`https://dev.azure.com/${azureOrg}/${azureProject}`));

    const answers = {
      azureOrg,
      azureProject,
      azureToken
    };

    this.config.azure = {
      token: answers.azureToken || '',
      organization: answers.azureOrg,
      project: answers.azureProject
    };

    if (answers.azureToken) {
      console.log(chalk.green(`\n✓ Azure DevOps configured for ${answers.azureOrg}/${answers.azureProject}`));
      console.log(chalk.gray('  Note: Project creation must be done through Azure DevOps web interface'));
    } else {
      console.log(chalk.yellow('\n⚠️  Without a PAT, we cannot verify the Azure project'));
      console.log(chalk.gray('  Add your PAT later to: .claude/.env'));
    }

    console.log(chalk.cyan('\n📁 To create a new Azure DevOps project:'));
    console.log(chalk.gray('  1. Go to: ') + chalk.cyan(`https://dev.azure.com/${answers.azureOrg}`));
    console.log(chalk.gray('  2. Click "+ New project"'));
    console.log(chalk.gray(`  3. Name it: "${answers.azureProject}"`) );
    console.log(chalk.gray('  4. Set visibility (Public/Private)'));
    console.log(chalk.gray('  5. Click "Create"\n'));
  }

  validateGitHubToken(input) {
    // Allow empty for optional token
    if (!input) return true;
    if (!input.startsWith('ghp_') && !input.startsWith('github_pat_')) {
      return 'Invalid GitHub token format (should start with ghp_ or github_pat_)';
    }
    return true;
  }

  validateAzureToken(input) {
    // Allow empty for optional token
    return true;
  }

  async saveConfiguration() {
    try {
      // Ensure .claude directory exists
      await fs.ensureDir(path.dirname(this.configPath));

      // Save config.json
      const configData = {
        projectManagement: {
          provider: this.config.provider || 'github',
          defaultLabels: ['autopm'],
          autoSync: true
        },
        features: {
          docker_first_development: true,
          docker_compose_required: false,
          parallel_execution: true,
          context_isolation: true
        }
      };

      await fs.writeJson(this.configPath, configData, { spaces: 2 });

      // Save .env file with credentials
      let envContent = '';

      if (this.config.provider === 'github' && this.config.github) {
        envContent += `# GitHub Configuration\n`;
        envContent += `GITHUB_TOKEN=${this.config.github.token}\n`;
        envContent += `GITHUB_REPOSITORY=${this.config.github.repository}\n`;
        envContent += `GITHUB_OWNER=${this.config.github.repository.split('/')[0]}\n`;
        envContent += `GITHUB_REPO=${this.config.github.repository.split('/')[1]}\n\n`;
      } else if (this.config.provider === 'azure' && this.config.azure) {
        envContent += `# Azure DevOps Configuration\n`;
        envContent += `AZURE_DEVOPS_PAT=${this.config.azure.token}\n`;
        envContent += `AZURE_DEVOPS_ORG=${this.config.azure.organization}\n`;
        envContent += `AZURE_DEVOPS_PROJECT=${this.config.azure.project}\n\n`;
      }

      envContent += `# Environment\n`;
      envContent += `NODE_ENV=development\n`;
      envContent += `DEBUG=false\n`;

      await fs.writeFile(this.envPath, envContent);

      console.log(chalk.green('\n✅ Configuration saved successfully!\n'));
      console.log(chalk.gray('  Config: .claude/config.json'));
      console.log(chalk.gray('  Credentials: .claude/.env'));

      // Now run the full ClaudeAutoPM installation to copy all framework files
      console.log(chalk.cyan('\n📦 Installing ClaudeAutoPM framework...\n'));

      try {
        // Get the path to the install script
        const autopmPath = require.resolve('claude-autopm/install/install.sh');
        const installScriptPath = path.join(path.dirname(autopmPath), 'install.sh');

        // Run the installation with the chosen scenario
        const installScenario = this.installationScenario || 3; // Default to Full DevOps

        // Since we already configured everything in the guide, skip the install script's prompts
        // Set environment to tell install script to skip interactive prompts
        const env = {
          ...process.env,
          AUTOPM_INSTALL_DIR: this.projectPath || process.cwd(),
          AUTOPM_SOURCE_DIR: path.dirname(path.dirname(autopmPath)),
          AUTOPM_SKIP_PROMPTS: 'true', // Skip all interactive prompts
          AUTOPM_SCENARIO: String(installScenario), // Pass scenario via env
          AUTOPM_PROVIDER: this.config.provider || 'github' // Pass provider choice
        };

        // Just run the install script without piping input
        const installCommand = `bash ${installScriptPath}`;

        console.log(chalk.gray('  Installing agents, commands, rules, scripts...'));

        execSync(installCommand, {
          stdio: 'inherit',
          cwd: this.projectPath || process.cwd(),
          env
        });

        console.log(chalk.green('\n✅ ClaudeAutoPM framework installed successfully!'));
        console.log(chalk.gray('  • Agents: .claude/agents/'));
        console.log(chalk.gray('  • Commands: .claude/commands/'));
        console.log(chalk.gray('  • Rules: .claude/rules/'));
        console.log(chalk.gray('  • Scripts: scripts/'));
        console.log(chalk.gray('  • Strategies: .claude/strategies/'));
      } catch (installError) {
        // If the first method fails, try a simpler approach
        console.log(chalk.yellow('  Trying alternative installation method...'));

        try {
          // Try running the local install script if available
          const localInstallPath = path.join(__dirname, '../../install/install.sh');
          if (require('fs').existsSync(localInstallPath)) {
            const installScenario = this.installationScenario || 3;

            // Skip prompts since we already configured everything
            const env = {
              ...process.env,
              AUTOPM_SOURCE_DIR: path.join(__dirname, '../..'),
              AUTOPM_SKIP_PROMPTS: 'true',
              AUTOPM_SCENARIO: String(installScenario),
              AUTOPM_PROVIDER: this.config.provider || 'github'
            };

            execSync(`bash ${localInstallPath}`, {
              stdio: 'inherit',
              cwd: this.projectPath || process.cwd(),
              env
            });

            console.log(chalk.green('\n✅ ClaudeAutoPM framework installed successfully!'));
            console.log(chalk.gray('  • Agents: .claude/agents/'));
            console.log(chalk.gray('  • Commands: .claude/commands/'));
            console.log(chalk.gray('  • Rules: .claude/rules/'));
            console.log(chalk.gray('  • Scripts: scripts/'));
            console.log(chalk.gray('  • Strategies: .claude/strategies/'));
          } else {
            throw new Error('Installation script not found');
          }
        } catch (fallbackError) {
          console.log(chalk.yellow('\n⚠️  Could not complete automatic installation'));
          console.log(chalk.gray('  Please run manually after setup completes:'));
          console.log(chalk.cyan(`\n  npx claude-autopm install\n`));
          console.log(chalk.gray('  When prompted, select option: ') + chalk.yellow(this.installationScenario || 3));
        }
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Failed to save configuration:'), error.message);
      throw error;
    }
  }

  async createFirstTask() {
    if (this.config.provider === 'none' || !this.config.provider) {
      return;
    }

    // Explain the ClaudeAutoPM workflow
    console.log(chalk.cyan('\n🚀 ClaudeAutoPM Workflow\n'));
    console.log(chalk.gray('ClaudeAutoPM follows a structured workflow:'));
    console.log(chalk.gray('\n1. ') + chalk.yellow('Product Planning') + chalk.gray(' → Create PRD (Product Requirements Document)'));
    console.log(chalk.gray('2. ') + chalk.yellow('Technical Planning') + chalk.gray(' → Transform PRD into Epic'));
    console.log(chalk.gray('3. ') + chalk.yellow('Task Breakdown') + chalk.gray(' → Decompose Epic into Tasks'));
    console.log(chalk.gray('4. ') + chalk.yellow('Synchronization') + chalk.gray(' → Push to GitHub/Azure'));
    console.log(chalk.gray('5. ') + chalk.yellow('Execution') + chalk.gray(' → Work on Tasks with AI agents\n'));

    const { startWorkflow } = await inquirer.prompt([
      {
        type: 'list',
        name: 'startWorkflow',
        message: 'Would you like to start with:',
        choices: [
          { name: chalk.green('Create first PRD') + ' - Full workflow from planning to execution', value: 'prd' },
          { name: chalk.yellow('Create simple task') + ' - Quick task without planning', value: 'task' },
          { name: chalk.gray('Skip for now') + ' - I\'ll explore on my own', value: 'skip' }
        ],
        default: 'prd'
      }
    ]);

    if (startWorkflow === 'skip') {
      return;
    }

    if (startWorkflow === 'prd') {
      await this.createFirstPRD();
    } else {
      await this.createSimpleTask();
    }
  }

  async createFirstPRD() {
    console.log(chalk.cyan('\n📋 Create Your First PRD\n'));
    console.log(chalk.gray('A PRD (Product Requirements Document) defines what you want to build.'));
    console.log(chalk.gray('ClaudeAutoPM will help transform it into actionable tasks.\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'featureName',
        message: 'What would you like to build? (feature name):',
        default: 'user-authentication',
        validate: (input) => {
          if (!input || input.includes(' ')) {
            return 'Feature name should be kebab-case (e.g., user-auth)';
          }
          return true;
        }
      },
      {
        type: 'list',
        name: 'projectType',
        message: 'What type of project is this?',
        choices: [
          { name: 'Web Application', value: 'webapp' },
          { name: 'API/Backend Service', value: 'api' },
          { name: 'Mobile App', value: 'mobile' },
          { name: 'CLI Tool', value: 'cli' },
          { name: 'Library/Package', value: 'library' },
          { name: 'Other', value: 'other' }
        ],
        default: 'webapp'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Briefly describe what this feature does:',
        default: 'User registration, login, and session management'
      },
      {
        type: 'input',
        name: 'userStory',
        message: 'As a [user], I want to [action] so that [benefit]:',
        default: 'As a user, I want to register and login so that I can access protected features'
      }
    ]);

    console.log(chalk.cyan('\n📝 Creating PRD...\n'));

    try {
      // Create PRD directory
      const prdDir = path.join(process.cwd(), '.claude', 'prds');
      await fs.ensureDir(prdDir);

      // Generate PRD content
      const prdContent = `# ${answers.featureName} - Product Requirements Document

## Overview
${answers.description}

## User Story
${answers.userStory}

## Project Type
${answers.projectType}

## Requirements

### Functional Requirements
- [ ] User registration with email/password
- [ ] User login with session management
- [ ] Password reset functionality
- [ ] User profile management
- [ ] Logout functionality

### Non-Functional Requirements
- [ ] Secure password storage (bcrypt)
- [ ] JWT or session-based authentication
- [ ] Input validation and sanitization
- [ ] Rate limiting for auth endpoints
- [ ] GDPR compliance for user data

## Success Criteria
- Users can successfully register new accounts
- Users can login and maintain sessions
- Unauthorized access is properly restricted
- All security best practices are followed

## Technical Constraints
- Must integrate with existing database
- Should follow project's coding standards
- Must include comprehensive tests

## Timeline
- Planning: 1 day
- Implementation: 3-5 days
- Testing: 1-2 days
- Documentation: 1 day

## Notes
Created with ClaudeAutoPM guide wizard.
Next steps:
1. Run: /pm:prd-parse ${answers.featureName}
2. Run: /pm:epic-decompose ${answers.featureName}
3. Run: /pm:epic-sync ${answers.featureName}
`;

      // Save PRD
      const prdPath = path.join(prdDir, `${answers.featureName}.md`);
      await fs.writeFile(prdPath, prdContent);

      console.log(chalk.green('✅ PRD created successfully!\n'));
      console.log(chalk.gray(`  Location: .claude/prds/${answers.featureName}.md`));

      // Ask if user wants to open Claude Code
      const { openClaude } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'openClaude',
          message: 'Would you like to open Claude Code to work with this PRD?',
          default: true
        }
      ]);

      console.log(chalk.cyan('\n📚 Next Steps:\n'));

      if (openClaude) {
        console.log(chalk.yellow('  Opening Claude Code...'));
        console.log(chalk.gray('  Once open, run these commands:\n'));
      } else {
        console.log(chalk.gray('  In Claude Code, run these commands:\n'));
      }

      if (this.config.provider === 'github') {
        console.log(chalk.yellow(`  1. /pm:prd-parse ${answers.featureName}`));
        console.log(chalk.gray('     → Transforms PRD into technical Epic'));
        console.log(chalk.yellow(`\n  2. /pm:epic-decompose ${answers.featureName}`));
        console.log(chalk.gray('     → Breaks Epic into actionable tasks'));
        console.log(chalk.yellow(`\n  3. /pm:epic-sync ${answers.featureName}`));
        console.log(chalk.gray('     → Pushes tasks to GitHub'));
        console.log(chalk.yellow('\n  4. /pm:next'));
        console.log(chalk.gray('     → Get your first task to work on'));
      } else if (this.config.provider === 'azure') {
        console.log(chalk.yellow(`  1. /pm:prd-parse ${answers.featureName}`));
        console.log(chalk.gray('     → Transforms PRD into technical Epic'));
        console.log(chalk.yellow(`\n  2. /pm:epic-decompose ${answers.featureName}`));
        console.log(chalk.gray('     → Breaks Epic into actionable tasks'));
        console.log(chalk.yellow(`\n  3. /pm:azure-sync ${answers.featureName}`));
        console.log(chalk.gray('     → Creates Work Items in Azure DevOps'));
        console.log(chalk.yellow('\n  4. /pm:azure-next'));
        console.log(chalk.gray('     → Get your first task to work on'));

        console.log(chalk.cyan('\n  Or use CLI commands (outside Claude Code):'));
        console.log(chalk.gray(`  • Create epic: `) + chalk.yellow(`autopm azure:epic-new "${answers.featureName}"`));
        console.log(chalk.gray(`  • Create task: `) + chalk.yellow(`autopm azure:task-new "Task title"`));
        console.log(chalk.gray(`  • List tasks: `) + chalk.yellow(`autopm azure:task-list`));
      }

      if (openClaude) {
        try {
          // Try different methods to open Claude Code
          const openCommands = [
            'claude',  // If claude CLI is installed
            'open -a "Claude"',  // macOS
            'code .',  // VS Code as fallback
          ];

          let opened = false;
          for (const cmd of openCommands) {
            try {
              execSync(cmd, { stdio: 'ignore' });
              opened = true;
              console.log(chalk.green('\n  ✓ Editor opened successfully!'));
              break;
            } catch (e) {
              // Try next command
            }
          }

          if (!opened) {
            console.log(chalk.yellow('\n  ⚠️  Could not automatically open Claude Code'));
            console.log(chalk.gray('  Please open Claude Code manually and navigate to this project'));
          }
        } catch (error) {
          // Silent fail
        }
      }

      // Optionally create initial issue/work item
      if (this.config.provider === 'github' && this.config.github.token) {
        const { createIssue } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'createIssue',
            message: 'Create a GitHub issue to track this PRD?',
            default: true
          }
        ]);

        if (createIssue) {
          try {
            const repo = this.config.github.repository;
            const issueBody = `## 📋 Product Requirements Document

**Feature**: ${answers.featureName}
**Type**: ${answers.projectType}

### Description
${answers.description}

### User Story
${answers.userStory}

### Next Steps in Claude Code
After opening this project in Claude Code, run these commands:

1. Parse PRD to Epic: \`/pm:prd-parse ${answers.featureName}\`
2. Decompose to tasks: \`/pm:epic-decompose ${answers.featureName}\`
3. Sync to GitHub: \`/pm:epic-sync ${answers.featureName}\`

---
*Created with ClaudeAutoPM guide*`;

            // First try with labels, if that fails try without
            let command = `gh issue create --repo ${repo} --title "PRD: ${answers.featureName}" --body "${issueBody}"`;
            const env = { ...process.env, GITHUB_TOKEN: this.config.github.token };

            try {
              // Try with labels first
              const labelCommand = command + ` --label "prd,autopm"`;
              const result = execSync(labelCommand, { env, encoding: 'utf-8', stdio: 'pipe' });
              console.log(chalk.green('\n✅ GitHub issue created for PRD!'));
              console.log(chalk.gray(`  ${result.trim()}`));
            } catch (labelError) {
              // If labels don't exist, create without them
              try {
                const result = execSync(command, { env, encoding: 'utf-8' });
                console.log(chalk.green('\n✅ GitHub issue created for PRD!'));
                console.log(chalk.gray(`  ${result.trim()}`));
                console.log(chalk.gray('  Note: Labels "prd" and "autopm" were not found in repository'));
              } catch (createError) {
                console.log(chalk.yellow('\n⚠️  Could not create GitHub issue automatically'));
                console.log(chalk.gray('  Error: ' + createError.message));
              }
            }
          } catch (error) {
            console.log(chalk.yellow('\n⚠️  Could not create GitHub issue'));
            console.log(chalk.gray('  Error: ' + error.message));
          }
        }
      } else if (this.config.provider === 'azure' && this.config.azure.token) {
        const { createWorkItem } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'createWorkItem',
            message: 'Create an Azure DevOps work item to track this PRD?',
            default: true
          }
        ]);

        if (createWorkItem) {
          console.log(chalk.cyan('\n📝 Creating Azure DevOps work item...\n'));

          // Azure DevOps work item creation would require Azure CLI or API
          console.log(chalk.yellow('⚠️  Azure work item creation requires Azure CLI setup.'));
          console.log(chalk.gray('You can create it manually with:'));
          console.log(chalk.yellow(`\n  az boards work-item create \\`));
          console.log(chalk.yellow(`    --title "PRD: ${answers.featureName}" \\`));
          console.log(chalk.yellow(`    --type "Epic" \\`));
          console.log(chalk.yellow(`    --org https://dev.azure.com/${this.config.azure.organization} \\`));
          console.log(chalk.yellow(`    --project "${this.config.azure.project}"`));

          console.log(chalk.gray('\nOr use the Azure DevOps web interface to create the epic.'));
        }
      }
    } catch (error) {
      console.error(chalk.red('\n❌ Failed to create PRD:'), error.message);
    }
  }

  async createSimpleTask() {
    console.log(chalk.cyan('\n📝 Create Simple Task\n'));
    console.log(chalk.gray('Creating a quick task without the full planning workflow.\n'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'taskTitle',
        message: 'Task title:',
        default: 'Setup development environment'
      },
      {
        type: 'input',
        name: 'taskDescription',
        message: 'Task description:',
        default: 'Install dependencies and configure the project for development'
      }
    ]);

    console.log(chalk.cyan('\n📝 Creating task...\n'));

    try {
      if (this.config.provider === 'github') {
        // Use gh CLI to create issue directly
        const repo = this.config.github.repository;
        const command = `gh issue create --repo ${repo} --title "${answers.taskTitle}" --body "${answers.taskDescription}" --label "task,autopm"`;

        // Set GITHUB_TOKEN for gh CLI
        const env = { ...process.env, GITHUB_TOKEN: this.config.github.token };
        const result = execSync(command, { env, encoding: 'utf-8' });

        console.log(chalk.green('\n✅ Task created successfully!'));
        console.log(chalk.gray(`  ${result.trim()}`));

        console.log(chalk.cyan('\n📚 You can now:'));
        console.log(chalk.gray('  • List tasks: ') + chalk.yellow('/pm:issue-list'));
        console.log(chalk.gray('  • Start working: ') + chalk.yellow('/pm:next'));
        console.log(chalk.gray('  • Create PRD for bigger features: ') + chalk.yellow('/pm:prd-new'));
      } else if (this.config.provider === 'azure') {
        // For Azure, provide CLI commands
        console.log(chalk.yellow('\n⚠️  Azure task creation requires Azure CLI.'));
        console.log(chalk.gray('You can create it with:'));

        console.log(chalk.yellow(`\n  az boards work-item create \\`));
        console.log(chalk.yellow(`    --title "${answers.taskTitle}" \\`));
        console.log(chalk.yellow(`    --type "Task" \\`));
        console.log(chalk.yellow(`    --org https://dev.azure.com/${this.config.azure.organization} \\`));
        console.log(chalk.yellow(`    --project "${this.config.azure.project}"`));

        console.log(chalk.cyan('\n📚 You can now:'));
        console.log(chalk.gray('  • List tasks: ') + chalk.yellow('autopm azure:task-list'));
        console.log(chalk.gray('  • Create epic: ') + chalk.yellow('autopm azure:epic-new'));
        console.log(chalk.gray('  • Create PRD for bigger features: ') + chalk.yellow('/pm:prd-new'));
      }
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  We couldn\'t create the task automatically.'));

      // Check if gh CLI is installed
      try {
        execSync('gh --version', { stdio: 'pipe' });
      } catch {
        console.log(chalk.yellow('  GitHub CLI (gh) is not installed.'));
        console.log(chalk.gray('  Install it from: https://cli.github.com'));
      }

      console.log('\nYou can create it manually with:');
      if (this.config.provider === 'github') {
        console.log(chalk.gray(`  gh issue create --repo ${this.config.github.repository} --title "Title" --body "Description"`));
      } else {
        console.log(chalk.gray(`  autopm azure:task-new "Title" "Description"`));
      }
    }
  }

  async showSummary() {
    console.log(chalk.cyan('\n🎉 Setup Complete!\n'));

    console.log(chalk.green('Project Summary:'));
    console.log(`  • Name: ${this.projectName || path.basename(process.cwd())}`);
    console.log(`  • Location: ${this.projectPath || process.cwd()}`);
    if (this.projectDescription) {
      console.log(`  • Description: ${this.projectDescription}`);
    }

    if (this.config.provider && this.config.provider !== 'none') {
      console.log(chalk.green('\nConfiguration Summary:'));
      console.log(`  • Provider: ${this.config.provider === 'github' ? 'GitHub' : 'Azure DevOps'}`);

      if (this.config.provider === 'github') {
        console.log(`  • Repository: ${this.config.github.repository}`);
      } else if (this.config.provider === 'azure') {
        console.log(`  • Organization: ${this.config.azure.organization}`);
        console.log(`  • Project: ${this.config.azure.project}`);
      }
    }

    console.log(chalk.cyan('\n📚 Next Steps:\n'));

    const commands = this.config.provider === 'github'
      ? [
          'autopm pm:status        - View project status',
          'autopm pm:issue-new     - Create new issue',
          'autopm pm:issue-list    - List all issues',
          'autopm pm:help          - Show all commands'
        ]
      : this.config.provider === 'azure'
      ? [
          'autopm azure:status     - View project status',
          'autopm azure:task-new   - Create new task',
          'autopm azure:task-list  - List all tasks',
          'autopm azure:help       - Show all commands'
        ]
      : [
          'autopm install          - Install ClaudeAutoPM in project',
          'autopm help             - Show all available commands'
        ];

    console.log('Useful commands:');
    commands.forEach(cmd => console.log(`  ${chalk.gray(cmd)}`));

    console.log(chalk.cyan('\n📖 Documentation:\n'));
    console.log('  • Full docs: https://github.com/rafeekpro/ClaudeAutoPM');
    console.log('  • Quick start: https://github.com/rafeekpro/ClaudeAutoPM#quick-start');
    console.log('  • Issues: https://github.com/rafeekpro/ClaudeAutoPM/issues');

    console.log(chalk.green('\n✨ Happy coding with ClaudeAutoPM!\n'));
  }

  async resetConfiguration() {
    const configExists = await fs.pathExists(this.configPath);

    if (!configExists) {
      console.log(chalk.yellow('No existing configuration found.\n'));
      return;
    }

    const { confirmReset } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmReset',
        message: chalk.red('Are you sure you want to reset your configuration?'),
        default: false
      }
    ]);

    if (!confirmReset) {
      throw new Error('User cancelled');
    }

    await fs.remove(this.configPath);
    console.log(chalk.green('✅ Configuration reset successfully!\n'));
  }
}

// Export validators for testing
module.exports.validateGitHubToken = InteractiveGuide.prototype.validateGitHubToken;
module.exports.validateAzureToken = InteractiveGuide.prototype.validateAzureToken;