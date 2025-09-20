# Testing Strategies

ClaudeAutoPM enforces Test-Driven Development (TDD) and provides comprehensive testing strategies that ensure code quality, reliability, and maintainability. All testing happens in Docker containers to ensure consistency across environments.

## Core Philosophy

Based on `.claude/rules/tdd.enforcement.md`:

**"No code without tests. No merge without passing tests."**

### TDD Enforcement

1. **Write test first** - Define expected behavior
2. **See test fail** - Verify test catches missing functionality
3. **Write code** - Implement minimal solution
4. **See test pass** - Verify implementation
5. **Refactor** - Improve code with safety net

## Test Categories

### Unit Tests
**Purpose**: Test individual components in isolation
**Location**: `test/unit/`
**Runner**: Framework-specific (Jest, pytest, go test)
**Coverage Target**: 80% minimum

```bash
# Run unit tests
docker compose run app npm run test:unit
```

### Integration Tests
**Purpose**: Test component interactions
**Location**: `test/integration/`
**Runner**: Framework-specific with real dependencies
**Coverage Target**: 70% minimum

```bash
# Run integration tests
docker compose run app npm run test:integration
```

### End-to-End Tests
**Purpose**: Test complete user workflows
**Location**: `test/e2e/`
**Runner**: Playwright, Cypress, Selenium
**Coverage Target**: Critical paths 100%

```bash
# Run E2E tests
docker compose run e2e npm run test:e2e
```

### Security Tests
**Purpose**: Identify vulnerabilities
**Location**: `test/security/`
**Runner**: Custom security scanners
**Frequency**: Every PR, nightly full scan

```bash
# Run security tests
docker compose run app npm run test:security
```

### Performance Tests
**Purpose**: Ensure performance requirements
**Location**: `test/performance/`
**Runner**: K6, JMeter, custom benchmarks
**Frequency**: Before release, weekly

```bash
# Run performance tests
docker compose run perf npm run test:performance
```

## Container-Based Testing

All tests run in Docker containers for consistency:

### Test Container Configuration

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  app:
    build:
      context: .
      target: test
    command: npm test
    environment:
      - NODE_ENV=test
      - CI=true
    volumes:
      - .:/app
      - /app/node_modules

  db-test:
    image: postgres:14
    environment:
      - POSTGRES_DB=test_db
      - POSTGRES_USER=test
      - POSTGRES_PASSWORD=test

  e2e:
    image: mcr.microsoft.com/playwright:v1.40.0
    command: npm run test:e2e
    depends_on:
      - app
    environment:
      - PLAYWRIGHT_BASE_URL=http://app:3000
```

### Running Tests in Containers

```bash
# All tests
docker compose -f docker-compose.test.yml run app

# Specific test suite
docker compose run app npm run test:unit

# With coverage
docker compose run app npm run test:coverage

# Watch mode (development)
docker compose run app npm run test:watch
```

## Test Structure

### JavaScript/TypeScript (Jest)

```javascript
// user.test.js
describe('User Service', () => {
  let userService;
  let mockDatabase;

  beforeEach(() => {
    mockDatabase = createMockDatabase();
    userService = new UserService(mockDatabase);
  });

  describe('createUser', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User'
      };

      // Act
      const user = await userService.createUser(userData);

      // Assert
      expect(user).toHaveProperty('id');
      expect(user.email).toBe(userData.email);
      expect(mockDatabase.save).toHaveBeenCalledWith(userData);
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      mockDatabase.findByEmail.mockResolvedValue({ id: 1 });

      // Act & Assert
      await expect(userService.createUser({
        email: 'existing@example.com'
      })).rejects.toThrow('Email already exists');
    });
  });
});
```

### Python (pytest)

```python
# test_user_service.py
import pytest
from unittest.mock import Mock, patch
from services.user import UserService

class TestUserService:
    @pytest.fixture
    def user_service(self):
        mock_db = Mock()
        return UserService(mock_db)

    def test_create_user_success(self, user_service):
        # Arrange
        user_data = {
            'email': 'test@example.com',
            'name': 'Test User'
        }

        # Act
        user = user_service.create_user(user_data)

        # Assert
        assert user['email'] == user_data['email']
        assert 'id' in user
        user_service.db.save.assert_called_once_with(user_data)

    def test_create_user_duplicate_email(self, user_service):
        # Arrange
        user_service.db.find_by_email.return_value = {'id': 1}

        # Act & Assert
        with pytest.raises(ValueError, match="Email already exists"):
            user_service.create_user({'email': 'existing@example.com'})
```

### Go

```go
// user_test.go
package services

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
)

func TestCreateUser(t *testing.T) {
    t.Run("creates user with valid data", func(t *testing.T) {
        // Arrange
        mockDB := new(MockDatabase)
        service := NewUserService(mockDB)
        userData := User{
            Email: "test@example.com",
            Name:  "Test User",
        }

        mockDB.On("Save", userData).Return(nil)

        // Act
        user, err := service.CreateUser(userData)

        // Assert
        assert.NoError(t, err)
        assert.NotEmpty(t, user.ID)
        assert.Equal(t, userData.Email, user.Email)
        mockDB.AssertExpectations(t)
    })
}
```

## E2E Testing with Playwright

### Page Object Model

```javascript
// pages/LoginPage.js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('#email');
    this.passwordInput = page.locator('#password');
    this.submitButton = page.locator('button[type="submit"]');
    this.errorMessage = page.locator('.error-message');
  }

  async navigate() {
    await this.page.goto('/login');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorMessage() {
    return await this.errorMessage.textContent();
  }
}
```

### E2E Test Implementation

```javascript
// tests/login.spec.js
import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

test.describe('Login Flow', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login('user@example.com', 'password123');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('invalid credentials show error', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.login('invalid@example.com', 'wrong');

    const error = await loginPage.getErrorMessage();
    expect(error).toBe('Invalid email or password');
  });
});
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Run Unit Tests
        run: docker compose run app npm run test:unit

      - name: Run Integration Tests
        run: docker compose run app npm run test:integration

      - name: Run E2E Tests
        run: docker compose run e2e npm run test:e2e

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Test Coverage

### Coverage Requirements

```json
// package.json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### Coverage Reports

```bash
# Generate coverage report
docker compose run app npm run test:coverage

# View HTML report
open coverage/index.html

# Check coverage in CI
docker compose run app npm run test:coverage:ci
```

## Agent-Driven Testing

### Using Test Agents

```markdown
# Generate tests
@test-runner create unit tests for UserService

# Run specific tests
@test-runner execute tests for authentication module

# Analyze failures
@test-runner analyze failing tests and suggest fixes
```

### E2E Test Generation

```markdown
@e2e-test-engineer create tests for user registration flow:
1. Navigate to signup page
2. Fill in registration form
3. Submit and verify email
4. Complete verification
5. Login with new account
```

## Testing Best Practices

### 1. Test Naming

```javascript
// Good: Descriptive and specific
it('should return 404 when user does not exist', ...)

// Bad: Vague
it('should work', ...)
```

### 2. AAA Pattern

```javascript
it('should calculate total with tax', () => {
  // Arrange
  const items = [{ price: 100 }, { price: 50 }];
  const taxRate = 0.1;

  // Act
  const total = calculateTotal(items, taxRate);

  // Assert
  expect(total).toBe(165); // 150 + 15 tax
});
```

### 3. Test Isolation

```javascript
beforeEach(() => {
  // Reset state before each test
  database.clear();
  cache.flush();
});

afterEach(() => {
  // Clean up after each test
  mockServer.reset();
});
```

### 4. Avoid Test Interdependence

```javascript
// Bad: Tests depend on order
it('test 1', () => {
  global.user = createUser();
});

it('test 2', () => {
  updateUser(global.user); // Depends on test 1
});

// Good: Independent tests
it('test 1', () => {
  const user = createUser();
  // Use user
});

it('test 2', () => {
  const user = createUser(); // Create own user
  updateUser(user);
});
```

## Performance Testing

### Load Testing with K6

```javascript
// load-test.js
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
  },
};

export default function() {
  let response = http.get('http://app:3000/api/users');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Security Testing

### OWASP Checks

```javascript
// security.test.js
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .post('/api/search')
      .send({ query: maliciousInput });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Invalid input');
  });

  it('should prevent XSS attacks', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    const response = await request(app)
      .post('/api/comments')
      .send({ content: xssPayload });

    const saved = await getComment(response.body.id);
    expect(saved.content).not.toContain('<script>');
  });
});
```

## Debugging Failed Tests

### Using Test Containers

```bash
# Run tests with debugging
docker compose run app npm run test:debug

# Access container for investigation
docker compose run app sh
> npm test -- --verbose
> npm test -- --detectOpenHandles
```

### Visual Debugging (Playwright)

```bash
# Run with headed browser
docker compose run -e HEADLESS=false e2e npm run test:e2e

# Debug mode
docker compose run e2e npx playwright test --debug
```

## Related Pages

- [Quality Assurance](Quality-Assurance)
- [Docker First Development](Docker-First-Development)
- [Agent Selection Guide](Agent-Selection-Guide)
- [GitHub Actions](GitHub-Actions)