/**
 * Azure DevOps Task Status
 * Auto-migrated from azure:task-status.md
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
# Azure DevOps Task Status

Show status overview of tasks for a story or sprint.

**Usage**: \`/azure:task-status [story-id] [--sprint=<name>]\`

**Examples**:
- \`/azure:task-status 34\` - Tasks for Story #34
- \`/azure:task-status --sprint="Sprint 2"\` - All sprint tasks
- \`/azure:task-status --my-tasks\` - Your task status

## Instructions

### Display Format

\`\`\`
📊 Task Status Overview - Story #34
═══════════════════════════════════════════════════════════════

Progress: ████████████░░░░░░░░ 60% (3/5 tasks)
Hours: ███████████░░░░░░░░░ 55% (15h/27h)

Task Breakdown:
✅ Completed: 3 tasks (15h)
🔄 In Progress: 1 task (4h remaining)
🆕 Not Started: 1 task (8h)
🚫 Blocked: 0 tasks

| Status | Task | Hours | Assigned | Health |
|--------|------|-------|----------|--------|
| ✅ | #101 Technical Design | 4h/4h | John | ✓ |
| ✅ | #102 Implementation | 12h/12h | John | ✓ |
| ✅ | #103 Unit tests | 4h/4h | Sarah | ✓ |
| 🔄 | #104 Integration tests | 2h/6h | Sarah | ⚠️ |
| 🆕 | #105 Documentation | 0h/3h | - | - |

⚠️ Attention Needed:
- Task #104 behind schedule
- Task #105 not assigned

Est. Completion: 2 days
Sprint Ends: 2 days
Risk: Medium
\`\`\``;

// --- Command Definition ---
exports.command = 'azure:task-status';
exports.describe = 'Azure DevOps Task Status';

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
  const spinner = createSpinner('Executing azure:task-status...');

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