# Configuration Templates

ClaudeAutoPM provides several pre-configured templates to quickly set up your project with the right balance of features and complexity. Choose the template that best matches your project needs.

## Available Templates

### 1. Minimal Configuration
**File:** `minimal.json`
**Best for:** Simple projects, learning ClaudeAutoPM, or traditional development workflows

```json
{
  "features": {
    "docker_first_development": false,
    "enforce_docker_tests": false,
    "block_local_execution": false,
    "auto_create_dockerfile": false,
    "sync_with_ci": false,
    "kubernetes_devops_testing": false,
    "github_actions_k8s": false,
    "integration_tests": false,
    "git_safety_hooks": false,
    "ci_local_simulation": false
  },
  "execution_strategy": {
    "mode": "sequential",
    "parallel_by_default": false,
    "max_parallel_agents": 1,
    "context_optimization": false,
    "fallback_to_sequential": true
  }
}
```

**Key Features:**
- ✅ Simple sequential execution
- ✅ Direct local development
- ✅ Minimal overhead
- ❌ No Docker requirements
- ❌ No Kubernetes integration
- ❌ No parallel execution

### 2. Docker-Only Configuration
**File:** `docker-only.json`
**Best for:** Teams adopting containerization without Kubernetes complexity

```json
{
  "features": {
    "docker_first_development": true,
    "enforce_docker_tests": true,
    "block_local_execution": true,
    "auto_create_dockerfile": true,
    "sync_with_ci": true,
    "kubernetes_devops_testing": false,
    "github_actions_k8s": false,
    "integration_tests": false,
    "git_safety_hooks": true,
    "ci_local_simulation": true
  },
  "execution_strategy": {
    "mode": "adaptive",
    "parallel_by_default": false,
    "max_parallel_agents": 3,
    "context_optimization": true,
    "fallback_to_sequential": true
  }
}
```

**Key Features:**
- ✅ Docker-first development
- ✅ Automatic Dockerfile generation
- ✅ Hot reload support
- ✅ Local CI simulation
- ✅ Adaptive execution strategy
- ❌ No Kubernetes features

### 3. Full DevOps Configuration
**File:** `full-devops.json`
**Best for:** Enterprise projects with complete CI/CD pipelines

```json
{
  "features": {
    "docker_first_development": true,
    "enforce_docker_tests": true,
    "block_local_execution": true,
    "auto_create_dockerfile": true,
    "sync_with_ci": true,
    "kubernetes_devops_testing": true,
    "github_actions_k8s": true,
    "integration_tests": true,
    "git_safety_hooks": true,
    "ci_local_simulation": true
  },
  "execution_strategy": {
    "mode": "adaptive",
    "parallel_by_default": true,
    "max_parallel_agents": 5,
    "context_optimization": true,
    "fallback_to_sequential": true
  }
}
```

**Key Features:**
- ✅ Full Docker & Kubernetes support
- ✅ GitHub Actions integration
- ✅ Parallel execution by default
- ✅ Integration testing
- ✅ Complete CI/CD pipeline
- ✅ Maximum automation

### 4. Performance Configuration
**File:** `performance.json`
**Best for:** Large teams needing maximum parallelization

```json
{
  "features": {
    "docker_first_development": true,
    "enforce_docker_tests": true,
    "block_local_execution": false,
    "auto_create_dockerfile": true,
    "sync_with_ci": true,
    "kubernetes_devops_testing": true,
    "github_actions_k8s": true,
    "integration_tests": true,
    "git_safety_hooks": true,
    "ci_local_simulation": true
  },
  "execution_strategy": {
    "mode": "hybrid",
    "parallel_by_default": true,
    "max_parallel_agents": 10,
    "context_optimization": true,
    "fallback_to_sequential": false
  }
}
```

**Key Features:**
- ✅ Hybrid execution mode
- ✅ Maximum parallelization (10 agents)
- ✅ All features enabled
- ✅ No fallback to sequential
- ✅ Optimized for speed
- ⚠️ Higher resource consumption

## Quick Comparison

| Feature | Minimal | Docker-Only | Full DevOps | Performance |
|---------|---------|-------------|-------------|-------------|
| **Docker Support** | ❌ | ✅ | ✅ | ✅ |
| **Kubernetes** | ❌ | ❌ | ✅ | ✅ |
| **Parallel Execution** | ❌ | Limited (3) | Yes (5) | Maximum (10) |
| **CI/CD Integration** | ❌ | Partial | Full | Full |
| **Resource Usage** | Low | Medium | High | Very High |
| **Setup Complexity** | Simple | Moderate | Complex | Complex |
| **Best For** | Learning | Containers | Enterprise | Large Teams |

## Using Templates

### During Installation

```bash
# Interactive selection
autopm install

# Direct template selection
autopm install --template minimal
autopm install --template docker-only
autopm install --template full-devops
autopm install --template performance
```

### Manual Configuration

Copy the desired template to your project:

```bash
# Copy template to project root
cp autopm/.claude/templates/config-templates/docker-only.json .claude/config.json

# Or use the CLI
autopm config set --template docker-only
```

### Customizing Templates

You can modify any template by editing `.claude/config.json`:

```bash
# Edit configuration
vim .claude/config.json

# Validate changes
autopm validate

# Apply changes
autopm config reload
```

## Configuration Options

### Execution Strategies

- **`sequential`**: One agent at a time, safest option
- **`adaptive`**: Intelligent switching between sequential and parallel
- **`hybrid`**: Maximum parallelization with smart resource management

### Feature Flags

#### Docker Features
- `docker_first_development`: Enforce containerized development
- `enforce_docker_tests`: Run all tests in containers
- `auto_create_dockerfile`: Generate Dockerfiles automatically
- `volume_mounts`: Configure volume mounting strategies

#### Kubernetes Features
- `kubernetes_devops_testing`: Enable K8s testing
- `github_actions_k8s`: K8s in GitHub Actions
- `helm_chart_tests`: Helm chart validation
- `manifests.auto_generate`: Auto-generate K8s manifests

#### CI/CD Features
- `git_safety_hooks`: Pre-commit and pre-push hooks
- `ci_local_simulation`: Simulate CI locally
- `sync_with_ci`: Keep local and CI in sync
- `integration_tests`: Enable integration testing

## Environment-Specific Overrides

You can override template settings per environment:

```bash
# Development override
export AUTOPM_ENV=development
export AUTOPM_MAX_PARALLEL=2

# Production override
export AUTOPM_ENV=production
export AUTOPM_ENFORCE_DOCKER=true
```

## Migration Between Templates

### Upgrading Templates

```bash
# From minimal to docker-only
autopm config migrate --from minimal --to docker-only

# From docker-only to full-devops
autopm config migrate --from docker-only --to full-devops
```

### Validation After Migration

```bash
# Check configuration
autopm config validate

# Test new configuration
autopm test --config

# Rollback if needed
autopm config rollback
```

## Troubleshooting

### Common Issues

1. **Docker not found**
   ```bash
   # Install Docker first
   autopm doctor --fix-docker
   ```

2. **Kubernetes connection failed**
   ```bash
   # Check kubectl configuration
   autopm k8s validate
   ```

3. **Parallel execution errors**
   ```bash
   # Fallback to sequential
   autopm config set execution_strategy.mode sequential
   ```

## Best Practices

1. **Start Simple**: Begin with minimal and upgrade as needed
2. **Test Locally**: Use `ci_local_simulation` before pushing
3. **Monitor Resources**: Watch CPU/memory with performance template
4. **Version Control**: Commit `.claude/config.json` to repository
5. **Team Alignment**: Ensure team has required tools installed

## Related Documentation

- [Installation Guide](Installation-Guide)
- [Docker-First Development](Docker-First-Development)
- [Kubernetes Integration](Kubernetes-Integration)
- [Execution Strategies](Execution-Strategies)
- [Environment Variables](Environment-Variables)
- [Feature Toggles](Feature-Toggles)

## Support

For template-related issues:
- GitHub Issues: [ClaudeAutoPM/issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
- Template Updates: Check [releases](https://github.com/rafeekpro/ClaudeAutoPM/releases) for new templates
- Custom Templates: See [Development Guide](Development-Guide) for creating custom templates