---
name: tailwindcss-design-system
type: task-management
category: ui
---

# TailwindCSS Design System Command

Create a custom design system using TailwindCSS with utility classes and component patterns.

## Command
```
/ui:tailwind-system
```

## Purpose
Use the tailwindcss-expert agent to create a complete TailwindCSS design system with custom utilities, components, and theme configuration.

## Parameters
- `theme`: Color scheme (modern, minimal, vibrant, corporate)
- `utilities`: Custom utilities to generate (spacing, gradients, animations)
- `components`: Component patterns to create (buttons, cards, forms, layouts)
- `plugins`: TailwindCSS plugins to include (@tailwindcss/forms, @tailwindcss/typography)

## Agent Usage
```
Use the tailwindcss-expert agent to create a comprehensive TailwindCSS design system.
```

## Expected Outcome
- Custom tailwind.config.js with design tokens
- Component library with utility combinations
- Custom plugin for project-specific utilities
- Production-optimized build configuration
- Dark mode implementation
- Responsive design patterns

## Example Usage
```
## Required Documentation Access

**MANDATORY:** Before UI framework setup, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/ui/bootstrap` - bootstrap best practices
- `mcp://context7/ui/tailwind` - tailwind best practices
- `mcp://context7/frontend/design-systems` - design systems best practices
- `mcp://context7/css/frameworks` - frameworks best practices

**Why This is Required:**
- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions


Task: Create TailwindCSS design system with custom color palette, typography scale, and component library
Agent: tailwindcss-expert
Parameters: theme=modern, utilities=custom-spacing,gradients,animations, components=buttons,cards,forms, plugins=forms,typography
```

## Related Agents
- react-ui-expert: For component-based alternative
- react-frontend-engineer: For React + Tailwind integration