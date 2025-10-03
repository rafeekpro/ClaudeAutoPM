---
allowed-tools: Task, Read, Write, Edit, MultiEdit, Bash, Glob, Grep
---

# Playwright Test Scaffolding

Creates Playwright test suite with Page Object Model.

**Usage**: `/playwright:test-scaffold [app-name] [--framework=react|vue|angular] [--auth=yes|no]`

**Example**: `/playwright:test-scaffold my-app --framework=react --auth=yes`

**What this does**:
- Creates Playwright configuration
- Sets up Page Object Model structure
- Generates test helpers and fixtures
- Configures browsers and devices
- Adds visual regression setup
- Creates CI/CD integration scripts

Use the frontend-testing-engineer agent to create comprehensive E2E test suite.