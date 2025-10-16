---
allowed-tools: Bash, Read, Write, LS, Task
---

# Issue Start

Begin work on a GitHub issue with parallel agents based on work stream analysis.

## Usage
` ``
/pm:issue-start <issue_number>
` ``

## Quick Check

1. **Get issue details:**
   ` ``bash
   gh issue view $ARGUMENTS --json state,title,labels,body
   ` ``
   If it fails: "❌ Cannot access issue #$ARGUMENTS. Check number or run: gh auth login"

2. **Find local task file:**
   - First check if `.claude/epics/*/$ARGUMENTS.md` exists (new naming)
   - If not found, search for file containing `github:.*issues/$ARGUMENTS` in frontmatter (old naming)
   - If not found: "❌ No local task for issue #$ARGUMENTS. This issue may have been created outside the PM system."

3. **Check for analysis:**
   ` ``bash
   test -f .claude/epics/*/$ARGUMENTS-analysis.md || echo "❌ No analysis found for issue #$ARGUMENTS
   
   Run: /pm:issue-analyze $ARGUMENTS first
   Or: /pm:issue-start $ARGUMENTS --analyze to do both"
   ` ``
   If no analysis exists and no --analyze flag, stop execution.

## Required Documentation Access

**MANDATORY:** Before starting work on issues, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/agile/issue-planning` - Issue planning and breakdown
- `mcp://context7/tdd/workflow` - Test-Driven Development workflow
- `mcp://context7/git/branching` - Git branching strategies
- `mcp://context7/collaboration/parallel-work` - Parallel development patterns

**Why This is Required:**
- Ensures work follows current TDD best practices
- Applies proven patterns for parallel development
- Validates task coordination strategies
- Prevents common pitfalls in distributed work

## ⚠️ TDD REMINDER - READ THIS FIRST

**CRITICAL: This project follows Test-Driven Development (TDD).**

Before ANY coding work begins, you MUST follow the RED-GREEN-REFACTOR cycle:

1. **RED Phase**: Write failing test that describes the desired behavior
2. **GREEN Phase**: Write minimum code to make test pass
3. **REFACTOR Phase**: Clean up code while keeping tests green

**For this issue:**
- Read the task requirements from the task file
- Identify what tests are needed BEFORE any implementation
- All agents must start with test creation
- No implementation without tests first

See `.claude/rules/tdd.enforcement.md` for complete TDD requirements.

---

## Instructions

### 1. Ensure Branch Exists

Check if epic branch exists:
` ``bash
# Find epic name from task file
epic_name={extracted_from_path}

# Check branch
if ! git branch -a | grep -q "epic/$epic_name"; then
  echo "❌ No branch for epic. Run: /pm:epic-start $epic_name"
  exit 1
fi

# Check out the branch
git checkout epic/$epic_name
git pull origin epic/$epic_name
` ``

### 2. Read Analysis

Read `.claude/epics/{epic_name}/$ARGUMENTS-analysis.md`:
- Parse parallel streams
- Identify which can start immediately
- Note dependencies between streams

### 3. Setup Progress Tracking

Get current datetime: `date -u +"%Y-%m-%dT%H:%M:%SZ"`

Create workspace structure:
` ``bash
mkdir -p .claude/epics/{epic_name}/updates/$ARGUMENTS
` ``

Update task file frontmatter `updated` field with current datetime.

### 4. Launch Parallel Agents

For each stream that can start immediately:

Create `.claude/epics/{epic_name}/updates/$ARGUMENTS/stream-{X}.md`:
` ``markdown
---
issue: $ARGUMENTS
stream: {stream_name}
agent: {agent_type}
started: {current_datetime}
status: in_progress
---

# Stream {X}: {stream_name}

## Scope
{stream_description}

## Files
{file_patterns}

## Progress
- Starting implementation
` ``

Launch agent using Task tool:
` ``yaml
Task:
  description: "Issue #$ARGUMENTS Stream {X}"
  subagent_type: "{agent_type}"
  prompt: |
    **🚨 CRITICAL RULE #1: Test-Driven Development (TDD) is MANDATORY**

    You MUST follow the RED-GREEN-REFACTOR cycle:
    1. **RED**: Write a FAILING test first that describes the desired behavior
    2. **GREEN**: Write MINIMUM code to make the test pass
    3. **REFACTOR**: Clean up code while keeping all tests green

    **NO CODE WITHOUT TESTS FIRST.** Zero exceptions.
    - Every function starts with a test
    - Every bug fix starts with a test that reproduces it
    - Every feature starts with failing acceptance tests

    See `.claude/rules/tdd.enforcement.md` for complete requirements.

    ---

    **CRITICAL RULE #2: This project uses 'Docker-first development'.**
    - All commands (dependency installation, tests, running the application) MUST be executed inside a Docker container using `docker compose run --rm <service_name> <command>`.
    - DO NOT run `npm`, `pip`, `pytest`, etc., directly on the host.
    - The source code is mounted as a VOLUME, so file changes will be immediately visible in the container (hot-reloading).
    - Full rules can be found in `.claude/rules/docker-first-development.md`.

    ---

    You are working on Issue #$ARGUMENTS in the epic branch.

    Branch: epic/{epic_name}
    Your stream: {stream_name}
    
    Your scope:
    - Files to modify: {file_patterns}
    - Work to complete: {stream_description}
    
    Requirements:
    1. Read full task from: .claude/epics/{epic_name}/{task_file}
    2. **START WITH TESTS**: Write failing tests BEFORE any implementation
    3. Work ONLY in your assigned files
    4. Follow TDD cycle: RED (test fails) → GREEN (minimal code) → REFACTOR (cleanup)
    5. Commit frequently with format: "Issue #$ARGUMENTS: {specific change}"
    6. Update progress in: .claude/epics/{epic_name}/updates/$ARGUMENTS/stream-{X}.md
    7. Follow coordination rules in /rules/agent-coordination.md
    
    If you need to modify files outside your scope:
    - Check if another stream owns them
    - Wait if necessary
    - Update your progress file with coordination notes
    
    Complete your stream's work and mark as completed when done.
` ``

### 5. GitHub Assignment

` ``bash
# Assign to self and mark in-progress
gh issue edit $ARGUMENTS --add-assignee @me --add-label "in-progress"
` ``

### 6. Output

` ``
✅ Started parallel work on issue #$ARGUMENTS

Epic: {epic_name}
Worktree: ../epic-{epic_name}/

Launching {count} parallel agents:
  Stream A: {name} (Agent-1) ✓ Started
  Stream B: {name} (Agent-2) ✓ Started
  Stream C: {name} - Waiting (depends on A)

Progress tracking:
  .claude/epics/{epic_name}/updates/$ARGUMENTS/

⚠️  TDD CHECKLIST - All agents MUST follow:
  1. ❌ RED: Write failing test
  2. ❌ GREEN: Make test pass (minimal code)
  3. ❌ REFACTOR: Clean up code

Monitor with: /pm:epic-status {epic_name}
Sync updates: /pm:issue-sync $ARGUMENTS
` ``

## Error Handling

If any step fails, report clearly:
- "❌ {What failed}: {How to fix}"
- Continue with what's possible
- Never leave partial state

## Important Notes

Follow `/rules/datetime.md` for timestamps.
Keep it simple - trust that GitHub and file system work.