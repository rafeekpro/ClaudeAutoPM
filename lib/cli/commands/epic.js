/**
 * CLI Epic Commands
 *
 * Provides Epic management commands.
 * Implements subcommands for epic lifecycle management.
 *
 * @module cli/commands/epic
 * @requires ../../services/EpicService
 * @requires fs-extra
 * @requires ora
 * @requires chalk
 * @requires path
 */

const EpicService = require('../../services/EpicService');
const fs = require('fs-extra');
const ora = require('ora');
const chalk = require('chalk');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

/**
 * Get epic directory path
 * @param {string} name - Epic name
 * @returns {string} Full path to epic directory
 */
function getEpicPath(name) {
  return path.join(process.cwd(), '.claude', 'epics', name);
}

/**
 * Read epic file
 * @param {string} name - Epic name
 * @returns {Promise<string>} Epic content
 * @throws {Error} If file doesn't exist or can't be read
 */
async function readEpicFile(name) {
  const epicPath = path.join(getEpicPath(name), 'epic.md');

  const exists = await fs.pathExists(epicPath);
  if (!exists) {
    throw new Error(`Epic file not found: ${epicPath}`);
  }

  return await fs.readFile(epicPath, 'utf8');
}

/**
 * List all epics
 * @param {Object} argv - Command arguments
 */
async function epicList(argv) {
  const spinner = ora('Loading epics...').start();

  try {
    const epicService = new EpicService();
    const epics = await epicService.listEpics();

    if (epics.length === 0) {
      spinner.info(chalk.yellow('No epics found'));
      console.log(chalk.yellow('\nCreate your first epic with: autopm epic new <name>'));
      return;
    }

    spinner.succeed(chalk.green(`Found ${epics.length} epic(s)`));

    // Group by status
    const grouped = {
      'Planning': [],
      'In Progress': [],
      'Completed': []
    };

    epics.forEach(epic => {
      const category = epicService.categorizeStatus(epic.status);
      if (category === 'planning') {
        grouped['Planning'].push(epic);
      } else if (category === 'in_progress') {
        grouped['In Progress'].push(epic);
      } else if (category === 'done') {
        grouped['Completed'].push(epic);
      } else {
        grouped['Planning'].push(epic);
      }
    });

    // Display grouped epics
    console.log(chalk.green('\n📋 Epics:\n'));

    Object.entries(grouped).forEach(([status, statusEpics]) => {
      if (statusEpics.length > 0) {
        const statusColor = status === 'Completed' ? chalk.green :
                           status === 'In Progress' ? chalk.yellow :
                           chalk.blue;

        console.log(statusColor(`\n${status}:`));

        statusEpics.forEach((epic, index) => {
          console.log(`  ${index + 1}. ${chalk.bold(epic.name)}`);
          console.log(`     ${chalk.dim('Progress:')} ${epic.progress.padEnd(10)} ${chalk.dim('Tasks:')} ${epic.taskCount}`);

          if (epic.githubIssue) {
            console.log(`     ${chalk.dim('GitHub:')} #${epic.githubIssue}`);
          }

          if (epic.created) {
            console.log(`     ${chalk.dim('Created:')} ${epic.created.split('T')[0]}`);
          }
        });
      }
    });

    console.log(chalk.dim(`\nTotal: ${epics.length} epic(s)`));
    console.log(chalk.dim('Use: autopm epic show <name> to view details\n'));

  } catch (error) {
    spinner.fail(chalk.red('Failed to list epics'));
    console.error(chalk.red(`\nError: ${error.message}`));
  }
}

/**
 * Show epic content
 * @param {Object} argv - Command arguments
 */
async function epicShow(argv) {
  const spinner = ora(`Loading epic: ${argv.name}`).start();

  try {
    const content = await readEpicFile(argv.name);
    const epicService = new EpicService();
    const metadata = epicService.parseFrontmatter(content);

    spinner.succeed(chalk.green('Epic loaded'));

    // Display metadata table
    console.log('\n' + chalk.bold('📊 Epic Metadata') + '\n');
    console.log(chalk.gray('─'.repeat(50)) + '\n');

    if (metadata) {
      console.log(chalk.bold('Name:     ') + (metadata.name || argv.name));
      console.log(chalk.bold('Status:   ') + (metadata.status || 'N/A'));
      console.log(chalk.bold('Progress: ') + (metadata.progress || 'N/A'));
      console.log(chalk.bold('Priority: ') + (metadata.priority || 'N/A'));
      console.log(chalk.bold('Created:  ') + (metadata.created ? metadata.created.split('T')[0] : 'N/A'));

      if (metadata.github) {
        console.log(chalk.bold('GitHub:   ') + metadata.github);
      }
    }

    console.log('\n' + chalk.gray('─'.repeat(80)) + '\n');
    console.log(content);
    console.log('\n' + chalk.gray('─'.repeat(80)) + '\n');

    const epicPath = path.join(getEpicPath(argv.name), 'epic.md');
    console.log(chalk.dim(`File: ${epicPath}\n`));

  } catch (error) {
    spinner.fail(chalk.red('Failed to show epic'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}`));
      console.error(chalk.yellow('Use: autopm epic list to see available epics'));
    } else {
      console.error(chalk.red(`\nError: ${error.message}`));
    }
  }
}

/**
 * Create new epic
 * @param {Object} argv - Command arguments
 */
async function epicNew(argv) {
  const spinner = ora(`Creating epic: ${argv.name}`).start();

  try {
    const epicPath = getEpicPath(argv.name);
    const epicFilePath = path.join(epicPath, 'epic.md');

    // Check if epic already exists
    const exists = await fs.pathExists(epicFilePath);
    if (exists) {
      spinner.fail(chalk.red('Epic already exists'));
      console.error(chalk.red(`\nError: Epic file already exists: ${epicFilePath}`));
      console.error(chalk.yellow('Use: autopm epic edit ' + argv.name + ' to modify it'));
      return;
    }

    // Create epic directory
    await fs.ensureDir(epicPath);

    spinner.stop();

    // Handle --from-prd flag
    if (argv['from-prd']) {
      return await epicNewFromPRD(argv, epicPath, epicFilePath);
    }

    // Interactive prompts
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const prompt = (question) => new Promise((resolve) => {
      rl.question(question, resolve);
    });

    console.log(chalk.cyan('\n🚀 Creating new epic...\n'));

    const title = await prompt(chalk.cyan('Title [' + argv.name + ']: ')) || argv.name;
    const description = await prompt(chalk.cyan('Description: '));
    const priority = await prompt(chalk.cyan('Priority (P0/P1/P2/P3) [P2]: ')) || 'P2';

    rl.close();

    // Build epic content
    const now = new Date().toISOString();
    const frontmatter = `---
name: ${argv.name}
status: backlog
created: ${now}
progress: 0%
prd: .claude/prds/${argv.name}.md
github: [Will be updated when synced to GitHub]
priority: ${priority}
---`;

    const content = `${frontmatter}

# Epic: ${title}

## Overview
${description || 'Epic description goes here.'}

## Task Breakdown

Tasks will be added as epic progresses.
`;

    // Write epic file
    await fs.writeFile(epicFilePath, content);

    console.log(chalk.green('\n✅ Epic created successfully!'));
    console.log(chalk.cyan(`📄 File: ${epicFilePath}\n`));

    // Show next steps
    console.log(chalk.bold('📋 What You Can Do Next:\n'));
    console.log(`  ${chalk.cyan('1.')} Edit epic:       ${chalk.yellow('autopm epic edit ' + argv.name)}`);
    console.log(`  ${chalk.cyan('2.')} Check status:    ${chalk.yellow('autopm epic status ' + argv.name)}`);
    console.log(`  ${chalk.cyan('3.')} Start working:   ${chalk.yellow('autopm epic start ' + argv.name)}`);
    console.log(`  ${chalk.cyan('4.')} Sync to GitHub:  ${chalk.yellow('autopm epic sync ' + argv.name)}\n`);

  } catch (error) {
    spinner.fail(chalk.red('Failed to create epic'));
    console.error(chalk.red(`\nError: ${error.message}`));
  }
}

/**
 * Create new epic from PRD
 * @param {Object} argv - Command arguments
 * @param {string} epicPath - Path to epic directory
 * @param {string} epicFilePath - Path to epic.md file
 */
async function epicNewFromPRD(argv, epicPath, epicFilePath) {
  const spinner = ora('Creating epic from PRD...').start();

  try {
    const prdPath = path.join(process.cwd(), '.claude', 'prds', `${argv['from-prd']}.md`);
    const prdExists = await fs.pathExists(prdPath);

    if (!prdExists) {
      spinner.fail(chalk.red('PRD not found'));
      console.error(chalk.red(`\nError: PRD file not found: ${prdPath}`));
      console.error(chalk.yellow('Use: autopm prd list to see available PRDs'));
      return;
    }

    const prdContent = await fs.readFile(prdPath, 'utf8');
    const epicService = new EpicService();
    const prdMetadata = epicService.parseFrontmatter(prdContent);

    // Build epic from PRD
    const now = new Date().toISOString();
    const frontmatter = `---
name: ${argv.name}
status: backlog
created: ${now}
progress: 0%
prd: .claude/prds/${argv['from-prd']}.md
github: [Will be updated when synced to GitHub]
priority: ${prdMetadata?.priority || 'P2'}
---`;

    const content = `${frontmatter}

# Epic: ${argv.name}

## Overview
Created from PRD: ${argv['from-prd']}

${prdContent.split('## Problem Statement')[1]?.split('##')[0] || ''}

## Task Breakdown

Tasks will be generated from PRD analysis.
`;

    await fs.writeFile(epicFilePath, content);

    spinner.succeed(chalk.green('Epic created from PRD'));

    console.log(chalk.green('\n✅ Epic created successfully!'));
    console.log(chalk.cyan(`📄 File: ${epicFilePath}`));
    console.log(chalk.cyan(`📋 Source PRD: ${prdPath}\n`));

  } catch (error) {
    spinner.fail(chalk.red('Failed to create epic from PRD'));
    console.error(chalk.red(`\nError: ${error.message}`));
  }
}

/**
 * Edit epic in editor
 * @param {Object} argv - Command arguments
 */
async function epicEdit(argv) {
  const spinner = ora(`Opening epic: ${argv.name}`).start();

  try {
    const epicFilePath = path.join(getEpicPath(argv.name), 'epic.md');

    // Check if file exists
    const exists = await fs.pathExists(epicFilePath);
    if (!exists) {
      spinner.fail(chalk.red('Epic not found'));
      console.error(chalk.red(`\nError: Epic file not found: ${epicFilePath}`));
      console.error(chalk.yellow('Use: autopm epic list to see available epics'));
      return;
    }

    spinner.succeed(chalk.green('Opening editor...'));

    // Determine editor
    const editor = process.env.EDITOR || process.env.VISUAL || 'nano';

    // Spawn editor
    const child = spawn(editor, [epicFilePath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Wait for editor to close
    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('\n✓ Epic saved'));
          resolve();
        } else {
          reject(new Error(`Editor exited with code ${code}`));
        }
      });
      child.on('error', reject);
    });

  } catch (error) {
    spinner.fail(chalk.red('Failed to edit epic'));
    console.error(chalk.red(`\nError: ${error.message}`));
  }
}

/**
 * Show epic status
 * @param {Object} argv - Command arguments
 */
async function epicStatus(argv) {
  const spinner = ora(`Analyzing epic: ${argv.name}`).start();

  try {
    const epicService = new EpicService();
    const epic = await epicService.getEpic(argv.name);

    spinner.succeed(chalk.green('Status analyzed'));

    // Display status
    console.log('\n' + chalk.bold('📊 Epic Status Report') + '\n');
    console.log(chalk.gray('─'.repeat(50)) + '\n');

    console.log(chalk.bold('Metadata:'));
    console.log(`  Name:      ${epic.name}`);
    console.log(`  Status:    ${chalk.yellow(epic.status)}`);
    console.log(`  Priority:  ${chalk.red(epic.priority || 'P2')}`);
    console.log(`  Created:   ${epic.created ? epic.created.split('T')[0] : 'N/A'}`);

    if (epic.github && epic.githubIssue) {
      console.log(`  GitHub:    #${epic.githubIssue}`);
    }

    // Progress bar
    const progressPercent = parseInt(epic.progress) || 0;
    const progressBar = epicService.generateProgressBar(progressPercent, 20);

    console.log('\n' + chalk.bold('Progress:') + ` ${progressPercent}%`);
    console.log(`  [${progressPercent >= 80 ? chalk.green(progressBar.bar.slice(1, -1)) :
                      progressPercent >= 50 ? chalk.yellow(progressBar.bar.slice(1, -1)) :
                      chalk.red(progressBar.bar.slice(1, -1))}]`);

    // Task statistics
    console.log('\n' + chalk.bold('Tasks:'));
    console.log(`  Total:     ${epic.taskCount}`);

    console.log('\n' + chalk.gray('─'.repeat(50)) + '\n');

    const epicPath = path.join(getEpicPath(argv.name), 'epic.md');
    console.log(chalk.dim(`File: ${epicPath}\n`));

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
 * Validate epic structure
 * @param {Object} argv - Command arguments
 */
async function epicValidate(argv) {
  const spinner = ora(`Validating epic: ${argv.name}`).start();

  try {
    const epicService = new EpicService();
    const result = await epicService.validateEpicStructure(argv.name);

    if (result.valid) {
      spinner.succeed(chalk.green('Epic is valid'));
      console.log(chalk.green('\n✓ Validation passed - Epic structure is correct'));
    } else {
      spinner.fail(chalk.red(`Epic validation failed - ${result.issues.length} issues found`));
      console.error(chalk.red(`\n✗ Validation failed - ${result.issues.length} issue(s):`));
      result.issues.forEach((issue, index) => {
        console.error(chalk.red(`  ${index + 1}. ${issue}`));
      });
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to validate epic'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\n✗ Error: Epic not found`));
      console.error(chalk.red(`  ${error.message}`));
      console.error(chalk.yellow('\n💡 Use: autopm epic list to see available epics'));
    } else {
      console.error(chalk.red(`\n✗ Error: ${error.message}`));
    }
    process.exit(1);
  }
}

/**
 * Start working on epic
 * @param {Object} argv - Command arguments
 */
async function epicStart(argv) {
  const spinner = ora(`Starting epic: ${argv.name}`).start();

  try {
    const epicFilePath = path.join(getEpicPath(argv.name), 'epic.md');

    // Check if file exists
    const exists = await fs.pathExists(epicFilePath);
    if (!exists) {
      spinner.fail(chalk.red('Epic not found'));
      console.error(chalk.red(`\nError: Epic file not found: ${epicFilePath}`));
      console.error(chalk.yellow('Use: autopm epic list to see available epics'));
      return;
    }

    // Read current content
    let content = await fs.readFile(epicFilePath, 'utf8');

    // Update status to in-progress
    content = content.replace(/^status:\s*.+$/m, 'status: in-progress');

    // Add started date if not present
    if (!content.includes('started:')) {
      const now = new Date().toISOString();
      content = content.replace(/^(created:.+)$/m, `$1\nstarted: ${now}`);
    }

    // Write updated content
    await fs.writeFile(epicFilePath, content);

    spinner.succeed(chalk.green('Epic started'));

    console.log(chalk.green('\n✅ Epic is now in progress!'));
    console.log(chalk.cyan(`📄 File: ${epicFilePath}\n`));

    console.log(chalk.bold('📋 What You Can Do Next:\n'));
    console.log(`  ${chalk.cyan('1.')} Check status:    ${chalk.yellow('autopm epic status ' + argv.name)}`);
    console.log(`  ${chalk.cyan('2.')} Edit epic:       ${chalk.yellow('autopm epic edit ' + argv.name)}`);
    console.log(`  ${chalk.cyan('3.')} Close when done: ${chalk.yellow('autopm epic close ' + argv.name)}\n`);

  } catch (error) {
    spinner.fail(chalk.red('Failed to start epic'));
    console.error(chalk.red(`\nError: ${error.message}`));
  }
}

/**
 * Close epic
 * @param {Object} argv - Command arguments
 */
async function epicClose(argv) {
  const spinner = ora(`Closing epic: ${argv.name}`).start();

  try {
    const epicFilePath = path.join(getEpicPath(argv.name), 'epic.md');

    // Check if file exists
    const exists = await fs.pathExists(epicFilePath);
    if (!exists) {
      spinner.fail(chalk.red('Epic not found'));
      console.error(chalk.red(`\nError: Epic file not found: ${epicFilePath}`));
      console.error(chalk.yellow('Use: autopm epic list to see available epics'));
      return;
    }

    // Read current content
    let content = await fs.readFile(epicFilePath, 'utf8');

    // Update status to completed
    content = content.replace(/^status:\s*.+$/m, 'status: completed');

    // Update progress to 100%
    content = content.replace(/^progress:\s*.+$/m, 'progress: 100%');

    // Add completed date if not present
    if (!content.includes('completed:')) {
      const now = new Date().toISOString();
      content = content.replace(/^(created:.+)$/m, `$1\ncompleted: ${now}`);
    }

    // Write updated content
    await fs.writeFile(epicFilePath, content);

    spinner.succeed(chalk.green('Epic closed'));

    console.log(chalk.green('\n✅ Epic completed!'));
    console.log(chalk.cyan(`📄 File: ${epicFilePath}\n`));

    console.log(chalk.bold('📋 What You Can Do Next:\n'));
    console.log(`  ${chalk.cyan('1.')} Check status:    ${chalk.yellow('autopm epic status ' + argv.name)}`);
    console.log(`  ${chalk.cyan('2.')} View epic:       ${chalk.yellow('autopm epic show ' + argv.name)}\n`);

  } catch (error) {
    spinner.fail(chalk.red('Failed to close epic'));
    console.error(chalk.red(`\nError: ${error.message}`));
  }
}

/**
 * Sync epic with GitHub
 * @param {Object} argv - Command arguments
 */
async function epicSync(argv) {
  const spinner = ora(`Syncing epic: ${argv.name}`).start();

  try {
    const epicService = new EpicService();
    const epic = await epicService.getEpic(argv.name);

    // TODO: Implement GitHub integration
    // For now, just show a message
    spinner.info(chalk.yellow('GitHub sync not yet implemented'));

    console.log(chalk.yellow('\n⚠️  GitHub sync feature coming soon!\n'));

    console.log(chalk.dim('This feature will:'));
    console.log(chalk.dim('  - Create GitHub issue if not exists'));
    console.log(chalk.dim('  - Update existing GitHub issue'));
    console.log(chalk.dim('  - Sync epic status and progress\n'));

    console.log(chalk.bold('For now, you can:'));
    console.log(`  ${chalk.cyan('1.')} View epic:       ${chalk.yellow('autopm epic show ' + argv.name)}`);
    console.log(`  ${chalk.cyan('2.')} Check status:    ${chalk.yellow('autopm epic status ' + argv.name)}\n`);

  } catch (error) {
    spinner.fail(chalk.red('Failed to sync epic'));
    console.error(chalk.red(`\nError: ${error.message}`));
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
      'List all epics',
      (yargs) => {
        return yargs
          .option('status', {
            describe: 'Filter by status (planning/in-progress/completed)',
            type: 'string'
          })
          .example('autopm epic list', 'Show all epics')
          .example('autopm epic list --status in-progress', 'Show active epics');
      },
      epicList
    )
    .command(
      'show <name>',
      'Display epic content',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'Epic name',
            type: 'string'
          })
          .example('autopm epic show user-auth', 'Display epic details');
      },
      epicShow
    )
    .command(
      'new <name>',
      'Create new epic',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'Epic name (use-kebab-case)',
            type: 'string'
          })
          .option('from-prd', {
            describe: 'Create from PRD',
            type: 'string'
          })
          .option('template', {
            describe: 'Template to use',
            type: 'string'
          })
          .example('autopm epic new user-auth', 'Create new epic')
          .example('autopm epic new user-auth --from-prd my-feature', 'Create from PRD');
      },
      epicNew
    )
    .command(
      'edit <name>',
      'Edit epic in your editor',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'Epic name',
            type: 'string'
          })
          .example('autopm epic edit user-auth', 'Open epic in editor')
          .example('EDITOR=code autopm epic edit user-auth', 'Open in VS Code');
      },
      epicEdit
    )
    .command(
      'status <name>',
      'Show epic status and progress',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'Epic name',
            type: 'string'
          })
          .example('autopm epic status user-auth', 'Show epic status report');
      },
      epicStatus
    )
    .command(
      'validate <name>',
      'Validate epic structure',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'Epic name',
            type: 'string'
          })
          .example('autopm epic validate user-auth', 'Validate epic structure');
      },
      epicValidate
    )
    .command(
      'start <name>',
      'Start working on epic',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'Epic name',
            type: 'string'
          })
          .example('autopm epic start user-auth', 'Mark epic as in-progress');
      },
      epicStart
    )
    .command(
      'close <name>',
      'Close epic',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'Epic name',
            type: 'string'
          })
          .example('autopm epic close user-auth', 'Mark epic as completed');
      },
      epicClose
    )
    .command(
      'sync <name>',
      'Sync epic with GitHub',
      (yargs) => {
        return yargs
          .positional('name', {
            describe: 'Epic name',
            type: 'string'
          })
          .example('autopm epic sync user-auth', 'Sync epic to GitHub issue');
      },
      epicSync
    )
    .demandCommand(1, 'You must specify an epic action')
    .strictCommands()
    .help();
}

/**
 * Command export
 */
module.exports = {
  command: 'epic',
  describe: 'Manage epics and epic lifecycle',
  builder,
  handler: (argv) => {
    if (!argv._.includes('epic') || argv._.length === 1) {
      console.log(chalk.yellow('\nPlease specify an epic command\n'));
      console.log('Usage: autopm epic <command>\n');
      console.log('Available commands:');
      console.log('  list                  List all epics');
      console.log('  show <name>           Display epic');
      console.log('  new <name>            Create new epic');
      console.log('  edit <name>           Edit epic');
      console.log('  status <name>         Show epic status');
      console.log('  validate <name>       Validate epic');
      console.log('  start <name>          Start working on epic');
      console.log('  close <name>          Close epic');
      console.log('  sync <name>           Sync with GitHub');
      console.log('\nUse: autopm epic <command> --help for more info\n');
    }
  },
  handlers: {
    list: epicList,
    show: epicShow,
    new: epicNew,
    edit: epicEdit,
    status: epicStatus,
    validate: epicValidate,
    start: epicStart,
    close: epicClose,
    sync: epicSync
  }
};
