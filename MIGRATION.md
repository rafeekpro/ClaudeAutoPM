# AUTOPM Bash to Node.js Migration Plan (TDD Approach)

> Complete migration from hybrid Bash/Node.js architecture to pure Node.js using Test-Driven Development

## Executive Summary

**Current State**: 49 bash scripts + 39 Node.js scripts (hybrid architecture)
**Target State**: 100% Node.js implementation
**Methodology**: Test-Driven Development (TDD)
**Timeline**: 4-6 weeks
**Risk Level**: Low (with proper testing)

## Migration Principles

1. **Test First**: Write tests before migrating any script
2. **Behavioral Parity**: New implementation must match existing behavior exactly
3. **Incremental**: Migrate one script at a time
4. **Backward Compatible**: Maintain bash wrappers during transition
5. **Rollback Ready**: Each migration can be reverted independently

## Phase 1: Infrastructure Setup (Week 1)

### 1.1 Jest Test Framework Setup

#### Install Jest and Dependencies
```bash
npm install --save-dev jest @types/jest jest-diff jest-extended
npm install --save-dev @jest/globals jest-watch-typeahead
```

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: [
    '**/test/**/*.test.js',
    '**/test/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'autopm/.claude/scripts/**/*.js',
    '!**/*.sh',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
  testTimeout: 10000,
  verbose: true
};
```

#### Jest Test Helper
```javascript
// test/migration/jest-migration-helper.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const diff = require('jest-diff');

class MigrationTester {
  async compareBashVsNode(scriptName, args = []) {
    const bashOutput = await this.runBash(scriptName, args);
    const nodeOutput = await this.runNode(scriptName, args);

    // Use Jest's diff for better output
    const difference = diff.diff(bashOutput, nodeOutput, {
      expand: false,
      contextLines: 3
    });

    return {
      identical: bashOutput === nodeOutput,
      bashOutput,
      nodeOutput,
      diff: difference
    };
  }
}

// Jest custom matchers
expect.extend({
  toMatchBashOutput(nodeOutput, bashOutput) {
    const pass = nodeOutput === bashOutput;
    const message = pass
      ? () => `Expected outputs to differ`
      : () => diff.diff(bashOutput, nodeOutput);

    return { pass, message };
  }
});
```

### 1.2 Create Test Data Repository

```
test/
├── migration/
│   ├── fixtures/           # Test data
│   ├── snapshots/          # Expected outputs
│   ├── behavioral/         # Behavioral tests
│   └── parity/            # Parity tests
```

### 1.3 CI/CD Pipeline

```yaml
# .github/workflows/migration-tests.yml
name: Migration Tests
on: [push, pull_request]
jobs:
  parity-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        script: [epic-list, epic-show, epic-status]
    steps:
      - run: npm run test:migration:${{ matrix.script }}
```

## Phase 2: Script Categorization & Priority (Week 1)

### Priority 1: Core PM Scripts (Already Partially Migrated)
| Script | Status | Complexity | Test Coverage Needed |
|--------|--------|------------|---------------------|
| epic-list.sh | ✅ Has JS version | Low | Parity tests |
| epic-show.sh | ✅ Has JS version | Low | Parity tests |
| epic-status.sh | ✅ Has JS version | Low | Parity tests |
| help.sh | ✅ Has JS version | Low | Unit tests |
| init.sh | ✅ Has JS version | Medium | Integration tests |

### Priority 2: Standalone Utilities
| Script | Complexity | Dependencies | Test Strategy |
|--------|------------|--------------|---------------|
| safe-commit.sh | High | git, gh | Mock git commands |
| pr-validation.sh | High | git, gh | Mock GitHub API |
| docker-dev-setup.sh | Medium | docker | Mock docker commands |
| install-hooks.sh | Low | git | File system tests |

### Priority 3: Infrastructure Scripts
| Script | Complexity | Risk | Test Strategy |
|--------|------------|------|---------------|
| docker-toggle.sh | Medium | Medium | Container tests |
| enforce-agents.sh | Low | Low | Unit tests |
| pre-push-docker-tests.sh | High | High | Integration tests |

## Phase 3: TDD Migration Process (Weeks 2-4)

### For Each Script:

#### Step 1: Capture Current Behavior
```bash
# capture-behavior.sh
#!/bin/bash
SCRIPT_NAME=$1
TEST_CASES_DIR="test/migration/behavioral/$SCRIPT_NAME"

# Run script with various inputs and capture outputs
for test_case in "$TEST_CASES_DIR"/*.input; do
  bash "autopm/.claude/scripts/$SCRIPT_NAME.sh" < "$test_case" > "${test_case%.input}.output"
done
```

#### Step 2: Write Behavioral Tests with Jest
```javascript
// test/migration/behavioral/safe-commit.test.js
const { createTestRepository, runScript } = require('../jest-migration-helper');
const fs = require('fs-extra');
const path = require('path');

describe('safe-commit migration', () => {
  let testRepo;

  beforeEach(async () => {
    testRepo = await createTestRepository();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await testRepo.cleanup();
  });

  describe('staged changes detection', () => {
    it('should detect staged changes', async () => {
      await testRepo.createFile('test.js');
      await testRepo.stageFile('test.js');

      const result = await runScript('safe-commit', ['test: add file']);

      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Changes committed');
      expect(result.stderr).toBe('');
    });

    it('should reject when no staged changes', async () => {
      const result = await runScript('safe-commit', ['test: no changes']);

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('No staged changes');
    });
  });

  describe('pre-commit hooks', () => {
    it('should run pre-commit hooks', async () => {
      const hookSpy = jest.fn();
      await testRepo.installHook('pre-commit', hookSpy);
      await testRepo.createFile('test.js');
      await testRepo.stageFile('test.js');

      await runScript('safe-commit', ['test: with hooks']);

      expect(hookSpy).toHaveBeenCalled();
    });

    it('should abort on hook failure', async () => {
      await testRepo.installHook('pre-commit', () => {
        throw new Error('Hook failed');
      });

      const result = await runScript('safe-commit', ['test: hook fail']);

      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('Hook failed');
    });
  });

  describe('commit message validation', () => {
    it.each([
      ['feat: add new feature', true],
      ['fix: resolve bug', true],
      ['docs: update readme', true],
      ['bad message format', false],
      ['feat add feature', false],
      ['', false]
    ])('message "%s" should be %s', async (message, isValid) => {
      if (isValid) {
        await testRepo.createFile('test.js');
        await testRepo.stageFile('test.js');
      }

      const result = await runScript('safe-commit', [message]);

      if (isValid) {
        expect(result.exitCode).toBe(0);
      } else {
        expect(result.exitCode).not.toBe(0);
        expect(result.stderr).toContain('Invalid commit message');
      }
    });
  });
});
```

#### Step 3: Write Node.js Implementation
```javascript
// autopm/.claude/scripts/safe-commit.js
#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SafeCommit {
  constructor() {
    this.gitDir = this.findGitDir();
  }

  async run(message) {
    // TDD: Implementation driven by tests
    await this.validateMessage(message);
    await this.runPreCommitHooks();
    await this.createCommit(message);
  }
}

// Maintain CLI compatibility
if (require.main === module) {
  new SafeCommit().run(process.argv[2]);
}
```

#### Step 4: Create Compatibility Wrapper
```bash
#!/bin/bash
# autopm/.claude/scripts/safe-commit.sh (updated)

# Check for Node.js and use JS version if available
if command -v node >/dev/null 2>&1; then
  exec node "$(dirname "$0")/safe-commit.js" "$@"
fi

# Fallback to original bash implementation
# [Original bash code remains here during transition]
```

#### Step 5: Parity Testing with Jest
```javascript
// test/migration/parity/safe-commit.parity.test.js
const { runBashVersion, runNodeVersion } = require('../jest-migration-helper');

describe('safe-commit parity tests', () => {
  // Use Jest's test.each for data-driven tests
  describe.each([
    ['valid commit message', ['feat: add feature'], 0],
    ['invalid commit message', ['bad message'], 1],
    ['dry run mode', ['--dry-run', 'test: message'], 0],
    ['help flag', ['--help'], 0],
    ['empty message', [''], 1],
    ['multiline message', ['feat: add feature\n\nDetailed description'], 0]
  ])('%s', (testName, args, expectedExit) => {
    let bashResult;
    let nodeResult;

    beforeAll(async () => {
      // Run both versions once and cache results
      [bashResult, nodeResult] = await Promise.all([
        runBashVersion('safe-commit', args),
        runNodeVersion('safe-commit', args)
      ]);
    });

    it('should have matching exit codes', () => {
      expect(nodeResult.exitCode).toBe(bashResult.exitCode);
      expect(nodeResult.exitCode).toBe(expectedExit);
    });

    it('should have matching stdout', () => {
      expect(nodeResult.stdout).toMatchBashOutput(bashResult.stdout);
    });

    it('should have matching stderr patterns', () => {
      // Allow minor differences in error formatting
      if (bashResult.stderr) {
        expect(nodeResult.stderr).toMatch(
          new RegExp(bashResult.stderr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        );
      }
    });

    it('should complete within similar time', () => {
      // Node version should not be significantly slower
      expect(nodeResult.duration).toBeLessThan(bashResult.duration * 2);
    });
  });

  // Snapshot testing for complex outputs
  it('should match snapshot for complex scenario', async () => {
    const complexArgs = ['feat: complex feature with --flag'];
    const nodeResult = await runNodeVersion('safe-commit', complexArgs);

    expect(nodeResult).toMatchSnapshot();
  });
});
```

## Phase 4: Complex Migrations (Weeks 3-4)

### Special Cases Requiring Extra Care:

#### Docker Scripts
```javascript
// Migration approach for docker-dev-setup.sh
class DockerDevSetup {
  async detectProjectType() {
    // Port project detection logic
    if (fs.existsSync('package.json')) return 'nodejs';
    if (fs.existsSync('requirements.txt')) return 'python';
    // etc...
  }

  async generateDockerfile(projectType) {
    // Template-based generation
    const template = await this.loadTemplate(projectType);
    return this.renderTemplate(template, this.projectConfig);
  }
}
```

#### Git Hook Scripts
```javascript
// Migration approach for install-hooks.sh
class HookInstaller {
  async installHooks() {
    const hooks = ['pre-commit', 'pre-push', 'commit-msg'];
    for (const hook of hooks) {
      await this.installHook(hook);
    }
  }

  async installHook(hookName) {
    const hookPath = path.join('.git', 'hooks', hookName);
    const hookContent = this.generateHookScript(hookName);
    fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  }
}
```

## Phase 5: Deprecation & Cleanup (Week 5)

### 5.1 Deprecation Warnings
```javascript
// Add to all bash wrappers
echo "⚠️  Bash implementation deprecated. Using Node.js version." >&2
echo "⚠️  To remove this warning, update to latest AUTOPM version." >&2
```

### 5.2 Performance Comparison
```javascript
// test/migration/performance.test.js
describe('Performance comparison', () => {
  it('Node version should be faster than bash', async () => {
    const bashTime = await measureExecutionTime('bash', 'epic-list.sh');
    const nodeTime = await measureExecutionTime('node', 'epic-list.js');

    expect(nodeTime).toBeLessThan(bashTime * 1.5); // Allow some margin
  });
});
```

### 5.3 Migration Metrics Dashboard
```javascript
// scripts/migration-status.js
class MigrationDashboard {
  async generateReport() {
    return {
      totalScripts: 49,
      migrated: await this.countMigratedScripts(),
      tested: await this.countTestedScripts(),
      deprecated: await this.countDeprecatedScripts(),
      removed: await this.countRemovedScripts()
    };
  }
}
```

## Phase 6: Final Cutover (Week 6)

### 6.1 Remove Bash Fallbacks
```javascript
// autopm/.claude/scripts/epic-list.sh (final version)
#!/bin/bash
exec node "$(dirname "$0")/epic-list.js" "$@"
```

### 6.2 Update Documentation
- Update README.md to reflect Node.js requirement
- Update installation instructions
- Update contributor guidelines

### 6.3 Release Strategy
```
v2.0.0-beta.1 - All scripts migrated, bash fallbacks present
v2.0.0-beta.2 - Deprecation warnings added
v2.0.0-rc.1   - Performance optimizations
v2.0.0        - Bash fallbacks removed
```

## Testing Strategy

### Unit Tests
```javascript
// Every function exported by the script
describe('SafeCommit.validateMessage', () => {
  it('should accept conventional commits', () => {});
  it('should reject invalid formats', () => {});
});
```

### Integration Tests
```javascript
// Script working with real git repos
describe('SafeCommit integration', () => {
  it('should commit to real repository', () => {});
});
```

### End-to-End Tests
```javascript
// Full workflow tests
describe('Epic workflow', () => {
  it('should create, update, and close epic', () => {});
});
```

### Regression Tests
```javascript
// Ensure no functionality is lost
describe('Regression suite', () => {
  it('should maintain all v1.x features', () => {});
});
```

## Risk Mitigation

### Rollback Plan
1. Each script can be reverted independently
2. Git tags for each migration milestone
3. Bash implementations preserved in `legacy/` directory

### Compatibility Matrix
| Node Version | Support Level | Notes |
|--------------|---------------|-------|
| 14.x | Full | Minimum supported |
| 16.x | Full | Recommended |
| 18.x | Full | Optimal performance |
| 20.x | Full | Latest features |

### Known Challenges
1. **Signal handling**: Different between bash and Node.js
2. **Process spawning**: Child process management differs
3. **File permissions**: Node.js fs module limitations
4. **Shell expansions**: Need manual implementation in JS

## Success Metrics

- ✅ 100% behavioral parity with bash implementation
- ✅ 100% test coverage for migrated code
- ✅ Performance improvement > 20%
- ✅ Reduced maintenance burden
- ✅ Improved error messages and debugging
- ✅ Cross-platform compatibility (Windows support)

## Migration Checklist

### Per-Script Checklist
- [ ] Behavioral tests written
- [ ] Node.js implementation complete
- [ ] Parity tests passing
- [ ] Performance tests passing
- [ ] Documentation updated
- [ ] Wrapper script updated
- [ ] Deprecation warning added
- [ ] Integration tests passing
- [ ] Code review completed
- [ ] Merged to main branch

### Global Checklist
- [ ] All 49 scripts migrated
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CI/CD pipeline updated
- [ ] Performance benchmarks documented
- [ ] Breaking changes documented
- [ ] Migration guide published
- [ ] Beta version released
- [ ] Community feedback incorporated
- [ ] Final version released

## Tooling

### Jest NPM Scripts
```json
// package.json additions
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:migration": "jest test/migration",
    "test:parity": "jest test/migration/parity",
    "test:behavioral": "jest test/migration/behavioral",
    "test:unit": "jest test/unit",
    "test:integration": "jest test/integration",
    "test:e2e": "jest test/e2e --runInBand",
    "test:snapshot": "jest -u",
    "test:debug": "node --inspect-brk ./node_modules/.bin/jest --runInBand",
    "migrate:new": "node tools/create-migration.js",
    "migrate:test": "jest --selectProjects migration",
    "migrate:report": "node tools/migration-report.js",
    "migrate:benchmark": "jest test/migration/performance"
  }
}
```

### Jest Projects Configuration
```javascript
// jest.config.js (enhanced)
module.exports = {
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/test/unit/**/*.test.js']
    },
    {
      displayName: 'migration',
      testMatch: ['<rootDir>/test/migration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/test/migration/setup.js']
    },
    {
      displayName: 'parity',
      testMatch: ['<rootDir>/test/migration/parity/**/*.test.js']
    },
    {
      displayName: 'e2e',
      testMatch: ['<rootDir>/test/e2e/**/*.test.js'],
      testTimeout: 30000
    }
  ],
  collectCoverageFrom: [
    'autopm/.claude/scripts/**/*.js',
    '!**/*.sh',
    '!**/node_modules/**',
    '!**/test/**'
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageDirectory: '<rootDir>/coverage',
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'test-results' }],
    ['jest-html-reporter', { pageTitle: 'Migration Test Report' }]
  ]
};
```

### Migration Helper Scripts
```bash
# Create new migration with tests
npm run migrate:new -- --script=script-name

# Run specific test suite
npm run test:parity -- --testNamePattern="epic-list"

# Generate coverage report
npm run test:coverage -- --coveragePathIgnorePatterns="legacy"

# Watch mode for TDD
npm run test:watch -- test/migration/behavioral/safe-commit.test.js

# Update snapshots
npm run test:snapshot

# Debug tests in Chrome DevTools
npm run test:debug test/migration/parity/epic-list.test.js
```

### Automated Migration Assistant
```javascript
// tools/migrate-script.js
class ScriptMigrator {
  async migrate(scriptPath) {
    const ast = this.parseBashScript(scriptPath);
    const jsCode = this.convertToJavaScript(ast);
    const tests = this.generateTests(ast);

    return {
      implementation: jsCode,
      tests: tests,
      wrapper: this.generateWrapper(scriptPath)
    };
  }
}
```

## Timeline

### Week 1: Setup & Planning
- Day 1-2: Test framework setup
- Day 3-4: Script analysis and categorization
- Day 5: CI/CD pipeline setup

### Week 2: Core Scripts
- Day 1-2: epic-* scripts
- Day 3-4: help, init, status scripts
- Day 5: Testing and validation

### Week 3: Utilities
- Day 1-2: safe-commit, pr-validation
- Day 3-4: docker-* scripts
- Day 5: Integration testing

### Week 4: Complex Scripts
- Day 1-3: Git hook scripts
- Day 4-5: Performance-critical scripts

### Week 5: Testing & Optimization
- Day 1-2: Performance testing
- Day 3-4: Edge case testing
- Day 5: Documentation

### Week 6: Release
- Day 1-2: Beta release
- Day 3-4: Community feedback
- Day 5: Final release

## Post-Migration

### Maintenance Mode
- Remove bash implementations after 3 months
- Archive legacy code for reference
- Update all documentation

### Future Improvements
- TypeScript migration
- Enhanced error handling
- Better logging system
- Plugin architecture

## Conclusion

This TDD-based migration plan ensures a safe, systematic transition from bash to Node.js while maintaining full backward compatibility and behavioral parity. The incremental approach minimizes risk and allows for continuous delivery throughout the migration process.