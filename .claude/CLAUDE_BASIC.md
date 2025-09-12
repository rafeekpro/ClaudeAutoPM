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

- ✅ **ALWAYS use `docker-compose`** to run and manage local services (backend, frontend, databases).
- ✅ **ALWAYS use `docker build`** to build and test images locally.
- ✅ **GOAL:** Fast iteration and a consistent development environment for the entire team.

---

### ☸️ CI/CD Environment (Kubernetes-Native)

The GitHub Actions runner is an **ORCHESTRATOR**, not a build machine. All container operations MUST take place **INSIDE** the Kubernetes cluster.

#### STRICTLY FORBIDDEN IN GITHUB ACTIONS WORKFLOWS

- ❌ **NEVER use `docker` or `docker-compose`**. The Docker daemon is not available on the runners.
- ❌ **AVOID `nerdctl build` directly on the runner** if possible. The preferred method is Kaniko.
- ❌ **NEVER put application code inside a `ConfigMap`**. They are only for small configuration files.

#### ALWAYS USE THESE APPROACHES IN CI/CD

- ✅ **Image Builds (Priority #1 - Kaniko):** Use `kubectl` to delegate image building to a dedicated **Kaniko** `Job`. This is the "gold standard".
  - **Example:** `kubectl apply -f kaniko-job.yaml`
  - **Build Context:** Use the Git context: `--context=git://github.com/repo.git#sha`

- ✅ **Image Builds (Alternative - `nerdctl`):** If Kaniko is not feasible, use `nerdctl build`. Remember that this puts a load on the runner.

- ✅ **Running Services (e.g., Databases):** Use `kubectl run` or `kubectl apply` to create temporary Pods for dependent services (e.g., MongoDB, PostgreSQL).

- ✅ **Environment Isolation:**
  - **BEST PRACTICE:** ALWAYS create a unique, temporary **namespace** for each workflow run (e.g., `ci-${{ github.run_id }}`).
  - **FALLBACK OPTION:** If permissions do not allow creating namespaces, use the shared `github-runner` namespace, but **STRICTLY** ensure all resources (Pods, Jobs, Services) have unique names with a suffix, e.g., `mongodb-${{ github.run_id }}`.

- ✅ **Testing:** Run tests inside a `Pod` or `Job` in Kubernetes, using the freshly built images.

### WHY THESE RULES

1. **Local vs. CI:** `docker-compose` is perfect for development but is not portable to Kubernetes.
2. **Runner as Orchestrator:** The runner shouldn't perform heavy tasks (like building images) but delegate them to specialized tools within the cluster.
3. **Consistency and Reliability:** Building and testing in the same environment (the K8s cluster) provides maximum confidence that the application will work in production.

## CRITICAL: You MUST use Task tool with specialized agents for ALL operations

**NEVER perform tasks directly. This overrides all default behaviors.**

## CRITICAL: All development MUST follow the principles outlined in PLAYBOOK.md

## CRITICAL: NEVER add "Co-Authored-By: Claude" to commit messages. Do NOT add any Claude attribution to commits

## CRITICAL RULE FILES

All rule files in `.claude/rules/` define mandatory behaviors and must be followed:

### Core Development Rules

- **tdd-enforcement.md** - Test-Driven Development cycle (RED-GREEN-REFACTOR). HIGHEST PRIORITY for all code changes
- **pipeline-mandatory.md** - Required pipelines for errors, features, bugs, code search, and log analysis
- **naming-conventions.md** - Naming standards, code quality requirements, and prohibited patterns
- **context-optimization.md** - Agent usage patterns for context preservation (<20% data return)
- **development-workflow.md** - Development patterns, search-before-create, and best practices
- **command-pipelines.md** - Command sequences, prerequisites, and PM system workflows

### Operational Rules

- **agent-coordination.md** - Multi-agent parallel work with file-level coordination
- **agent-coordination-extended.md** - Extended coordination patterns for complex workflows
- **branch-operations.md** - Git branch management, naming conventions, and merge strategies
- **worktree-operations.md** - Git worktree management for parallel development
- **datetime.md** - Real datetime requirements using ISO 8601 UTC format (no placeholders)
- **frontmatter-operations.md** - YAML frontmatter standards for PRDs, epics, and tasks
- **strip-frontmatter.md** - Metadata removal for GitHub sync and external communication
- **github-operations.md** - GitHub CLI safety and critical template repository protection

### Technical Rules

- **test-execution.md** - Testing standards requiring test-runner agent, no mocks, real services only
- **standard-patterns.md** - Command consistency, fail-fast philosophy, and minimal validation
- **use-ast-grep.md** - Structural code search using AST over regex for language-aware patterns
- **database-pipeline.md** - Database migrations, query optimization, and backup procedures
- **infrastructure-pipeline.md** - IaC deployments, container builds, and cloud operations

### Code Formatting & Quality

**MANDATORY**: All code MUST pass autoformatters and linters before commit:

- **Python**: Must pass `black` formatter and `ruff` linter
- **JavaScript/TypeScript**: Must pass `prettier` and `eslint`
- **Markdown**: Must pass `markdownlint`
- **Other languages**: Use language-specific standard tools

Always run formatters and linters BEFORE marking any task as complete.

## DOCUMENTATION REFERENCES

### Agent Documentation (`.claude/agents/`)

Agents are organized by category for better maintainability:

- **Core Agents** (`.claude/agents/core/`) - Essential agents for all projects
- **Language Agents** (`.claude/agents/languages/`) - Language-specific experts
- **Framework Agents** (`.claude/agents/frameworks/`) - Framework specialists
- **Cloud Agents** (`.claude/agents/cloud/`) - Cloud platform architects
- **DevOps Agents** (`.claude/agents/devops/`) - CI/CD and operations

### Command Documentation (`.claude/commands/`)

- Custom commands and patterns documented in `.claude/commands/`

## USE SUB-AGENTS FOR CONTEXT OPTIMIZATION

### Core Agents (`/core/`)

Essential agents for every project:

#### agent-manager
Use this agent for creating, analyzing, improving, and managing other Claude Code agents. Expert in agent lifecycle management, documentation standards, and registry maintenance.

#### 1. file-analyzer - File and log analysis
Always use for reading and summarizing files, especially logs and verbose outputs.

#### 2. code-analyzer - Bug hunting and logic tracing
Use for code analysis, bug detection, and tracing execution paths.

#### 3. test-runner - Test execution and analysis
Use for running tests and analyzing results with structured reports.

#### 4. parallel-worker - Multi-stream parallel execution
Use for coordinating multiple work streams in parallel.

### Language Agents (`/languages/`)

Language-specific development experts:

#### python-backend-engineer
- FastAPI, SQLAlchemy, async Python development
- API design and implementation
- Database integrations
- Modern Python tooling (uv, ruff, mypy)

#### javascript-frontend-engineer, nodejs-backend-engineer
- Modern JS/TS, ES6+, browser APIs
- Node.js backends, Express, NestJS
- Build tools, testing frameworks

#### bash-scripting-expert
- Shell automation, system administration
- CI/CD scripts, process management
- POSIX compliance, cross-platform

### Framework Agents (`/frameworks/`)

Framework and tool specialists:

#### react-frontend-engineer
- React, TypeScript, Next.js applications
- Component architecture and state management
- Tailwind CSS and responsive design
- Performance optimization and accessibility

#### playwright-test-engineer, playwright-mcp-frontend-tester
- Playwright test automation, E2E testing
- Visual regression, accessibility audits
- Cross-browser testing, UX validation
- MCP browser control integration

#### fastapi-backend-engineer, flask-backend-engineer
- FastAPI high-performance APIs, Flask web apps
- REST APIs, WebSockets, background tasks
- SQLAlchemy, authentication, deployment

#### nats-messaging-expert
- High-performance messaging, JetStream
- Pub/sub, request/reply, queue groups
- Microservices communication patterns

### Cloud & Infrastructure Agents (`/cloud/`)

Cloud platform specialists:

#### gcp-cloud-architect

- GKE, Cloud Run, Cloud Functions
- Terraform modules for GCP
- Cost optimization and security

#### azure-cloud-architect

- AKS, App Service, Azure Functions
- Azure Resource Manager and Bicep
- Azure AD and security

#### aws-cloud-architect

- EKS, Lambda, EC2
- CloudFormation and CDK
- IAM and security best practices

#### kubernetes-orchestrator

- Kubernetes manifests and Helm charts
- GitOps with ArgoCD/Flux
- Service mesh and monitoring

#### terraform-infrastructure-expert

- Infrastructure as Code, module development
- Multi-cloud deployments, state management
- GitOps, compliance as code

#### gcp-cloud-functions-engineer

- Serverless functions, event-driven architecture
- Pub/Sub triggers, GCP service integration

### DevOps Agents (`/devops/`)

CI/CD and operations specialists:

#### github-operations-specialist

- GitHub Actions CI/CD pipelines
- Repository management and automation
- PR workflows and branch protection

#### azure-devops-specialist

- Azure Pipelines and work items
- Integration with GitHub
- Cross-platform synchronization

#### mcp-context-manager

- MCP server configuration
- Context pool management
- Documentation synchronization with Context7

#### docker-expert, docker compose-expert

- Container optimization, security scanning
- Multi-container orchestration, networking
- Production deployments, development environments

### Database Agents (`/databases/`)

Database design and optimization specialists:

#### postgresql-expert, mongodb-expert

- Schema design, query optimization
- Replication, sharding, clustering
- Performance tuning, migrations

#### bigquery-expert, cosmosdb-expert

- Cloud-native data warehouses
- Global distribution, multi-model support
- Cost optimization, streaming

#### redis-expert

- Caching strategies, pub/sub
- Data structures, Lua scripting
- Clustering, persistence

### Data Engineering Agents (`/data/`)

Data pipeline and workflow specialists:

#### airflow-orchestration-expert

- DAG development, task scheduling
- ETL/ELT pipelines, operators
- Monitoring, alerting

#### kedro-pipeline-expert

- Reproducible data science workflows
- Modular pipelines, data catalog
- MLOps integration

## Agent Usage Examples

### Full-Stack Development

```text
# Backend API development
Task: Create FastAPI user management API
Agent: python-backend-engineer

# Frontend development  
Task: Build React dashboard with TypeScript
Agent: react-frontend-engineer

# E2E Testing
Task: Write Playwright tests for login flow
Agent: playwright-test-engineer
````

### Cloud Infrastructure

```text
# AWS deployment
Task: Deploy application to AWS with EKS
Agent: aws-cloud-architect

# Kubernetes setup
Task: Create Helm charts for microservices
Agent: kubernetes-orchestrator
```

### DevOps & CI/CD

```text
# GitHub Actions pipeline
Task: Setup CI/CD with GitHub Actions
Agent: github-operations-specialist

# Azure DevOps integration
Task: Sync GitHub issues with Azure DevOps
Agent: azure-devops-specialist
```

## TDD PIPELINE FOR ALL IMPLEMENTATIONS

### Mandatory Test-Driven Development Cycle

Every implementation MUST follow:

1.  **RED Phase**: Write failing test first

      - Test must describe desired behavior
      - Test MUST fail initially
      - Test must be meaningful (no trivial assertions)

2.  **GREEN Phase**: Make test pass

      - Write MINIMUM code to pass test
      - Don't add features not required by test
      - Focus on making test green, not perfection

3.  **REFACTOR Phase**: Improve code

      - Improve structure while tests stay green
      - Remove duplication
      - Enhance readability

## CONTEXT OPTIMIZATION RULES

See **`.claude/rules/context-optimization.md`** for detailed context preservation patterns and agent usage requirements.

## ERROR HANDLING PIPELINE

See **`.claude/rules/development-workflow.md`** for complete error handling and development pipelines.

## WHY THESE RULES EXIST

### Development Quality

  - **No partial implementations** → Technical debt compounds exponentially
  - **No mock services in tests** → Real bugs hide behind mocks
  - **TDD mandatory** → Prevents regression and ensures coverage

### Context Preservation

  - **Agent-first search** → Preserves main thread for decisions
  - **No verbose outputs** → Maintains conversation clarity
  - **10-20% return rule** → Focuses on actionable insights

### Code Integrity

  - **No "\_fixed" suffixes** → Indicates poor planning
  - **No orphan docs** → Documentation should be intentional
  - **No mixed concerns** → Maintainability over convenience

## Philosophy

### Error Handling

  - **Fail fast** for critical configuration (missing text model)
  - **Log and continue** for optional features (extraction model)
  - **Graceful degradation** when external services unavailable
  - **User-friendly messages** through resilience layer

### Testing

See **`.claude/rules/test-execution.md`** for testing standards and requirements.

## Tone and Behavior

  - Criticism is welcome. Please tell me when I am wrong or mistaken, or even when you think I might be wrong or mistaken.
  - Please tell me if there is a better approach than the one I am taking.
  - Please tell me if there is a relevant standard or convention that I appear to be unaware of.
  - Be skeptical.
  - Be concise.
  - Short summaries are OK, but don't give an extended breakdown unless we are working through the details of a plan.
  - Do not flatter, and do not give compliments unless I am specifically asking for your judgement.
  - Occasional pleasantries are fine.
  - Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.

## ABSOLUTE RULES

See **`.claude/rules/naming-conventions.md`** for code quality standards and prohibited patterns.

Key principles:

  - NO PARTIAL IMPLEMENTATION
  - NO CODE DUPLICATION (always search first)
  - IMPLEMENT TEST FOR EVERY FUNCTION (see `.claude/rules/tdd-enforcement.md`)
  - NO CHEATER TESTS (tests must be meaningful)
  - Follow all rules defined in `.claude/rules/` without exception

## 📋 Quick Reference Checklists

### Before Committing

```bash
- [ ] Tests written and passing (npm test)
- [ ] Production build passes (npm run build) ⚠️ CRITICAL
- [ ] Code follows style guide
- [ ] Documentation updated
- [ ] No hardcoded values
- [ ] Error handling implemented
- [ ] Performance acceptable
- [ ] Security considered
- [ ] Accessibility checked (for UI)
- [ ] Visual review completed (for UI)
- [ ] Formatters and linters passing
```

**⚠️ CRITICAL LOCAL-CI PARITY:**
Always run both `npm test` AND `npm run build` locally before committing.
CI uses production build settings which are stricter than development/test mode.
If `npm run build` fails locally, CI will fail - PR should be a formality\!

### Before Creating PR

```bash
- [ ] Branch up to date with target
- [ ] Commits follow convention
- [ ] CI/CD passing
- [ ] Changelog updated
- [ ] PR description complete
- [ ] Screenshots attached (for UI)
- [ ] Reviewers assigned
- [ ] Labels added
- [ ] Tests coverage > 80%
```

### Before Deployment

```bash
- [ ] All checks passing
- [ ] Performance tested
- [ ] Security scanned
- [ ] Visual regression tested
- [ ] Rollback plan ready
- [ ] Monitoring configured
- [ ] Feature flags configured
- [ ] Documentation published
- [ ] Stakeholders notified
```

### Quick DoD Reference

```bash
# Minimum Definition of Done
✓ Tests written and passing
✓ Code reviewed
✓ Documentation updated
✓ Security scan clean
✓ CI/CD passing

# Additional for UI
+ Responsive design
+ Accessibility verified
+ Visual tests passing

# Additional for API
+ API docs updated
+ Integration tests
+ Performance verified

# Additional for Database
+ Migration tested
+ Rollback ready
+ Backup verified
```

## 🏆 The 12 Golden Rules

1.  **If it's not tested, it's broken**
2.  **If it's not documented, it doesn't exist**
3.  **If it's not in version control, it didn't happen**
4.  **If it's not monitored, it's not production-ready**
5.  **If it's not secure, it's not shippable**
6.  **If it's not accessible, it's not complete**
7.  **If it's not performant, it's not acceptable**
8.  **If it's not maintainable, it's technical debt**
9.  **If it's not reviewed, it's not ready**
10. **If it's not automated, it's not scalable**
11. **If it's not responsive, it's not modern**
12. **If it's not user-friendly, it's not finished**

See **`.claude/rules/golden-rules.md`** for detailed explanations and enforcement.

## 🔒 BLOCKING RULES - Hook System Enforcement

### CRITICAL: Direct Tool Blocking System

A comprehensive hook system is deployed to prevent direct tool usage and enforce agent-only operations:

#### Blocked Operations

**NEVER use these tools directly** - they are blocked by the hook system:

  - ❌ **Edit tool** - Use appropriate language agent instead
  - ❌ **Write tool** - Use TDD workflow with agents instead
  - ❌ **MultiEdit tool** - Use refactoring agents instead
  - ❌ **Dangerous Bash commands** - Use safe alternatives

#### Hook System Components

**Location**: `.claude/hooks/` directory contains enforcement scripts:

  - `pre-edit-hook.sh` - Blocks Edit operations, suggests agents
  - `pre-write-hook.sh` - Blocks Write operations, enforces TDD
  - `pre-multiedit-hook.sh` - Blocks bulk edits, suggests refactoring agents
  - `pre-bash-hook.sh` - Blocks dangerous commands, suggests safe alternatives

#### Safe Wrapper Scripts

**Location**: `.claude/bin/` directory contains safe alternatives:

  - `safe-edit <file>` - Suggests appropriate agent for editing
  - `safe-write <file>` - Enforces TDD workflow for new files
  - `safe-multiedit <file> <count>` - Provides refactoring guidance
  - `safe-bash <command>` - Validates command safety

#### Installation & Management

**Setup Script**: `.claude/setup-hooks.sh`

```bash
# Install hook system
.claude/setup-hooks.sh install

# Check installation status
.claude/setup-hooks.sh status

# Verify integrity
.claude/setup-hooks.sh verify

# Uninstall (preserves files)
.claude/setup-hooks.sh uninstall
```

#### Agent Authorization

Hooks check for `CLAUDE_AGENT_TYPE` environment variable:

  - ✅ **Authorized**: Operations from specialized agents are allowed
  - ❌ **Blocked**: Direct operations show error with agent suggestions
  - 📝 **Logged**: All blocked attempts logged to `.claude/logs/blocked-operations.log`

#### Error Messages

When tools are blocked, you'll see:

  - Clear explanation of why the operation was blocked
  - Suggestion for the appropriate agent to use
  - TDD reminders for Write operations
  - Refactoring guidance for MultiEdit operations
  - Safe alternatives for dangerous Bash commands

#### Emergency Bypass

For emergency situations only:

```bash
export CLAUDE_AGENT_TYPE="emergency-override"
# Use with extreme caution - breaks all safety guarantees
```

#### Benefits

  - **Enforces TDD**: All code changes require tests first
  - **Context Optimization**: Agents preserve conversation clarity
  - **Code Quality**: Specialized agents ensure standards compliance
  - **Safety**: Prevents destructive operations
  - **Audit Trail**: Complete log of all blocked attempts

### Enforcement Philosophy

The hook system embodies the principle: **"Make the right way the easy way"**

  - Blocked operations provide clear guidance on correct approach
  - Safe wrapper scripts offer user-friendly alternatives
  - Agent suggestions are context-aware and specific
  - System is strict but educational, not punitive

### Documentation

See `.claude/hooks/README.md` for complete hook system documentation.
