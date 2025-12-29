# ClaudeAutoPM Development Project


## Active Team Agents

<!-- AGENTS_START -->
- @include .claude/agents/core/agent-manager.md
- @include .claude/agents/core/code-analyzer.md
- @include .claude/agents/core/file-analyzer.md
- @include .claude/agents/core/test-runner.md
- @include .claude/agents/languages/bash-scripting-expert.md
- @include .claude/agents/languages/javascript-frontend-engineer.md
- @include .claude/agents/languages/nodejs-backend-engineer.md
- @include .claude/agents/testing/e2e-test-engineer.md
<!-- AGENTS_END -->

> This is the development repository for ClaudeAutoPM framework.
> **IMPORTANT**: This project uses its own framework capabilities for self-maintenance.

## 📋 Development Standards

**ALL development MUST follow standards defined in:** `.claude/DEVELOPMENT-STANDARDS.md`

This document defines MANDATORY standards for:
- Agent development (templates, checklists, principles)
- Rules development (patterns, formats, enforcement)
- Command development (structure, output formats, tools)
- Script development (Bash/Node.js templates, utilities)
- Hook development (enforcement patterns)
- Naming conventions (prohibitions, required patterns)
- Code quality standards (principles, anti-patterns, checklist)

### 🔴 MANDATORY: Context7 Documentation Queries

**CRITICAL REQUIREMENT**: Every agent AND every command (new or existing) MUST include a **Documentation Queries** section with Context7 MCP links.

**⚡ ACTIVE ENFORCEMENT**: This project uses automated Context7 enforcement hooks that will:
- 🔒 **Intercept** every command and agent invocation
- 📖 **Display** required Context7 queries before execution
- ✅ **Remind** you to query documentation before proceeding
- 🚫 **Block** execution if Documentation Queries section is missing

#### For Agents

**Why This is Required:**
- Ensures agents always use the latest documentation
- Prevents hallucinations and outdated information
- Provides consistent, reliable guidance
- Reduces errors from stale knowledge

**Required Format in Every Agent:**

```markdown
**Documentation Queries:**
- `mcp://context7/<library-name>/<topic>` - Description of documentation
- `mcp://context7/<framework>/<section>` - What this covers
```

**Example (from aws-cloud-architect.md):**

```markdown
**Documentation Queries:**
- `mcp://context7/aws/compute` - EC2, EKS, Lambda documentation
- `mcp://context7/aws/networking` - VPC, ELB, CloudFront
- `mcp://context7/terraform/aws` - Terraform AWS provider patterns
```

#### For Commands

**Why This is Required:**
- Ensures all workflows follow industry best practices
- Applies proven methodologies and frameworks for the specific domain
- Validates operations against current standards
- Prevents anti-patterns and outdated implementation patterns

**Required Format in Every Command:**

```markdown
## Required Documentation Access

**MANDATORY:** Before [action], query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/agile/<topic>` - Description
- `mcp://context7/project-management/<section>` - What this covers

**Why This is Required:**
- [Specific reasons for this command]
```

**Examples:**

From PM command (epic-decompose.md):
```markdown
**Documentation Queries:**
- `mcp://context7/agile/epic-decomposition` - Epic breakdown best practices
- `mcp://context7/agile/task-sizing` - Task estimation and sizing
- `mcp://context7/agile/user-stories` - User story formats (INVEST criteria)
```

From Infrastructure command (ssh-security.md):
```markdown
**Documentation Queries:**
- `mcp://context7/security/ssh-hardening` - SSH hardening best practices
- `mcp://context7/security/authentication` - Authentication methods
- `mcp://context7/infrastructure/security` - Infrastructure security patterns
```

From Azure command (feature-decompose.md):
```markdown
**Documentation Queries:**
- `mcp://context7/agile/feature-breakdown` - Feature breakdown patterns
- `mcp://context7/azure-devops/features` - Azure DevOps features
- `mcp://context7/project-management/work-breakdown` - Work breakdown structure
```

#### Obligations

1. **ALWAYS** query Context7 documentation before implementing solutions
2. **NEVER** rely solely on training data for technical specifics
3. **VERIFY** patterns and approaches against live documentation
4. **UPDATE** implementation when documentation shows better approaches

#### Enforcement

- All agent PRs must include Documentation Queries section
- All command PRs must include Required Documentation Access section
- Existing agents/commands without this section must be updated
- Reviews will check for Context7 usage in implementations

#### Coverage Status

As of the latest update:
- **Agents**: 45/45 (100%) have Documentation Queries
- **Commands**: 100/100 (100%) have Required Documentation Access
- **Total Coverage**: 145/145 framework components (100%)

#### Enforcement Implementation

Context7 queries are enforced automatically through:

**Rules-Based Enforcement:**
- `.claude/rules/context7-enforcement.md` - Mandatory rule read by Claude on every session
- Zero tolerance policy for implementations without Context7 verification
- Highest priority in rule hierarchy (equal to TDD enforcement)

**Automated Hooks:**
- `.claude/hooks/pre-command-context7.js` - Intercepts ALL command executions
  - Extracts Documentation Queries from command files
  - Validates Context7 section presence
  - Blocks execution if queries missing
  - Reminds Claude to query Context7 before implementation

- `.claude/hooks/pre-agent-context7.js` - Intercepts ALL agent invocations
  - Extracts Documentation Queries from agent files
  - Validates Context7 section presence
  - Blocks invocation if queries missing
  - Reminds Claude to query Context7 before work begins

**Testing Hooks:**
```bash
# Test command hook
node .claude/hooks/pre-command-context7.js "/pm:epic-decompose feature-name"

# Test agent hook
node .claude/hooks/pre-agent-context7.js "@aws-cloud-architect design VPC"
```

**What Hooks Do:**
1. ✅ Parse command/agent invocation
2. ✅ Locate corresponding .md file
3. ✅ Extract Documentation Queries section
4. ✅ Display required Context7 queries
5. ✅ Block execution if section missing
6. ✅ Remind Claude to query Context7 before proceeding

**Integration with Claude Code:**
- Hooks run automatically when commands/agents are invoked
- Context7 MCP queries must be performed before implementation
- Training data alone is NEVER sufficient for technical specifics
- API signatures, patterns, and best practices MUST be verified against live docs

**Visual User Experience:**

When you type a command like `/pm:epic-decompose` or invoke an agent like `@aws-cloud-architect`, you will see:

```
🔒 Context7 Enforcement Active

📋 Command: /pm:epic-decompose my-feature
📚 Querying Context7 for required documentation...

   ➜ mcp://context7/agile/epic-decomposition
   ➜ mcp://context7/agile/task-sizing
   ➜ mcp://context7/agile/user-stories
   ➜ mcp://context7/project-management/task-breakdown

✅ Context7 queries complete
📖 Key findings: [summary of what was learned from Context7]

Proceeding with implementation using Context7-verified best practices...
```

This ensures **transparency** - you always know when Context7 is being consulted and what guidance is being applied.

## 🚀 Development Methodology

### Test-Driven Development (TDD) is MANDATORY

**IMPORTANT**: This project follows strict TDD methodology. ALL code changes MUST:
1. **Write tests FIRST** - Before implementing any functionality
2. **Use Jest framework** - All tests are written in Jest
3. **Achieve 100% coverage** - For new code
4. **Run tests before commit** - `npm test` must pass

### Technology Stack

- **Language**: JavaScript/Node.js (cross-platform)
- **CLI Framework**: yargs for command parsing
- **Testing**: Jest with comprehensive test coverage
- **Installation**: JavaScript-based installer with interactive prompts
- **Package Management**: npm with global installation support

### Testing Requirements

- **Framework**: Jest (configured in `package.json`)
- **Test location**: Tests mirror source structure in `test/` directory
- **Test files**: Use `.test.js` suffix
- **Run tests**: `npm test` or `npm run test:all`
- **Coverage**: `npm run test:coverage`

### TDD Workflow for New Features

```bash
# 1. Write failing test first
npm test -- --watch path/to/new.test.js

# 2. Implement minimal code to pass
# 3. Refactor while keeping tests green
# 4. Ensure all tests pass
npm test

# 5. Check coverage
npm run test:coverage
```

## Project Structure

```
AUTOPM/                    # Development project root
├── .claude/              # Project's own self-maintenance configuration
│   ├── agents/           # Project-specific maintenance agents
│   ├── commands/         # PM commands for maintenance
│   ├── rules/            # Self-maintenance rules
│   └── strategies/       # Optimization strategies
├── autopm/               # Framework resources (copied during install)
│   ├── .claude/          # Claude configuration and resources
│   │   └── agents/       # Framework agents (USE THESE!)
│   ├── .claude-code/     # Claude Code settings
│   └── scripts/          # Utility scripts
├── install/              # Installation scripts
├── test/                 # Test suites (Jest)
│   ├── security/         # Security tests
│   ├── regression/       # Regression tests
│   └── installation/     # Installation tests
├── bin/                  # CLI executables
└── docs/                 # Documentation
```

## 🤖 Self-Maintenance Using Framework Agents

### Critical Framework Agents for Project Maintenance

#### agent-manager
- **Location**: `autopm/.claude/agents/core/agent-manager.md`
- **Purpose**: Create, analyze, and manage agents in the registry
- **Use for**: Adding new agents, updating documentation, deprecating old agents
- **Example**: `@agent-manager create a new specialized agent for GraphQL development`

#### code-analyzer
- **Location**: `autopm/.claude/agents/core/code-analyzer.md`
- **Purpose**: Analyze code changes for bugs, trace logic flow, investigate issues
- **Use for**: Pre-release validation, security scanning, optimization impact analysis
- **Example**: `@code-analyzer review recent optimization changes for breaking changes`

#### test-runner
- **Location**: `autopm/.claude/agents/core/test-runner.md`
- **Purpose**: Run tests and provide comprehensive analysis of results
- **Use for**: Validation after changes, regression testing, performance benchmarks
- **Example**: `@test-runner execute all installation tests with detailed failure analysis`

#### file-analyzer
- **Location**: `autopm/.claude/agents/core/file-analyzer.md`
- **Purpose**: Analyze and summarize large files to reduce context usage
- **Use for**: Log analysis, documentation review, test output summarization
- **Example**: `@file-analyzer summarize the installation logs for key issues`

#### github-operations-specialist
- **Location**: `autopm/.claude/agents/devops/github-operations-specialist.md`
- **Purpose**: Manage GitHub workflows, releases, and CI/CD
- **Use for**: Creating releases, managing Actions, automating workflows
- **Example**: `@github-operations-specialist create a new release with changelog`

#### docker-containerization-expert
- **Location**: `autopm/.claude/agents/devops/docker-containerization-expert.md`
- **Purpose**: Docker containerization and testing
- **Use for**: Testing in containers, multi-platform validation, CI/CD containers
- **Example**: `@docker-containerization-expert test installation in isolated containers`

### Project-Specific Maintenance Agents

#### registry-manager
- **Location**: `.claude/agents/project-maintenance/registry-manager.md`
- **Purpose**: Validate and maintain agent registry consistency
- **Use for**: Registry validation, deprecation tracking

#### installer-tester
- **Location**: `.claude/agents/project-maintenance/installer-tester.md`
- **Purpose**: Test all installation scenarios
- **Use for**: Installation validation, upgrade testing

#### optimization-analyzer
- **Location**: `.claude/agents/project-maintenance/optimization-analyzer.md`
- **Purpose**: Find optimization opportunities
- **Use for**: Agent consolidation, context efficiency analysis

## 📋 Maintenance Commands Using Agents

### /pm:validate
```bash
# Uses multiple agents for comprehensive validation
/pm:validate
# - registry-manager: Validates agent registry
# - code-analyzer: Checks code quality
# - test-runner: Executes smoke tests
```

### /pm:optimize
```bash
# Analyzes optimization opportunities
/pm:optimize
# - optimization-analyzer: Finds redundancies
# - code-analyzer: Impact analysis
# - test-runner: Validates changes
```

### /pm:release
```bash
# Prepares and executes releases
/pm:release
# - github-operations-specialist: GitHub release
# - test-runner: Final validation
# - installer-tester: Installation verification
```

## 🎯 Practical Agent Usage Examples

### Adding a New Agent to Framework
```markdown
@agent-manager create a new agent for GraphQL API development
- Add to autopm/.claude/agents/frameworks/graphql-api-expert.md
- Update AGENT-REGISTRY.md
- Create documentation and examples
- Add tests for the new agent
```

### Reviewing Code Before Release
```markdown
@code-analyzer review all changes since last release
- Check for breaking changes
- Identify security vulnerabilities
- Analyze performance impact
- Suggest optimizations
```

### Running Comprehensive Tests
```markdown
@test-runner execute full test suite
- Run security tests
- Run regression tests
- Run installation tests
- Provide detailed failure analysis
```

### Analyzing Large Log Files
```markdown
@file-analyzer summarize test/logs/installation-failure.log
- Extract error patterns
- Identify root causes
- Reduce context to key issues
```

### Creating a New Release
```markdown
@github-operations-specialist prepare release v1.0.8
- Update version in package.json
- Generate changelog from commits
- Create GitHub release
- Prepare npm publication
```

### Testing in Containers
```markdown
@docker-containerization-expert test installation scenarios
- Test minimal installation in Alpine
- Test full installation in Ubuntu
- Validate cross-platform compatibility
```

## 🔄 Self-Maintenance Workflow

### Daily Maintenance
```bash
# Morning validation using framework agents
/pm:validate              # Uses registry-manager, code-analyzer, test-runner
npm run pm:metrics      # Uses optimization-analyzer
npm run pm:health       # Comprehensive health check
```

### Before Making Changes
```bash
# Ensure clean state
/pm:validate registry    # Uses registry-manager
npm test               # Uses test-runner
git status             # Check for uncommitted changes
```

### After Making Changes
```bash
# Validate changes
@code-analyzer review my changes for issues
@test-runner run affected tests
/pm:validate            # Full validation
```

### Before Committing
```bash
# Pre-commit validation (automated via git hooks)
npm test                # Uses test-runner
npm run validate:paths  # Check for hardcoded autopm/ paths
/pm:validate registry   # Uses registry-manager
@code-analyzer check for security issues
```

**Note:** Git hooks automatically run `validate:paths` before each commit to prevent hardcoded path issues.

### Before Release
```bash
# Full release preparation
/pm:release --dry-run  # Test release process
@installer-tester test all scenarios
@test-runner execute full test suite
/pm:release           # Execute release
```

## Development Guidelines

### Working on Framework Files

When modifying framework files, work in the `autopm/` directory:
- `autopm/.claude/` - Resources that will be copied to user projects
- `autopm/.claude/templates/` - Templates for generating files (NOT copied)

**⚠️ CRITICAL PATH RULE:** Never use hardcoded `autopm/` paths in framework files. The `autopm/` directory does not exist after installation. Always use `.claude/` paths instead.

### Testing Changes

```bash
# Run all tests
npm run test:all

# Validate framework paths (CRITICAL before committing)
npm run validate:paths

# Test installation scenarios
npm run test:install

# Test security features
npm run test:security

# Validate installation
npm run test:install:validate

# Setup git hooks (run once after cloning)
npm run setup:githooks
```

### Installation Flow

1. User runs `autopm install`
2. Script copies from `autopm/.claude/` (excluding templates)
3. Templates are used to generate CLAUDE.md and config
4. Strategy is installed based on chosen configuration

### Key Directories

#### `autopm/.claude/` (Framework Resources)
- **agents/** - Agent definitions
- **commands/** - PM commands
- **rules/** - Development rules
- **scripts/** - Helper scripts
- **checklists/** - Including COMMIT_CHECKLIST.md
- **templates/** - Templates for generation (NOT copied)
  - **claude-templates/** - CLAUDE.md templates
  - **config-templates/** - Configuration templates
  - **strategies-templates/** - Execution strategy templates

#### `install/` (Installation Logic)
- **install.sh** - Main installation script
- **merge-claude.sh** - CLAUDE.md merging logic
- **setup-env.sh** - Environment setup

#### `test/` (Test Suites)
- **security/** - Prompt injection, context isolation, performance
- **regression/** - File integrity, feature preservation
- **installation/** - Scenario testing, validation

## Configuration Options

### Installation Scenarios

0. **Lite** - Core + PM essentials (~50 commands, minimal context)
1. **Standard** - Core + languages + PM (~55 commands) - DEFAULT
2. **Azure** - Standard + Azure DevOps integration (~95 commands)
3. **Docker** - Containerized dev with full PM + Azure (7 plugins)
4. **Full DevOps** - Complete CI/CD pipeline (RECOMMENDED, 10 plugins)
5. **Performance** - Maximum parallel execution (12 plugins)
6. **Custom** - User-provided configuration

**Note:** All scenarios include PM - this is a PM framework. Azure DevOps is optional via `plugin-pm-azure`.

### Execution Strategies

- **Sequential** - Safe, one agent at a time
- **Adaptive** - Intelligent mode selection (DEFAULT)
- **Hybrid** - Maximum parallelization

## Testing Strategy

### Pre-commit Tests
```bash
# Runs automatically via git hooks
./scripts/safe-commit.sh "feat: your message"
```

### CI/CD Simulation
```bash
npm run ci:local
```

### Installation Testing
```bash
# Test all scenarios
npm run test:install

# Validate specific installation
npm run test:install:validate /path/to/project

# Test package-based installation (TDD tests)
node test/installation/package-based-install.test.js
```

### Debugging Installation Issues

If installation shows warnings or errors:

1. **Check for missing files warnings**:
   ```bash
   # Should NOT appear in normal operation:
   # ⚠ Cannot create template for: FILENAME - file missing from source
   ```
   - These indicate files listed in `INSTALL_ITEMS` but missing from `autopm/` directory
   - Update `install/install.sh` to remove unnecessary files from `INSTALL_ITEMS` array

2. **Test installation manually**:
   ```bash
   cd /tmp && mkdir test-install && cd test-install
   AUTOPM_TEST_MODE=1 node /path/to/autopm/bin/autopm.js install
   ```

3. **Check installation completeness**:
   ```bash
   ls -la .claude/  # Should contain: agents, commands, rules, scripts, checklists
   ls -la scripts/  # Should contain: safe-commit.sh, setup-hooks.sh
   ```

## Publishing

```bash
# Update version
npm version patch|minor|major

# Publish to npm
npm publish
```

## Important Files

- **package.json** - NPM package configuration
- **README.md** - GitHub repository documentation
- **CHANGELOG.md** - Version history
- **CLAUDE.md** - Development project instructions

## Development Workflow

1. Make changes in `autopm/` directory
2. Run tests: `npm run test:all`
3. Test installation: `npm run test:install`
4. Commit with: `./scripts/safe-commit.sh`
5. Create PR with detailed description

## 📝 Commit Guidelines

**IMPORTANT**: When committing changes to this repository:

### ❌ DO NOT Add Claude Attribution

**Never** include Claude collaboration signatures in commits:
```bash
# ❌ DO NOT DO THIS:
# 🤖 Generated with Claude Code
# Co-Authored-By: Claude <noreply@anthropic.com>
```

This repository is for **human development** of the ClaudeAutoPM framework. While Claude may assist during development, all commits should be attributed only to human contributors.

### ✅ Commit Message Format

Use semantic commit messages:
```bash
feat: add dynamic MCP server installation
fix: correct config validation logic
docs: update MCP setup guide
test: add integration tests for installer
refactor: simplify agent registry logic
```

### Commit Process

```bash
# Use the safe-commit script (includes pre-commit checks)
./scripts/safe-commit.sh "feat: your message here"

# Or standard git workflow
git add .
git commit -m "feat: your message"
git push
```

## Debugging

### Check Installation
```bash
node test/installation/validate-install.js /target/path
```

### Test Specific Scenario
```bash
echo "3" | bash install/install.sh
```

### Verify Templates
```bash
ls -la autopm/.claude/templates/
```

## Contributing

1. Follow TDD approach
2. Maintain test coverage
3. Update documentation
4. Run all tests before PR
5. Use semantic commit messages

## Support

- Issues: https://github.com/rafeekpro/ClaudeAutoPM/issues
- Documentation: See README.md and wiki
- Examples: See autopm/.claude/examples/