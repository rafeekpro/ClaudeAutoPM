#!/bin/bash

# Docker Development Environment Setup Script
# Automatically creates Docker files for different project types

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to detect project type
detect_project_type() {
    if [[ -f "package.json" ]]; then
        echo "nodejs"
    elif [[ -f "requirements.txt" ]] || [[ -f "pyproject.toml" ]] || [[ -f "setup.py" ]]; then
        echo "python"
    elif [[ -f "go.mod" ]]; then
        echo "golang"
    elif [[ -f "pom.xml" ]] || [[ -f "build.gradle" ]]; then
        echo "java"
    elif [[ -f "Cargo.toml" ]]; then
        echo "rust"
    else
        echo "unknown"
    fi
}

# Function to create Node.js Docker files
create_nodejs_docker() {
    echo -e "${GREEN}Creating Node.js Docker configuration...${NC}"
    
    # Dockerfile.dev
    cat > Dockerfile.dev << 'EOF'
FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose ports (app and debug)
EXPOSE 3000 9229

# Start development server
CMD ["npm", "run", "dev"]
EOF

    # Dockerfile (production)
    cat > Dockerfile << 'EOF'
# Multi-stage build for Node.js application
FROM node:20-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy dependencies and built application
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

USER nextjs

EXPOSE 3000
CMD ["npm", "start"]
EOF

    # docker compose.yml
    cat > docker compose.yml << 'EOF'
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
EOF

    # docker compose.dev.yml
    cat > docker compose.dev.yml << 'EOF'
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules  # Preserve container's node_modules
    ports:
      - "3000:3000"
      - "9229:9229"  # Debug port
    environment:
      - NODE_ENV=development
      - DEBUG=*
    command: npm run dev
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=devdb
      - POSTGRES_USER=devuser
      - POSTGRES_PASSWORD=devpass123
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
EOF

    # docker compose.test.yml
    cat > docker compose.test.yml << 'EOF'
version: '3.9'

services:
  test:
    build:
      context: .
      dockerfile: Dockerfile.dev
    environment:
      - NODE_ENV=test
      - CI=true
    command: npm test
    depends_on:
      - test-db

  test-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=testdb
      - POSTGRES_USER=testuser
      - POSTGRES_PASSWORD=testpass123
    tmpfs:
      - /var/lib/postgresql/data  # In-memory for faster tests
EOF

    echo -e "  ✅ Created Dockerfile.dev"
    echo -e "  ✅ Created Dockerfile (production)"
    echo -e "  ✅ Created docker compose.yml"
    echo -e "  ✅ Created docker compose.dev.yml"
    echo -e "  ✅ Created docker compose.test.yml"
}

# Function to create Python Docker files
create_python_docker() {
    echo -e "${GREEN}Creating Python Docker configuration...${NC}"
    
    # Dockerfile.dev
    cat > Dockerfile.dev << 'EOF'
FROM python:3.11-slim AS development

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements*.txt ./
RUN pip install -r requirements.txt
RUN if [ -f requirements-dev.txt ]; then pip install -r requirements-dev.txt; fi

# Copy source code
COPY . .

# Expose port
EXPOSE 8000

# Start development server
CMD ["python", "-m", "flask", "run", "--host=0.0.0.0", "--port=8000", "--reload"]
EOF

    # Dockerfile (production)
    cat > Dockerfile << 'EOF'
# Multi-stage build for Python application
FROM python:3.11-slim AS dependencies
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.11-slim AS production
WORKDIR /app

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Install system dependencies
RUN apt-get update && apt-get install -y \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies and source code
COPY --from=dependencies /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=dependencies /usr/local/bin /usr/local/bin
COPY . .

# Change ownership to non-root user
RUN chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "app:app"]
EOF

    # docker compose.yml
    cat > docker compose.yml << 'EOF'
version: '3.9'

services:
  app:
    build: .
    ports:
      - "8000:8000"
    environment:
      - FLASK_ENV=production
      - DATABASE_URL=postgresql://produser:prodpass@db:5432/proddb
    depends_on:
      - db
    networks:
      - app-network

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=proddb
      - POSTGRES_USER=produser
      - POSTGRES_PASSWORD=prodpass123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - app-network

volumes:
  postgres_data:

networks:
  app-network:
    driver: bridge
EOF

    # docker compose.dev.yml
    cat > docker compose.dev.yml << 'EOF'
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/.venv  # Preserve virtual environment
    ports:
      - "8000:8000"
      - "5678:5678"  # Debug port
    environment:
      - FLASK_ENV=development
      - FLASK_DEBUG=1
      - DATABASE_URL=postgresql://devuser:devpass@db:5432/devdb
    command: python -m flask run --host=0.0.0.0 --port=8000 --reload
    depends_on:
      - db
      - redis

  db:
    environment:
      - POSTGRES_DB=devdb
      - POSTGRES_USER=devuser
      - POSTGRES_PASSWORD=devpass123

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
EOF

    # docker compose.test.yml
    cat > docker compose.test.yml << 'EOF'
version: '3.9'

services:
  test:
    build:
      context: .
      dockerfile: Dockerfile.dev
    environment:
      - FLASK_ENV=testing
      - DATABASE_URL=postgresql://testuser:testpass@test-db:5432/testdb
    command: pytest -v
    depends_on:
      - test-db

  test-db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=testdb
      - POSTGRES_USER=testuser
      - POSTGRES_PASSWORD=testpass123
    tmpfs:
      - /var/lib/postgresql/data
EOF

    echo -e "  ✅ Created Dockerfile.dev"
    echo -e "  ✅ Created Dockerfile (production)"
    echo -e "  ✅ Created docker compose.yml"
    echo -e "  ✅ Created docker compose.dev.yml"
    echo -e "  ✅ Created docker compose.test.yml"
}

# Function to create Go Docker files
create_golang_docker() {
    echo -e "${GREEN}Creating Go Docker configuration...${NC}"
    
    # Dockerfile.dev
    cat > Dockerfile.dev << 'EOF'
FROM golang:1.21-alpine AS development

WORKDIR /app

# Install air for live reloading
RUN go install github.com/cosmtrek/air@latest

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Expose port
EXPOSE 8080

# Start with live reload
CMD ["air"]
EOF

    # Create .air.toml for live reloading
    cat > .air.toml << 'EOF'
root = "."
testdata_dir = "testdata"
tmp_dir = "tmp"

[build]
  args_bin = []
  bin = "./tmp/main"
  cmd = "go build -o ./tmp/main ."
  delay = 1000
  exclude_dir = ["assets", "tmp", "vendor", "testdata"]
  exclude_file = []
  exclude_regex = ["_test.go"]
  exclude_unchanged = false
  follow_symlink = false
  full_bin = ""
  include_dir = []
  include_ext = ["go", "tpl", "tmpl", "html"]
  kill_delay = "0s"
  log = "build-errors.log"
  send_interrupt = false
  stop_on_root = false

[color]
  app = ""
  build = "yellow"
  main = "magenta"
  runner = "green"
  watcher = "cyan"

[log]
  time = false

[misc]
  clean_on_exit = false

[screen]
  clear_on_rebuild = false
EOF

    echo -e "  ✅ Created Dockerfile.dev"
    echo -e "  ✅ Created .air.toml (live reload config)"
}

# Function to create .dockerignore
create_dockerignore() {
    local project_type=$1
    
    cat > .dockerignore << 'EOF'
# Version control
.git
.gitignore
.gitattributes

# CI/CD
.github
.gitlab-ci.yml
Jenkinsfile

# Documentation
README.md
CHANGELOG.md
LICENSE
docs/

# Editor files
.vscode
.idea
*.swp
*.swo
*~

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Temporary files
tmp/
temp/
*.tmp
EOF

    case $project_type in
        "nodejs")
            cat >> .dockerignore << 'EOF'

# Node.js specific
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.npm
.yarn-integrity
.env.local
.env.*.local
dist/
build/
EOF
            ;;
        "python")
            cat >> .dockerignore << 'EOF'

# Python specific
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
env/
venv/
.venv/
pip-log.txt
pip-delete-this-directory.txt
.pytest_cache/
.coverage
htmlcov/
.mypy_cache/
.env
EOF
            ;;
        "golang")
            cat >> .dockerignore << 'EOF'

# Go specific
*.exe
*.exe~
*.dll
*.so
*.dylib
*.test
*.out
go.work
vendor/
EOF
            ;;
    esac
    
    echo -e "  ✅ Created .dockerignore"
}

# Function to create Makefile
create_makefile() {
    cat > Makefile << 'EOF'
.PHONY: dev test build clean shell logs help

# Development commands
dev: ## Start development environment
	docker compose -f docker compose.yml -f docker compose.dev.yml up

dev-build: ## Build development environment
	docker compose -f docker compose.yml -f docker compose.dev.yml build

dev-down: ## Stop development environment
	docker compose -f docker compose.yml -f docker compose.dev.yml down

# Testing commands
test: ## Run tests in container
	docker compose -f docker compose.yml -f docker compose.test.yml run --rm test

test-watch: ## Run tests in watch mode
	docker compose -f docker compose.yml -f docker compose.test.yml run --rm test npm run test:watch

# Production commands
build: ## Build production image
	docker build -t app:latest .

run: ## Run production container
	docker run -p 3000:3000 app:latest

# Utility commands
shell: ## Open shell in development container
	docker compose -f docker compose.yml -f docker compose.dev.yml exec app sh

logs: ## Follow development logs
	docker compose -f docker compose.yml -f docker compose.dev.yml logs -f

clean: ## Clean up containers and images
	docker compose down -v
	docker system prune -f

setup: ## Initial setup (build and start)
	make dev-build
	make dev

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Default target
.DEFAULT_GOAL := help
EOF
    
    echo -e "  ✅ Created Makefile with helper commands"
}

# Main setup function
main() {
    echo -e "${BLUE}Docker Development Environment Setup${NC}"
    echo "===================================="
    echo ""
    
    # Detect project type
    PROJECT_TYPE=$(detect_project_type)
    echo -e "Detected project type: ${GREEN}$PROJECT_TYPE${NC}"
    echo ""
    
    # Check if Docker files already exist
    if [[ -f "Dockerfile" ]] || [[ -f "docker compose.yml" ]]; then
        echo -e "${YELLOW}Warning: Docker files already exist!${NC}"
        read -p "Do you want to overwrite them? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Aborted."
            exit 0
        fi
        echo ""
    fi
    
    # Create Docker files based on project type
    case $PROJECT_TYPE in
        "nodejs")
            create_nodejs_docker
            ;;
        "python")
            create_python_docker
            ;;
        "golang")
            create_golang_docker
            ;;
        *)
            echo -e "${YELLOW}Unknown project type. Creating generic Docker setup...${NC}"
            echo "You'll need to customize the Dockerfile manually."
            ;;
    esac
    
    # Create common files
    create_dockerignore $PROJECT_TYPE
    create_makefile
    
    echo ""
    echo -e "${GREEN}Docker development environment created! 🐳${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review and customize the Docker files"
    echo "  2. Run: make setup (builds and starts development environment)"
    echo "  3. Access your application at http://localhost:3000 (or 8000 for Python)"
    echo ""
    echo "Available commands:"
    echo "  make dev     - Start development with hot reload"
    echo "  make test    - Run tests in container"
    echo "  make shell   - Open shell in container"
    echo "  make clean   - Clean up containers"
    echo "  make help    - Show all available commands"
}

# Run main function
main "$@"