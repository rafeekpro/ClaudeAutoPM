/**
 * Azure DevOps Documentation Query
 * Auto-migrated from azure:docs-query.md
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
# Azure DevOps Documentation Query

Queries latest Azure DevOps documentation via context7 before integration work.

**Usage**: \`/azure:docs-query [--topic=rest-api|pipelines|work-items|extensions] [--version=latest|7.0|6.0] [--examples]\`

**Examples**: 
- \`/azure:docs-query --topic=rest-api --version=latest\`
- \`/azure:docs-query --topic=work-items --examples\`
- \`/azure:docs-query --topic=pipelines --examples\`

**What this does**:
- Queries context7 for latest Azure DevOps documentation
- Retrieves API endpoints, schemas, and authentication methods  
- Returns relevant examples and integration patterns
- Provides version compatibility and feature availability info
- Shows security best practices and rate limiting guidelines

Use the azure-devops-specialist agent to query documentation and provide integration guidance.

Requirements for the agent:
- Query MCP context7 documentation servers for Azure DevOps topics
- Retrieve latest API versions, endpoints, and authentication patterns
- Extract relevant integration examples and configuration samples
- Verify feature availability across different Azure DevOps tiers
- Format results with clear API examples and authentication code
- Include security recommendations and rate limiting best practices`;

// --- Command Definition ---
exports.command = 'azure:docs-query';
exports.describe = 'Azure DevOps Documentation Query';

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
  const spinner = createSpinner('Executing azure:docs-query...');

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