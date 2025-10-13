/**
 * CLI PRD Commands
 *
 * Provides PRD (Product Requirements Document) management commands.
 * Implements subcommands for parse, extract-epics, summarize, and validate operations.
 *
 * @module cli/commands/prd
 * @requires ../../services/PRDService
 * @requires fs-extra
 * @requires ora
 * @requires chalk
 * @requires path
 */

const PRDService = require('../../services/PRDService');
const fs = require('fs-extra');
const ora = require('ora');
const chalk = require('chalk');
const path = require('path');

/**
 * Get PRD file path
 * @param {string} name - PRD name
 * @returns {string} Full path to PRD file
 */
function getPrdPath(name) {
  return path.join(process.cwd(), '.claude', 'prds', `${name}.md`);
}

/**
 * Read PRD file
 * @param {string} name - PRD name
 * @returns {Promise<string>} PRD content
 * @throws {Error} If file doesn't exist or can't be read
 */
async function readPrdFile(name) {
  const prdPath = getPrdPath(name);

  // Check if file exists
  const exists = await fs.pathExists(prdPath);
  if (!exists) {
    throw new Error(`PRD file not found: ${prdPath}`);
  }

  // Read file content
  return await fs.readFile(prdPath, 'utf8');
}

/**
 * Parse PRD with AI
 * @param {Object} argv - Command arguments
 */
async function prdParse(argv) {
  const spinner = ora(`Parsing PRD: ${argv.name}`).start();
  const prdService = new PRDService();

  try {
    const content = await readPrdFile(argv.name);

    if (argv.stream) {
      // Streaming mode
      spinner.text = 'Streaming PRD analysis...';

      for await (const chunk of prdService.parseStream(content)) {
        process.stdout.write(chunk);
      }

      spinner.succeed(chalk.green('PRD parsed successfully'));
    } else {
      // Non-streaming mode
      const result = await prdService.parse(content);

      spinner.succeed(chalk.green('PRD parsed successfully'));

      if (result.epics && result.epics.length > 0) {
        console.log(chalk.green(`\nFound ${result.epics.length} epic(s):`));
        result.epics.forEach(epic => {
          console.log(`  - ${epic.id}: ${epic.title}`);
        });
      }
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to parse PRD'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else if (error.message.includes('Failed to read')) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red(`\nError: Failed to parse PRD: ${error.message}`));
    }
  }
}

/**
 * Extract epics from PRD
 * @param {Object} argv - Command arguments
 */
async function prdExtractEpics(argv) {
  const spinner = ora(`Extracting epics from: ${argv.name}`).start();
  const prdService = new PRDService();

  try {
    const content = await readPrdFile(argv.name);

    if (argv.stream) {
      // Streaming mode
      spinner.text = 'Streaming epic extraction...';

      for await (const chunk of prdService.extractEpicsStream(content)) {
        process.stdout.write(chunk);
      }

      spinner.succeed(chalk.green('Epics extracted successfully'));
    } else {
      // Non-streaming mode
      const epics = await prdService.extractEpics(content);

      spinner.succeed(chalk.green(`Found ${epics.length} epics`));

      console.log(chalk.green(`\nExtracted ${epics.length} epic(s):`));
      epics.forEach((epic, index) => {
        console.log(`\n${index + 1}. ${epic.title || epic.id}`);
        if (epic.description) {
          console.log(`   ${epic.description}`);
        }
      });
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to extract epics'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else if (error.message.includes('Failed to read')) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red(`\nError: Failed to extract epics: ${error.message}`));
    }
  }
}

/**
 * Generate PRD summary
 * @param {Object} argv - Command arguments
 */
async function prdSummarize(argv) {
  const spinner = ora(`Generating summary for: ${argv.name}`).start();
  const prdService = new PRDService();

  try {
    const content = await readPrdFile(argv.name);

    if (argv.stream) {
      // Streaming mode
      spinner.text = 'Streaming summary generation...';

      for await (const chunk of prdService.summarizeStream(content)) {
        process.stdout.write(chunk);
      }

      spinner.succeed(chalk.green('Summary generated successfully'));
    } else {
      // Non-streaming mode
      const summary = await prdService.summarize(content);

      spinner.succeed(chalk.green('Summary generated successfully'));

      console.log(chalk.green('\nPRD Summary:'));
      console.log(summary);
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate summary'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else if (error.message.includes('Failed to read')) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red(`\nError: Failed to generate summary: ${error.message}`));
    }
  }
}

/**
 * Validate PRD structure
 * @param {Object} argv - Command arguments
 */
async function prdValidate(argv) {
  const spinner = ora(`Validating PRD: ${argv.name}`).start();
  const prdService = new PRDService();

  try {
    const content = await readPrdFile(argv.name);
    const result = await prdService.validate(content);

    if (result.valid) {
      spinner.succeed(chalk.green('PRD is valid'));
      console.log(chalk.green('\nValidation passed - PRD structure is correct'));
    } else {
      spinner.fail(chalk.red(`PRD validation failed - ${result.issues.length} issues found`));
      console.error(chalk.red(`\nValidation failed - ${result.issues.length} issue(s):`));
      result.issues.forEach((issue, index) => {
        console.error(chalk.red(`  ${index + 1}. ${issue}`));
      });
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to validate PRD'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else if (error.message.includes('Failed to read')) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red(`\nError: Failed to validate PRD: ${error.message}`));
    }
  }
}

/**
 * Main command handler
 * @param {Object} argv - Command arguments
 */
async function handler(argv) {
  // Validate action
  const validActions = ['parse', 'extract-epics', 'summarize', 'validate'];

  if (!validActions.includes(argv.action)) {
    console.error(chalk.red(`\nError: Unknown action: ${argv.action}`));
    console.error(chalk.yellow(`Valid actions: ${validActions.join(', ')}`));
    return;
  }

  // Route to appropriate handler
  try {
    switch (argv.action) {
      case 'parse':
        await prdParse(argv);
        break;
      case 'extract-epics':
        await prdExtractEpics(argv);
        break;
      case 'summarize':
        await prdSummarize(argv);
        break;
      case 'validate':
        await prdValidate(argv);
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
      'parse <name>',
      'Parse PRD with AI analysis',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'PRD name (without .md extension)',
            type: 'string'
          })
          .option('stream', {
            describe: 'Use streaming mode',
            type: 'boolean',
            default: false
          })
          .option('ai', {
            describe: 'Use AI for parsing',
            type: 'boolean',
            default: true
          });
      }
    )
    .command(
      'extract-epics <name>',
      'Extract epics from PRD',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'PRD name (without .md extension)',
            type: 'string'
          })
          .option('stream', {
            describe: 'Use streaming mode',
            type: 'boolean',
            default: false
          });
      }
    )
    .command(
      'summarize <name>',
      'Generate PRD summary',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'PRD name (without .md extension)',
            type: 'string'
          })
          .option('stream', {
            describe: 'Use streaming mode',
            type: 'boolean',
            default: false
          });
      }
    )
    .command(
      'validate <name>',
      'Validate PRD structure',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'PRD name (without .md extension)',
            type: 'string'
          });
      }
    )
    .demandCommand(1, 'You must specify a PRD action')
    .strictCommands()
    .help();
}

/**
 * Command export
 */
module.exports = {
  command: 'prd <action> [name]',
  describe: 'Manage PRD (Product Requirements Documents)',
  builder,
  handler,
  handlers: {
    parse: prdParse,
    extractEpics: prdExtractEpics,
    summarize: prdSummarize,
    validate: prdValidate
  }
};
