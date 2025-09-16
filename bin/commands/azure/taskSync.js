/**
 * Azure DevOps Task Sync
 * Auto-migrated from azure:task-sync.md
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
# Azure DevOps Task Sync

Synchronize tasks between local cache and Azure DevOps.

**Usage**: \`/azure:task-sync [story-id] [--direction=both]\`

**Examples**:
- \`/azure:task-sync\` - Sync all tasks
- \`/azure:task-sync 34\` - Sync tasks for Story #34
- \`/azure:task-sync --direction=pull\` - Only pull from Azure

## Instructions

### Sync Process

\`\`\`
🔄 Task Synchronization
═══════════════════════════════════════════════════════════════

Analyzing differences...

Local → Azure (Push):
- Task #102: Hours updated (8h → 6h)
- Task #103: Status changed (Active → Done)

Azure → Local (Pull):
- Task #104: New assignee (john → sarah)
- Task #105: New task created
- Task #106: Deleted in Azure

Conflicts (1):
- Task #102: Hours differ (Local: 6h, Azure: 7h)
  [1] Keep local (6h)
  [2] Keep Azure (7h)
  [3] Skip this task
  
Choose: _

Syncing...
✓ Pushed 2 changes to Azure
✓ Pulled 3 changes from Azure
✓ Resolved 1 conflict

Cache updated: .claude/azure/cache/
Last sync: 2025-01-10T16:00:00Z
\`\`\``;

// --- Command Definition ---
exports.command = 'azure:task-sync';
exports.describe = 'Azure DevOps Task Sync';

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
  const spinner = createSpinner('Executing azure:task-sync...');

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