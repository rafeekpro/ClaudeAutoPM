/**
 * MCP Documentation Refresh
 * Auto-migrated from mcp:docs-refresh.md
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
# MCP Documentation Refresh

Refreshes documentation cache from context7 for specified agents and technologies.

**Usage**: \`/mcp:docs-refresh [--agent=agent-name] [--tech=technology] [--force] [--validate]\`

**Examples**: 
- \`/mcp:docs-refresh --agent=python-backend-engineer --tech=fastapi\`
- \`/mcp:docs-refresh --tech=azure-devops --force\`
- \`/mcp:docs-refresh --validate\`

**What this does**:
- Fetches latest documentation from context7 servers
- Updates agent-specific documentation caches
- Validates documentation integrity and accessibility
- Reports cache status and refresh timestamps
- Clears stale or corrupted documentation entries

Use the mcp-context-manager agent to refresh documentation caches and validate integrity.

Requirements for the agent:
- Connect to context7 documentation servers using MCP protocol
- Fetch latest documentation for specified technologies/agents
- Update local documentation caches with version tracking
- Validate documentation integrity and format consistency
- Report refresh status, timestamps, and any errors encountered
- Clean up stale documentation entries and optimize cache usage`;

// --- Command Definition ---
exports.command = 'mcp:docs-refresh';
exports.describe = 'MCP Documentation Refresh';

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
  const spinner = createSpinner('Executing mcp:docs-refresh...');

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
    const agentType = 'general-specialist';

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