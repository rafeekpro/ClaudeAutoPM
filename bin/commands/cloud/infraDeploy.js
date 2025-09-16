/**
 * Cloud Infrastructure Deployment
 * Auto-migrated from cloud:infra-deploy.md
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
# Cloud Infrastructure Deployment

Deploys infrastructure to cloud providers using Terraform.

**Usage**: \`/cloud:infra-deploy [--provider=aws|azure|gcp] [--env=dev|staging|prod] [--services=compute,storage,database]\`

**Example**: \`/cloud:infra-deploy --provider=aws --env=staging --services=eks,rds,s3\`

**What this does**:
- Creates Terraform modules for selected cloud
- Configures provider and backend
- Sets up networking and security
- Deploys requested services
- Implements cost optimization
- Adds monitoring and alerting

Use the appropriate cloud architect agent (aws-cloud-architect, azure-cloud-architect, or gcp-cloud-architect) based on provider.`;

// --- Command Definition ---
exports.command = 'cloud:infra-deploy';
exports.describe = 'Cloud Infrastructure Deployment';

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
  const spinner = createSpinner('Executing cloud:infra-deploy...');

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