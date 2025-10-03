# Missing Commands Analysis

## 📋 Summary

Found **33 command references** in documentation that **don't exist** in codebase.

## 🔍 Analysis

### ✅ Commands That Make Sense (Worth Implementing)

#### 1. Context Management (from ccpm original)
- `/pm:context-create` - Initialize project context documentation
- `/pm:context-prime` - Load context for new AI sessions
- `/pm:context-update` - Update context after changes

**Rationale:**
- Original ccpm has this feature
- Helps with AI agent onboarding
- Maintains project memory between sessions
- Already have `/pm:context` (viewer), missing creation/update

**Implementation Priority:** HIGH ⭐⭐⭐

#### 2. Issue Workflow Extensions
- `/pm:issue-test` - Run TDD workflow for a specific issue
- `/pm:parallel-start <issue1> <issue2>...` - Start multiple issues in parallel

**Rationale:**
- TDD enforcement needs testing command
- Parallel work is mentioned in epic-decompose
- Natural extensions of existing issue commands

**Implementation Priority:** MEDIUM ⭐⭐

#### 3. Query/Search Enhancement
- `/pm:query` - Advanced query across epics/issues (maybe alias for `/pm:search`)

**Rationale:**
- Could be useful for complex searches
- Might be redundant with `/pm:search`

**Implementation Priority:** LOW ⭐

---

### ❌ Commands That DON'T Make Sense (Remove References)

#### Azure DevOps Specific (Not Implemented)
- `/pm:azure-next` ❌
- `/pm:azure-sync` ❌

**Reason:** Project focuses on GitHub. Azure support was planned but not implemented.

#### Vague/Unclear Purpose
- `/pm:board` ❌ - Unclear what this would do
- `/pm:build` ❌ - Not PM responsibility
- `/pm:done` ❌ - Duplicate of `/pm:issue-close`
- `/pm:epic` ❌ - Too vague, what would it do?
- `/pm:epic-new` ❌ - Use `/pm:prd-new` + `/pm:prd-parse` instead
- `/pm:epic-resolve` ❌ - Use `/pm:epic-close`
- `/pm:epic-stop` ❌ - What would this do?
- `/pm:issue` ❌ - Too vague
- `/pm:next-task` ❌ - Duplicate of `/pm:next`
- `/pm:prd` ❌ - Too vague
- `/pm:prd-split` ❌ - Use `/pm:epic-split` after parse
- `/pm:sprint` ❌ - No sprint management implemented
- `/pm:sprint-status` ❌ - No sprint management implemented
- `/pm:sync-all` ❌ - What would sync? Already have `/pm:sync`
- `/pm:test` ❌ - Not PM responsibility
- `/pm:todo` ❌ - Not PM responsibility
- `/pm:wip` ❌ - Unclear purpose

#### Features Not Implemented
- `/pm:optimize` ❌ - Was this for epic optimization? Unclear
- `/pm:pr` ❌ - PR management not in scope
- `/pm:pr-create` ❌ - PR management not in scope
- `/pm:pr-list` ❌ - PR management not in scope
- `/pm:release` ❌ - Release management not implemented
- `/pm:report` ❌ - Reporting not implemented
- `/pm:resource` ❌ - Resource management not implemented
- `/pm:resource-action` ❌ - Resource management not implemented

#### Config System (Partially Makes Sense)
- `/pm:config` ❌ - Could be useful but not implemented

---

## 📊 Recommendations

### 1. Implement High-Priority Commands

**Context Management Suite:**
```bash
/pm:context-create    # Initialize .claude/context/ with templates
/pm:context-prime     # Load context for session
/pm:context-update    # Update after changes
```

**Implementation:**
- Create `.claude/context/` directory structure
- Templates for: project-brief, tech-context, progress, etc.
- Script to load context into session

### 2. Remove Invalid References

Clean up documentation by removing references to these **26 commands**:

```
azure-next, azure-sync, board, build, done, epic, epic-new,
epic-resolve, epic-stop, issue, next-task, optimize, pr,
pr-create, pr-list, prd, prd-split, query, release, report,
resource, resource-action, sprint, sprint-status, sync-all,
test, todo, wip
```

### 3. Optional: Add Convenience Commands

Consider adding:
- `/pm:issue-test <number>` - TDD workflow for issue
- `/pm:parallel-start <numbers>` - Start multiple issues

---

## 🔧 Action Plan

### Phase 1: Clean Documentation (IMMEDIATE)
1. Find all files with invalid command references
2. Remove or replace with correct commands:
   - `/pm:epic-new` → `/pm:prd-new` + `/pm:prd-parse`
   - `/pm:next-task` → `/pm:next`
   - `/pm:done` → `/pm:issue-close`
   - etc.

### Phase 2: Implement Context System (HIGH PRIORITY)
1. Create context management structure
2. Implement `/pm:context-create`
3. Implement `/pm:context-prime`
4. Implement `/pm:context-update`
5. Update documentation

### Phase 3: Consider Extensions (LOW PRIORITY)
1. Evaluate need for `/pm:issue-test`
2. Evaluate need for `/pm:parallel-start`
3. Implement if validated by users

---

## 📝 Files Needing Updates

### Primary Locations
- `docs-site/docs/guide/interactive-setup.md` - References `/pm:epic-new`
- `docs-site/docs/commands/overview.md` - References `/pm:epic-new`
- Other documentation files (TBD - need full scan)

### Replacement Guide

| ❌ Invalid Command | ✅ Correct Alternative |
|-------------------|----------------------|
| `/pm:epic-new` | `/pm:prd-new` then `/pm:prd-parse` |
| `/pm:azure-next` | `/pm:next` (GitHub only) |
| `/pm:azure-sync` | `/pm:epic-sync` (GitHub only) |
| `/pm:done` | `/pm:issue-close` |
| `/pm:next-task` | `/pm:next` |
| `/pm:epic-resolve` | `/pm:epic-close` |
| `/pm:prd-split` | `/pm:epic-split` (after parse) |

---

## 🎯 Decision Matrix

| Command | Exists? | Makes Sense? | Action |
|---------|---------|--------------|--------|
| context-create | ❌ | ✅ Yes | **Implement** |
| context-prime | ❌ | ✅ Yes | **Implement** |
| context-update | ❌ | ✅ Yes | **Implement** |
| issue-test | ❌ | ⚠️ Maybe | Consider |
| parallel-start | ❌ | ⚠️ Maybe | Consider |
| epic-new | ❌ | ❌ No | **Remove refs** |
| azure-* | ❌ | ❌ No | **Remove refs** |
| build | ❌ | ❌ No | **Remove refs** |
| done | ❌ | ❌ No | **Remove refs** |
| (22 others) | ❌ | ❌ No | **Remove refs** |

---

**Next Step:** Should I:
1. Clean up all invalid command references first?
2. Implement context management system?
3. Both in parallel?
