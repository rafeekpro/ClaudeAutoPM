#!/usr/bin/env node

/**
 * Node.js implementation of docker-dev-setup.sh
 * Docker Development Environment Setup Script
 * Automatically creates Docker files for different project types
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DockerDevSetup {
  constructor() {
    this.projectRoot = process.cwd();

    // ANSI color codes
    this.colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      reset: '\x1b[0m'
    };

    // Docker templates for different project types
    this.templates = {
      nodejs: {
        dockerfile: this.getNodejsDockerfile(),
        dockerfileDev: this.getNodejsDockerfileDev(),
        dockerCompose: this.getNodejsDockerCompose(),
        dockerIgnore: this.getNodejsDockerIgnore()
      },
      python: {
        dockerfile: this.getPythonDockerfile(),
        dockerfileDev: this.getPythonDockerfileDev(),
        dockerCompose: this.getPythonDockerCompose(),
        dockerIgnore: this.getPythonDockerIgnore()
      },
      golang: {
        dockerfile: this.getGolangDockerfile(),
        dockerfileDev: this.getGolangDockerfileDev(),
        dockerCompose: this.getGolangDockerCompose(),
        dockerIgnore: this.getGolangDockerIgnore()
      },
      java: {
        dockerfile: this.getJavaDockerfile(),
        dockerfileDev: this.getJavaDockerfileDev(),
        dockerCompose: this.getJavaDockerCompose(),
        dockerIgnore: this.getJavaDockerIgnore()
      },
      rust: {
        dockerfile: this.getRustDockerfile(),
        dockerfileDev: this.getRustDockerfileDev(),
        dockerCompose: this.getRustDockerCompose(),
        dockerIgnore: this.getRustDockerIgnore()
      }
    };
  }

  // Helper to print colored messages
  print(message, color = null) {
    if (color && this.colors[color]) {
      console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    } else {
      console.log(message);
    }
  }

  // Detect project type based on files in directory
  detectProjectType() {
    if (fs.existsSync('package.json')) {
      return 'nodejs';
    } else if (fs.existsSync('requirements.txt') || fs.existsSync('pyproject.toml') || fs.existsSync('setup.py')) {
      return 'python';
    } else if (fs.existsSync('go.mod')) {
      return 'golang';
    } else if (fs.existsSync('pom.xml') || fs.existsSync('build.gradle')) {
      return 'java';
    } else if (fs.existsSync('Cargo.toml')) {
      return 'rust';
    } else {
      return 'unknown';
    }
  }

  // Get Node.js Dockerfile template
  getNodejsDockerfile() {
    return `# Multi-stage build for Node.js application
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

CMD ["node", "dist/index.js"]`;
  }

  getNodejsDockerfileDev() {
    return `FROM node:20-alpine AS development

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose ports (app and debug)
EXPOSE 3000 9229

# Start development server
CMD ["npm", "run", "dev"]`;
  }

  getNodejsDockerCompose() {
    return `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "3000:3000"
      - "9229:9229"
    environment:
      - NODE_ENV=development
      - DEBUG=*
    command: npm run dev`;
  }

  getNodejsDockerIgnore() {
    return `node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.vscode
.idea
dist
build
.dockerignore
Dockerfile
Dockerfile.dev`;
  }

  // Python templates
  getPythonDockerfile() {
    return `FROM python:3.11-slim AS production

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1001 python && chown -R python:python /app
USER python

EXPOSE 8000

CMD ["python", "main.py"]`;
  }

  getPythonDockerfileDev() {
    return `FROM python:3.11-slim AS development

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    gcc \\
    git \\
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt requirements-dev.txt* ./
RUN pip install --no-cache-dir -r requirements.txt
RUN if [ -f requirements-dev.txt ]; then pip install --no-cache-dir -r requirements-dev.txt; fi

# Copy application code
COPY . .

EXPOSE 8000 5678

CMD ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", "--wait-for-client", "main.py"]`;
  }

  getPythonDockerCompose() {
    return `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
    ports:
      - "8000:8000"
      - "5678:5678"
    environment:
      - PYTHONUNBUFFERED=1
      - DEBUG=True
    command: python main.py`;
  }

  getPythonDockerIgnore() {
    return `__pycache__
*.pyc
*.pyo
*.pyd
.Python
pip-log.txt
pip-delete-this-directory.txt
.tox/
.coverage
.coverage.*
.cache
*.log
.git
.gitignore
.dockerignore
Dockerfile
Dockerfile.dev`;
  }

  // Golang templates
  getGolangDockerfile() {
    return `# Multi-stage build for Go application
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:latest AS production

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy the binary from builder
COPY --from=builder /app/main .

EXPOSE 8080

CMD ["./main"]`;
  }

  getGolangDockerfileDev() {
    return `FROM golang:1.21-alpine AS development

WORKDIR /app

# Install air for hot reload
RUN go install github.com/cosmtrek/air@latest

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

EXPOSE 8080 2345

CMD ["air"]`;
  }

  getGolangDockerCompose() {
    return `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
    ports:
      - "8080:8080"
      - "2345:2345"
    environment:
      - GO_ENV=development`;
  }

  getGolangDockerIgnore() {
    return `.git
.gitignore
README.md
.dockerignore
Dockerfile
Dockerfile.dev
vendor/`;
  }

  // Java templates
  getJavaDockerfile() {
    return `FROM maven:3.9-eclipse-temurin-17 AS builder

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn package -DskipTests

FROM eclipse-temurin:17-jre-alpine AS production

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]`;
  }

  getJavaDockerfileDev() {
    return `FROM maven:3.9-eclipse-temurin-17 AS development

WORKDIR /app

COPY pom.xml .
RUN mvn dependency:go-offline

COPY . .

EXPOSE 8080 5005

CMD ["mvn", "spring-boot:run", "-Dspring-boot.run.jvmArguments='-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:5005'"]`;
  }

  getJavaDockerCompose() {
    return `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - ~/.m2:/root/.m2
    ports:
      - "8080:8080"
      - "5005:5005"
    environment:
      - SPRING_PROFILES_ACTIVE=dev`;
  }

  getJavaDockerIgnore() {
    return `target/
.git
.gitignore
README.md
.dockerignore
Dockerfile
Dockerfile.dev
.idea
*.iml`;
  }

  // Rust templates
  getRustDockerfile() {
    return `FROM rust:1.73 AS builder

WORKDIR /app

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

COPY src ./src
RUN touch src/main.rs
RUN cargo build --release

FROM debian:bookworm-slim AS production

WORKDIR /app

COPY --from=builder /app/target/release/app /app/app

EXPOSE 8080

CMD ["./app"]`;
  }

  getRustDockerfileDev() {
    return `FROM rust:1.73 AS development

WORKDIR /app

RUN cargo install cargo-watch

COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build
RUN rm -rf src

COPY . .

EXPOSE 8080

CMD ["cargo", "watch", "-x", "run"]`;
  }

  getRustDockerCompose() {
    return `version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - .:/app
      - cargo-cache:/usr/local/cargo/registry
      - target-cache:/app/target
    ports:
      - "8080:8080"
    environment:
      - RUST_BACKTRACE=1
      - RUST_LOG=debug

volumes:
  cargo-cache:
  target-cache:`;
  }

  getRustDockerIgnore() {
    return `target/
.git
.gitignore
README.md
.dockerignore
Dockerfile
Dockerfile.dev`;
  }

  // Create Docker files for the detected project type
  createDockerFiles(projectType, force = false) {
    if (projectType === 'unknown') {
      this.print('Unable to detect project type', 'yellow');
      this.print('Please specify project type manually', 'yellow');
      return false;
    }

    const templates = this.templates[projectType];
    if (!templates) {
      this.print(`No templates available for ${projectType}`, 'red');
      return false;
    }

    this.print(`Creating ${projectType.toUpperCase()} Docker configuration...`, 'green');

    // Check existing files
    const files = [
      { name: 'Dockerfile', content: templates.dockerfile },
      { name: 'Dockerfile.dev', content: templates.dockerfileDev },
      { name: 'docker-compose.yml', content: templates.dockerCompose },
      { name: '.dockerignore', content: templates.dockerIgnore }
    ];

    let created = 0;
    let skipped = 0;

    for (const file of files) {
      if (fs.existsSync(file.name) && !force) {
        this.print(`  ⚠️  ${file.name} already exists, skipping`, 'yellow');
        skipped++;
      } else {
        fs.writeFileSync(file.name, file.content);
        this.print(`  ✅ Created ${file.name}`, 'green');
        created++;
      }
    }

    return { created, skipped };
  }

  // Check Docker installation
  checkDocker() {
    try {
      execSync('docker version', { stdio: 'ignore' });
      return true;
    } catch (error) {
      this.print('Docker is not installed or not running', 'red');
      this.print('Please install Docker Desktop from https://docker.com', 'yellow');
      return false;
    }
  }

  // Show help
  showHelp() {
    console.log('Docker Development Environment Setup');
    console.log('');
    console.log('Usage: docker-dev-setup [options] [project-type]');
    console.log('');
    console.log('Options:');
    console.log('  --force       Overwrite existing Docker files');
    console.log('  --check       Check Docker installation only');
    console.log('  -h, --help    Show this help message');
    console.log('');
    console.log('Project Types:');
    console.log('  nodejs        Node.js/JavaScript project');
    console.log('  python        Python project');
    console.log('  golang        Go project');
    console.log('  java          Java/Maven project');
    console.log('  rust          Rust/Cargo project');
    console.log('');
    console.log('Examples:');
    console.log('  docker-dev-setup              # Auto-detect project type');
    console.log('  docker-dev-setup nodejs       # Create Node.js Docker files');
    console.log('  docker-dev-setup --force      # Overwrite existing files');
  }

  // Main execution
  async run(args = []) {
    let force = false;
    let checkOnly = false;
    let projectType = null;

    // Parse arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      switch (arg) {
        case '--force':
          force = true;
          break;

        case '--check':
          checkOnly = true;
          break;

        case '-h':
        case '--help':
          this.showHelp();
          return;

        default:
          if (!arg.startsWith('-')) {
            projectType = arg.toLowerCase();
          } else {
            this.print(`Unknown option: ${arg}`, 'red');
            process.exit(1);
          }
      }
    }

    // Check Docker installation
    this.print('🐳 Docker Development Environment Setup', 'blue');
    console.log('=====================================');
    console.log('');

    this.print('Checking Docker installation...', 'blue');
    const dockerInstalled = this.checkDocker();

    if (!dockerInstalled) {
      process.exit(1);
    }

    this.print('✅ Docker is installed and running', 'green');
    console.log('');

    if (checkOnly) {
      return;
    }

    // Detect or use specified project type
    if (!projectType) {
      this.print('Detecting project type...', 'blue');
      projectType = this.detectProjectType();
      this.print(`Detected: ${projectType}`, projectType === 'unknown' ? 'yellow' : 'green');
    } else {
      this.print(`Using specified project type: ${projectType}`, 'green');
    }

    console.log('');

    // Create Docker files
    const result = this.createDockerFiles(projectType, force);

    if (result) {
      console.log('');
      this.print('=== Summary ===', 'blue');
      this.print(`Created: ${result.created} files`, 'green');
      if (result.skipped > 0) {
        this.print(`Skipped: ${result.skipped} files (already exist)`, 'yellow');
      }

      if (result.created > 0) {
        console.log('');
        this.print('Next steps:', 'blue');
        console.log('  1. Review the generated Docker files');
        console.log('  2. Run: docker-compose up');
        console.log('  3. Access your application at http://localhost:3000 (or configured port)');
      }
    }
  }
}

// CLI entry point
if (require.main === module) {
  const setup = new DockerDevSetup();
  setup.run(process.argv.slice(2)).catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

module.exports = DockerDevSetup;