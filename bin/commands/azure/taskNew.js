/**
 * Azure DevOps Task New
 * Auto-migrated from azure:task-new.md
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
# Azure DevOps Task New

Create a new Task under a User Story.

**Usage**: \`/azure:task-new <story-id> <task-title>\`

**Examples**:
- \`/azure:task-new 34 "Add input validation"\`
- \`/azure:task-new 34 "Write unit tests" --hours=4\`
- \`/azure:task-new 34 "Fix bug" --assigned-to=john@example.com\`

## Instructions

### 1. Interactive Task Creation

\`\`\`
📝 Creating new Task for Story #34

Task Title: Add input validation

Task Details:
Description: [Validate email format and password strength]
Activity Type: [Development]
Original Estimate: [4] hours
Assigned To: [john@example.com]
Priority: [2]

Confirm creation? (y/n): _
\`\`\`

### 2. Create Task

Use azure-devops-specialist agent to create task with parent link:

\`\`\`json
{
  "op": "add",
  "path": "/fields/System.Title",
  "value": "Add input validation"
},
{
  "op": "add",
  "path": "/relations/-",
  "value": {
    "rel": "System.LinkTypes.Hierarchy-Reverse",
    "url": "story_url"
  }
}
\`\`\`

### 3. Success Output

\`\`\`
✅ Task created successfully!

Task #106: Add input validation
Parent: Story #34 - Password Reset
Hours: 4h
Assigned: john@example.com
Status: To Do

Next: /azure:task-start 106
\`\`\``;

// --- Command Definition ---
exports.command = 'azure:task-new';
exports.describe = 'Azure DevOps Task New';

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
  const spinner = createSpinner('Executing azure:task-new...');

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