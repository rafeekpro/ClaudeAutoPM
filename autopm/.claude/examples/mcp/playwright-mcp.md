---
name: playwright-mcp
command: npx
args: ["@playwright/mcp"]
env:
  PLAYWRIGHT_BROWSER: "${PLAYWRIGHT_BROWSER:-chromium}"
  PLAYWRIGHT_HEADLESS: "${PLAYWRIGHT_HEADLESS:-true}"
envFile: .claude/.env
description: Playwright MCP server for browser automation and E2E testing
category: testing
status: active
version: ">=1.0.0"
---

# Playwright MCP Server

## Description

The Playwright MCP Server enables browser automation, visual testing, and end-to-end testing capabilities through the Model Context Protocol. It provides direct browser control for testing web applications, capturing screenshots, and validating user interfaces.

## Features

- **Browser Automation**: Control Chromium, Firefox, and WebKit
- **Visual Testing**: Screenshot capture and comparison
- **E2E Testing**: Automated user flow testing
- **Accessibility Testing**: WCAG compliance checks
- **Performance Monitoring**: Page load metrics
- **Network Interception**: Mock API responses
- **Mobile Emulation**: Test responsive designs

## Configuration

### Environment Variables

- `PLAYWRIGHT_BROWSER`: Browser engine (chromium|firefox|webkit)
- `PLAYWRIGHT_HEADLESS`: Run in headless mode (true|false)
- `PLAYWRIGHT_SLOW_MO`: Slow down operations by ms
- `PLAYWRIGHT_TIMEOUT`: Default timeout in ms
- `PLAYWRIGHT_VIDEO`: Record videos (on|off|retain-on-failure)
- `PLAYWRIGHT_TRACE`: Record traces (on|off|retain-on-failure)

### Browser Options

```yaml
browsers:
  chromium:
    channel: chrome  # or 'msedge', 'chrome-beta'
    args:
      - --disable-dev-shm-usage
      - --no-sandbox
  firefox:
    firefoxUserPrefs:
      "media.navigator.streams.fake": true
  webkit:
    # Safari-specific options
```

## Usage Examples

### Basic Setup

```bash
# Enable the server
autopm mcp enable playwright-mcp

# Configure for headed mode during development
echo "PLAYWRIGHT_HEADLESS=false" >> .claude/.env
echo "PLAYWRIGHT_SLOW_MO=100" >> .claude/.env

# Sync configuration
autopm mcp sync
```

### Integration with Agents

Used extensively with:
- `frontend-testing-engineer` - For E2E test creation
- `react-frontend-engineer` - For UI testing
- `ux-design-expert` - For visual regression

### Test Examples

```javascript
// Navigation
await page.goto('https://example.com');

// Interaction
await page.click('button#submit');
await page.fill('input#email', 'test@example.com');

// Assertions
await expect(page).toHaveTitle('Example Site');
await expect(page.locator('.message')).toBeVisible();

// Screenshots
await page.screenshot({ path: 'screenshot.png' });
```

## MCP Commands

### Navigation
- `navigate(url)` - Go to URL
- `reload()` - Reload page
- `goBack()` - Navigate back
- `goForward()` - Navigate forward

### Interaction
- `click(selector)` - Click element
- `fill(selector, value)` - Fill input
- `select(selector, value)` - Select option
- `check(selector)` - Check checkbox
- `press(key)` - Press keyboard key

### Validation
- `screenshot(options)` - Capture screenshot
- `textContent(selector)` - Get text
- `isVisible(selector)` - Check visibility
- `waitForSelector(selector)` - Wait for element

## Visual Testing

### Screenshot Comparison

```yaml
visual_testing:
  baseline_dir: .playwright/baselines
  diff_dir: .playwright/diffs
  threshold: 0.2  # 20% difference threshold
  ignore_areas:
    - selector: .timestamp
    - selector: .dynamic-content
```

### Full Page Screenshots

```javascript
await page.screenshot({
  fullPage: true,
  animations: 'disabled',
  mask: ['.sensitive-data']
});
```

## Mobile Testing

### Device Emulation

```javascript
// iPhone 12
{
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone...)',
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true
}
```

### Responsive Testing

```yaml
viewports:
  - name: mobile
    width: 375
    height: 667
  - name: tablet
    width: 768
    height: 1024
  - name: desktop
    width: 1920
    height: 1080
```

## Performance Testing

### Metrics Collection

```javascript
const metrics = await page.metrics();
// Returns: JSHeapUsedSize, Timestamp, etc.

const performance = await page.evaluate(() =>
  JSON.stringify(window.performance.timing)
);
```

### Network Monitoring

```javascript
// Monitor requests
page.on('request', request => {
  console.log('Request:', request.url());
});

// Mock responses
await page.route('**/api/*', route => {
  route.fulfill({
    status: 200,
    body: JSON.stringify({ mocked: true })
  });
});
```

## Accessibility Testing

### ARIA Validation

```javascript
const accessibilityTree = await page.accessibility.snapshot();
```

### Keyboard Navigation

```javascript
await page.keyboard.press('Tab');
await page.keyboard.press('Enter');
```

## Debugging

### Debug Mode

```bash
# Enable debugging
export DEBUG=pw:api
export PWDEBUG=1

# Slow mode for debugging
export PLAYWRIGHT_SLOW_MO=1000
```

### Trace Viewer

```bash
# Record trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

## Best Practices

1. **Selectors**
   - Use data-testid attributes
   - Avoid fragile CSS selectors
   - Prefer user-facing attributes

2. **Waits**
   - Use auto-waiting
   - Avoid hard-coded delays
   - Wait for specific conditions

3. **Test Isolation**
   - Fresh browser context per test
   - Clean up test data
   - No test interdependencies

4. **Error Handling**
   - Comprehensive error messages
   - Screenshot on failure
   - Trace on failure

## Troubleshooting

### Common Issues

1. **Browser Launch Failed**
   - Install system dependencies
   - Check browser binaries
   - Verify permissions

2. **Timeout Errors**
   - Increase timeout values
   - Check network conditions
   - Verify element selectors

3. **Flaky Tests**
   - Add proper waits
   - Mock external dependencies
   - Use retry logic

## Security Considerations

1. **Credentials**
   - Never hardcode passwords
   - Use environment variables
   - Implement secure storage

2. **Cross-Origin**
   - Handle CORS properly
   - Use context isolation
   - Validate origins

3. **Data Privacy**
   - Mask sensitive data in screenshots
   - Clear cookies/storage
   - Use test data only

## Version History

- **1.0.0**: Initial MCP integration
- **1.1.0**: Added visual testing
- **1.2.0**: Mobile emulation support
- **1.3.0**: Performance metrics
- **1.4.0**: Accessibility testing

## Related Resources

- [Playwright Documentation](https://playwright.dev)
- [MCP Browser Control](https://modelcontextprotocol.org/browser)
- [E2E Test Engineer Agent](../agents/frameworks/frontend-testing-engineer.md)