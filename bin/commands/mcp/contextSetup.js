/**
 * MCP Context Setup
 * Auto-migrated from mcp:context-setup.md
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
# MCP Context Setup

Configures Model Context Protocol (MCP) servers and context sharing between agents.

**Usage**: \`/mcp:context-setup [--server=context7|filesystem|custom] [--pool-name=pool] [--agents=agent1,agent2] [--max-size=100MB]\`

**Example**: \`/mcp:context-setup --server=context7 --pool-name=project-context --agents=python-backend-engineer,azure-devops-specialist --max-size=50MB\`

**What this does**:
- Configures MCP server connections and authentication
- Sets up shared context pools between specified agents
- Implements context compression and optimization strategies
- Creates context handoff protocols for agent coordination
- Establishes monitoring and debugging capabilities
- Configures context security and access controls

Use the mcp-context-manager agent to implement MCP-based context sharing and optimization.

Requirements for the agent:
- Configure MCP server connections with proper authentication
- Implement shared context pools with size and retention limits
- Set up context compression and deduplication mechanisms
- Create agent coordination protocols for context handoffs
- Add context monitoring and performance metrics
- Implement security controls for context access and isolation
- Create debugging tools for context flow analysis`;

// --- Command Definition ---
exports.command = 'mcp:context-setup';
exports.describe = 'MCP Context Setup';

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
  const spinner = createSpinner('Executing mcp:context-setup...');

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