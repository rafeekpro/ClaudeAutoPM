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

## Phase 1: Analysis (Next)

### Scripts to Migrate

#### Priority 1 - Core Installation
- [ ] `install/install.sh` → `scripts/install.js`
- [ ] `install/merge-claude.sh` → `scripts/merge-claude.js`
- [ ] `install/setup-env.sh` → `scripts/setup-env.js`

#### Priority 2 - Development Tools
- [ ] `scripts/safe-commit.sh` → `scripts/safe-commit.js`
- [ ] `scripts/setup-hooks.sh` → `scripts/setup-hooks.js`
- [ ] `scripts/test.sh` → `scripts/test-runner.js`

#### Priority 3 - Self-Maintenance
- [ ] `scripts/pm/*.sh` → `scripts/pm/*.js`
- [ ] GitHub CLI wrappers → Native API calls

### Dependency Analysis

| Bash Command | Node.js Replacement | Library |
|--------------|-------------------|---------|
| `curl` | `fetch()` or `axios` | Built-in/axios |
| `gh` CLI | GitHub REST API | @octokit/rest |
| `jq` | Native JSON parsing | Built-in |
| `sed`/`awk` | String methods/regex | Built-in |
| `find` | `glob` or `fast-glob` | fast-glob |
| `grep` | String search/regex | Built-in |

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

## Migration Tracking

| Script | Status | Node.js Version | Tests | Notes |
|--------|--------|----------------|-------|-------|
| install.sh | 🔄 Planning | - | - | High priority |
| merge-claude.sh | 🔄 Planning | - | - | Partially done |
| setup-env.sh | 🔄 Planning | - | - | Partially done |
| safe-commit.sh | ⏳ Pending | - | - | - |
| setup-hooks.sh | ⏳ Pending | - | - | - |
| test.sh | ⏳ Pending | - | - | - |

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