claude# Bootstrap UI Scaffold Command

Create a complete Bootstrap-based UI structure with responsive components and themes.

## Command
```
/ui:bootstrap-scaffold
```

## Purpose
Use the bootstrap-ui-expert agent to create a complete Bootstrap application scaffold with modern components, responsive design, and customizable themes.

## Parameters
- `theme`: Theme variant (light, dark, corporate, minimal)
- `components`: Required components (navbar, cards, forms, modals)
- `responsive`: Breakpoints to support (sm, md, lg, xl, xxl)
- `features`: Additional features (dark-mode-toggle, form-validation, animations)

## Agent Usage
```
Use the bootstrap-ui-expert agent to create a complete Bootstrap application scaffold.
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
Task: Create Bootstrap dashboard with sidebar navigation, responsive cards grid, and contact forms
Agent: bootstrap-ui-expert
Parameters: theme=corporate, components=navbar,sidebar,cards,forms,modals, responsive=all, features=dark-mode,validation
```

## Related Agents
- tailwindcss-expert: For utility-first alternative
- react-frontend-engineer: For React + Bootstrap integration