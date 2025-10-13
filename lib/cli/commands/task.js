/**
 * CLI Task Commands
 *
 * Provides task management commands for epic-based workflows.
 * Implements subcommands for list and prioritize operations.
 *
 * @module cli/commands/task
 * @requires ../../services/TaskService
 * @requires fs-extra
 * @requires ora
 * @requires chalk
 * @requires path
 */

const TaskService = require('../../services/TaskService');
const PRDService = require('../../services/PRDService');
const fs = require('fs-extra');
const ora = require('ora');
const chalk = require('chalk');
const path = require('path');

/**
 * Get epic file path
 * @param {string} name - Epic name
 * @returns {string} Full path to epic file
 */
function getEpicPath(name) {
  return path.join(process.cwd(), '.claude', 'epics', `${name}.md`);
}

/**
 * Read epic file
 * @param {string} name - Epic name
 * @returns {Promise<string>} Epic content
 * @throws {Error} If file doesn't exist or can't be read
 */
async function readEpicFile(name) {
  const epicPath = getEpicPath(name);

  // Check if file exists
  const exists = await fs.pathExists(epicPath);
  if (!exists) {
    throw new Error(`Epic file not found: ${epicPath}`);
  }

  // Read file content
  return await fs.readFile(epicPath, 'utf8');
}

/**
 * List all tasks in epic
 * @param {Object} argv - Command arguments
 */
async function taskList(argv) {
  const spinner = ora(`Loading tasks from epic: ${argv.epic}`).start();

  try {
    const content = await readEpicFile(argv.epic);

    // Initialize services
    const prdService = new PRDService();
    const taskService = new TaskService({ prdService });

    // Get tasks from epic content
    const tasks = taskService.getTasks(content);

    spinner.succeed(chalk.green(`Found ${tasks.length} tasks`));

    // Display task list
    if (tasks.length > 0) {
      console.log(chalk.green(`\n${tasks.length} tasks in epic '${argv.epic}':`));
      tasks.forEach((task, index) => {
        const statusIcon = task.status === 'completed' ? '✓' :
                          task.status === 'in-progress' ? '→' :
                          task.status === 'blocked' ? '✗' : '○';
        console.log(`  ${statusIcon} ${task.id || `#${index + 1}`}: ${task.title} [${task.status}]`);
      });
    } else {
      console.log(chalk.yellow('\nNo tasks found in this epic.'));
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to list tasks'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red(`\nError: Failed to list tasks: ${error.message}`));
    }
  }
}

/**
 * Prioritize tasks in epic
 * @param {Object} argv - Command arguments
 */
async function taskPrioritize(argv) {
  const spinner = ora(`Prioritizing tasks in epic: ${argv.epic}`).start();

  try {
    const content = await readEpicFile(argv.epic);

    // Initialize services
    const prdService = new PRDService();
    const taskService = new TaskService({ prdService });

    // Prioritize tasks
    const prioritizedTasks = await taskService.prioritize(content);

    spinner.succeed(chalk.green('Tasks prioritized successfully'));

    // Display prioritized tasks
    if (prioritizedTasks.length > 0) {
      console.log(chalk.green(`\nPrioritized ${prioritizedTasks.length} tasks:`));
      prioritizedTasks.forEach((task, index) => {
        const priorityLabel = task.priority || 'P2';
        console.log(`  ${index + 1}. [${priorityLabel}] ${task.id}: ${task.title || 'Untitled'}`);
      });
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to prioritize tasks'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red(`\nError: Failed to prioritize tasks: ${error.message}`));
    }
  }
}

/**
 * Main command handler
 * @param {Object} argv - Command arguments
 */
async function handler(argv) {
  // Validate action
  const validActions = ['list', 'prioritize'];

  if (!validActions.includes(argv.action)) {
    console.error(chalk.red(`\nError: Unknown action: ${argv.action}`));
    console.error(chalk.yellow(`Valid actions: ${validActions.join(', ')}`));
    return;
  }

  // Route to appropriate handler
  try {
    switch (argv.action) {
      case 'list':
        await taskList(argv);
        break;
      case 'prioritize':
        await taskPrioritize(argv);
        break;
    }
  } catch (error) {
    // Global error handler for unexpected errors
    console.error(chalk.red(`\nUnexpected error: ${error.message}`));
  }
}

/**
 * Command builder - registers all subcommands
 * @param {Object} yargs - Yargs instance
 * @returns {Object} Configured yargs instance
 */
function builder(yargs) {
  return yargs
    .command(
      'list <epic>',
      'List all tasks in epic',
      (yargs) => {
        return yargs
          .positional('epic', {
            describe: 'Epic name (without .md extension)',
            type: 'string'
          });
      }
    )
    .command(
      'prioritize <epic>',
      'Prioritize tasks in epic',
      (yargs) => {
        return yargs
          .positional('epic', {
            describe: 'Epic name (without .md extension)',
            type: 'string'
          });
      }
    )
    .demandCommand(1, 'You must specify a task action')
    .strictCommands()
    .help();
}

/**
 * Command export
 */
module.exports = {
  command: 'task <action>',
  describe: 'Manage tasks in epics',
  builder,
  handler,
  handlers: {
    list: taskList,
    prioritize: taskPrioritize
  }
};
