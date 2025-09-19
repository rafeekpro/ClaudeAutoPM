# Docker First Development

Docker-First Development is a core philosophy in ClaudeAutoPM that ensures consistency, reproducibility, and isolation across all development environments. This approach mandates that all development activities happen inside Docker containers rather than directly on the host machine.

## Philosophy

The Docker-First approach is based on the principle: **"If it doesn't run in Docker, it doesn't run."**

### Why Docker-First?

1. **Environment Consistency**: Eliminates "works on my machine" problems
2. **Dependency Isolation**: Each project has its own dependencies
3. **Reproducible Builds**: Same environment from development to production
4. **Team Alignment**: Everyone uses identical development environments
5. **Security**: Isolated execution prevents system contamination

## Rules and Enforcement

Based on `.claude/rules/docker-first-development.md`:

### Blocked Commands

When Docker-First is enabled, these commands are **blocked** on the host:

```bash
# Package Managers - BLOCKED
npm install
pip install
gem install
composer install
cargo build

# Runtime Commands - BLOCKED
node app.js
python manage.py runserver
rails server
php artisan serve

# Database Operations - BLOCKED
mysql
psql
mongod
redis-cli
```

### Allowed Commands

These commands **must run** in containers:

```bash
# Package Managers - IN DOCKER
docker-compose run app npm install
docker-compose run python pip install
docker-compose run ruby gem install

# Runtime Commands - IN DOCKER
docker-compose up app
docker-compose run web python manage.py runserver
docker-compose exec app node server.js

# Database Operations - IN DOCKER
docker-compose exec db mysql
docker-compose run postgres psql
```

### Git Hook Enforcement

Pre-commit hooks enforce Docker-First:

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check for blocked commands in staged files
if grep -r "npm install\|pip install" --include="*.sh" .; then
  echo "❌ ERROR: Direct package installation detected!"
  echo "Use: docker-compose run app npm install"
  exit 1
fi
```

## Docker Compose Configuration

### Standard docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    volumes:
      - .:/app
      - node_modules:/app/node_modules
    environment:
      - NODE_ENV=development
    ports:
      - "3000:3000"
    command: npm run dev

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: developer
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  node_modules:
  postgres_data:
```

### Development Dockerfile

```docker
FROM node:18-alpine

WORKDIR /app

# Install development tools
RUN apk add --no-cache git bash

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application
COPY . .

# Development command
CMD ["npm", "run", "dev"]
```

## Workflow Examples

### Starting a New Project

```bash
# 1. Initialize project with Docker-First
autopm init my-project
# Choose: Docker-only or Full DevOps

# 2. All subsequent commands in Docker
docker-compose run app npm init -y
docker-compose run app npm install express
docker-compose run app npm install -D nodemon

# 3. Start development
docker-compose up
```

### Daily Development Workflow

```bash
# Morning: Start services
docker-compose up -d

# Development: Run commands in containers
docker-compose exec app npm test
docker-compose exec app npm run lint
docker-compose run app npm install new-package

# Debugging: Access container shell
docker-compose exec app sh

# Evening: Stop services
docker-compose down
```

### Database Operations

```bash
# Run migrations
docker-compose run app npm run migrate

# Access database console
docker-compose exec db psql -U developer -d myapp

# Backup database
docker-compose exec db pg_dump -U developer myapp > backup.sql

# Restore database
docker-compose exec -T db psql -U developer myapp < backup.sql
```

## Agent Integration

AI agents respect Docker-First rules:

### Code Execution

```markdown
# Agent attempts direct execution
@nodejs-backend-engineer run npm install

# Docker-First intercepts and corrects:
🐳 Docker-First Active: Redirecting to container
→ docker-compose run app npm install
```

### Test Execution

```markdown
@test-runner execute all tests

# Automatically runs in Docker:
🐳 Executing in container: app
→ docker-compose run --rm app npm test
```

## Configuration

### Enabling Docker-First

In `.claude/config.json`:

```json
{
  "features": {
    "docker_first_development": true,
    "docker_compose_required": true
  },
  "docker": {
    "compose_file": "docker-compose.yml",
    "default_service": "app",
    "auto_rebuild": true
  }
}
```

### Environment Variables

In `.claude/.env`:

```bash
# Docker Configuration
DOCKER_ENABLED=true
DOCKER_FIRST_DEVELOPMENT=true
COMPOSE_PROJECT_NAME=my-project
COMPOSE_FILE=docker-compose.yml
```

## Common Patterns

### Multi-Service Applications

```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]

  backend:
    build: ./backend
    ports: ["8000:8000"]

  worker:
    build: ./backend
    command: celery worker
```

### Development vs Production

```yaml
# docker-compose.override.yml (development)
services:
  app:
    volumes:
      - .:/app  # Hot reload
    environment:
      - DEBUG=true

# docker-compose.prod.yml (production)
services:
  app:
    environment:
      - DEBUG=false
    restart: always
```

### Language-Specific Configurations

#### Python/Django

```yaml
services:
  web:
    build: .
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - .:/code
    ports:
      - "8000:8000"
```

#### Ruby/Rails

```yaml
services:
  web:
    build: .
    command: bundle exec rails server -b 0.0.0.0
    volumes:
      - .:/app
      - bundle:/usr/local/bundle
    ports:
      - "3000:3000"
```

#### Go

```yaml
services:
  app:
    image: golang:1.21
    working_dir: /app
    volumes:
      - .:/app
      - go-modules:/go/pkg/mod
    command: go run .
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs app

# Rebuild if needed
docker-compose build --no-cache app
docker-compose up
```

### Permission Issues

```bash
# Fix ownership
docker-compose run --rm app chown -R $(id -u):$(id -g) .

# Or in Dockerfile
USER node
```

### Slow Performance (macOS/Windows)

```yaml
# Use delegated mounts
volumes:
  - .:/app:delegated

# Or use named volumes for dependencies
volumes:
  - node_modules:/app/node_modules  # Named volume
  - .:/app  # Bind mount
```

### Port Conflicts

```bash
# Check what's using the port
lsof -i :3000

# Use different ports
ports:
  - "3001:3000"  # Host:Container
```

## Best Practices

1. **One Service Per Container**: Follow single responsibility principle
2. **Use .dockerignore**: Exclude unnecessary files
3. **Layer Caching**: Order Dockerfile commands for optimal caching
4. **Named Volumes**: Use for persistent data and dependencies
5. **Health Checks**: Add health checks to services
6. **Resource Limits**: Set memory and CPU limits

### Example .dockerignore

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.vscode
.idea
coverage
.nyc_output
```

## Exceptions and Overrides

### Temporary Host Execution

For emergencies only:

```bash
# Temporarily disable Docker-First
DOCKER_FIRST_OVERRIDE=true npm install

# Or use bypass flag
autopm --no-docker npm install
```

### CI/CD Environments

GitHub Actions can run without Docker:

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci  # Direct execution in CI
      - run: npm test
```

## Migration Guide

### Converting Existing Project

1. **Add Docker Compose**:
```bash
autopm install
# Choose: Docker-only or Full DevOps
```

2. **Update Scripts**:
```json
// package.json
"scripts": {
  "dev": "docker-compose up",
  "test": "docker-compose run app npm test"
}
```

3. **Update Documentation**:
```markdown
# README.md
## Development
All development happens in Docker:
- Start: `docker-compose up`
- Install: `docker-compose run app npm install`
```

## Related Pages

- [Feature Toggles](Feature-Toggles)
- [Kubernetes Integration](Kubernetes-Integration)
- [Testing Strategies](Testing-Strategies)
- [Configuration Options](Configuration-Options)