/**
 * Interactive Guide Command
 * Helps new users set up ClaudeAutoPM with a step-by-step wizard
 */

const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const { exec, execSync } = require('child_process');
const chalk = require('chalk');

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
    this.configPath = path.join(process.cwd(), '.autopm', 'config.json');
    this.config = {};
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

      // Step 3: Configure Provider
      await this.configureProvider();

      // Step 4: Create First Task (optional)
      await this.createFirstTask();

      // Step 5: Show Summary
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
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeJson(this.configPath, this.config, { spaces: 2 });
      console.log(chalk.green('\n✅ Configuration saved successfully!\n'));
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
      let command;
      if (this.config.provider === 'github') {
        command = `autopm pm:issue-new "${answers.taskTitle}" "${answers.taskDescription}"`;
      } else if (this.config.provider === 'azure') {
        command = `autopm azure:task-new "${answers.taskTitle}" "${answers.taskDescription}"`;
      }

      if (command) {
        execSync(command, { stdio: 'inherit' });
        console.log(chalk.green('\n✅ Task created successfully!\n'));
      }
    } catch (error) {
      console.log(chalk.yellow('\n⚠️  We couldn\'t create the task automatically.'));
      console.log('You can create it manually with:');
      if (this.config.provider === 'github') {
        console.log(chalk.gray(`  autopm pm:issue-new "Title" "Description"`));
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