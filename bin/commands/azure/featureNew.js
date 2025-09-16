/**
 * Azure DevOps Feature New
 * Auto-migrated from azure:feature-new.md
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
# Azure DevOps Feature New

Create a new Feature/Epic in Azure DevOps with comprehensive planning.

**Usage**: \`/azure:feature-new <feature-name>\`

**Examples**:
- \`/azure:feature-new authentication-system\`
- \`/azure:feature-new payment-integration\`

## Instructions

### 1. Interactive Feature Creation

\`\`\`
🎯 Creating new Feature: authentication-system

Feature Planning:
─────────────────────────────────────────────────
Title: Authentication System
Description: [Complete user authentication and authorization system]
Business Value: [85/100]
Time Criticality: [High/Medium/Low]
Effort (Story Points): [89]
Target Date: [End of Q1]
Risk: [Medium]

Key Capabilities:
□ User registration
□ Login/logout
□ Password management
□ Multi-factor auth
□ Role-based access
□ Session management

Dependencies:
- Database schema
- Email service
- Security audit

Confirm creation? (y/n): _
\`\`\`

### 2. Create Feature

Use azure-devops-specialist agent:

\`\`\`json
{
  "op": "add",
  "path": "/fields/System.Title",
  "value": "Authentication System"
},
{
  "op": "add",
  "path": "/fields/Microsoft.VSTS.Common.BusinessValue",
  "value": 85
},
{
  "op": "add",
  "path": "/fields/Microsoft.VSTS.Scheduling.Effort",
  "value": 89
}
\`\`\`

### 3. Success Output

\`\`\`
✅ Feature #25 created successfully!

Authentication System
Business Value: 85
Effort: 89 points
Risk: Medium

Next steps:
1. Decompose into stories: /azure:feature-decompose 25
2. Assign to team
3. Schedule planning session

View: https://dev.azure.com/{org}/{project}/_workitems/edit/25
\`\`\`

### 4. Auto-Decomposition Option

\`\`\`
Would you like to:
[1] Decompose into User Stories now
[2] Schedule planning session
[3] Add team members
[4] Exit

Select: _
\`\`\``;

// --- Command Definition ---
exports.command = 'azure:feature-new';
exports.describe = 'Azure DevOps Feature New';

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
  const spinner = createSpinner('Executing azure:feature-new...');

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