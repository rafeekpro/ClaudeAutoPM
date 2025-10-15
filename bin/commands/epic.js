/**
 * Epic Command for autopm CLI
 * Read-only utility for viewing epic status and breakdown
 *
 * NOTE: This is a READ-ONLY utility command for viewing epics.
 * To CREATE or MODIFY epics, use Claude Code commands:
 *   /pm:prd-new <name>           - Create new PRD
 *   /pm:epic-decompose <name>    - Decompose PRD into epic
 *   /pm:epic-sync <name>         - Sync epic with provider
 *   /pm:epic-edit <name>         - Edit existing epic
 *
 * This CLI command is for quick status checks outside of Claude Code.
 */

const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

module.exports = {
  command: 'epic <action> [name]',
  describe: 'View epic status and breakdown (read-only utility)',

  builder: (yargs) => {
    return yargs
      .positional('action', {
        describe: 'Epic action to perform',
        type: 'string',
        choices: ['status', 'list', 'breakdown']
      })
      .positional('name', {
        describe: 'Epic name (for status action)',
        type: 'string'
      })
      .option('detailed', {
        alias: 'd',
        describe: 'Show detailed breakdown',
        type: 'boolean',
        default: false
      })
      .example('autopm epic list', 'List all available epics')
      .example('autopm epic status fullstack', 'Show status of fullstack epic')
      .example('autopm epic breakdown fullstack', 'Show detailed task breakdown')
      .epilogue(`
📝 Note: This is a READ-ONLY command for viewing epics.

To create or modify epics, use Claude Code:
  /pm:prd-new <name>           - Create new PRD
  /pm:epic-decompose <name>    - Decompose PRD into epic
  /pm:epic-sync <name>         - Sync epic with provider
  /pm:epic-edit <name>         - Edit existing epic

Use this CLI command for quick status checks outside Claude Code.
      `);
  },

  handler: async (argv) => {
    const action = argv.action;
    const name = argv.name;

    try {
      switch (action) {
        case 'list':
          listEpics();
          break;

        case 'status':
          if (!name) {
            console.error('Error: Epic name required for status action');
            console.log('Usage: autopm epic status <epic-name>');
            process.exit(1);
          }
          showEpicStatus(name);
          break;

        case 'breakdown':
          if (!name) {
            console.error('Error: Epic name required for breakdown action');
            console.log('Usage: autopm epic breakdown <epic-name>');
            process.exit(1);
          }
          showEpicBreakdown(name);
          break;

        default:
          console.error(`Unknown action: ${action}`);
          process.exit(1);
      }
    } catch (error) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  }
};

function listEpics() {
  const epicsDir = path.join(process.cwd(), '.claude', 'epics');

  if (!fs.existsSync(epicsDir)) {
    console.log('No epics found. Create epics with /pm:epic-split or /pm:epic-decompose');
    return;
  }

  const epics = fs.readdirSync(epicsDir).filter(f => {
    return fs.statSync(path.join(epicsDir, f)).isDirectory();
  });

  if (epics.length === 0) {
    console.log('No epics found. Create epics with /pm:epic-split or /pm:epic-decompose');
    return;
  }

  console.log('Available Epics:');
  console.log('================\n');

  epics.forEach(epic => {
    console.log(`  • ${epic}`);
  });

  console.log('');
  console.log('Use: autopm epic status <epic-name> to see details');
}

function showEpicStatus(epicName) {
  const scriptPath = path.join(process.cwd(), 'scripts', 'epic-status.sh');

  if (!fs.existsSync(scriptPath)) {
    console.error('Error: epic-status.sh script not found');
    console.error('Run: autopm install to get the latest scripts');
    process.exit(1);
  }

  try {
    execSync(`bash "${scriptPath}" "${epicName}"`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
  } catch (error) {
    process.exit(error.status || 1);
  }
}

function showEpicBreakdown(epicName) {
  const epicDir = path.join(process.cwd(), '.claude', 'epics', epicName);

  if (!fs.existsSync(epicDir)) {
    console.error(`Error: Epic '${epicName}' not found`);
    process.exit(1);
  }

  console.log(`Epic Breakdown: ${epicName}`);
  console.log('='.repeat(50));
  console.log('');

  // Find all task files
  const findTasks = (dir, prefix = '') => {
    const items = fs.readdirSync(dir);

    items.forEach(item => {
      const itemPath = path.join(dir, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        console.log(`\n${prefix}📁 ${item}`);
        findTasks(itemPath, prefix + '  ');
      } else if (item.match(/^\d{3}\.md$/)) {
        const content = fs.readFileSync(itemPath, 'utf-8');
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const statusMatch = content.match(/^status:\s+(.+)$/m);

        const title = titleMatch ? titleMatch[1] : item;
        const status = statusMatch ? statusMatch[1] : 'pending';

        const icon = status === 'completed' ? '✅' : status === 'in-progress' ? '🔄' : '⚪';

        console.log(`${prefix}  ${icon} ${item}: ${title}`);
      }
    });
  };

  findTasks(epicDir);
}
