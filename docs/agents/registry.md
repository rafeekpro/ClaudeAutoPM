# Agent Registry

Complete catalog of all 39 specialized AI agents available in ClaudeAutoPM.

---

## Quick Reference

| Category | Count | Agents |
|----------|-------|--------|
| **Core** | 7 | System operations, coordination, analysis |
| **Languages** | 6 | Python, Node.js, JavaScript, Bash |
| **Frameworks** | 8 | React, FastAPI, Tailwind, Testing |
| **Cloud** | 7 | AWS, Azure, GCP, Terraform, Observability |
| **DevOps** | 6 | Docker, Kubernetes, CI/CD, GitHub Ops |
| **Databases** | 5 | PostgreSQL, MongoDB, Redis, MySQL |
| **Total** | **39** | All active agents |

---

## Core Agents (7)

System-level agents for project management and coordination.

### agent-manager
**Purpose:** Create, analyze, and manage agents in the registry

**Expertise:**
- Agent creation and validation
- Registry management
- Agent documentation
- Best practices enforcement

**When to use:**
```
@agent-manager create a new agent for GraphQL development
@agent-manager validate all agent definitions
@agent-manager update agent documentation
```

**Tools:** All (Read, Write, Edit, Bash, Task, Agent)

**File:** `.claude/agents/core/agent-manager.md`

---

### code-analyzer
**Purpose:** Analyze code changes for bugs, trace logic flow, investigate issues

**Expertise:**
- Deep code analysis
- Bug detection
- Logic flow tracing
- Performance analysis
- Security scanning

**When to use:**
```
@code-analyzer review recent changes for potential bugs
@code-analyzer trace the authentication flow
@code-analyzer check for security vulnerabilities
```

**Tools:** Read, Grep, Glob, Task, Agent

**File:** `.claude/agents/core/code-analyzer.md`

---

### file-analyzer
**Purpose:** Analyze and summarize large files to reduce context usage

**Expertise:**
- Log file analysis
- Pattern extraction
- Error identification
- Context optimization

**When to use:**
```
@file-analyzer summarize the test.log file
@file-analyzer extract errors from deployment logs
@file-analyzer analyze the build output
```

**Tools:** Read, Grep, Glob, Task

**File:** `.claude/agents/core/file-analyzer.md`

---

### test-runner
**Purpose:** Execute tests and provide comprehensive failure analysis

**Expertise:**
- Test execution
- Failure analysis
- Coverage reporting
- Performance testing

**When to use:**
```
@test-runner run all unit tests
@test-runner execute integration tests and analyze failures
@test-runner check test coverage
```

**Tools:** Bash, Read, Grep, Task

**File:** `.claude/agents/core/test-runner.md`

---

### parallel-worker
**Purpose:** Execute independent tasks in parallel for better performance

**Expertise:**
- Parallel task execution
- Dependency analysis
- Resource optimization
- Concurrent processing

**When to use:**
```
@parallel-worker execute these independent tasks concurrently
@parallel-worker optimize build process
```

**Tools:** All (supports parallel execution)

**File:** `.claude/agents/core/parallel-worker.md`

---

### mcp-manager
**Purpose:** Manage Model Context Protocol servers and integrations

**Expertise:**
- MCP server configuration
- Server diagnostics
- Integration testing
- Documentation access

**When to use:**
```
@mcp-manager diagnose Context7 connection issues
@mcp-manager configure new MCP server
@mcp-manager test all MCP integrations
```

**Tools:** Bash, Read, Write, Edit, MCP tools

**File:** `.claude/agents/core/mcp-manager.md`

---

### documentation-manager
**Purpose:** Create and maintain comprehensive project documentation

**Expertise:**
- Documentation structure
- API documentation
- User guides
- README files

**When to use:**
```
@documentation-manager create API documentation
@documentation-manager update user guide
@documentation-manager generate README
```

**Tools:** Read, Write, Edit, Grep

**File:** `.claude/agents/core/documentation-manager.md`

---

## Language Agents (6)

Specialized agents for programming languages.

### python-backend-engineer
**Purpose:** Expert Python backend developer specializing in FastAPI, async, SQLAlchemy

**Expertise:**
- FastAPI applications
- Async Python patterns
- SQLAlchemy ORM
- Type hints and Pydantic
- API development
- Python best practices

**When to use:**
```
@python-backend-engineer create FastAPI application
@python-backend-engineer implement async database operations
@python-backend-engineer build REST API with authentication
```

**Framework expertise:**
- FastAPI ⭐⭐⭐⭐⭐
- SQLAlchemy ⭐⭐⭐⭐⭐
- Pydantic ⭐⭐⭐⭐⭐
- aiohttp ⭐⭐⭐⭐

**Tools:** All backend tools, Bash, Read, Write, Edit

**File:** `.claude/agents/languages/python-backend-engineer.md`

**MCP Integration:** Uses Context7 for latest Python/FastAPI docs

---

### nodejs-backend-engineer
**Purpose:** Expert Node.js/TypeScript backend developer

**Expertise:**
- Express.js applications
- TypeScript backends
- REST APIs
- GraphQL servers
- Microservices
- Real-time applications (WebSockets)

**When to use:**
```
@nodejs-backend-engineer create Express REST API
@nodejs-backend-engineer implement GraphQL server
@nodejs-backend-engineer build microservice with TypeScript
```

**Framework expertise:**
- Express.js ⭐⭐⭐⭐⭐
- NestJS ⭐⭐⭐⭐⭐
- Fastify ⭐⭐⭐⭐
- GraphQL ⭐⭐⭐⭐

**Tools:** All backend tools, Bash, npm, Read, Write, Edit

**File:** `.claude/agents/languages/nodejs-backend-engineer.md`

**MCP Integration:** Uses Context7 for Node.js/TypeScript docs

---

### javascript-frontend-engineer
**Purpose:** Modern JavaScript/TypeScript frontend specialist

**Expertise:**
- Vanilla JavaScript/TypeScript
- Modern ECMAScript features
- Browser APIs
- Frontend performance
- DOM manipulation
- Async operations

**When to use:**
```
@javascript-frontend-engineer create interactive UI components
@javascript-frontend-engineer optimize frontend performance
@javascript-frontend-engineer implement modern JavaScript features
```

**Expertise:**
- ES2024+ features ⭐⭐⭐⭐⭐
- TypeScript ⭐⭐⭐⭐⭐
- Browser APIs ⭐⭐⭐⭐⭐
- Performance optimization ⭐⭐⭐⭐

**Tools:** All frontend tools, npm, Read, Write, Edit

**File:** `.claude/agents/languages/javascript-frontend-engineer.md`

**MCP Integration:** Uses Context7 for JavaScript/TypeScript docs

---

### bash-scripting-expert
**Purpose:** Expert in Bash scripting, shell automation, system administration

**Expertise:**
- Shell scripting
- CI/CD scripts
- System automation
- POSIX compliance
- Error handling
- Process management
- Cross-platform scripts

**When to use:**
```
@bash-scripting-expert create deployment script
@bash-scripting-expert write CI/CD automation
@bash-scripting-expert implement backup script
```

**Expertise:**
- Bash scripting ⭐⭐⭐⭐⭐
- POSIX compliance ⭐⭐⭐⭐⭐
- CI/CD automation ⭐⭐⭐⭐
- System administration ⭐⭐⭐⭐

**Tools:** Bash, Read, Write, Edit, Grep

**File:** `.claude/agents/languages/bash-scripting-expert.md`

---

### go-backend-engineer
**Purpose:** Expert Go developer for backend services and microservices

**Expertise:**
- Go web services
- gRPC APIs
- Microservices architecture
- Concurrency patterns
- Performance optimization

**When to use:**
```
@go-backend-engineer create gRPC service
@go-backend-engineer implement concurrent processing
@go-backend-engineer build high-performance API
```

**Framework expertise:**
- Go standard library ⭐⭐⭐⭐⭐
- gRPC ⭐⭐⭐⭐⭐
- Gorilla Mux ⭐⭐⭐⭐
- GORM ⭐⭐⭐⭐

**Tools:** All backend tools, Bash, Read, Write, Edit

**File:** `.claude/agents/languages/go-backend-engineer.md`

---

### rust-systems-engineer
**Purpose:** Expert Rust developer for systems programming and performance-critical code

**Expertise:**
- Systems programming
- Memory safety
- Concurrency
- WebAssembly
- Performance optimization

**When to use:**
```
@rust-systems-engineer create high-performance service
@rust-systems-engineer implement WebAssembly module
@rust-systems-engineer optimize critical path
```

**Expertise:**
- Rust core ⭐⭐⭐⭐⭐
- Tokio async ⭐⭐⭐⭐⭐
- WebAssembly ⭐⭐⭐⭐
- Systems programming ⭐⭐⭐⭐⭐

**Tools:** All backend tools, Bash, cargo, Read, Write, Edit

**File:** `.claude/agents/languages/rust-systems-engineer.md`

---

## Framework Agents (8)

Specialized agents for popular frameworks.

### react-frontend-engineer
**Purpose:** Expert React/Next.js developer for modern frontend applications

**Expertise:**
- React 18+ with hooks
- Next.js 14+ (App Router)
- Server components
- TypeScript
- State management (Context, Zustand)
- Performance optimization

**When to use:**
```
@react-frontend-engineer create Next.js application
@react-frontend-engineer implement React components with hooks
@react-frontend-engineer optimize React performance
```

**Framework expertise:**
- React 18+ ⭐⭐⭐⭐⭐
- Next.js 14+ ⭐⭐⭐⭐⭐
- TypeScript ⭐⭐⭐⭐⭐
- Server components ⭐⭐⭐⭐⭐

**Tools:** npm, Read, Write, Edit, Bash

**File:** `.claude/agents/frameworks/react-frontend-engineer.md`

**MCP Integration:** Uses Context7 for React/Next.js docs

---

### react-ui-expert
**Purpose:** Expert in React UI libraries and design systems

**Expertise:**
- Material-UI (MUI)
- Chakra UI
- Radix UI
- shadcn/ui
- Component libraries
- Design systems
- Accessibility (WCAG)

**When to use:**
```
@react-ui-expert create design system with Material-UI
@react-ui-expert implement accessible components with Radix
@react-ui-expert build UI with shadcn/ui
```

**Library expertise:**
- Material-UI ⭐⭐⭐⭐⭐
- Chakra UI ⭐⭐⭐⭐⭐
- Radix UI ⭐⭐⭐⭐⭐
- shadcn/ui ⭐⭐⭐⭐⭐
- Accessibility ⭐⭐⭐⭐⭐

**Tools:** npm, Read, Write, Edit

**File:** `.claude/agents/frameworks/react-ui-expert.md`

**MCP Integration:** Uses Context7 for UI library docs

---

### tailwindcss-expert
**Purpose:** Expert in Tailwind CSS and utility-first styling

**Expertise:**
- Tailwind CSS v3+
- Utility-first design
- Responsive design
- Dark mode
- Custom configurations
- Component patterns

**When to use:**
```
@tailwindcss-expert create responsive layout with Tailwind
@tailwindcss-expert implement dark mode
@tailwindcss-expert optimize Tailwind configuration
```

**Expertise:**
- Tailwind CSS ⭐⭐⭐⭐⭐
- Responsive design ⭐⭐⭐⭐⭐
- Dark mode ⭐⭐⭐⭐⭐
- Custom plugins ⭐⭐⭐⭐

**Tools:** npm, Read, Write, Edit

**File:** `.claude/agents/frameworks/tailwindcss-expert.md`

**MCP Integration:** Uses Context7 for Tailwind docs

---

### vue-frontend-engineer
**Purpose:** Expert Vue.js/Nuxt developer

**Expertise:**
- Vue 3 Composition API
- Nuxt 3
- TypeScript
- State management (Pinia)
- SSR/SSG

**When to use:**
```
@vue-frontend-engineer create Vue 3 application
@vue-frontend-engineer implement Nuxt 3 app with SSR
@vue-frontend-engineer build with Composition API
```

**Framework expertise:**
- Vue 3 ⭐⭐⭐⭐⭐
- Nuxt 3 ⭐⭐⭐⭐⭐
- Pinia ⭐⭐⭐⭐
- TypeScript ⭐⭐⭐⭐

**Tools:** npm, Read, Write, Edit, Bash

**File:** `.claude/agents/frameworks/vue-frontend-engineer.md`

**MCP Integration:** Uses Context7 for Vue/Nuxt docs

---

### e2e-test-engineer
**Purpose:** Expert in end-to-end testing with Playwright and Cypress

**Expertise:**
- Playwright testing
- Cypress testing
- Visual regression
- Test automation
- CI/CD integration
- Accessibility testing

**When to use:**
```
@e2e-test-engineer create Playwright test suite
@e2e-test-engineer implement Cypress tests
@e2e-test-engineer add visual regression testing
```

**Framework expertise:**
- Playwright ⭐⭐⭐⭐⭐
- Cypress ⭐⭐⭐⭐⭐
- Visual testing ⭐⭐⭐⭐
- Accessibility testing ⭐⭐⭐⭐

**Tools:** npm, Bash, Read, Write, Edit, Playwright MCP

**File:** `.claude/agents/testing/e2e-test-engineer.md`

**MCP Integration:** Uses Context7 and Playwright MCP

---

### frontend-testing-engineer
**Purpose:** Expert in frontend unit and integration testing

**Expertise:**
- Vitest/Jest testing
- React Testing Library
- Component testing
- Test-driven development
- Code coverage
- Mock strategies

**When to use:**
```
@frontend-testing-engineer create unit tests for React components
@frontend-testing-engineer implement integration tests
@frontend-testing-engineer improve test coverage
```

**Framework expertise:**
- Vitest ⭐⭐⭐⭐⭐
- Jest ⭐⭐⭐⭐⭐
- React Testing Library ⭐⭐⭐⭐⭐
- TDD ⭐⭐⭐⭐⭐

**Tools:** npm, Bash, Read, Write, Edit

**File:** `.claude/agents/testing/frontend-testing-engineer.md`

---

### backend-testing-engineer
**Purpose:** Expert in backend testing strategies

**Expertise:**
- pytest (Python)
- Jest/Mocha (Node.js)
- Integration testing
- API testing
- Database testing
- Test fixtures

**When to use:**
```
@backend-testing-engineer create API test suite
@backend-testing-engineer implement integration tests
@backend-testing-engineer add database tests
```

**Framework expertise:**
- pytest ⭐⭐⭐⭐⭐
- Jest ⭐⭐⭐⭐⭐
- API testing ⭐⭐⭐⭐⭐
- TDD ⭐⭐⭐⭐⭐

**Tools:** Bash, Read, Write, Edit, pytest, npm

**File:** `.claude/agents/testing/backend-testing-engineer.md`

---

### ux-design-expert
**Purpose:** Expert in user experience design and interaction patterns

**Expertise:**
- UX principles
- Interaction design
- Accessibility (WCAG 2.1)
- Design systems
- User flows
- Responsive design

**When to use:**
```
@ux-design-expert review UX of application
@ux-design-expert create accessible user interface
@ux-design-expert design user flow
```

**Expertise:**
- UX principles ⭐⭐⭐⭐⭐
- Accessibility ⭐⭐⭐⭐⭐
- Design systems ⭐⭐⭐⭐⭐
- Interaction design ⭐⭐⭐⭐⭐

**Tools:** Read, Write, Edit

**File:** `.claude/agents/frameworks/ux-design-expert.md`

---

## Cloud Agents (7)

Cloud platform and infrastructure specialists.

### aws-cloud-architect
**Purpose:** Expert AWS cloud architect for scalable infrastructure

**Expertise:**
- AWS services (EC2, S3, RDS, Lambda, etc.)
- Infrastructure as Code (CloudFormation, CDK)
- Serverless architectures
- Cost optimization
- Security best practices
- High availability design

**When to use:**
```
@aws-cloud-architect design AWS infrastructure
@aws-cloud-architect create serverless architecture
@aws-cloud-architect optimize AWS costs
```

**Service expertise:**
- AWS Lambda ⭐⭐⭐⭐⭐
- AWS CDK ⭐⭐⭐⭐⭐
- ECS/EKS ⭐⭐⭐⭐⭐
- RDS ⭐⭐⭐⭐⭐

**Tools:** Bash, AWS CLI, Read, Write, Edit

**File:** `.claude/agents/cloud/aws-cloud-architect.md`

---

### azure-cloud-architect
**Purpose:** Expert Azure cloud architect

**Expertise:**
- Azure services
- ARM templates / Bicep
- Azure Functions
- AKS (Azure Kubernetes Service)
- Cost management
- Security and compliance

**When to use:**
```
@azure-cloud-architect design Azure infrastructure
@azure-cloud-architect create ARM templates
@azure-cloud-architect optimize Azure deployment
```

**Service expertise:**
- Azure Functions ⭐⭐⭐⭐⭐
- AKS ⭐⭐⭐⭐⭐
- Azure SQL ⭐⭐⭐⭐⭐
- Bicep ⭐⭐⭐⭐⭐

**Tools:** Bash, Azure CLI, Read, Write, Edit

**File:** `.claude/agents/cloud/azure-cloud-architect.md`

---

### gcp-cloud-architect
**Purpose:** Expert Google Cloud Platform architect

**Expertise:**
- GCP services
- Cloud Functions
- GKE (Google Kubernetes Engine)
- BigQuery
- Deployment Manager
- Cost optimization

**When to use:**
```
@gcp-cloud-architect design GCP infrastructure
@gcp-cloud-architect create Cloud Functions
@gcp-cloud-architect optimize GCP costs
```

**Service expertise:**
- Cloud Functions ⭐⭐⭐⭐⭐
- GKE ⭐⭐⭐⭐⭐
- BigQuery ⭐⭐⭐⭐⭐
- Cloud Run ⭐⭐⭐⭐⭐

**Tools:** Bash, gcloud CLI, Read, Write, Edit

**File:** `.claude/agents/cloud/gcp-cloud-architect.md`

---

### terraform-infrastructure-expert
**Purpose:** Expert in multi-cloud Infrastructure as Code with Terraform

**Expertise:**
- Terraform core
- Multi-cloud deployments
- Module development
- State management
- Best practices
- AWS/Azure/GCP providers

**When to use:**
```
@terraform-infrastructure-expert create Terraform modules
@terraform-infrastructure-expert implement multi-cloud infrastructure
@terraform-infrastructure-expert manage Terraform state
```

**Expertise:**
- Terraform ⭐⭐⭐⭐⭐
- Multi-cloud ⭐⭐⭐⭐⭐
- Module design ⭐⭐⭐⭐⭐
- State management ⭐⭐⭐⭐⭐

**Tools:** Bash, terraform, Read, Write, Edit

**File:** `.claude/agents/cloud/terraform-infrastructure-expert.md`

**MCP Integration:** Uses Context7 for Terraform docs

---

### pulumi-infrastructure-expert
**Purpose:** Expert in Infrastructure as Code with Pulumi

**Expertise:**
- Pulumi programming
- TypeScript/Python for IaC
- Multi-cloud support
- State management
- Policy as Code

**When to use:**
```
@pulumi-infrastructure-expert create Pulumi infrastructure
@pulumi-infrastructure-expert implement policy as code
@pulumi-infrastructure-expert manage cloud resources
```

**Expertise:**
- Pulumi ⭐⭐⭐⭐⭐
- TypeScript IaC ⭐⭐⭐⭐⭐
- Multi-cloud ⭐⭐⭐⭐
- Policy as Code ⭐⭐⭐⭐

**Tools:** Bash, pulumi, npm, Read, Write, Edit

**File:** `.claude/agents/cloud/pulumi-infrastructure-expert.md`

---

### cloudflare-edge-expert
**Purpose:** Expert in Cloudflare Workers and edge computing

**Expertise:**
- Cloudflare Workers
- Edge functions
- KV storage
- Durable Objects
- D1 database
- CDN optimization

**When to use:**
```
@cloudflare-edge-expert create Cloudflare Worker
@cloudflare-edge-expert implement edge functions
@cloudflare-edge-expert optimize CDN delivery
```

**Expertise:**
- Cloudflare Workers ⭐⭐⭐⭐⭐
- Edge computing ⭐⭐⭐⭐⭐
- KV/Durable Objects ⭐⭐⭐⭐
- CDN optimization ⭐⭐⭐⭐⭐

**Tools:** Bash, wrangler CLI, npm, Read, Write, Edit

**File:** `.claude/agents/cloud/cloudflare-edge-expert.md`

---

### observability-engineer
**Purpose:** Expert in monitoring, logging, and observability

**Expertise:**
- Prometheus/Grafana
- ELK Stack
- OpenTelemetry
- Metrics and tracing
- Alerting strategies
- SLO/SLI definition

**When to use:**
```
@observability-engineer implement monitoring solution
@observability-engineer create Grafana dashboards
@observability-engineer set up distributed tracing
```

**Expertise:**
- Prometheus ⭐⭐⭐⭐⭐
- Grafana ⭐⭐⭐⭐⭐
- OpenTelemetry ⭐⭐⭐⭐⭐
- ELK Stack ⭐⭐⭐⭐

**Tools:** Bash, Read, Write, Edit, Docker

**File:** `.claude/agents/cloud/observability-engineer.md`

---

## DevOps Agents (6)

DevOps, CI/CD, and container orchestration specialists.

### docker-containerization-expert
**Purpose:** Expert in Docker containerization and best practices

**Expertise:**
- Dockerfile optimization
- Multi-stage builds
- Docker Compose
- Container security
- Image optimization
- Docker networking

**When to use:**
```
@docker-containerization-expert create production Dockerfile
@docker-containerization-expert optimize container images
@docker-containerization-expert implement multi-stage builds
```

**Expertise:**
- Docker ⭐⭐⭐⭐⭐
- Multi-stage builds ⭐⭐⭐⭐⭐
- Container security ⭐⭐⭐⭐⭐
- Image optimization ⭐⭐⭐⭐⭐

**Tools:** Bash, docker, Read, Write, Edit

**File:** `.claude/agents/devops/docker-containerization-expert.md`

**MCP Integration:** Uses Context7 for Docker docs

---

### kubernetes-orchestrator
**Purpose:** Expert in Kubernetes orchestration and deployment

**Expertise:**
- Kubernetes manifests
- Helm charts
- Service meshes (Istio)
- Scaling strategies
- Production deployments
- Security (RBAC, PSP)

**When to use:**
```
@kubernetes-orchestrator create Kubernetes deployment
@kubernetes-orchestrator implement Helm chart
@kubernetes-orchestrator configure auto-scaling
```

**Expertise:**
- Kubernetes ⭐⭐⭐⭐⭐
- Helm ⭐⭐⭐⭐⭐
- Service meshes ⭐⭐⭐⭐
- Production ops ⭐⭐⭐⭐⭐

**Tools:** Bash, kubectl, helm, Read, Write, Edit

**File:** `.claude/agents/devops/kubernetes-orchestrator.md`

**MCP Integration:** Uses Context7 for Kubernetes docs

---

### github-operations-specialist
**Purpose:** Expert in GitHub workflows, Actions, and automation

**Expertise:**
- GitHub Actions
- CI/CD pipelines
- Workflow automation
- GitHub API
- Release management
- Repository administration

**When to use:**
```
@github-operations-specialist create GitHub Actions workflow
@github-operations-specialist automate release process
@github-operations-specialist implement CI/CD pipeline
```

**Expertise:**
- GitHub Actions ⭐⭐⭐⭐⭐
- CI/CD ⭐⭐⭐⭐⭐
- GitHub API ⭐⭐⭐⭐⭐
- Automation ⭐⭐⭐⭐⭐

**Tools:** Bash, gh CLI, Read, Write, Edit

**File:** `.claude/agents/devops/github-operations-specialist.md`

---

### gitlab-cicd-expert
**Purpose:** Expert in GitLab CI/CD pipelines

**Expertise:**
- GitLab CI/CD
- Pipeline optimization
- Docker integration
- Auto DevOps
- Security scanning

**When to use:**
```
@gitlab-cicd-expert create GitLab pipeline
@gitlab-cicd-expert optimize CI/CD performance
@gitlab-cicd-expert implement security scanning
```

**Expertise:**
- GitLab CI/CD ⭐⭐⭐⭐⭐
- Pipeline optimization ⭐⭐⭐⭐⭐
- Docker integration ⭐⭐⭐⭐
- Security scanning ⭐⭐⭐⭐

**Tools:** Bash, gitlab-runner, Read, Write, Edit

**File:** `.claude/agents/devops/gitlab-cicd-expert.md`

---

### jenkins-automation-expert
**Purpose:** Expert in Jenkins automation and pipeline development

**Expertise:**
- Jenkins pipelines
- Jenkinsfile
- Plugin management
- Distributed builds
- Integration with SCM

**When to use:**
```
@jenkins-automation-expert create Jenkins pipeline
@jenkins-automation-expert optimize build process
@jenkins-automation-expert configure distributed builds
```

**Expertise:**
- Jenkins ⭐⭐⭐⭐⭐
- Groovy pipelines ⭐⭐⭐⭐⭐
- Plugin ecosystem ⭐⭐⭐⭐
- Distributed builds ⭐⭐⭐⭐

**Tools:** Bash, jenkins-cli, Read, Write, Edit

**File:** `.claude/agents/devops/jenkins-automation-expert.md`

---

### security-engineer
**Purpose:** Expert in security best practices and vulnerability management

**Expertise:**
- Security scanning
- Vulnerability assessment
- Dependency management
- Secret management
- Security policies
- Compliance

**When to use:**
```
@security-engineer audit application security
@security-engineer implement security scanning
@security-engineer manage secrets securely
```

**Expertise:**
- Security scanning ⭐⭐⭐⭐⭐
- Vulnerability assessment ⭐⭐⭐⭐⭐
- Secret management ⭐⭐⭐⭐⭐
- Compliance ⭐⭐⭐⭐

**Tools:** Bash, security scanning tools, Read, Write, Edit

**File:** `.claude/agents/devops/security-engineer.md`

---

## Database Agents (5)

Database specialists for different database systems.

### postgresql-expert
**Purpose:** Expert PostgreSQL database administrator and developer

**Expertise:**
- PostgreSQL 15+
- Query optimization
- Indexing strategies
- Replication
- Backup/recovery
- Performance tuning
- pgvector for AI applications

**When to use:**
```
@postgresql-expert design database schema
@postgresql-expert optimize slow queries
@postgresql-expert implement replication
```

**Expertise:**
- PostgreSQL ⭐⭐⭐⭐⭐
- Query optimization ⭐⭐⭐⭐⭐
- Indexing ⭐⭐⭐⭐⭐
- Performance tuning ⭐⭐⭐⭐⭐

**Tools:** Bash, psql, Read, Write, Edit

**File:** `.claude/agents/databases/postgresql-expert.md`

**MCP Integration:** Uses Context7 for PostgreSQL docs

---

### mongodb-expert
**Purpose:** Expert MongoDB developer and administrator

**Expertise:**
- MongoDB 6+
- Document modeling
- Aggregation pipeline
- Sharding
- Replication
- Performance optimization

**When to use:**
```
@mongodb-expert design document schema
@mongodb-expert create aggregation pipeline
@mongodb-expert implement sharding
```

**Expertise:**
- MongoDB ⭐⭐⭐⭐⭐
- Document modeling ⭐⭐⭐⭐⭐
- Aggregation ⭐⭐⭐⭐⭐
- Sharding ⭐⭐⭐⭐

**Tools:** Bash, mongosh, Read, Write, Edit

**File:** `.claude/agents/databases/mongodb-expert.md`

**MCP Integration:** Uses Context7 for MongoDB docs

---

### redis-cache-expert
**Purpose:** Expert Redis for caching and real-time applications

**Expertise:**
- Redis data structures
- Caching strategies
- Pub/Sub messaging
- Redis Streams
- Performance optimization
- Cluster management

**When to use:**
```
@redis-cache-expert implement caching strategy
@redis-cache-expert create pub/sub messaging
@redis-cache-expert optimize Redis performance
```

**Expertise:**
- Redis ⭐⭐⭐⭐⭐
- Caching strategies ⭐⭐⭐⭐⭐
- Pub/Sub ⭐⭐⭐⭐
- Redis Streams ⭐⭐⭐⭐

**Tools:** Bash, redis-cli, Read, Write, Edit

**File:** `.claude/agents/databases/redis-cache-expert.md`

---

### mysql-expert
**Purpose:** Expert MySQL database administrator

**Expertise:**
- MySQL 8+
- Query optimization
- Replication
- InnoDB tuning
- Backup strategies

**When to use:**
```
@mysql-expert optimize MySQL queries
@mysql-expert implement replication
@mysql-expert tune InnoDB configuration
```

**Expertise:**
- MySQL ⭐⭐⭐⭐⭐
- Query optimization ⭐⭐⭐⭐⭐
- Replication ⭐⭐⭐⭐
- InnoDB ⭐⭐⭐⭐

**Tools:** Bash, mysql, Read, Write, Edit

**File:** `.claude/agents/databases/mysql-expert.md`

---

### database-migration-expert
**Purpose:** Expert in database migrations and schema evolution

**Expertise:**
- Schema migrations
- Data migrations
- Zero-downtime deployments
- Migration tools (Alembic, Flyway, Liquibase)
- Rollback strategies

**When to use:**
```
@database-migration-expert create migration strategy
@database-migration-expert implement zero-downtime migration
@database-migration-expert design rollback plan
```

**Expertise:**
- Schema migrations ⭐⭐⭐⭐⭐
- Zero-downtime ⭐⭐⭐⭐⭐
- Migration tools ⭐⭐⭐⭐⭐
- Rollback strategies ⭐⭐⭐⭐

**Tools:** Bash, migration tools, Read, Write, Edit

**File:** `.claude/agents/databases/database-migration-expert.md`

---

## Agent Selection Guide

### By Task Type

**Planning & Architecture**
- Use agents with "architect" or "expert" in name
- Examples: `aws-cloud-architect`, `terraform-infrastructure-expert`

**Implementation**
- Use agents with "engineer" in name
- Examples: `python-backend-engineer`, `react-frontend-engineer`

**Operations & Deployment**
- Use "orchestrator" or "specialist" agents
- Examples: `kubernetes-orchestrator`, `github-operations-specialist`

### By Technology Stack

**Python + FastAPI + PostgreSQL**
```
@python-backend-engineer - Backend implementation
@postgresql-expert - Database design
@backend-testing-engineer - Test suite
@docker-containerization-expert - Containerization
```

**React + Next.js + TypeScript**
```
@react-frontend-engineer - Frontend implementation
@react-ui-expert - UI components
@tailwindcss-expert - Styling
@e2e-test-engineer - Testing
```

**Full-Stack with Cloud Deployment**
```
@python-backend-engineer - Backend API
@react-frontend-engineer - Frontend UI
@postgresql-expert - Database
@docker-containerization-expert - Containers
@kubernetes-orchestrator - Orchestration
@aws-cloud-architect - Cloud infrastructure
```

### By Project Phase

**Phase 1: Planning**
- `agent-manager` - Define project structure
- Architecture agents - Design infrastructure

**Phase 2: Development**
- Language/framework engineers - Implementation
- Database experts - Data layer

**Phase 3: Testing**
- Testing engineers - Test suites
- `test-runner` - Execute tests

**Phase 4: Deployment**
- DevOps agents - CI/CD and deployment
- Cloud architects - Infrastructure

**Phase 5: Monitoring**
- `observability-engineer` - Monitoring setup

---

## Agent Teams

Pre-configured teams for common scenarios:

### Frontend Team (15 agents)
```
- javascript-frontend-engineer
- react-frontend-engineer
- react-ui-expert
- tailwindcss-expert
- vue-frontend-engineer
- e2e-test-engineer
- frontend-testing-engineer
- ux-design-expert
+ Core agents (7)
```

### Backend Team (15 agents)
```
- python-backend-engineer
- nodejs-backend-engineer
- go-backend-engineer
- postgresql-expert
- mongodb-expert
- redis-cache-expert
- backend-testing-engineer
+ Core agents (7)
```

### Fullstack Team (30 agents)
```
All frontend agents (8)
All backend agents (8)
All database agents (5)
All testing agents (3)
+ Core agents (7)
```

### DevOps Team (25 agents)
```
All DevOps agents (6)
All Cloud agents (7)
All Database agents (5)
+ Core agents (7)
```

---

## Using Agents Effectively

### 1. Be Specific

**❌ Bad:**
```
Use python agent to build API
```

**✅ Good:**
```
@python-backend-engineer create FastAPI application with:
- JWT authentication
- PostgreSQL database via SQLAlchemy
- Async endpoints
- Type hints and Pydantic models
```

### 2. Provide Context

**❌ Bad:**
```
@react-frontend-engineer create component
```

**✅ Good:**
```
@react-frontend-engineer create LoginForm component with:
- Email and password fields
- Form validation
- Loading state
- Error handling
- Integration with auth context
```

### 3. Use Right Agent for Task

**❌ Bad:**
```
@python-backend-engineer style the UI with Tailwind
```

**✅ Good:**
```
@tailwindcss-expert style the UI components with:
- Responsive design
- Dark mode support
- Custom color scheme
```

### 4. Chain Agents for Complex Tasks

```
1. @python-backend-engineer create FastAPI endpoints
2. @postgresql-expert design database schema
3. @backend-testing-engineer add test suite
4. @docker-containerization-expert containerize application
```

---

## Custom Agents

You can create custom agents in `.claude/agents/custom/`:

```markdown
---
name: my-custom-agent
description: Custom agent for specific task
tools: Bash, Edit, Write, Read
model: inherit
---

# My Custom Agent

Expert in...

## Expertise
- Skill 1
- Skill 2

## When to use
...
```

---

## Agent Metadata

Each agent file contains frontmatter:

```yaml
---
name: python-backend-engineer
description: Expert Python backend developer
tools: Bash, Edit, Write, Read, Grep, Glob
model: inherit
color: "#3776AB"
icon: "🐍"
---
```

---

## Related Documentation

- [Core Agents](core-agents.md) - Deep dive into core agents
- [Language Agents](language-agents.md) - Language-specific agents
- [Framework Agents](framework-agents.md) - Framework specialists
- [Cloud Agents](cloud-agents.md) - Cloud platform agents
- [DevOps Agents](devops-agents.md) - DevOps and CI/CD agents
- [Custom Agents](custom-agents.md) - Creating your own agents

---

**Total Active Agents:** 39
**Last Updated:** v1.20.1 (January 2025)
