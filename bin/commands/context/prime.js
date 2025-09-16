/**
 * Prime Context
 * Auto-migrated from context:prime.md
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
# Prime Context

This command loads essential context for a new agent session by reading the project context documentation and understanding the codebase structure.

## Preflight Checklist

Before proceeding, complete these validation steps.
Do not bother the user with preflight checks progress ("I'm not going to ..."). Just do them and move on.

### 1. Context Availability Check
- Run: \`ls -la .claude/context/ 2>/dev/null\`
- If directory doesn't exist or is empty:
  - Tell user: "❌ No context found. Please run /context:create first to establish project context."
  - Exit gracefully
- Count available context files: \`ls -1 .claude/context/*.md 2>/dev/null | wc -l\`
- Report: "📁 Found {count} context files to load"

### 2. File Integrity Check
- For each context file found:
  - Verify file is readable: \`test -r ".claude/context/{file}" && echo "readable"\`
  - Check file has content: \`test -s ".claude/context/{file}" && echo "has content"\`
  - Check for valid frontmatter (should start with \`---\`)
- Report any issues:
  - Empty files: "⚠️ {filename} is empty (skipping)"
  - Unreadable files: "⚠️ Cannot read {filename} (permission issue)"
  - Missing frontmatter: "⚠️ {filename} missing frontmatter (may be corrupted)"

### 3. Project State Check
- Run: \`git status --short 2>/dev/null\` to see current state
- Run: \`git branch --show-current 2>/dev/null\` to get current branch
- Note if not in git repository (context may be less complete)

## Instructions

### 1. Context Loading Sequence

Load context files in priority order for optimal understanding:

**Priority 1 - Essential Context (load first):**
1. \`project-overview.md\` - High-level understanding of the project
2. \`project-brief.md\` - Core purpose and goals
3. \`tech-context.md\` - Technical stack and dependencies

**Priority 2 - Current State (load second):**
4. \`progress.md\` - Current status and recent work
5. \`project-structure.md\` - Directory and file organization

**Priority 3 - Deep Context (load third):**
6. \`system-patterns.md\` - Architecture and design patterns
7. \`product-context.md\` - User needs and requirements
8. \`project-style-guide.md\` - Coding conventions
9. \`project-vision.md\` - Long-term direction

### 2. Validation During Loading

For each file loaded:
- Check frontmatter exists and parse:
  - \`created\` date should be valid
  - \`last_updated\` should be ≥ created date
  - \`version\` should be present
- If frontmatter is invalid, note but continue loading content
- Track which files loaded successfully vs failed

### 3. Supplementary Information

After loading context files:
- Run: \`git ls-files --others --exclude-standard | head -20\` to see untracked files
- Read \`README.md\` if it exists for additional project information
- Check for \`.env.example\` or similar for environment setup needs

### 4. Error Recovery

**If critical files are missing:**
- \`project-overview.md\` missing: Try to understand from README.md
- \`tech-context.md\` missing: Analyze package.json/requirements.txt directly
- \`progress.md\` missing: Check recent git commits for status

**If context is incomplete:**
- Inform user which files are missing
- Suggest running \`/context:update\` to refresh context
- Continue with partial context but note limitations

### 5. Loading Summary

Provide comprehensive summary after priming:

\`\`\`
🧠 Context Primed Successfully

📖 Loaded Context Files:
  ✅ Essential: {count}/3 files
  ✅ Current State: {count}/2 files
  ✅ Deep Context: {count}/4 files

🔍 Project Understanding:
  - Name: {project_name}
  - Type: {project_type}
  - Language: {primary_language}
  - Status: {current_status from progress.md}
  - Branch: {git_branch}

📊 Key Metrics:
  - Last Updated: {most_recent_update}
  - Context Version: {version}
  - Files Loaded: {success_count}/{total_count}

⚠️ Warnings:
  {list any missing files or issues}

🎯 Ready State:
  ✅ Project context loaded
  ✅ Current status understood
  ✅ Ready for development work

💡 Project Summary:
  {2-3 sentence summary of what the project is and current state}
\`\`\`

### 6. Partial Context Handling

If some files fail to load:
- Continue with available context
- Clearly note what's missing
- Suggest remediation:
  - "Missing technical context - run /context:create to rebuild"
  - "Progress file corrupted - run /context:update to refresh"

### 7. Performance Optimization

For large contexts:
- Load files in parallel when possible
- Show progress indicator: "Loading context files... {current}/{total}"
- Skip extremely large files (>10000 lines) with warning
- Cache parsed frontmatter for faster subsequent loads

## Important Notes

- **Always validate** files before attempting to read
- **Load in priority order** to get essential context first
- **Handle missing files gracefully** - don't fail completely
- **Provide clear summary** of what was loaded and project state
- **Note any issues** that might affect development work
`;

// --- Command Definition ---
exports.command = 'context:prime';
exports.describe = 'Prime Context';

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
  const spinner = createSpinner('Executing context:prime...');

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