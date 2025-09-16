/**
 * SSH Security and Operations Command
 * Auto-migrated from infrastructure:ssh-security.md
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
const AGENT_PROMPT = `# SSH Security and Operations Command

Set up secure SSH configurations, key management, and remote operations.

## Command
\`\`\`
/infra:ssh-security
\`\`\`

## Purpose
Use the ssh-operations-expert agent to create secure SSH configurations, implement key rotation strategies, and set up remote management workflows.

## Parameters
- \`scope\`: Configuration scope (client, server, both)
- \`security_level\`: Security hardening level (basic, advanced, paranoid)
- \`key_management\`: Key management strategy (manual, automated, ca-based)
- \`features\`: Additional features (tunneling, jump-hosts, automation)

## Agent Usage
\`\`\`
Use the ssh-operations-expert agent to create comprehensive SSH security and operations setup.
\`\`\`

## Expected Outcome
- Hardened SSH client/server configurations
- SSH key generation and management scripts
- Automated key rotation workflows
- Tunnel and port forwarding setup
- Jump host and bastion configuration
- Remote operations and automation scripts
- Security audit and monitoring tools

## Example Usage
\`\`\`
Task: Set up secure SSH infrastructure with key rotation, jump hosts, and automated remote operations
Agent: ssh-operations-expert
Parameters: scope=both, security_level=advanced, key_management=automated, features=tunneling,jump-hosts,automation
\`\`\`

## Related Agents
- bash-scripting-expert: For automation scripts
- terraform-infrastructure-expert: For infrastructure automation`;

// --- Command Definition ---
exports.command = 'infrastructure:ssh-security';
exports.describe = 'SSH Security and Operations Command';

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
  const spinner = createSpinner('Executing infrastructure:ssh-security...');

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