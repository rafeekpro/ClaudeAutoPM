# Test Coverage Requirements Rule

**Rule Name**: test-coverage-requirements
**Priority**: High
**Applies To**: commands, agents
**Enforces On**: frontend-testing-engineer

## Description

Test coverage thresholds and quality metrics enforcement. This rule defines mandatory coverage requirements for all code changes and ensures coverage metrics meet industry standards based on Context7-verified best practices.

## Context7 Documentation Sources

**MANDATORY:** Coverage requirements based on these Context7 sources:

- `/vitest-dev/vitest` - Coverage configuration and thresholds
- `/testing-library/testing-library-docs` - Test quality metrics
- `/istanbul/istanbuljs` - Coverage reporting standards
- `/c8/c8` - V8 coverage provider patterns

## Coverage Thresholds

### Global Thresholds (MANDATORY)

**All new code must meet these minimum thresholds:**

```javascript
// vitest.config.js or jest.config.js
export default {
  test: {
    coverage: {
      provider: 'v8', // or 'istanbul'

      // MANDATORY minimum thresholds
      thresholds: {
        lines: 80,        // 80% of lines must be covered
        functions: 80,    // 80% of functions must be tested
        branches: 75,     // 75% of branches must be covered
        statements: 80    // 80% of statements must be executed
      },

      // Fail tests if thresholds not met
      reporter: ['text', 'json', 'html', 'lcov'],

      // Include only source code
      include: ['src/**/*.{js,jsx,ts,tsx}'],

      // Exclude non-testable code
      exclude: [
        'node_modules/',
        'test/',
        '**/*.config.js',
        '**/*.spec.js',
        '**/*.test.js',
        'src/main.{js,ts}',
        'src/index.{js,ts}',
        'src/**/*.d.ts'
      ]
    }
  }
};
```

### Per-Directory Thresholds (RECOMMENDED)

**Critical directories require higher coverage:**

```javascript
// Higher thresholds for critical code
coverage: {
  thresholds: {
    // Global minimum
    global: {
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80
    },

    // Critical business logic - higher standards
    './src/services/': {
      lines: 90,
      functions: 90,
      branches: 85,
      statements: 90
    },

    // UI components - focus on user interactions
    './src/components/': {
      lines: 85,
      functions: 85,
      branches: 80,
      statements: 85
    },

    // Utilities - comprehensive coverage
    './src/utils/': {
      lines: 95,
      functions: 95,
      branches: 90,
      statements: 95
    }
  }
}
```

## Coverage Quality Standards

### Lines vs. Branches

```
Understanding Coverage Metrics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Line Coverage: Were all lines executed?
   - ✅ Good indicator of basic coverage
   - ❌ Doesn't ensure all paths tested

📊 Branch Coverage: Were all code paths tested?
   - ✅ Tests if/else, switch, ternary operators
   - ✅ Better indicator of thorough testing
   - ⚠️  More important than line coverage

📊 Function Coverage: Were all functions called?
   - ✅ Ensures no dead code
   - ✅ Validates all exports are used

📊 Statement Coverage: Were all statements executed?
   - ✅ Similar to line coverage
   - ✅ More granular (multiple statements per line)

💡 Priority: Branch > Functions > Lines > Statements
```

### Example: Why Branch Coverage Matters

```javascript
// Function with 100% line coverage but poor branch coverage
function processUser(user) {
  if (user.isActive) {
    return user.name;  // Line covered ✓
  } else {
    return 'Inactive'; // Line NOT covered ✗
  }
}

// ❌ INSUFFICIENT: Only 50% branch coverage
test('returns name for active user', () => {
  expect(processUser({ isActive: true, name: 'John' })).toBe('John');
  // Only tests the 'if' branch, not 'else'
});

// ✅ CORRECT: 100% branch coverage
test('returns name for active user', () => {
  expect(processUser({ isActive: true, name: 'John' })).toBe('John');
});

test('returns "Inactive" for inactive user', () => {
  expect(processUser({ isActive: false, name: 'John' })).toBe('Inactive');
});
```

## Mandatory Coverage Checks

### Pre-Commit Hook (MANDATORY)

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Run tests with coverage
npm run test:coverage > /dev/null 2>&1

# Extract coverage percentage
COVERAGE=$(node -e "
  const data = require('./coverage/coverage-summary.json');
  console.log(data.total.lines.pct);
")

# Check threshold
THRESHOLD=80

if (( $(echo "$COVERAGE < $THRESHOLD" | bc -l) )); then
  echo "❌ Coverage $COVERAGE% is below $THRESHOLD% threshold"
  echo "   Run 'npm run test:coverage' for details"
  exit 1
fi

echo "✅ Coverage: $COVERAGE%"
exit 0
```

### Pull Request Check (MANDATORY)

```yaml
# .github/workflows/coverage.yml
name: Coverage Check

on:
  pull_request:
    branches: [main, develop]

jobs:
  coverage:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Check coverage threshold
        run: |
          LINES=$(node -e "console.log(require('./coverage/coverage-summary.json').total.lines.pct)")
          BRANCHES=$(node -e "console.log(require('./coverage/coverage-summary.json').total.branches.pct)")

          echo "Lines: $LINES%"
          echo "Branches: $BRANCHES%"

          if (( $(echo "$LINES < 80" | bc -l) )); then
            echo "❌ Line coverage below 80%"
            exit 1
          fi

          if (( $(echo "$BRANCHES < 75" | bc -l) )); then
            echo "❌ Branch coverage below 75%"
            exit 1
          fi

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: true

      - name: Comment PR with coverage
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
          filter-changed-files: true
```

## Coverage Exceptions

### When to Exclude Code

**Legitimate exclusions (must be documented):**

```javascript
// ✅ CORRECT: Exclude defensive error handling for impossible cases
function processData(data) {
  /* istanbul ignore next */
  if (!data) {
    throw new Error('Data is required'); // Can't happen in practice
  }

  return data.map(item => item.value);
}

// ✅ CORRECT: Exclude debug-only code
function debugLog(message) {
  /* istanbul ignore if */
  if (process.env.NODE_ENV === 'development') {
    console.log(message); // Not covered in test environment
  }
}

// ✅ CORRECT: Exclude type guards that TypeScript ensures
function isString(value: unknown): value is string {
  /* istanbul ignore next */
  return typeof value === 'string'; // TypeScript handles this
}
```

**Invalid exclusions (not allowed):**

```javascript
// ❌ WRONG: Excluding untested business logic
function calculateDiscount(price, user) {
  /* istanbul ignore next */
  if (user.isPremium) {
    return price * 0.8; // Should be tested!
  }

  return price;
}

// ❌ WRONG: Excluding error handling
async function fetchUser(id) {
  try {
    return await api.getUser(id);
  } catch (error) {
    /* istanbul ignore next */
    throw new Error('Failed to fetch user'); // Should be tested!
  }
}
```

## Coverage Reporting Standards

### Required Reports (MANDATORY)

```javascript
coverage: {
  reporter: [
    'text',        // Terminal output (for developers)
    'text-summary',// Quick summary
    'json',        // Machine-readable (for CI)
    'json-summary',// Quick machine-readable
    'html',        // Visual report (for deep dive)
    'lcov'         // For coverage services (Codecov, Coveralls)
  ],

  // Report directory
  reportsDirectory: './coverage',

  // Always clean before new run
  clean: true
}
```

### Coverage Trend Tracking

```javascript
// scripts/track-coverage.js
import { readFileSync, writeFileSync } from 'fs';

const summary = JSON.parse(
  readFileSync('./coverage/coverage-summary.json', 'utf-8')
);

const trend = {
  date: new Date().toISOString(),
  lines: summary.total.lines.pct,
  branches: summary.total.branches.pct,
  functions: summary.total.functions.pct,
  statements: summary.total.statements.pct
};

// Append to history
const history = JSON.parse(
  readFileSync('./coverage/history.json', 'utf-8')
);
history.push(trend);

writeFileSync(
  './coverage/history.json',
  JSON.stringify(history, null, 2)
);

// Check if coverage decreased
const previous = history[history.length - 2];
if (previous && trend.lines < previous.lines) {
  console.error(`❌ Coverage decreased from ${previous.lines}% to ${trend.lines}%`);
  process.exit(1);
}
```

## Coverage for Different Code Types

### Components (85% minimum)

```javascript
// ✅ REQUIRED: Test all component states
describe('LoadingButton', () => {
  test('shows button text when not loading', () => {
    render(<LoadingButton>Submit</LoadingButton>);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  test('shows spinner when loading', () => {
    render(<LoadingButton loading>Submit</LoadingButton>);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  test('is disabled when loading', () => {
    render(<LoadingButton loading>Submit</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('is disabled when disabled prop is true', () => {
    render(<LoadingButton disabled>Submit</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<LoadingButton onClick={onClick}>Submit</LoadingButton>);

    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### Services/API (90% minimum)

```javascript
// ✅ REQUIRED: Test all API methods and error cases
describe('UserService', () => {
  test('fetches user by ID', async () => {
    const user = await UserService.getUser(1);
    expect(user).toEqual({ id: 1, name: 'Test User' });
  });

  test('creates new user', async () => {
    const newUser = await UserService.createUser({ name: 'John' });
    expect(newUser).toHaveProperty('id');
    expect(newUser.name).toBe('John');
  });

  test('updates existing user', async () => {
    const updated = await UserService.updateUser(1, { name: 'Jane' });
    expect(updated.name).toBe('Jane');
  });

  test('deletes user', async () => {
    await expect(UserService.deleteUser(1)).resolves.toBeUndefined();
  });

  test('handles network errors', async () => {
    server.use(
      rest.get('/api/user/:id', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    await expect(UserService.getUser(1)).rejects.toThrow('Network error');
  });

  test('handles validation errors', async () => {
    await expect(
      UserService.createUser({ name: '' })
    ).rejects.toThrow('Name is required');
  });
});
```

### Utilities (95% minimum)

```javascript
// ✅ REQUIRED: Test all utility functions and edge cases
describe('formatCurrency', () => {
  test('formats positive numbers', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });

  test('formats zero', () => {
    expect(formatCurrency(0)).toBe('$0.00');
  });

  test('formats negative numbers', () => {
    expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
  });

  test('rounds to 2 decimal places', () => {
    expect(formatCurrency(1234.567)).toBe('$1,234.57');
  });

  test('handles very large numbers', () => {
    expect(formatCurrency(1234567890.12)).toBe('$1,234,567,890.12');
  });

  test('handles very small numbers', () => {
    expect(formatCurrency(0.01)).toBe('$0.01');
  });

  test('throws error for invalid input', () => {
    expect(() => formatCurrency('invalid')).toThrow('Invalid number');
    expect(() => formatCurrency(NaN)).toThrow('Invalid number');
    expect(() => formatCurrency(null)).toThrow('Invalid number');
  });
});
```

## Mutation Testing (RECOMMENDED)

```bash
# Install Stryker mutation testing
npm install -D @stryker-mutator/core @stryker-mutator/vitest-runner

# stryker.config.json
{
  "testRunner": "vitest",
  "coverageAnalysis": "perTest",
  "mutate": [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/**/*.{spec,test}.{js,jsx,ts,tsx}"
  ],
  "thresholds": {
    "high": 80,
    "low": 60,
    "break": 50
  }
}

# Run mutation testing
npx stryker run
```

**Why Mutation Testing:**
- Validates test quality, not just coverage
- Finds weak tests that don't catch bugs
- Mutates code and checks if tests fail
- Higher mutation score = better tests

## Enforcement Checklist

Before merging code, verify:

- [ ] Overall coverage meets 80% minimum
- [ ] Branch coverage meets 75% minimum
- [ ] No decrease in coverage from previous commit
- [ ] All new files have corresponding tests
- [ ] Coverage report generated and reviewed
- [ ] Critical paths have 90%+ coverage
- [ ] Error handling is tested
- [ ] Edge cases are covered
- [ ] Coverage exclusions are documented
- [ ] CI/CD coverage check passes

## Validation Commands

```bash
# Generate coverage report
npm run test:coverage

# Check coverage thresholds (fails if below)
npm run test:coverage -- --reporter=json

# View detailed HTML report
open coverage/index.html

# Track coverage trend
node scripts/track-coverage.js
```

## Coverage Improvement Strategies

### Identify Low Coverage Areas

```bash
# Find files with < 80% coverage
node -e "
  const data = require('./coverage/coverage-summary.json');
  Object.entries(data)
    .filter(([file, d]) => d.lines.pct < 80 && file !== 'total')
    .forEach(([file, d]) => console.log(\`\${file}: \${d.lines.pct}%\`));
"
```

### Prioritize High-Impact Tests

1. **Critical Business Logic** (highest priority)
2. **Error Handling** (prevents crashes)
3. **Edge Cases** (prevents bugs)
4. **Happy Path** (ensures core functionality)

## Related Rules

- `testing-standards` - Test quality and patterns
- `code-quality-standards` - General code quality
- `ci-cd-requirements` - CI/CD integration rules

## Support

For coverage questions:
- Review Context7 documentation for coverage tools
- Run `/test:coverage` command for detailed analysis
- Consult frontend-testing-engineer agent
