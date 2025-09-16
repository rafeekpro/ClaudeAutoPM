/**
 * Azure DevOps Validate
 * Auto-migrated from azure:validate.md
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
# Azure DevOps Validate

Validate work item structure and relationships for consistency.

**Usage**: \`/azure:validate [--fix] [--type=<type>]\`

**Examples**:
- \`/azure:validate\` - Check all items
- \`/azure:validate --fix\` - Auto-fix issues
- \`/azure:validate --type=story\` - Validate stories only

## Instructions

### Validation Report

\`\`\`
🔍 Azure DevOps Validation Report
═══════════════════════════════════════════════════════════════

Checking work item integrity...

✅ PASSED (45 items)
─────────────────────────────────────────────────────────────
✓ All tasks have parent stories
✓ All stories have valid estimates
✓ No duplicate work items
✓ All required fields populated

⚠️ WARNINGS (8 items)
─────────────────────────────────────────────────────────────
• Story #34: Missing acceptance criteria
• Task #102: No remaining hours set
• Task #105: Not assigned
• Feature #27: No target date

❌ ERRORS (3 items)
─────────────────────────────────────────────────────────────
• Task #108: Orphaned (parent deleted)
• Story #39: Invalid state transition
• Task #112: Circular dependency

📋 Recommendations:
─────────────────────────────────────────────────────────────
1. Add acceptance criteria to Story #34
2. Assign Task #105 to team member
3. Delete orphaned Task #108
4. Fix Story #39 state

Auto-fix available for 2 issues.
Run with --fix? (y/n): _
\`\`\`

### Validation Rules

\`\`\`
Checking:
✓ Parent-child relationships
✓ Required fields
✓ State transitions
✓ Estimate ranges
✓ Date consistency
✓ Assignment validity
✓ Dependency cycles
✓ Duplicate detection
\`\`\``;

// --- Command Definition ---
exports.command = 'azure:validate';
exports.describe = 'Azure DevOps Validate';

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
  const spinner = createSpinner('Executing azure:validate...');

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