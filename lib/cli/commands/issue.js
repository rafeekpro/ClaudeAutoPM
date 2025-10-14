/**
 * CLI Issue Commands
 *
 * Provides Issue management commands for ClaudeAutoPM.
 * Implements subcommands for issue lifecycle management.
 *
 * Commands:
 * - show <number>: Display issue details
 * - start <number>: Start working on issue
 * - close <number>: Close and complete issue
 * - status <number>: Check issue status
 * - edit <number>: Edit issue in editor
 * - sync <number>: Sync issue with GitHub/Azure
 *
 * @module cli/commands/issue
 * @requires ../../services/IssueService
 * @requires fs-extra
 * @requires ora
 * @requires chalk
 * @requires path
 */

const IssueService = require('../../services/IssueService');
const fs = require('fs-extra');
const ora = require('ora');
const chalk = require('chalk');
const path = require('path');
const { spawn } = require('child_process');
const readline = require('readline');

/**
 * Get issue file path
 * @param {number|string} issueNumber - Issue number
 * @returns {string} Full path to issue file
 */
function getIssuePath(issueNumber) {
  return path.join(process.cwd(), '.claude', 'issues', `${issueNumber}.md`);
}

/**
 * Read issue file
 * @param {number|string} issueNumber - Issue number
 * @returns {Promise<string>} Issue content
 * @throws {Error} If file doesn't exist or can't be read
 */
async function readIssueFile(issueNumber) {
  const issuePath = getIssuePath(issueNumber);

  const exists = await fs.pathExists(issuePath);
  if (!exists) {
    throw new Error(`Issue file not found: ${issuePath}`);
  }

  return await fs.readFile(issuePath, 'utf8');
}

/**
 * Show issue details
 * @param {Object} argv - Command arguments
 */
async function issueShow(argv) {
  const spinner = ora(`Loading issue: #${argv.number}`).start();

  try {
    const issueService = new IssueService();
    const issue = await issueService.getLocalIssue(argv.number);

    spinner.succeed(chalk.green('Issue loaded'));

    // Display metadata table
    console.log('\n' + chalk.bold('📋 Issue Details') + '\n');
    console.log(chalk.gray('─'.repeat(50)) + '\n');

    console.log(chalk.bold('ID:       ') + (issue.id || argv.number));
    console.log(chalk.bold('Title:    ') + (issue.title || 'N/A'));
    console.log(chalk.bold('Status:   ') + chalk.yellow(issue.status || 'open'));

    if (issue.assignee) {
      console.log(chalk.bold('Assignee: ') + issue.assignee);
    }

    if (issue.labels) {
      console.log(chalk.bold('Labels:   ') + issue.labels);
    }

    if (issue.created) {
      console.log(chalk.bold('Created:  ') + new Date(issue.created).toLocaleDateString());
    }

    if (issue.started) {
      console.log(chalk.bold('Started:  ') + new Date(issue.started).toLocaleDateString());
      const duration = issueService.formatIssueDuration(issue.started);
      console.log(chalk.bold('Duration: ') + duration);
    }

    if (issue.completed) {
      console.log(chalk.bold('Completed:') + new Date(issue.completed).toLocaleDateString());
      const duration = issueService.formatIssueDuration(issue.started, issue.completed);
      console.log(chalk.bold('Duration: ') + duration);
    }

    if (issue.url) {
      console.log(chalk.bold('URL:      ') + chalk.cyan(issue.url));
    }

    // Show issue content
    console.log('\n' + chalk.gray('─'.repeat(80)) + '\n');

    // Extract and display description (skip frontmatter)
    const contentWithoutFrontmatter = issue.content.replace(/^---[\s\S]*?---\n\n/, '');
    console.log(contentWithoutFrontmatter);

    console.log('\n' + chalk.gray('─'.repeat(80)) + '\n');

    console.log(chalk.dim(`File: ${issue.path}\n`));

  } catch (error) {
    spinner.fail(chalk.red('Failed to show issue'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}`));
      console.error(chalk.yellow('Use: autopm issue list to see available issues'));
    } else {
      console.error(chalk.red(`\nError: ${error.message}`));
    }
  }
}

/**
 * Start working on issue
 * @param {Object} argv - Command arguments
 */
async function issueStart(argv) {
  const spinner = ora(`Starting issue: #${argv.number}`).start();

  try {
    const issueService = new IssueService();

    // Check if issue exists
    await issueService.getLocalIssue(argv.number);

    // Update status to in-progress
    await issueService.updateIssueStatus(argv.number, 'in-progress');

    spinner.succeed(chalk.green('Issue started'));

    console.log(chalk.green(`\n✅ Issue #${argv.number} is now in progress!`));

    const issuePath = getIssuePath(argv.number);
    console.log(chalk.cyan(`📄 File: ${issuePath}\n`));

    console.log(chalk.bold('📋 What You Can Do Next:\n'));
    console.log(`  ${chalk.cyan('1.')} Check status:    ${chalk.yellow('autopm issue status ' + argv.number)}`);
    console.log(`  ${chalk.cyan('2.')} Edit issue:      ${chalk.yellow('autopm issue edit ' + argv.number)}`);
    console.log(`  ${chalk.cyan('3.')} Close when done: ${chalk.yellow('autopm issue close ' + argv.number)}\n`);

  } catch (error) {
    spinner.fail(chalk.red('Failed to start issue'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}`));
      console.error(chalk.yellow('Use: autopm issue list to see available issues'));
    } else {
      console.error(chalk.red(`\nError: ${error.message}`));
    }
  }
}

/**
 * Close issue
 * @param {Object} argv - Command arguments
 */
async function issueClose(argv) {
  const spinner = ora(`Closing issue: #${argv.number}`).start();

  try {
    const issueService = new IssueService();

    // Check if issue exists
    await issueService.getLocalIssue(argv.number);

    // Update status to closed
    await issueService.updateIssueStatus(argv.number, 'closed');

    spinner.succeed(chalk.green('Issue closed'));

    console.log(chalk.green(`\n✅ Issue #${argv.number} completed!`));

    const issuePath = getIssuePath(argv.number);
    console.log(chalk.cyan(`📄 File: ${issuePath}\n`));

    console.log(chalk.bold('📋 What You Can Do Next:\n'));
    console.log(`  ${chalk.cyan('1.')} View issue:      ${chalk.yellow('autopm issue show ' + argv.number)}`);
    console.log(`  ${chalk.cyan('2.')} Check status:    ${chalk.yellow('autopm issue status ' + argv.number)}\n`);

  } catch (error) {
    spinner.fail(chalk.red('Failed to close issue'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}`));
      console.error(chalk.yellow('Use: autopm issue list to see available issues'));
    } else {
      console.error(chalk.red(`\nError: ${error.message}`));
    }
  }
}

/**
 * Show issue status
 * @param {Object} argv - Command arguments
 */
async function issueStatus(argv) {
  const spinner = ora(`Analyzing issue: #${argv.number}`).start();

  try {
    const issueService = new IssueService();
    const issue = await issueService.getLocalIssue(argv.number);

    spinner.succeed(chalk.green('Status analyzed'));

    // Display status
    console.log('\n' + chalk.bold('📊 Issue Status Report') + '\n');
    console.log(chalk.gray('─'.repeat(50)) + '\n');

    console.log(chalk.bold('Metadata:'));
    console.log(`  ID:        #${issue.id || argv.number}`);
    console.log(`  Title:     ${issue.title || 'N/A'}`);
    console.log(`  Status:    ${chalk.yellow(issue.status || 'open')}`);

    if (issue.assignee) {
      console.log(`  Assignee:  ${issue.assignee}`);
    }

    if (issue.labels) {
      console.log(`  Labels:    ${issue.labels}`);
    }

    console.log('\n' + chalk.bold('Timeline:'));

    if (issue.created) {
      console.log(`  Created:   ${new Date(issue.created).toLocaleString()}`);
    }

    if (issue.started) {
      console.log(`  Started:   ${new Date(issue.started).toLocaleString()}`);

      if (issue.completed) {
        const duration = issueService.formatIssueDuration(issue.started, issue.completed);
        console.log(`  Completed: ${new Date(issue.completed).toLocaleString()}`);
        console.log(`  Duration:  ${duration}`);
      } else {
        const duration = issueService.formatIssueDuration(issue.started);
        console.log(`  Duration:  ${duration} (ongoing)`);
      }
    }

    // Show related files
    const relatedFiles = await issueService.getIssueFiles(argv.number);
    if (relatedFiles.length > 0) {
      console.log('\n' + chalk.bold('Related Files:'));
      relatedFiles.forEach(file => {
        console.log(`  • ${file}`);
      });
    }

    // Show dependencies
    const dependencies = await issueService.getDependencies(argv.number);
    if (dependencies.length > 0) {
      console.log('\n' + chalk.bold('Dependencies:'));
      dependencies.forEach(dep => {
        console.log(`  • Issue #${dep}`);
      });
    }

    // Show sub-issues
    const subIssues = await issueService.getSubIssues(argv.number);
    if (subIssues.length > 0) {
      console.log('\n' + chalk.bold('Sub-Issues:'));
      subIssues.forEach(sub => {
        console.log(`  • Issue #${sub}`);
      });
    }

    console.log('\n' + chalk.gray('─'.repeat(50)) + '\n');

    const issuePath = getIssuePath(argv.number);
    console.log(chalk.dim(`File: ${issuePath}\n`));

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
 * Edit issue in editor
 * @param {Object} argv - Command arguments
 */
async function issueEdit(argv) {
  const spinner = ora(`Opening issue: #${argv.number}`).start();

  try {
    const issuePath = getIssuePath(argv.number);

    // Check if file exists
    const exists = await fs.pathExists(issuePath);
    if (!exists) {
      spinner.fail(chalk.red('Issue not found'));
      console.error(chalk.red(`\nError: Issue file not found: ${issuePath}`));
      console.error(chalk.yellow('Use: autopm issue list to see available issues'));
      return;
    }

    spinner.succeed(chalk.green('Opening editor...'));

    // Determine editor
    const editor = process.env.EDITOR || process.env.VISUAL || 'nano';

    // Spawn editor
    const child = spawn(editor, [issuePath], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    // Wait for editor to close
    await new Promise((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          console.log(chalk.green('\n✓ Issue saved'));
          resolve();
        } else {
          reject(new Error(`Editor exited with code ${code}`));
        }
      });
      child.on('error', reject);
    });

  } catch (error) {
    spinner.fail(chalk.red('Failed to edit issue'));
    console.error(chalk.red(`\nError: ${error.message}`));
  }
}

/**
 * Sync issue with GitHub/Azure
 * @param {Object} argv - Command arguments
 */
async function issueSync(argv) {
  const spinner = ora(`Syncing issue: #${argv.number}`).start();

  try {
    const issueService = new IssueService();

    // Check if issue exists
    const issue = await issueService.getLocalIssue(argv.number);

    // TODO: Implement provider integration
    // For now, just show a message
    spinner.info(chalk.yellow('Provider sync not yet implemented'));

    console.log(chalk.yellow(`\n⚠️  GitHub/Azure sync feature coming soon!\n`));

    console.log(chalk.dim('This feature will:'));
    console.log(chalk.dim('  - Create GitHub/Azure issue if not exists'));
    console.log(chalk.dim('  - Update existing issue'));
    console.log(chalk.dim('  - Sync issue status and comments\n'));

    console.log(chalk.bold('For now, you can:'));
    console.log(`  ${chalk.cyan('1.')} View issue:      ${chalk.yellow('autopm issue show ' + argv.number)}`);
    console.log(`  ${chalk.cyan('2.')} Check status:    ${chalk.yellow('autopm issue status ' + argv.number)}\n`);

  } catch (error) {
    spinner.fail(chalk.red('Failed to sync issue'));

    if (error.message.includes('not found')) {
      console.error(chalk.red(`\nError: ${error.message}`));
    } else {
      console.error(chalk.red(`\nError: ${error.message}`));
    }
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
      'show <number>',
      'Display issue details',
      (yargs) => {
        return yargs
          .positional('number', {
            describe: 'Issue number',
            type: 'number'
          })
          .example('autopm issue show 123', 'Display issue #123');
      },
      issueShow
    )
    .command(
      'start <number>',
      'Start working on issue',
      (yargs) => {
        return yargs
          .positional('number', {
            describe: 'Issue number',
            type: 'number'
          })
          .example('autopm issue start 123', 'Mark issue #123 as in-progress');
      },
      issueStart
    )
    .command(
      'close <number>',
      'Close and complete issue',
      (yargs) => {
        return yargs
          .positional('number', {
            describe: 'Issue number',
            type: 'number'
          })
          .example('autopm issue close 123', 'Mark issue #123 as completed');
      },
      issueClose
    )
    .command(
      'status <number>',
      'Check issue status',
      (yargs) => {
        return yargs
          .positional('number', {
            describe: 'Issue number',
            type: 'number'
          })
          .example('autopm issue status 123', 'Show status of issue #123');
      },
      issueStatus
    )
    .command(
      'edit <number>',
      'Edit issue in your editor',
      (yargs) => {
        return yargs
          .positional('number', {
            describe: 'Issue number',
            type: 'number'
          })
          .example('autopm issue edit 123', 'Open issue #123 in editor')
          .example('EDITOR=code autopm issue edit 123', 'Open in VS Code');
      },
      issueEdit
    )
    .command(
      'sync <number>',
      'Sync issue with GitHub/Azure',
      (yargs) => {
        return yargs
          .positional('number', {
            describe: 'Issue number',
            type: 'number'
          })
          .option('push', {
            describe: 'Push local changes to provider',
            type: 'boolean',
            default: false
          })
          .option('pull', {
            describe: 'Pull updates from provider',
            type: 'boolean',
            default: false
          })
          .example('autopm issue sync 123', 'Sync issue #123 with provider')
          .example('autopm issue sync 123 --push', 'Push local changes')
          .example('autopm issue sync 123 --pull', 'Pull remote updates');
      },
      issueSync
    )
    .demandCommand(1, 'You must specify an issue command')
    .strictCommands()
    .help();
}

/**
 * Command export
 */
module.exports = {
  command: 'issue',
  describe: 'Manage issues and task lifecycle',
  builder,
  handler: (argv) => {
    if (!argv._.includes('issue') || argv._.length === 1) {
      console.log(chalk.yellow('\nPlease specify an issue command\n'));
      console.log('Usage: autopm issue <command>\n');
      console.log('Available commands:');
      console.log('  show <number>         Display issue details');
      console.log('  start <number>        Start working on issue');
      console.log('  close <number>        Close issue');
      console.log('  status <number>       Check issue status');
      console.log('  edit <number>         Edit issue in editor');
      console.log('  sync <number>         Sync with GitHub/Azure');
      console.log('\nUse: autopm issue <command> --help for more info\n');
    }
  },
  handlers: {
    show: issueShow,
    start: issueStart,
    close: issueClose,
    status: issueStatus,
    edit: issueEdit,
    sync: issueSync
  }
};
