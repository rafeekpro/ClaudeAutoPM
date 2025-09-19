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

      // Step 3: Project Setup
      await this.setupProject();

      // Step 4: Configure Provider
      await this.configureProvider();

      // Step 5: Install ClaudeAutoPM
      await this.installFramework();

      // Step 6: Create First Task (optional)
      await this.createFirstTask();

      // Step 7: Show Summary
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
    console.log('  • Verify system requirements');
    console.log('  • Set up your project');
    console.log('  • Install ClaudeAutoPM framework');
    console.log('  • Configure your project management provider');
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

  async setupProject() {
    console.log(chalk.cyan('\n📁 Project Setup\n'));

    // Check if we're in an existing project or need to create one
    const gitExists = await this.checkCommand('git rev-parse --git-dir 2>/dev/null');

    if (!gitExists) {
      const { createProject } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'createProject',
          message: 'No git repository found. Would you like to initialize one?',
          default: true
        }
      ]);

      if (createProject) {
        const { projectName } = await inquirer.prompt([
          {
            type: 'input',
            name: 'projectName',
            message: 'Enter project name:',
            default: path.basename(process.cwd()),
            validate: (input) => input ? true : 'Project name is required'
          }
        ]);

        // Initialize git repository
        try {
          execSync('git init', { stdio: 'pipe' });
          console.log(chalk.green('  ✓ Git repository initialized'));

          // Create initial commit
          await fs.writeFile('.gitignore', 'node_modules/\n.env\n.DS_Store\n');
          execSync('git add .gitignore', { stdio: 'pipe' });
          execSync('git commit -m "Initial commit"', { stdio: 'pipe' });
          console.log(chalk.green('  ✓ Initial commit created'));
        } catch (error) {
          console.log(chalk.yellow('  ⚠️  Could not initialize git repository'));
        }
      }
    } else {
      console.log(chalk.green('  ✓ Git repository detected'));
    }
  }

  async installFramework() {
    console.log(chalk.cyan('\n📦 Installing ClaudeAutoPM Framework\n'));

    const claudeExists = await fs.pathExists(path.join(process.cwd(), '.claude'));

    if (claudeExists) {
      console.log(chalk.green('  ✓ ClaudeAutoPM already installed'));
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

    try {
      console.log(chalk.gray('  Installing framework files...'));

      // Run autopm install with preset 3 (Full DevOps - recommended)
      const installScript = require('../node/install.js');
      await installScript.run(3);

      console.log(chalk.green('\n  ✓ ClaudeAutoPM framework installed successfully'));
    } catch (error) {
      console.log(chalk.yellow('\n  ⚠️  Could not install framework automatically'));
      console.log(chalk.gray('  Please run manually: autopm install'));
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

    if (this.config.provider && this.config.provider !== 'none') {
      console.log(chalk.green('Configuration Summary:'));
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