/**
 * Issue Show
 * Auto-migrated from pm:issue-show.md
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
# Issue Show

Display issue and sub-issues with detailed information.

## Usage
\`\`\`
/pm:issue-show <issue_number>
\`\`\`

## Instructions

You are displaying comprehensive information about a GitHub issue and related sub-issues for: **Issue #$ARGUMENTS**

### 1. Fetch Issue Data
- Use \`gh issue view #$ARGUMENTS\` to get GitHub issue details
- Look for local task file: first check \`.claude/epics/*/$ARGUMENTS.md\` (new naming)
- If not found, search for file with \`github:.*issues/$ARGUMENTS\` in frontmatter (old naming)
- Check for related issues and sub-tasks

### 2. Issue Overview
Display issue header:
\`\`\`
🎫 Issue #$ARGUMENTS: {Issue Title}
   Status: {open/closed}
   Labels: {labels}
   Assignee: {assignee}
   Created: {creation_date}
   Updated: {last_update}
   
📝 Description:
{issue_description}
\`\`\`

### 3. Local File Mapping
If local task file exists:
\`\`\`
📁 Local Files:
   Task file: .claude/epics/{epic_name}/{task_file}
   Updates: .claude/epics/{epic_name}/updates/$ARGUMENTS/
   Last local update: {timestamp}
\`\`\`

### 4. Sub-Issues and Dependencies
Show related issues:
\`\`\`
🔗 Related Issues:
   Parent Epic: #{epic_issue_number}
   Dependencies: #{dep1}, #{dep2}
   Blocking: #{blocked1}, #{blocked2}
   Sub-tasks: #{sub1}, #{sub2}
\`\`\`

### 5. Recent Activity
Display recent comments and updates:
\`\`\`
💬 Recent Activity:
   {timestamp} - {author}: {comment_preview}
   {timestamp} - {author}: {comment_preview}
   
   View full thread: gh issue view #$ARGUMENTS --comments
\`\`\`

### 6. Progress Tracking
If task file exists, show progress:
\`\`\`
✅ Acceptance Criteria:
   ✅ Criterion 1 (completed)
   🔄 Criterion 2 (in progress)
   ⏸️ Criterion 3 (blocked)
   □ Criterion 4 (not started)
\`\`\`

### 7. Quick Actions
\`\`\`
🚀 Quick Actions:
   Start work: /pm:issue-start $ARGUMENTS
   Sync updates: /pm:issue-sync $ARGUMENTS
   Add comment: gh issue comment #$ARGUMENTS --body "your comment"
   View in browser: gh issue view #$ARGUMENTS --web
\`\`\`

### 8. Error Handling
- Handle invalid issue numbers gracefully
- Check for network/authentication issues
- Provide helpful error messages and alternatives

Provide comprehensive issue information to help developers understand context and current status for Issue #$ARGUMENTS.
`;

// --- Command Definition ---
exports.command = 'pm:issue-show';
exports.describe = 'Issue Show';

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
  const spinner = createSpinner('Executing pm:issue-show...');

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