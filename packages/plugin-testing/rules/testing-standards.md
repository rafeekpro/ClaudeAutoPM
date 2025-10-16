# Testing Standards Rule

**Rule Name**: testing-standards
**Priority**: High
**Applies To**: commands, agents
**Enforces On**: frontend-testing-engineer

## Description

Comprehensive testing standards with Context7-verified best practices for unit, integration, and E2E tests. This rule ensures all tests follow industry-standard patterns from official testing framework documentation.

## Context7 Documentation Sources

**MANDATORY:** All testing implementations must reference these Context7 sources:

- `/vitest-dev/vitest` - Vitest testing framework patterns
- `/testing-library/testing-library-docs` - Testing Library query patterns
- `/testing-library/react-testing-library` - React Testing Library best practices
- `/jestjs/jest` - Jest testing framework (when applicable)

## Core Testing Principles

### 1. Test-Driven Development (TDD)

**MANDATORY for all new features:**

```
Red-Green-Refactor Cycle:
┌──────────────────────────────────────┐
│ 1. RED: Write failing test first    │
│    ↓                                 │
│ 2. GREEN: Write minimum code to pass│
│    ↓                                 │
│ 3. REFACTOR: Improve code quality   │
│    ↓                                 │
│ 4. REPEAT for next feature          │
└──────────────────────────────────────┘
```

**Example:**
```javascript
// ✅ CORRECT TDD Flow
// Step 1: Write failing test FIRST
test('should calculate total price', () => {
  expect(calculateTotal([10, 20, 30])).toBe(60);
});

// Step 2: Implement minimum code
function calculateTotal(prices) {
  return prices.reduce((sum, price) => sum + price, 0);
}

// Step 3: Refactor if needed
function calculateTotal(prices) {
  if (!Array.isArray(prices)) throw new Error('Invalid input');
  return prices.reduce((sum, price) => sum + price, 0);
}
```

### 2. Query Priority (Testing Library Standard)

**MANDATORY:** Follow Testing Library's query priority hierarchy:

```javascript
// Priority 1: Accessible to Everyone (BEST)
// ✅ Queries accessible to screen readers and users
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email address')
screen.getByPlaceholderText('Enter your name')
screen.getByText('Welcome back!')
screen.getByDisplayValue('current value')

// Priority 2: Semantic Queries (GOOD)
// ✅ Queries that match HTML semantics
screen.getByAltText('Profile picture')
screen.getByTitle('Close dialog')

// Priority 3: Test IDs (ACCEPTABLE)
// ⚠️ Only when semantic queries don't work
screen.getByTestId('custom-element')

// Priority 4: CSS Selectors (AVOID)
// ❌ Tied to implementation, breaks easily
container.querySelector('.submit-button') // DON'T USE
container.querySelector('#email-input')   // DON'T USE
```

### 3. Test Independence

**MANDATORY:** Each test must be completely independent:

```javascript
// ❌ WRONG: Tests depend on each other
let user = null;

test('creates user', () => {
  user = { id: 1, name: 'John' };
  expect(user).toBeTruthy();
});

test('updates user', () => {
  user.name = 'Jane';  // Depends on previous test
  expect(user.name).toBe('Jane');
});

// ✅ CORRECT: Independent tests
describe('User operations', () => {
  beforeEach(() => {
    // Fresh state for each test
    mockDatabase.reset();
  });

  test('creates user', () => {
    const user = createUser({ name: 'John' });
    expect(user).toEqual({ id: 1, name: 'John' });
  });

  test('updates user', () => {
    const user = createUser({ name: 'John' });
    const updated = updateUser(user.id, { name: 'Jane' });
    expect(updated.name).toBe('Jane');
  });
});
```

### 4. Async Testing Best Practices

**MANDATORY:** Use Testing Library's async utilities:

```javascript
// ❌ WRONG: Manual delays
test('shows data after loading', async () => {
  render(<DataDisplay />);
  await new Promise(resolve => setTimeout(resolve, 1000));
  expect(screen.getByText('Data loaded')).toBeInTheDocument();
});

// ✅ CORRECT: Async utilities with auto-retry
test('shows data after loading', async () => {
  render(<DataDisplay />);

  // Automatically waits and retries
  expect(await screen.findByText('Data loaded')).toBeInTheDocument();
});

// ✅ CORRECT: waitFor for complex conditions
test('shows updated count', async () => {
  render(<Counter />);

  await userEvent.click(screen.getByRole('button', { name: 'Increment' }));

  await waitFor(() => {
    expect(screen.getByText('Count: 1')).toBeInTheDocument();
  });
});
```

### 5. User-Centric Testing

**MANDATORY:** Test behavior, not implementation:

```javascript
// ❌ WRONG: Testing implementation details
test('sets loading state to true', () => {
  const { result } = renderHook(() => useData());
  expect(result.current.loading).toBe(true);  // Internal state
});

// ✅ CORRECT: Testing user-visible behavior
test('shows loading indicator while fetching', () => {
  render(<DataComponent />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

// ❌ WRONG: Accessing component internals
test('updates state on click', () => {
  const wrapper = shallow(<Component />);
  wrapper.find('button').simulate('click');
  expect(wrapper.state('clicked')).toBe(true);
});

// ✅ CORRECT: Testing user interactions
test('shows success message after submit', async () => {
  const user = userEvent.setup();
  render(<Form />);

  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(await screen.findByText('Success!')).toBeInTheDocument();
});
```

## Test Structure Standards

### AAA Pattern (Arrange-Act-Assert)

**MANDATORY for all tests:**

```javascript
test('user can log in with valid credentials', async () => {
  // ARRANGE: Set up test data and environment
  const user = userEvent.setup();
  const credentials = { email: 'user@example.com', password: 'pass123' };
  render(<LoginForm />);

  // ACT: Perform the action being tested
  await user.type(screen.getByLabelText('Email'), credentials.email);
  await user.type(screen.getByLabelText('Password'), credentials.password);
  await user.click(screen.getByRole('button', { name: 'Log in' }));

  // ASSERT: Verify expected outcome
  expect(await screen.findByText('Welcome!')).toBeInTheDocument();
});
```

### Descriptive Test Names

**MANDATORY:** Test names must describe behavior:

```javascript
// ❌ WRONG: Vague test names
test('it works', () => { });
test('button', () => { });
test('user test', () => { });

// ✅ CORRECT: Descriptive behavior-focused names
test('should display error message when email is invalid', () => { });
test('should navigate to dashboard after successful login', () => { });
test('should disable submit button while form is submitting', () => { });

// ✅ CORRECT: Organized with describe blocks
describe('LoginForm', () => {
  describe('when user provides valid credentials', () => {
    test('should successfully log in', () => { });
    test('should clear form fields', () => { });
    test('should redirect to dashboard', () => { });
  });

  describe('when user provides invalid credentials', () => {
    test('should display error message', () => { });
    test('should keep user on login page', () => { });
    test('should clear password field', () => { });
  });
});
```

## Coverage Standards

### Minimum Coverage Thresholds

**MANDATORY:** All new code must meet these thresholds:

```javascript
// vitest.config.js
export default {
  test: {
    coverage: {
      thresholds: {
        lines: 80,        // Minimum 80% line coverage
        functions: 80,    // Minimum 80% function coverage
        branches: 75,     // Minimum 75% branch coverage
        statements: 80    // Minimum 80% statement coverage
      }
    }
  }
};
```

### What to Exclude from Coverage

```javascript
// ✅ CORRECT: Exclude non-testable code
coverage: {
  exclude: [
    'node_modules/',
    'test/',
    '**/*.config.js',
    '**/*.spec.js',
    '**/*.test.js',
    'src/main.js',           // App entry point
    'src/index.js',          // Entry point
    'src/**/*.d.ts',         // Type definitions
    'src/constants.js',      // Pure constants
    'src/types.js'           // Type exports
  ]
}
```

### Coverage Quality over Quantity

```
Coverage Checklist:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ 100% coverage with poor tests:
   - Tests that only check code executes
   - No assertions about correctness
   - Testing implementation details
   - Brittle tests that break easily

✅ 80% coverage with quality tests:
   - Tests verify correct behavior
   - Tests check edge cases
   - Tests use semantic queries
   - Tests are maintainable
   - Tests document expected behavior

💡 Focus on test quality, not just coverage numbers!
```

## Mocking Standards

### API Mocking (Recommended: MSW)

```javascript
// ✅ CORRECT: Mock at network level with MSW
import { rest } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  rest.get('/api/user/:id', (req, res, ctx) => {
    return res(ctx.json({ id: req.params.id, name: 'Test User' }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

test('fetches user data', async () => {
  render(<UserProfile userId={1} />);

  expect(await screen.findByText('Test User')).toBeInTheDocument();
});
```

### Module Mocking (When Necessary)

```javascript
// ✅ CORRECT: Mock external dependencies
import { vi } from 'vitest';

vi.mock('../services/analytics', () => ({
  trackEvent: vi.fn(),
  trackPageView: vi.fn()
}));

test('tracks button click', async () => {
  const { trackEvent } = await import('../services/analytics');
  render(<Button />);

  await userEvent.click(screen.getByRole('button'));

  expect(trackEvent).toHaveBeenCalledWith('button_click');
});
```

## Accessibility Testing

**MANDATORY for UI components:**

```javascript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('should have no accessibility violations', async () => {
  const { container } = render(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

// ✅ Test keyboard navigation
test('should be keyboard navigable', async () => {
  const user = userEvent.setup();
  render(<Form />);

  // Tab through form fields
  await user.tab();
  expect(screen.getByLabelText('Name')).toHaveFocus();

  await user.tab();
  expect(screen.getByLabelText('Email')).toHaveFocus();
});

// ✅ Test screen reader text
test('should have descriptive aria-label', () => {
  render(<IconButton icon="close" />);

  expect(screen.getByRole('button', { name: 'Close dialog' }))
    .toBeInTheDocument();
});
```

## Performance Testing

```javascript
// ✅ Test component rendering performance
test('should render large list efficiently', () => {
  const items = Array.from({ length: 10000 }, (_, i) => ({ id: i }));

  const start = performance.now();
  render(<VirtualizedList items={items} />);
  const duration = performance.now() - start;

  expect(duration).toBeLessThan(100); // Should render in < 100ms
});

// ✅ Use Vitest's benchmark feature
import { bench, describe } from 'vitest';

describe('Array operations', () => {
  bench('Array.push', () => {
    const arr = [];
    for (let i = 0; i < 1000; i++) {
      arr.push(i);
    }
  });

  bench('Array spread', () => {
    let arr = [];
    for (let i = 0; i < 1000; i++) {
      arr = [...arr, i];
    }
  });
});
```

## Anti-Patterns to Avoid

### ❌ Don't Test Third-Party Libraries

```javascript
// ❌ WRONG: Testing React itself
test('useState works', () => {
  const { result } = renderHook(() => useState(0));
  expect(result.current[0]).toBe(0);  // Don't test React
});

// ✅ CORRECT: Test your component behavior
test('counter increments when button clicked', async () => {
  render(<Counter />);
  await userEvent.click(screen.getByRole('button', { name: 'Increment' }));
  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### ❌ Don't Use Snapshot Testing for Everything

```javascript
// ❌ WRONG: Large snapshots that break often
test('renders correctly', () => {
  const { container } = render(<ComplexComponent />);
  expect(container).toMatchSnapshot();  // 500 line snapshot
});

// ✅ CORRECT: Targeted snapshots for specific elements
test('renders error message correctly', () => {
  render(<Form error="Invalid input" />);
  const errorEl = screen.getByRole('alert');
  expect(errorEl).toMatchInlineSnapshot(`
    <div role="alert" class="error">
      Invalid input
    </div>
  `);
});
```

### ❌ Don't Rely on Test Order

```javascript
// ❌ WRONG: Tests depend on execution order
test.only('test 1', () => { sharedState = 'value'; });
test('test 2', () => { expect(sharedState).toBe('value'); });

// ✅ CORRECT: Tests are independent
beforeEach(() => {
  sharedState = getInitialState();
});

test('test 1', () => { /* uses sharedState */ });
test('test 2', () => { /* uses sharedState */ });
```

## Enforcement Checklist

Before committing test code, verify:

- [ ] All new code has corresponding tests
- [ ] Tests follow AAA pattern (Arrange-Act-Assert)
- [ ] Query priority is respected (getByRole preferred)
- [ ] No manual delays (use waitFor, findBy)
- [ ] Tests are independent (beforeEach used properly)
- [ ] Test names are descriptive
- [ ] Coverage thresholds are met (80%+)
- [ ] Accessibility is tested for UI components
- [ ] No testing of third-party libraries
- [ ] Mocks are cleaned up properly
- [ ] CI/CD integration is configured

## Validation

Run these checks before merge:

```bash
# Run all tests
npm test

# Check coverage
npm run test:coverage

# Run accessibility tests
npm run test:a11y

# Run in CI mode
npm run test:ci
```

## Related Rules

- `test-coverage-requirements` - Coverage threshold enforcement
- `accessibility-standards` - A11y testing requirements
- `code-quality-standards` - General code quality rules

## Support

For questions about testing standards:
- Review Context7 documentation for testing libraries
- Consult frontend-testing-engineer agent
- Review example tests in `test/examples/`
