/**
 * Issue Status
 * Auto-migrated from pm:issue-status.md
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
# Issue Status

Check issue status (open/closed) and current state.

## Usage
\`\`\`
/pm:issue-status <issue_number>
\`\`\`

## Instructions

You are checking the current status of a GitHub issue and providing a quick status report for: **Issue #$ARGUMENTS**

### 1. Fetch Issue Status
Use GitHub CLI to get current status:
\`\`\`bash
gh issue view #$ARGUMENTS --json state,title,labels,assignees,updatedAt
\`\`\`

### 2. Status Display
Show concise status information:
\`\`\`
🎫 Issue #$ARGUMENTS: {Title}
   
📊 Status: {OPEN/CLOSED}
   Last update: {timestamp}
   Assignee: {assignee or "Unassigned"}
   
🏷️ Labels: {label1}, {label2}, {label3}
\`\`\`

### 3. Epic Context
If issue is part of an epic:
\`\`\`
📚 Epic Context:
   Epic: {epic_name}
   Epic progress: {completed_tasks}/{total_tasks} tasks complete
   This task: {task_position} of {total_tasks}
\`\`\`

### 4. Local Sync Status
Check if local files are in sync:
\`\`\`
💾 Local Sync:
   Local file: {exists/missing}
   Last local update: {timestamp}
   Sync status: {in_sync/needs_sync/local_ahead/remote_ahead}
\`\`\`

### 5. Quick Status Indicators
Use clear visual indicators:
- 🟢 Open and ready
- 🟡 Open with blockers  
- 🔴 Open and overdue
- ✅ Closed and complete
- ❌ Closed without completion

### 6. Actionable Next Steps
Based on status, suggest actions:
\`\`\`
🚀 Suggested Actions:
   - Start work: /pm:issue-start $ARGUMENTS
   - Sync updates: /pm:issue-sync $ARGUMENTS
   - Close issue: gh issue close #$ARGUMENTS
   - Reopen issue: gh issue reopen #$ARGUMENTS
\`\`\`

### 7. Batch Status
If checking multiple issues, support comma-separated list:
\`\`\`
/pm:issue-status 123,124,125
\`\`\`

Keep the output concise but informative, perfect for quick status checks during development of Issue #$ARGUMENTS.
`;

// --- Command Definition ---
exports.command = 'pm:issue-status';
exports.describe = 'Issue Status';

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
  const spinner = createSpinner('Executing pm:issue-status...');

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