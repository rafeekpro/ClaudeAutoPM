---
title: MCP Servers
description: Guide to integrating Model Context Protocol (MCP) servers with ClaudeAutoPM for enhanced capabilities.
---

# MCP Servers

Model Context Protocol (MCP) servers extend ClaudeAutoPM with additional capabilities. This guide covers the integration of Context7, Playwright, filesystem servers, and other MCP tools.

## What is MCP?

The Model Context Protocol (MCP) is a standardized way for AI assistants to communicate with external tools and data sources. MCP servers provide:

- **Live documentation** - Current API docs, not training data
- **External tools** - Browser automation, file operations
- **Data access** - Databases, cloud services, APIs
- **Context sharing** - Between agents and sessions

## Available MCP Servers

### Context7

Context7 provides live documentation access for current best practices.

**Purpose**: Query up-to-date documentation instead of relying on training data.

**Why Use Context7**:
- Training data becomes stale over time
- APIs change between versions
- Best practices evolve
- Breaking changes are not reflected in older models

**Usage**:
```bash
# Query documentation
mcp://context7/react/hooks

# Technology-specific docs
mcp://context7/fastapi/endpoints
mcp://context7/kubernetes/deployments
mcp://context7/aws/lambda
```

**Integration with Commands**:

Every command in ClaudeAutoPM includes required Context7 queries:

```markdown
**Documentation Queries:**
- `mcp://context7/agile/epic-decomposition` - Epic breakdown best practices
- `mcp://context7/agile/task-sizing` - Task estimation guidance
```

**Setup**:
```bash
# Configure Context7 integration
/mcp:context-setup --server=context7
```

### Playwright MCP

Browser automation and testing capabilities.

**Purpose**: Automate browser interactions for testing and scraping.

**Capabilities**:
- Navigate web pages
- Fill forms and click elements
- Take screenshots
- Execute JavaScript
- Handle authentication flows

**Usage Examples**:

```bash
# Scaffold Playwright tests for a feature
/playwright:test-scaffold user-authentication

# Use with e2e-test-engineer agent
@e2e-test-engineer create Playwright tests for the checkout flow
```

**Test Generation**:
```javascript
// Generated test example
import { test, expect } from '@playwright/test';

test('user can complete checkout', async ({ page }) => {
  await page.goto('/cart');
  await page.click('[data-testid="checkout-button"]');
  await page.fill('#email', 'user@example.com');
  await page.click('[data-testid="submit"]');
  await expect(page).toHaveURL('/confirmation');
});
```

### Filesystem MCP

Enhanced file operations with validation.

**Purpose**: Structured file operations with safety checks.

**Capabilities**:
- Read files with validation
- Write with backup creation
- Atomic file operations
- Directory traversal safety

**Usage**:
```bash
# Configure filesystem server
/mcp:context-setup --server=filesystem
```

### Custom MCP Servers

You can integrate additional MCP servers for specific needs.

**Adding a Server**:
```bash
# Find available servers
mcp-find "database"

# Add a server
mcp-add postgres-mcp

# Configure the server
mcp-config-set postgres-mcp {
  "host": "localhost",
  "port": 5432,
  "database": "myapp"
}
```

## MCP Configuration

### Setup Commands

```bash
# Set up MCP context sharing
/mcp:context-setup --server=context7 --pool-name=project-context

# Configure specific agents for MCP
/mcp:context-setup --agents=python-backend-engineer,react-ui-expert

# Set context size limits
/mcp:context-setup --max-size=50MB
```

### Documentation Refresh

Keep documentation caches current:

```bash
# Refresh all documentation
/mcp:docs-refresh

# Refresh for specific technology
/mcp:docs-refresh --tech=fastapi

# Force refresh ignoring cache
/mcp:docs-refresh --force

# Validate documentation integrity
/mcp:docs-refresh --validate
```

### Context Pool Management

Share context between agents:

```bash
# Create a shared context pool
/mcp:context-setup --pool-name=feature-auth --agents=all

# Update pool contents
/context:update

# Prime context for new session
/context:prime
```

## Context7 Deep Dive

### Querying Documentation

Context7 queries follow this pattern:
```
mcp://context7/<technology>/<topic>
```

**Common Queries**:

| Technology | Query Example | What You Get |
|------------|---------------|--------------|
| React | `mcp://context7/react/hooks` | Current hooks API |
| FastAPI | `mcp://context7/fastapi/dependencies` | Dependency injection docs |
| AWS | `mcp://context7/aws/lambda` | Lambda best practices |
| Kubernetes | `mcp://context7/kubernetes/pods` | Pod configuration |
| PostgreSQL | `mcp://context7/postgresql/indexes` | Indexing strategies |

### Agent Integration

Agents automatically query Context7 before implementation:

```bash
@python-backend-expert create a FastAPI endpoint

# Agent queries:
# mcp://context7/fastapi/routes
# mcp://context7/fastapi/dependencies
# mcp://context7/pydantic/models
```

### Enforcement

ClaudeAutoPM enforces Context7 usage:

1. **Pre-command hooks** verify required queries
2. **Pre-agent hooks** ensure documentation is queried
3. **Validation rules** block implementations without Context7

You will see feedback like:
```
Context7 Enforcement Active

Command: /pm:epic-decompose
Querying Context7 for required documentation...

   -> mcp://context7/agile/epic-decomposition
   -> mcp://context7/agile/task-sizing

Context7 queries complete
Key findings: INVEST criteria for stories, 1-3 day task sizing

Proceeding with epic decomposition...
```

## Playwright Deep Dive

### Test Scaffolding

Generate test structure for a feature:

```bash
/playwright:test-scaffold user-dashboard
```

This creates:
```
tests/
  e2e/
    user-dashboard/
      dashboard.spec.ts
      fixtures/
        dashboard.fixture.ts
      pages/
        dashboard.page.ts
```

### Page Object Pattern

Generated page objects:

```typescript
// pages/dashboard.page.ts
import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly userMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.getByTestId('welcome');
    this.userMenu = page.getByRole('button', { name: 'User menu' });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async openUserMenu() {
    await this.userMenu.click();
  }
}
```

### Test Fixtures

Reusable test setup:

```typescript
// fixtures/dashboard.fixture.ts
import { test as base } from '@playwright/test';
import { DashboardPage } from '../pages/dashboard.page';

type Fixtures = {
  dashboardPage: DashboardPage;
};

export const test = base.extend<Fixtures>({
  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await use(dashboardPage);
  },
});
```

### Running Tests

```bash
# Run all Playwright tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/user-dashboard/

# Run with UI mode
npx playwright test --ui

# Generate test report
npx playwright show-report
```

## Custom Configuration

### MCP Server Configuration

Create a configuration file at `.claude/mcp-config.json`:

```json
{
  "servers": {
    "context7": {
      "enabled": true,
      "cache_ttl": 3600,
      "priority": "high"
    },
    "playwright": {
      "enabled": true,
      "browser": "chromium",
      "headless": true
    },
    "filesystem": {
      "enabled": true,
      "root": ".",
      "allowed_extensions": [".js", ".ts", ".py", ".md"]
    }
  },
  "context_pools": {
    "default": {
      "max_size": "100MB",
      "agents": ["all"]
    },
    "testing": {
      "max_size": "50MB",
      "agents": ["test-runner", "e2e-test-engineer"]
    }
  }
}
```

### Environment Variables

```bash
# Context7 configuration
export CONTEXT7_API_KEY="your-api-key"
export CONTEXT7_CACHE_DIR=".claude/context7-cache"

# Playwright configuration
export PLAYWRIGHT_BROWSERS_PATH=".playwright"
export PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=0
```

## MCP Manager Agent

The `@mcp-manager` agent helps configure MCP integrations:

```bash
# Set up MCP for project
@mcp-manager configure Context7 for this Python/FastAPI project

# Troubleshoot MCP issues
@mcp-manager diagnose Context7 connection issues

# Optimize MCP performance
@mcp-manager optimize context pool configuration
```

## Best Practices

### Context7 Usage

1. **Always query before implementing** - Never rely solely on training data
2. **Query specific topics** - More specific queries get better results
3. **Verify against current docs** - Especially for API signatures
4. **Update caches regularly** - Use `/mcp:docs-refresh` periodically

### Playwright Integration

1. **Use page objects** - Keep tests maintainable
2. **Create fixtures** - Reuse common setup
3. **Test critical paths** - Focus on user journeys
4. **Run in CI** - Automate test execution

### Performance Optimization

1. **Enable caching** - Reduce repeated queries
2. **Set appropriate pool sizes** - Balance memory and performance
3. **Use specific servers** - Only enable what you need
4. **Monitor context usage** - Track agent efficiency

## Troubleshooting

### Context7 Issues

**Connection Failed**:
```bash
# Check API key
echo $CONTEXT7_API_KEY

# Verify network access
curl https://api.context7.dev/health

# Clear cache and retry
rm -rf .claude/context7-cache
/mcp:docs-refresh --force
```

**Stale Documentation**:
```bash
# Force refresh
/mcp:docs-refresh --tech=fastapi --force

# Validate cache
/mcp:docs-refresh --validate
```

### Playwright Issues

**Browser Not Found**:
```bash
# Install browsers
npx playwright install

# Install specific browser
npx playwright install chromium
```

**Test Timeout**:
```typescript
// Increase timeout in config
export default defineConfig({
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
});
```

### General MCP Issues

**Server Not Available**:
```bash
# Check server status
mcp-status context7

# Restart server
mcp-restart context7

# Check logs
mcp-logs context7
```

## Next Steps

- Review [Best Practices](./best-practices) for optimal MCP usage
- Explore the [Agent Registry](/agents/registry) for MCP-enabled agents
- Check [Configuration Reference](/reference/configuration) for detailed options
