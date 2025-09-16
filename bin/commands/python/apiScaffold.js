/**
 * Python API Scaffolding
 * Auto-migrated from python:api-scaffold.md
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
# Python API Scaffolding

Creates a complete FastAPI project structure with modern Python tooling.

**Usage**: \`/python:api-scaffold [project-name] [--db=postgresql|mysql|sqlite] [--auth=jwt|oauth2]\`

**Example**: \`/python:api-scaffold task-manager --db=postgresql --auth=jwt\`

**What this does**:
- Creates complete FastAPI project structure
- Sets up database integration with SQLAlchemy
- Implements authentication system
- Configures modern Python tooling (uv, ruff, mypy)
- Adds comprehensive testing setup
- Creates Docker configuration

Use the python-backend-engineer agent to create a complete FastAPI project scaffold.

Requirements for the agent:
- Create modern project structure with proper FastAPI organization
- Include SQLAlchemy models with async support
- Add Pydantic schemas for request/response validation
- Implement authentication and authorization system
- Set up database migration with Alembic
- Configure comprehensive testing with pytest
- Add modern Python tooling configuration (uv, ruff, mypy)
- Include Docker configuration and deployment setup
- Ensure type hints throughout and async/await patterns
- Add error handling, input validation, and security best practices`;

// --- Command Definition ---
exports.command = 'python:api-scaffold';
exports.describe = 'Python API Scaffolding';

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
  const spinner = createSpinner('Executing python:api-scaffold...');

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