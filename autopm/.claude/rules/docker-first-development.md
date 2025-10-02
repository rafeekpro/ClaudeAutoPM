# Docker-First Development Rule

> **STATUS**: Can be enabled/disabled via `.claude/config.json` → `features.docker_first_development`

## WHEN ENABLED

### 1. MANDATORY DOCKER USAGE

**ALL development MUST happen inside Docker containers:**

```bash
# ❌ FORBIDDEN - Local execution
npm install
npm test
python app.py
pytest

# ✅ REQUIRED - Docker execution
docker compose run app npm install
docker compose run app npm test
docker compose run app python app.py
docker compose run test pytest
```

### 2. PROJECT STRUCTURE REQUIREMENTS

Every project MUST have:

```
project/
├── Dockerfile                 # Production image
├── Dockerfile.dev            # Development image with dev tools
├── docker compose.yml        # Production-like setup
├── docker compose.dev.yml    # Development overrides
├── docker compose.test.yml   # Test environment
└── .dockerignore            # Exclude unnecessary files
```

### 3. DEVELOPMENT WORKFLOW

#### Initial Setup

```bash
# 1. Check if Docker files exist
if [ ! -f "Dockerfile" ]; then
  Use docker-containerization-expert agent to create Dockerfile
fi

# 2. Build development image
docker compose -f docker compose.yml -f docker compose.dev.yml build

# 3. Start development environment
docker compose -f docker compose.yml -f docker compose.dev.yml up
```

#### Code Changes

```yaml
# docker compose.dev.yml
services:
  app:
    volumes:
      - .:/app                    # Mount source code
      - /app/node_modules         # Preserve container node_modules
      - /app/.venv               # Preserve Python venv
    command: npm run dev          # Hot reload
```

#### Running Tests

```bash
# Always in container
docker compose run --rm test pytest
docker compose run --rm test npm test

# CI/CD uses same image
docker build -t app:test .
docker run app:test pytest
```

### 4. ENFORCEMENT PIPELINE

When docker_first_development is **enabled**:

```
1. Hook intercepts local commands (npm, pip, python, etc.)
2. Checks if Docker alternative exists
3. Blocks execution with Docker alternative suggestion
4. Auto-creates Docker files if missing
```

### 5. DOCKERFILE STANDARDS

#### Python Projects

```dockerfile
# Dockerfile.dev
FROM python:3.11-slim AS development
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--reload"]

# Dockerfile (production)
FROM python:3.11-slim AS production
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "app:app"]
```

#### Node.js Projects

```dockerfile
# Dockerfile.dev
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["npm", "run", "dev"]

# Dockerfile (production)
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "server.js"]
```

### 6. docker compose TEMPLATES

#### Base docker compose.yml

```yaml
version: '3.9'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
```

#### Development Override (docker compose.dev.yml)

```yaml
version: '3.9'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules  # Preserve dependencies
    environment:
      - NODE_ENV=development
      - DEBUG=true
    ports:
      - "3000:3000"
      - "9229:9229"  # Debug port
```

#### Test Override (docker compose.test.yml)

```yaml
version: '3.9'
services:
  test:
    build:
      context: .
      dockerfile: Dockerfile.dev
    command: npm test
    environment:
      - NODE_ENV=test
      - CI=true
```

### 7. GITHUB ACTIONS INTEGRATION

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Test Image
        run: docker build -f Dockerfile.dev -t app:test .
      
      - name: Run Tests in Container
        run: docker run --rm app:test npm test
      
      - name: Run Linting in Container
        run: docker run --rm app:test npm run lint
```

### 8. VOLUME MOUNTING STRATEGY

```yaml
# Development volumes for hot reload
volumes:
  # Source code - always mounted
  - ./src:/app/src
  - ./tests:/app/tests
  
  # Config files - mounted read-only
  - ./package.json:/app/package.json:ro
  - ./tsconfig.json:/app/tsconfig.json:ro
  
  # Dependencies - NOT mounted (use container's)
  # - ./node_modules:/app/node_modules  ❌
  # - ./.venv:/app/.venv                ❌
```

### 9. DATABASE IN DOCKER

```yaml
# docker compose.dev.yml
services:
  app:
    depends_on:
      - db
      - redis
  
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: devpassword
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

### 10. HELPER COMMANDS

Create a Makefile for common operations:

```makefile
# Makefile
.PHONY: dev test build clean

# Development
dev:
 docker compose -f docker compose.yml -f docker compose.dev.yml up

dev-build:
 docker compose -f docker compose.yml -f docker compose.dev.yml build

# Testing
test:
 docker compose -f docker compose.yml -f docker compose.test.yml run --rm test

test-watch:
 docker compose -f docker compose.yml -f docker compose.test.yml run --rm test npm run test:watch

# Production
build:
 docker build -t app:latest .

run:
 docker run -p 3000:3000 app:latest

# Utilities
shell:
 docker compose -f docker compose.yml -f docker compose.dev.yml exec app sh

logs:
 docker compose logs -f app

clean:
 docker compose down -v
 docker system prune -f
```

## WHEN DISABLED

When `docker_first_development: false` in config:

- Local development is allowed
- Docker files are optional
- No enforcement of container usage
- Traditional development workflow permitted

## PR VALIDATION REQUIREMENTS

When `docker_first_development` is enabled, ALL PRs MUST:

### 1. PASS DOCKER TESTS BEFORE PUSH

```bash
# Manual validation before creating PR
./.claude/scripts/pr-validation.sh

# Install Git hooks for automatic validation
./.claude/scripts/install-hooks.sh
```

### 2. GITHUB ACTIONS VALIDATION

PR will automatically run:

- Multi-platform Docker builds (linux/amd64, linux/arm64)  
- Tests in Docker containers using same images as local dev
- Security scanning with Trivy
- Docker-first compliance validation
- Startup testing

### 3. REQUIRED FILES FOR PR

- `Dockerfile` - Production image
- `Dockerfile.dev` - Development image  
- `docker compose.yml` - Base configuration
- `docker compose.test.yml` - Test configuration
- `.dockerignore` - Build optimization

### 4. AUTOMATED BLOCKING

**Pre-push hook blocks push if:**

- Docker tests fail
- Docker images don't build
- Required Docker files missing
- Docker daemon not running

**GitHub Actions blocks PR if:**

- Any Docker tests fail
- Security vulnerabilities found (HIGH/CRITICAL)
- Multi-platform builds fail
- Container startup fails

### 5. PR VALIDATION WORKFLOW

```bash
# Full validation (recommended)
./.claude/scripts/pr-validation.sh

# Quick validation (skip some tests)
./.claude/scripts/pr-validation.sh --force

# Skip tests entirely (not recommended)  
./.claude/scripts/pr-validation.sh --skip-tests
```

### 6. CI/CD REQUIREMENTS

GitHub Actions workflow (`.github/workflows/docker-tests.yml`) runs:

1. **Change Detection** - Only runs Docker tests when needed
2. **Multi-Environment Testing** - Tests dev and production configs
3. **Security Scanning** - Trivy vulnerability scan
4. **Multi-Platform Builds** - AMD64 and ARM64 architectures
5. **Compliance Validation** - Checks Docker-first requirements

## BYPASS PROCEDURES (EMERGENCY ONLY)

```bash
# Bypass git hooks temporarily
git push --no-verify

# Disable Docker-first for urgent fixes
./.claude/scripts/docker-toggle.sh disable
# Don't forget to re-enable after fix!
```

## CHECKING STATUS

```bash
# Check Docker-first status with detailed info
./.claude/scripts/docker-toggle.sh status

# Quick check
cat .claude/config.json | jq '.features.docker_first_development'

# Manual toggle
./.claude/scripts/docker-toggle.sh enable   # or disable
```
