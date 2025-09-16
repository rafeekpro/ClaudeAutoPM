/**
 * Azure DevOps Sync All
 * Auto-migrated from azure:sync-all.md
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
# Azure DevOps Sync All

Full bidirectional synchronization of all work items.

**Usage**: \`/azure:sync-all [--force] [--dry-run]\`

**Examples**:
- \`/azure:sync-all\` - Normal sync
- \`/azure:sync-all --dry-run\` - Preview changes
- \`/azure:sync-all --force\` - Overwrite conflicts

## Instructions

### Full Sync Process

\`\`\`
🔄 Full Azure DevOps Synchronization
═══════════════════════════════════════════════════════════════

Scanning work items...
- Features: 4 in Azure, 3 local
- User Stories: 12 in Azure, 10 local
- Tasks: 45 in Azure, 42 local

Changes to sync:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Push to Azure (5 items):
  ↑ Story #34: Status update
  ↑ Task #102: Hours logged
  ↑ Task #103: Completed
  ↑ Feature #25: Progress update
  ↑ Bug #215: Fixed

Pull from Azure (8 items):
  ↓ Story #35: New story
  ↓ Task #110-115: New tasks
  ↓ Feature #26: Updated

Conflicts (2 items):
  ⚠️ Task #102: Different hours
  ⚠️ Story #34: Different status

Resolution strategy:
[1] Azure wins all conflicts
[2] Local wins all conflicts
[3] Resolve individually
[4] Cancel sync

Choose: 3

Syncing... ████████████████████ 100%

✅ Sync Complete!
- Pushed: 5 items
- Pulled: 8 items
- Conflicts resolved: 2
- Errors: 0

Next sync scheduled: 5 minutes
\`\`\`

### Sync Report

\`\`\`
📊 Sync Report - 2025-01-10 16:00

Items Synced:
- Features: 4/4 ✓
- Stories: 12/12 ✓
- Tasks: 45/45 ✓

Performance:
- Duration: 3.2s
- API calls: 15
- Cache hits: 80%

Health Status: ✅ Excellent
\`\`\``;

// --- Command Definition ---
exports.command = 'azure:sync-all';
exports.describe = 'Azure DevOps Sync All';

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
  const spinner = createSpinner('Executing azure:sync-all...');

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