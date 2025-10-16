# Test Coverage Analysis Command

**Command**: `/test:coverage`
**Category**: Testing & QA
**Priority**: Medium

## Description

Generate and analyze test coverage reports with actionable improvements. This command provides comprehensive coverage analysis, identifies gaps, and recommends specific tests to improve coverage based on Context7-verified testing best practices.

## Required Documentation Access

**MANDATORY:** Before analyzing coverage, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/testing/coverage-analysis` - Coverage metrics and thresholds
- `mcp://context7/testing/coverage-tools` - Istanbul, c8, v8 coverage providers
- `mcp://context7/testing/code-quality` - Quality metrics and standards
- `mcp://context7/project-management/metrics` - Tracking and reporting metrics

**Why This is Required:**
- Ensures coverage analysis follows industry standards
- Applies proven coverage threshold strategies
- Validates coverage metrics against best practices
- Prevents misleading or insufficient coverage metrics

## Usage

```bash
# Generate coverage report
/test:coverage

# Generate with specific thresholds
/test:coverage --threshold=90

# Generate with detailed analysis
/test:coverage --detailed

# Generate and open HTML report
/test:coverage --html

# Generate for specific directory
/test:coverage --dir=src/components
```

## Parameters

```yaml
threshold:
  type: number
  default: 80
  description: "Minimum coverage threshold percentage"

detailed:
  type: boolean
  default: false
  description: "Generate detailed coverage analysis"

html:
  type: boolean
  default: true
  description: "Generate and open HTML coverage report"

dir:
  type: string
  default: "src"
  description: "Directory to analyze for coverage"

format:
  type: string
  enum: [text, json, html, lcov, all]
  default: all
  description: "Coverage report format"

failOnLow:
  type: boolean
  default: false
  description: "Fail command if coverage below threshold"
```

## Implementation Steps

### 1. Run Coverage Collection

**Vitest Coverage**:
```bash
npx vitest run --coverage
```

**Jest Coverage**:
```bash
npx jest --coverage
```

### 2. Parse Coverage Report

```javascript
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read coverage summary
const coveragePath = resolve(process.cwd(), 'coverage/coverage-summary.json');
const coverageData = JSON.parse(readFileSync(coveragePath, 'utf-8'));

// Extract metrics
const { lines, statements, functions, branches } = coverageData.total;

const metrics = {
  lines: lines.pct,
  statements: statements.pct,
  functions: functions.pct,
  branches: branches.pct
};
```

### 3. Analyze Coverage Gaps

```javascript
// Identify files with low coverage
const lowCoverageFiles = Object.entries(coverageData)
  .filter(([file, data]) => {
    return data.lines.pct < threshold ||
           data.branches.pct < threshold;
  })
  .map(([file, data]) => ({
    file,
    lines: data.lines.pct,
    branches: data.branches.pct,
    uncoveredLines: data.lines.total - data.lines.covered
  }))
  .sort((a, b) => a.lines - b.lines);
```

### 4. Generate Recommendations

```javascript
// Context7-verified coverage improvement strategies
const recommendations = [];

for (const file of lowCoverageFiles) {
  if (file.branches < 75) {
    recommendations.push({
      file: file.file,
      type: 'branch',
      priority: 'high',
      suggestion: 'Add tests for conditional logic and edge cases',
      examples: [
        'Test if/else branches',
        'Test switch statements',
        'Test ternary operators',
        'Test error handling paths'
      ]
    });
  }

  if (file.lines < 80) {
    recommendations.push({
      file: file.file,
      type: 'line',
      priority: 'medium',
      suggestion: 'Increase line coverage by testing uncovered code paths',
      uncoveredLines: file.uncoveredLines
    });
  }
}
```

### 5. Generate Reports

**Text Report**:
```javascript
console.log(`
🧪 TEST COVERAGE REPORT
=======================

📊 Overall Coverage:
   Lines:      ${metrics.lines}%
   Statements: ${metrics.statements}%
   Functions:  ${metrics.functions}%
   Branches:   ${metrics.branches}%

${metrics.lines >= threshold ? '✅' : '❌'} Coverage ${metrics.lines >= threshold ? 'meets' : 'below'} threshold (${threshold}%)
`);
```

**HTML Report**:
```bash
# Open HTML coverage report in browser
open coverage/index.html  # macOS
xdg-open coverage/index.html  # Linux
start coverage/index.html  # Windows
```

## Coverage Analysis Output

### Standard Report

```
🧪 TEST COVERAGE REPORT
=======================

📊 Overall Coverage:
   Lines:      87.5%  ✅
   Statements: 86.2%  ✅
   Functions:  92.1%  ✅
   Branches:   78.4%  ⚠️

⚠️  Branch coverage below recommended threshold (80%)

📁 Files with Low Coverage:

   1. src/utils/validation.js
      - Lines: 65.2% (22/34 covered)
      - Branches: 50.0% (4/8 covered)
      - Priority: HIGH
      - Uncovered: Lines 15-18, 24-26, 31-33

   2. src/components/UserProfile.jsx
      - Lines: 75.8% (50/66 covered)
      - Branches: 62.5% (10/16 covered)
      - Priority: MEDIUM
      - Uncovered: Lines 42-45, 58-61

   3. src/services/api.js
      - Lines: 72.1% (62/86 covered)
      - Branches: 68.8% (11/16 covered)
      - Priority: MEDIUM
      - Uncovered: Lines 23-28, 45-52, 78-82

💡 ACTIONABLE RECOMMENDATIONS:

   Priority: HIGH
   ─────────────────────────────────────────
   File: src/utils/validation.js
   Issue: Low branch coverage (50%)

   Recommended Tests:
   ✓ Test email validation with invalid formats
   ✓ Test password validation edge cases
   ✓ Test error handling for null/undefined inputs
   ✓ Add tests for all conditional branches

   Example Test:
   ```javascript
   describe('validation.js', () => {
     it('should reject invalid email formats', () => {
       expect(validateEmail('invalid')).toBe(false);
       expect(validateEmail('missing@domain')).toBe(false);
     });
   });
   ```

   Priority: MEDIUM
   ─────────────────────────────────────────
   File: src/components/UserProfile.jsx
   Issue: Missing tests for error states

   Recommended Tests:
   ✓ Test loading state rendering
   ✓ Test error state handling
   ✓ Test empty data scenarios
   ✓ Test user interaction edge cases

   Example Test:
   ```javascript
   it('should show error message when data fetch fails', async () => {
     render(<UserProfile userId={999} />);

     expect(await screen.findByText(/error loading/i)).toBeInTheDocument();
   });
   ```

📈 IMPROVEMENT PLAN:

   To reach 90% coverage:
   ┌────────────────────────────────────────┐
   │ 1. Add 12 tests for validation.js     │
   │    Estimated time: 2 hours             │
   │    Impact: +8.5% overall coverage      │
   │                                        │
   │ 2. Add 8 tests for UserProfile.jsx    │
   │    Estimated time: 1.5 hours           │
   │    Impact: +4.2% overall coverage      │
   │                                        │
   │ 3. Add 6 tests for api.js             │
   │    Estimated time: 1 hour              │
   │    Impact: +2.8% overall coverage      │
   └────────────────────────────────────────┘

   Total estimated effort: 4.5 hours
   Projected coverage: 91.5%

🎯 NEXT STEPS:

   1. Review uncovered lines in coverage/index.html
   2. Implement recommended tests starting with HIGH priority
   3. Re-run coverage: npm run test:coverage
   4. Validate coverage meets threshold
```

### Detailed Analysis Report

```
🔍 DETAILED COVERAGE ANALYSIS
=============================

📊 Coverage by Category:

   Components:
   ├─ UserProfile.jsx         75.8%  ⚠️
   ├─ Dashboard.jsx          95.2%  ✅
   ├─ LoginForm.jsx          89.4%  ✅
   └─ Button.jsx            100.0%  ✅

   Services:
   ├─ api.js                 72.1%  ⚠️
   ├─ auth.js                91.3%  ✅
   └─ storage.js             88.7%  ✅

   Utils:
   ├─ validation.js          65.2%  ❌
   ├─ formatters.js          94.5%  ✅
   └─ helpers.js             87.9%  ✅

🔬 Complexity Analysis:

   High Complexity (Cyclomatic > 10):
   ├─ src/utils/validation.js:validateForm (complexity: 15)
   │  Coverage: 60% - NEEDS MORE TESTS
   │
   └─ src/services/api.js:handleResponse (complexity: 12)
      Coverage: 70% - NEEDS MORE TESTS

   Recommendation: Focus testing efforts on high-complexity,
                  low-coverage functions first.

📉 Coverage Trend (Last 5 runs):

   Date        Lines    Branches  Change
   ──────────────────────────────────────
   2024-01-15  87.5%    78.4%     +2.1%  ↗
   2024-01-14  85.4%    76.8%     -0.5%  ↘
   2024-01-13  85.9%    77.2%     +1.8%  ↗
   2024-01-12  84.1%    75.9%     +0.3%  ↗
   2024-01-11  83.8%    75.6%     -

   Trend: Improving ✅

🎖️  Coverage Champions:

   100% Coverage Files:
   ✓ src/components/Button.jsx
   ✓ src/utils/formatters.js
   ✓ src/hooks/useLocalStorage.js

   Great work on these files!

⚠️  Coverage Concerns:

   Files Below 70%:
   ! src/utils/validation.js (65.2%)
   ! src/services/api.js (72.1%)

   These files need immediate attention.
```

## Context7-Verified Best Practices

Based on Context7 documentation:

### Coverage Thresholds (Industry Standards)

```javascript
// Recommended thresholds from Context7
const coverageThresholds = {
  // Minimum acceptable
  minimum: {
    lines: 70,
    statements: 70,
    functions: 70,
    branches: 65
  },

  // Recommended for production
  recommended: {
    lines: 80,
    statements: 80,
    functions: 80,
    branches: 75
  },

  // Aspirational for critical systems
  high: {
    lines: 90,
    statements: 90,
    functions: 90,
    branches: 85
  }
};
```

### What Coverage Doesn't Tell You

```
Coverage Limitations:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ What 100% coverage DOES mean:
   - Every line of code was executed during tests
   - All code paths were exercised
   - No dead code exists

❌ What 100% coverage DOESN'T mean:
   - All edge cases are tested
   - Tests verify correct behavior
   - Code is bug-free
   - Tests are high quality

💡 Key Insight:
   Coverage measures test execution, not test quality.
   Always combine coverage with:
   - Code review
   - Mutation testing
   - Manual testing
   - User acceptance testing
```

### Mutation Testing Recommendation

```bash
# Install mutation testing (optional)
npm install -D @stryker-mutator/core @stryker-mutator/vitest-runner

# Run mutation testing to verify test quality
npx stryker run

# Mutation testing changes code (mutates) to verify tests catch bugs
# Example: Changes `>` to `>=`, `+` to `-`, removes conditionals
# Good tests should fail when code is mutated
```

## Integration with CI/CD

### GitHub Actions with Coverage Reporting

```yaml
name: Coverage

on: [push, pull_request]

jobs:
  coverage:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Check coverage threshold
        run: |
          COVERAGE=$(node -e "console.log(require('./coverage/coverage-summary.json').total.lines.pct)")
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 80% threshold"
            exit 1
          fi

      - name: Upload to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

      - name: Comment PR with coverage
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Related Commands

- `/test:setup` - Setup testing framework
- `/lint:coverage` - Check code quality metrics
- `/ci:setup` - Configure CI/CD pipeline

## Troubleshooting

### Common Issues

**Issue**: Coverage report not generated
**Solution**: Ensure coverage provider is installed (`@vitest/coverage-v8` or `jest`)

**Issue**: Coverage shows 0% for all files
**Solution**: Check that source files are included in coverage config

**Issue**: HTML report not opening
**Solution**: Manually navigate to `coverage/index.html` in browser

## Support

For issues or questions:
- Review coverage documentation via Context7
- Check `coverage/index.html` for visual report
- Consult frontend-testing-engineer agent
