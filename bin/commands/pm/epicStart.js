/**
 * Epic Start
 * Auto-migrated from pm:epic-start.md
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
# Epic Start

Launch parallel agents to work on epic tasks using the unified branch strategy.

## Usage
\`\`\`
/pm:epic-start <epic_name>
\`\`\`

## Quick Check

1. **Verify epic exists:**
   \`\`\`bash
   test -f .claude/epics/$ARGUMENTS/epic.md || echo "❌ Epic not found. Run: /pm:prd-parse $ARGUMENTS"
   \`\`\`

2. **Check GitHub sync:**
   Look for \`github:\` field in epic frontmatter.
   If missing: "❌ Epic not synced. Run: /pm:epic-sync $ARGUMENTS first"

3. **Check for branch:**
   \`\`\`bash
   git branch -a | grep "epic/$ARGUMENTS"
   \`\`\`

4. **Check for uncommitted changes:**
   \`\`\`bash
   git status --porcelain
   \`\`\`
   If output is not empty: "❌ You have uncommitted changes. Please commit or stash them before starting an epic"

## Instructions

### 1. Create or Enter Branch

Follow the unified Git strategy in \`/rules/git-strategy.md\`:

\`\`\`bash
# Check for uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ You have uncommitted changes. Please commit or stash them before starting an epic."
  exit 1
fi

# If branch doesn't exist, create it
if ! git branch -a | grep -q "epic/$ARGUMENTS"; then
  git checkout main
  git pull origin main
  git checkout -b epic/$ARGUMENTS
  git push -u origin epic/$ARGUMENTS
  echo "✅ Created branch: epic/$ARGUMENTS"
else
  # Branch exists, check it out
  git checkout epic/$ARGUMENTS
  git pull origin epic/$ARGUMENTS
  echo "✅ Using existing branch: epic/$ARGUMENTS"
fi
\`\`\`

### 2. Identify Ready Issues

Read all task files in \`.claude/epics/$ARGUMENTS/\`:
- Look for tasks with \`status: ready\` or \`status: in_progress\`
- Group by dependencies

### 3. Launch Parallel Agents

For each ready issue without dependencies:

\`\`\`bash
# Example parallel launch
/agent python-backend-engineer "Work on issue #1234 from epic $ARGUMENTS"
/agent react-frontend-engineer "Work on issue #1235 from epic $ARGUMENTS"
\`\`\`

### 4. Monitor Progress

\`\`\`bash
# Check branch status
git log --oneline -10

# Check CI status
gh pr checks

# View agent progress
tail -f .claude/epics/$ARGUMENTS/progress.md
\`\`\`

## Parallel Execution Rules

1. **File Coordination**: Agents working on different files can commit simultaneously
2. **Pull Before Push**: Always \`git pull\` before pushing changes
3. **Conflict Resolution**: Human intervention required for merge conflicts
4. **Commit Frequently**: Small, focused commits reduce conflict risk

## Example Workflow

\`\`\`bash
# 1. Start epic
/pm:epic-start authentication

# 2. Agents work in parallel
# Agent A: Backend API
# Agent B: Frontend UI
# Agent C: Database schema

# 3. Monitor progress
/pm:epic-status authentication

# 4. When complete
/pm:epic-merge authentication
\`\`\`

## Branch Management

The epic branch (\`epic/$ARGUMENTS\`) will be:
- Created if it doesn't exist
- Checked out if it exists
- Pulled to get latest changes
- Ready for parallel agent work

## Important Notes

⚠️ **NO WORKTREES**: This command uses the standard branch strategy. Git worktrees are not supported.

⚠️ **COMMIT BEFORE SWITCHING**: Always commit or stash changes before starting a new epic.

⚠️ **PULL FREQUENTLY**: Agents should pull changes regularly to avoid conflicts.

## Troubleshooting

### "You have uncommitted changes"
\`\`\`bash
# Option 1: Commit changes
git add -A && git commit -m "WIP: Save work before epic start"

# Option 2: Stash changes
git stash save "WIP before starting epic"
\`\`\`

### "Branch already exists"
\`\`\`bash
# Use existing branch
git checkout epic/$ARGUMENTS
git pull origin epic/$ARGUMENTS
\`\`\`

### "Merge conflicts"
\`\`\`bash
# Resolve conflicts manually
git status  # See conflicted files
# Edit files to resolve
git add {resolved-files}
git commit -m "resolve: Merge conflicts"
\`\`\``;

// --- Command Definition ---
exports.command = 'pm:epic-start';
exports.describe = 'Epic Start';

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
  const spinner = createSpinner('Executing pm:epic-start...');

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