/**
 * Azure DevOps Feature Start
 * Auto-migrated from azure:feature-start.md
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
# Azure DevOps Feature Start

Start working on a Feature - update status, create branch, decompose into stories.

**Usage**: \`/azure:feature-start <feature-id> [--branch-name=<name>]\`

**Examples**:
- \`/azure:feature-start 25\`
- \`/azure:feature-start 25 --branch-name=feature/auth-system\`

## Instructions

### 1. Feature Activation

\`\`\`
🚀 Starting Feature #25: Authentication System

Preflight Checklist:
✓ Feature approved by Product Owner
✓ Technical design reviewed
✓ Team capacity available
✓ Dependencies identified

Creating feature branch...
✓ Branch: feature/authentication-system
✓ Protected branch rules applied
✓ CI/CD pipeline configured

Status updated to: In Progress
Assigned to: Development Team

Next Actions:
[1] Decompose into User Stories
[2] Assign team members
[3] Schedule kickoff meeting
[4] Create technical design doc

Select (1-4): _
\`\`\`

### 2. Update Feature Status

\`\`\`json
{
  "op": "replace",
  "path": "/fields/System.State",
  "value": "In Progress"
},
{
  "op": "add",
  "path": "/fields/System.History",
  "value": "Feature development started"
}
\`\`\`

### 3. Setup Workspace

\`\`\`bash
# Create feature branch
git checkout -b feature/authentication-system

# Create feature directory
mkdir -p .claude/azure/features/authentication-system

# Initialize feature tracking
cat > .claude/azure/features/authentication-system/README.md << EOF
# Feature: Authentication System

Started: $(date)
Target: End of Q1
Team: John, Sarah, Mike

## User Stories
- [ ] User Registration
- [ ] Login/Logout
- [ ] Password Reset
- [ ] MFA Setup

## Milestones
- [ ] Week 1: Core auth
- [ ] Week 2: MFA
- [ ] Week 3: Testing
- [ ] Week 4: Deploy
EOF
\`\`\`

### 4. Success Output

\`\`\`
✅ Feature #25 started successfully!

📦 Authentication System
Status: In Progress
Branch: feature/authentication-system
Team: 3 developers assigned

📋 Generated 6 User Stories:
- #41: User Registration (5 pts)
- #42: Login/Logout (8 pts)
- #43: Password Reset (5 pts)
- #44: MFA Setup (13 pts)
- #45: Session Management (8 pts)
- #46: Admin Controls (8 pts)

Total: 47 story points
Estimated: 4 sprints

Ready to start first story: /azure:us-start 41
\`\`\``;

// --- Command Definition ---
exports.command = 'azure:feature-start';
exports.describe = 'Azure DevOps Feature Start';

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
  const spinner = createSpinner('Executing azure:feature-start...');

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