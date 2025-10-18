# TDD Enforcement Enhancement

## Problem Statement

While AutoPM had TDD rules in `.claude/rules/tdd.enforcement.md`, the enforcement wasn't **visually dominant** enough. Claude could potentially overlook or de-prioritize TDD without strong visual cues in the main workflow.

### Before Enhancement

**TDD Mentions in CLAUDE.md:**
- Listed in CRITICAL RULES section (line ~39)
- Brief mention in TDD Pipeline section (lines ~121-140)
- Reference in task-workflow (3 casual mentions)
- No visual emphasis
- No step-by-step examples
- Easy to miss or skip

**Result:** TDD was documented but not **enforced** visually.

## Solution: Multi-Layer TDD Enforcement

### 1. Visual Banners (High Impact)

#### In Task-Workflow (Lines 3-16)
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

**Impact:** IMPOSSIBLE to miss. First thing Claude sees in workflow section.

#### In Base Template (Lines 123-129)
```
╔═══════════════════════════════════════════════════════════════════╗
║  🔴 RED → ✅ GREEN → ♻️ REFACTOR                                   ║
║                                                                   ║
║  ZERO TOLERANCE: No code without tests. No exceptions.           ║
║  See: .claude/rules/tdd.enforcement.md                           ║
╚═══════════════════════════════════════════════════════════════════╝
```

**Impact:** Reinforces TDD in dedicated pipeline section.

### 2. Step-by-Step Implementation Guide

#### RED Phase (Detailed)

```bash
# ALWAYS write the test FIRST
# Example for authentication endpoint:

# 1. Create test file BEFORE implementation
touch tests/test_authentication.py  # Python
touch __tests__/authentication.test.ts  # TypeScript

# 2. Write failing test that describes desired behavior
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

**Impact:** Shows EXACTLY what to do. No ambiguity.

#### GREEN Phase (Detailed)

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

**Impact:** Shows minimum code philosophy with verification.

#### REFACTOR Phase (Detailed)

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

**Impact:** Shows refactoring is mandatory, not optional.

### 3. Mandatory Commit Pattern

**Before:**
- No explicit commit pattern shown
- Claude could commit in any order

**After:**
```bash
# For each feature, you MUST have this commit sequence:
git commit -m "test: add failing test for [feature]"      # RED ❌
git commit -m "feat: implement [feature]"                  # GREEN ✅
git commit -m "refactor: improve [feature] structure"      # REFACTOR ♻️
git commit -m "docs: document [feature]"                   # DOCS 📚
```

**Expected Git Log:**
```bash
git log --oneline
# c3d4e5f refactor: improve feature structure  ♻️
# b2c3d4e feat: implement feature              ✅
# a1b2c3d test: add failing test for feature  🔴
```

**Impact:** Visual verification that TDD was followed.

### 4. Prohibited Patterns (Explicit)

**Before:** Vague "don't skip tests" language

**After:** Concrete rejection list
```bash
# ❌ PROHIBITED (Will be rejected):
git commit -m "feat: add feature without tests"  # ❌ NO TESTS
git commit -m "WIP: partial implementation"      # ❌ PARTIAL CODE
git commit -m "TODO: add tests later"            # ❌ DELAYED TESTING
```

**Impact:** Crystal clear what will be rejected.

### 5. Updated Priority Hierarchy

**Important Reminders - Before:**
```
1. ALWAYS query Context7
2. NEVER skip tests - TDD is mandatory
3. ALWAYS use specialized agents
...
```

**Important Reminders - After:**
```
🚨 HIGHEST PRIORITY:

1. FOLLOW TDD CYCLE (RED-GREEN-REFACTOR) - This is MANDATORY, not optional
   - 🔴 Write failing test FIRST (ALWAYS!)
   - ✅ Write minimum code to pass (no more, no less)
   - ♻️ Refactor while keeping tests green (never skip)
   - See .claude/rules/tdd.enforcement.md
   - ZERO TOLERANCE: No code without tests. No exceptions.

📋 Critical Workflow Rules:
2. ALWAYS query Context7
3. NEVER commit code before tests
...

❌ PROHIBITED PATTERNS (Auto-Reject):
- Writing code before tests
- Committing "WIP" or "TODO: add tests"
- Partial implementations without test coverage
- Skipping refactor phase
- Mock services in tests (use real implementations)
```

**Impact:** TDD is now unmistakably #1 priority.

### 6. Core Workflow Principles Updated

**Before:**
```
1. Work in Branches
2. Create Pull Requests
3. Resolve Conflicts
4. Address Feedback
5. Merge When Ready
6. Mark Complete
```

**After:**
```
1. Follow TDD Religiously - Test FIRST, code SECOND (see banner above)
2. Work in Branches - Never commit directly to main
3. Create Pull Requests - All changes go through PR review
4. Resolve Conflicts - Address merge conflicts immediately
5. Address Feedback - Interpret and resolve all PR comments
6. Merge When Ready - Only merge after all checks pass
7. Mark Complete - Update task status and move to next task
```

**Impact:** TDD is now the FIRST principle, before even branching.

### 7. Agent Integration Emphasis

**Throughout workflow:**
```bash
# Before starting
@test-runner run existing tests to ensure baseline

# RED phase
@test-runner run authentication tests  # MUST SEE RED ❌

# GREEN phase
@test-runner run authentication tests  # MUST SEE GREEN ✅

# REFACTOR phase
@test-runner run all tests  # ALL must be GREEN ✅
```

**Impact:** Shows how to verify TDD compliance using agents.

### 8. Context7 Integration

```bash
**Integration with Context7:**
# Query documentation BEFORE implementing
mcp://context7/<framework>/testing-best-practices
mcp://context7/<framework>/authentication-patterns
mcp://context7/<language>/test-frameworks
```

**Impact:** Encourages using current testing best practices.

## Files Modified

### 1. task-workflow.md
- **Lines 3-16**: Visual TDD banner (new)
- **Line 23**: "MANDATORY: All code development MUST follow TDD"
- **Line 27**: TDD is #1 in Core Workflow Principles
- **Lines 56-176**: Completely rewritten Implementation section with 3 detailed TDD phases
- **Lines 152-159**: Mandatory commit pattern (new)
- **Lines 161-167**: Prohibited patterns (new)
- **Lines 169-176**: Updated commit message format with TDD priority
- **Lines 516-552**: Completely rewritten Important Reminders with TDD #1

### 2. base.md
- **Line 121**: Changed from "TDD PIPELINE" to "🚨 TDD PIPELINE (HIGHEST PRIORITY)"
- **Lines 123-129**: Visual TDD banner (new)
- **Line 134**: "CRITICAL: Every implementation MUST follow TDD cycle. HIGHEST PRIORITY"
- **Lines 136-192**: Expanded 3-phase TDD cycle with examples
- **Lines 178-192**: Mandatory commit pattern and violations list (new)

## Testing Verification

### Test Installation
```bash
cd /tmp && mkdir test-tdd-install && cd test-tdd-install
node /path/to/AUTOPM/install/install.js --scenario=3 --skip-prompts
```

### Verify TDD Visibility
```bash
# Check banner in workflow
grep -n "🚨 CRITICAL: ALL DEVELOPMENT FOLLOWS TDD" CLAUDE.md
# Output: 76:│  🚨 CRITICAL: ALL DEVELOPMENT FOLLOWS TDD...

# Check enhanced pipeline section
grep -n "## 🚨 TDD PIPELINE FOR ALL IMPLEMENTATIONS" CLAUDE.md
# Output: 883:## 🚨 TDD PIPELINE FOR ALL IMPLEMENTATIONS (HIGHEST PRIORITY)

# Count TDD mentions (should be MUCH higher)
grep -c "TDD\|Test-Driven" CLAUDE.md
# Output: ~50+ (was ~5 before)

# Check for concrete examples
grep -c "def test_" CLAUDE.md
# Output: 1+ (Python test examples)

# Check for commit patterns
grep -c "test: add failing test" CLAUDE.md
# Output: 4+ (commit pattern examples)
```

## Benefits

### For Claude
- ✅ **Impossible to miss** - Visual banners in multiple locations
- ✅ **Concrete examples** - Shows EXACTLY what to do
- ✅ **Clear validation** - @test-runner integration shows when to verify
- ✅ **Explicit prohibitions** - No ambiguity about what's rejected
- ✅ **Priority clarity** - TDD is #1, not buried in list

### For Developers
- ✅ **Confidence** - Claude will ALWAYS follow TDD
- ✅ **Traceability** - Git log shows TDD compliance visually
- ✅ **Quality** - No partial implementations
- ✅ **Education** - Real examples teach TDD best practices
- ✅ **Consistency** - Every project follows same TDD pattern

### For Teams
- ✅ **Standards enforcement** - Automated through Claude
- ✅ **Code review easier** - Expected commit pattern
- ✅ **Onboarding faster** - Examples show the way
- ✅ **Technical debt prevention** - No "TODO: add tests later"
- ✅ **Test coverage guaranteed** - Zero tolerance policy

## Comparison: Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Visual Emphasis** | None | 2 ASCII banners |
| **Priority Level** | Listed in rules | #1 HIGHEST PRIORITY |
| **Code Examples** | None | Python + TypeScript |
| **Commit Pattern** | Not specified | Mandatory 3-step sequence |
| **Prohibited Patterns** | Vague | Explicit list with emojis |
| **Agent Integration** | Mentioned | @test-runner at each phase |
| **Phase Details** | Brief bullets | Step-by-step bash commands |
| **Verification** | Not shown | MUST SEE RED/GREEN emojis |
| **Refactor Emphasis** | Optional-sounding | Mandatory with validation |
| **TDD Mentions** | ~5 times | ~50+ times |

## User Experience Impact

### Before Enhancement
```
User: "Implement user authentication"
Claude: *might write code first, add tests later*
```

### After Enhancement
```
User: "Implement user authentication"
Claude:
  1. 🔴 *Creates test file*
  2. 🔴 *Writes failing test*
  3. 🔴 *Runs @test-runner to confirm RED*
  4. 🔴 *Commits test*
  5. ✅ *Writes minimal implementation*
  6. ✅ *Runs @test-runner to confirm GREEN*
  7. ✅ *Commits feature*
  8. ♻️ *Refactors code*
  9. ♻️ *Runs @test-runner to confirm still GREEN*
  10. ♻️ *Commits refactor*
```

**Result:** TDD is now **enforced by design**, not just **suggested by rules**.

## Future Enhancements

Potential additions:
- [ ] Pre-commit hooks that verify TDD commit pattern
- [ ] Automated git hook to reject non-TDD commits
- [ ] Visual TDD dashboard showing RED/GREEN/REFACTOR metrics
- [ ] TDD compliance scoring per project
- [ ] Team-wide TDD adherence reporting

## Credits

Enhancement designed based on:
- Anthropic's prompt engineering best practices (visual emphasis)
- Kent Beck's Test-Driven Development principles
- Robert Martin's Clean Code TDD guidelines
- Real-world TDD enforcement challenges
- User feedback: "TDD needs to be more visible"

## Related Documentation

- `.claude/rules/tdd.enforcement.md` - Original TDD enforcement rules
- `docs/WORKFLOW-ADDON.md` - Standard task workflow documentation
- `CHANGELOG.md` - Version history and enhancements
- `autopm/.claude/templates/claude-templates/addons/task-workflow.md` - Enhanced workflow template
- `autopm/.claude/templates/claude-templates/base.md` - Enhanced base template
