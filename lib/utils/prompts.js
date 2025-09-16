/**
 * Prompts utility for consistent user interaction
 * Wraps inquirer with common prompt patterns
 */

const inquirer = require('inquirer');
const chalk = require('./colors');

class Prompts {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Simple yes/no confirmation
   */
  async confirm(message, defaultValue = false) {
    const { confirmed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmed',
        message,
        default: defaultValue
      }
    ]);
    return confirmed;
  }

  /**
   * Text input
   */
  async input(message, defaultValue = '', options = {}) {
    const { value } = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message,
        default: defaultValue,
        ...options
      }
    ]);
    return value;
  }

  /**
   * Password input
   */
  async password(message, options = {}) {
    const { value } = await inquirer.prompt([
      {
        type: 'password',
        name: 'value',
        message,
        mask: '*',
        ...options
      }
    ]);
    return value;
  }

  /**
   * Single selection from list
   */
  async select(message, choices, defaultValue = null) {
    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message,
        choices,
        default: defaultValue
      }
    ]);
    return selected;
  }

  /**
   * Multiple selection from list
   */
  async multiSelect(message, choices, defaultValues = []) {
    const { selected } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'selected',
        message,
        choices,
        default: defaultValues
      }
    ]);
    return selected;
  }

  /**
   * Number input
   */
  async number(message, defaultValue = 0, options = {}) {
    const { value } = await inquirer.prompt([
      {
        type: 'number',
        name: 'value',
        message,
        default: defaultValue,
        ...options
      }
    ]);
    return value;
  }

  /**
   * Platform selection helper
   */
  async selectPlatform() {
    return this.select(
      'Choose your project management platform:',
      [
        { name: '📙 GitHub (Issues, Projects, Pull Requests)', value: 'github' },
        { name: '🔷 Azure DevOps (Work Items, Boards, Repos)', value: 'azure' }
      ],
      'github'
    );
  }

  /**
   * Configuration type selection
   */
  async selectConfiguration() {
    return this.select(
      'Choose your configuration:',
      [
        {
          name: '1) Minimal - Traditional development (no Docker/K8s)',
          value: 'minimal'
        },
        {
          name: '2) Docker-only - Container-first development',
          value: 'docker'
        },
        {
          name: '3) Full DevOps - Enterprise with Docker + K8s (RECOMMENDED)',
          value: 'devops'
        },
        {
          name: '4) Performance - Hybrid parallel execution for power users',
          value: 'performance'
        },
        {
          name: '5) Custom - Manual configuration',
          value: 'custom'
        }
      ],
      'devops'
    );
  }

  /**
   * Ask for API key/token with validation
   */
  async askForToken(service, required = false) {
    const message = required
      ? `Enter your ${service} token (required):`
      : `Enter your ${service} token (optional, press Enter to skip):`;

    const token = await this.password(message, {
      validate: (input) => {
        if (required && !input.trim()) {
          return `${service} token is required`;
        }
        return true;
      }
    });

    return token.trim();
  }

  /**
   * Pause execution and wait for user
   */
  async pause(message = 'Press Enter to continue...') {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'pause',
        message: chalk.gray(message)
      }
    ]);
  }

  /**
   * Display menu and get selection
   */
  async menu(title, items) {
    this.logger.header(title);

    const choices = items.map((item, index) => ({
      name: `${index + 1}) ${item.label}`,
      value: item.value,
      short: item.short || item.label
    }));

    choices.push(new inquirer.Separator());
    choices.push({ name: 'Exit', value: 'exit' });

    return this.select('Select an option:', choices);
  }

  /**
   * Ask series of questions
   */
  async askQuestions(questions) {
    return inquirer.prompt(questions);
  }

  /**
   * Path input with validation
   */
  async askForPath(message, defaultPath = '.', mustExist = false) {
    return this.input(message, defaultPath, {
      validate: async (input) => {
        if (!input.trim()) {
          return 'Path cannot be empty';
        }

        if (mustExist) {
          const fs = require('fs-extra');
          const exists = await fs.pathExists(input);
          if (!exists) {
            return `Path does not exist: ${input}`;
          }
        }

        return true;
      }
    });
  }

  /**
   * URL input with validation
   */
  async askForUrl(message, defaultUrl = '') {
    return this.input(message, defaultUrl, {
      validate: (input) => {
        if (!input.trim()) {
          return true; // Allow empty for optional URLs
        }

        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    });
  }

  /**
   * Email input with validation
   */
  async askForEmail(message, defaultEmail = '') {
    return this.input(message, defaultEmail, {
      validate: (input) => {
        if (!input.trim()) {
          return true; // Allow empty for optional emails
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(input)) {
          return 'Please enter a valid email address';
        }

        return true;
      }
    });
  }

  /**
   * Show spinner during async operation
   */
  async withSpinner(message, asyncFn) {
    const ora = require('ora');
    const spinner = ora(message).start();

    try {
      const result = await asyncFn();
      spinner.succeed();
      return result;
    } catch (error) {
      spinner.fail();
      throw error;
    }
  }
}

module.exports = Prompts;