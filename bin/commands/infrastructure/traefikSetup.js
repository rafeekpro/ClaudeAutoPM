/**
 * Traefik Reverse Proxy Setup Command
 * Auto-migrated from infrastructure:traefik-setup.md
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
const AGENT_PROMPT = `# Traefik Reverse Proxy Setup Command

Configure Traefik reverse proxy with SSL termination, load balancing, and service discovery.

## Command
\`\`\`
/infra:traefik-setup
\`\`\`

## Purpose
Use the traefik-proxy-expert agent to create a complete Traefik reverse proxy configuration with SSL automation, load balancing, and microservices routing.

## Parameters
- \`environment\`: Target environment (development, staging, production)
- \`ssl\`: SSL configuration (letsencrypt, custom-certs, self-signed)
- \`discovery\`: Service discovery method (docker, kubernetes, file)
- \`features\`: Additional features (dashboard, metrics, rate-limiting, auth)

## Agent Usage
\`\`\`
Use the traefik-proxy-expert agent to create a comprehensive Traefik reverse proxy setup.
\`\`\`

## Expected Outcome
- Complete Traefik configuration (traefik.yml)
- Docker Compose setup with Traefik service
- SSL certificate automation
- Service discovery configuration
- Load balancing and health checks
- Security middleware and authentication
- Monitoring and logging setup

## Example Usage
\`\`\`
Task: Set up Traefik reverse proxy for microservices with Let's Encrypt SSL and Docker discovery
Agent: traefik-proxy-expert
Parameters: environment=production, ssl=letsencrypt, discovery=docker, features=dashboard,metrics,auth
\`\`\`

## Related Agents
- docker-expert: For container configuration
- kubernetes-orchestrator: For K8s integration`;

// --- Command Definition ---
exports.command = 'infrastructure:traefik-setup';
exports.describe = 'Traefik Reverse Proxy Setup Command';

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
  const spinner = createSpinner('Executing infrastructure:traefik-setup...');

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