# Agent Registry

This document provides the official registry of all agents for inclusion in the system prompt.

## 🚀 Optimization Update (v1.1.0)

### Summary of Changes
- **Reduced agent count from 50+ to ~35** (Phase 1 complete)
- **Consolidated similar agents** into parameterized versions
- **Unified coordination rules** for better efficiency
- **Maintained all functionality** through parameters

### Key Consolidations
1. **UI Frameworks**: 4 agents → 1 `react-ui-expert`
2. **Python Backend**: 3 agents → 1 `python-backend-expert`
3. **Docker**: 3 agents → 1 `docker-containerization-expert`
4. **E2E Testing**: 2 agents → 1 `e2e-test-engineer`

### Migration Guide
Legacy agent names will continue to work with deprecation warnings.
Parameters are automatically inferred from legacy agent names.

## Core Agents

### agent-manager

**Location**: `.claude/agents/core/agent-manager.md`
**Description**: Use this agent for creating, analyzing, improving, and managing other Claude Code agents. Expert in agent lifecycle management, documentation standards, and registry maintenance.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### file-analyzer

**Location**: `.claude/agents/core/file-analyzer.md`
**Description**: Use this agent when you need to analyze and summarize file contents, particularly log files or verbose outputs, to extract key information and reduce context usage.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Search, Task, Agent
**Status**: Active

### code-analyzer

**Location**: `.claude/agents/core/code-analyzer.md`
**Description**: Use this agent when you need to analyze code changes for potential bugs, trace logic flow across multiple files, or investigate suspicious behavior in the codebase.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Search, Task, Agent
**Status**: Active

### test-runner

**Location**: `.claude/agents/core/test-runner.md`
**Description**: Use this agent when you need to run tests and analyze their results with comprehensive log analysis and actionable insights.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Search, Task, Agent
**Status**: Active

### parallel-worker

**Location**: `.claude/agents/core/parallel-worker.md`
**Description**: Executes parallel work streams in a git worktree for coordinated multi-agent execution.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, BashOutput, KillBash, Search, Task, Agent
**Status**: Active

### mcp-manager

**Location**: `.claude/agents/core/mcp-manager.md`
**Description**: Use this agent for managing Model Context Protocol (MCP) servers including creation, validation, lifecycle management, and integration.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

## Framework Agents

### react-ui-expert (NEW - Consolidated)

**Location**: `.claude/agents/frameworks/react-ui-expert.md`
**Description**: Unified React UI component development specialist supporting MUI, Chakra, Ant Design, Bootstrap, and headless UI libraries. Use parameters to specify framework.
**Parameters**: `framework: [mui|chakra|antd|bootstrap|headless]`, `style_system: [css-in-js|tailwind|css-modules]`
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active
**Replaces**: mui-react-expert, chakra-ui-expert, antd-react-expert, bootstrap-ui-expert

### mui-react-expert (DEPRECATED)

**Status**: Deprecated - Use `react-ui-expert` with `framework: mui`

### chakra-ui-expert (DEPRECATED)

**Status**: Deprecated - Use `react-ui-expert` with `framework: chakra`

### antd-react-expert (DEPRECATED)

**Status**: Deprecated - Use `react-ui-expert` with `framework: antd`

### react-frontend-engineer

**Location**: `.claude/agents/frameworks/react-frontend-engineer.md`
**Description**: Use this agent for React frontend development, refactoring, or optimization using modern tooling and frameworks.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### ux-design-expert

**Location**: `.claude/agents/frameworks/ux-design-expert.md`
**Description**: Use this agent for UX/UI design analysis, user experience optimization, accessibility audits, and design system creation. Expert in user research, information architecture, and usability testing.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### bootstrap-ui-expert (DEPRECATED)

**Status**: Deprecated - Use `react-ui-expert` with `framework: bootstrap`

### tailwindcss-expert

**Location**: `.claude/agents/frameworks/tailwindcss-expert.md`
**Description**: Use this agent for TailwindCSS utility-first styling including responsive design, custom components, and design systems.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### fastapi-backend-engineer (DEPRECATED)

**Status**: Deprecated - Use `python-backend-expert` with `framework: fastapi`

### flask-backend-engineer (DEPRECATED)

**Status**: Deprecated - Use `python-backend-expert` with `framework: flask`

### e2e-test-engineer (NEW - Consolidated)

**Location**: `.claude/agents/frameworks/e2e-test-engineer.md`
**Description**: Unified E2E test engineering specialist covering Playwright automation, MCP browser control, visual testing, and comprehensive test strategies.
**Parameters**: `test_framework: [playwright|cypress]`, `browser_control: [standard|mcp-enhanced]`, `test_types: [functional|visual|accessibility]`
**Tools**: Bash, Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Task, Agent, MCP tools when available
**Status**: Active
**Replaces**: playwright-test-engineer, playwright-mcp-frontend-tester

### playwright-test-engineer (DEPRECATED)

**Status**: Deprecated - Use `e2e-test-engineer` with `test_framework: playwright`

### playwright-mcp-frontend-tester (DEPRECATED)

**Status**: Deprecated - Use `e2e-test-engineer` with `browser_control: mcp-enhanced`

### nats-messaging-expert

**Location**: `.claude/agents/frameworks/nats-messaging-expert.md`
**Description**: Use this agent for NATS messaging system including pub/sub, request/reply, and queue groups.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

## Language Agents

### python-backend-expert (ENHANCED)

**Location**: `.claude/agents/languages/python-backend-expert.md`
**Description**: Comprehensive Python backend specialist supporting FastAPI, Flask, Django, and pure Python. Handles all Python backend development needs.
**Parameters**: `framework: [fastapi|flask|django|none]`, `async_support: boolean`, `database: [postgresql|mongodb|redis]`
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active
**Replaces**: fastapi-backend-engineer, flask-backend-engineer

### javascript-frontend-engineer

**Location**: `.claude/agents/languages/javascript-frontend-engineer.md`
**Description**: Use this agent for modern JavaScript/TypeScript frontend development with vanilla JS and browser APIs.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### nodejs-backend-engineer

**Location**: `.claude/agents/languages/nodejs-backend-engineer.md`
**Description**: Use this agent for Node.js backend development including Express, Fastify, NestJS, and other Node.js frameworks.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### bash-scripting-expert

**Location**: `.claude/agents/languages/bash-scripting-expert.md`
**Description**: Use this agent for Bash scripting including shell automation, system administration, CI/CD scripts, and complex pipelines.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

## Cloud Agents

### gcp-cloud-architect

**Location**: `.claude/agents/cloud/gcp-cloud-architect.md`
**Description**: Use this agent when you need to design, deploy, or manage Google Cloud Platform infrastructure.
**Tools**: Bash, Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Task, Agent
**Status**: Active

### azure-cloud-architect

**Location**: `.claude/agents/cloud/azure-cloud-architect.md`
**Description**: Use this agent when you need to design, deploy, or manage Microsoft Azure cloud infrastructure.
**Tools**: Bash, Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Task, Agent
**Status**: Active

### aws-cloud-architect

**Location**: `.claude/agents/cloud/aws-cloud-architect.md`
**Description**: Use this agent when you need to design, deploy, or manage Amazon Web Services cloud infrastructure.
**Tools**: Bash, Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Task, Agent
**Status**: Active

### kubernetes-orchestrator

**Location**: `.claude/agents/cloud/kubernetes-orchestrator.md`
**Description**: Use this agent when you need to design, deploy, or manage Kubernetes clusters and workloads.
**Tools**: Bash, Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Task, Agent
**Status**: Active

### terraform-infrastructure-expert

**Location**: `.claude/agents/cloud/terraform-infrastructure-expert.md`
**Description**: Use this agent for Terraform infrastructure as code including module development, state management, and multi-cloud deployments.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### gcp-cloud-functions-engineer

**Location**: `.claude/agents/cloud/gcp-cloud-functions-engineer.md`
**Description**: Use this agent for Google Cloud Functions development including HTTP functions, event-driven functions, and serverless architectures.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

## DevOps Agents

### github-operations-specialist

**Location**: `.claude/agents/devops/github-operations-specialist.md`
**Description**: Use this agent when you need to manage GitHub repositories, workflows, issues, pull requests, or implement DevOps practices with GitHub Actions.
**Tools**: Bash, Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Task, Agent
**Status**: Active

### azure-devops-specialist

**Location**: `.claude/agents/devops/azure-devops-specialist.md`
**Description**: Use this agent when you need to integrate with Azure DevOps services including work items, pipelines, boards, and repositories.
**Tools**: Bash, Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Task, Agent
**Status**: Active

### mcp-context-manager

**Location**: `.claude/agents/devops/mcp-context-manager.md`
**Description**: Use this agent when you need to integrate with Model Context Protocol (MCP) servers, manage context sharing between agents, or work with context7 configurations.
**Tools**: Bash, Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Task, Agent
**Status**: Active

### docker-containerization-expert (NEW - Consolidated)

**Location**: `.claude/agents/devops/docker-containerization-expert.md`
**Description**: Comprehensive Docker specialist covering Dockerfile optimization, Compose orchestration, and development environments.
**Parameters**: `use_case: [development|production]`, `orchestration: [compose|swarm|kubernetes]`
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active
**Replaces**: docker-expert, docker-compose-expert, docker-development-orchestrator

### docker-expert (DEPRECATED)

**Status**: Deprecated - Use `docker-containerization-expert`

### docker-compose-expert (DEPRECATED)

**Status**: Deprecated - Use `docker-containerization-expert` with focus on compose

### docker-development-orchestrator (DEPRECATED)

**Status**: Deprecated - Use `docker-containerization-expert` with `use_case: development`

### traefik-proxy-expert

**Location**: `.claude/agents/devops/traefik-proxy-expert.md`
**Description**: Use this agent for Traefik reverse proxy configuration including load balancing, SSL termination, service discovery, and routing.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### ssh-operations-expert

**Location**: `.claude/agents/devops/ssh-operations-expert.md`
**Description**: Use this agent for SSH operations including remote server management, secure connections, key management, and automation.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

## Database Agents

### postgresql-expert

**Location**: `.claude/agents/databases/postgresql-expert.md`
**Description**: Use this agent for PostgreSQL database design, optimization, and management including advanced features and performance tuning.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### mongodb-expert

**Location**: `.claude/agents/databases/mongodb-expert.md`
**Description**: Use this agent for MongoDB database design, aggregation pipelines, and performance optimization.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### bigquery-expert

**Location**: `.claude/agents/databases/bigquery-expert.md`
**Description**: Use this agent for BigQuery data warehouse design, SQL optimization, and analytics engineering.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### cosmosdb-expert

**Location**: `.claude/agents/databases/cosmosdb-expert.md`
**Description**: Use this agent for Azure Cosmos DB design and optimization across all APIs.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### redis-expert

**Location**: `.claude/agents/databases/redis-expert.md`
**Description**: Use this agent for Redis caching, pub/sub messaging, and data structure operations.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

## Data Engineering Agents

### airflow-orchestration-expert

**Location**: `.claude/agents/data/airflow-orchestration-expert.md`
**Description**: Use this agent for Apache Airflow workflow orchestration including DAG development, task dependencies, and scheduling.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### kedro-pipeline-expert

**Location**: `.claude/agents/data/kedro-pipeline-expert.md`
**Description**: Use this agent for Kedro data pipeline development including project structure, data catalog, and pipeline orchestration.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### langgraph-workflow-expert

**Location**: `.claude/agents/data/langgraph-workflow-expert.md`
**Description**: Use this agent for LangGraph workflow orchestration including state machines, conditional routing, and multi-agent collaboration.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

## AI/API Agents

### gemini-api-expert

**Location**: `.claude/agents/cloud/gemini-api-expert.md`
**Description**: Use this agent for Google Gemini API integration including text generation, multimodal inputs, function calling, and safety controls.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### openai-python-expert

**Location**: `.claude/agents/cloud/openai-python-expert.md`
**Description**: Use this agent for OpenAI Python SDK integration including GPT models, embeddings, fine-tuning, and assistants API.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

## Registry Format for System Prompt

When adding agents to the main system prompt, use this format:

```
- agent-name: Use this agent for [primary purpose]. Expert in [key technologies]. Specializes in [specializations]. (Tools: [tool-list])
```

## Adding New Agents

To add a new agent, follow the agent-manager's comprehensive checklist:

1. Create agent documentation in appropriate category
2. Add rules if needed
3. Create command patterns
4. Update this registry
5. Update CLAUDE.md
6. Add to system prompt
7. Test agent invocation

## Deprecation Notice

Agents marked as deprecated will be removed in future versions. Please migrate to recommended alternatives.
