# AutoPM Development Standards

**Central reference for all development standards, patterns, and conventions.**

> **CRITICAL**: This document defines MANDATORY standards for all AutoPM development.
> All code, agents, rules, commands, and scripts MUST follow these conventions.

---

## 📚 Table of Contents

1. [Core Principles](#core-principles)
2. [Agent Development](#agent-development)
3. [Rules Development](#rules-development)
4. [Command Development](#command-development)
5. [Script Development](#script-development)
6. [Hook Development](#hook-development)
7. [Naming Conventions](#naming-conventions)
8. [Code Quality Standards](#code-quality-standards)
9. [Quick Reference](#quick-reference)

---

## Core Principles

### 1. Test-Driven Development (TDD)
**MANDATORY** for all code:
- Write failing tests FIRST
- Red-Green-Refactor cycle
- 100% coverage for new code
- Use Jest framework

### 2. Consistency First
- Always check existing patterns before implementing
- Read existing code for conventions
- Follow established patterns exactly
- Never assume, always verify

### 3. Context Efficiency
- Minimize context usage while maintaining quality
- Use agents for summarization
- Return <20% of processed data
- Structure for scannability

### 4. Agent-First Development
- Use specialized agents over direct tools
- Chain agents for complex workflows
- Respect agent boundaries
- Follow output formats

### 5. Minimal Viable Implementation
- Don't over-engineer
- Trust the system
- Fail fast, fail clear
- Smart defaults over questions

---

## Agent Development

### Directory Structure

```
.claude/agents/
├── core/           # Essential system agents (4 agents)
├── languages/      # Language-specific experts (3 agents)
├── testing/        # Testing specialists (1 agent)
└── [category]/     # Future categories
```

### Agent File Template

```markdown
---
name: agent-name
description: Use this agent for [purpose]. Expert in [technologies]. Specializes in [specializations].
tools: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
model: inherit
color: green
---

# Agent Name

You are a senior [role] with deep expertise in [domain].

## Test-Driven Development (TDD) Methodology

**MANDATORY**: Follow strict TDD principles for all development:
1. **Write failing tests FIRST** - Before implementing any functionality
2. **Red-Green-Refactor cycle** - Test fails → Make it pass → Improve code
3. **One test at a time** - Focus on small, incremental development
4. **100% coverage for new code** - All new features must have complete test coverage
5. **Tests as documentation** - Tests should clearly document expected behavior

## Documentation Access via MCP Context7

Before starting any implementation, you have access to live documentation through the MCP context7 integration:

- **[Framework] Documentation**: Official docs and best practices
- **TypeScript for [Language]**: Server-side TypeScript patterns
- **Security Guidelines**: OWASP security cheatsheet

Use these queries to access documentation:
- `mcp://context7/[framework]/latest` - Framework documentation
- `mcp://context7/[tool]/latest` - Tool-specific docs

## Core Expertise

### [Domain] Mastery
- **[Skill 1]**: Description
- **[Skill 2]**: Description
- **[Skill 3]**: Description

## Development Patterns

[Include specific patterns, code examples, best practices]

## Self-Verification Protocol

Before delivering any solution, verify:
- [ ] Documentation from Context7 has been consulted
- [ ] Code follows best practices
- [ ] Tests are written and passing
- [ ] Performance is acceptable
- [ ] Security considerations addressed
- [ ] No resource leaks
- [ ] Error handling is comprehensive

You are an expert in [domain].
```

### Agent Implementation Checklist

- [ ] Create agent documentation in `.claude/agents/[category]/[agent-name].md`
- [ ] Add frontmatter with name, description, tools, model, color
- [ ] Include TDD methodology section (MANDATORY)
- [ ] Add MCP Context7 integration section
- [ ] Define core expertise areas
- [ ] Include development patterns and examples
- [ ] Add self-verification protocol
- [ ] Update CLAUDE.md `@include` section
- [ ] Update `.claude/agents/AGENT-REGISTRY.md`
- [ ] Add to appropriate category README.md
- [ ] Create test scenarios (if applicable)

### Agent Design Principles

1. **Single Responsibility**: Clear, focused expertise
2. **Context Efficiency**: Minimize context usage
3. **Clear Boundaries**: Well-defined capabilities
4. **Composability**: Work well with other agents
5. **Testability**: Include validation patterns
6. **Documentation**: Practical examples and edge cases

### Agent Categories

| Category | Purpose | Examples |
|----------|---------|----------|
| **core/** | Essential for all projects | agent-manager, code-analyzer, file-analyzer, test-runner |
| **languages/** | Language-specific experts | nodejs-backend-engineer, javascript-frontend-engineer, bash-scripting-expert |
| **testing/** | Testing specialists | e2e-test-engineer |
| **frameworks/** | Framework specialists | (future: react-expert, vue-expert) |
| **devops/** | CI/CD and operations | (future: docker-expert, kubernetes-expert) |

### Agent Communication Protocols

Agents use structured protocols for coordination:

- **CLAIM/RELEASE** - File ownership management
- **HANDOFF** - Work transfer between agents
- **BLOCK** - Signal when assistance needed
- **STATUS** - Regular progress updates

---

## Rules Development

### Purpose of Rules

Rules define MANDATORY behaviors, standards, and patterns that MUST be followed.

### Rule File Template

```markdown
# [Rule Name]

> **CRITICAL**: [One-line summary of rule importance]

## MANDATORY BEHAVIORS

1. [Behavior 1]
2. [Behavior 2]
3. [Behavior 3]

## PROHIBITED ACTIONS

- ❌ Never [action]
- ❌ Avoid [pattern]
- ❌ Don't [anti-pattern]

## PATTERNS

### [Pattern Category]

**Good:**
```[language]
// Example of correct pattern
```

**Bad:**
```[language]
// Example of anti-pattern
```

## ENFORCEMENT

- How violations are detected
- How to fix violations
- Prevention strategies

## EXAMPLES

[Practical examples of rule application]
```

### Rule Categories

**Essential Rules** (in `.claude/rules/`):
- `tdd.enforcement.md` - TDD methodology (MANDATORY)
- `git-strategy.md` - Git workflow
- `naming-conventions.md` - Naming standards
- `standard-patterns.md` - Command patterns
- `performance-guidelines.md` - Optimization
- `development-workflow.md` - Development process
- `definition-of-done.md` - Quality standards
- `test-execution.md` - Testing standards
- `golden-rules.md` - Core principles
- `datetime.md` - Date/time handling
- `frontmatter-operations.md` - YAML manipulation
- `strip-frontmatter.md` - Frontmatter processing

### Rule Design Principles

1. **Clear and Concise**: One rule, one concept
2. **Enforceable**: Must be testable/verifiable
3. **Practical**: Include examples
4. **Mandatory**: No optional rules

---

## Command Development

### Command File Template

```markdown
---
allowed-tools: Bash, Read, Write, LS
---

# Command Name

Brief description of what this command does.

## Usage
```
/command:name [arguments]
```

## Quick Check

```bash
# Check critical prerequisites only
test -f {required-file} || echo "❌ {file} not found. Run: {fix-command}"
```

## Instructions

### 1. Main Action

[Step-by-step instructions]

### 2. Error Handling

**Common Issues:**
- **{Issue}**: "{Error message}" → Run: `{fix-command}`

### 3. Output

```
✅ {Action} complete
  - {Key result 1}
  - {Key result 2}
Next: {Single suggested action}
```

## Examples

```bash
# Example 1
/command:name arg1

# Example 2
/command:name --flag
```

$ARGUMENTS
```

### Command Standards

#### Core Principles
1. **Fail Fast** - Check critical prerequisites, then proceed
2. **Trust the System** - Don't over-validate
3. **Clear Errors** - Exact problem + exact solution
4. **Minimal Output** - Show what matters

#### Standard Output Formats

**Success:**
```markdown
✅ {Action} complete
  - {Key result 1}
  - {Key result 2}
Next: {Single suggested action}
```

**Error:**
```markdown
❌ {What failed}: {Exact solution}
```

**List:**
```markdown
{Count} {items} found:
- {item 1}: {key detail}
- {item 2}: {key detail}
```

**Progress:**
```markdown
{Action}... {current}/{total}
```

#### Essential Tools Only

- **Read/List operations**: `Read, LS`
- **File creation**: `Read, Write, LS`
- **GitHub operations**: Add `Bash`
- **Complex analysis**: Add `Task` (sparingly)

#### Status Indicators

- ✅ Success (use sparingly)
- ❌ Error (always with solution)
- ⚠️ Warning (only if action needed)
- No emoji for normal output

---

## Script Development

### Script Categories

**Utility Scripts** (in `.claude/scripts/`):
- `decompose-issue.js` - Issue decomposition utility

**Library Scripts** (in `.claude/scripts/lib/`):
- `datetime-utils.sh` - Date/time operations
- `frontmatter-utils.sh` - YAML frontmatter manipulation
- `github-utils.sh` - GitHub CLI helpers
- `logging-utils.sh` - Consistent logging
- `validation-utils.sh` - Input validation

### Bash Script Template

```bash
#!/usr/bin/env bash
#
# Script: script-name.sh
# Description: Brief description
# Version: 1.0.0

set -euo pipefail
IFS=$'\n\t'

# Enable debug mode if DEBUG is set
[[ "${DEBUG:-0}" == "1" ]] && set -x

# Script configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"

# Source utilities
source "${SCRIPT_DIR}/lib/logging-utils.sh"
source "${SCRIPT_DIR}/lib/validation-utils.sh"

# Logging functions
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

# Error handling
trap 'error_handler $? $LINENO' ERR
trap cleanup EXIT INT TERM

error_handler() {
    local exit_code=$1
    local line_number=$2
    log_error "Command failed with exit code ${exit_code} at line ${line_number}"
    exit "${exit_code}"
}

cleanup() {
    # Cleanup code here
    :
}

# Main function
main() {
    log "Starting ${SCRIPT_NAME}"

    # Implementation here

    log "Completed successfully"
}

# Execute main if script is run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
```

### Node.js Script Template

```javascript
#!/usr/bin/env node

/**
 * Script: script-name.js
 * Description: Brief description
 * Version: 1.0.0
 */

const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  scriptDir: __dirname,
  scriptName: path.basename(__filename)
};

// Logging utilities
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function logError(message, error) {
  console.error(`❌ ${message}`);
  if (error && error.message) {
    console.error(`   ${error.message}`);
  }
}

// Main function
async function main() {
  try {
    log(`Starting ${config.scriptName}`);

    // Implementation here

    log('Completed successfully');
  } catch (error) {
    logError('Script failed', error);
    process.exit(1);
  }
}

// Execute main
main().catch(error => {
  logError('Fatal error', error);
  process.exit(1);
});
```

### Script Standards

1. **Error Handling**: Use `set -euo pipefail` for bash, try-catch for Node.js
2. **Logging**: Use utility functions from `logging-utils.sh`
3. **Cleanup**: Always trap EXIT/INT/TERM
4. **Configuration**: Use readonly variables
5. **Documentation**: Include header with description
6. **Validation**: Use utility functions from `validation-utils.sh`

---

## Hook Development

### Hook Purpose

Hooks enforce standards and prevent anti-patterns by intercepting tool calls.

### Hook Types

**Agent Enforcement** (`.claude/hooks/enforce-agents.js`):
- Block direct grep/find → Use `code-analyzer`
- Block direct test execution → Use `test-runner`
- Suggest appropriate agents

**Test Hook** (`.claude/hooks/test-hook.sh`):
- Validate hook functionality
- Ensure hooks are working correctly

**Strict Enforcement** (`.claude/hooks/strict-enforce-agents.sh`):
- Enforce strict agent usage
- Prevent direct tool access

### Hook Template

```javascript
#!/usr/bin/env node

/**
 * Hook: hook-name.js
 * Purpose: Brief description
 */

class HookEnforcer {
  constructor() {
    this.toolName = process.argv[2] || '';
    this.toolParams = process.argv[3] || '';

    try {
      this.parsedParams = JSON.parse(this.toolParams);
    } catch {
      this.parsedParams = {};
    }
  }

  blockWithMessage(reason, agent, example) {
    console.log(`❌ BLOCKED: ${reason}`);
    console.log(`✅ INSTEAD: Use the ${agent} agent via Task tool`);
    console.log('');
    console.log('Example:');
    console.log(`  Task: ${example}`);
    process.exit(1);
  }

  check() {
    // Implement checks here
  }

  run() {
    this.check();
    process.exit(0);
  }
}

const enforcer = new HookEnforcer();
enforcer.run();
```

---

## Naming Conventions

### ❌ ABSOLUTE PROHIBITIONS

**Never Use These Suffixes:**
- `_advanced`, `_fixed`, `_improved`, `_new`, `_old`
- `_v2`, `_v3`, `_backup`, `_copy`, `_temp`
- `_updated`, `_modified`, `_changed`
- Generic suffixes that don't describe function
- Version numbers in names (use git for versioning)

**Never Create These Files:**
- `CHANGES_[DATE]_[FEATURE].md`
- `SUMMARY_OBJECTIVE_[N].md`
- `WORKFLOW_SETUP_GUIDE.md`
- One-off documentation files for single changes
- Documentation files unless explicitly requested
- Temporary explanation files

### ✅ REQUIRED PATTERNS

#### Before ANY Implementation

1. Check existing codebase for naming patterns
2. Read naming conventions from existing code
3. Follow established patterns exactly
4. When in doubt, search for similar functions

#### Function/Variable Naming

- **Descriptive names** that explain purpose
- **Language conventions**: camelCase (JS), snake_case (bash), PascalCase (classes)
- **Consistency** with existing codebase
- **Clarity over brevity**

#### File Naming

- **Match existing patterns** in the codebase
- **Semantic names** that describe content
- **No temporary** or versioned file names
- **Keep extensions consistent**

#### Agent Naming

- **Format**: `category-specialty-expert` or `tool-specialist`
- **Examples**: `nodejs-backend-engineer`, `bash-scripting-expert`, `code-analyzer`
- **Pattern**: `[domain]-[specialty]-[role]`

#### Command Naming

- **Format**: `namespace:action` or `namespace:entity-action`
- **Examples**: `/testing:run`, `/pm:epic-list`, `/context:create`
- **Pattern**: `/[namespace]:[action]`

#### Script Naming

- **Bash**: `kebab-case.sh` (e.g., `epic-list.sh`)
- **Node.js**: `kebab-case.js` (e.g., `epic-show.js`)
- **Pattern**: `[entity]-[action].[ext]`

---

## Code Quality Standards

### ❌ NEVER TOLERATE

- Partial implementations
- "Simplified" code with TODOs
- Duplicate functions (always search first)
- Mixed concerns (UI with DB, validation with API)
- Resource leaks (unclosed connections, listeners)
- Dead code (unused functions, imports)
- Inconsistent formatting

### ✅ ALWAYS ENFORCE

- **Single Responsibility Principle**: One function, one job
- **Separation of Concerns**: Logic ≠ Presentation ≠ Data
- **Resource Cleanup**: Close connections, clear timeouts
- **Consistent Error Handling**: Use try-catch or error callbacks
- **Meaningful Names**: No `foo`, `bar`, `temp`, `data`
- **DRY Principle**: Don't Repeat Yourself

### Anti-Pattern Prevention

#### Over-Engineering
- ❌ Don't add unnecessary abstractions
- ❌ Don't create factory patterns when simple functions work
- ❌ Don't add middleware for trivial operations
- ❌ Don't think "enterprise" when you need "working"

#### Under-Engineering
- ❌ Don't skip error handling
- ❌ Don't ignore edge cases
- ❌ Don't hardcode values that should be configurable
- ❌ Don't assume happy path only

### Pre-Commit Checklist

Before ANY commit:

1. ✅ No naming convention violations
2. ✅ No duplicate code
3. ✅ No resource leaks
4. ✅ No mixed concerns
5. ✅ No partial implementations
6. ✅ No unnecessary complexity
7. ✅ All tests passing
8. ✅ Code follows TDD methodology

---

## Quick Reference

### Essential Commands

```bash
# Test-Driven Development
npm test                    # Run all tests
npm test -- --watch        # Watch mode
npm run test:coverage      # Coverage report

# Code Quality
npm run lint               # Lint code
npm run format             # Format code

# Git Workflow
./scripts/safe-commit.sh "feat: message"  # Commit with checks
git push                   # Push changes
```

### File Structure

```
.claude/
├── agents/              # Agent definitions (11 files)
│   ├── core/           # Essential agents (4)
│   ├── languages/      # Language experts (3)
│   ├── testing/        # Testing agents (1)
│   └── AGENT-REGISTRY.md
├── checklists/         # Checklists (1 file)
│   └── COMMIT_CHECKLIST.md
├── commands/           # Command definitions (6 files)
│   ├── code-rabbit.md
│   ├── prompt.md
│   ├── re-init.md
│   └── testing/
├── hooks/              # Enforcement hooks (4 files)
│   ├── enforce-agents.js
│   ├── enforce-agents.sh
│   ├── strict-enforce-agents.sh
│   └── test-hook.sh
├── lib/                # Command libraries (11 files)
│   └── commands/
├── rules/              # Development rules (12 files)
│   ├── tdd.enforcement.md
│   ├── naming-conventions.md
│   ├── standard-patterns.md
│   └── ...
└── scripts/            # Utility scripts (6 files)
    ├── decompose-issue.js
    └── lib/
        ├── datetime-utils.sh
        ├── frontmatter-utils.sh
        ├── github-utils.sh
        ├── logging-utils.sh
        └── validation-utils.sh
```

### Agent Usage Patterns

```markdown
# Use agent-manager for agent work
@agent-manager create a new agent for GraphQL

# Use code-analyzer for code review
@code-analyzer review recent changes for bugs

# Use test-runner for testing
@test-runner execute all tests with detailed analysis

# Use file-analyzer for log analysis
@file-analyzer summarize test.log for errors

# Use nodejs-backend-engineer for Node.js
@nodejs-backend-engineer optimize this API endpoint

# Use javascript-frontend-engineer for JS
@javascript-frontend-engineer refactor this module

# Use bash-scripting-expert for shell scripts
@bash-scripting-expert create an installation script
```

### Common Workflows

#### Creating a New Agent

1. Design agent scope and boundaries
2. Create agent file: `.claude/agents/[category]/[name].md`
3. Add frontmatter with metadata
4. Include TDD section (MANDATORY)
5. Add MCP Context7 integration
6. Define expertise and patterns
7. Add self-verification protocol
8. Update CLAUDE.md with `@include`
9. Update AGENT-REGISTRY.md
10. Test agent functionality

#### Creating a New Command

1. Define command purpose
2. Create command file: `.claude/commands/[name].md`
3. Add frontmatter with allowed-tools
4. Write Quick Check section
5. Write Instructions with error handling
6. Define output format
7. Add examples
8. Test command execution

#### Creating a New Rule

1. Identify MANDATORY behavior
2. Create rule file: `.claude/rules/[name].md`
3. Define mandatory behaviors
4. Define prohibited actions
5. Include good/bad examples
6. Define enforcement mechanism
7. Add practical examples

---

## References

- **TDD Enforcement**: `.claude/rules/tdd.enforcement.md`
- **Naming Conventions**: `.claude/rules/naming-conventions.md`
- **Standard Patterns**: `.claude/rules/standard-patterns.md`
- **Agent Registry**: `.claude/agents/AGENT-REGISTRY.md`
- **Performance Guidelines**: `.claude/rules/performance-guidelines.md`
- **Development Workflow**: `.claude/rules/development-workflow.md`

---

## Enforcement

### Discovery of Violation

1. **Stop immediately** - Don't continue with violation
2. **Fix the issue** - Correct naming, remove duplicates, clean up
3. **Document pattern** - If new, add to this document
4. **Test thoroughly** - Ensure fix doesn't break anything
5. **Commit properly** - Use semantic commit message

### Prevention Strategy

- Always search before creating
- Always read existing code for patterns
- Always use agents for analysis
- Never assume, always verify
- Follow TDD methodology

---

**Last Updated**: 2025-10-02
**Version**: 1.0.0
**Status**: Active

This document is the authoritative source for all AutoPM development standards.
