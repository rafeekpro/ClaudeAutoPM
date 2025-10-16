---
allowed-tools: Task, Read, Write, Edit, MultiEdit, Bash, Glob, Grep
---

# React Application Scaffolding

Creates a complete React application with TypeScript and modern tooling.

**Usage**: `/react:app-scaffold [app-name] [--framework=vite|next] [--styling=tailwind|styled] [--state=zustand|redux]`

## Required Documentation Access

**MANDATORY:** Before scaffolding React applications, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/react/project-setup` - project setup best practices
- `mcp://context7/react/application-structure` - application structure best practices
- `mcp://context7/frontend/tooling` - tooling best practices
- `mcp://context7/react/best-practices` - best practices best practices

**Why This is Required:**
- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions


**Example**: `/react:app-scaffold dashboard-app --framework=vite --styling=tailwind --state=zustand`

**What this does**:
- Creates complete React application structure
- Sets up TypeScript configuration
- Implements styling system (Tailwind CSS or styled-components)
- Configures state management solution
- Adds testing setup (Vitest + React Testing Library)
- Creates Docker configuration for containerization
- Sets up ESLint + Prettier for code quality

Use the react-frontend-engineer agent to create a complete React application scaffold.

Requirements for the agent:
- Create modern project structure with proper React organization
- Include TypeScript configuration with strict mode
- Add component library structure with examples
- Implement state management setup
- Configure build tools (Vite or Next.js)
- Add comprehensive testing setup
- Include accessibility utilities and patterns
- Ensure responsive design setup
- Add proper error boundaries and loading states