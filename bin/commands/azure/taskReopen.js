/**
 * Azure DevOps Task Reopen
 * Auto-migrated from azure:task-reopen.md
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
# Azure DevOps Task Reopen

Reopen a closed task that needs additional work.

**Usage**: \`/azure:task-reopen <task-id> [--reason=<text>]\`

**Examples**:
- \`/azure:task-reopen 102\`
- \`/azure:task-reopen 102 --reason="Bug found in implementation"\`

## Instructions

### Reopen Process

\`\`\`
⚠️ Reopening Task #102

Current Status: Closed
Completed: 2 days ago
By: john@example.com

Reason for reopening: Bug found in implementation

This will:
- Change status to "To Do" or "In Progress"
- Reset completion date
- Add reopening note to history
- Notify original assignee

Confirm reopen? (y/n): _
\`\`\`

### Update Task

\`\`\`json
{
  "op": "replace",
  "path": "/fields/System.State",
  "value": "To Do"
},
{
  "op": "add",
  "path": "/fields/System.History",
  "value": "Reopened: Bug found in implementation"
}
\`\`\`

### Success Output

\`\`\`
✅ Task #102 reopened

Status: To Do → In Progress
Assigned: john@example.com (notified)
Reason: Bug found in implementation

Next: /azure:task-start 102
\`\`\``;

// --- Command Definition ---
exports.command = 'azure:task-reopen';
exports.describe = 'Azure DevOps Task Reopen';

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
  const spinner = createSpinner('Executing azure:task-reopen...');

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
    const agentType = 'azure-devops-specialist';

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