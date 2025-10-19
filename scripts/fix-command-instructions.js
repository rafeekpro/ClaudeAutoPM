#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

/**
 * Fix PM commands missing proper ## Instructions sections
 *
 * This script:
 * 1. Scans all PM commands
 * 2. Identifies commands with corresponding .js scripts
 * 3. Adds proper ## Instructions sections where missing
 * 4. Fixes malformed instruction sections
 */

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Template for Instructions section
function generateInstructionsSection(scriptName, commandName) {
  return `

---

## Instructions

Run \`node .claude/scripts/pm/${scriptName}.js $ARGUMENTS\` using the Bash tool and show me the complete output.

- You MUST display the complete output.
- DO NOT truncate.
- DO NOT collapse.
- DO NOT abbreviate.`;
}

// Check if file has proper ## Instructions section
async function hasProperInstructions(filePath) {
  const content = await fs.readFile(filePath, 'utf8');

  // Check for ## Instructions header
  const hasHeader = /^## Instructions$/m.test(content);

  // Check for node .claude/scripts/pm/ call
  const hasNodeCall = /node \.claude\/scripts\/pm\//.test(content);

  return { hasHeader, hasNodeCall, content };
}

// Fix command file by adding Instructions section
async function fixCommandFile(commandPath, scriptName, dryRun = false) {
  const { hasHeader, hasNodeCall, content } = await hasProperInstructions(commandPath);

  if (hasHeader && hasNodeCall) {
    return { status: 'ok', message: 'Already has proper Instructions section' };
  }

  let newContent = content;

  if (!hasHeader && !hasNodeCall) {
    // No instructions at all - add at the end
    const commandName = path.basename(commandPath, '.md').replace('pm:', '');
    const instructions = generateInstructionsSection(scriptName, commandName);
    newContent = content.trimEnd() + instructions + '\n';

    if (!dryRun) {
      await fs.writeFile(commandPath, newContent);
    }

    return { status: 'added', message: 'Added missing Instructions section' };
  } else if (hasNodeCall && !hasHeader) {
    // Has instructions but no proper header - fix structure
    // Find where the node call is and add header before it
    const nodeCallMatch = content.match(/(Run `node \.claude\/scripts\/pm\/.*?`)/);
    if (nodeCallMatch) {
      const nodeCallLine = nodeCallMatch[0];
      newContent = content.replace(
        nodeCallLine,
        `---\n\n## Instructions\n\n${nodeCallLine}`
      );

      if (!dryRun) {
        await fs.writeFile(commandPath, newContent);
      }

      return { status: 'fixed', message: 'Added missing ## Instructions header' };
    }
  }

  return { status: 'skip', message: 'No action needed' };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const targetDir = process.argv.find(arg => !arg.startsWith('--') && arg !== process.argv[0] && arg !== process.argv[1]);

  console.log(`${colors.cyan}🔧 Fixing PM Command Instructions Sections${colors.reset}`);
  console.log(`Mode: ${dryRun ? colors.yellow + 'DRY RUN' : colors.green + 'LIVE'}${colors.reset}\n`);

  // Determine project root
  let projectRoot;
  if (targetDir) {
    projectRoot = path.resolve(targetDir);
  } else {
    // Try to auto-detect: check if we're in AUTOPM dev project or installed project
    const cwd = process.cwd();
    if (await fs.access(path.join(cwd, 'autopm', '.claude')).then(() => true).catch(() => false)) {
      projectRoot = cwd; // AUTOPM dev project
    } else {
      projectRoot = cwd; // Installed project (commands are in .claude/)
    }
  }

  // Detect project structure
  let commandsDir, scriptsDir;

  // Try plugin structure first (packages/plugin-pm/)
  if (await fs.access(path.join(projectRoot, 'commands')).then(() => true).catch(() => false)) {
    commandsDir = path.join(projectRoot, 'commands');
    scriptsDir = path.join(projectRoot, 'scripts', 'pm');
  }
  // Try dev project (autopm/.claude/)
  else if (await fs.access(path.join(projectRoot, 'autopm', '.claude', 'commands')).then(() => true).catch(() => false)) {
    commandsDir = path.join(projectRoot, 'autopm', '.claude', 'commands');
    scriptsDir = path.join(projectRoot, 'autopm', '.claude', 'scripts', 'pm');
  }
  // Try installed project (.claude/)
  else {
    commandsDir = path.join(projectRoot, '.claude', 'commands');
    scriptsDir = path.join(projectRoot, '.claude', 'scripts', 'pm');
  }

  console.log(`${colors.gray}Commands dir: ${commandsDir}${colors.reset}`);
  console.log(`${colors.gray}Scripts dir:  ${scriptsDir}${colors.reset}\n`);

  try {
    // Get all PM scripts
    const scriptFiles = await fs.readdir(scriptsDir);
    const scripts = scriptFiles
      .filter(f => f.endsWith('.js'))
      .map(f => path.basename(f, '.js'));

    console.log(`${colors.gray}Found ${scripts.length} PM scripts${colors.reset}\n`);

    let stats = {
      ok: 0,
      added: 0,
      fixed: 0,
      skip: 0,
      error: 0
    };

    // Process each script
    for (const scriptName of scripts) {
      const commandFile = `pm:${scriptName}.md`;
      const commandPath = path.join(commandsDir, commandFile);

      try {
        // Check if command file exists
        await fs.access(commandPath);

        // Fix the command file
        const result = await fixCommandFile(commandPath, scriptName, dryRun);
        stats[result.status]++;

        const statusIcon = {
          ok: '✅',
          added: '➕',
          fixed: '🔧',
          skip: '⏭️',
          error: '❌'
        }[result.status];

        const statusColor = {
          ok: colors.green,
          added: colors.cyan,
          fixed: colors.yellow,
          skip: colors.gray,
          error: colors.red
        }[result.status];

        console.log(`${statusIcon} ${statusColor}${commandFile.padEnd(30)}${colors.reset} ${result.message}`);

      } catch (error) {
        if (error.code === 'ENOENT') {
          console.log(`${colors.gray}⚠️  ${commandFile.padEnd(30)} No command file found${colors.reset}`);
        } else {
          stats.error++;
          console.log(`${colors.red}❌ ${commandFile.padEnd(30)} Error: ${error.message}${colors.reset}`);
        }
      }
    }

    // Summary
    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}✅ OK:${colors.reset}      ${stats.ok} commands already correct`);
    console.log(`${colors.cyan}➕ Added:${colors.reset}   ${stats.added} commands had Instructions section added`);
    console.log(`${colors.yellow}🔧 Fixed:${colors.reset}   ${stats.fixed} commands had header added`);
    console.log(`${colors.gray}⏭️  Skip:${colors.reset}    ${stats.skip} commands skipped`);
    if (stats.error > 0) {
      console.log(`${colors.red}❌ Errors:${colors.reset}  ${stats.error} commands had errors`);
    }
    console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);

    if (dryRun) {
      console.log(`\n${colors.yellow}This was a dry run. Run without --dry-run to apply changes.${colors.reset}`);
    } else {
      console.log(`\n${colors.green}✅ All fixes applied successfully!${colors.reset}`);
    }

  } catch (error) {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

main();
