/**
 * Sync
 * Auto-migrated from pm:sync.md
 */

const agentExecutor = require('../../../lib/agentExecutor');
const {
  validateInput,
  loadEnvironment,
  isVerbose,
  printError,
  printSuccess,
  printInfo,
  printWarning,
  createSpinner
} = require('../../../lib/commandHelpers');

// --- Agent Prompt ---
const AGENT_PROMPT = `
# Sync

Full bidirectional sync between local and GitHub.

## Usage
\`\`\`
/pm:sync [epic_name]
\`\`\`

If epic_name provided, sync only that epic. Otherwise sync all.

## Instructions

### 1. Pull from GitHub

Get current state of all issues:
\`\`\`bash
# Get all epic and task issues
gh issue list --label "epic" --limit 1000 --json number,title,state,body,labels,updatedAt
gh issue list --label "task" --limit 1000 --json number,title,state,body,labels,updatedAt
\`\`\`

### 2. Update Local from GitHub

For each GitHub issue:
- Find corresponding local file by issue number
- Compare states:
  - If GitHub state newer (updatedAt > local updated), update local
  - If GitHub closed but local open, close local
  - If GitHub reopened but local closed, reopen local
- Update frontmatter to match GitHub state

### 3. Push Local to GitHub

For each local task/epic:
- If has GitHub URL but GitHub issue not found, it was deleted - mark local as archived
- If no GitHub URL, create new issue (like epic-sync)
- If local updated > GitHub updatedAt, push changes:
  \`\`\`bash
  gh issue edit {number} --body-file {local_file}
  \`\`\`

### 4. Handle Conflicts

If both changed (local and GitHub updated since last sync):
- Show both versions
- Ask user: "Local and GitHub both changed. Keep: (local/github/merge)?"
- Apply user's choice

### 5. Update Sync Timestamps

Update all synced files with last_sync timestamp.

### 6. Output

\`\`\`
🔄 Sync Complete

Pulled from GitHub:
  Updated: {count} files
  Closed: {count} issues
  
Pushed to GitHub:
  Updated: {count} issues
  Created: {count} new issues
  
Conflicts resolved: {count}

Status:
  ✅ All files synced
  {or list any sync failures}
\`\`\`

## Important Notes

Follow \`/rules/github-operations.md\` for GitHub commands.
Follow \`/rules/frontmatter-operations.md\` for local updates.
Always backup before sync in case of issues.`;

// --- Command Definition ---
exports.command = 'pm:sync';
exports.describe = 'Sync';

exports.builder = (yargs) => {
  return yargs
    .option('verbose', {
      describe: 'Verbose output',
      type: 'boolean',
      alias: 'v'
    })
    .option('dry-run', {
      describe: 'Simulate without making changes',
      type: 'boolean',
      default: false
    });
};

exports.handler = async (argv) => {
  const spinner = createSpinner('Executing pm:sync...');

  try {
    spinner.start();

    // Load environment if needed
    loadEnvironment();

    // Validate input if needed
    

    // Prepare context
    const context = {
      
      verbose: isVerbose(argv),
      dryRun: argv.dryRun
    };

    if (isVerbose(argv)) {
      printInfo('Executing with context:');
      console.log(JSON.stringify(context, null, 2));
    }

    // Execute agent
    const agentType = 'pm-specialist';

    const result = await agentExecutor.run(agentType, AGENT_PROMPT, context);

    if (result.status === 'success') {
      spinner.succeed();
      printSuccess('Command executed successfully!');
    } else {
      spinner.fail();
      printError(`Command failed: ${result.message || 'Unknown error'}`);
      process.exit(1);
    }

  } catch (error) {
    spinner.fail();
    printError(`Error: ${error.message}`, error);
    process.exit(1);
  }
};