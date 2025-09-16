/**
 * PRD Edit
 * Auto-migrated from pm:prd-edit.md
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
# PRD Edit

Edit an existing Product Requirements Document.

## Usage
\`\`\`
/pm:prd-edit <feature_name>
\`\`\`

## Instructions

### 1. Read Current PRD

Read \`.claude/prds/$ARGUMENTS.md\`:
- Parse frontmatter
- Read all sections

### 2. Interactive Edit

Ask user what sections to edit:
- Executive Summary
- Problem Statement  
- User Stories
- Requirements (Functional/Non-Functional)
- Success Criteria
- Constraints & Assumptions
- Out of Scope
- Dependencies

### 3. Update PRD

Get current datetime: \`date -u +"%Y-%m-%dT%H:%M:%SZ"\`

Update PRD file:
- Preserve frontmatter except \`updated\` field
- Apply user's edits to selected sections
- Update \`updated\` field with current datetime

### 4. Check Epic Impact

If PRD has associated epic:
- Notify user: "This PRD has epic: {epic_name}"
- Ask: "Epic may need updating based on PRD changes. Review epic? (yes/no)"
- If yes, show: "Review with: /pm:epic-edit {epic_name}"

### 5. Output

\`\`\`
✅ Updated PRD: $ARGUMENTS
  Sections edited: {list_of_sections}
  
{If has epic}: ⚠️ Epic may need review: {epic_name}

Next: /pm:prd-parse $ARGUMENTS to update epic
\`\`\`

## Important Notes

Preserve original creation date.
Keep version history in frontmatter if needed.
Follow \`/rules/frontmatter-operations.md\`.`;

// --- Command Definition ---
exports.command = 'pm:prd-edit';
exports.describe = 'PRD Edit';

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
  const spinner = createSpinner('Executing pm:prd-edit...');

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
    const agentType = 'pm-specialist';

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