/**
 * Azure DevOps Work Item Synchronization
 * Auto-migrated from azure:work-item-sync.md
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
# Azure DevOps Work Item Synchronization

Synchronizes GitHub Issues with Azure DevOps Work Items bidirectionally.

**Usage**: \`/azure:work-item-sync [--direction=both|github-to-azure|azure-to-github] [--project=project-name] [--area-path=area]\`

**Example**: \`/azure:work-item-sync --direction=both --project=MyProject --area-path=MyProject\\Team1\`

**What this does**:
- Authenticates with Azure DevOps using PAT
- Fetches GitHub Issues and Azure DevOps Work Items
- Maps fields between systems (title, description, labels, assignees, status)
- Creates missing work items/issues in target systems
- Updates existing items with latest changes
- Maintains relationship links and sync metadata

Use the azure-devops-specialist agent to implement bidirectional synchronization between GitHub Issues and Azure DevOps Work Items.

Requirements for the agent:
- Set up Azure DevOps REST API authentication using Personal Access Token
- Implement GitHub Issues API integration using GitHub CLI or REST API
- Create field mapping between GitHub Issues and Azure DevOps Work Items
- Handle bidirectional synchronization with conflict resolution
- Maintain sync metadata to track relationships and prevent duplicates
- Implement proper error handling and retry logic for API failures
- Add progress reporting and detailed logging of sync operations`;

// --- Command Definition ---
exports.command = 'azure:work-item-sync';
exports.describe = 'Azure DevOps Work Item Synchronization';

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
  const spinner = createSpinner('Executing azure:work-item-sync...');

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