/**
 * Issue Edit
 * Auto-migrated from pm:issue-edit.md
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
# Issue Edit

Edit issue details locally and on GitHub.

## Usage
\`\`\`
/pm:issue-edit <issue_number>
\`\`\`

## Instructions

### 1. Get Current Issue State

\`\`\`bash
# Get from GitHub
gh issue view $ARGUMENTS --json title,body,labels

# Find local task file
# Search for file with github:.*issues/$ARGUMENTS
\`\`\`

### 2. Interactive Edit

Ask user what to edit:
- Title
- Description/Body
- Labels
- Acceptance criteria (local only)
- Priority/Size (local only)

### 3. Update Local File

Get current datetime: \`date -u +"%Y-%m-%dT%H:%M:%SZ"\`

Update task file with changes:
- Update frontmatter \`name\` if title changed
- Update body content if description changed
- Update \`updated\` field with current datetime

### 4. Update GitHub

If title changed:
\`\`\`bash
gh issue edit $ARGUMENTS --title "{new_title}"
\`\`\`

If body changed:
\`\`\`bash
gh issue edit $ARGUMENTS --body-file {updated_task_file}
\`\`\`

If labels changed:
\`\`\`bash
gh issue edit $ARGUMENTS --add-label "{new_labels}"
gh issue edit $ARGUMENTS --remove-label "{removed_labels}"
\`\`\`

### 5. Output

\`\`\`
✅ Updated issue #$ARGUMENTS
  Changes:
    {list_of_changes_made}
  
Synced to GitHub: ✅
\`\`\`

## Important Notes

Always update local first, then GitHub.
Preserve frontmatter fields not being edited.
Follow \`/rules/frontmatter-operations.md\`.`;

// --- Command Definition ---
exports.command = 'pm:issue-edit';
exports.describe = 'Issue Edit';

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
  const spinner = createSpinner('Executing pm:issue-edit...');

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