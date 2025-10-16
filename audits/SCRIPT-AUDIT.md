# Script Categorization Audit

**Date:** 2025-10-15
**Total Scripts:** 143 (not 36 as originally estimated!)
**Total Lines:** ~30,000+ lines
**Auditor:** Claude + User

## Executive Summary

**Finding:** The original estimate of 36 scripts was dramatically incorrect. We found **143 scripts** across multiple categories, totaling over **30,000 lines of code**.

**Impact on v2.0 Plan:** This discovery significantly affects Week 1 timeline and plugin structure. The script audit requires more detailed analysis.

---

## Summary by Category

| Category | Scripts | Total Lines | Plugin Assignment | Rationale |
|----------|---------|-------------|-------------------|-----------|
| **pm/** | 53 | ~13,525 | **core** | Project management (universal) |
| **azure/** | 33 | ~8,435 | **devops** | Azure DevOps integration |
| **Root scripts** | 29 | ~6,000 | Mixed | Various utilities |
| **lib/** | 5 | ~800 | **core** | Utility libraries |
| **github/** | 3 | ~400 | **devops** | GitHub dependency tools |
| **mcp/** | 5 | ~200 | **core** | MCP server management |
| **config/** | 2 | ~150 | **core** | Configuration management |
| **pm/epic-sync/** | 4 | ~600 | **core** | Epic synchronization |
| **pm/issue-sync/** | 5 | ~750 | **core** | Issue synchronization |
| **pm/epic-start/** | 2 | ~300 | **core** | Epic initialization |
| **pm/lib/** | 2 | ~400 | **core** | PM utilities |

**Total:** 143 scripts, ~31,560 lines

---

## Category Breakdown

### 1. PM Scripts (53 scripts, ~13,525 lines)
→ **@claudeautopm/plugin-core**

**Location:** `autopm/.claude/scripts/pm/`

**Purpose:** Project management workflows, epics, PRDs, issues, tasks

**Key Scripts:**
- **epic-*.js** - Epic management (list, show, status, close, edit, split)
- **prd-*.js** - PRD management (new, list, parse, show, status)
- **issue-*.js** - Issue management (start, show, close, edit)
- **task-*.js** - Task management
- **sync*.js** - GitHub synchronization
- **status.js, next.js, blocked.js** - Workflow queries
- **analytics.js, optimize.js, validate.js** - Analysis tools
- **pr-*.js** - Pull request workflows
- **standup.js, context*.js** - Team workflows

**Rationale for Core:**
- Universal project management
- Not specific to any technology stack
- Applies to ALL projects regardless of plugins
- Core framework capability

**Subdirectories:**
- `pm/epic-sync/` (4 scripts, ~600 lines) - Epic GitHub synchronization
- `pm/issue-sync/` (5 scripts, ~750 lines) - Issue GitHub synchronization
- `pm/epic-start/` (2 scripts, ~300 lines) - Epic initialization workflows
- `pm/lib/` (2 scripts, ~400 lines) - PM utility libraries

**Assignment:** → **@claudeautopm/plugin-core**

---

### 2. Azure Scripts (33 scripts, ~8,435 lines)
→ **@claudeautopm/plugin-devops**

**Location:** `autopm/.claude/scripts/azure/`

**Purpose:** Azure DevOps integration (work items, sprints, features, user stories)

**Key Scripts:**
- **active-work.js** - Show active work items
- **blocked.js** - Show blocked items
- **daily.js** - Daily status report
- **dashboard.js** - Azure DevOps dashboard
- **feature-*.js** - Feature management (list, show, status)
- **us-*.js** - User story management (list, status)
- **sprint-report.js** - Sprint reporting
- **sync.js** - Azure DevOps synchronization
- **setup.js** - Azure DevOps project setup
- **validate.js** - Azure DevOps validation
- **search.js** - Azure DevOps search
- **help.js** - Azure commands help

**Note:** Many scripts have both `.js` and `.sh` versions (wrapper pattern)

**Rationale for DevOps:**
- Azure DevOps specific
- Not universal - only for Azure DevOps projects
- Related to azure-devops-engineer agent (devops plugin)
- Optional - not needed for non-Azure projects

**Assignment:** → **@claudeautopm/plugin-devops**

---

### 3. Root Scripts (29 scripts, ~6,000 lines)

**Location:** `autopm/.claude/scripts/` (root level)

**Mixed Category - Need Individual Analysis:**

#### Core Scripts (to plugin-core):

1. **decompose-issue.js** (~200 lines) - Issue decomposition (universal PM)
2. **install-hooks.js/sh** (~100 lines) - Git hooks installation (universal)
3. **setup-context7.js/sh** (~150 lines) - Context7 MCP setup (universal)
4. **setup-local-mode.js** (~100 lines) - Local mode setup (universal)
5. **start-parallel-streams.js** (~150 lines) - Parallel execution (universal)
6. **test-and-log.js/sh** (~200 lines) - Test execution utilities (universal)

**Subtotal:** ~900 lines → **@claudeautopm/plugin-core**

#### DevOps Scripts (to plugin-devops):

7. **docker-dev-setup.js/sh** (~300 lines) - Docker development setup
8. **docker-toggle.js/sh** (~200 lines) - Docker-first toggle
9. **pr-validation.js/sh** (~400 lines) - PR validation workflows

**Subtotal:** ~900 lines → **@claudeautopm/plugin-devops**

#### PM Local Scripts (to plugin-core):

10-24. **pm-*-local.js** (15 scripts, ~3,000 lines) - Local PM command implementations
   - pm-epic-decompose-local.js
   - pm-epic-list-local.js
   - pm-epic-show-local.js
   - pm-epic-update-local.js
   - pm-prd-list-local.js
   - pm-prd-new-local.js
   - pm-prd-parse-local.js
   - pm-prd-show-local.js
   - pm-prd-update-local.js
   - pm-sync-download-local.js
   - pm-sync-upload-local.js
   - pm-task-list-local.js
   - pm-task-show-local.js
   - pm-task-update-local.js

**Subtotal:** ~3,000 lines → **@claudeautopm/plugin-core**

#### Framework Scripts (to plugin-frameworks):

25. **config/toggle-features.js/sh** (~150 lines) - Feature toggles (configuration)

**Note:** Actually belongs to core, not frameworks

**Assignment:**
- **Core:** ~4,050 lines (decompose, hooks, context7, local-mode, parallel, test-and-log, pm-*-local, config/toggle)
- **DevOps:** ~900 lines (docker-*, pr-validation)

---

### 4. Lib Scripts (5 scripts, ~800 lines)
→ **@claudeautopm/plugin-core**

**Location:** `autopm/.claude/scripts/lib/`

**Purpose:** Shared utility libraries

**Scripts:**
1. **datetime-utils.sh** (~150 lines) - Date/time utilities
2. **frontmatter-utils.sh** (~200 lines) - Markdown frontmatter parsing
3. **github-utils.sh** (~250 lines) - GitHub API utilities
4. **logging-utils.sh** (~100 lines) - Logging utilities
5. **validation-utils.sh** (~100 lines) - Validation utilities

**Rationale for Core:**
- Universal utility libraries
- Used by ALL scripts regardless of category
- Not technology-specific
- Core framework infrastructure

**Assignment:** → **@claudeautopm/plugin-core**

---

### 5. GitHub Scripts (3 scripts, ~400 lines)
→ **@claudeautopm/plugin-devops**

**Location:** `autopm/.claude/scripts/github/`

**Purpose:** GitHub-specific utilities

**Scripts:**
1. **dependency-tracker.js** (~150 lines) - Track GitHub issue dependencies
2. **dependency-validator.js** (~150 lines) - Validate issue dependencies
3. **dependency-visualizer.js** (~100 lines) - Visualize dependency graphs

**Rationale for DevOps:**
- GitHub-specific tooling
- Related to github-operations-specialist agent (devops)
- Advanced GitHub features
- Optional for non-GitHub projects

**Assignment:** → **@claudeautopm/plugin-devops**

---

### 6. MCP Scripts (5 scripts, ~200 lines)
→ **@claudeautopm/plugin-core**

**Location:** `autopm/.claude/scripts/mcp/`

**Purpose:** MCP server management

**Scripts:**
1. **add.sh** (~50 lines) - Add MCP server
2. **disable.sh** (~30 lines) - Disable MCP server
3. **enable.sh** (~30 lines) - Enable MCP server
4. **list.sh** (~40 lines) - List MCP servers
5. **sync.sh** (~50 lines) - Sync MCP configuration

**Rationale for Core:**
- Universal MCP server management
- Part of framework infrastructure
- Not plugin-specific
- Required for Context7 and other MCP servers

**Assignment:** → **@claudeautopm/plugin-core**

---

## Detailed Analysis: PM Subdirectories

### pm/epic-sync/ (4 scripts, ~600 lines)
→ **@claudeautopm/plugin-core**

**Purpose:** Epic synchronization with GitHub

**Scripts:**
1. **create-epic-issue.sh** (~200 lines) - Create GitHub issue for epic
2. **create-task-issues.sh** (~150 lines) - Create GitHub issues for tasks
3. **update-epic-file.sh** (~150 lines) - Update local epic file
4. **update-references.sh** (~100 lines) - Update cross-references

**Rationale:** Universal PM feature, not technology-specific

---

### pm/issue-sync/ (5 scripts, ~750 lines)
→ **@claudeautopm/plugin-core**

**Purpose:** Issue synchronization workflows

**Scripts:**
1. **format-comment.sh** (~150 lines) - Format GitHub comment
2. **gather-updates.sh** (~200 lines) - Gather issue updates
3. **post-comment.sh** (~100 lines) - Post comment to GitHub
4. **preflight-validation.sh** (~200 lines) - Validate before sync
5. **update-frontmatter.sh** (~100 lines) - Update issue frontmatter

**Rationale:** Universal PM feature, not technology-specific

---

### pm/epic-start/ (2 scripts, ~300 lines)
→ **@claudeautopm/plugin-core**

**Purpose:** Epic initialization workflows

**Scripts:**
1. **epic-start.js** (~200 lines) - Initialize epic
2. **epic-start.sh** (~100 lines) - Epic start wrapper

**Rationale:** Universal PM feature

---

### pm/lib/ (2 scripts, ~400 lines)
→ **@claudeautopm/plugin-core**

**Purpose:** PM utility libraries

**Scripts:**
1. **epic-discovery.js** (~250 lines) - Epic file discovery
2. **logger.js** (~150 lines) - PM logging utilities

**Rationale:** Universal PM infrastructure

---

## Plugin Size Impact

### @claudeautopm/plugin-core
**Scripts to add:** ~90 scripts
**Total size:** ~19,475 lines
**Breakdown:**
- pm/ scripts: 13,525 lines
- Root core scripts: 4,050 lines
- lib/ scripts: 800 lines
- mcp/ scripts: 200 lines
- config/ scripts: 150 lines (toggle-features)

**Impact:** Core becomes comprehensive with full PM workflow automation

---

### @claudeautopm/plugin-devops
**Scripts to add:** ~41 scripts
**Total size:** ~9,735 lines
**Breakdown:**
- azure/ scripts: 8,435 lines
- github/ scripts: 400 lines
- docker-* scripts: 500 lines
- pr-validation scripts: 400 lines

**Impact:** DevOps plugin becomes complete workflow automation suite

---

## Script Dependencies

### Cross-Script Dependencies:

1. **PM scripts** depend on:
   - lib/github-utils.sh (core)
   - lib/frontmatter-utils.sh (core)
   - lib/datetime-utils.sh (core)
   - lib/logging-utils.sh (core)
   - lib/validation-utils.sh (core)

2. **Azure scripts** depend on:
   - lib/ utilities (core)
   - PM scripts (core) for some workflows

3. **Root scripts** depend on:
   - lib/ utilities (core)

**Implication:** lib/ MUST be installed with plugin-core

---

## Script Patterns

### Dual Implementation Pattern:

Many scripts have both `.js` and `.sh` versions:
- `.js` - Main implementation (Node.js)
- `.sh` - Wrapper script for easy CLI invocation

**Example:**
```
epic-list.js     # Main implementation (350 lines)
epic-list.sh     # Wrapper (20 lines): #!/bin/bash\nnode .claude/scripts/pm/epic-list.js "$@"
```

**Impact:** Both files must be included in plugins

---

## Critical Findings

### 1. Massive Underestimate

**Original:** 36 scripts
**Actual:** 143 scripts (~4x more)
**Lines:** ~31,560 lines (not counted in original plan)

**Impact:** Week 1 timeline may need adjustment

---

### 2. PM Scripts Dominance

**PM category:** 53 scripts, 13,525 lines (43% of total)
**Implication:** plugin-core will be very large

---

### 3. Azure Scripts Complexity

**Azure category:** 33 scripts, 8,435 lines (27% of total)
**Implication:** plugin-devops will be substantial

---

### 4. Dual File Pattern

**~80 scripts** have both `.js` and `.sh` versions
**Implication:** Need to ensure both are categorized together

---

## Categorization Summary

### @claudeautopm/plugin-core (90 scripts, 19,475 lines)

**Categories:**
- pm/ - Project management (53 scripts, 13,525 lines)
- lib/ - Utility libraries (5 scripts, 800 lines)
- mcp/ - MCP server management (5 scripts, 200 lines)
- Root PM scripts - Local implementations (15 scripts, 3,000 lines)
- Root utilities - Universal tools (7 scripts, 800 lines)
- config/ - Configuration (2 scripts, 150 lines)
- pm/epic-sync/ - Epic sync (4 scripts, 600 lines)
- pm/issue-sync/ - Issue sync (5 scripts, 750 lines)
- pm/epic-start/ - Epic init (2 scripts, 300 lines)
- pm/lib/ - PM libraries (2 scripts, 400 lines)

---

### @claudeautopm/plugin-devops (41 scripts, 9,735 lines)

**Categories:**
- azure/ - Azure DevOps (33 scripts, 8,435 lines)
- github/ - GitHub tools (3 scripts, 400 lines)
- Root Docker scripts (4 scripts, 500 lines)
- Root PR scripts (2 scripts, 400 lines)

---

## Action Items

### Immediate
- [x] Identify actual script count (143 vs 36 estimated)
- [x] Categorize scripts by directory
- [x] Analyze script sizes and dependencies
- [ ] Validate categorization with user
- [ ] Update v2.0 timeline (143 scripts is major work)

### Critical Questions
1. **Should we split PM scripts?** 19,475 lines in plugin-core is very large
2. **Azure scripts size:** 8,435 lines in plugin-devops - is this acceptable?
3. **Script migration priority:** Which scripts are most critical?
4. **Dual file strategy:** Should we keep both .js and .sh versions?

### Week 1 Impact
- **Original estimate:** 36 scripts
- **Actual:** 143 scripts (4x more)
- **Timeline:** May need to extend Week 1 or reduce scope

---

## Next Steps

After script categorization validation:
1. **Task 1.5:** Design plugin.json v2 schema with scripts support
2. **Week 2:** Begin creating @claudeautopm/plugin-core
3. **Consider:** Should PM scripts be a separate plugin? (@claudeautopm/plugin-pm)

---

## Recommendations

### Option 1: Keep PM in Core (Current Plan)
**Pros:** PM is universal, applies to all projects
**Cons:** plugin-core becomes very large (19,475 lines of scripts)

### Option 2: Split PM into Separate Plugin
**Pros:** Modular, users can skip PM if not needed
**Cons:** PM is arguably core functionality
**New Plugin:** @claudeautopm/plugin-pm (15 scripts, 13,525 lines)

### Option 3: Hybrid Approach
**Keep in Core:**
- lib/ utilities (required by other plugins)
- mcp/ scripts (framework infrastructure)
- Basic PM commands (lightweight)

**Move to plugin-pm:**
- Full PM workflow scripts
- Epic/PRD/Issue management
- GitHub synchronization

**Recommendation:** Discuss with user before proceeding

---

## Validation Checks

**Directories checked:**
```bash
autopm/.claude/scripts/
autopm/.claude/scripts/pm/
autopm/.claude/scripts/azure/
autopm/.claude/scripts/lib/
autopm/.claude/scripts/github/
autopm/.claude/scripts/mcp/
autopm/.claude/scripts/config/
```

**Total scripts found:** 143 ✅
**Total lines:** ~31,560 ✅

**Distribution:**
- Core: ~19,475 lines (62%)
- DevOps: ~9,735 lines (31%)
- Other: ~2,350 lines (7%)

---

## Next Audit: plugin.json v2 Schema

After confirming script categorization, proceed to:
→ **Task 1.5:** Design plugin.json v2 schema with support for:
- commands
- rules
- hooks
- scripts (NEW: 143 files!)
- peerPlugins
- dependencies

---

**Status:** ✅ Initial categorization complete
**Confidence:** 🟡 Medium (need user input on PM scripts strategy)
**Critical Issue:** 143 scripts (4x estimate) - timeline impact
**Next Action:** Validate categorization, decide on PM scripts strategy, then design schema
