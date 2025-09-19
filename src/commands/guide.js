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
    console.log('  • Create your first task');
    console.log('  • Learn essential commands\n');

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

    // Ask for installation scenario
    const { scenario } = await inquirer.prompt([
      {
        type: 'list',
        name: 'scenario',
        message: 'Choose your installation scenario:',
        choices: [
          { name: 'Full DevOps (Recommended) - All features enabled', value: 3 },
          { name: 'Docker-only - Adaptive with Docker support', value: 2 },
          { name: 'Minimal - Sequential execution, basic features', value: 1 },
          { name: 'Performance - Hybrid parallel for power users', value: 4 },
          { name: 'Custom - Configure manually', value: 5 }
        ],
        default: 3
      }
    ]);

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
    console.log(chalk.gray('\nTo use GitHub, you need:'));
    console.log('  1. A Personal Access Token (PAT)');
    console.log('  2. Repository in format: owner/repo\n');

    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'githubToken',
        message: 'Enter your GitHub Personal Access Token:',
        validate: this.validateGitHubToken
      },
      {
        type: 'input',
        name: 'githubRepo',
        message: 'Enter repository (e.g., username/repo):',
        validate: (input) => {
          if (!input || !input.includes('/')) {
            return 'Please enter in format: owner/repository';
          }
          return true;
        }
      }
    ]);

    this.config.github = {
      token: answers.githubToken,
      repository: answers.githubRepo
    };
  }

  async configureAzure() {
    console.log(chalk.gray('\nTo use Azure DevOps, you need:'));
    console.log('  1. A Personal Access Token (PAT)');
    console.log('  2. Organization name');
    console.log('  3. Project name\n');

    const answers = await inquirer.prompt([
      {
        type: 'password',
        name: 'azureToken',
        message: 'Enter your Azure DevOps PAT:',
        validate: this.validateAzureToken
      },
      {
        type: 'input',
        name: 'azureOrg',
        message: 'Enter organization name:',
        validate: (input) => input ? true : 'Organization name is required'
      },
      {
        type: 'input',
        name: 'azureProject',
        message: 'Enter project name:',
        validate: (input) => input ? true : 'Project name is required'
      }
    ]);

    this.config.azure = {
      token: answers.azureToken,
      organization: answers.azureOrg,
      project: answers.azureProject
    };
  }

  validateGitHubToken(input) {
    if (!input) return 'Token is required';
    if (!input.startsWith('ghp_') && !input.startsWith('github_pat_')) {
      return 'Invalid GitHub token format (should start with ghp_ or github_pat_)';
    }
    return true;
  }

  validateAzureToken(input) {
    if (!input) return 'Token cannot be empty';
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
    } catch (error) {
      console.error(chalk.red('\n❌ Failed to save configuration:'), error.message);
      throw error;
    }
  }

  async createFirstTask() {
    if (this.config.provider === 'none' || !this.config.provider) {
      return;
    }

    const { createTask } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createTask',
        message: 'Would you like to create your first task?',
        default: true
      }
    ]);

    if (!createTask) {
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'taskTitle',
        message: 'Task title:',
        default: 'My First Task'
      },
      {
        type: 'input',
        name: 'taskDescription',
        message: 'Task description:',
        default: 'This is my first task created with ClaudeAutoPM'
      }
    ]);

    console.log(chalk.cyan('\n📝 Creating task...\n'));

    try {
      if (this.config.provider === 'github') {
        // Use gh CLI to create issue directly
        const repo = this.config.github.repository;
        const command = `gh issue create --repo ${repo} --title "${answers.taskTitle}" --body "${answers.taskDescription}"`;

        // Set GITHUB_TOKEN for gh CLI
        const env = { ...process.env, GITHUB_TOKEN: this.config.github.token };
        const result = execSync(command, { env, encoding: 'utf-8' });

        console.log(chalk.green('\n✅ Issue created successfully!'));
        console.log(chalk.gray(`  ${result.trim()}`));
      } else if (this.config.provider === 'azure') {
        // For Azure, we need to use the Azure DevOps API
        console.log(chalk.yellow('\n⚠️  Azure task creation requires additional setup.'));
        console.log('You can create it manually with:');
        console.log(chalk.gray(`  autopm azure:task-new "${answers.taskTitle}" "${answers.taskDescription}"`));
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