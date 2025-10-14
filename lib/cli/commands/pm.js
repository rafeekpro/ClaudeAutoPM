/**
 * CLI PM (Project Management) Commands
 *
 * Provides workflow and project management commands for ClaudeAutoPM.
 * Implements subcommands for workflow analysis and task prioritization.
 *
 * Commands:
 * - next: Get next priority task based on dependencies and priorities
 * - what-next: AI-powered suggestions for next steps
 * - standup: Generate daily standup report
 * - status: Project status overview and health
 * - in-progress: Show all active tasks
 * - blocked: Show all blocked tasks
 *
 * @module cli/commands/pm
 * @requires ../../services/WorkflowService
 * @requires ../../services/IssueService
 * @requires ../../services/EpicService
 * @requires fs-extra
 * @requires ora
 * @requires chalk
 * @requires path
 */

const WorkflowService = require('../../services/WorkflowService');
const IssueService = require('../../services/IssueService');
const EpicService = require('../../services/EpicService');
const UtilityService = require('../../services/UtilityService');
const fs = require('fs-extra');
const ora = require('ora');
const chalk = require('chalk');
const path = require('path');

/**
 * Get service instances
 * @returns {Object} Service instances
 */
async function getServices() {
  const issueService = new IssueService();
  const epicService = new EpicService();
  const workflowService = new WorkflowService({
    issueService,
    epicService
  });
  return { workflowService, issueService, epicService };
}

/**
 * PM Next - Get next priority task
 * @param {Object} argv - Command arguments
 */
async function pmNext(argv) {
  const spinner = ora('Finding next priority task...').start();

  try {
    const { workflowService } = await getServices();
    const nextTask = await workflowService.getNextTask();

    if (!nextTask) {
      spinner.info(chalk.yellow('No available tasks found'));

      console.log(chalk.yellow('\n⚠️  No tasks available to start\n'));
      console.log(chalk.bold('Possible reasons:'));
      console.log('  • All tasks are completed or in-progress');
      console.log('  • Remaining tasks are blocked by dependencies');
      console.log('  • No tasks have been created yet\n');

      console.log(chalk.bold('💡 Suggestions:'));
      console.log(`  ${chalk.cyan('1.')} Check blocked tasks:  ${chalk.yellow('autopm pm blocked')}`);
      console.log(`  ${chalk.cyan('2.')} Check active work:    ${chalk.yellow('autopm pm in-progress')}`);
      console.log(`  ${chalk.cyan('3.')} View all tasks:       ${chalk.yellow('autopm issue list')}\n`);
      return;
    }

    spinner.succeed(chalk.green('Found next task'));

    // Display task with reasoning
    console.log(chalk.cyan('\n📋 Next Task:\n'));
    console.log(chalk.gray('─'.repeat(60)) + '\n');

    console.log(chalk.bold(`#${nextTask.id}: ${nextTask.title}`));
    if (nextTask.epic) {
      console.log(chalk.gray(`Epic: ${nextTask.epic}`));
    }
    console.log(chalk.gray(`Priority: ${nextTask.priority || 'P2'}`));
    if (nextTask.effort) {
      console.log(chalk.gray(`Estimated effort: ${nextTask.effort}`));
    }

    console.log(chalk.yellow(`\n💡 Why this task?\n${nextTask.reasoning}`));

    console.log('\n' + chalk.gray('─'.repeat(60)) + '\n');

    // TDD Reminder
    console.log(chalk.red('⚠️  TDD REMINDER - Before starting work:\n'));
    console.log(chalk.dim('   🚨 ALWAYS follow Test-Driven Development:'));
    console.log(chalk.dim('   1. RED: Write failing test first'));
    console.log(chalk.dim('   2. GREEN: Write minimal code to pass'));
    console.log(chalk.dim('   3. REFACTOR: Clean up while keeping tests green\n'));

    console.log(chalk.green('✅ Ready to start?'));
    console.log(`   ${chalk.yellow(`autopm issue start ${nextTask.id}`)}\n`);
  } catch (error) {
    spinner.fail(chalk.red('Failed to find next task'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
  }
}

/**
 * PM What-Next - AI-powered next step suggestions
 * @param {Object} argv - Command arguments
 */
async function pmWhatNext(argv) {
  const spinner = ora('Analyzing project state...').start();

  try {
    const { workflowService } = await getServices();
    const result = await workflowService.getWhatNext();

    spinner.succeed(chalk.green('Analysis complete'));

    console.log(chalk.cyan('\n🤔 What Should You Work On Next?\n'));
    console.log(chalk.gray('='.repeat(60)) + '\n');

    // Display project state
    console.log(chalk.bold('📊 Current Project State:\n'));
    console.log(`  PRDs:          ${result.projectState.prdCount}`);
    console.log(`  Epics:         ${result.projectState.epicCount}`);
    console.log(`  Total Issues:  ${result.projectState.issueCount}`);
    console.log(`  Open:          ${result.projectState.openIssues}`);
    console.log(`  In Progress:   ${result.projectState.inProgressIssues}`);
    console.log(`  Blocked:       ${result.projectState.blockedIssues}\n`);

    console.log(chalk.gray('─'.repeat(60)) + '\n');

    // Display suggestions
    console.log(chalk.bold('💡 Suggested Next Steps:\n'));

    result.suggestions.forEach((suggestion, index) => {
      const marker = suggestion.recommended ? '⭐' : '○';
      const priorityColor = suggestion.priority === 'high' ? chalk.red : chalk.yellow;

      console.log(`${index + 1}. ${marker} ${chalk.bold(suggestion.title)}`);
      console.log(`   ${suggestion.description}`);
      console.log(`   ${priorityColor(`Priority: ${suggestion.priority.toUpperCase()}`)}`);

      if (Array.isArray(suggestion.commands)) {
        suggestion.commands.forEach(cmd => {
          console.log(`   ${chalk.yellow(cmd)}`);
        });
      }

      console.log(`   ${chalk.dim(`💭 ${suggestion.why}`)}\n`);
    });

    if (result.suggestions.length === 0) {
      console.log(chalk.yellow('  No specific suggestions at this time\n'));
    }

    console.log(chalk.gray('─'.repeat(60)) + '\n');
  } catch (error) {
    spinner.fail(chalk.red('Failed to analyze project'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
  }
}

/**
 * PM Standup - Generate daily standup report
 * @param {Object} argv - Command arguments
 */
async function pmStandup(argv) {
  const spinner = ora('Generating standup report...').start();

  try {
    const { workflowService } = await getServices();
    const report = await workflowService.generateStandup();

    spinner.succeed(chalk.green('Standup report generated'));

    console.log(chalk.cyan(`\n📅 Daily Standup - ${report.date}\n`));
    console.log(chalk.gray('='.repeat(60)) + '\n');

    // Yesterday
    console.log(chalk.bold('✅ Yesterday (Completed):\n'));
    if (report.yesterday.length > 0) {
      report.yesterday.forEach(task => {
        console.log(`   #${task.id} - ${task.title}`);
        if (task.epic) {
          console.log(`   ${chalk.gray(`Epic: ${task.epic}`)}`);
        }
        console.log('');
      });
    } else {
      console.log(chalk.gray('   No tasks completed yesterday\n'));
    }

    console.log(chalk.gray('─'.repeat(60)) + '\n');

    // Today
    console.log(chalk.bold('🚀 Today (In Progress):\n'));
    if (report.today.length > 0) {
      report.today.forEach(task => {
        console.log(`   #${task.id} - ${task.title || 'Unnamed task'}`);
        if (task.stale) {
          console.log(`   ${chalk.red('⚠️  STALE (>3 days in progress)')}`);
        }
        console.log('');
      });
    } else {
      console.log(chalk.gray('   No tasks currently in progress\n'));
    }

    console.log(chalk.gray('─'.repeat(60)) + '\n');

    // Blockers
    console.log(chalk.bold('🚫 Blockers:\n'));
    if (report.blockers.length > 0) {
      report.blockers.forEach(task => {
        console.log(`   #${task.id} - ${task.title || 'Unnamed task'}`);
        console.log(`   ${chalk.red(`Blocked by: ${task.reason}`)}`);
        if (task.daysBlocked) {
          console.log(`   ${chalk.gray(`Blocked for: ${task.daysBlocked} days`)}`);
        }
        console.log('');
      });
    } else {
      console.log(chalk.green('   No blockers! 🎉\n'));
    }

    console.log(chalk.gray('─'.repeat(60)) + '\n');

    // Metrics
    console.log(chalk.bold('📊 Metrics:\n'));
    console.log(`  Velocity:        ${report.velocity} tasks/day (7-day avg)`);
    console.log(`  Sprint Progress: ${report.sprintProgress.completed}/${report.sprintProgress.total} (${report.sprintProgress.percentage}%)\n`);

    console.log(chalk.gray('='.repeat(60)) + '\n');
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate standup'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
  }
}

/**
 * PM Status - Project status overview
 * @param {Object} argv - Command arguments
 */
async function pmStatus(argv) {
  const spinner = ora('Analyzing project status...').start();

  try {
    const { workflowService } = await getServices();
    const status = await workflowService.getProjectStatus();

    spinner.succeed(chalk.green('Status analysis complete'));

    console.log(chalk.cyan('\n📊 Project Status Overview\n'));
    console.log(chalk.gray('='.repeat(60)) + '\n');

    // Epics
    console.log(chalk.bold('📚 Epics:\n'));
    console.log(`   Backlog:       ${status.epics.backlog}`);
    console.log(`   Planning:      ${status.epics.planning}`);
    console.log(`   In Progress:   ${status.epics.inProgress}`);
    console.log(`   Completed:     ${status.epics.completed}`);
    console.log(`   ${chalk.bold('Total:')}         ${status.epics.total}\n`);

    console.log(chalk.gray('─'.repeat(60)) + '\n');

    // Issues
    console.log(chalk.bold('📋 Issues:\n'));
    console.log(`   Open:          ${status.issues.open}`);
    console.log(`   In Progress:   ${status.issues.inProgress}`);
    console.log(`   Blocked:       ${chalk.red(status.issues.blocked)}`);
    console.log(`   Closed:        ${chalk.green(status.issues.closed)}`);
    console.log(`   ${chalk.bold('Total:')}         ${status.issues.total}\n`);

    console.log(chalk.gray('─'.repeat(60)) + '\n');

    // Progress
    console.log(chalk.bold('📈 Progress:\n'));
    console.log(`   Overall:       ${status.progress.overall}% complete`);
    console.log(`   Velocity:      ${status.progress.velocity} tasks/day\n`);

    console.log(chalk.gray('─'.repeat(60)) + '\n');

    // Health
    const healthColor = status.health === 'ON_TRACK' ? chalk.green : chalk.red;
    console.log(chalk.bold('🎯 Health: ') + healthColor(status.health) + '\n');

    if (status.recommendations.length > 0) {
      console.log(chalk.bold('💡 Recommendations:\n'));
      status.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
      console.log('');
    }

    console.log(chalk.gray('='.repeat(60)) + '\n');
  } catch (error) {
    spinner.fail(chalk.red('Failed to analyze status'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
  }
}

/**
 * PM In-Progress - Show all active tasks
 * @param {Object} argv - Command arguments
 */
async function pmInProgress(argv) {
  const spinner = ora('Finding active tasks...').start();

  try {
    const { workflowService } = await getServices();
    const tasks = await workflowService.getInProgressTasks();

    spinner.succeed(chalk.green('Active tasks found'));

    console.log(chalk.cyan('\n🚀 In Progress Tasks\n'));
    console.log(chalk.gray('='.repeat(60)) + '\n');

    if (tasks.length === 0) {
      console.log(chalk.yellow('No tasks currently in progress\n'));
      console.log(chalk.bold('💡 Ready to start work?'));
      console.log(`   ${chalk.yellow('autopm pm next')}\n`);
      return;
    }

    // Group by epic if available
    const byEpic = {};
    tasks.forEach(task => {
      const epic = task.epic || 'No Epic';
      if (!byEpic[epic]) {
        byEpic[epic] = [];
      }
      byEpic[epic].push(task);
    });

    Object.keys(byEpic).forEach(epicName => {
      console.log(chalk.bold(`Epic: ${epicName}\n`));

      byEpic[epicName].forEach(task => {
        console.log(`   #${task.id} - ${task.title || 'Unnamed task'}`);
        if (task.started) {
          console.log(`   ${chalk.gray(`Started: ${new Date(task.started).toLocaleDateString()}`)}`);
        }
        if (task.assignee) {
          console.log(`   ${chalk.gray(`Assignee: ${task.assignee}`)}`);
        }
        if (task.stale) {
          console.log(`   ${chalk.red('⚠️  STALE (>3 days without update)')}`);
          console.log(`   ${chalk.yellow('💡 Consider checking in or splitting task')}`);
        }
        console.log('');
      });
    });

    // Summary
    const staleCount = tasks.filter(t => t.stale).length;
    console.log(chalk.gray('─'.repeat(60)) + '\n');
    console.log(chalk.bold('📊 Summary:\n'));
    console.log(`   Total active: ${tasks.length} tasks`);
    if (staleCount > 0) {
      console.log(`   ${chalk.red(`⚠️  Stale: ${staleCount} tasks (>3 days)`)}`);
    }
    console.log('');

    console.log(chalk.gray('='.repeat(60)) + '\n');
  } catch (error) {
    spinner.fail(chalk.red('Failed to find active tasks'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
  }
}

/**
 * PM Blocked - Show all blocked tasks
 * @param {Object} argv - Command arguments
 */
async function pmBlocked(argv) {
  const spinner = ora('Finding blocked tasks...').start();

  try {
    const { workflowService } = await getServices();
    const tasks = await workflowService.getBlockedTasks();

    spinner.succeed(chalk.green('Blocked tasks analyzed'));

    console.log(chalk.cyan('\n🚫 Blocked Tasks\n'));
    console.log(chalk.gray('='.repeat(60)) + '\n');

    if (tasks.length === 0) {
      console.log(chalk.green('✅ No blocked tasks! All tasks are unblocked.\n'));
      console.log(chalk.bold('💡 Ready to work?'));
      console.log(`   ${chalk.yellow('autopm pm next')}\n`);
      return;
    }

    tasks.forEach((task, index) => {
      console.log(`${index + 1}. ${chalk.bold(`#${task.id} - ${task.title || 'Unnamed task'}`)}`);
      console.log(`   ${chalk.red(`Blocked by: ${task.reason}`)}`);
      if (task.daysBlocked !== undefined) {
        const daysLabel = task.daysBlocked === 1 ? 'day' : 'days';
        const daysColor = task.daysBlocked > 3 ? chalk.red : chalk.yellow;
        console.log(`   ${daysColor(`Blocked since: ${task.daysBlocked} ${daysLabel} ago`)}`);
      }
      if (task.suggestedAction) {
        console.log(`   ${chalk.yellow(`💡 Action: ${task.suggestedAction}`)}`);
      }
      console.log('');
    });

    // Summary
    const criticalCount = tasks.filter(t => t.daysBlocked > 3).length;
    console.log(chalk.gray('─'.repeat(60)) + '\n');
    console.log(chalk.bold('📊 Summary:\n'));
    console.log(`   Total blocked: ${tasks.length} tasks`);
    if (criticalCount > 0) {
      console.log(`   ${chalk.red(`🔴 Critical: ${criticalCount} tasks (>3 days)`)}`);
    }
    console.log('');

    console.log(chalk.bold('💡 Recommendations:\n'));
    console.log('   1. Unblock critical tasks first (>3 days)');
    console.log('   2. Review and resolve dependencies');
    console.log('   3. Update stakeholders on delays\n');

    console.log(chalk.gray('='.repeat(60)) + '\n');
  } catch (error) {
    spinner.fail(chalk.red('Failed to find blocked tasks'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
  }
}

/**
 * PM Init - Initialize PM structure
 * @param {Object} argv - Command arguments
 */
async function pmInit(argv) {
  const spinner = ora('Initializing project structure...').start();
  try {
    const utilityService = new UtilityService();
    const result = await utilityService.initializeProject({
      force: argv.force,
      template: argv.template
    });

    spinner.succeed(chalk.green('Project initialized'));
    console.log(chalk.cyan('\n📁 Created:\n'));
    result.created.forEach(item => {
      console.log(chalk.gray(`  ✓ ${item}`));
    });
    console.log(chalk.green('\n✅ Ready to use ClaudeAutoPM!'));
    console.log(chalk.gray('Next steps:'));
    console.log(chalk.gray('  1. autopm config set provider github'));
    console.log(chalk.gray('  2. autopm prd create my-feature\n'));
  } catch (error) {
    spinner.fail(chalk.red('Failed to initialize'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * PM Validate - Validate project structure
 * @param {Object} argv - Command arguments
 */
async function pmValidate(argv) {
  const spinner = ora('Validating project...').start();
  try {
    const utilityService = new UtilityService();
    const result = await utilityService.validateProject({
      strict: argv.strict,
      fix: argv.fix
    });

    if (result.valid) {
      spinner.succeed(chalk.green('Project is valid'));
    } else {
      spinner.warn(chalk.yellow('Issues found'));
    }

    if (result.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors:\n'));
      result.errors.forEach(err => console.log(chalk.red(`  • ${err}`)));
    }

    if (result.warnings.length > 0) {
      console.log(chalk.yellow('\n⚠️  Warnings:\n'));
      result.warnings.forEach(warn => console.log(chalk.yellow(`  • ${warn}`)));
    }

    if (!result.valid) {
      console.log(chalk.cyan('\n💡 Fix issues automatically:'));
      console.log(chalk.gray('  autopm pm validate --fix\n'));
    } else {
      console.log(chalk.green('\n✅ Project structure is valid\n'));
    }
  } catch (error) {
    spinner.fail(chalk.red('Validation failed'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * PM Sync - Sync with provider
 * @param {Object} argv - Command arguments
 */
async function pmSync(argv) {
  const spinner = ora('Syncing with provider...').start();
  try {
    const utilityService = new UtilityService();
    const result = await utilityService.syncAll({
      type: argv.type || 'all',
      dryRun: argv.dryRun
    });

    spinner.succeed(chalk.green('Sync complete'));
    console.log(chalk.cyan('\n📊 Sync Results:\n'));
    console.log(chalk.gray(`  Epics:  ${result.synced.epics || 0}`));
    console.log(chalk.gray(`  Issues: ${result.synced.issues || 0}`));
    console.log(chalk.gray(`  PRDs:   ${result.synced.prds || 0}`));

    if (result.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors:\n'));
      result.errors.forEach(err => console.log(chalk.red(`  • ${err}`)));
    }

    console.log('');
  } catch (error) {
    spinner.fail(chalk.red('Sync failed'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * PM Clean - Clean artifacts
 * @param {Object} argv - Command arguments
 */
async function pmClean(argv) {
  const spinner = ora('Cleaning artifacts...').start();
  try {
    const utilityService = new UtilityService();
    const result = await utilityService.cleanArtifacts({
      archive: argv.archive,
      dryRun: argv.dryRun
    });

    spinner.succeed(chalk.green('Cleanup complete'));
    console.log(chalk.cyan('\n🧹 Cleanup Results:\n'));
    console.log(chalk.gray(`  Removed:  ${result.removed.length} files`));
    console.log(chalk.gray(`  Archived: ${result.archived.length} files`));

    if (argv.dryRun) {
      console.log(chalk.yellow('\n⚠️  Dry run mode - no changes made'));
      console.log(chalk.gray('Remove --dry-run to apply changes\n'));
    } else {
      console.log('');
    }
  } catch (error) {
    spinner.fail(chalk.red('Cleanup failed'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * PM Search - Search entities
 * @param {Object} argv - Command arguments
 */
async function pmSearch(argv) {
  const spinner = ora('Searching...').start();
  try {
    const utilityService = new UtilityService();
    const result = await utilityService.searchEntities(argv.query, {
      type: argv.type,
      regex: argv.regex,
      status: argv.status
    });

    spinner.succeed(chalk.green(`Found ${result.results.length} matches`));

    console.log(chalk.cyan('\n🔍 Search Results:\n'));

    if (result.results.length === 0) {
      console.log(chalk.gray('  No matches found\n'));
      return;
    }

    // Group by type
    const grouped = {};
    result.results.forEach(item => {
      if (!grouped[item.type]) grouped[item.type] = [];
      grouped[item.type].push(item);
    });

    Object.entries(grouped).forEach(([type, items]) => {
      console.log(chalk.bold(`\n${type.toUpperCase()}S:`));
      items.forEach(item => {
        console.log(chalk.gray(`  • ${item.id}: ${item.title}`));
        if (item.match) {
          console.log(chalk.yellow(`    "${item.match.substring(0, 80)}..."`));
        }
      });
    });
    console.log('');
  } catch (error) {
    spinner.fail(chalk.red('Search failed'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
    process.exit(1);
  }
}

/**
 * PM Import - Import from external source
 * @param {Object} argv - Command arguments
 */
async function pmImport(argv) {
  const spinner = ora('Importing...').start();
  try {
    const utilityService = new UtilityService();
    const result = await utilityService.importFromProvider(argv.source, {
      provider: argv.provider,
      mapping: argv.mapping ? JSON.parse(argv.mapping) : null
    });

    spinner.succeed(chalk.green('Import complete'));
    console.log(chalk.cyan('\n📥 Import Results:\n'));
    console.log(chalk.gray(`  Imported: ${result.imported.length} items`));

    if (result.errors.length > 0) {
      console.log(chalk.red('\n❌ Errors:\n'));
      result.errors.forEach(err => console.log(chalk.red(`  • ${err}`)));
    }

    console.log('');
  } catch (error) {
    spinner.fail(chalk.red('Import failed'));
    console.error(chalk.red(`\nError: ${error.message}\n`));
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
      'next',
      'Get next priority task',
      (yargs) => {
        return yargs
          .example('autopm pm next', 'Show next priority task to work on');
      },
      pmNext
    )
    .command(
      'what-next',
      'AI-powered next step suggestions',
      (yargs) => {
        return yargs
          .example('autopm pm what-next', 'Get intelligent suggestions for next steps');
      },
      pmWhatNext
    )
    .command(
      'standup',
      'Generate daily standup report',
      (yargs) => {
        return yargs
          .example('autopm pm standup', 'Generate daily standup summary');
      },
      pmStandup
    )
    .command(
      'status',
      'Project status overview',
      (yargs) => {
        return yargs
          .example('autopm pm status', 'Show overall project health and metrics');
      },
      pmStatus
    )
    .command(
      'in-progress',
      'Show all active tasks',
      (yargs) => {
        return yargs
          .example('autopm pm in-progress', 'List all tasks currently being worked on');
      },
      pmInProgress
    )
    .command(
      'blocked',
      'Show all blocked tasks',
      (yargs) => {
        return yargs
          .example('autopm pm blocked', 'List all blocked tasks with reasons');
      },
      pmBlocked
    )
    .command(
      'init',
      'Initialize PM structure',
      (yargs) => {
        return yargs
          .option('force', { type: 'boolean', desc: 'Overwrite existing files' })
          .option('template', { type: 'string', desc: 'Template file to use' })
          .example('autopm pm init', 'Initialize project PM structure')
          .example('autopm pm init --force', 'Reinitialize with overwrite');
      },
      pmInit
    )
    .command(
      'validate',
      'Validate project structure',
      (yargs) => {
        return yargs
          .option('strict', { type: 'boolean', desc: 'Strict validation mode' })
          .option('fix', { type: 'boolean', desc: 'Auto-fix issues' })
          .example('autopm pm validate', 'Validate project structure')
          .example('autopm pm validate --fix', 'Validate and auto-fix issues');
      },
      pmValidate
    )
    .command(
      'sync',
      'Sync with provider',
      (yargs) => {
        return yargs
          .option('type', { type: 'string', choices: ['all', 'epic', 'issue', 'prd'], default: 'all', desc: 'Entity type to sync' })
          .option('dry-run', { type: 'boolean', desc: 'Preview changes without applying' })
          .example('autopm pm sync', 'Sync all entities')
          .example('autopm pm sync --type epic --dry-run', 'Preview epic sync');
      },
      pmSync
    )
    .command(
      'clean',
      'Clean old artifacts',
      (yargs) => {
        return yargs
          .option('archive', { type: 'boolean', default: true, desc: 'Archive before delete' })
          .option('dry-run', { type: 'boolean', desc: 'Preview cleanup' })
          .example('autopm pm clean', 'Clean stale files (with archive)')
          .example('autopm pm clean --dry-run', 'Preview cleanup');
      },
      pmClean
    )
    .command(
      'search <query>',
      'Search entities',
      (yargs) => {
        return yargs
          .positional('query', { type: 'string', describe: 'Search query' })
          .option('type', { type: 'string', choices: ['all', 'epic', 'issue', 'prd'], default: 'all', desc: 'Entity type' })
          .option('regex', { type: 'boolean', desc: 'Use regex pattern' })
          .option('status', { type: 'string', desc: 'Filter by status' })
          .example('autopm pm search "auth"', 'Search for "auth"')
          .example('autopm pm search --regex "user.*api"', 'Regex search');
      },
      pmSearch
    )
    .command(
      'import <source>',
      'Import from external source',
      (yargs) => {
        return yargs
          .positional('source', { type: 'string', describe: 'Source file path' })
          .option('provider', { type: 'string', choices: ['github', 'azure', 'csv', 'json'], default: 'json', desc: 'Source provider' })
          .option('mapping', { type: 'string', desc: 'Field mapping JSON' })
          .example('autopm pm import data.json', 'Import from JSON')
          .example('autopm pm import data.csv --provider csv', 'Import from CSV');
      },
      pmImport
    )
    .demandCommand(1, 'You must specify a pm command')
    .strictCommands()
    .help();
}

/**
 * Command export
 */
module.exports = {
  command: 'pm',
  describe: 'Project management and workflow commands',
  builder,
  handler: (argv) => {
    if (!argv._.includes('pm') || argv._.length === 1) {
      console.log(chalk.yellow('\nPlease specify a pm command\n'));
      console.log('Usage: autopm pm <command>\n');
      console.log('Available commands:');
      console.log('  next              Get next priority task');
      console.log('  what-next         AI-powered next step suggestions');
      console.log('  standup           Generate daily standup report');
      console.log('  status            Project status overview');
      console.log('  in-progress       Show all active tasks');
      console.log('  blocked           Show all blocked tasks');
      console.log('  init              Initialize PM structure');
      console.log('  validate          Validate project structure');
      console.log('  sync              Sync with provider');
      console.log('  clean             Clean old artifacts');
      console.log('  search            Search entities');
      console.log('  import            Import from external source');
      console.log('\nUse: autopm pm <command> --help for more info\n');
    }
  },
  handlers: {
    next: pmNext,
    whatNext: pmWhatNext,
    standup: pmStandup,
    status: pmStatus,
    inProgress: pmInProgress,
    blocked: pmBlocked,
    init: pmInit,
    validate: pmValidate,
    sync: pmSync,
    clean: pmClean,
    search: pmSearch,
    import: pmImport
  }
};
