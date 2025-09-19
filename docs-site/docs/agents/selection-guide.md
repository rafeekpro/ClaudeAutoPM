# Agent Selection Guide

ClaudeAutoPM provides over 35 specialized AI agents to assist with different aspects of software development. This guide helps you choose the right agent for your task based on technology stack, use case, and project requirements.

## Quick Selection Matrix

### By Technology Stack

| Technology | Recommended Agent | Use Case |
|------------|------------------|----------|
| **React** | `@react-ui-expert` | React components, hooks, state management |
| **Python Backend** | `@python-backend-expert` | FastAPI, Django, Flask development |
| **Docker** | `@docker-containerization-expert` | Containerization, Docker Compose |
| **Kubernetes** | `@kubernetes-orchestrator` | K8s deployments, Helm charts |
| **AWS** | `@aws-cloud-architect` | AWS services, infrastructure |
| **Azure** | `@azure-cloud-architect` | Azure resources, ARM templates |
| **PostgreSQL** | `@postgresql-expert` | Database design, queries, optimization |
| **MongoDB** | `@mongodb-expert` | NoSQL schemas, aggregations |
| **Testing** | `@e2e-test-engineer` | End-to-end testing, test automation |

### By Task Type

| Task | Agent | Description |
|------|-------|-------------|
| **Code Review** | `@code-analyzer` | Find bugs, security issues, optimizations |
| **Create Tests** | `@test-runner` | Generate and execute test suites |
| **Build UI** | `@react-ui-expert` | Create React components with modern patterns |
| **API Development** | `@python-backend-expert` | Design and implement REST/GraphQL APIs |
| **DevOps Setup** | `@github-operations-specialist` | CI/CD pipelines, GitHub Actions |
| **Database Design** | `@postgresql-expert` | Schema design, migrations, optimization |
| **Cloud Architecture** | `@aws-cloud-architect` | Design scalable cloud solutions |
| **Container Setup** | `@docker-containerization-expert` | Dockerize applications |
| **Security Audit** | `@code-analyzer` | Security vulnerability scanning |

## Core Agents

### agent-manager
**Location**: `.claude/agents/core/agent-manager.md`
**Purpose**: Manage agent lifecycle and creation
**When to use**:
- Creating new custom agents
- Analyzing agent performance
- Updating agent registry

```markdown
@agent-manager create a new agent for GraphQL development
```

### code-analyzer
**Location**: `.claude/agents/core/code-analyzer.md`
**Purpose**: Analyze code for issues and improvements
**When to use**:
- Pre-commit code review
- Security vulnerability scanning
- Performance optimization analysis
- Bug investigation

```markdown
@code-analyzer review this file for security issues and performance problems
```

### test-runner
**Location**: `.claude/agents/core/test-runner.md`
**Purpose**: Execute and analyze test results
**When to use**:
- Running test suites
- Analyzing test failures
- Generating test reports
- Creating new tests

```markdown
@test-runner execute all tests and provide detailed failure analysis
```

### file-analyzer
**Location**: `.claude/agents/core/file-analyzer.md`
**Purpose**: Summarize large files to reduce context
**When to use**:
- Analyzing large log files
- Summarizing documentation
- Processing test outputs
- Reviewing configuration files

```markdown
@file-analyzer summarize the key issues in this 5000-line log file
```

## Frontend Development Agents

### react-ui-expert
**Purpose**: React development with modern patterns
**Expertise**:
- React 18+ features
- Hooks and custom hooks
- State management (Redux, Zustand, Context)
- Component patterns
- Performance optimization

```markdown
@react-ui-expert build a data table component with sorting and filtering
```

### javascript-frontend-engineer
**Purpose**: General JavaScript frontend development
**Expertise**:
- Vanilla JavaScript
- DOM manipulation
- Browser APIs
- Module systems
- Build tools

```markdown
@javascript-frontend-engineer optimize this JavaScript for performance
```

## Backend Development Agents

### python-backend-expert
**Purpose**: Python backend development
**Expertise**:
- FastAPI, Django, Flask
- Async programming
- Database integration
- REST/GraphQL APIs
- Testing with pytest

```markdown
@python-backend-expert create a FastAPI endpoint with authentication
```

### nodejs-backend-engineer
**Purpose**: Node.js backend development
**Expertise**:
- Express, NestJS, Koa
- Middleware patterns
- Database integration
- Real-time features
- Microservices

```markdown
@nodejs-backend-engineer implement WebSocket server with Socket.io
```

## Database Agents

### postgresql-expert
**Purpose**: PostgreSQL database management
**Expertise**:
- Schema design
- Query optimization
- Indexes and performance
- Migrations
- Advanced features (JSONB, full-text search)

```markdown
@postgresql-expert optimize this slow query with proper indexes
```

### mongodb-expert
**Purpose**: MongoDB NoSQL development
**Expertise**:
- Document design
- Aggregation pipelines
- Indexing strategies
- Sharding
- Performance tuning

```markdown
@mongodb-expert design schema for user activity tracking
```

## DevOps Agents

### docker-containerization-expert
**Purpose**: Docker and containerization
**Expertise**:
- Dockerfile optimization
- Docker Compose
- Multi-stage builds
- Security best practices
- Volume management

```markdown
@docker-containerization-expert create optimized Dockerfile for Python app
```

### kubernetes-orchestrator
**Purpose**: Kubernetes deployment and management
**Expertise**:
- Deployment configurations
- Service mesh
- Helm charts
- Scaling strategies
- Security policies

```markdown
@kubernetes-orchestrator create Helm chart for microservices deployment
```

### github-operations-specialist
**Purpose**: GitHub Actions and CI/CD
**Expertise**:
- Workflow creation
- Actions marketplace
- Release automation
- Security scanning
- Matrix testing

```markdown
@github-operations-specialist create CI/CD pipeline with testing and deployment
```

## Cloud Architecture Agents

### aws-cloud-architect
**Purpose**: AWS infrastructure design
**Expertise**:
- EC2, Lambda, ECS/EKS
- S3, RDS, DynamoDB
- VPC, Security Groups
- CloudFormation, CDK
- Cost optimization

```markdown
@aws-cloud-architect design serverless architecture for image processing
```

### azure-cloud-architect
**Purpose**: Azure infrastructure design
**Expertise**:
- Azure VMs, AKS, Functions
- Storage accounts, SQL Database
- Virtual Networks, NSGs
- ARM templates, Bicep
- Azure DevOps integration

```markdown
@azure-cloud-architect setup AKS cluster with monitoring
```

### gcp-cloud-architect
**Purpose**: Google Cloud Platform design
**Expertise**:
- Compute Engine, GKE, Cloud Run
- Cloud Storage, Cloud SQL
- VPC, Firewall rules
- Terraform, Deployment Manager
- BigQuery, Pub/Sub

```markdown
@gcp-cloud-architect implement event-driven architecture with Pub/Sub
```

## Testing Agents

### e2e-test-engineer
**Purpose**: End-to-end testing
**Expertise**:
- Playwright, Cypress, Selenium
- Test automation frameworks
- CI/CD integration
- Cross-browser testing
- Performance testing

```markdown
@e2e-test-engineer create Playwright tests for checkout flow
```

### playwright-test-engineer
**Purpose**: Playwright-specific testing
**Expertise**:
- Playwright API
- Page object model
- Visual testing
- API testing
- Mobile testing

```markdown
@playwright-test-engineer implement visual regression tests
```

## Decision Matrices

### Choosing a UI Framework Agent

```mermaid
graph TD
    A[UI Development] --> B{Framework?}
    B -->|React| C[@react-ui-expert]
    B -->|Vue| D[@javascript-frontend-engineer]
    B -->|Angular| D
    B -->|Vanilla JS| D
    C --> E{Styling?}
    E -->|Tailwind| F[@tailwindcss-expert]
    E -->|Material UI| G[@mui-react-expert]
    E -->|Ant Design| H[@antd-react-expert]
```

### Choosing a Backend Agent

```mermaid
graph TD
    A[Backend Development] --> B{Language?}
    B -->|Python| C[@python-backend-expert]
    B -->|Node.js| D[@nodejs-backend-engineer]
    B -->|Go| E[@code-analyzer + Custom]
    C --> F{Framework?}
    F -->|FastAPI| G[Use @python-backend-expert]
    F -->|Django| G
    F -->|Flask| G
    D --> H{Framework?}
    H -->|Express| I[Use @nodejs-backend-engineer]
    H -->|NestJS| I
```

## Agent Combinations

### Full Stack Development

```markdown
# Frontend + Backend + Database
@react-ui-expert create user dashboard
@python-backend-expert create API endpoints
@postgresql-expert design database schema
```

### DevOps Pipeline

```markdown
# Containerization + CI/CD + Cloud
@docker-containerization-expert dockerize application
@github-operations-specialist setup GitHub Actions
@kubernetes-orchestrator deploy to K8s
```

### Testing Suite

```markdown
# Unit + Integration + E2E
@test-runner create unit tests
@code-analyzer verify test coverage
@e2e-test-engineer create end-to-end tests
```

## Custom Agent Creation

When existing agents don't meet your needs:

```markdown
@agent-manager create a custom agent for [specific technology/task]

# Example:
@agent-manager create a GraphQL specialist agent with:
- Apollo Server expertise
- Schema design patterns
- Resolver optimization
- Subscription handling
```

## Best Practices

### 1. Start Specific
Choose the most specific agent for your task:
- ❌ `@code-analyzer` for React component
- ✅ `@react-ui-expert` for React component

### 2. Combine Agents
Use multiple agents for complex tasks:
```markdown
@code-analyzer review for issues
@test-runner verify with tests
@docker-containerization-expert prepare for deployment
```

### 3. Context Matters
Provide context to agents:
```markdown
# Good
@postgresql-expert optimize query for table with 10M rows

# Better
@postgresql-expert optimize this e-commerce order query:
- Orders table: 10M rows
- Needs to join with users and products
- Used for real-time dashboard
```

### 4. Iterative Refinement
Work iteratively with agents:
```markdown
1. @python-backend-expert create initial API
2. @code-analyzer review for improvements
3. @test-runner add test coverage
4. @docker-containerization-expert containerize
```

## Performance Considerations

### Agent Efficiency Ranking

| Agent | Context Usage | Speed | Best For |
|-------|---------------|-------|----------|
| `@file-analyzer` | Low | Fast | Large files |
| `@code-analyzer` | Medium | Medium | Code review |
| `@react-ui-expert` | Medium | Fast | React development |
| `@kubernetes-orchestrator` | High | Slow | Complex deployments |
| `@aws-cloud-architect` | High | Slow | Infrastructure design |

### Parallel vs Sequential

**Parallel Execution** (when enabled):
```markdown
# These run simultaneously
@code-analyzer review backend/
@test-runner execute tests
@docker-containerization-expert build images
```

**Sequential Execution**:
```markdown
# These run one after another
@code-analyzer review and fix issues
THEN @test-runner verify fixes
THEN @docker-containerization-expert deploy
```

## Troubleshooting

### Agent Not Responding

```markdown
# Check if agent exists
ls .claude/agents/ | grep agent-name

# Try core agent instead
@code-analyzer [fallback for specialized agent]
```

### Wrong Agent Selected

```markdown
# Be more specific
@python-backend-expert for FastAPI development
NOT @code-analyzer for FastAPI development
```

### Agent Limitations

Some agents have specific limitations:
- Cloud agents need credentials configured
- Test agents need test framework installed
- DevOps agents need tools (Docker, kubectl)

## Related Pages

- [Custom Agents](Custom-Agents)
- [Testing Strategies](Testing-Strategies)
- [Docker First Development](Docker-First-Development)
- [PM Commands](PM-Commands)