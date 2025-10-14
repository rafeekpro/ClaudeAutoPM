/**
 * CLI Context Commands
 *
 * Provides context management commands for ClaudeAutoPM.
 * Implements subcommands for context lifecycle management.
 *
 * Commands:
 * - create <type>: Create new context from template
 * - prime: Generate comprehensive project snapshot
 * - update <type>: Update existing context
 * - show [type]: Show context or list all contexts
 *
 * @module cli/commands/context
 * @requires ../../services/ContextService
 * @requires fs-extra
 * @requires ora
 * @requires chalk
 * @requires path
 */

const ContextService = require('../../services/ContextService');
const fs = require('fs-extra');
const ora = require('ora');
const chalk = require('chalk');
const path = require('path');

/**
 * Context Create - Create new context file from template
 * @param {Object} argv - Command arguments
 */
async function contextCreate(argv) {
  const spinner = ora(`Creating ${argv.type} context...`).start();

  try {
    const contextService = new ContextService();

    // Prepare options
    const options = {
      name: argv.name || argv.type,
      description: argv.description || `${argv.type} context`,
      ...(argv.data && { data: argv.data })
    };

    const result = await contextService.createContext(argv.type, options);

    spinner.succeed(chalk.green('Context created'));

    console.log(chalk.cyan('\n📄 Context Created Successfully\n'));
    console.log(chalk.gray('='.repeat(60)) + '\n');

    console.log(chalk.bold('Type:       ') + result.type);
    console.log(chalk.bold('Path:       ') + result.path);
    console.log(chalk.bold('Created:    ') + new Date(result.created).toLocaleString());

    console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');

    console.log(chalk.bold('💡 Next Steps:\n'));
    console.log(`  ${chalk.cyan('1.')} View context:     ${chalk.yellow(`autopm context show ${argv.type}`)}`);
    console.log(`  ${chalk.cyan('2.')} Update context:   ${chalk.yellow(`autopm context update ${argv.type}`)}`);
    console.log(`  ${chalk.cyan('3.')} List all:         ${chalk.yellow('autopm context show --list')}\n`);

    console.log(chalk.gray('='.repeat(60)) + '\n');

  } catch (error) {
    spinner.fail(chalk.red('Failed to create context'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}\n`));
      console.error(chalk.yellow('Available context types:'));
      console.error(chalk.gray('  • project-brief    - Project overview and goals'));
      console.error(chalk.gray('  • progress         - Progress tracking'));
      console.error(chalk.gray('  • tech-context     - Technical stack and architecture'));
      console.error(chalk.gray('  • project-structure - Project organization\n'));
    } else {
      console.error(chalk.red(`\nError: ${error.message}\n`));
    }
    process.exit(1);
  }
}

/**
 * Context Prime - Generate comprehensive project snapshot
 * @param {Object} argv - Command arguments
 */
async function contextPrime(argv) {
  const spinner = ora('Generating project snapshot...').start();

  try {
    const contextService = new ContextService();

    const options = {
      includeGit: argv.includeGit !== false,
      ...(argv.output && { output: argv.output })
    };

    const result = await contextService.primeContext(options);

    spinner.succeed(chalk.green('Project snapshot generated'));

    console.log(chalk.cyan('\n📸 Project Snapshot Generated\n'));
    console.log(chalk.gray('='.repeat(60)) + '\n');

    console.log(chalk.bold('Timestamp:  ') + result.timestamp);
    console.log(chalk.bold('Epics:      ') + result.contexts.epics.length);
    console.log(chalk.bold('Issues:     ') + result.contexts.issues.length);
    console.log(chalk.bold('PRDs:       ') + result.contexts.prds.length);

    if (result.git && !result.git.error) {
      console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');
      console.log(chalk.bold('Git Information:\n'));
      console.log(`  Branch:  ${result.git.branch}`);
      console.log(`  Commit:  ${result.git.commit.substring(0, 8)}`);
      console.log(`  Status:  ${result.git.status || 'clean'}`);
    }

    console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');

    console.log(chalk.bold('📋 Summary:\n'));
    console.log(result.summary.split('\n').map(line => `  ${line}`).join('\n'));

    if (argv.output) {
      console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');
      console.log(chalk.green(`✓ Snapshot saved to: ${argv.output}`));
    }

    console.log('\n' + chalk.bold('💡 Next Steps:\n'));
    console.log(`  ${chalk.cyan('1.')} Use snapshot in Claude conversations`);
    console.log(`  ${chalk.cyan('2.')} Update specific contexts: ${chalk.yellow('autopm context update <type>')}`);
    console.log(`  ${chalk.cyan('3.')} View all contexts:        ${chalk.yellow('autopm context show --list')}\n`);

    console.log(chalk.gray('='.repeat(60)) + '\n');

  } catch (error) {
    spinner.fail(chalk.red('Failed to generate snapshot'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * Context Update - Update existing context
 * @param {Object} argv - Command arguments
 */
async function contextUpdate(argv) {
  const spinner = ora(`Updating ${argv.type} context...`).start();

  try {
    const contextService = new ContextService();

    // Get update content
    let content = argv.content;

    if (argv.file) {
      // Read content from file
      const exists = await fs.pathExists(argv.file);
      if (!exists) {
        throw new Error(`File not found: ${argv.file}`);
      }
      content = await fs.readFile(argv.file, 'utf8');
    }

    if (!content) {
      spinner.warn(chalk.yellow('No content provided'));
      console.log(chalk.yellow('\n⚠️  No content to update\n'));
      console.log(chalk.bold('Usage:'));
      console.log(`  ${chalk.yellow(`autopm context update ${argv.type} --content "New content"`)}`);
      console.log(`  ${chalk.yellow(`autopm context update ${argv.type} --file updates.md`)}\n`);
      return;
    }

    const options = {
      mode: argv.mode || 'append',
      content
    };

    const result = await contextService.updateContext(argv.type, options);

    spinner.succeed(chalk.green('Context updated'));

    console.log(chalk.cyan('\n✏️  Context Updated Successfully\n'));
    console.log(chalk.gray('='.repeat(60)) + '\n');

    console.log(chalk.bold('Type:       ') + argv.type);
    console.log(chalk.bold('Mode:       ') + options.mode);
    console.log(chalk.bold('Updated:    ') + new Date(result.timestamp).toLocaleString());

    console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');

    console.log(chalk.bold('💡 Next Steps:\n'));
    console.log(`  ${chalk.cyan('1.')} View updated context: ${chalk.yellow(`autopm context show ${argv.type}`)}`);
    console.log(`  ${chalk.cyan('2.')} Generate snapshot:    ${chalk.yellow('autopm context prime')}\n`);

    console.log(chalk.gray('='.repeat(60)) + '\n');

  } catch (error) {
    spinner.fail(chalk.red('Failed to update context'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}\n`));
      console.error(chalk.yellow('Available contexts:'));
      console.error(chalk.gray(`  Use: ${chalk.yellow('autopm context show --list')}\n`));
    } else {
      console.error(chalk.red(`\nError: ${error.message}\n`));
    }
    process.exit(1);
  }
}

/**
 * Context Show - Show context or list all contexts
 * @param {Object} argv - Command arguments
 */
async function contextShow(argv) {
  const contextService = new ContextService();

  // List all contexts
  if (argv.list) {
    const spinner = ora('Loading contexts...').start();

    try {
      const { contexts, byType } = await contextService.listContexts();

      spinner.succeed(chalk.green('Contexts loaded'));

      console.log(chalk.cyan('\n📚 All Contexts\n'));
      console.log(chalk.gray('='.repeat(60)) + '\n');

      if (contexts.length === 0) {
        console.log(chalk.yellow('No contexts found\n'));
        console.log(chalk.bold('💡 Create your first context:'));
        console.log(`   ${chalk.yellow('autopm context create project-brief --name "My Project"')}\n`);
        return;
      }

      // Group by type
      Object.keys(byType).forEach(type => {
        console.log(chalk.bold(`\n${type}:`));
        byType[type].forEach(ctx => {
          const sizeMB = (ctx.size / 1024).toFixed(2);
          console.log(`  • ${ctx.file} ${chalk.gray(`(${sizeMB}KB, updated ${new Date(ctx.updated).toLocaleDateString()}`)}`);
        });
      });

      console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');

      console.log(chalk.bold('📊 Summary:\n'));
      console.log(`  Total contexts: ${contexts.length}`);
      console.log(`  Types:          ${Object.keys(byType).length}\n`);

      // Show stats if requested
      if (argv.stats) {
        const spinner2 = ora('Analyzing context usage...').start();
        const { stats, recommendations } = await contextService.analyzeContextUsage();
        spinner2.succeed(chalk.green('Analysis complete'));

        console.log(chalk.gray('─'.repeat(60)) + '\n');
        console.log(chalk.bold('📈 Statistics:\n'));
        console.log(`  Total size:     ${(stats.totalSize / 1024).toFixed(2)}KB`);
        console.log(`  Average size:   ${(stats.averageSize / 1024).toFixed(2)}KB`);

        if (recommendations.length > 0) {
          console.log('\n' + chalk.bold('💡 Recommendations:\n'));
          recommendations.forEach((rec, index) => {
            console.log(`  ${index + 1}. ${rec}`);
          });
        }
        console.log('');
      }

      console.log(chalk.gray('='.repeat(60)) + '\n');

    } catch (error) {
      spinner.fail(chalk.red('Failed to load contexts'));
      console.error(chalk.red(`\nError: ${error.message}\n`));
      process.exit(1);
    }
    return;
  }

  // Show specific context
  if (!argv.type) {
    console.log(chalk.yellow('\n⚠️  No context type specified\n'));
    console.log(chalk.bold('Usage:'));
    console.log(`  ${chalk.yellow('autopm context show <type>')}`);
    console.log(`  ${chalk.yellow('autopm context show --list')}\n`);
    console.log(chalk.bold('Examples:'));
    console.log(`  ${chalk.gray('autopm context show project-brief')}`);
    console.log(`  ${chalk.gray('autopm context show --list')}`);
    console.log(`  ${chalk.gray('autopm context show --list --stats')}\n`);
    return;
  }

  const spinner = ora(`Loading ${argv.type} context...`).start();

  try {
    const result = await contextService.getContext(argv.type);

    spinner.succeed(chalk.green('Context loaded'));

    console.log(chalk.cyan(`\n📄 Context: ${argv.type}\n`));
    console.log(chalk.gray('='.repeat(60)) + '\n');

    console.log(chalk.bold('Type:       ') + result.type);
    console.log(chalk.bold('Updated:    ') + new Date(result.updated).toLocaleString());

    if (result.metadata) {
      const metaKeys = Object.keys(result.metadata);
      if (metaKeys.length > 0) {
        console.log('\n' + chalk.bold('Metadata:\n'));
        metaKeys.forEach(key => {
          console.log(`  ${key}: ${result.metadata[key]}`);
        });
      }
    }

    console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');

    // Show content (skip frontmatter)
    const contentWithoutFrontmatter = result.content.replace(/^---[\s\S]*?---\n\n/, '');
    console.log(contentWithoutFrontmatter);

    console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');

    console.log(chalk.bold('💡 Actions:\n'));
    console.log(`  ${chalk.cyan('1.')} Update context:  ${chalk.yellow(`autopm context update ${argv.type}`)}`);
    console.log(`  ${chalk.cyan('2.')} List all:        ${chalk.yellow('autopm context show --list')}\n`);

    console.log(chalk.gray('='.repeat(60)) + '\n');

  } catch (error) {
    spinner.fail(chalk.red('Failed to load context'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: Context "${argv.type}" not found\n`));
      console.error(chalk.yellow('Available contexts:'));
      console.error(chalk.gray(`  Use: ${chalk.yellow('autopm context show --list')}\n`));
    } else {
      console.error(chalk.red(`\nError: ${error.message}\n`));
    }
    process.exit(1);
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
      'create <type>',
      'Create new context from template',
      (yargs) => {
        return yargs
          .positional('type', {
            describe: 'Context type (project-brief, progress, tech-context, project-structure)',
            type: 'string'
          })
          .option('name', {
            describe: 'Context name',
            type: 'string'
          })
          .option('description', {
            describe: 'Context description',
            type: 'string'
          })
          .example('autopm context create project-brief --name "My Project"', 'Create project brief')
          .example('autopm context create progress --name "Sprint 1"', 'Create progress tracker');
      },
      contextCreate
    )
    .command(
      'prime',
      'Generate comprehensive project snapshot',
      (yargs) => {
        return yargs
          .option('include-git', {
            describe: 'Include git information',
            type: 'boolean',
            default: true
          })
          .option('output', {
            describe: 'Output file path',
            type: 'string'
          })
          .example('autopm context prime', 'Generate project snapshot')
          .example('autopm context prime --output snapshot.md', 'Save snapshot to file')
          .example('autopm context prime --no-include-git', 'Skip git information');
      },
      contextPrime
    )
    .command(
      'update <type>',
      'Update existing context',
      (yargs) => {
        return yargs
          .positional('type', {
            describe: 'Context type to update',
            type: 'string'
          })
          .option('mode', {
            describe: 'Update mode',
            type: 'string',
            choices: ['append', 'replace'],
            default: 'append'
          })
          .option('content', {
            describe: 'New content',
            type: 'string'
          })
          .option('file', {
            describe: 'Read content from file',
            type: 'string'
          })
          .example('autopm context update project-brief --content "## New Section"', 'Append content')
          .example('autopm context update progress --file updates.md', 'Update from file')
          .example('autopm context update tech-context --mode replace --content "..."', 'Replace content');
      },
      contextUpdate
    )
    .command(
      'show [type]',
      'Show context or list all contexts',
      (yargs) => {
        return yargs
          .positional('type', {
            describe: 'Context type to show',
            type: 'string'
          })
          .option('list', {
            describe: 'List all contexts',
            type: 'boolean',
            default: false
          })
          .option('stats', {
            describe: 'Show statistics with list',
            type: 'boolean',
            default: false
          })
          .example('autopm context show project-brief', 'Show specific context')
          .example('autopm context show --list', 'List all contexts')
          .example('autopm context show --list --stats', 'List with statistics');
      },
      contextShow
    )
    .demandCommand(1, 'You must specify a context command')
    .strictCommands()
    .help();
}

/**
 * Command export
 */
module.exports = {
  command: 'context',
  describe: 'Manage project context files for AI-assisted development',
  builder,
  handler: (argv) => {
    if (!argv._.includes('context') || argv._.length === 1) {
      console.log(chalk.yellow('\nPlease specify a context command\n'));
      console.log('Usage: autopm context <command>\n');
      console.log('Available commands:');
      console.log('  create <type>         Create new context from template');
      console.log('  prime                 Generate comprehensive project snapshot');
      console.log('  update <type>         Update existing context');
      console.log('  show [type]           Show context or list all contexts');
      console.log('\nUse: autopm context <command> --help for more info\n');
    }
  },
  handlers: {
    create: contextCreate,
    prime: contextPrime,
    update: contextUpdate,
    show: contextShow
  }
};
