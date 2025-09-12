# CLAUDE.md

> Think carefully and implement the most concise solution that changes as little code as possible.

## ⚙️ TRADITIONAL DEVELOPMENT WORKFLOW

This project uses a traditional development approach focused on native tooling and direct local execution.

### 🏠 Development Environment

- **Local execution** - Run code directly on your machine
- **Native tooling** - Use language-specific tools (npm, pip, etc.)
- **System dependencies** - Install requirements locally
- **Traditional testing** - Standard test runners and frameworks

### 🔧 Getting Started

1. **Install dependencies locally**
   ```bash
   # Node.js projects
   npm install
   
   # Python projects  
   pip install -r requirements.txt
   
   # Other languages as appropriate
   ```

2. **Run development server**
   ```bash
   # Use standard development commands
   npm run dev
   python app.py
   # etc.
   ```

3. **Run tests**
   ```bash
   # Use native test runners
   npm test
   pytest
   # etc.
   ```

### 📋 Development Rules

- Use native language tools and package managers
- Install dependencies on local system
- Run tests using standard frameworks
- Deploy using traditional methods (not containerized)

## CRITICAL RULE FILES

All rule files in `.claude/rules/` define mandatory behaviors and must be followed:

### Core Development Rules

- **tdd-enforcement.md** - Test-Driven Development cycle (RED-GREEN-REFACTOR). HIGHEST PRIORITY for all code changes
- **naming-conventions.md** - Naming standards, code quality requirements, and prohibited patterns
- **development-workflow.md** - Development patterns, search-before-create, and best practices

### Quality Standards

**MANDATORY**: All code MUST pass formatters and linters before commit:

- **Python**: Must pass `black` formatter and `ruff` linter
- **JavaScript/TypeScript**: Must pass `prettier` and `eslint`
- **Markdown**: Must pass `markdownlint`
- **Other languages**: Use language-specific standard tools

Always run formatters and linters BEFORE marking any task as complete.

## AGENT SELECTION GUIDANCE

Use appropriate agents for traditional development:

#### javascript-frontend-engineer, nodejs-backend-engineer
- Modern JS/TS, ES6+, browser APIs
- Node.js backends, Express, NestJS
- Build tools, testing frameworks

#### python-backend-engineer
- FastAPI, Flask, Django development
- API design and implementation
- Traditional Python tooling (pip, virtualenv)

#### bash-scripting-expert
- Shell automation, system administration
- Build scripts, deployment automation
- POSIX compliance, cross-platform

### UI Framework Agents

Choose based on project needs:

#### react-frontend-engineer
- React, TypeScript, Next.js applications
- Component architecture and state management
- Traditional build tools (webpack, vite)

## TDD PIPELINE FOR ALL IMPLEMENTATIONS

### Mandatory Test-Driven Development Cycle

Every implementation MUST follow:

1. **RED Phase**: Write failing test first
2. **GREEN Phase**: Make test pass with minimum code
3. **REFACTOR Phase**: Improve code while tests stay green

## ERROR HANDLING

- **Fail fast** for critical configuration errors
- **User-friendly messages** for common issues
- **Graceful degradation** when services unavailable
- **Comprehensive logging** for debugging

## Tone and Behavior

- Criticism is welcome. Please tell me when I am wrong or mistaken
- Please tell me if there is a better approach than the one I am taking
- Please tell me if there is a relevant standard or convention that I appear to be unaware of
- Be skeptical and concise
- Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.

## ABSOLUTE RULES

- NO PARTIAL IMPLEMENTATION
- NO CODE DUPLICATION (always search first)
- IMPLEMENT TEST FOR EVERY FUNCTION
- NO CHEATER TESTS (tests must be meaningful)
- Follow all rules defined in `.claude/rules/` without exception