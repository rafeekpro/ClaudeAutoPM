# CLAUDE.md

> Think carefully and implement the most concise solution that changes as little code as possible.

## 🐳 DOCKER-FIRST DEVELOPMENT WORKFLOW

This project enforces Docker-first development to ensure consistency and reproducibility across all environments.

### 🚨 CRITICAL RULE: NO LOCAL EXECUTION

**All code must run inside Docker containers.** Local execution outside containers is blocked.

### 🔧 Docker Development Environment

#### Required Commands
- All development happens in Docker containers
- Use `docker compose` for orchestration
- Hot reload enabled for rapid development

#### Getting Started

1. **Start development environment**
   ```bash
   docker compose up -d
   ```

2. **Run commands in containers**
   ```bash
   # Install dependencies
   docker compose exec app npm install
   
   # Run development server  
   docker compose exec app npm run dev
   
   # Run tests
   docker compose exec app npm test
   ```

3. **Access services**
   - Application: http://localhost:3000
   - Database: localhost:5432 (if applicable)
   - Debug ports exposed as configured

### 📋 Docker Development Rules

- **NEVER** run code outside containers locally
- **ALWAYS** use `docker compose` for development
- **REQUIRED** Dockerfile for every service/component
- **ENFORCED** Container-to-container communication
- **MANDATORY** Volume mounts for source code (hot reload)

### 🛠️ Container Architecture

#### Application Container
- Source code mounted as volume
- Hot reload enabled for development
- Debug ports exposed (9229 for Node.js, 5678 for Python)
- Development dependencies included

#### Database Container
- Data persisted via named volumes
- Development credentials (secure in production)
- Initialization scripts supported

#### Networking
- All services communicate via Docker networks
- Exposed ports only for development access
- Service discovery via container names

### 🧪 Testing in Containers

#### Test Execution
- All tests run inside containers
- Test databases use Docker services
- Integration tests with real services (no mocks)
- Parallel test execution supported

#### CI/CD Integration
- Same Docker images in development and CI
- GitHub Actions runs Docker-based tests
- Build validation in containerized environment

## CRITICAL RULE FILES

All rule files in `.claude/rules/` define mandatory behaviors and must be followed:

### Core Development Rules

- **docker-first-development.md** - Docker-first enforcement and container best practices. HIGHEST PRIORITY
- **tdd-enforcement.md** - Test-Driven Development cycle (RED-GREEN-REFACTOR) in containers
- **naming-conventions.md** - Naming standards, code quality requirements, and prohibited patterns
- **development-workflow.md** - Development patterns, search-before-create, and best practices

### Docker-Specific Rules

- **All development in containers** - No exceptions for local execution
- **Volume mounts** for source code hot reload
- **Container networking** for service communication
- **Dockerfile best practices** - Multi-stage builds, security, optimization

### Quality Standards

**MANDATORY**: All code MUST pass formatters and linters in containers:

```bash
# Run linting in containers
docker compose exec app npm run lint
docker compose exec app black . && ruff .
```

## AGENT SELECTION GUIDANCE

Use Docker-aware agents for container-first development:

#### docker-expert, docker-compose-expert
- Container optimization, multi-stage builds
- Compose orchestration, networking, volumes
- Production deployment strategies

#### python-backend-engineer, nodejs-backend-engineer
- Containerized development workflows
- Docker integration with modern frameworks
- Performance optimization in containers

#### react-frontend-engineer
- Container-based frontend development
- Hot reload in Docker environments
- Build optimization for containers

### Database Agents

#### postgresql-expert, mongodb-expert, redis-expert
- Containerized database configuration
- Docker networking and persistence
- Development vs production container setups

## TDD PIPELINE FOR CONTAINERIZED DEVELOPMENT

### Mandatory Test-Driven Development Cycle

Every implementation MUST follow (in containers):

1. **RED Phase**: Write failing test in container
   ```bash
   docker compose exec app npm test
   ```

2. **GREEN Phase**: Make test pass with minimum code

3. **REFACTOR Phase**: Improve code while tests stay green

## DOCKER DEVELOPMENT COMMANDS

### Daily Workflow
```bash
# Start development environment
docker compose up -d

# View logs
docker compose logs -f app

# Execute commands
docker compose exec app <command>

# Stop environment
docker compose down
```

### Troubleshooting
```bash
# Rebuild containers
docker compose build

# Reset environment
docker compose down -v && docker compose up -d

# Access container shell
docker compose exec app bash
```

## ERROR HANDLING

- **Container health checks** for service monitoring
- **Graceful shutdown** handling in containers
- **Volume persistence** for data integrity
- **Resource limits** to prevent system overload

## Tone and Behavior

- Criticism is welcome. Please tell me when I am wrong or mistaken
- Please tell me if there is a better approach than the one I am taking
- Please tell me if there is a relevant standard or convention that I appear to be unaware of
- Be skeptical and concise
- Feel free to ask many questions. If you are in doubt of my intent, don't guess. Ask.

## ABSOLUTE RULES

- NO LOCAL EXECUTION (Docker containers only)
- NO CODE DUPLICATION (always search first)
- IMPLEMENT TEST FOR EVERY FUNCTION (in containers)
- NO CHEATER TESTS (tests must be meaningful)
- Follow all rules defined in `.claude/rules/` without exception
- DOCKERFILE REQUIRED for every component