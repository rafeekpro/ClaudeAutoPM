# Agent Registry

This document provides the official registry of all agents used for ClaudeAutoPM project development.

## 🎯 Active Agents (8)

These are the agents actively used for developing and maintaining the ClaudeAutoPM framework itself - a JavaScript/Node.js/Bash project.

## Core Agents

### agent-manager

**Location**: `.claude/agents/core/agent-manager.md`

**Purpose**: Create, analyze, improve, and manage Claude Code agents. Expert in agent lifecycle management, documentation standards, and registry maintenance.

**When to Use**:
- Creating new agents for the framework
- Analyzing existing agents for improvements
- Managing agent documentation
- Validating agent registry consistency

**Example**:
```
@agent-manager create a new agent for GraphQL API development
@agent-manager analyze all testing agents for potential consolidation
```

---

### code-analyzer

**Location**: `.claude/agents/core/code-analyzer.md`

**Purpose**: Analyze code changes for potential bugs, trace logic flow across multiple files, or investigate suspicious behavior in the codebase.

**When to Use**:
- Review code changes for bugs
- Trace logic flow across files
- Pre-release validation
- Security scanning
- Performance analysis

**Example**:
```
@code-analyzer review recent changes for breaking changes
@code-analyzer trace the flow of this authentication function
```

---

### file-analyzer

**Location**: `.claude/agents/core/file-analyzer.md`

**Purpose**: Analyze and summarize file contents, particularly log files or verbose outputs, to extract key information and reduce context usage.

**When to Use**:
- Analyzing large log files
- Summarizing test output
- Extracting error patterns
- Reducing context for parent agents

**Example**:
```
@file-analyzer summarize test/logs/installation-failure.log
@file-analyzer extract error patterns from npm-debug.log
```

---

### test-runner

**Location**: `.claude/agents/core/test-runner.md`

**Purpose**: Run tests and analyze their results using the optimized test runner script with comprehensive logging and deep analysis.

**When to Use**:
- Running tests after code changes
- Debugging test failures
- Validating releases
- Performance benchmarking

**Example**:
```
@test-runner execute all tests with detailed failure analysis
@test-runner run authentication tests and investigate failures
```

---

## Language Agents

### bash-scripting-expert

**Location**: `.claude/agents/languages/bash-scripting-expert.md`

**Purpose**: Expert in Bash scripting including shell automation, system administration, CI/CD scripts, and complex pipelines. Specializes in POSIX compliance, error handling, and cross-platform scripts.

**When to Use**:
- Writing shell scripts for installation
- CI/CD script automation
- System administration tasks
- Cross-platform shell scripts
- Testing bash scripts with bats

**Example**:
```
@bash-scripting-expert create an installation script with error handling
@bash-scripting-expert optimize this shell script for POSIX compliance
```

---

### javascript-frontend-engineer

**Location**: `.claude/agents/languages/javascript-frontend-engineer.md`

**Purpose**: Modern JavaScript/TypeScript frontend development. Specializes in vanilla JS, TypeScript, modern ECMAScript features, browser APIs, and frontend build tools.

**When to Use**:
- Creating responsive web applications
- DOM manipulation
- Async operations
- Frontend performance optimization
- Modern JavaScript features

**Example**:
```
@javascript-frontend-engineer create a CLI interactive prompt system
@javascript-frontend-engineer optimize this JavaScript code for performance
```

---

### nodejs-backend-engineer

**Location**: `.claude/agents/languages/nodejs-backend-engineer.md`

**Purpose**: Node.js backend development including Express, Fastify, and other Node.js frameworks. Specializes in CLI tools, REST APIs, and server-side TypeScript.

**When to Use**:
- Node.js CLI development (main use case for AutoPM)
- Package management and npm
- Node.js performance optimization
- File system operations
- Process management

**Example**:
```
@nodejs-backend-engineer create a CLI command with yargs
@nodejs-backend-engineer optimize this Node.js installer script
```

---

## Testing Agents

### e2e-test-engineer

**Location**: `.claude/agents/testing/e2e-test-engineer.md`

**Purpose**: End-to-end testing with Playwright and other testing frameworks. Expert in test automation, browser testing, and integration testing.

**When to Use**:
- Writing E2E tests
- Integration testing
- Test automation
- Cross-browser testing
- CI/CD test integration

**Example**:
```
@e2e-test-engineer create E2E tests for the installation flow
@e2e-test-engineer debug this failing Playwright test
```

---

## Usage Notes

1. **Technology Focus**: All agents are optimized for JavaScript/Node.js/Bash development
2. **Project-Specific**: These agents are specifically for developing the ClaudeAutoPM framework, not for using it
3. **Self-Maintenance**: This project uses its own framework capabilities
4. **TDD First**: All changes follow Test-Driven Development methodology

## What We DON'T Need

Since ClaudeAutoPM is a JavaScript/Node.js CLI framework, we don't need:
- Cloud infrastructure agents (AWS, GCP, Azure)
- Database agents (PostgreSQL, MongoDB, etc.)
- Container orchestration (Kubernetes, Docker Swarm)
- Web framework agents (React, Vue, etc.) - unless building admin UI
- DevOps tools (except what's needed for GitHub Actions)

These are available in `autopm/.claude/agents/` for framework users.

## Registry Maintenance

**Last Updated**: 2025-10-02
**Active Agents**: 8
**Total Files**: 11 (including README files)

For adding new agents or modifying existing ones, use:
```
@agent-manager review and update agent registry
```
