# Command Reference Analysis Report

## Analysis Date: 2025-09-27

This report identifies commands referenced in documentation files (*.md) and checks their implementation status.

## Summary

- **Total unique commands referenced**: 100+
- **Commands with implementations**: Multiple formats exist (scripts, command definitions, modular scripts)
- **Missing implementations identified**: See sections below

## Command Implementation Locations

Commands can be implemented in several locations:
1. `/autopm/.claude/scripts/pm/*.js` - Node.js implementations
2. `/autopm/.claude/scripts/pm/*.sh` - Bash implementations (legacy)
3. `/autopm/.claude/commands/**/*.md` - Command definitions for Claude Code
4. `/autopm/.claude/scripts/pm/{command}/` - Modular implementations (for complex commands)

## MISSING COMMAND IMPLEMENTATIONS

### Critical Missing Commands (Referenced in README/Main Docs)

| Command | Referenced In | Line | Implementation Status |
|---------|--------------|------|---------------------|
| `/pm:prd-parse` | README.md | 131 | ❌ MISSING - Has definition in commands/pm/, no script |
| `/pm:epic-decompose` | README.md | 134 | ✅ EXISTS - Has definition in commands/pm/epic-decompose.md |
| `/pm:epic-sync` | README.md | 137 | ✅ EXISTS - Has modular scripts in epic-sync/ |
| `/pm:epic-oneshot` | README.md | 147 | ✅ EXISTS - Has definition in commands/pm/epic-oneshot.md |
| `/pm:issue-sync` | README.md | 156 | ✅ EXISTS - Has modular scripts in issue-sync/ |
| `/pm:issue-analyze` | MISSING_COMMANDS.md | 35 | ✅ EXISTS - Has definition in commands/pm/issue-analyze.md |
| `/pm:issue-reopen` | MISSING_COMMANDS.md | 38 | ✅ EXISTS - Has definition in commands/pm/issue-reopen.md |
| `/pm:issue-status` | MISSING_COMMANDS.md | 41 | ✅ EXISTS - Has definition in commands/pm/issue-status.md |
| `/pm:prd-edit` | MISSING_COMMANDS.md | 44 | ✅ EXISTS - Has definition in commands/pm/prd-edit.md |
| `/pm:epic-merge` | MISSING_COMMANDS.md | 28 | ✅ EXISTS - Has definition in commands/pm/epic-merge.md |
| `/pm:epic-refresh` | MISSING_COMMANDS.md | 30 | ✅ EXISTS - Has definition in commands/pm/epic-refresh.md |
| `/pm:import` | MISSING_COMMANDS.md | 51 | ✅ EXISTS - Has definition in commands/pm/import.md |
| `/pm:test-reference-update` | MISSING_COMMANDS.md | 53 | ✅ EXISTS - Has definition in commands/pm/test-reference-update.md |

### Commands with Script but No Command Definition

| Command | Script Location | Command Definition |
|---------|----------------|-------------------|
| `blocked` | blocked.js | ✅ EXISTS |
| `clean` | clean.js | ✅ EXISTS |
| `context-create` | context-create.js | ❌ MISSING (has context/create.md) |
| `context-prime` | context-prime.js | ❌ MISSING (has context/prime.md) |
| `context-update` | context-update.js | ❌ MISSING (has context/update.md) |

### Commands Referenced in Docs with New Format

The documentation mentions a new format `/pm:resource:action` but most commands still use `/pm:resource-action`:

| New Format | Old Format | Status |
|------------|------------|--------|
| `/pm:issue:list` | `/pm:issue-list` | ❌ Script doesn't exist for either |
| `/pm:issue:show` | `/pm:issue-show` | ✅ issue-show.js exists |
| `/pm:issue:start` | `/pm:issue-start` | ✅ issue-start.js exists |
| `/pm:issue:close` | `/pm:issue-close` | ✅ issue-close.js exists |
| `/pm:pr:create` | `/pm:pr-create` | ❌ No implementation found |
| `/pm:pr:list` | `/pm:pr-list` | ❌ No implementation found |
| `/pm:board:show` | `/pm:board-show` | ❌ No implementation found |
| `/pm:sprint:status` | `/pm:sprint-status` | ❌ No implementation found |

### Azure-Specific Commands (Referenced but Missing)

| Command | Referenced In | Status |
|---------|--------------|--------|
| `/pm:azure-sync` | CHANGELOG.md:80 | ❌ MISSING |
| `/pm:azure-next` | CHANGELOG.md:80 | ❌ MISSING |

### Commands in CLI Mode (Not Slash Commands)

| Command | Referenced In | Status |
|---------|--------------|--------|
| `pm validate` | CLAUDE.md:135 | ✅ validate.js exists |
| `pm optimize` | CLAUDE.md:144 | ❌ MISSING |
| `pm release` | CLAUDE.md:153 | ❌ MISSING |
| `pm release --dry-run` | CLAUDE.md:250 | ❌ MISSING |

## IMPLEMENTATION GAPS SUMMARY

### High Priority (Core Workflow)
1. **`/pm:prd-parse`** - Critical for PRD workflow, has definition but no script
2. **PR Management** - No pr:create or pr:list implementations
3. **Board/Sprint Views** - No board:show or sprint:status implementations

### Medium Priority (Enhancement)
1. **`pm optimize`** - Referenced in CLAUDE.md for maintenance
2. **`pm release`** - Referenced in CLAUDE.md for releases
3. **Azure commands** - `/pm:azure-sync`, `/pm:azure-next`

### Low Priority (Format Migration)
1. Resource:action format migration (e.g., issue:list vs issue-list)
2. Context script naming alignment with command definitions

## RECOMMENDATIONS

1. **Immediate Actions**:
   - Implement `/pm:prd-parse` script (critical for workflow)
   - Add PR management commands (pr:create, pr:list)
   - Implement board and sprint status commands

2. **Short-term**:
   - Add `pm optimize` and `pm release` scripts
   - Align context script names with command definitions
   - Implement Azure-specific commands if Azure DevOps is supported

3. **Long-term**:
   - Migrate all commands to new resource:action format
   - Ensure 1:1 mapping between scripts and command definitions
   - Update documentation to reflect actual implementations

## Files Analyzed

- All *.md files in project (excluding node_modules)
- /autopm/.claude/scripts/pm/ directory
- /autopm/.claude/commands/ directory
- Command references in README.md, CLAUDE.md, CHANGELOG.md, docs-site/

## Notes

- Some commands may be implemented through agents rather than scripts
- Complex commands like epic-sync use modular approach with multiple scripts
- Command definitions (*.md files) can work without corresponding scripts if they're agent-based