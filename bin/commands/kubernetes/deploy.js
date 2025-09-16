/**
 * Kubernetes Deployment
 * Auto-migrated from kubernetes:deploy.md
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
# Kubernetes Deployment

Deploys applications to Kubernetes clusters.

**Usage**: \`/kubernetes:deploy [app-name] [--chart=helm|kustomize] [--namespace=default] [--gitops=argocd|flux]\`

**Example**: \`/kubernetes:deploy my-app --chart=helm --namespace=production --gitops=argocd\`

**What this does**:
- Creates Kubernetes manifests or Helm charts
- Configures deployments with best practices
- Sets up services and ingress
- Implements autoscaling and monitoring
- Configures GitOps if requested
- Adds security policies

Use the kubernetes-orchestrator agent to deploy applications to Kubernetes.`;

// --- Command Definition ---
exports.command = 'kubernetes:deploy';
exports.describe = 'Kubernetes Deployment';

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
  const spinner = createSpinner('Executing kubernetes:deploy...');

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