# Agent Registry

This document provides the official registry of all agents for inclusion in the system prompt.

## 🎯 Agent Selection Rules

### Quick Decision Guide
1. **Architecture vs Implementation**
   - Planning/designing? → Use "expert" or "architect" agents
   - Building/coding? → Use "engineer" agents

2. **Scope Rules**
   - New project setup → "expert" agents
   - Day-to-day development → "engineer" agents
   - Platform-specific → cloud "architect" agents
   - Multi-platform/IaC → "terraform-infrastructure-expert"

3. **Component vs Application**
   - UI components only → "react-ui-expert"
   - Full application → "react-frontend-engineer"

4. **Local vs Production**
   - Development environment → "docker-containerization-expert"
   - Production deployment → "kubernetes-orchestrator"

## 🚀 Optimization Update (v1.1.0)

### Summary of Changes

- **Reduced agent count from 50+ to 39** (Consolidation complete)
- **Consolidated similar agents** into parameterized versions
- **Unified coordination rules** for better efficiency
- **Maintained all functionality** through parameters
- **Removed deprecated agent files** to avoid confusion

### Key Consolidations (Completed)
1. **UI Frameworks**: mui-react-expert, chakra-ui-expert, antd-react-expert, bootstrap-ui-expert → `react-ui-expert`
2. **Python Backend**: fastapi-backend-engineer, flask-backend-engineer → `python-backend-expert`
3. **Docker**: docker-expert, docker-compose-expert, docker-development-orchestrator → `docker-containerization-expert`
4. **E2E Testing**: playwright-test-engineer, playwright-mcp-frontend-tester → `e2e-test-engineer`

### Migration Note
Deprecated agents have been removed. Use the consolidated versions with appropriate parameters.

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
**Description**: Executes parallel work streams in a git branch for coordinated multi-agent execution.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, BashOutput, KillBash, Search, Task, Agent
**Status**: Active

### mcp-manager

**Location**: `.claude/agents/core/mcp-manager.md`
**Description**: Use this agent for MCP server infrastructure: installing servers, editing configuration files, starting/stopping server processes, and troubleshooting connection issues.
**Scope**: Server installation, config files, process management, health checks
**NOT for**: Context optimization, agent coordination, content curation (use mcp-context-manager)
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

## Framework Agents

### react-ui-expert

**Location**: `.claude/agents/frameworks/react-ui-expert.md`
**Description**: Use this agent for UI component architecture, design systems, component library selection (MUI, Chakra, Ant Design), styling strategies, and accessibility patterns.
**Scope**: Component libraries, design systems, styling, accessibility, component documentation
**NOT for**: Full app architecture, routing, state management (use react-frontend-engineer)
**Parameters**: `framework: [mui|chakra|antd|bootstrap|headless]`, `style_system: [css-in-js|tailwind|css-modules]`
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active
**Replaces**: mui-react-expert, chakra-ui-expert, antd-react-expert, bootstrap-ui-expert


### react-frontend-engineer

**Location**: `.claude/agents/frameworks/react-frontend-engineer.md`
**Description**: Use this agent for complete React application development including routing, state management, API integration, and application architecture.
**Scope**: Full app architecture, Redux/Context/Zustand, routing, API integration, build config
**NOT for**: Pure UI component work, design systems (use react-ui-expert)
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### ux-design-expert

**Location**: `.claude/agents/frameworks/ux-design-expert.md`
**Description**: Use this agent for UX/UI design analysis, user experience optimization, accessibility audits, and design system creation. Expert in user research, information architecture, and usability testing.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active


### tailwindcss-expert

**Location**: `.claude/agents/frameworks/tailwindcss-expert.md`
**Description**: Use this agent for TailwindCSS utility-first styling including responsive design, custom components, and design systems.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active


### e2e-test-engineer (NEW - Consolidated)

**Location**: `.claude/agents/frameworks/e2e-test-engineer.md`
**Description**: Unified E2E test engineering specialist covering Playwright automation, MCP browser control, visual testing, and comprehensive test strategies.
**Parameters**: `test_framework: [playwright|cypress]`, `browser_control: [standard|mcp-enhanced]`, `test_types: [functional|visual|accessibility]`
**Tools**: Bash, Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Task, Agent, MCP tools when available
**Status**: Active
**Replaces**: playwright-test-engineer, playwright-mcp-frontend-tester

### frontend-testing-engineer

**Location**: `.claude/agents/testing/frontend-testing-engineer.md`
**Description**: Use this agent for frontend unit and integration testing across React, Vue, Angular, and vanilla JavaScript applications. Specializes in component testing, snapshot testing, DOM testing, and test coverage optimization.
**Scope**: Unit tests, integration tests, component tests, snapshot tests, coverage reporting
**NOT for**: E2E testing (use e2e-test-engineer), backend testing (use test-runner)
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active


### nats-messaging-expert

**Location**: `.claude/agents/frameworks/nats-messaging-expert.md`
**Description**: Use this agent for NATS messaging system including pub/sub, request/reply, and queue groups.
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active

### message-queue-engineer

**Location**: `.claude/agents/integration/message-queue-engineer.md`
**Description**: Use this agent for implementing message queuing, event streaming, and pub/sub architectures. Specializes in Kafka, RabbitMQ, AWS SQS/SNS, Redis Pub/Sub, and other message broker systems.
**Scope**: Message broker setup, producer/consumer implementation, event-driven patterns, SAGA orchestration, dead letter queues
**NOT for**: Simple NATS setups (use nats-messaging-expert), database events (use database-specific agents)
**Tools**: Bash, Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Task, Agent
**Status**: Active

## Language Agents

### python-backend-expert

**Location**: `.claude/agents/languages/python-backend-expert.md`
**Description**: Use this agent for Python backend architecture, new project setup, framework selection, database design, and strategic decisions. Expert in design patterns and best practices.
**Scope**: Architecture, framework selection, database schema design, API patterns, performance architecture
**NOT for**: Day-to-day coding, bug fixes, minor features (use python-backend-engineer)
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

### python-backend-engineer

**Location**: `.claude/agents/languages/python-backend-engineer.md`
**Description**: Use this agent for day-to-day Python feature implementation, bug fixes, refactoring existing code, and writing tests. Focuses on hands-on development in established projects.
**Scope**: Feature development, debugging, code optimization, test writing
**NOT for**: Architecture decisions, framework selection, major redesigns (use python-backend-expert)
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
**Description**: Use this agent for Infrastructure as Code architecture, complex Terraform modules, multi-cloud strategies, state management, and GitOps workflows.
**Scope**: IaC architecture, Terraform modules, multi-cloud, state management, GitOps
**NOT for**: Platform-specific services, console operations (use specific cloud architects)
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
**Description**: Use this agent for MCP context optimization: deciding what content to share, curating context pools, coordinating agents, and optimizing context usage strategies.
**Scope**: Content strategy, context optimization, agent coordination, performance tuning
**NOT for**: Server installation, config file editing, process management (use mcp-manager)
**Tools**: Bash, Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Task, Agent
**Status**: Active

### docker-containerization-expert (NEW - Consolidated)

**Location**: `.claude/agents/devops/docker-containerization-expert.md`
**Description**: Comprehensive Docker specialist covering Dockerfile optimization, Compose orchestration, and development environments.
**Parameters**: `use_case: [development|production]`, `orchestration: [compose|swarm|kubernetes]`
**Tools**: Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Bash, Task, Agent
**Status**: Active
**Replaces**: docker-expert, docker-compose-expert, docker-development-orchestrator


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

### observability-engineer

**Location**: `.claude/agents/devops/observability-engineer.md`
**Description**: Use this agent for implementing monitoring, logging, tracing, and APM solutions. Specializes in Prometheus, Grafana, ELK Stack, Jaeger, Datadog, New Relic, and cloud-native observability tools.
**Scope**: Metrics collection, log aggregation, distributed tracing, dashboards, alerting, SLI/SLO monitoring
**NOT for**: Application development (use language-specific engineers), infrastructure setup (use cloud architects)
**Tools**: Bash, Glob, Grep, LS, Read, WebFetch, TodoWrite, WebSearch, Edit, Write, MultiEdit, Task, Agent
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

## Decision Matrices (Not Agents)

### ui-framework-selection

**Location**: `.claude/agents/decision-matrices/ui-framework-selection.md`
**Description**: Decision matrix tool for selecting appropriate UI frameworks based on project requirements. Not a callable agent.
**Purpose**: Helps evaluate UI framework choices based on criteria like performance, ecosystem, learning curve, and project type.
**Status**: Tool/Reference

### python-backend-selection

**Location**: `.claude/agents/decision-matrices/python-backend-selection.md`
**Description**: Decision matrix tool for selecting Python backend frameworks and architectures. Not a callable agent.
**Purpose**: Helps evaluate Python backend framework choices (FastAPI, Flask, Django) based on project requirements.
**Status**: Tool/Reference

### playwright-testing-selection

**Location**: `.claude/agents/decision-matrices/playwright-testing-selection.md`
**Description**: Decision matrix tool for selecting testing strategies with Playwright. Not a callable agent.
**Purpose**: Helps determine testing approaches, coverage levels, and implementation patterns.
**Status**: Tool/Reference

## Registry Format for System Prompt

When adding agents to the main system prompt, use this format:

```
- agent-name: Use this agent for [primary purpose]. Expert in [key technologies]. Specializes in [specializations]. (Tools: [tool-list])
```

## Agent Count Summary

### Active Agents by Category
- **Core**: 6 agents (agent-manager, file-analyzer, code-analyzer, test-runner, parallel-worker, mcp-manager)
- **Frameworks/Testing**: 8 agents (react-ui-expert, react-frontend-engineer, ux-design-expert, tailwindcss-expert, e2e-test-engineer, frontend-testing-engineer, nats-messaging-expert, message-queue-engineer)
- **Languages**: 5 agents (python-backend-expert, python-backend-engineer, javascript-frontend-engineer, nodejs-backend-engineer, bash-scripting-expert)
- **Cloud**: 7 agents (AWS, Azure, GCP, Kubernetes, Terraform, Cloud Functions)
- **DevOps**: 7 agents (github-operations-specialist, azure-devops-specialist, mcp-context-manager, docker-containerization-expert, traefik-proxy-expert, ssh-operations-expert, observability-engineer)
- **Databases**: 5 agents (PostgreSQL, MongoDB, BigQuery, CosmosDB, Redis)
- **Data Engineering**: 3 agents (Airflow, Kedro, LangGraph)
- **AI/API**: 2 agents (Gemini, OpenAI)

**Total Active**: 43 agents (Phase 2 complete - added frontend-testing, observability, message-queue)
**Decision Matrices**: 3 tools (not agents)

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
