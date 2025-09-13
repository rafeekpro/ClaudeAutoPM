# Visual Testing & UI Development Standards

> **CRITICAL**: All UI changes require visual verification and testing.

## Quick Visual Check Protocol

**IMMEDIATELY after implementing any front-end change:**

1. **Identify what changed** - Review modified components/pages
2. **Navigate to affected pages** - Use browser tools or MCP Playwright
3. **Verify design compliance** - Check against design system/style guide
4. **Validate feature implementation** - Ensure change fulfills requirements
5. **Check acceptance criteria** - Review requirements and context
6. **Capture evidence** - Screenshots at standard viewports:
   - Mobile: 375px
   - Tablet: 768px
   - Desktop: 1440px
7. **Check for errors** - Review browser console for JavaScript errors
8. **Test interactions** - Verify hover states, animations, transitions

## Visual Testing Requirements

### Pre-Commit Checklist

```bash
# Before committing any UI changes:
- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] Cross-browser testing completed (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility standards met (WCAG 2.1 AA)
- [ ] Dark mode compatibility (if applicable)
- [ ] Loading states implemented
- [ ] Error states designed
- [ ] Empty states handled
- [ ] Animation performance optimized (<60fps)
- [ ] Images optimized and lazy-loaded
- [ ] Touch targets minimum 44x44px
```

## Visual Regression Testing

### Implementation with Playwright

```javascript
// Visual regression test example
describe('Component Visual Tests', () => {
  it('should match visual snapshot', async () => {
    await page.goto('/component');
    const screenshot = await page.screenshot();
    expect(screenshot).toMatchImageSnapshot();
  });
  
  it('should handle responsive breakpoints', async () => {
    const viewports = [375, 768, 1440];
    for (const width of viewports) {
      await page.setViewport({ width, height: 800 });
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchImageSnapshot(`viewport-${width}`);
    }
  });
  
  it('should capture interaction states', async () => {
    // Normal state
    await page.screenshot({ path: 'button-normal.png' });
    
    // Hover state
    await page.hover('button');
    await page.screenshot({ path: 'button-hover.png' });
    
    // Focus state
    await page.focus('button');
    await page.screenshot({ path: 'button-focus.png' });
  });
});
```

## UI/UX Best Practices

### Core Principles

1. **Consistency**: Use established patterns and components
2. **Feedback**: Provide immediate visual feedback for interactions
3. **Progressive Enhancement**: Core functionality works without JavaScript
4. **Performance**: Optimize for perceived performance
5. **Accessibility**: Design for all users from the start

### CSS Architecture

```scss
// Follow BEM methodology
.block {}
.block__element {}
.block--modifier {}

// Component structure example
.card {
  &__header {}
  &__body {}
  &__footer {}
  
  &--featured {
    .card__header {}
  }
}
```

## Component Development Standards

### Component Checklist

```typescript
// Every UI component must have:
- [ ] Props validated with TypeScript/PropTypes
- [ ] Default props defined
- [ ] Error boundaries implemented
- [ ] Memoization applied where needed
- [ ] Accessibility attributes (ARIA)
- [ ] Keyboard navigation support
- [ ] RTL support considered
- [ ] Theme variables used
- [ ] Storybook story created
- [ ] Visual regression tests
- [ ] Unit tests written
```

## Accessibility Requirements

### WCAG 2.1 AA Compliance

```html
<!-- Accessibility checklist -->
- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Focus indicators visible
- [ ] Color contrast ratios met (4.5:1 normal, 3:1 large)
- [ ] Alt text for images
- [ ] Form labels associated
- [ ] Error messages announced
- [ ] Skip links implemented
- [ ] Page language declared
```

### Automated Accessibility Testing

```javascript
// Using axe-core for automated testing
import { axe } from '@axe-core/react';

describe('Accessibility', () => {
  it('should have no violations', async () => {
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

## Design System Compliance

### Required Elements

- **Colors**: Use only defined color tokens
- **Typography**: Use only defined type scales
- **Spacing**: Use only defined spacing units
- **Components**: Use existing components before creating new
- **Icons**: Use icon system, no inline SVGs
- **Animations**: Use defined timing functions

## Performance Metrics

### Visual Performance Targets

- First Contentful Paint (FCP): < 1.5s
- Largest Contentful Paint (LCP): < 2.5s
- Cumulative Layout Shift (CLS): < 0.1
- First Input Delay (FID): < 100ms
- Time to Interactive (TTI): < 5s

## Agent Integration

### Required Agents for Visual Testing

- **playwright-test-engineer**: Visual regression tests
- **playwright-mcp-frontend-tester**: Browser automation
- **react-frontend-engineer**: Component development
- **code-analyzer**: Review UI code quality

### Visual Testing Pipeline

```
1. Implement UI change following TDD
2. playwright-test-engineer → Create visual tests
3. Run visual regression tests at all breakpoints
4. code-analyzer → Verify accessibility
5. Capture screenshots for PR
6. Document visual changes
```

## Screenshot Documentation

### When to Include Screenshots

- ✅ Any UI/UX change
- ✅ New components or features
- ✅ Style or layout modifications
- ✅ Responsive design updates
- ✅ Animation or interaction changes
- ✅ Error or edge case handling

### Screenshot Requirements

- Show before and after states
- Include all responsive breakpoints
- Capture interaction states
- Annotate important changes
- Use consistent naming convention

## Success Metrics

- ✅ 100% visual test coverage for UI components
- ✅ Zero visual regressions in production
- ✅ All accessibility tests passing
- ✅ Performance budgets maintained
- ✅ Design system compliance verified
