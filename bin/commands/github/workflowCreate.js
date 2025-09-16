/**
 * GitHub Workflow Creation
 * Auto-migrated from github:workflow-create.md
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
# GitHub Workflow Creation

Creates GitHub Actions workflows for CI/CD pipelines.

**Usage**: \`/github:workflow-create [--type=ci|cd|release] [--stack=node|python|dotnet] [--deploy-to=aws|azure|gcp]\`

**Example**: \`/github:workflow-create --type=ci --stack=node --deploy-to=aws\`

**What this does**:
- Creates .github/workflows directory structure
- Generates workflow YAML with best practices
- Configures secrets and environment variables
- Sets up caching for dependencies
- Implements matrix testing strategies
- Adds deployment stages if needed

Use the github-operations-specialist agent to create comprehensive GitHub Actions workflows.

**CRITICAL INSTRUCTION FOR AGENT:**
The generated workflow MUST adhere to the Kubernetes-native CI/CD strategy for \`containerd\` runners.
Refer to the rules in \`.claude/rules/ci-cd-kubernetes-strategy.md\` for specific implementation details (use \`kubectl\` and \`nerdctl\`, not Docker services).`;

// --- Command Definition ---
exports.command = 'github:workflow-create';
exports.describe = 'GitHub Workflow Creation';

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
  const spinner = createSpinner('Executing github:workflow-create...');

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