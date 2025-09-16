/**
 * Azure DevOps Feature List
 * Auto-migrated from azure:feature-list.md
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
# Azure DevOps Feature List

List all Features/Epics with filtering and sorting options.

**Usage**: \`/azure:feature-list [--status=<state>] [--quarter=<Q>]\`

**Examples**:
- \`/azure:feature-list\` - All features
- \`/azure:feature-list --status=Active\` - Active features
- \`/azure:feature-list --quarter=Q1\` - Q1 features

## Instructions

### Display Format

\`\`\`
📦 Features/Epics Overview
═══════════════════════════════════════════════════════════════

| ID | Feature | Status | Progress | Points | Value | Target | Owner |
|----|---------|--------|----------|--------|-------|--------|-------|
| 25 | Authentication | 🔄 Active | 82% | 89 | 85 | Q1 | Product |
| 26 | Payment Gateway | 📅 Planned | 0% | 55 | 92 | Q2 | - |
| 27 | Search System | 🆕 New | 10% | 34 | 70 | Q1 | Tech |
| 28 | Analytics | ✅ Done | 100% | 21 | 60 | Q1 | Data |

📊 Summary:
- Active: 1 (89 points)
- Planned: 1 (55 points)
- New: 1 (34 points)
- Done: 1 (21 points)

Total Value: 307
Q1 Capacity: 144/150 points (96%)

🎯 Recommendations:
- Feature #25 needs attention (behind schedule)
- Feature #26 ready to start
- Consider deferring Feature #27 to Q2
\`\`\``;

// --- Command Definition ---
exports.command = 'azure:feature-list';
exports.describe = 'Azure DevOps Feature List';

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
  const spinner = createSpinner('Executing azure:feature-list...');

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