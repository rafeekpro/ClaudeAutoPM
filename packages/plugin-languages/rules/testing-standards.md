---
name: testing-standards
priority: high
tags:
  - testing
  - tdd
  - quality
  - coverage
appliesTo:
  - commands
  - agents
enforcesOn:
  - python-backend-engineer
  - python-backend-expert
  - nodejs-backend-engineer
  - javascript-frontend-engineer
  - bash-scripting-expert
---

# Testing Standards Rule

**MANDATORY**: All code MUST follow Test-Driven Development (TDD) methodology with comprehensive test coverage.

## Purpose

Ensure reliable, maintainable code through:
- Test-First Development (TDD)
- Comprehensive test coverage (>80%)
- Multiple test layers (unit, integration, E2E)
- Language-specific testing best practices
- Automated test execution

## Test-Driven Development (TDD) Workflow

### Red-Green-Refactor Cycle (MANDATORY)

**1. RED - Write Failing Test First**
```
Write a test that fails ❌
↓
Verify the test fails for the right reason
↓
Commit the failing test
```

**2. GREEN - Make it Pass**
```
Write minimal code to pass the test ✅
↓
Run tests and verify all pass
↓
Commit the passing code
```

**3. REFACTOR - Improve Code**
```
Improve code quality 🔄
↓
Ensure all tests still pass
↓
Commit the refactoring
```

### TDD Principles

- **Test-First**: Always write test before implementation
- **One Test at a Time**: Focus on single functionality
- **Minimal Code**: Write only enough code to pass
- **Refactor Safely**: Improve with test safety net
- **Fast Feedback**: Run tests continuously

## Language-Specific Testing Standards

### Python Testing (pytest)

**Test Structure:**
```python
# tests/test_user_service.py
import pytest
from app.services.user_service import UserService
from app.models.user import User

class TestUserService:
    """Test suite for UserService."""

    # TDD Step 1: RED - Write failing test first
    @pytest.mark.asyncio
    async def test_create_user_success(self, user_service, db_session):
        """
        GIVEN valid user data
        WHEN creating a new user
        THEN user is created and returned with ID
        """
        # Arrange
        user_data = {
            "email": "test@example.com",
            "username": "testuser",
            "password": "securepass123"
        }

        # Act
        user = await user_service.create_user(user_data)

        # Assert
        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.username == "testuser"
        assert user.password != "securepass123"  # Should be hashed

    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self, user_service, db_session):
        """
        GIVEN existing user with email
        WHEN creating user with same email
        THEN raises ValueError
        """
        # Arrange
        existing_user = {"email": "test@example.com", "username": "user1"}
        await user_service.create_user(existing_user)

        # Act & Assert
        with pytest.raises(ValueError, match="Email already exists"):
            await user_service.create_user({
                "email": "test@example.com",
                "username": "user2"
            })

# Fixtures for test setup
@pytest.fixture
async def user_service(db_session):
    """Create UserService instance with test database."""
    return UserService(db_session)

@pytest.fixture
async def db_session():
    """Create test database session."""
    # Setup
    async with async_session_maker() as session:
        yield session
        # Teardown
        await session.rollback()
```

**pytest Configuration:**
```toml
# pyproject.toml
[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = "test_*.py"
python_classes = "Test*"
python_functions = "test_*"
addopts = [
    "--cov=app",
    "--cov-report=html",
    "--cov-report=term-missing",
    "--cov-fail-under=80",
    "-v",
    "--tb=short",
    "--strict-markers",
    "--asyncio-mode=auto"
]
markers = [
    "unit: Unit tests",
    "integration: Integration tests",
    "e2e: End-to-end tests",
    "slow: Slow running tests"
]
```

**Coverage Requirements:**
- **Minimum**: 80% overall coverage
- **Critical paths**: 100% coverage
- **Branch coverage**: Enabled
- **Report**: HTML + Terminal

### JavaScript/TypeScript Testing (Jest/Vitest)

**Test Structure:**
```typescript
// tests/user.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '@/services/user.service';
import { User } from '@/models/user.model';

describe('UserService', () => {
  let userService: UserService;
  let mockRepository: any;

  beforeEach(() => {
    // Setup fresh mocks for each test
    mockRepository = {
      findById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    userService = new UserService(mockRepository);
  });

  // TDD Step 1: RED - Write failing test
  describe('createUser', () => {
    it('should create user with hashed password', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'securepass123',
      };

      const expectedUser = {
        id: 1,
        email: userData.email,
        username: userData.username,
        password: 'hashed_password',
      };

      mockRepository.create.mockResolvedValue(expectedUser);

      // Act
      const result = await userService.createUser(userData);

      // Assert
      expect(result.id).toBeDefined();
      expect(result.email).toBe(userData.email);
      expect(result.password).not.toBe(userData.password);
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error for duplicate email', async () => {
      // Arrange
      const userData = { email: 'test@example.com', username: 'user' };
      mockRepository.create.mockRejectedValue(
        new Error('Email already exists')
      );

      // Act & Assert
      await expect(userService.createUser(userData)).rejects.toThrow(
        'Email already exists'
      );
    });
  });

  // Integration test example
  describe('Integration: User workflow', () => {
    it('should complete full user lifecycle', async () => {
      // Create → Read → Update → Delete
      const user = await userService.createUser({ /* data */ });
      const found = await userService.findById(user.id);
      const updated = await userService.update(user.id, { /* updates */ });
      await userService.delete(user.id);

      expect(found).toBeDefined();
      expect(updated.email).toBe(/* expected */);
    });
  });
});
```

**Jest/Vitest Configuration:**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80,
    },
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
  },
});
```

### Node.js API Testing (Supertest)

**API Test Structure:**
```typescript
// tests/api/users.test.ts
import request from 'supertest';
import { app } from '@/app';
import { setupTestDB, cleanupTestDB } from './helpers/db';

describe('User API', () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await cleanupTestDB();
  });

  describe('POST /api/users', () => {
    it('should create new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('test@example.com');
    });

    it('should return 400 for invalid email', async () => {
      await request(app)
        .post('/api/users')
        .send({
          email: 'invalid-email',
          username: 'testuser',
        })
        .expect(400);
    });

    it('should return 409 for duplicate email', async () => {
      // First request succeeds
      await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com', username: 'user1' })
        .expect(201);

      // Second request fails
      await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com', username: 'user2' })
        .expect(409);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id', async () => {
      // Create user first
      const createResponse = await request(app)
        .post('/api/users')
        .send({ email: 'get@example.com', username: 'getuser' });

      const userId = createResponse.body.id;

      // Get user
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .expect(200);

      expect(response.body.id).toBe(userId);
      expect(response.body.email).toBe('get@example.com');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/users/99999')
        .expect(404);
    });
  });
});
```

### Bash Script Testing (bats)

**Test Structure:**
```bash
#!/usr/bin/env bats
# tests/deploy.bats

setup() {
    # Test setup
    export TEST_DIR="$(mktemp -d)"
    source ./scripts/deploy.sh

    # Mock functions
    git() {
        echo "git $*" >> "$TEST_DIR/git.log"
        return 0
    }
    export -f git
}

teardown() {
    # Cleanup
    rm -rf "$TEST_DIR"
}

@test "validate_environment accepts valid env" {
    run validate_environment "production"
    [ "$status" -eq 0 ]
}

@test "validate_environment rejects invalid env" {
    run validate_environment "invalid"
    [ "$status" -eq 1 ]
    [[ "$output" =~ "Invalid environment" ]]
}

@test "check_dependencies finds all required commands" {
    # Mock command availability
    function command() {
        case "$2" in
            git|docker|curl) return 0 ;;
            *) return 1 ;;
        esac
    }
    export -f command

    run check_dependencies
    [ "$status" -eq 0 ]
}

@test "deploy creates backup before deployment" {
    run deploy "staging"

    [ "$status" -eq 0 ]
    [ -f "$TEST_DIR/backup.tar.gz" ]
}

@test "rollback restores previous version on failure" {
    # Simulate deployment failure
    function deploy_new_version() {
        return 1
    }
    export -f deploy_new_version

    run main "production"

    [ "$status" -eq 1 ]
    [[ "$output" =~ "Rolling back" ]]
}
```

**bats Configuration:**
```bash
# tests/test_helper.bash
# Common test utilities

load '/usr/local/lib/bats-support/load.bash'
load '/usr/local/lib/bats-assert/load.bash'

# Setup test environment
setup_test_env() {
    export TEST_DIR="$(mktemp -d)"
    export LOG_FILE="$TEST_DIR/test.log"
}

# Cleanup test environment
cleanup_test_env() {
    rm -rf "$TEST_DIR"
}

# Assert file exists
assert_file_exists() {
    [ -f "$1" ] || fail "File does not exist: $1"
}

# Assert command succeeds
assert_success() {
    run "$@"
    assert_equal "$status" 0
}
```

## Test Categories

### Unit Tests

**Characteristics:**
- Test single function/method
- No external dependencies
- Fast execution (<100ms per test)
- Mock all I/O operations
- High coverage (>90%)

**What to Test:**
- Business logic
- Data transformations
- Validation logic
- Error handling
- Edge cases

### Integration Tests

**Characteristics:**
- Test component interactions
- Real database connections
- API calls to external services
- Moderate execution time (<5s per test)
- Medium coverage (>70%)

**What to Test:**
- Database operations
- API endpoints
- Service integrations
- Authentication flows
- Authorization logic

### End-to-End (E2E) Tests

**Characteristics:**
- Test complete workflows
- Real infrastructure
- User-facing scenarios
- Slow execution (<30s per test)
- Lower coverage (~20 critical paths)

**What to Test:**
- User registration flow
- Login/logout workflow
- Critical business processes
- Payment workflows
- Data migration scenarios

## Test Naming Conventions

### Python (pytest)
```python
def test_<function>_<scenario>_<expected_result>():
    """
    GIVEN <context>
    WHEN <action>
    THEN <expected_outcome>
    """
```

**Examples:**
- `test_create_user_with_valid_data_returns_user_with_id()`
- `test_update_user_with_invalid_email_raises_value_error()`
- `test_delete_user_that_does_not_exist_raises_not_found_error()`

### JavaScript/TypeScript (Jest/Vitest)
```typescript
describe('<Component/Function>', () => {
  it('should <expected behavior> when <condition>', () => {
    // Test
  });
});
```

**Examples:**
- `it('should return user when valid ID provided')`
- `it('should throw error when email already exists')`
- `it('should hash password before storing')`

### Bash (bats)
```bash
@test "<command> <scenario> <expected result>" {
    # Test
}
```

**Examples:**
- `@test "validate_input accepts valid email"`
- `@test "deploy fails with exit code 1 on error"`
- `@test "cleanup removes all temp files"`

## Coverage Requirements

### Minimum Thresholds

```yaml
coverage:
  statements: 80
  branches: 80
  functions: 80
  lines: 80
```

### Critical Paths (100% Coverage Required)

- Authentication and authorization
- Payment processing
- Data validation
- Security-sensitive operations
- Data persistence
- Error handling

### Excluded from Coverage

- Generated code
- Configuration files
- Test fixtures
- Third-party code
- Deprecated code

## Test Execution

### Local Development

```bash
# Python
pytest                    # Run all tests
pytest -v                 # Verbose output
pytest -k "test_user"     # Run specific tests
pytest --cov              # With coverage
pytest -m unit            # Run only unit tests

# JavaScript/TypeScript
npm test                  # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
npm run test:unit         # Unit tests only

# Bash
bats tests/               # Run all tests
bats tests/deploy.bats    # Specific file
```

### CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run tests
        run: |
          npm install
          npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

      - name: Check coverage threshold
        run: |
          if [ $(cat coverage/coverage-summary.json | jq '.total.statements.pct') -lt 80 ]; then
            echo "Coverage below 80%"
            exit 1
          fi
```

## Continuous Testing

### Watch Mode
- Run tests automatically on file changes
- Immediate feedback during development
- Faster red-green-refactor cycles

### Pre-commit Hooks
```bash
# .husky/pre-commit
#!/bin/sh
npm run test:staged  # Run tests for staged files only
```

### Pre-push Hooks
```bash
# .husky/pre-push
#!/bin/sh
npm run test:all     # Run full test suite
npm run test:coverage  # Verify coverage
```

## Test Data Management

### Fixtures
- Use factories for test data creation
- Keep fixtures minimal and focused
- Use realistic but safe test data
- Reset state between tests

### Mocking
- Mock external services
- Mock slow operations
- Mock non-deterministic behavior
- Keep mocks simple and maintainable

### Test Databases
- Use separate test database
- Reset before each test suite
- Seed with minimal data
- Clean up after tests

## Performance Targets

### Test Execution Speed

```
Unit tests:        < 100ms per test
Integration tests: < 5s per test
E2E tests:         < 30s per test
Full suite:        < 5 minutes
```

### Optimization Strategies

- Parallelize test execution
- Use test database transactions
- Mock slow external services
- Cache test dependencies
- Run fast tests first

## Enforcement

### Blocked Actions

- **Cannot merge**: If tests fail
- **Cannot deploy**: If coverage below threshold
- **Cannot commit**: If test syntax invalid (pre-commit hook)

### Quality Gates

```yaml
gates:
  - name: Tests
    condition: all_pass
    required: true

  - name: Coverage
    condition: ">= 80%"
    required: true

  - name: Performance
    condition: "< 5 minutes"
    required: true
```

## Monitoring

### Metrics

- Test count (should grow with codebase)
- Test execution time (should stay under threshold)
- Test flakiness rate (should be <1%)
- Coverage percentage (should be >80%)

### Reports

- Daily: Test execution summary
- Weekly: Coverage trends
- Monthly: Flaky test analysis
- Quarterly: Test suite health review

## References

- Python: [pytest Documentation](https://docs.pytest.org/)
- JavaScript: [Jest](https://jestjs.io/), [Vitest](https://vitest.dev/)
- Node.js: [Supertest](https://github.com/visionmedia/supertest)
- Bash: [bats](https://github.com/bats-core/bats-core)
- TDD: [Test-Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html)

---

**Enforcement Level**: MANDATORY
**Review Frequency**: Every commit
**Last Updated**: 2025-01-15
**TDD Required**: ✅ Red-Green-Refactor cycle mandatory for all code
