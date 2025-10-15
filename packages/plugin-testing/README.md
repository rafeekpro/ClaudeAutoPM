# @claudeautopm/plugin-testing

Testing frameworks, E2E testing, and quality assurance specialists.

## 📦 Installation

```bash
# Install the plugin package
npm install -g @claudeautopm/plugin-testing

# Install plugin agents to your project
autopm plugin install testing
```

## 🤖 Agents Included

### Frontend Testing
- **frontend-testing-engineer** - Frontend testing specialist
  - Unit testing with Jest/Vitest
  - Component testing with React Testing Library
  - E2E testing with Playwright/Cypress
  - Visual regression testing
  - Accessibility testing
  - Performance testing
  - Test automation strategies

## 💡 Usage

### In Claude Code

After installation, agents are available in your project:

```markdown
<!-- CLAUDE.md -->
## Active Team Agents

<!-- Load testing agents -->
- @include .claude/agents/testing/frontend-testing-engineer.md
```

Or use `autopm team load` to automatically include agents:

```bash
# Load testing-focused team
autopm team load testing

# Or include testing in fullstack team
autopm team load fullstack
```

### Direct Invocation

```bash
# Invoke agent directly from CLI
autopm agent invoke frontend-testing-engineer "Create E2E tests for checkout flow"
```

## 📋 Agent Capabilities

### Test Strategy Design
- Test pyramid implementation
- Coverage goals and metrics
- Test data management
- CI/CD integration

### Unit Testing
- Component isolation
- Mock and stub creation
- Test-driven development (TDD)
- Snapshot testing

### Integration Testing
- API integration tests
- Database integration
- Service mocking
- Contract testing

### E2E Testing
- User flow automation
- Cross-browser testing
- Mobile testing
- Visual regression

### Quality Assurance
- Accessibility (a11y) testing
- Performance benchmarking
- Security testing
- Code quality metrics

## 🚀 Examples

### React Component Testing

```
@frontend-testing-engineer

Create test suite for ProductCard component:

Component features:
- Display product image, name, price
- Add to cart button
- Favorite toggle
- Discount badge (conditional)
- Click to view details

Requirements:
- React Testing Library
- User event simulation
- Accessibility checks
- Mock API calls
- Coverage > 90%

Include:
1. Unit tests for all features
2. Accessibility tests
3. Mock setup
4. Edge case handling
5. Test utilities
```

### E2E Testing with Playwright

```
@frontend-testing-engineer

Build E2E test suite for e-commerce checkout:

User flow:
1. Browse products
2. Add items to cart
3. Apply discount code
4. Fill shipping info
5. Select payment method
6. Confirm order

Requirements:
- Playwright framework
- Page Object Model
- Test fixtures
- Cross-browser (Chrome, Firefox, Safari)
- Mobile viewport testing
- Screenshot on failure

Include:
1. Test specifications
2. Page object classes
3. Fixtures and helpers
4. CI/CD configuration
5. Reporting setup
```

### Visual Regression Testing

```
@frontend-testing-engineer

Setup visual regression testing:

Components to test:
- Header navigation
- Product grid
- Sidebar filters
- Modal dialogs
- Form inputs

Requirements:
- Percy or Chromatic integration
- Multiple viewport sizes
- Theme variations (light/dark)
- State variations (empty, loading, error)
- CI/CD integration

Include:
1. Visual test configuration
2. Story definitions
3. Snapshot baselines
4. Review workflow
5. GitHub Actions setup
```

### Accessibility Testing

```
@frontend-testing-engineer

Implement accessibility testing:

Requirements:
- WCAG 2.1 Level AA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Focus management

Tools:
- axe-core
- jest-axe
- Lighthouse CI
- NVDA/JAWS testing

Include:
1. Automated a11y tests
2. Manual testing checklist
3. CI/CD integration
4. Violation reporting
5. Remediation guidelines
```

### Performance Testing

```
@frontend-testing-engineer

Create performance test suite:

Metrics to track:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Cumulative Layout Shift (CLS)
- Total Blocking Time (TBT)

Requirements:
- Lighthouse CI
- Real device testing
- Network throttling
- Budget enforcement
- Trend tracking

Include:
1. Performance test config
2. Budget definitions
3. CI/CD integration
4. Reporting dashboard
5. Optimization recommendations
```

### Test Automation Framework

```
@frontend-testing-engineer

Design comprehensive test automation framework:

Test types:
- Unit tests (Jest)
- Integration tests (Testing Library)
- E2E tests (Playwright)
- Visual tests (Percy)
- A11y tests (axe)
- Performance tests (Lighthouse)

Requirements:
- Unified reporting
- Parallel execution
- Flake detection
- Smart retries
- Cost optimization

Include:
1. Framework architecture
2. Test utilities library
3. Custom matchers
4. CI/CD pipeline
5. Monitoring and alerts
```

## 🔧 Configuration

### Environment Variables

Some agents benefit from environment variables:

```bash
# Testing
export JEST_TIMEOUT=30000
export PLAYWRIGHT_BROWSERS_PATH=/opt/browsers
export CI=true

# Visual testing
export PERCY_TOKEN=your-token
export CHROMATIC_PROJECT_TOKEN=your-token

# Accessibility
export AXE_CORE_VERSION=4.7.0
```

### Agent Customization

You can customize agent behavior in `.claude/config.yaml`:

```yaml
plugins:
  testing:
    unit:
      framework: jest
      coverage_threshold: 80
      test_match: ["**/*.test.js", "**/*.spec.js"]
    e2e:
      framework: playwright
      browsers: [chromium, firefox, webkit]
      retries: 2
    visual:
      provider: percy
      responsive_breakpoints: [375, 768, 1024, 1440]
    accessibility:
      standard: WCAG2AA
      include_best_practices: true
```

## 📖 Documentation

- [Frontend Testing Engineer Guide](./agents/frontend-testing-engineer.md)

## 🤝 Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](../../CONTRIBUTING.md) for guidelines.

## 📄 License

MIT © ClaudeAutoPM Team

## 🔗 Links

- [ClaudeAutoPM](https://github.com/rafeekpro/ClaudeAutoPM)
- [Plugin Documentation](https://github.com/rafeekpro/ClaudeAutoPM/blob/main/docs/PLUGIN-IMPLEMENTATION-PLAN.md)
- [npm Package](https://www.npmjs.com/package/@claudeautopm/plugin-testing)
- [Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
