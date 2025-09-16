# TDD-Based Bash to Node.js Migration Roadmap

## 🎯 Migration Philosophy: Test-First Approach

**Core Principle**: Write tests BEFORE migrating each script to ensure 100% feature parity and catch regressions early.

## 📊 Migration Overview

- **Total Scripts**: 56 remaining
- **Methodology**: TDD (Test-Driven Development)
- **Target**: 100% test coverage before production
- **Timeline**: Q1-Q2 2025

## 🔄 TDD Migration Process

### For Each Script:

1. **📝 Document Current Behavior**
   - Run script with various inputs
   - Document all outputs and side effects
   - Identify edge cases and error scenarios

2. **🧪 Write Tests First (RED)**
   - Create test file in `test/node-scripts/p{priority}/`
   - Write tests for all documented behaviors
   - Tests should FAIL initially (no implementation)

3. **💻 Implement Node.js Version (GREEN)**
   - Create Node.js script in `bin/node/`
   - Implement minimal code to pass tests
   - Focus on feature parity, not optimization

4. **♻️ Refactor (REFACTOR)**
   - Improve code quality
   - Add error handling
   - Optimize performance
   - Maintain test passage

5. **✅ Validate**
   - Run parallel comparison tests
   - Test in staging environment
   - Performance benchmarking

## 📅 Phase-by-Phase Migration Plan

### Phase 4: P1 Scripts - Main CLI (Q1 2025 Week 1-2)

#### 1. autopm.sh → autopm.js
**Complexity**: High | **Lines**: 450+ | **Priority**: CRITICAL

##### Week 1: Test Creation
```javascript
// test/node-scripts/p1/autopm.test.js
describe('AutoPM CLI', () => {
  describe('Command Routing', () => {
    test('should route install command correctly')
    test('should route setup-env command correctly')
    test('should handle unknown commands gracefully')
    test('should display help when no arguments')
    test('should respect --version flag')
  })

  describe('Environment Detection', () => {
    test('should detect npm global installation')
    test('should detect local installation')
    test('should find autopm source directory')
    test('should handle missing dependencies')
  })

  describe('Script Execution', () => {
    test('should execute bash scripts with arguments')
    test('should execute node scripts with arguments')
    test('should handle script execution failures')
    test('should preserve exit codes')
    test('should handle signals (SIGINT, SIGTERM)')
  })
})
```

##### Week 2: Implementation
```javascript
// bin/node/autopm.js
#!/usr/bin/env node
class AutoPMCLI {
  constructor() {
    this.commands = new Map()
    this.loadCommands()
  }

  async run(args) {
    // Implementation driven by tests
  }
}
```

### Phase 5: P2 Scripts - Testing Infrastructure (Q1 2025 Week 3-4)

#### 2. test.sh → test.js
**Complexity**: Medium | **Lines**: 250+ | **Priority**: HIGH

##### Test Suite Design
```javascript
// test/node-scripts/p2/test-runner.test.js
describe('Test Runner', () => {
  describe('Test Discovery', () => {
    test('should find all test files')
    test('should filter by pattern')
    test('should exclude node_modules')
  })

  describe('Test Execution', () => {
    test('should run tests in correct order')
    test('should handle test failures')
    test('should generate coverage reports')
    test('should support watch mode')
  })

  describe('Reporting', () => {
    test('should output TAP format')
    test('should show progress')
    test('should summarize results')
  })
})
```

#### 3. local-test-runner.sh → local-test-runner.js
**Complexity**: Low | **Lines**: 150+ | **Priority**: MEDIUM

#### 4. integration.test.sh → integration.test.js
**Complexity**: Medium | **Lines**: 300+ | **Priority**: HIGH

### Phase 6: P3 Scripts - Maintenance Tools (Q1 2025 Week 5-6)

#### 5. clean-ai-contributors.sh → clean-ai-contributors.js
**Complexity**: Low | **Lines**: 100+ | **Priority**: LOW

##### TDD Example
```javascript
// test/node-scripts/p3/clean-ai-contributors.test.js
describe('AI Contributors Cleaner', () => {
  beforeEach(() => {
    // Setup test git repository
  })

  test('should identify AI-generated commits')
  test('should remove Co-Authored-By tags')
  test('should preserve human contributors')
  test('should handle merge commits')
  test('should update git history safely')
})
```

#### 6. migrate-from-worktrees.sh → migrate-from-worktrees.js
**Complexity**: Medium | **Lines**: 200+ | **Priority**: LOW

### Phase 7: P4 Scripts - PM Commands (Q1 2025 Week 7-10)

#### Batch Migration Strategy for Similar Scripts

##### Step 1: Create Shared Test Utilities
```javascript
// test/node-scripts/p4/pm-test-utils.js
class PMTestHelper {
  setupMockGitHub() { /* ... */ }
  setupMockAzure() { /* ... */ }
  createTestProject() { /* ... */ }
  assertPMOutput(actual, expected) { /* ... */ }
}
```

##### Step 2: Test Template for PM Scripts
```javascript
// test/node-scripts/p4/pm-command.template.test.js
describe('PM ${COMMAND} Command', () => {
  describe('Provider Detection', () => {
    test('should detect GitHub provider')
    test('should detect Azure DevOps provider')
    test('should handle missing provider config')
  })

  describe('Data Fetching', () => {
    test('should fetch ${RESOURCE} from provider')
    test('should handle API errors')
    test('should cache responses')
  })

  describe('Output Formatting', () => {
    test('should format as table')
    test('should format as JSON')
    test('should format as markdown')
  })
})
```

##### Step 3: Parallel Implementation
All 14 PM scripts can share common base class:

```javascript
// lib/pm/base-command.js
class BasePMCommand {
  constructor(provider, resource) {
    this.provider = provider
    this.resource = resource
  }

  async execute(action, options) {
    // Shared implementation
  }
}
```

### Phase 8: P5 Scripts - Provider Integrations (Q2 2025)

#### Azure Scripts (16 scripts) - Week 1-3

##### Unified Test Strategy
```javascript
// test/node-scripts/p5/azure/azure-integration.test.js
describe('Azure DevOps Integration', () => {
  describe.each([
    'active-work', 'blocked', 'daily', 'dashboard',
    'feature-list', 'feature-show', 'feature-status',
    // ... etc
  ])('%s command', (command) => {
    test(`should execute ${command} successfully`)
    test(`should handle ${command} errors`)
    test(`should format ${command} output`)
  })
})
```

#### MCP Scripts (5 scripts) - Week 4

#### Hook Scripts (5 scripts) - Week 5

## 🧪 Testing Infrastructure

### Test Coverage Requirements

```yaml
# .github/workflows/migration-tests.yml
name: Migration Test Coverage

on: [push, pull_request]

jobs:
  test-coverage:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [16, 18, 20]
        os: [ubuntu-latest, macos-latest, windows-latest]

    steps:
      - name: Run migration tests
        run: |
          npm run test:migration -- --coverage
          npm run test:parallel-comparison
```

### Parallel Comparison Testing

```javascript
// test/migration/parallel-comparison.js
class ParallelComparisonTester {
  async compare(bashScript, nodeScript, inputs) {
    const bashOutput = await this.runBash(bashScript, inputs)
    const nodeOutput = await this.runNode(nodeScript, inputs)

    return {
      functionalParity: this.compareOutputs(bashOutput, nodeOutput),
      performanceGain: this.comparePerformance(bashOutput, nodeOutput),
      errorHandling: this.compareErrors(bashOutput, nodeOutput)
    }
  }
}
```

## 📈 Migration Metrics

### Success Criteria for Each Script

1. **Test Coverage**: >= 95%
2. **Performance**: Equal or better than Bash
3. **Cross-Platform**: Works on Windows, macOS, Linux
4. **Backwards Compatible**: Supports same CLI interface
5. **Error Handling**: Improved error messages

### Tracking Dashboard

```javascript
// scripts/migration-dashboard.js
class MigrationDashboard {
  generateReport() {
    return {
      totalScripts: 56,
      migrated: this.countMigrated(),
      testsWritten: this.countTests(),
      coverage: this.calculateCoverage(),
      performance: this.measurePerformance(),
      blockers: this.identifyBlockers()
    }
  }
}
```

## 🚀 Automation Tools

### 1. Test Generator
```javascript
// scripts/generate-migration-test.js
#!/usr/bin/env node

const script = process.argv[2]
const analyzer = new BashScriptAnalyzer(script)
const testGen = new TestGenerator()

// Analyze bash script
const analysis = analyzer.analyze()

// Generate test file
const tests = testGen.generate(analysis)
fs.writeFileSync(`test/migration/${path.basename(script)}.test.js`, tests)
```

### 2. Migration Helper
```javascript
// scripts/migrate-script.js
#!/usr/bin/env node

class MigrationHelper {
  async migrate(bashScript) {
    // 1. Run tests (should fail)
    await this.runTests(bashScript)

    // 2. Generate Node.js skeleton
    const skeleton = await this.generateSkeleton(bashScript)

    // 3. Interactive migration with AI assistance
    const implementation = await this.interactiveMigration(skeleton)

    // 4. Run tests again (should pass)
    await this.runTests(implementation)

    return implementation
  }
}
```

### 3. Continuous Migration Pipeline
```javascript
// scripts/migration-pipeline.js
class MigrationPipeline {
  async processNextScript() {
    const next = this.getNextPriorityScript()

    // TDD cycle
    await this.writeTests(next)
    await this.implement(next)
    await this.refactor(next)
    await this.validate(next)
    await this.deploy(next)
  }
}
```

## 📋 Migration Checklist Template

For each script migration:

- [ ] **Analysis Phase**
  - [ ] Document current behavior
  - [ ] Identify dependencies
  - [ ] List edge cases
  - [ ] Measure performance baseline

- [ ] **Test Phase (RED)**
  - [ ] Write unit tests
  - [ ] Write integration tests
  - [ ] Write performance tests
  - [ ] Ensure all tests fail

- [ ] **Implementation Phase (GREEN)**
  - [ ] Create Node.js script
  - [ ] Implement core functionality
  - [ ] Make all tests pass
  - [ ] Maintain CLI compatibility

- [ ] **Refactor Phase (REFACTOR)**
  - [ ] Improve code quality
  - [ ] Add comprehensive error handling
  - [ ] Optimize performance
  - [ ] Add JSDoc comments

- [ ] **Validation Phase**
  - [ ] Run parallel comparison tests
  - [ ] Test on all platforms
  - [ ] Benchmark performance
  - [ ] Update documentation

- [ ] **Deployment Phase**
  - [ ] Update package.json
  - [ ] Update CLI router
  - [ ] Create fallback mechanism
  - [ ] Document breaking changes

## 🎯 Quick Start for Next Migration

```bash
# 1. Choose next script
npm run migration:next

# 2. Generate tests
npm run migration:generate-tests -- install/autopm.sh

# 3. Run tests (should fail)
npm run test:migration -- autopm.test.js

# 4. Implement Node.js version
npm run migration:implement -- install/autopm.sh

# 5. Run tests (should pass)
npm run test:migration -- autopm.test.js

# 6. Validate migration
npm run migration:validate -- autopm
```

## 📊 Expected Timeline

| Phase | Scripts | Weeks | Completion |
|-------|---------|-------|------------|
| P0 (Done) | 3 | - | ✅ 100% |
| P1 | 1 | 2 | Q1 W2 |
| P2 | 3 | 2 | Q1 W4 |
| P3 | 2 | 2 | Q1 W6 |
| P4 | 14 | 4 | Q1 W10 |
| P5 | 36 | 6 | Q2 W6 |
| **Total** | **59** | **16** | **Q2 2025** |

## 🏁 Conclusion

This TDD-based migration approach ensures:
1. **Zero regressions** - Tests catch issues before deployment
2. **Confidence** - Each migration is validated thoroughly
3. **Documentation** - Tests serve as living documentation
4. **Maintainability** - Clean, tested code is easier to maintain
5. **Speed** - Parallel testing and automation accelerate migration

---

**Next Step**: Start with P1 - `autopm.sh` using TDD approach
**Begin Date**: Immediately after v1.3.0 release