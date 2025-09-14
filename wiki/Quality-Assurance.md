# Quality Assurance

ClaudeAutoPM enforces strict quality standards through automated checks, pre-commit hooks, and comprehensive validation processes. This page outlines the quality assurance framework and best practices.

## Quality Philosophy

**"Quality is not an afterthought - it's built into every step of the development process."**

### Core Principles

1. **Prevention over Detection**: Catch issues before they reach production
2. **Automation First**: Automate quality checks wherever possible
3. **Fast Feedback**: Provide immediate feedback to developers
4. **Comprehensive Coverage**: Test at multiple levels
5. **Continuous Improvement**: Learn from issues and improve processes

## Definition of Done

Before any code is considered complete, it must meet all criteria:

### Code Quality
- [ ] Code follows established patterns and conventions
- [ ] No linting errors or warnings
- [ ] TypeScript strict mode compliance (if applicable)
- [ ] No security vulnerabilities detected
- [ ] Performance impact assessed

### Testing Requirements
- [ ] Unit tests written and passing (80% coverage minimum)
- [ ] Integration tests cover main flows
- [ ] E2E tests for critical paths
- [ ] Security tests pass
- [ ] Performance tests meet benchmarks

### Documentation
- [ ] Code is self-documenting with clear names
- [ ] Complex logic has inline comments
- [ ] API changes documented
- [ ] README updated if needed
- [ ] Changelog updated for user-facing changes

### Review Process
- [ ] Code review completed by team member
- [ ] All feedback addressed
- [ ] Security review if touching sensitive areas
- [ ] Performance review for critical paths

### Deployment Readiness
- [ ] All CI/CD checks pass
- [ ] Docker builds successfully
- [ ] Kubernetes deployment tested (if applicable)
- [ ] Rollback plan documented
- [ ] Monitoring alerts configured

## Pre-Commit Quality Gates

### Git Hooks

ClaudeAutoPM installs comprehensive git hooks to enforce quality:

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔒 Running pre-commit validation..."

# Critical files check
echo "📁 Checking critical files..."
required_files=(
  ".claude/strategies/ACTIVE_STRATEGY.md"
  ".claude/base.md"
  "package.json"
)

for file in "${required_files[@]}"; do
  if [[ -f "$file" ]]; then
    echo "  ✓ Found: $file"
  else
    echo "  ❌ Missing required file: $file"
    exit 1
  fi
done

# Run tests
echo "🧪 Running regression tests..."
npm run test:regression
if [[ $? -ne 0 ]]; then
  echo "❌ Regression tests failed"
  exit 1
fi

# Check for test modifications
echo "🔍 Checking for test modifications..."
if git diff --cached --name-only | grep -q "test/"; then
  echo "  ⚠️  Test files modified - running full test suite"
  npm test
  if [[ $? -ne 0 ]]; then
    echo "❌ Tests failed"
    exit 1
  fi
fi

# JavaScript syntax check
echo "🔧 Checking JavaScript syntax..."
for file in $(git diff --cached --name-only | grep -E '\.(js|ts)$'); do
  if [[ -f "$file" ]]; then
    node -c "$file"
    if [[ $? -ne 0 ]]; then
      echo "❌ Syntax error in $file"
      exit 1
    fi
  fi
done

# JSON validation
echo "📋 Checking JSON files..."
for file in $(git diff --cached --name-only | grep -E '\.json$'); do
  if [[ -f "$file" ]]; then
    jq empty "$file" 2>/dev/null
    if [[ $? -ne 0 ]]; then
      echo "❌ Invalid JSON in $file"
      exit 1
    fi
  fi
done

echo "✅ All checks passed! Proceeding with commit."
```

### Safe Commit Script

The `safe-commit.sh` script provides additional validation:

```bash
#!/bin/bash
# scripts/safe-commit.sh

set -e

COMMIT_MSG="$1"

if [[ -z "$COMMIT_MSG" ]]; then
  echo "Usage: ./scripts/safe-commit.sh 'commit message'"
  exit 1
fi

echo "🔒 Running pre-commit validation..."

# Stage all changes
git add .

# Run pre-commit hooks
git commit -m "$COMMIT_MSG"

echo "✅ Commit successful with safety checks"
```

## Code Quality Standards

### Linting Configuration

**JavaScript/TypeScript (ESLint)**:
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

**Markdown (markdownlint)**:
```json
{
  "default": true,
  "MD013": false,
  "MD033": {
    "allowed_elements": ["details", "summary"]
  }
}
```

### Code Formatting

**Prettier Configuration**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### Security Standards

**Security Scanning**:
- npm audit for dependency vulnerabilities
- CodeQL for code analysis
- OWASP security checks
- Secret detection in commits

```bash
# Run security checks
npm audit --audit-level=moderate
npm run test:security
```

## Automated Quality Checks

### Continuous Integration

Every push triggers comprehensive quality checks:

```yaml
# Quality gate workflow
jobs:
  quality-gate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint code
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Security scan
        run: npm audit

      - name: Unit tests
        run: npm run test:unit

      - name: Integration tests
        run: npm run test:integration

      - name: Build verification
        run: npm run build
```

### Quality Metrics

**Test Coverage Requirements**:
- Unit tests: 80% minimum
- Integration tests: 70% minimum
- E2E tests: 100% for critical paths
- Overall coverage: 85% minimum

**Performance Benchmarks**:
- Command execution: <500ms for simple operations
- API response time: <200ms for standard queries
- Memory usage: <100MB for typical operations
- Docker build time: <2 minutes

## Code Review Process

### Review Checklist

**Functionality**:
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] Performance considerations addressed

**Code Quality**:
- [ ] Follows project conventions
- [ ] No code duplication
- [ ] Proper abstraction levels
- [ ] Clear variable/function names

**Security**:
- [ ] Input validation implemented
- [ ] No hardcoded secrets
- [ ] Proper authentication/authorization
- [ ] SQL injection prevention

**Testing**:
- [ ] Adequate test coverage
- [ ] Tests are meaningful
- [ ] Mock usage appropriate
- [ ] Test names are descriptive

### Review Guidelines

**For Reviewers**:
1. **Be constructive**: Suggest improvements, not just problems
2. **Consider context**: Understand the broader goal
3. **Test locally**: Pull and test complex changes
4. **Check documentation**: Ensure docs are updated
5. **Approve confidently**: Only approve if you'd deploy it

**For Authors**:
1. **Self-review first**: Review your own code before submitting
2. **Write good descriptions**: Explain what and why
3. **Respond promptly**: Address feedback quickly
4. **Test thoroughly**: Ensure all scenarios work
5. **Update documentation**: Keep docs current

## Testing Standards

### Test Pyramid

```
    /\
   /E2E\     <- Few, slow, high-value
  /______\
 /        \
/Integration\  <- More, medium speed
\_____________/
/            \
/    Unit     \  <- Many, fast, focused
\______________/
```

### Test Organization

```
test/
├── unit/                 # Fast, isolated tests
│   ├── utils/
│   ├── components/
│   └── services/
├── integration/          # Component interaction tests
│   ├── api/
│   ├── database/
│   └── external-services/
├── e2e/                  # Full workflow tests
│   ├── user-flows/
│   ├── critical-paths/
│   └── smoke-tests/
├── security/             # Security-focused tests
│   ├── authentication/
│   ├── authorization/
│   └── input-validation/
└── performance/          # Performance benchmarks
    ├── load-tests/
    ├── stress-tests/
    └── benchmarks/
```

### Test Quality Standards

**Good Test Characteristics**:
- **Fast**: Unit tests run in milliseconds
- **Independent**: No dependencies between tests
- **Repeatable**: Same result every time
- **Self-validating**: Clear pass/fail
- **Timely**: Written close to production code

**Test Naming Convention**:
```javascript
describe('UserService', () => {
  describe('createUser', () => {
    it('should create user with valid data', () => {
      // Test implementation
    });

    it('should throw error when email already exists', () => {
      // Test implementation
    });

    it('should sanitize input data', () => {
      // Test implementation
    });
  });
});
```

## Performance Standards

### Performance Budgets

| Operation | Target | Maximum |
|-----------|--------|---------|
| Page load | <1s | <3s |
| API response | <200ms | <500ms |
| Database query | <50ms | <100ms |
| Test suite | <30s | <60s |
| Docker build | <2min | <5min |

### Performance Monitoring

```javascript
// Performance test example
describe('Performance Tests', () => {
  it('should handle 100 concurrent users', async () => {
    const startTime = Date.now();

    const requests = Array(100).fill().map(() =>
      request(app).get('/api/users')
    );

    const responses = await Promise.all(requests);
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5000); // 5 seconds max
    expect(responses.every(r => r.status === 200)).toBe(true);
  });
});
```

## Security Quality Gates

### Security Checklist

**Authentication & Authorization**:
- [ ] Proper authentication mechanisms
- [ ] Role-based access control
- [ ] Session management
- [ ] Token expiration

**Input Validation**:
- [ ] All inputs validated
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF protection

**Data Protection**:
- [ ] Sensitive data encrypted
- [ ] Secure data transmission
- [ ] Proper secret management
- [ ] Data retention policies

**Infrastructure Security**:
- [ ] Security headers configured
- [ ] HTTPS enforced
- [ ] Dependency scanning
- [ ] Container security

### Security Testing

```javascript
// Security test examples
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .post('/api/search')
      .send({ query: maliciousInput });

    expect(response.status).toBe(400);
    expect(response.body.error).toMatch(/invalid input/i);
  });

  it('should sanitize XSS attempts', async () => {
    const xssPayload = '<script>alert("XSS")</script>';
    const response = await request(app)
      .post('/api/comments')
      .send({ content: xssPayload });

    expect(response.body.content).not.toContain('<script>');
  });
});
```

## Quality Metrics and Monitoring

### Key Quality Indicators

**Code Quality Metrics**:
- Test coverage percentage
- Code complexity scores
- Linting error count
- Security vulnerability count
- Documentation coverage

**Process Metrics**:
- Pull request review time
- Build success rate
- Deployment frequency
- Mean time to recovery

**User Quality Metrics**:
- Error rate in production
- Performance metrics
- User satisfaction scores
- Support ticket volume

### Quality Dashboard

```bash
# Generate quality report
npm run quality:report

# Output:
Quality Report - 2024-01-15
========================
✅ Test Coverage: 94.3%
✅ Security Scan: 0 vulnerabilities
✅ Performance: All benchmarks passed
⚠️  Linting: 3 warnings
❌ Documentation: 2 missing sections
```

## Continuous Improvement

### Quality Retrospectives

Regular quality retrospectives help improve processes:

**Questions to Ask**:
1. What quality issues did we encounter?
2. What worked well in our quality process?
3. Where can we improve our standards?
4. What tools or processes should we add?
5. How can we prevent similar issues?

### Quality Training

**Team Quality Standards**:
- Regular code review training
- Security awareness sessions
- Testing best practices workshops
- Tool training (linters, formatters, etc.)
- Quality culture discussions

### Process Evolution

**Quality Process Improvements**:
1. **Regular review** of quality standards
2. **Tool evaluation** for better automation
3. **Metric tracking** to identify trends
4. **Team feedback** on quality processes
5. **Industry best practices** adoption

## Tools and Automation

### Quality Toolchain

| Category | Tool | Purpose |
|----------|------|---------|
| Linting | ESLint, markdownlint | Code style and error detection |
| Formatting | Prettier | Consistent code formatting |
| Type Checking | TypeScript | Static type validation |
| Testing | Jest, Playwright | Automated testing |
| Security | npm audit, CodeQL | Security vulnerability detection |
| Performance | K6, Lighthouse | Performance monitoring |
| Documentation | JSDoc, Swagger | API documentation |

### IDE Integration

**VS Code Extensions**:
- ESLint for real-time linting
- Prettier for formatting
- GitLens for git integration
- Jest for test running
- Docker for container management

## Best Practices

### Quality Culture

1. **Make quality everyone's responsibility**
2. **Celebrate quality improvements**
3. **Learn from quality issues**
4. **Automate quality checks**
5. **Measure and improve continuously**

### Team Practices

1. **Pair programming** for complex features
2. **Code review** for all changes
3. **Quality discussions** in team meetings
4. **Shared ownership** of code quality
5. **Continuous learning** about quality practices

## Related Pages

- [Testing Strategies](Testing-Strategies) - Comprehensive testing approach
- [GitHub Actions](GitHub-Actions) - Automated quality checks
- [Troubleshooting](Troubleshooting) - Quality issue resolution
- [Custom Agents](Custom-Agents) - Agent quality standards