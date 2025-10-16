# UI Framework Agent Rules

## MANDATORY BEHAVIORS

### 1. Component-First Development

- Always check existing components before creating new ones
- Reuse and extend existing patterns
- Follow the framework's component composition philosophy
- Never mix multiple UI frameworks in the same project

### 2. Theme Consistency

- Always use the theme/design system for styling
- Never use inline styles when theme tokens exist
- Maintain consistent spacing, colors, and typography
- Follow the framework's theming patterns

### 3. Accessibility Standards

- Every interactive element must be keyboard accessible
- Maintain proper ARIA labels and roles
- Ensure sufficient color contrast (WCAG 2.1 AA minimum)
- Test with screen readers when implementing complex interactions

### 4. Performance Optimization

- Implement code splitting for large component libraries
- Use lazy loading for heavy components
- Optimize bundle size with tree-shaking
- Monitor and minimize re-renders

### 5. Responsive Design

- Mobile-first approach for all layouts
- Use framework's breakpoint system consistently
- Test on multiple viewport sizes
- Ensure touch-friendly interactions on mobile

## PROHIBITED ACTIONS

### Never

- Mix CSS frameworks (e.g., Bootstrap with Tailwind)
- Use deprecated component APIs
- Ignore framework conventions for custom solutions
- Create inaccessible UI patterns
- Use hard-coded colors/spacing instead of theme values
- Implement custom form validation when framework provides it
- Build custom components when framework components exist

## CONTEXT OPTIMIZATION

### Data Return Limits

- Return maximum 20% of analyzed component code
- Summarize theme configurations instead of full dumps
- Focus on changed/added components only
- Use references to existing patterns rather than duplicating

### Search Patterns

- Search for existing similar components first
- Check theme configuration before implementing styles
- Review framework documentation for best practices
- Look for community patterns and examples

## FRAMEWORK-SPECIFIC RULES

### Material-UI (MUI)

- Always use sx prop or styled() for styling
- Leverage MUI System utilities
- Follow Material Design principles
- Use ProComponents for complex features

### Chakra UI

- Use style props over CSS
- Leverage Chakra hooks for common patterns
- Follow the modular component approach
- Maintain color mode compatibility

### Ant Design

- Use ConfigProvider for global configuration
- Leverage ProComponents for enterprise features
- Follow Ant Design patterns
- Maintain form validation consistency

### Bootstrap

- Use utility classes over custom CSS
- Follow Bootstrap's grid system
- Maintain responsive breakpoints
- Use Bootstrap variables for customization

### Tailwind CSS

- Follow utility-first methodology
- Use @apply sparingly
- Maintain consistent class ordering
- Leverage Tailwind config for customization

## TESTING REQUIREMENTS

### Component Testing

- Test all interactive components
- Verify accessibility with automated tools
- Test responsive behavior
- Validate theme switching

### Visual Testing

- Capture screenshots for visual regression
- Test dark/light mode variations
- Verify responsive layouts
- Check cross-browser compatibility

## INTEGRATION RULES

### With React Frontend Engineer

- Coordinate on component architecture
- Share state management patterns
- Align on TypeScript interfaces
- Maintain consistent file structure

### With Playwright Test Engineer

- Provide stable selectors for testing
- Document component APIs
- Ensure testability of interactions
- Support visual regression testing

## DOCUMENTATION STANDARDS

### Component Documentation

- Document all props with TypeScript
- Provide usage examples
- Include accessibility notes
- Note performance considerations

### Theme Documentation

- Document custom theme values
- Explain design decisions
- Provide color/spacing scales
- Include responsive breakpoints
