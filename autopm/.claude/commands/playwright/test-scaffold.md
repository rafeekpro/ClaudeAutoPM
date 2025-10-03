---
allowed-tools: Task, Read, Write, Edit, MultiEdit, Bash, Glob, Grep
---

# Playwright Test Scaffolding

Creates Playwright test suite with Page Object Model.

**Usage**: `/playwright:test-scaffold [app-name] [--framework=react|vue|angular] [--auth=yes|no]`

## Required Documentation Access

**MANDATORY:** Before scaffolding Playwright tests, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/playwright/scaffolding` - scaffolding best practices
- `mcp://context7/testing/e2e` - e2e best practices
- `mcp://context7/testing/page-objects` - page objects best practices
- `mcp://context7/playwright/best-practices` - best practices best practices

**Why This is Required:**
- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions


**Example**: `/playwright:test-scaffold my-app --framework=react --auth=yes`

**What this does**:
- Creates Playwright configuration
- Sets up Page Object Model structure
- Generates test helpers and fixtures
- Configures browsers and devices
- Adds visual regression setup
- Creates CI/CD integration scripts

Use the frontend-testing-engineer agent to create comprehensive E2E test suite.