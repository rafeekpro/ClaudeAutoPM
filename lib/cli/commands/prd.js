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
const { spawn } = require('child_process');

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
 * List all PRDs
 */
async function prdList(argv) {
  const spinner = ora('Loading PRDs...').start();

  try {
    const prdsDir = path.join(process.cwd(), '.claude', 'prds');

    // Check if directory exists
    const dirExists = await fs.pathExists(prdsDir);
    if (!dirExists) {
      spinner.info(chalk.yellow('No PRDs directory found'));
      console.log(chalk.yellow('\nCreate your first PRD with: autopm prd new <name>'));
      return;
    }

    // Read all PRD files
    const files = await fs.readdir(prdsDir);
    const prdFiles = files.filter(f => f.endsWith('.md'));

    if (prdFiles.length === 0) {
      spinner.info(chalk.yellow('No PRDs found'));
      console.log(chalk.yellow('\nCreate your first PRD with: autopm prd new <name>'));
      return;
    }

    spinner.succeed(chalk.green(`Found ${prdFiles.length} PRD(s)`));

    // Read and parse each PRD
    const prds = [];
    for (const file of prdFiles) {
      const filePath = path.join(prdsDir, file);
      const content = await fs.readFile(filePath, 'utf8');

      // Extract frontmatter
      const titleMatch = content.match(/^title:\s*(.+)$/m);
      const statusMatch = content.match(/^status:\s*(\w+)$/m);
      const priorityMatch = content.match(/^priority:\s*(P\d|Critical|High|Medium|Low)$/m);
      const createdMatch = content.match(/^created:\s*(.+)$/m);

      prds.push({
        name: file.replace('.md', ''),
        title: titleMatch ? titleMatch[1] : file.replace('.md', ''),
        status: statusMatch ? statusMatch[1] : 'unknown',
        priority: priorityMatch ? priorityMatch[1] : 'P2',
        created: createdMatch ? createdMatch[1] : 'unknown'
      });
    }

    // Sort by priority (P0 > P1 > P2 > P3)
    prds.sort((a, b) => {
      const priorities = { 'P0': 0, 'Critical': 0, 'P1': 1, 'High': 1, 'P2': 2, 'Medium': 2, 'P3': 3, 'Low': 3 };
      return (priorities[a.priority] || 2) - (priorities[b.priority] || 2);
    });

    // Display PRDs
    console.log(chalk.green('\n📋 PRDs:\n'));

    prds.forEach((prd, index) => {
      const priorityColor = prd.priority.startsWith('P0') || prd.priority === 'Critical' ? chalk.red :
                           prd.priority.startsWith('P1') || prd.priority === 'High' ? chalk.yellow :
                           chalk.blue;

      const statusColor = prd.status === 'completed' ? chalk.green :
                         prd.status === 'in-progress' ? chalk.yellow :
                         prd.status === 'draft' ? chalk.gray :
                         chalk.white;

      console.log(`${index + 1}. ${chalk.bold(prd.name)}`);
      console.log(`   ${priorityColor(prd.priority.padEnd(10))} ${statusColor(prd.status.padEnd(12))} ${chalk.gray(prd.created)}`);
      if (prd.title !== prd.name) {
        console.log(`   ${chalk.dim(prd.title)}`);
      }
      console.log('');
    });

    console.log(chalk.dim(`\nTotal: ${prds.length} PRD(s)`));
    console.log(chalk.dim('Use: autopm prd show <name> to view details\n'));

  } catch (error) {
    spinner.fail(chalk.red('Failed to list PRDs'));
    console.error(chalk.red(`\nError: ${error.message}`));
  }
}

/**
 * Show PRD content
 * @param {Object} argv - Command arguments
 */
async function prdShow(argv) {
  const spinner = ora(`Loading PRD: ${argv.name}`).start();

  try {
    const content = await readPrdFile(argv.name);
    spinner.succeed(chalk.green('PRD loaded'));

    console.log('\n' + chalk.gray('─'.repeat(80)) + '\n');
    console.log(content);
    console.log('\n' + chalk.gray('─'.repeat(80)) + '\n');

    const prdPath = getPrdPath(argv.name);
    console.log(chalk.dim(`File: ${prdPath}\n`));

  } catch (error) {
    spinner.fail(chalk.red('Failed to show PRD'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}`));
      console.error(chalk.yellow('Use: autopm prd list to see available PRDs'));
    } else {
      console.error(chalk.red(`\nError: ${error.message}`));
    }
  }
}

/**
 * Edit PRD in editor
 * @param {Object} argv - Command arguments
 */
async function prdEdit(argv) {
  const spinner = ora(`Opening PRD: ${argv.name}`).start();

  try {
    const prdPath = getPrdPath(argv.name);

    // Check if file exists
    const exists = await fs.pathExists(prdPath);
    if (!exists) {
      spinner.fail(chalk.red('PRD not found'));
      console.error(chalk.red(`\nError: PRD file not found: ${prdPath}`));
      console.error(chalk.yellow('Use: autopm prd list to see available PRDs'));
      return;
    }

    spinner.succeed(chalk.green('Opening editor...'));

    // Determine editor
    const editor = process.env.EDITOR || process.env.VISUAL || 'nano';

    // Spawn editor
    const { spawn } = require('child_process');
    const child = spawn(editor, [prdPath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Wait for editor to close
    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('\n✓ PRD saved'));
          resolve();
        } else {
          reject(new Error(`Editor exited with code ${code}`));
        }
      });
      child.on('error', reject);
    });

  } catch (error) {
    spinner.fail(chalk.red('Failed to edit PRD'));
    console.error(chalk.red(`\nError: ${error.message}`));
  }
}

/**
 * Show PRD status
 * @param {Object} argv - Command arguments
 */
async function prdStatus(argv) {
  const spinner = ora(`Analyzing PRD: ${argv.name}`).start();

  try {
    const content = await readPrdFile(argv.name);

    // Extract metadata
    const titleMatch = content.match(/^title:\s*(.+)$/m);
    const statusMatch = content.match(/^status:\s*(\w+)$/m);
    const priorityMatch = content.match(/^priority:\s*(P\d|Critical|High|Medium|Low)$/m);
    const createdMatch = content.match(/^created:\s*(.+)$/m);
    const authorMatch = content.match(/^author:\s*(.+)$/m);
    const timelineMatch = content.match(/^timeline:\s*(.+)$/m);

    // Count sections
    const sections = {
      'Problem Statement': content.includes('## Problem Statement'),
      'User Stories': content.includes('## User Stories'),
      'Technical Requirements': content.includes('## Technical Requirements'),
      'Success Metrics': content.includes('## Success Metrics'),
      'Implementation Plan': content.includes('## Implementation Plan'),
      'Risks': content.includes('## Risks')
    };

    const completedSections = Object.values(sections).filter(Boolean).length;
    const totalSections = Object.keys(sections).length;
    const completeness = Math.round((completedSections / totalSections) * 100);

    spinner.succeed(chalk.green('Status analyzed'));

    // Display status
    console.log('\n' + chalk.bold('📊 PRD Status Report') + '\n');
    console.log(chalk.gray('─'.repeat(50)) + '\n');

    console.log(chalk.bold('Metadata:'));
    console.log(`  Title:     ${titleMatch ? titleMatch[1] : 'N/A'}`);
    console.log(`  Status:    ${statusMatch ? chalk.yellow(statusMatch[1]) : 'N/A'}`);
    console.log(`  Priority:  ${priorityMatch ? chalk.red(priorityMatch[1]) : 'N/A'}`);
    console.log(`  Created:   ${createdMatch ? createdMatch[1] : 'N/A'}`);
    console.log(`  Author:    ${authorMatch ? authorMatch[1] : 'N/A'}`);
    console.log(`  Timeline:  ${timelineMatch ? timelineMatch[1] : 'N/A'}`);

    console.log('\n' + chalk.bold('Completeness:') + ` ${completeness}%`);

    const progressBar = '█'.repeat(Math.floor(completeness / 5)) +
                       '░'.repeat(20 - Math.floor(completeness / 5));
    console.log(`  [${completeness >= 80 ? chalk.green(progressBar) :
                      completeness >= 50 ? chalk.yellow(progressBar) :
                      chalk.red(progressBar)}]`);

    console.log('\n' + chalk.bold('Sections:'));
    Object.entries(sections).forEach(([name, exists]) => {
      const icon = exists ? chalk.green('✓') : chalk.red('✗');
      console.log(`  ${icon} ${name}`);
    });

    // Statistics
    const lines = content.split('\n').length;
    const words = content.split(/\s+/).length;
    const chars = content.length;

    console.log('\n' + chalk.bold('Statistics:'));
    console.log(`  Lines:     ${lines}`);
    console.log(`  Words:     ${words}`);
    console.log(`  Chars:     ${chars}`);

    console.log('\n' + chalk.gray('─'.repeat(50)) + '\n');

    const prdPath = getPrdPath(argv.name);
    console.log(chalk.dim(`File: ${prdPath}\n`));

  } catch (error) {
    spinner.fail(chalk.red('Failed to analyze status'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red(`\nError: ${error.message}`));
    }
  }
}

/**
 * Create new PRD
 * @param {Object} argv - Command arguments
 */
async function prdNew(argv) {
  const spinner = ora(`Creating PRD: ${argv.name}`).start();

  try {
    // Build script path
    const scriptPath = path.join(process.cwd(), '.claude', 'scripts', 'pm', 'prd-new.js');

    // Check if script exists
    const scriptExists = await fs.pathExists(scriptPath);
    if (!scriptExists) {
      spinner.fail(chalk.red('PRD creation script not found'));
      console.error(chalk.red('\nError: .claude/scripts/pm/prd-new.js not found'));
      console.error(chalk.yellow('Run: autopm install'));
      return;
    }

    // Build arguments
    const args = [scriptPath, argv.name];
    if (argv.template) {
      args.push('--template', argv.template);
    }

    spinner.stop();

    // Spawn interactive process
    const child = spawn('node', args, {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Wait for completion
    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`PRD creation failed with code ${code}`));
        }
      });
      child.on('error', reject);
    });

  } catch (error) {
    spinner.fail(chalk.red('Failed to create PRD'));
    console.error(chalk.red(`\nError: ${error.message}`));
  }
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
  const validActions = ['list', 'new', 'show', 'edit', 'status', 'parse', 'extract-epics', 'summarize', 'validate'];

  if (!validActions.includes(argv.action)) {
    console.error(chalk.red(`\nError: Unknown action: ${argv.action}`));
    console.error(chalk.yellow(`Valid actions: ${validActions.join(', ')}`));
    return;
  }

  // Route to appropriate handler
  try {
    switch (argv.action) {
      case 'list':
        await prdList(argv);
        break;
      case 'new':
        await prdNew(argv);
        break;
      case 'show':
        await prdShow(argv);
        break;
      case 'edit':
        await prdEdit(argv);
        break;
      case 'status':
        await prdStatus(argv);
        break;
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
      'list',
      'List all PRDs',
      (yargs) => {
        return yargs
          .example('autopm prd list', 'Show all PRDs');
      }
    )
    .command(
      'new <name>',
      'Create new PRD interactively',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'PRD name (use-kebab-case)',
            type: 'string'
          })
          .option('template', {
            describe: 'Template to use (api-feature, ui-feature, bug-fix, data-migration, documentation)',
            type: 'string',
            alias: 't'
          })
          .example('autopm prd new my-feature', 'Create PRD with wizard')
          .example('autopm prd new payment-api --template api-feature', 'Create PRD from template');
      }
    )
    .command(
      'show <name>',
      'Display PRD content',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'PRD name (without .md extension)',
            type: 'string'
          })
          .example('autopm prd show my-feature', 'Display PRD content');
      }
    )
    .command(
      'edit <name>',
      'Edit PRD in your editor',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'PRD name (without .md extension)',
            type: 'string'
          })
          .example('autopm prd edit my-feature', 'Open PRD in editor')
          .example('EDITOR=code autopm prd edit my-feature', 'Open PRD in VS Code');
      }
    )
    .command(
      'status <name>',
      'Show PRD status and completeness',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'PRD name (without .md extension)',
            type: 'string'
          })
          .example('autopm prd status my-feature', 'Show PRD status report');
      }
    )
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
    list: prdList,
    new: prdNew,
    show: prdShow,
    edit: prdEdit,
    status: prdStatus,
    parse: prdParse,
    extractEpics: prdExtractEpics,
    summarize: prdSummarize,
    validate: prdValidate
  }
};
