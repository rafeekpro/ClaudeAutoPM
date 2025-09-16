/**
 * Epic Edit
 * Auto-migrated from pm:epic-edit.md
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
# Epic Edit

Edit epic details after creation.

## Usage
\`\`\`
/pm:epic-edit <epic_name>
\`\`\`

## Instructions

### 1. Read Current Epic

Read \`.claude/epics/$ARGUMENTS/epic.md\`:
- Parse frontmatter
- Read content sections

### 2. Interactive Edit

Ask user what to edit:
- Name/Title
- Description/Overview
- Architecture decisions
- Technical approach
- Dependencies
- Success criteria

### 3. Update Epic File

Get current datetime: \`date -u +"%Y-%m-%dT%H:%M:%SZ"\`

Update epic.md:
- Preserve all frontmatter except \`updated\`
- Apply user's edits to content
- Update \`updated\` field with current datetime

### 4. Option to Update GitHub

If epic has GitHub URL in frontmatter:
Ask: "Update GitHub issue? (yes/no)"

If yes:
\`\`\`bash
gh issue edit {issue_number} --body-file .claude/epics/$ARGUMENTS/epic.md
\`\`\`

### 5. Output

\`\`\`
✅ Updated epic: $ARGUMENTS
  Changes made to: {sections_edited}
  
{If GitHub updated}: GitHub issue updated ✅

View epic: /pm:epic-show $ARGUMENTS
\`\`\`

## Important Notes

Preserve frontmatter history (created, github URL, etc.).
Don't change task files when editing epic.
Follow \`/rules/frontmatter-operations.md\`.`;

// --- Command Definition ---
exports.command = 'pm:epic-edit';
exports.describe = 'Epic Edit';

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
  const spinner = createSpinner('Executing pm:epic-edit...');

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