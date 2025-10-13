/**
 * CLI Agent Commands
 *
 * Provides agent management commands for listing, searching, and invoking agents.
 * Implements subcommands for list, search, and invoke operations.
 *
 * @module cli/commands/agent
 * @requires ../../services/AgentService
 * @requires ora
 * @requires chalk
 */

const AgentService = require('../../services/AgentService');
const ora = require('ora');
const chalk = require('chalk');

/**
 * List all available agents
 * @param {Object} argv - Command arguments
 */
async function agentList(argv) {
  const spinner = ora('Loading agents...').start();
  const agentService = new AgentService();

  try {
    const agents = await agentService.listAgents();

    spinner.succeed(chalk.green(`Found ${agents.length} agents`));

    // Display agent list
    if (agents.length > 0) {
      console.log(chalk.green(`\n${agents.length} agents available:`));
      agents.forEach(agent => {
        console.log(`  - ${agent.name}: ${agent.title} [${agent.category}]`);
      });
    } else {
      console.log(chalk.yellow('\nNo agents found.'));
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to list agents'));
    console.error(chalk.red(`\nError: ${error.message}`));
  }
}

/**
 * Search agents by keyword
 * @param {Object} argv - Command arguments
 */
async function agentSearch(argv) {
  const spinner = ora(`Searching agents for: ${argv.query}`).start();
  const agentService = new AgentService();

  try {
    const agents = await agentService.searchAgents(argv.query);

    spinner.succeed(chalk.green(`Found ${agents.length} agent${agents.length === 1 ? '' : 's'}`));

    // Display search results
    if (agents.length > 0) {
      console.log(chalk.green(`\n${agents.length} agent${agents.length === 1 ? '' : 's'} matching '${argv.query}':`));
      agents.forEach(agent => {
        console.log(`  - ${agent.name}: ${agent.title}`);
        if (agent.specialization) {
          console.log(`    ${agent.specialization}`);
        }
      });
    } else {
      console.log(chalk.yellow(`\nNo agents found matching '${argv.query}'.`));
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to search agents'));
    console.error(chalk.red(`\nError: ${error.message}`));
  }
}

/**
 * Invoke an agent with a task
 * @param {Object} argv - Command arguments
 */
async function agentInvoke(argv) {
  const spinner = ora(`Invoking agent: ${argv.name}`).start();
  const agentService = new AgentService();

  try {
    if (argv.stream) {
      // Streaming mode
      spinner.text = 'Streaming agent response...';

      for await (const chunk of agentService.invokeStream(argv.name, argv.task, {})) {
        process.stdout.write(chunk);
      }

      spinner.succeed(chalk.green('Agent invoked successfully'));
    } else {
      // Non-streaming mode
      const result = await agentService.invoke(argv.name, argv.task, {});

      spinner.succeed(chalk.green('Agent invoked successfully'));

      console.log(chalk.green('\nAgent Response:'));
      console.log(result);
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to invoke agent'));
    console.error(chalk.red(`\nError: ${error.message}`));
  }
}

/**
 * Main command handler
 * @param {Object} argv - Command arguments
 */
async function handler(argv) {
  // Validate action
  const validActions = ['list', 'search', 'invoke'];

  if (!validActions.includes(argv.action)) {
    console.error(chalk.red(`\nError: Unknown action: ${argv.action}`));
    console.error(chalk.yellow(`Valid actions: ${validActions.join(', ')}`));
    return;
  }

  // Route to appropriate handler
  try {
    switch (argv.action) {
      case 'list':
        await agentList(argv);
        break;
      case 'search':
        await agentSearch(argv);
        break;
      case 'invoke':
        await agentInvoke(argv);
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
      'list',
      'List all available agents',
      (yargs) => {
        return yargs;
      }
    )
    .command(
      'search <query>',
      'Search agents by keyword',
      (yargs) => {
        return yargs
          .positional('query', {
            describe: 'Search query',
            type: 'string'
          });
      }
    )
    .command(
      'invoke <name>',
      'Invoke an agent with a task',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'Agent name',
            type: 'string'
          })
          .option('task', {
            describe: 'Task description',
            type: 'string',
            demandOption: true
          })
          .option('stream', {
            describe: 'Use streaming mode',
            type: 'boolean',
            default: false
          });
      }
    )
    .demandCommand(1, 'You must specify an agent action')
    .strictCommands()
    .help();
}

/**
 * Command export
 */
module.exports = {
  command: 'agent <action>',
  describe: 'Manage agents',
  builder,
  handler,
  handlers: {
    list: agentList,
    search: agentSearch,
    invoke: agentInvoke
  }
};
