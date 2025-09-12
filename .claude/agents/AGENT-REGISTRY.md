# Agent Registry

This document provides the official registry of all agents for inclusion in the system prompt.

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

## Framework Agents

### mui-react-expert
**Location**: `.claude/agents/frameworks/mui-react-expert.md`
**Description**: Use this agent for Material-UI (MUI) React component development including theming, custom components, and design system implementation. Expert in MUI v5/v6 features.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### chakra-ui-expert
**Location**: `.claude/agents/frameworks/chakra-ui-expert.md`
**Description**: Use this agent for Chakra UI React component development including theme customization, responsive design, and accessibility-first implementations.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### antd-react-expert
**Location**: `.claude/agents/frameworks/antd-react-expert.md`
**Description**: Use this agent for Ant Design (antd) React component development including enterprise-grade UI implementations, form handling, and data visualization.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

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

### bootstrap-ui-expert
**Location**: `.claude/agents/frameworks/bootstrap-ui-expert.md`
**Description**: Use this agent for Bootstrap CSS framework development including responsive layouts, component styling, and custom themes.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### tailwindcss-expert
**Location**: `.claude/agents/frameworks/tailwindcss-expert.md`
**Description**: Use this agent for TailwindCSS utility-first styling including responsive design, custom components, and design systems.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### fastapi-backend-engineer
**Location**: `.claude/agents/frameworks/fastapi-backend-engineer.md`
**Description**: Use this agent for FastAPI development including REST APIs, async operations, Pydantic models, and OpenAPI documentation.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### flask-backend-engineer
**Location**: `.claude/agents/frameworks/flask-backend-engineer.md`
**Description**: Use this agent for Flask development including web applications, REST APIs, blueprints, and Flask extensions.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### playwright-test-engineer
**Location**: `.claude/agents/frameworks/playwright-test-engineer.md`
**Description**: Use this agent when you need to create, debug, or optimize end-to-end tests using Playwright.
**Tools**: Bash, Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Task, Agent
**Status**: Active

### playwright-mcp-frontend-tester
**Location**: `.claude/agents/frameworks/playwright-mcp-frontend-tester.md`
**Description**: Use this agent for advanced Playwright testing with MCP browser control integration for visual testing and UX feedback.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent, mcp__playwright__navigate, mcp__playwright__screenshot, mcp__playwright__click, mcp__playwright__fill
**Status**: Active

### nats-messaging-expert
**Location**: `.claude/agents/frameworks/nats-messaging-expert.md`
**Description**: Use this agent for NATS messaging system including pub/sub, request/reply, and queue groups.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

## Language Agents

### python-backend-engineer
**Location**: `.claude/agents/languages/python-backend-engineer.md`
**Description**: Use this agent when you need to develop, refactor, or optimize Python backend systems using modern tooling like uv.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

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

### docker-expert
**Location**: `.claude/agents/devops/docker-expert.md`
**Description**: Use this agent for Docker containerization including Dockerfile optimization, multi-stage builds, image security, and registry management.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### docker compose-expert
**Location**: `.claude/agents/devops/docker compose-expert.md`
**Description**: Use this agent for Docker Compose orchestration including multi-container applications, service dependencies, and networking.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### docker-development-orchestrator
**Location**: `.claude/agents/devops/docker-development-orchestrator.md`
**Description**: Use this agent for Docker-first development workflows including creating development containers and managing compose files.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

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