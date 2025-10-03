---
name: bootstrap-scaffold
type: epic-management
category: ui
---

claude# Bootstrap UI Scaffold Command

Create a complete Bootstrap-based UI structure with responsive components and themes.

## Command
```
/ui:bootstrap-scaffold
```

## Purpose
Use the react-ui-expert agent (with framework=bootstrap) to create a complete Bootstrap application scaffold with modern components, responsive design, and customizable themes.

## Parameters
- `theme`: Theme variant (light, dark, corporate, minimal)
- `components`: Required components (navbar, cards, forms, modals)
- `responsive`: Breakpoints to support (sm, md, lg, xl, xxl)
- `features`: Additional features (dark-mode-toggle, form-validation, animations)

## Agent Usage
```
Use the react-ui-expert agent with framework=bootstrap to create a complete Bootstrap application scaffold.
```

## Expected Outcome
- Complete HTML structure with Bootstrap components
- Custom SCSS configuration with theme variables
- JavaScript for interactive components
- Responsive design implementation
- Form validation and accessibility features
- Dark mode toggle functionality

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


Task: Create Bootstrap dashboard with sidebar navigation, responsive cards grid, and contact forms
Agent: react-ui-expert
Parameters: framework=bootstrap, theme=corporate, components=navbar,sidebar,cards,forms,modals, responsive=all, features=dark-mode,validation
```

## Related Agents
- tailwindcss-expert: For utility-first alternative
- react-frontend-engineer: For React + Bootstrap integration
- react-ui-expert: Main agent for UI component architecture