# CLAUDE.md

> Think carefully and implement the most concise solution that changes as little code as possible.

## 🚨 CRITICAL CI/CD RULES - HYBRID STRATEGY

The key to success is a clear distinction between the local environment and the CI/CD environment. We use a hybrid strategy to ensure fast development speed and reliable testing.

### 📖 Complete Docker + Kubernetes Hybrid Strategy

See **`.claude/HYBRID_STRATEGY.md`** for the complete Docker-first development + Kubernetes-native CI/CD implementation guide.

**Key Strategy Overview:**

- 🏠 **Local Development**: Pure docker-compose workflow (unchanged for developers)
- ☸️ **CI/CD Environment**: Kubernetes-native with Kaniko builds and kubectl orchestration
- 🐳 **Shared Artifacts**: Dockerfiles remain the single source of truth
- 🔄 **Developer Experience**: Zero disruption locally, robust CI/CD in production

**Architecture Benefits:**

- ✅ **Fast local iteration** with familiar Docker tools
- ✅ **Reliable CI/CD** compatible with containerd-based K8s runners  
- ✅ **Production parity** through Kubernetes-native testing
- ✅ **Scalable builds** using cluster resources via Kaniko

---

### 👨‍💻 Local Environment (Docker-First)

**CRITICAL**: All local development happens in Docker containers. No exceptions.

#### Development Workflow
```bash
# Start development environment
docker compose up -d

# Run all commands in containers
docker compose exec app npm install
docker compose exec app npm run dev
docker compose exec app npm test
```

#### Container Requirements
- **Dockerfiles** required for every service
- **Hot reload** enabled via volume mounts
- **Container networking** for service communication
- **Development databases** in containers

### ☸️ CI/CD Environment (Kubernetes-Native)

**GitHub Actions Kubernetes Testing Pipeline:**

#### Integration Testing Flow
1. **KIND cluster** setup for testing
2. **Kubernetes manifests** validation
3. **Helm charts** linting and testing
4. **Docker images** built and deployed to K8s
5. **Smoke tests** and integration validation
6. **Security scanning** with Trivy

#### Required Kubernetes Files
- `k8s/` directory with manifests
- `Chart.yaml` for Helm deployment
- Proper resource limits and security policies

### 🧪 Testing Strategy

#### Local Testing (Docker)
- All tests run in containers
- Real service dependencies (no mocks)
- Integration tests with containerized services

#### CI Testing (Kubernetes)
- KIND cluster for K8s integration tests
- Helm chart deployment validation
- Multi-version Kubernetes testing (v1.27.0, v1.28.0)
- Security scanning and vulnerability assessment

## CRITICAL RULE FILES

All rule files in `.claude/rules/` define mandatory behaviors and must be followed:

### Core Development Rules

- **docker-first-development.md** - Docker-first enforcement and container best practices. HIGHEST PRIORITY
- **tdd-enforcement.md** - Test-Driven Development cycle (RED-GREEN-REFACTOR). HIGHEST PRIORITY for all code changes
- **pipeline-mandatory.md** - Required pipelines for errors, features, bugs, code search, and log analysis
- **naming-conventions.md** - Naming standards, code quality requirements, and prohibited patterns
- **context-optimization.md** - Agent usage patterns for context preservation (<20% data return)
- **development-workflow.md** - Development patterns, search-before-create, and best practices
- **command-pipelines.md** - Command sequences, prerequisites, and PM system workflows

### Kubernetes & DevOps Rules

- **ci-cd-kubernetes-strategy.md** - Kubernetes CI/CD pipeline requirements
- **infrastructure-pipeline.md** - IaC deployments, container builds, and cloud operations
- **security-checklist.md** - Security requirements for containers and K8s
- **performance-guidelines.md** - Performance standards for containerized applications

### Quality Standards

**MANDATORY**: All code MUST pass formatters and linters before commit:

```bash
# In containers
docker compose exec app npm run lint
docker compose exec app black . && ruff .
```

Always run formatters and linters BEFORE marking any task as complete.

## AGENT SELECTION GUIDANCE

### Container & Kubernetes Specialists

#### kubernetes-orchestrator
- Kubernetes manifests and Helm charts
- GitOps with ArgoCD/Flux
- Service mesh and monitoring

#### docker-expert, docker-compose-expert
- Container optimization, security scanning
- Multi-container orchestration, networking
- Production deployments, development environments

#### terraform-infrastructure-expert
- Infrastructure as Code, module development
- Multi-cloud deployments, state management
- GitOps, compliance as code

### Cloud Platform Specialists

#### gcp-cloud-architect, aws-cloud-architect, azure-cloud-architect
- Cloud-native deployments
- Container registries and orchestration
- Kubernetes service integration

### CI/CD & Operations

#### github-operations-specialist
- GitHub Actions CI/CD pipelines
- Container-based workflows
- Kubernetes deployment automation

#### playwright-test-engineer, playwright-mcp-frontend-tester
- Containerized end-to-end testing
- Kubernetes-deployed application testing
- Visual regression in container environments

## TDD PIPELINE FOR CONTAINERIZED DEVELOPMENT

### Mandatory Test-Driven Development Cycle

Every implementation MUST follow:

1. **RED Phase**: Write failing test in container
   ```bash
   docker compose exec app npm test
   ```

2. **GREEN Phase**: Make test pass with minimum code

3. **REFACTOR Phase**: Improve code while tests stay green

### Kubernetes Testing Requirements

1. **Manifest Validation**: All K8s YAML must pass `kubectl apply --dry-run=client`
2. **Helm Linting**: Charts must pass `helm lint`
3. **Integration Tests**: Deploy to KIND and run smoke tests
4. **Security Scans**: Trivy scanning for vulnerabilities

## KUBERNETES DEVELOPMENT COMMANDS

### Local Development (Docker)
```bash
# Standard Docker workflow
docker compose up -d
docker compose exec app <commands>
```

### CI/CD Testing (Kubernetes)
```bash
# Manual K8s testing (if needed)
kubectl apply --dry-run=client -f k8s/
helm lint charts/myapp/
```

## GITHUB ACTIONS INTEGRATION

The following workflows are automatically triggered based on configuration:

### docker-tests.yml
- Runs when Docker files change OR docker_first_development=true
- Builds and tests containers
- Integration testing with real services

### kubernetes-tests.yml  
- Runs when kubernetes_devops_testing=true OR K8s files change
- KIND cluster integration testing
- Helm chart validation and deployment
- Security scanning and vulnerability assessment

## ERROR HANDLING PIPELINE

### Container Environment
- **Health checks** for all services
- **Graceful shutdown** handling
- **Resource limits** and monitoring

### Kubernetes Environment
- **Readiness/liveness probes** for all pods
- **Resource quotas** and limits
- **Network policies** for security
- **Monitoring and alerting** integration

## Tone and Behavior

- Criticism is welcome. Please tell me when I am wrong or mistaken
- Please tell me if there is a better approach than the one I am taking
- Please tell me if there is a relevant standard or convention that I appear to be unaware of
- Be skeptical and concise
- Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.

## ABSOLUTE RULES

### Development Rules
- NO LOCAL EXECUTION (Docker containers only)
- NO PARTIAL IMPLEMENTATION
- NO CODE DUPLICATION (always search first)
- IMPLEMENT TEST FOR EVERY FUNCTION (in containers)
- NO CHEATER TESTS (tests must be meaningful)

### Infrastructure Rules
- DOCKERFILE REQUIRED for every component
- KUBERNETES MANIFESTS required for deployment
- HELM CHARTS for complex applications
- SECURITY POLICIES enforced in K8s
- RESOURCE LIMITS defined for all containers

### CI/CD Rules
- ALL TESTS must pass in both Docker and Kubernetes environments
- SECURITY SCANS required for all container images
- INTEGRATION TESTS with real Kubernetes deployment
- AUTOMATED ROLLBACK on deployment failures

Follow all rules defined in `.claude/rules/` without exception.