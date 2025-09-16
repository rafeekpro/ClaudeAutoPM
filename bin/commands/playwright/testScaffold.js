/**
 * Playwright Test Scaffolding
 * Auto-migrated from playwright:test-scaffold.md
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
# Playwright Test Scaffolding

Creates Playwright test suite with Page Object Model.

**Usage**: \`/playwright:test-scaffold [app-name] [--framework=react|vue|angular] [--auth=yes|no]\`

**Example**: \`/playwright:test-scaffold my-app --framework=react --auth=yes\`

**What this does**:
- Creates Playwright configuration
- Sets up Page Object Model structure
- Generates test helpers and fixtures
- Configures browsers and devices
- Adds visual regression setup
- Creates CI/CD integration scripts

Use the playwright-test-engineer agent to create comprehensive E2E test suite.`;

// --- Command Definition ---
exports.command = 'playwright:test-scaffold';
exports.describe = 'Playwright Test Scaffolding';

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
  const spinner = createSpinner('Executing playwright:test-scaffold...');

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
    const agentType = 'testing-specialist';

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