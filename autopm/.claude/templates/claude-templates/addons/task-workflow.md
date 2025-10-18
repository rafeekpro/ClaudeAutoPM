## 🔄 STANDARD TASK WORKFLOW

```
┌─────────────────────────────────────────────────────────────────────┐
│  🚨 CRITICAL: ALL DEVELOPMENT FOLLOWS TDD (RED-GREEN-REFACTOR)     │
├─────────────────────────────────────────────────────────────────────┤
│  1. 🔴 RED:     Write FAILING test first                            │
│  2. ✅ GREEN:   Write MINIMUM code to pass                          │
│  3. ♻️  REFACTOR: Improve while tests stay green                    │
│                                                                     │
│  ❌ NO CODE WITHOUT TESTS                                           │
│  ❌ NO PARTIAL IMPLEMENTATIONS                                      │
│  ❌ NO "TODO: ADD TESTS LATER"                                      │
│                                                                     │
│  See: .claude/rules/tdd.enforcement.md (HIGHEST PRIORITY)          │
└─────────────────────────────────────────────────────────────────────┘
```

### 📋 Overview

Every task follows a structured workflow to ensure quality, traceability, and team coordination. This workflow applies to all development tasks: features, bugs, improvements, and technical debt.

**MANDATORY**: All code development MUST follow TDD (Test-Driven Development) cycle. This is not optional.

### 🎯 Core Workflow Principles

1. **Follow TDD Religiously** - Test FIRST, code SECOND (see banner above)
2. **Work in Branches** - Never commit directly to main
3. **Create Pull Requests** - All changes go through PR review
4. **Resolve Conflicts** - Address merge conflicts immediately
5. **Address Feedback** - Interpret and resolve all PR comments
6. **Merge When Ready** - Only merge after all checks pass
7. **Mark Complete** - Update task status and move to next task

### 🚀 Standard Task Workflow

#### 1. Pick a Task from Backlog

```bash
# View available tasks (GitHub Issues, Azure DevOps, Jira, etc.)
gh issue list --label="ready"

# Or use project management commands
/pm:backlog
/azure:work-items --state=Ready
```

**Task Selection Criteria:**
- Task has clear **Acceptance Criteria**
- Task has **Definition of Done** documented
- Dependencies are resolved
- Task is properly sized (not too large)

#### 2. Create Feature Branch

```bash
# Create branch from latest main
git checkout main
git pull origin main
git checkout -b feature/TASK-ID-short-description

# Examples:
# git checkout -b feature/ISSUE-123-user-authentication
# git checkout -b bugfix/ISSUE-456-fix-login-error
# git checkout -b improvement/ISSUE-789-optimize-api
```

**Branch Naming Convention:**
- `feature/TASK-ID-description` - New features
- `bugfix/TASK-ID-description` - Bug fixes
- `improvement/TASK-ID-description` - Improvements
- `docs/TASK-ID-description` - Documentation
- `refactor/TASK-ID-description` - Refactoring

#### 3. Implement Solution

**🚨 CRITICAL: ALWAYS Follow TDD Cycle (RED-GREEN-REFACTOR)**

See `.claude/rules/tdd.enforcement.md` for complete TDD enforcement rules.

**Before Starting:**
```bash
# Use specialized agents for implementation
@python-backend-engineer implement user authentication API following TDD
@react-frontend-engineer create login component following TDD
@test-runner run existing tests to ensure baseline
```

**🔴 TDD STEP 1: RED Phase (Write Failing Test First)**

```bash
# ALWAYS write the test FIRST
# Example for authentication endpoint:

# 1. Create test file BEFORE implementation
touch tests/test_authentication.py  # Python
touch __tests__/authentication.test.ts  # TypeScript

# 2. Write failing test that describes desired behavior
# Example test:
```

```python
# tests/test_authentication.py
def test_user_registration_creates_user():
    """Test that user registration creates a new user in database"""
    response = client.post('/api/register', json={
        'email': 'test@example.com',
        'password': 'SecurePassword123!'
    })

    assert response.status_code == 201
    assert 'id' in response.json()
    assert 'token' in response.json()
    # Test MUST fail because endpoint doesn't exist yet
```

```bash
# 3. Run test and CONFIRM it fails
@test-runner run authentication tests  # MUST SEE RED ❌

# 4. Commit the failing test
git add tests/test_authentication.py
git commit -m "test: add failing test for user registration"
```

**✅ TDD STEP 2: GREEN Phase (Minimum Code to Pass)**

```bash
# 1. Write MINIMUM code to make test pass
# Don't add extra features, don't over-engineer
# Just make the test green

# 2. Run test and CONFIRM it passes
@test-runner run authentication tests  # MUST SEE GREEN ✅

# 3. Commit the passing implementation
git add src/routes/authentication.py
git commit -m "feat: add user registration endpoint"
```

**♻️ TDD STEP 3: REFACTOR Phase (Clean Up Code)**

```bash
# 1. Improve code structure
# 2. Remove duplication
# 3. Enhance readability
# 4. Run tests to ensure they STAY GREEN
@test-runner run all tests  # ALL must be GREEN ✅

# 5. Commit the refactored code
git add .
git commit -m "refactor: improve authentication code structure"
```

**🔁 REPEAT TDD Cycle for Each Feature**

For EVERY new function, class, or feature:
1. 🔴 Write failing test FIRST
2. ✅ Write minimum code to pass
3. ♻️ Refactor while keeping tests green

**Integration with Context7:**
```bash
# Query documentation BEFORE implementing
mcp://context7/<framework>/testing-best-practices
mcp://context7/<framework>/authentication-patterns
mcp://context7/<language>/test-frameworks
```

**TDD Commit Pattern (MANDATORY):**
```bash
# For each feature, you MUST have this commit sequence:
git commit -m "test: add failing test for [feature]"      # RED ❌
git commit -m "feat: implement [feature]"                  # GREEN ✅
git commit -m "refactor: improve [feature] structure"      # REFACTOR ♻️
git commit -m "docs: document [feature]"                   # DOCS 📚
```

**❌ PROHIBITED (Will be rejected):**
```bash
# DON'T do this:
git commit -m "feat: add feature without tests"  # ❌ NO TESTS
git commit -m "WIP: partial implementation"      # ❌ PARTIAL CODE
git commit -m "TODO: add tests later"            # ❌ DELAYED TESTING
```

**Commit Message Format:**
- `test:` - Test additions/changes (ALWAYS FIRST)
- `feat:` - New feature (AFTER test passes)
- `refactor:` - Code refactoring (AFTER test stays green)
- `fix:` - Bug fix (AFTER failing test reproduces bug)
- `docs:` - Documentation
- `perf:` - Performance improvements
- `chore:` - Maintenance tasks

#### 4. Verify Acceptance Criteria

**Before Creating PR:**

Check against task's **Acceptance Criteria:**
```markdown
Example Acceptance Criteria:
- [ ] User can register with email and password
- [ ] Password is hashed and stored securely
- [ ] Registration sends confirmation email
- [ ] User receives JWT token after successful registration
- [ ] All tests pass (unit, integration, e2e)
- [ ] API documentation is updated
```

**Run Quality Checks:**
```bash
# Run tests
npm test          # JavaScript/TypeScript
pytest            # Python
go test ./...     # Go

# Run linters
npm run lint      # JavaScript/TypeScript
ruff check        # Python
golangci-lint run # Go

# Check type safety
npm run typecheck # TypeScript
mypy src/         # Python

# Run formatters
npm run format    # JavaScript/TypeScript
black .           # Python
go fmt ./...      # Go
```

#### 5. Create Pull Request

```bash
# Push branch to remote
git push origin feature/TASK-ID-short-description

# Create PR using GitHub CLI
gh pr create \
  --title "Feature: TASK-ID Short Description" \
  --body "$(cat <<'EOF'
## Summary
Brief description of changes

## Related Issue
Closes #TASK-ID

## Acceptance Criteria
- [x] Criterion 1
- [x] Criterion 2
- [x] Criterion 3

## Definition of Done
- [x] Code implemented and tested
- [x] All tests passing
- [x] Documentation updated
- [x] No breaking changes (or documented)
- [x] Security considerations addressed

## Test Plan
1. Unit tests: `npm test`
2. Integration tests: `npm run test:integration`
3. Manual testing: [steps performed]

## Screenshots/Evidence
[If applicable]

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

**PR Title Format:**
- `Feature: TASK-ID Short description`
- `Bugfix: TASK-ID Short description`
- `Improvement: TASK-ID Short description`

#### 6. Monitor and Address PR Feedback

**Check PR Status:**
```bash
# View PR status
gh pr view --web

# Check for CI/CD failures
gh pr checks

# View PR comments
gh pr view
```

**If CI/CD Fails:**
```bash
# Analyze failures
@test-runner analyze failed tests
@code-analyzer review changes for issues

# Fix issues
git add .
git commit -m "fix: address CI failures"
git push origin feature/TASK-ID-short-description
```

**If Merge Conflicts:**
```bash
# Update branch with latest main
git checkout main
git pull origin main
git checkout feature/TASK-ID-short-description
git merge main

# Resolve conflicts (use specialized agents)
@code-analyzer help resolve merge conflicts in <file>

# After resolving
git add .
git commit -m "chore: resolve merge conflicts with main"
git push origin feature/TASK-ID-short-description
```

**Address Review Comments:**
```bash
# Interpret reviewer feedback
# Make requested changes
git add .
git commit -m "refactor: address PR feedback - improve error handling"
git push origin feature/TASK-ID-short-description

# Respond to comments on GitHub
gh pr comment <PR-NUMBER> --body "Fixed as requested"
```

#### 7. Merge Pull Request

**Pre-merge Checklist:**
- [ ] All CI/CD checks passing
- [ ] No merge conflicts
- [ ] All review comments addressed
- [ ] At least one approval (if required)
- [ ] Definition of Done satisfied
- [ ] Documentation updated

**Merge:**
```bash
# Merge PR (using GitHub CLI)
gh pr merge --squash --delete-branch

# Or via web interface
# Click "Squash and merge" button
# Delete branch after merge
```

#### 8. Mark Task Complete

**Update Task Status:**
```bash
# GitHub Issues
gh issue close TASK-ID --comment "Completed in PR #PR-NUMBER"

# Azure DevOps
/azure:update-work-item TASK-ID --state=Closed

# Jira (via MCP)
mcp://jira/update TASK-ID status:Done
```

**Update Task Labels:**
- Remove: `in-progress`, `ready`
- Add: `completed`, `merged`

**Verify Deployment:**
```bash
# Check if changes are deployed
# (depends on your CD pipeline)
git checkout main
git pull origin main
git log --oneline -5  # Verify your commit is in main
```

#### 9. Move to Next Task

```bash
# Clean up local branches
git branch -d feature/TASK-ID-short-description

# Return to main
git checkout main
git pull origin main

# Pick next task and repeat workflow
/pm:backlog
gh issue list --label="ready"
```

### 🎨 Workflow Variations

#### Hotfix Workflow (Production Bugs)

```bash
# Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/ISSUE-ID-critical-bug

# Implement fix
# ...

# Create PR with HIGH PRIORITY label
gh pr create --label="priority:high,type:hotfix"

# After merge, ensure it's deployed immediately
# Follow your emergency deployment process
```

#### Feature Flag Workflow

```bash
# For large features, use feature flags
# Implement behind flag
# Deploy to production (flag disabled)
# Test in production environment
# Gradually enable for users

# Example:
if (featureFlags.newAuthentication) {
  // New implementation
} else {
  // Existing implementation
}
```

### 📊 Definition of Done (Standard)

Every task is **complete** when:

- [ ] **Code Complete**
  - All Acceptance Criteria met
  - Code follows project conventions
  - No TODOs or FIXMEs left unresolved

- [ ] **Tests Pass**
  - All unit tests passing
  - All integration tests passing
  - All e2e tests passing (if applicable)
  - Code coverage meets threshold

- [ ] **Quality Checks**
  - Linters pass (no warnings)
  - Formatters applied
  - Type checking passes
  - Security scan passes

- [ ] **Documentation**
  - Code comments added (why, not what)
  - API documentation updated
  - README updated (if needed)
  - CHANGELOG updated (if applicable)

- [ ] **Review Complete**
  - PR created and approved
  - All comments addressed
  - No merge conflicts
  - CI/CD pipeline green

- [ ] **Deployed**
  - Changes merged to main
  - Deployed to target environment
  - Verified in production/staging

- [ ] **Task Closed**
  - Issue/ticket closed
  - Status updated to "completed"
  - Labels updated

### 🔍 Common Acceptance Criteria Patterns

#### For Features
```markdown
## Acceptance Criteria
- [ ] User can [action] with [constraints]
- [ ] System responds with [expected output]
- [ ] Error handling for [edge case]
- [ ] Performance: [metric] under [threshold]
- [ ] Security: [requirement] implemented
- [ ] Accessibility: [WCAG level] compliance
```

#### For Bug Fixes
```markdown
## Acceptance Criteria
- [ ] Bug no longer reproducible
- [ ] Root cause identified and documented
- [ ] Regression test added
- [ ] Related bugs checked (not introduced)
- [ ] Error logging improved
```

#### For Improvements
```markdown
## Acceptance Criteria
- [ ] Performance improved by [X%]
- [ ] Code complexity reduced
- [ ] Technical debt addressed
- [ ] Backward compatibility maintained
- [ ] Migration path documented (if breaking)
```

### 🛠️ Using Specialized Agents in Workflow

#### Throughout Workflow:
```bash
# Code Analysis
@code-analyzer review my changes for potential issues
@code-analyzer trace logic flow in authentication module

# Testing
@test-runner execute test suite and analyze failures
@test-runner run only authentication-related tests

# File Analysis
@file-analyzer summarize large log file
@file-analyzer extract errors from CI output

# Documentation
@agent-manager document this workflow pattern

# Multi-stream Work (Advanced)
@parallel-worker coordinate feature implementation across services
```

### ⚠️ Important Reminders

**🚨 HIGHEST PRIORITY:**

1. **FOLLOW TDD CYCLE (RED-GREEN-REFACTOR)** - This is MANDATORY, not optional
   - 🔴 Write failing test FIRST (ALWAYS!)
   - ✅ Write minimum code to pass (no more, no less)
   - ♻️ Refactor while keeping tests green (never skip)
   - See `.claude/rules/tdd.enforcement.md` for enforcement rules
   - **ZERO TOLERANCE**: No code without tests. No exceptions.

**📋 Critical Workflow Rules:**

2. **ALWAYS query Context7** before implementing:
   ```bash
   mcp://context7/<framework>/<topic>
   ```

3. **NEVER commit code before tests**:
   - First commit: `test: add failing test`
   - Second commit: `feat: implement feature`
   - Third commit: `refactor: improve structure`

4. **ALWAYS use specialized agents** for non-trivial tasks

5. **NEVER commit to main** - always work in branches

6. **ALWAYS address PR feedback** - don't merge until resolved

7. **REMEMBER Definition of Done** - not complete until all criteria met

8. **VERIFY in production** - deployment is part of completion

**❌ PROHIBITED PATTERNS (Auto-Reject):**
- Writing code before tests
- Committing "WIP" or "TODO: add tests"
- Partial implementations without test coverage
- Skipping refactor phase
- Mock services in tests (use real implementations)

### 📚 Additional Resources

- `.claude/rules/development-workflow.md` - Complete development patterns
- `.claude/rules/git-strategy.md` - Git branch and merge strategies
- `.claude/rules/tdd.enforcement.md` - Test-Driven Development requirements
- `.claude/rules/github-operations.md` - GitHub CLI and PR management
- `.claude/commands/pm/` - Project management command reference

### 🎯 Quick Reference Commands

```bash
# Start task
/pm:backlog                    # View tasks
git checkout -b feature/ID-desc

# During work
@<agent> <task>               # Use specialized agents
mcp://context7/<lib>/<topic>  # Query documentation
git commit -m "type: message"

# Before PR
npm test                      # Run tests
npm run lint                  # Run linters
git push origin <branch>

# Create PR
gh pr create

# After feedback
git merge main                # Update branch
git push origin <branch>

# Merge and complete
gh pr merge --squash --delete-branch
gh issue close ID
git checkout main && git pull

# Next task
/pm:backlog
```
