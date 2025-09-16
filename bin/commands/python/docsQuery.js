/**
 * Python Documentation Query
 * Auto-migrated from python:docs-query.md
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
# Python Documentation Query

Queries latest Python/FastAPI documentation via context7 before implementation.

**Usage**: \`/python:docs-query [--topic=fastapi|sqlalchemy|pydantic|uv|pytest] [--pattern=search-pattern] [--examples]\`

**Examples**: 
- \`/python:docs-query --topic=fastapi --pattern=authentication\`
- \`/python:docs-query --topic=sqlalchemy --pattern=async --examples\`
- \`/python:docs-query --topic=pydantic --examples\`

**What this does**:
- Queries context7 for latest Python framework documentation
- Searches for specific patterns, methods, or concepts
- Returns relevant examples and best practices
- Provides version compatibility information
- Shows security recommendations and performance tips

Use the python-backend-engineer agent to query documentation and provide implementation guidance.

Requirements for the agent:
- Query MCP context7 documentation servers for specified topics
- Search documentation using provided patterns or keywords
- Extract relevant code examples and implementation patterns
- Verify version compatibility and security recommendations
- Format results with clear examples and explanations
- Include links to full documentation sections when available`;

// --- Command Definition ---
exports.command = 'python:docs-query';
exports.describe = 'Python Documentation Query';

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
  const spinner = createSpinner('Executing python:docs-query...');

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