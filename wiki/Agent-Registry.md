# Agent Registry

Complete registry of all 35+ specialized AI agents available in ClaudeAutoPM. This page provides descriptions, use cases, and examples for each agent to help you choose the right tool for your task.

## 🚀 Recent Optimization (v1.2.0)

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

## Core Agents

### agent-manager
**Location**: `.claude/agents/core/agent-manager.md`
**Purpose**: Agent lifecycle management and creation
**Use for**: Creating new agents, updating documentation, registry maintenance
**Example**:
```markdown
@agent-manager create a specialized agent for GraphQL development with Apollo Server expertise
```

### file-analyzer
**Location**: `.claude/agents/core/file-analyzer.md`
**Purpose**: Analyze and summarize large files to reduce context usage
**Use for**: Log analysis, documentation review, test output summarization
**Example**:
```markdown
@file-analyzer summarize the key errors in this 5000-line installation log
```

### code-analyzer
**Location**: `.claude/agents/core/code-analyzer.md`
**Purpose**: Code review, bug detection, and logic flow analysis
**Use for**: Pre-commit reviews, security scanning, architecture analysis
**Example**:
```markdown
@code-analyzer review this authentication module for security vulnerabilities
```

### test-runner
**Location**: `.claude/agents/core/test-runner.md`
**Purpose**: Test execution and comprehensive result analysis
**Use for**: Running test suites, failure analysis, coverage reports
**Example**:
```markdown
@test-runner execute all integration tests and analyze any failures
```

### parallel-worker
**Location**: `.claude/agents/core/parallel-worker.md`
**Purpose**: Coordinate multiple agents working on related tasks
**Use for**: Complex multi-step workflows, parallel task execution
**Example**:
```markdown
@parallel-worker coordinate testing, building, and deployment tasks
```

### mcp-manager
**Location**: `.claude/agents/core/mcp-manager.md`
**Purpose**: Manage Model Context Protocol server configurations
**Use for**: MCP server setup, configuration, troubleshooting
**Example**:
```markdown
@mcp-manager configure Context7 MCP server for documentation indexing
```

## Framework Agents

### react-ui-expert
**Location**: `.claude/agents/frameworks/react-ui-expert.md`
**Purpose**: React development with modern patterns (consolidated from 4 UI agents)
**Expertise**: React 18+, hooks, state management, component patterns
**Example**:
```markdown
@react-ui-expert build a data table component with sorting, filtering, and pagination
```

### e2e-test-engineer
**Location**: `.claude/agents/frameworks/e2e-test-engineer.md`
**Purpose**: End-to-end testing across platforms (consolidated)
**Expertise**: Playwright, Cypress, Selenium, cross-browser testing
**Example**:
```markdown
@e2e-test-engineer create Playwright tests for the complete checkout workflow
```

### tailwindcss-expert
**Location**: `.claude/agents/frameworks/tailwindcss-expert.md`
**Purpose**: Tailwind CSS styling and design systems
**Expertise**: Utility-first CSS, responsive design, component styling
**Example**:
```markdown
@tailwindcss-expert design a responsive dashboard layout with dark mode support
```

### mui-react-expert
**Location**: `.claude/agents/frameworks/mui-react-expert.md`
**Purpose**: Material-UI React component development
**Expertise**: MUI components, theming, custom components
**Example**:
```markdown
@mui-react-expert create a Material-UI form with validation and stepper component
```

### antd-react-expert
**Location**: `.claude/agents/frameworks/antd-react-expert.md`
**Purpose**: Ant Design React development
**Expertise**: Ant Design components, forms, tables, layouts
**Example**:
```markdown
@antd-react-expert build an admin dashboard with Ant Design Pro components
```

### bootstrap-ui-expert
**Location**: `.claude/agents/frameworks/bootstrap-ui-expert.md`
**Purpose**: Bootstrap-based UI development
**Expertise**: Bootstrap 5, responsive grids, component styling
**Example**:
```markdown
@bootstrap-ui-expert create a responsive landing page with Bootstrap components
```

### chakra-ui-expert
**Location**: `.claude/agents/frameworks/chakra-ui-expert.md`
**Purpose**: Chakra UI component development
**Expertise**: Chakra UI components, theming, accessibility
**Example**:
```markdown
@chakra-ui-expert build an accessible form system with Chakra UI components
```

### fastapi-backend-engineer
**Location**: `.claude/agents/frameworks/fastapi-backend-engineer.md`
**Purpose**: FastAPI backend development
**Expertise**: FastAPI, async endpoints, dependency injection, OpenAPI
**Example**:
```markdown
@fastapi-backend-engineer create a REST API with authentication and database integration
```

### flask-backend-engineer
**Location**: `.claude/agents/frameworks/flask-backend-engineer.md`
**Purpose**: Flask web application development
**Expertise**: Flask, blueprints, extensions, SQLAlchemy
**Example**:
```markdown
@flask-backend-engineer build a web application with user authentication and admin panel
```

### playwright-test-engineer
**Location**: `.claude/agents/frameworks/playwright-test-engineer.md`
**Purpose**: Playwright-specific testing and automation
**Expertise**: Playwright API, page objects, visual testing
**Example**:
```markdown
@playwright-test-engineer implement visual regression tests for the UI components
```

### playwright-mcp-frontend-tester
**Location**: `.claude/agents/frameworks/playwright-mcp-frontend-tester.md`
**Purpose**: Frontend testing with Playwright MCP integration
**Expertise**: MCP-enabled testing, automated UI testing
**Example**:
```markdown
@playwright-mcp-frontend-tester create automated tests for the MCP-enabled frontend
```

### react-frontend-engineer
**Location**: `.claude/agents/frameworks/react-frontend-engineer.md`
**Purpose**: React application architecture and development
**Expertise**: React patterns, state management, routing, performance
**Example**:
```markdown
@react-frontend-engineer architect a scalable React application with proper state management
```

### ux-design-expert
**Location**: `.claude/agents/frameworks/ux-design-expert.md`
**Purpose**: UX design and user experience optimization
**Expertise**: User flows, wireframing, accessibility, design systems
**Example**:
```markdown
@ux-design-expert design an intuitive user onboarding flow with accessibility considerations
```

### nats-messaging-expert
**Location**: `.claude/agents/frameworks/nats-messaging-expert.md`
**Purpose**: NATS messaging system integration
**Expertise**: NATS streaming, microservices communication, message patterns
**Example**:
```markdown
@nats-messaging-expert implement event-driven communication between microservices
```

## Language Specialists

### python-backend-expert
**Location**: `.claude/agents/languages/python-backend-expert.md`
**Purpose**: Python backend development (consolidated from 3 agents)
**Expertise**: FastAPI, Django, Flask, async programming, testing
**Example**:
```markdown
@python-backend-expert create a microservice with FastAPI, database integration, and tests
```

### python-backend-engineer
**Location**: `.claude/agents/languages/python-backend-engineer.md`
**Purpose**: Python backend engineering and architecture
**Expertise**: System design, API development, database integration
**Example**:
```markdown
@python-backend-engineer design a scalable backend architecture for high-traffic application
```

### nodejs-backend-engineer
**Location**: `.claude/agents/languages/nodejs-backend-engineer.md`
**Purpose**: Node.js backend development
**Expertise**: Express, NestJS, middleware, real-time features
**Example**:
```markdown
@nodejs-backend-engineer implement a real-time chat system with WebSocket support
```

### javascript-frontend-engineer
**Location**: `.claude/agents/languages/javascript-frontend-engineer.md`
**Purpose**: Frontend JavaScript development
**Expertise**: Modern JavaScript, DOM manipulation, module systems
**Example**:
```markdown
@javascript-frontend-engineer optimize JavaScript performance and implement lazy loading
```

### bash-scripting-expert
**Location**: `.claude/agents/languages/bash-scripting-expert.md`
**Purpose**: Shell scripting and automation
**Expertise**: Bash scripting, system administration, automation
**Example**:
```markdown
@bash-scripting-expert create deployment scripts with error handling and logging
```

## DevOps Agents

### docker-containerization-expert
**Location**: `.claude/agents/devops/docker-containerization-expert.md`
**Purpose**: Docker and containerization (consolidated from 3 agents)
**Expertise**: Dockerfile optimization, multi-stage builds, security, orchestration
**Example**:
```markdown
@docker-containerization-expert create optimized Docker setup for microservices deployment
```

### kubernetes-orchestrator
**Location**: `.claude/agents/devops/kubernetes-orchestrator.md`
**Purpose**: Kubernetes deployment and management
**Expertise**: K8s manifests, Helm charts, scaling, service mesh
**Example**:
```markdown
@kubernetes-orchestrator design a scalable Kubernetes deployment with auto-scaling
```

### github-operations-specialist
**Location**: `.claude/agents/devops/github-operations-specialist.md`
**Purpose**: GitHub Actions, workflows, and repository management
**Expertise**: CI/CD pipelines, Actions, release automation
**Example**:
```markdown
@github-operations-specialist create a comprehensive CI/CD pipeline with testing and deployment
```

### azure-devops-specialist
**Location**: `.claude/agents/devops/azure-devops-specialist.md`
**Purpose**: Azure DevOps integration and automation
**Expertise**: Azure Pipelines, Boards, Repos, deployment
**Example**:
```markdown
@azure-devops-specialist setup Azure DevOps pipeline with multi-environment deployment
```

### docker-compose-expert
**Location**: `.claude/agents/devops/docker-compose-expert.md`
**Purpose**: Docker Compose orchestration
**Expertise**: Multi-container applications, networking, volumes
**Example**:
```markdown
@docker-compose-expert create development environment with database, cache, and monitoring
```

### docker-expert
**Location**: `.claude/agents/devops/docker-expert.md`
**Purpose**: Advanced Docker techniques and optimization
**Expertise**: Performance tuning, security, registry management
**Example**:
```markdown
@docker-expert optimize Docker images for production deployment with security scanning
```

### docker-development-orchestrator
**Location**: `.claude/agents/devops/docker-development-orchestrator.md`
**Purpose**: Docker-based development environment setup
**Expertise**: Development workflows, hot reloading, debugging
**Example**:
```markdown
@docker-development-orchestrator setup development environment with hot reload and debugging
```

### ssh-operations-expert
**Location**: `.claude/agents/devops/ssh-operations-expert.md`
**Purpose**: SSH configuration, security, and automation
**Expertise**: SSH keys, tunneling, automation, security
**Example**:
```markdown
@ssh-operations-expert setup secure SSH access with key management and automation
```

### traefik-proxy-expert
**Location**: `.claude/agents/devops/traefik-proxy-expert.md`
**Purpose**: Traefik reverse proxy configuration
**Expertise**: Load balancing, SSL termination, service discovery
**Example**:
```markdown
@traefik-proxy-expert configure Traefik for microservices with automatic SSL certificates
```

### mcp-context-manager
**Location**: `.claude/agents/devops/mcp-context-manager.md`
**Purpose**: Model Context Protocol deployment and management
**Expertise**: MCP servers, context management, integration
**Example**:
```markdown
@mcp-context-manager deploy and configure MCP servers for development team
```

## Cloud Architecture Agents

### aws-cloud-architect
**Location**: `.claude/agents/cloud/aws-cloud-architect.md`
**Purpose**: AWS infrastructure design and implementation
**Expertise**: EC2, Lambda, RDS, VPC, CloudFormation, cost optimization
**Example**:
```markdown
@aws-cloud-architect design serverless architecture for image processing with auto-scaling
```

### azure-cloud-architect
**Location**: `.claude/agents/cloud/azure-cloud-architect.md`
**Purpose**: Azure cloud infrastructure and services
**Expertise**: Azure VMs, AKS, Functions, ARM templates, cost management
**Example**:
```markdown
@azure-cloud-architect create Azure infrastructure with AKS cluster and monitoring
```

### gcp-cloud-architect
**Location**: `.claude/agents/cloud/gcp-cloud-architect.md`
**Purpose**: Google Cloud Platform architecture
**Expertise**: Compute Engine, GKE, Cloud Functions, Terraform
**Example**:
```markdown
@gcp-cloud-architect implement event-driven architecture with Cloud Run and Pub/Sub
```

### terraform-infrastructure-expert
**Location**: `.claude/agents/cloud/terraform-infrastructure-expert.md`
**Purpose**: Infrastructure as Code with Terraform
**Expertise**: Terraform modules, state management, multi-cloud deployments
**Example**:
```markdown
@terraform-infrastructure-expert create reusable Terraform modules for multi-environment deployment
```

### kubernetes-orchestrator
**Location**: `.claude/agents/cloud/kubernetes-orchestrator.md`
**Purpose**: Kubernetes orchestration and management
**Expertise**: K8s deployment, scaling, monitoring, service mesh
**Example**:
```markdown
@kubernetes-orchestrator implement blue-green deployment strategy with monitoring
```

### openai-python-expert
**Location**: `.claude/agents/cloud/openai-python-expert.md`
**Purpose**: OpenAI API integration with Python
**Expertise**: OpenAI APIs, embeddings, fine-tuning, Python integration
**Example**:
```markdown
@openai-python-expert implement intelligent document processing with OpenAI embeddings
```

### gemini-api-expert
**Location**: `.claude/agents/cloud/gemini-api-expert.md`
**Purpose**: Google Gemini API integration
**Expertise**: Gemini Pro, multimodal AI, Google AI Studio
**Example**:
```markdown
@gemini-api-expert create multimodal AI application with text and image processing
```

### gcp-cloud-functions-engineer
**Location**: `.claude/agents/cloud/gcp-cloud-functions-engineer.md`
**Purpose**: Google Cloud Functions development
**Expertise**: Serverless functions, event triggers, HTTP functions
**Example**:
```markdown
@gcp-cloud-functions-engineer create event-driven serverless functions for data processing
```

## Database Specialists

### postgresql-expert
**Location**: `.claude/agents/databases/postgresql-expert.md`
**Purpose**: PostgreSQL database design and optimization
**Expertise**: Schema design, query optimization, indexes, performance tuning
**Example**:
```markdown
@postgresql-expert optimize database schema for high-performance e-commerce application
```

### mongodb-expert
**Location**: `.claude/agents/databases/mongodb-expert.md`
**Purpose**: MongoDB NoSQL database development
**Expertise**: Document design, aggregation pipelines, indexing, sharding
**Example**:
```markdown
@mongodb-expert design scalable document schema for user activity tracking
```

### redis-expert
**Location**: `.claude/agents/databases/redis-expert.md`
**Purpose**: Redis caching and data structures
**Expertise**: Caching strategies, data structures, performance optimization
**Example**:
```markdown
@redis-expert implement distributed caching strategy with Redis cluster
```

### cosmosdb-expert
**Location**: `.claude/agents/databases/cosmosdb-expert.md`
**Purpose**: Azure Cosmos DB development
**Expertise**: Multi-model database, global distribution, consistency levels
**Example**:
```markdown
@cosmosdb-expert design globally distributed database with optimal consistency model
```

### bigquery-expert
**Location**: `.claude/agents/databases/bigquery-expert.md`
**Purpose**: Google BigQuery analytics and data warehousing
**Expertise**: SQL optimization, data modeling, analytics, streaming
**Example**:
```markdown
@bigquery-expert create data warehouse with real-time analytics and reporting
```

## Data Pipeline Agents

### langgraph-workflow-expert
**Location**: `.claude/agents/data/langgraph-workflow-expert.md`
**Purpose**: LangGraph workflow orchestration
**Expertise**: AI workflow design, graph-based processing, state management
**Example**:
```markdown
@langgraph-workflow-expert create intelligent document processing workflow with multiple AI agents
```

### airflow-orchestration-expert
**Location**: `.claude/agents/data/airflow-orchestration-expert.md`
**Purpose**: Apache Airflow data pipeline orchestration
**Expertise**: DAGs, task scheduling, data pipeline automation
**Example**:
```markdown
@airflow-orchestration-expert design data pipeline for ETL processing with monitoring
```

### kedro-pipeline-expert
**Location**: `.claude/agents/data/kedro-pipeline-expert.md`
**Purpose**: Kedro data science pipeline development
**Expertise**: ML pipelines, data versioning, experiment tracking
**Example**:
```markdown
@kedro-pipeline-expert create ML pipeline with data versioning and experiment tracking
```

## Decision Matrix Agents

### playwright-testing-selection
**Location**: `.claude/agents/decision-matrices/playwright-testing-selection.md`
**Purpose**: Help choose optimal Playwright testing approach
**Use for**: Test strategy decisions, framework selection
**Example**:
```markdown
@playwright-testing-selection recommend testing approach for e-commerce application
```

### python-backend-selection
**Location**: `.claude/agents/decision-matrices/python-backend-selection.md`
**Purpose**: Choose optimal Python backend framework
**Use for**: Architecture decisions, framework selection
**Example**:
```markdown
@python-backend-selection recommend backend stack for high-traffic API
```

### ui-framework-selection
**Location**: `.claude/agents/decision-matrices/ui-framework-selection.md`
**Purpose**: Help choose UI framework and approach
**Use for**: Frontend technology decisions, component library selection
**Example**:
```markdown
@ui-framework-selection recommend UI stack for enterprise dashboard application
```

## Agent Usage Tips

### Legacy Agent Support
Legacy agent names continue to work with deprecation warnings:
- `@docker-expert` → `@docker-containerization-expert`
- `@react-expert` → `@react-ui-expert`
- `@python-expert` → `@python-backend-expert`

### Best Practices
1. **Use specific agents** for specialized tasks
2. **Combine agents** for complex workflows
3. **Provide context** to get better results
4. **Start with decision matrices** when unsure

### Agent Coordination
When using multiple agents:
```markdown
# Sequential execution
@code-analyzer review code quality
THEN @test-runner execute tests
THEN @docker-containerization-expert prepare deployment

# Parallel execution (when enabled)
@code-analyzer review backend/
@test-runner execute unit tests
@docker-containerization-expert build images
```

## Migration from Legacy Agents

If you're using deprecated agent names, update to the new consolidated agents:

| Legacy Agent | New Agent | Notes |
|--------------|-----------|--------|
| `@react-expert` | `@react-ui-expert` | Unified UI expert |
| `@vue-expert` | `@react-ui-expert` | Use with Vue parameter |
| `@angular-expert` | `@react-ui-expert` | Use with Angular parameter |
| `@docker-expert` | `@docker-containerization-expert` | Consolidated Docker agent |
| `@kubernetes-expert` | `@kubernetes-orchestrator` | Enhanced K8s capabilities |
| `@python-expert` | `@python-backend-expert` | Unified Python backend |

## Related Pages

- [Agent Selection Guide](Agent-Selection-Guide) - Choose the right agent
- [Custom Agents](Custom-Agents) - Create your own agents
- [Configuration Options](Configuration-Options) - Agent configuration
- [Testing Strategies](Testing-Strategies) - Testing with agents