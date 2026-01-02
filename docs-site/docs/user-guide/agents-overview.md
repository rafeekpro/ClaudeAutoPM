---
title: Agents Overview
description: How to use AI agents in ClaudeAutoPM, including the @agent syntax, agent selection, and combining agents for complex tasks.
---

# Agents Overview

ClaudeAutoPM includes over 45 specialized AI agents, each an expert in a specific domain. This guide explains how to use agents effectively, when to choose which agent, and how to combine them for complex tasks.

## What Are Agents?

Agents are specialized AI assistants with deep expertise in specific areas. Unlike a general-purpose assistant, each agent:

- **Focuses on one domain** - React, Python, Kubernetes, etc.
- **Knows best practices** - Current patterns and anti-patterns
- **Uses appropriate tools** - File operations, testing, deployment
- **Coordinates with others** - Can hand off work to related agents

## Using the @agent Syntax

Invoke agents using the `@` prefix:

```bash
@agent-name your request here
```

### Basic Examples

```bash
# Code review
@code-analyzer review this file for security vulnerabilities

# Run tests
@test-runner execute all tests with detailed failure analysis

# Docker setup
@docker-containerization-expert create an optimized Dockerfile for this Python app

# React component
@react-ui-expert build a data table with sorting and pagination
```

### Providing Context

Give agents enough context to be effective:

```bash
# Good - provides context
@postgresql-expert optimize this query for a table with 10M rows:
SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at

# Better - provides additional context
@postgresql-expert optimize this e-commerce order query:
- Orders table: 10M rows, indexed on id and created_at
- Need results for real-time dashboard
- Currently taking 5+ seconds
SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at
```

## Agent Categories

### Core Agents

Essential agents for everyday development:

| Agent | Purpose | Use When |
|-------|---------|----------|
| `@agent-manager` | Create and manage agents | Creating custom agents |
| `@code-analyzer` | Code review and analysis | Finding bugs, security issues |
| `@test-runner` | Test execution and analysis | Running and debugging tests |
| `@file-analyzer` | Large file summarization | Analyzing logs, large outputs |
| `@parallel-worker` | Parallel task execution | Multi-file operations |

### Language Experts

Programming language specialists:

| Agent | Expertise |
|-------|-----------|
| `@python-backend-expert` | Python with FastAPI, Django, Flask |
| `@nodejs-backend-engineer` | Node.js with Express, NestJS |
| `@javascript-frontend-engineer` | Vanilla JS, DOM, browser APIs |
| `@bash-scripting-expert` | Shell scripts, automation |

### Framework Specialists

Frontend and testing frameworks:

| Agent | Expertise |
|-------|-----------|
| `@react-ui-expert` | React 18+, hooks, state management |
| `@react-frontend-engineer` | Full React application development |
| `@tailwindcss-expert` | Tailwind CSS styling |
| `@e2e-test-engineer` | End-to-end testing strategies |
| `@ux-design-expert` | UI/UX patterns and accessibility |

### Database Experts

Database design and optimization:

| Agent | Expertise |
|-------|-----------|
| `@postgresql-expert` | PostgreSQL, schemas, optimization |
| `@mongodb-expert` | MongoDB, document design, aggregation |
| `@redis-expert` | Redis caching, data structures |
| `@cosmosdb-expert` | Azure Cosmos DB |
| `@bigquery-expert` | Google BigQuery analytics |

### DevOps Agents

CI/CD and operations:

| Agent | Expertise |
|-------|-----------|
| `@docker-containerization-expert` | Docker, Compose, multi-stage builds |
| `@github-operations-specialist` | GitHub Actions, releases |
| `@azure-devops-specialist` | Azure Pipelines, boards |
| `@observability-engineer` | Monitoring, logging, alerting |
| `@ssh-operations-expert` | SSH security, key management |
| `@traefik-proxy-expert` | Traefik reverse proxy |

### Cloud Architects

Cloud platform expertise:

| Agent | Expertise |
|-------|-----------|
| `@aws-cloud-architect` | AWS services, CloudFormation, CDK |
| `@azure-cloud-architect` | Azure resources, ARM, Bicep |
| `@gcp-cloud-architect` | GCP services, deployment |
| `@kubernetes-orchestrator` | Kubernetes, Helm charts |
| `@terraform-infrastructure-expert` | Terraform IaC |

### Data and AI

Data engineering and AI integration:

| Agent | Expertise |
|-------|-----------|
| `@langgraph-workflow-expert` | LangGraph AI workflows |
| `@openai-python-expert` | OpenAI API integration |
| `@gemini-api-expert` | Google Gemini API |
| `@airflow-orchestration-expert` | Apache Airflow DAGs |
| `@kedro-pipeline-expert` | Kedro data pipelines |

## Choosing the Right Agent

### By Task Type

| Task | Best Agent |
|------|------------|
| Code review | `@code-analyzer` |
| Write tests | `@test-runner` |
| Build React UI | `@react-ui-expert` |
| Create API | `@python-backend-expert` or `@nodejs-backend-engineer` |
| Setup CI/CD | `@github-operations-specialist` |
| Optimize queries | `@postgresql-expert` or `@mongodb-expert` |
| Deploy to cloud | `@aws-cloud-architect` or `@azure-cloud-architect` |
| Containerize app | `@docker-containerization-expert` |

### By Technology

| Technology | Recommended Agent |
|------------|-------------------|
| React | `@react-ui-expert` |
| Python + FastAPI | `@python-backend-expert` |
| Node.js + Express | `@nodejs-backend-engineer` |
| PostgreSQL | `@postgresql-expert` |
| Docker | `@docker-containerization-expert` |
| Kubernetes | `@kubernetes-orchestrator` |
| AWS | `@aws-cloud-architect` |
| Azure | `@azure-cloud-architect` |
| GitHub Actions | `@github-operations-specialist` |
| Playwright | `@e2e-test-engineer` |

### Decision Process

When unsure which agent to use:

1. **Identify the primary technology** - React? Python? Kubernetes?
2. **Check the agent list** for that technology
3. **Start specific** - Use the most specialized agent
4. **Broaden if needed** - Fall back to `@code-analyzer` for general tasks

## Agent Combinations

Complex tasks often benefit from multiple agents working together.

### Full-Stack Development

```bash
# 1. Design the database
@postgresql-expert design schema for user management system

# 2. Create the API
@python-backend-expert create FastAPI endpoints for user CRUD

# 3. Build the frontend
@react-ui-expert create user management dashboard

# 4. Write tests
@test-runner create comprehensive test suite
```

### DevOps Pipeline

```bash
# 1. Containerize the application
@docker-containerization-expert create multi-stage Dockerfile

# 2. Set up CI/CD
@github-operations-specialist create GitHub Actions workflow

# 3. Deploy to Kubernetes
@kubernetes-orchestrator create Helm chart for deployment

# 4. Add monitoring
@observability-engineer set up logging and metrics
```

### Code Quality Review

```bash
# 1. Analyze code
@code-analyzer review for bugs and security issues

# 2. Verify tests
@test-runner check test coverage and run suite

# 3. Container security
@docker-containerization-expert audit Dockerfile security
```

## Agent Communication

### Handoff Patterns

Agents can reference each other's work:

```bash
# First agent creates something
@postgresql-expert create migration for users table

# Second agent builds on it
@python-backend-expert create SQLAlchemy models for the new users table
```

### Sequential Workflow

Work through agents in order:

```bash
# 1. Analyze first
@code-analyzer identify performance bottlenecks

# 2. Then optimize
@postgresql-expert optimize the slow queries identified

# 3. Then verify
@test-runner verify performance improvements with benchmarks
```

## Best Practices

### 1. Be Specific

```bash
# Too vague
@code-analyzer review this

# Better
@code-analyzer review src/auth/ for security vulnerabilities,
focusing on input validation and SQL injection

# Best
@code-analyzer review src/auth/login.py for:
- SQL injection in user lookup
- Password handling security
- Session management vulnerabilities
```

### 2. Provide Context

```bash
# Include relevant information
@docker-containerization-expert create Dockerfile:
- Python 3.11 application
- Uses FastAPI with uvicorn
- Needs PostgreSQL client libraries
- Production deployment to AWS ECS
```

### 3. Start Specialized

Choose the most specific agent first:

```bash
# For React work, use React specialist
@react-ui-expert  # Not @javascript-frontend-engineer

# For FastAPI work, use Python backend
@python-backend-expert  # Not @code-analyzer
```

### 4. Combine for Complex Tasks

```bash
# Multi-agent approach for full feature
@react-ui-expert create the form component
@python-backend-expert create the API endpoint
@postgresql-expert optimize the database query
@test-runner verify everything works
```

### 5. Iterate and Refine

```bash
# First pass
@react-ui-expert create user profile component

# Review
@code-analyzer review for accessibility issues

# Improve
@react-ui-expert add ARIA labels and keyboard navigation
```

## Agent Capabilities

### Tool Access

Each agent has access to specific tools:

| Tool | Purpose | Common Agents |
|------|---------|---------------|
| `Read` | Read files | All agents |
| `Write` | Create files | Most agents |
| `Edit` | Modify files | Most agents |
| `Bash` | Run commands | DevOps, testing agents |
| `Glob` | Find files | All agents |
| `Grep` | Search content | All agents |
| `WebFetch` | HTTP requests | Cloud, API agents |
| `Task` | Background tasks | Core agents |

### Context Awareness

Agents maintain context about:
- Current project structure
- Recent changes
- Related files
- Previous interactions

## Performance Tips

### Reduce Context Usage

```bash
# Use file-analyzer for large files
@file-analyzer summarize this 10000-line log file

# Then work with the summary
@code-analyzer analyze these error patterns: [summary]
```

### Parallel Execution

When tasks are independent:

```bash
# These can run in parallel
@code-analyzer review backend/
@test-runner execute frontend tests
@docker-containerization-expert build images
```

### Efficient Queries

```bash
# Be focused to reduce processing time
@postgresql-expert optimize just the JOIN in this query

# Rather than
@postgresql-expert make this database faster
```

## Troubleshooting

### Agent Not Responding

1. Check the agent exists: `ls .claude/agents/`
2. Verify the agent name spelling
3. Try a simpler request first
4. Fall back to `@code-analyzer` for general help

### Wrong Results

1. Provide more context
2. Be more specific about requirements
3. Try a more specialized agent
4. Break the task into smaller pieces

### Slow Performance

1. Reduce file scope
2. Use `@file-analyzer` for large files first
3. Break into smaller tasks
4. Check for unnecessary tool usage

## Next Steps

- Learn about [MCP Servers](./mcp-servers) for extended agent capabilities
- Review [Best Practices](./best-practices) for optimal workflows
- Explore the [Agent Registry](/agents/registry) for complete agent details
