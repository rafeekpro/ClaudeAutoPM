/**
 * Azure DevOps Task Edit
 * Auto-migrated from azure:task-edit.md
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
# Azure DevOps Task Edit

Edit Task details and properties in Azure DevOps.

**Usage**: \`/azure:task-edit <task-id> [--field=value]\`

**Examples**:
- \`/azure:task-edit 102 --title="Updated implementation"\`
- \`/azure:task-edit 102 --hours=10 --status=Active\`
- \`/azure:task-edit 102 --assigned-to=sarah@example.com\`

## Required Environment Variables

Ensure \`.claude/.env\` contains:

\`\`\`bash
AZURE_DEVOPS_PAT=<your-pat-token>
AZURE_DEVOPS_ORG=<your-organization>
AZURE_DEVOPS_PROJECT=<your-project>
\`\`\`

## Instructions

### 1. Parse Arguments

Extract field updates:
- \`--title\`: Task title
- \`--description\`: Description
- \`--hours\`: Remaining hours
- \`--hours-completed\`: Completed hours
- \`--status\`: State (To Do, In Progress, Done)
- \`--assigned-to\`: Assignee
- \`--activity\`: Activity type (Development, Testing, Documentation, etc.)
- \`--priority\`: Task priority

### 2. Interactive Mode

If no fields specified:

\`\`\`
📝 Editing Task #102: Implementation

Current values in [brackets]. Enter to keep.

Title [Implementation]: Core implementation
Description [Implement password reset logic]: 
Remaining Hours [8]: 6
Completed Hours [4]: 6
Status [In Progress]: 
Assigned To [john@example.com]: sarah@example.com
Activity [Development]: 
Priority [2]: 1

Review changes:
- Title: Implementation → Core implementation
- Remaining: 8h → 6h
- Completed: 4h → 6h
- Assigned: john → sarah
- Priority: 2 → 1

Confirm? (y/n): _
\`\`\`

### 3. Update Task

Use azure-devops-specialist agent:

\`\`\`json
[
  {
    "op": "replace",
    "path": "/fields/System.Title",
    "value": "{new_title}"
  },
  {
    "op": "replace",
    "path": "/fields/Microsoft.VSTS.Scheduling.RemainingWork",
    "value": {remaining_hours}
  },
  {
    "op": "replace",
    "path": "/fields/Microsoft.VSTS.Scheduling.CompletedWork",
    "value": {completed_hours}
  }
]
\`\`\`

### 4. Success Output

\`\`\`
✅ Task #102 updated successfully!

📋 Changes:
- Title: "Implementation" → "Core implementation"
- Remaining: 8h → 6h
- Completed: 4h → 6h
- Assigned: john@example.com → sarah@example.com
- Priority: 2 → 1

📊 Impact:
- Parent Story: #34 progress updated (65% complete)
- Sprint capacity: Sarah at 85% capacity
- Timeline: On track for completion

🔗 View: https://dev.azure.com/{org}/{project}/_workitems/edit/102

Next: /azure:task-show 102
\`\`\`

## Quick Edit Shortcuts

\`\`\`bash
# Mark as done
/azure:task-edit 102 --done

# Reassign
/azure:task-edit 102 --reassign=sarah

# Update hours
/azure:task-edit 102 --log-hours=2

# Block task
/azure:task-edit 102 --blocked="Waiting for API"
\`\`\``;

// --- Command Definition ---
exports.command = 'azure:task-edit';
exports.describe = 'Azure DevOps Task Edit';

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
  const spinner = createSpinner('Executing azure:task-edit...');

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