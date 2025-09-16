# Bash to Node.js Scripts Migration Plan

## Overview
This document tracks the migration of Bash scripts to Node.js for better cross-platform compatibility, maintainability, and testing.

## Phase 0: Preparation ✅

### Status: COMPLETED
- [x] Created feature branch: `feat/node-scripts-migration`
- [x] Configured test environment in `package.json`
  - `npm run test:node` - Run Node.js script tests
  - `npm run test:node:watch` - Watch mode for development
  - `npm run test:node:coverage` - Coverage reports
- [x] Installed key npm libraries

### Libraries Selected

| Library | Version | Purpose | Replaces Bash |
|---------|---------|---------|---------------|
| `inquirer` | 9.2.12 | Interactive prompts | `read`, `select` |
| `chalk` | 5.3.0 | Colored console output | ANSI color codes |
| `execa` | 8.0.1 | Safe command execution | `$(...)`, backticks |
| `fs-extra` | 11.2.0 | Enhanced file operations | `cp`, `mv`, `rm -rf` |
| `yargs` | 17.7.2 | CLI argument parsing | `getopts`, `$1`, `$2` |

### Test Directory Structure
```
test/node-scripts/
├── *.test.js          # Test files for migrated scripts
└── fixtures/          # Test fixtures and mocks
```

## Phase 1: Analysis ✅

### Status: COMPLETED
- [x] Scanned all 58 Bash scripts in repository
- [x] Analyzed dependencies and complexity
- [x] Created comprehensive migration inventory
- [x] Prioritized scripts by importance and complexity

## Complete Script Inventory

### Priority P0 - Critical Core Scripts (Must Migrate First)

| Script Path | Main Purpose | External Dependencies | Proposed Node.js Libraries | Complexity | Lines |
|-------------|--------------|----------------------|---------------------------|------------|-------|
| `install/install.sh` | Main framework installer | git, diff, find, jq, awk | inquirer, chalk, execa, fs-extra, js-yaml | Complex | 1373 |
| `install/setup-env.sh` | Interactive .env configuration | chmod | inquirer, chalk, fs-extra, dotenv | Medium | 579 |
| `install/merge-claude.sh` | CLAUDE.md merge assistance | cat | fs-extra, chalk, inquirer | Medium | 322 |

### Priority P1 - Developer Workflow Scripts

| Script Path | Main Purpose | External Dependencies | Proposed Node.js Libraries | Complexity | Lines |
|-------------|--------------|----------------------|---------------------------|------------|-------|
| `autopm/scripts/safe-commit.sh` | Pre-commit validation | git, npm, prettier, eslint, black | simple-git, execa, chalk | Medium | 168 |
| `scripts/test.sh` | Test suite orchestration | node, bash | execa, chalk, glob | Simple | 95 |
| `autopm/scripts/setup-hooks.sh` | Git hooks installation | git, chmod | simple-git, fs-extra | Simple | 87 |
| `scripts/clean-ai-contributors.sh` | Clean AI from commits | git, grep, sed | simple-git, fs-extra | Simple | 45 |

### Priority P2 - PM System Scripts

| Script Path | Main Purpose | External Dependencies | Proposed Node.js Libraries | Complexity | Lines |
|-------------|--------------|----------------------|---------------------------|------------|-------|
| `autopm/.claude/scripts/pm/init.sh` | PM system initialization | gh, git | @octokit/rest, simple-git | Medium | 142 |
| `autopm/.claude/scripts/pm/status.sh` | Project status dashboard | git, gh | @octokit/rest, chalk, table | Medium | 156 |
| `autopm/.claude/scripts/pm/next.sh` | Next task selection | find, sort | glob, chalk | Simple | 78 |
| `autopm/.claude/scripts/pm/standup.sh` | Daily standup report | date, find | moment, glob, chalk | Simple | 89 |
| `autopm/.claude/scripts/pm/epic-list.sh` | List epics | find, ls | glob, chalk, table | Simple | 64 |
| `autopm/.claude/scripts/pm/epic-show.sh` | Display epic details | cat, find | fs-extra, chalk | Simple | 92 |
| `autopm/.claude/scripts/pm/validate.sh` | System validation | find, grep | glob, chalk | Simple | 134 |

### Priority P3 - Azure DevOps Scripts

| Script Path | Main Purpose | External Dependencies | Proposed Node.js Libraries | Complexity | Lines |
|-------------|--------------|----------------------|---------------------------|------------|-------|
| `autopm/.claude/scripts/azure/setup.sh` | Azure DevOps setup | az | azure-devops-node-api | Medium | 167 |
| `autopm/.claude/scripts/azure/sync.sh` | Sync with Azure | az, jq | azure-devops-node-api | Complex | 234 |
| `autopm/.claude/scripts/azure/dashboard.sh` | Azure dashboard | az, jq | azure-devops-node-api, chalk | Medium | 145 |
| `autopm/.claude/scripts/azure/sprint-report.sh` | Sprint reporting | az, jq | azure-devops-node-api, table | Medium | 189 |

### Priority P4 - MCP Scripts

| Script Path | Main Purpose | External Dependencies | Proposed Node.js Libraries | Complexity | Lines |
|-------------|--------------|----------------------|---------------------------|------------|-------|
| `autopm/.claude/scripts/mcp/list.sh` | List MCP servers | jq | js-yaml, chalk, table | Simple | 72 |
| `autopm/.claude/scripts/mcp/enable.sh` | Enable MCP server | jq | js-yaml, fs-extra | Simple | 96 |
| `autopm/.claude/scripts/mcp/sync.sh` | Sync MCP config | jq | js-yaml, fs-extra | Simple | 84 |

### Priority P5 - Hook Scripts (Consider Deprecation)

| Script Path | Main Purpose | External Dependencies | Proposed Node.js Libraries | Complexity | Lines |
|-------------|--------------|----------------------|---------------------------|------------|-------|
| `autopm/.claude/hooks/enforce-agents.sh` | Agent usage enforcement | grep | - | Simple | 42 |
| `autopm/.claude/hooks/docker-first-enforcement.sh` | Docker enforcement | docker | dockerode | Simple | 38 |
| `autopm/.claude/hooks/test-hook.sh` | Test hook example | - | - | Trivial | 15 |

### Migration Statistics

- **Total Scripts**: 58
- **Total Lines of Bash**: ~6,847
- **By Priority**:
  - P0 (Critical): 3 scripts, 2,274 lines
  - P1 (Workflow): 4 scripts, 395 lines
  - P2 (PM System): 13 scripts, 1,456 lines
  - P3 (Azure): 10 scripts, 1,789 lines
  - P4 (MCP): 5 scripts, 428 lines
  - P5 (Hooks): 5 scripts, 178 lines

### Dependency Analysis

| Bash Command | Node.js Replacement | Library | Usage Count |
|--------------|-------------------|---------|-------------|
| `git` | Git operations | simple-git | 28 scripts |
| `find` | File discovery | glob/fast-glob | 18 scripts |
| `cat` | File reading | fs.readFile | 15 scripts |
| `grep` | Text search | String.includes/regex | 12 scripts |
| `jq` | JSON parsing | JSON.parse | 11 scripts |
| `gh` | GitHub API | @octokit/rest | 8 scripts |
| `az` | Azure CLI | azure-devops-node-api | 10 scripts |
| `chmod` | Permissions | fs.chmod | 6 scripts |
| `sed`/`awk` | Text processing | String methods | 5 scripts |
| `curl` | HTTP requests | fetch/axios | 3 scripts |

## Phase 2: Implementation Strategy

### Migration Order
1. **Utilities First**: Helper functions and common utilities
2. **Leaf Scripts**: Scripts with no dependencies on other scripts
3. **Core Scripts**: Main installation and setup scripts
4. **Integration**: Update bin/* entry points

### Testing Strategy
- Unit tests for each migrated function
- Integration tests comparing Bash vs Node.js output
- Cross-platform testing (Windows, macOS, Linux)
- Performance benchmarks

### Compatibility Approach
- Maintain backward compatibility during migration
- Both Bash and Node.js versions coexist temporarily
- Feature flags to switch between implementations
- Gradual deprecation of Bash scripts

## Phase 3: Validation Criteria

### Per-Script Validation
- [ ] Feature parity with Bash version
- [ ] All tests passing
- [ ] Cross-platform compatibility verified
- [ ] Performance acceptable (< 2x slower than Bash)
- [ ] Error handling improved

### Overall Migration Success Criteria
- [ ] All Priority 1 scripts migrated
- [ ] No regression in functionality
- [ ] Improved Windows support
- [ ] Better error messages
- [ ] Comprehensive test coverage (>80%)

## Phase 4: Rollout Plan

### Gradual Rollout
1. **Alpha**: Internal testing with feature flag
2. **Beta**: Opt-in for early adopters
3. **RC**: Default for new installations
4. **GA**: Full replacement, Bash deprecated

### Rollback Strategy
- Keep Bash scripts for 2 major versions
- Environment variable to force Bash usage
- Clear migration guide for users

## Benefits of Migration

### Cross-Platform Compatibility
- ✅ Native Windows support (no Git Bash required)
- ✅ Consistent behavior across OS
- ✅ Better PowerShell integration

### Maintainability
- ✅ Type checking with JSDoc/TypeScript
- ✅ Better IDE support and debugging
- ✅ Easier unit testing
- ✅ More contributors (JS > Bash knowledge)

### Features
- ✅ Better error messages and stack traces
- ✅ Progress bars and spinners
- ✅ Parallel execution with proper control
- ✅ Native JSON/YAML handling

## Current Status

### Completed
- [x] Phase 0: Preparation

### In Progress
- [ ] Phase 1: Analysis

### Upcoming
- [ ] Phase 2: Implementation
- [ ] Phase 3: Validation
- [ ] Phase 4: Rollout

## Migration Tracking Dashboard

### P0 - Critical Scripts
| Script | Status | Node.js Version | Tests | Target Date | Notes |
|--------|--------|----------------|-------|-------------|-------|
| install/install.sh | ⏳ Pending | - | - | Week 1-2 | Most complex, 1373 lines |
| install/setup-env.sh | ⏳ Pending | - | - | Week 2 | Already partially Node.js |
| install/merge-claude.sh | ⏳ Pending | - | - | Week 2 | Already partially Node.js |

### P1 - Developer Workflow
| Script | Status | Node.js Version | Tests | Target Date | Notes |
|--------|--------|----------------|-------|-------------|-------|
| autopm/scripts/safe-commit.sh | ⏳ Pending | - | - | Week 3 | Critical for dev workflow |
| scripts/test.sh | ⏳ Pending | - | - | Week 3 | Simple migration |
| autopm/scripts/setup-hooks.sh | ⏳ Pending | - | - | Week 3 | Simple migration |
| scripts/clean-ai-contributors.sh | ⏳ Pending | - | - | Week 4 | Low complexity |

### P2 - PM System (13 scripts)
| Category | Count | Status | Target | Notes |
|----------|-------|--------|--------|-------|
| PM Core | 7 scripts | ⏳ Pending | Week 4-5 | Could use @octokit/rest |
| PM Utilities | 6 scripts | ⏳ Pending | Week 5 | Mostly file operations |

### Migration Progress
- **Total**: 0/58 scripts migrated (0%)
- **P0 Critical**: 0/3 (0%)
- **P1 Workflow**: 0/4 (0%)
- **P2 PM System**: 0/13 (0%)
- **P3 Azure**: 0/10 (0%)
- **P4 MCP**: 0/5 (0%)

## Required NPM Dependencies

### Must Install for P0-P1 Migration
```json
{
  "dependencies": {
    "simple-git": "^3.20.0",
    "glob": "^10.3.10",
    "fast-glob": "^3.3.2",
    "dotenv": "^16.3.1",
    "moment": "^2.29.4",
    "table": "^6.8.1"
  }
}
```

### Future Dependencies (P2-P3)
```json
{
  "dependencies": {
    "@octokit/rest": "^20.0.2",
    "azure-devops-node-api": "^14.0.0",
    "dockerode": "^4.0.0"
  }
}
```

### Legend
- ✅ Completed
- 🔄 In Progress
- ⏳ Pending
- ❌ Blocked

## Resources

- [Node.js Built-in Test Runner](https://nodejs.org/api/test.html)
- [Execa Documentation](https://github.com/sindresorhus/execa)
- [Inquirer.js Guide](https://github.com/SBoudrias/Inquirer.js)
- [Chalk Styling Guide](https://github.com/chalk/chalk)

## Notes

### Decisions Made
1. Using built-in Node.js test runner instead of Jest/Mocha
2. ESM modules where possible, CommonJS for compatibility
3. Minimal dependencies - prefer built-in Node.js APIs
4. Progressive enhancement - basic functionality works without optional deps

### Open Questions
1. Should we support Node.js < 16?
2. TypeScript for type safety or JSDoc?
3. Monorepo structure for better organization?
4. CLI framework (yargs vs commander vs built-in)?

---

Last Updated: 2025-01-16
Migration Lead: @team
Review: @rafeekpro