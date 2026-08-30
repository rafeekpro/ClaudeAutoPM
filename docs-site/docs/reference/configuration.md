# ⚙️ Configuration Options

ClaudeAutoPM offers three distinct configurations to match your development workflow and team requirements.

## 🎯 Overview

| Configuration | Docker | Kubernetes | Use Case |
|---------------|--------|------------|----------|
| **🏃 Minimal** | ❌ | ❌ | Traditional development, learning, rapid prototyping |
| **🐳 Docker-only** | ✅ | ❌ | Team consistency, environment parity |
| **🚀 Full DevOps** | ✅ | ✅ | Production deployments, enterprise teams |

## 🏃 Minimal Configuration

**Perfect for**: Simple projects, rapid prototyping, learning, individual developers

### Features
- **Native tooling**: Use npm, pip, local execution directly
- **Standard testing**: Traditional test runners (Jest, pytest, etc.)
- **Simple deployment**: FTP, traditional hosting, serverless
- **Quick setup**: No Docker or Kubernetes knowledge required

### Configuration
```json
{
  "features": {
    "docker_first_development": false,
    "kubernetes_devops_testing": false,
    "github_actions_k8s": false,
    "enforce_docker_tests": false,
    "integration_tests": false
  }
}
```

### Environment Variables
```bash
DOCKER_FIRST_DEVELOPMENT=false
KUBERNETES_DEVOPS_TESTING=false
GITHUB_ACTIONS_K8S=false
INTEGRATION_TESTS=false
```

### Development Workflow
```bash
# Install dependencies locally
npm install
pip install -r requirements.txt

# Run development server
npm run dev
python app.py

# Run tests
npm test
pytest
```

### CLAUDE.md Template
Uses `minimal.md` template with:
- Traditional development rules
- Native tooling instructions
- Standard testing approaches
- Local execution patterns

## 🐳 Docker-Only Configuration

**Perfect for**: Team consistency, environment parity, avoiding "works on my machine" issues

### Features
- **Docker-first enforcement**: All code runs in containers
- **Container orchestration**: Docker Compose for services
- **Hot reload**: Volume mounts for rapid development
- **Environment isolation**: Consistent across all developer machines
- **No local pollution**: Clean host system

### Configuration
```json
{
  "features": {
    "docker_first_development": true,
    "enforce_docker_tests": true,
    "auto_create_dockerfile": true,
    "block_local_execution": true,
    "kubernetes_devops_testing": false,
    "github_actions_k8s": false
  }
}
```

### Environment Variables
```bash
DOCKER_FIRST_DEVELOPMENT=true
KUBERNETES_DEVOPS_TESTING=false
GITHUB_ACTIONS_K8S=false
INTEGRATION_TESTS=false
```

### Development Workflow
```bash
# Start development environment
docker compose up -d

# Run commands in containers
docker compose exec app npm install
docker compose exec app npm run dev
docker compose exec app npm test

# View logs
docker compose logs -f app

# Stop environment
docker compose down
```

### Container Architecture
- **Application container**: Source code with hot reload
- **Database container**: PostgreSQL, MongoDB, etc.
- **Cache container**: Redis for sessions/caching
- **Network isolation**: Services communicate via Docker networks

### CLAUDE.md Template
Uses `docker-only.md` template with:
- Docker-first enforcement rules
- Container-based development instructions
- No local execution allowed
- Docker Compose orchestration patterns

## 🚀 Full DevOps Configuration

**Perfect for**: Production deployments, enterprise teams, complex microservices

### Features
- **Hybrid strategy**: Local Docker + CI/CD Kubernetes
- **Production parity**: Test in environments similar to production
- **Kubernetes-native CI**: KIND cluster testing in GitHub Actions
- **Security scanning**: Trivy, vulnerability assessments
- **Helm charts**: Production-ready deployments
- **Enterprise integration**: Azure DevOps, advanced monitoring

### Configuration
```json
{
  "features": {
    "docker_first_development": true,
    "kubernetes_devops_testing": true,
    "github_actions_k8s": true,
    "enforce_docker_tests": true,
    "integration_tests": true,
    "auto_create_dockerfile": true,
    "sync_with_ci": true
  },
  "kubernetes": {
    "enabled": true,
    "testing": {
      "integration_tests": true,
      "helm_chart_tests": true,
      "kubectl_smoke_tests": true
    }
  }
}
```

### Environment Variables
```bash
DOCKER_FIRST_DEVELOPMENT=true
KUBERNETES_DEVOPS_TESTING=true
GITHUB_ACTIONS_K8S=true
INTEGRATION_TESTS=true
```

### Local Development Workflow
```bash
# Same as Docker-only for local development
docker compose up -d
docker compose exec app npm run dev
```

### CI/CD Kubernetes Workflow
Automated via GitHub Actions:
1. **KIND cluster** setup for testing
2. **Docker images** built and pushed
3. **Kubernetes manifests** validated
4. **Helm charts** linted and tested
5. **Integration tests** in Kubernetes environment
6. **Security scanning** with Trivy
7. **Deployment** to staging/production

### Required Files
- `k8s/` - Kubernetes manifests
- `Chart.yaml` - Helm chart definition
- `Dockerfile` - Container build instructions
- `.dockerignore` - Build context optimization

### CLAUDE.md Template
Uses `full-devops.md` template with:
- Hybrid strategy documentation
- Docker-first local development
- Kubernetes CI/CD requirements
- Security and compliance rules
- Production deployment patterns

## 🔄 Switching Configurations

### Interactive Configuration Tool
```bash
autopm config
```

**Features**:
- Visual status display of current features
- Toggle individual features on/off
- Load predefined templates
- Automatic CLAUDE.md regeneration
- Configuration validation

### During Installation
```bash
autopm install

🔧 Choose your development configuration:
  1) 🏃 Minimal     - Traditional development (no Docker/K8s)
  2) 🐳 Docker-only - Docker-first development without Kubernetes  
  3) 🚀 Full DevOps - All features (Docker + Kubernetes + CI/CD)
  4) ⚙️  Custom     - Use existing config.json template

Your choice [1-4]: 
```

### Programmatic Configuration
```bash
# Load specific template
cp .claude/config-templates/docker-only.json .claude/config.json

# Regenerate CLAUDE.md
.claude/scripts/config/toggle-features.sh
```

## 🎯 Configuration Matrix

### Feature Comparison

| Feature | Minimal | Docker-only | Full DevOps |
|---------|---------|-------------|-------------|
| **Local Execution** | ✅ Native | ❌ Docker only | ❌ Docker only |
| **Container Development** | ❌ | ✅ | ✅ |
| **Hot Reload** | ✅ Native | ✅ Volume mounts | ✅ Volume mounts |
| **Database** | Local install | Docker container | Docker/K8s |
| **Testing** | Native runners | Docker containers | Docker + K8s |
| **CI/CD** | Basic | Docker-based | Kubernetes-native |
| **Security Scanning** | Manual | Optional | Automated |
| **Production Deployment** | Manual | Docker | Kubernetes |
| **Team Onboarding** | Medium | Easy | Easy |
| **Learning Curve** | Low | Medium | High |

### GitHub Actions Workflows

| Workflow | Minimal | Docker-only | Full DevOps |
|----------|---------|-------------|-------------|
| **docker-tests.yml** | ❌ | ✅ | ✅ |
| **kubernetes-tests.yml** | ❌ | ❌ | ✅ |
| **npm-publish.yml** | ✅ | ✅ | ✅ |

## 💡 Choosing the Right Configuration

### Start with Minimal if:
- You're new to containers
- Working on simple projects
- Need fast iteration
- Learning ClaudeAutoPM

### Choose Docker-only if:
- You have "works on my machine" issues
- Working in a team
- Want consistent environments
- Ready to learn containers

### Go Full DevOps if:
- Building production applications
- Need enterprise-grade CI/CD
- Working with microservices
- Have DevOps expertise

### Migration Path
```
Minimal → Docker-only → Full DevOps
```

You can always upgrade your configuration as your project grows and your team's expertise increases.

## 🔧 Advanced Configuration

### Custom Templates
Create your own configuration template:

1. Copy existing template: `cp .claude/config-templates/docker-only.json .claude/config-templates/custom.json`
2. Modify features as needed
3. Update installer to include your template
4. Create matching CLAUDE.md template

### Environment-Specific Configs
Different configurations for different environments:

```bash
# Development
cp .claude/config-templates/docker-only.json .claude/config.dev.json

# Production
cp .claude/config-templates/full-devops.json .claude/config.prod.json
```

### CI/CD Integration
Your configuration automatically affects:
- Which GitHub Actions workflows run
- What agents are recommended
- Which rules are enforced
- What CLAUDE.md is generated

## 📋 Next Steps

- **[Quick Start](/getting-started/first-project)** - Set up your first project
- **Docker-First Development** - Learn Docker workflow
- **Kubernetes Integration** - Master K8s testing
- **[Feature Toggles](/reference/feature-toggles)** - Detailed toggle documentation