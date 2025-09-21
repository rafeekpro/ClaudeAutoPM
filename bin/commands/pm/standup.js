/**
 * Standup Command
 * Shows daily activity summary
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const {
  printError,
  printSuccess,
  printInfo,
  printWarning,
  createSpinner
} = require('../../../lib/commandHelpers');

// Command Definition
exports.command = 'pm:standup';
exports.describe = 'Show daily standup report';

exports.builder = (yargs) => {
  return yargs
    .option('json', {
      describe: 'Output as JSON',
      type: 'boolean',
      default: false
    })
    .option('days', {
      describe: 'Number of days to look back',
      type: 'number',
      default: 1
    });
};

exports.handler = async (argv) => {
  const spinner = createSpinner('Generating standup report...');

  try {
    // Check if we're in Claude Code
    const isClaudeCode = process.env.CLAUDE_CODE === 'true' ||
                        process.env.ANTHROPIC_WORKSPACE === 'true';

    if (isClaudeCode) {
      // In Claude Code, run the full AI-powered standup
      spinner.info();
      console.log();
      console.log('📅 Running AI-powered standup in Claude Code...');
      console.log('Use: /pm:standup for full context-aware report');
      return;
    }

    // Deterministic standup - run the script
    const scriptPath = path.join(process.cwd(), '.claude', 'scripts', 'pm', 'standup.sh');

    // Check if script exists (project must be initialized)
    if (!await fs.pathExists(scriptPath)) {
      // Fallback to basic report
      spinner.text = 'Generating basic standup report...';

      const today = new Date().toISOString().split('T')[0];
      spinner.succeed();

      console.log();
      console.log(`📅 Daily Standup - ${today}`);
      console.log('================================');
      console.log();

      // Check for recent activity in .claude directory
      const claudeDir = path.join(process.cwd(), '.claude');
      if (await fs.pathExists(claudeDir)) {
        const prdsDir = path.join(claudeDir, 'prds');
        const epicsDir = path.join(claudeDir, 'epics');

        let activity = [];

        if (await fs.pathExists(prdsDir)) {
          const prds = await fs.readdir(prdsDir);
          const recentPrds = [];
          for (const prd of prds) {
            if (prd.endsWith('.md')) {
              const stat = await fs.stat(path.join(prdsDir, prd));
              const daysSince = (Date.now() - stat.mtime) / (1000 * 60 * 60 * 24);
              if (daysSince <= argv.days) {
                recentPrds.push(prd.replace('.md', ''));
              }
            }
          }
          if (recentPrds.length > 0) {
            activity.push(`• Modified ${recentPrds.length} PRD(s): ${recentPrds.join(', ')}`);
          }
        }

        if (await fs.pathExists(epicsDir)) {
          const epics = await fs.readdir(epicsDir);
          const recentEpics = [];
          for (const epic of epics) {
            const epicFile = path.join(epicsDir, epic);
            const stat = await fs.stat(epicFile);
            if (stat.isFile() && epic.endsWith('.md')) {
              const daysSince = (Date.now() - stat.mtime) / (1000 * 60 * 60 * 24);
              if (daysSince <= argv.days) {
                recentEpics.push(epic.replace('.md', ''));
              }
            }
          }
          if (recentEpics.length > 0) {
            activity.push(`• Updated ${recentEpics.length} epic(s): ${recentEpics.join(', ')}`);
          }
        }

        if (activity.length > 0) {
          console.log('📝 Recent Activity:');
          console.log('====================');
          activity.forEach(item => console.log(item));
        } else {
          console.log('No activity in the last ' + argv.days + ' day(s)');
        }

      } else {
        console.log('⚠️ No .claude directory found');
        console.log('Run: autopm pm:init to initialize project management');
      }

      console.log();
      printInfo('For AI-powered standup with GitHub/Azure integration:');
      printInfo('Use Claude Code and run: /pm:standup');

    } else {
      // Script exists - run it
      spinner.stop();

      return new Promise((resolve, reject) => {
        const child = spawn('bash', [scriptPath], {
          stdio: 'inherit',
          cwd: process.cwd()
        });

        child.on('error', (error) => {
          printError(`Failed to run standup script: ${error.message}`);
          reject(error);
        });

        child.on('exit', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Script exited with code ${code}`));
          }
        });
      });
    }

  } catch (error) {
    spinner.fail();
    printError(`Error: ${error.message}`);
    process.exit(1);
  }
};