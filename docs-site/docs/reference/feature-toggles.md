# Feature Toggles

ClaudeAutoPM provides an interactive configuration system for managing features like Docker-first development and Kubernetes testing. This guide explains how to enable, disable, and configure these features through the toggle system.

## Interactive Configuration Tool

The primary way to manage feature toggles is through the interactive configuration script:

```bash
bash .claude/scripts/config/toggle-features.sh
```

This launches an interactive menu that guides you through configuration options.

## Available Feature Toggles

### Docker-First Development

**Toggle Variable**: `docker_first_development`

**What it enables**:
- Enforces all development happens inside Docker containers
- Blocks direct execution of package managers (npm, pip, etc.) on host
- Redirects commands to Docker containers automatically
- Ensures consistent development environment across team

**When enabled**:
```json
{
  "docker_first_development": true,
  "docker_compose_required": true,
  "local_execution_allowed": false
}
```

**Impact on workflow**:
- Commands like `npm install` must run as `docker compose run app npm install`
- Python commands execute in containers: `docker compose run python pip install`
- Database operations happen in containers only

### Kubernetes DevOps Testing

**Toggle Variable**: `kubernetes_devops_testing`

**What it enables**:
- Activates Kubernetes testing in CI/CD pipelines
- Spins up KIND (Kubernetes in Docker) clusters for testing
- Enables Helm chart validation
- Runs integration tests in K8s environment

**When enabled**:
```json
{
  "kubernetes_devops_testing": true,
  "use_kind_clusters": true,
  "helm_validation": true,
  "k8s_integration_tests": true
}
```

**Impact on CI/CD**:
- GitHub Actions workflows include K8s testing stages
- Pull requests validated against Kubernetes deployments
- Helm charts automatically tested on each commit

### Parallel Agent Execution

**Toggle Variable**: `parallel_agent_execution`

**What it enables**:
- Multiple AI agents can work simultaneously
- Improved performance for complex tasks
- Automatic task distribution across agents

**When enabled**:
```json
{
  "parallel_agent_execution": true,
  "max_parallel_agents": 5,
  "adaptive_scheduling": true
}
```

### Auto Pull Request Creation

**Toggle Variable**: `auto_pr_creation`

**What it enables**:
- Automatically creates PRs for completed work
- Generates PR descriptions from commit messages
- Links issues and work items automatically

**When enabled**:
```json
{
  "auto_pr_creation": true,
  "auto_assign_reviewers": true,
  "draft_pr_default": false
}
```

## Using the Configuration Script

### Starting the Configurator

```bash
$ bash .claude/scripts/config/toggle-features.sh

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       ClaudeAutoPM Feature Configuration Manager
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Current Configuration:
├─ Docker-First Development: [ON]
├─ Kubernetes Testing: [OFF]
├─ Parallel Agents: [ON]
└─ Auto PR Creation: [OFF]

Select an option:
1) Toggle Docker-First Development
2) Toggle Kubernetes DevOps Testing
3) Configure Parallel Execution
4) Setup Auto PR Creation
5) Apply Configuration Preset
6) Show Current Configuration
7) Validate Configuration
8) Exit

Enter choice [1-8]:
```

### Configuration Presets

The script offers quick presets for common scenarios:

```bash
Select configuration preset:
1) Minimal - Basic features only
2) Docker Development - Docker-first with testing
3) Full DevOps - All features enabled
4) Performance - Optimized for speed
5) Custom - Configure each feature

Enter choice [1-5]:
```

### Preset Configurations

#### Minimal Preset
```json
{
  "docker_first_development": false,
  "kubernetes_devops_testing": false,
  "parallel_agent_execution": false,
  "execution_strategy": "sequential"
}
```

#### Docker Development Preset
```json
{
  "docker_first_development": true,
  "kubernetes_devops_testing": false,
  "parallel_agent_execution": true,
  "execution_strategy": "adaptive"
}
```

#### Full DevOps Preset
```json
{
  "docker_first_development": true,
  "kubernetes_devops_testing": true,
  "parallel_agent_execution": true,
  "execution_strategy": "adaptive",
  "auto_pr_creation": true
}
```

#### Performance Preset
```json
{
  "docker_first_development": true,
  "kubernetes_devops_testing": true,
  "parallel_agent_execution": true,
  "execution_strategy": "hybrid",
  "max_parallel_agents": 10
}
```

## Manual Configuration

### Editing Configuration Files

You can manually edit the configuration in `.claude/config.json`:

```json
{
  "project_name": "my-project",
  "features": {
    "docker_first_development": true,
    "kubernetes_devops_testing": false,
    "parallel_agent_execution": true,
    "auto_pr_creation": false
  },
  "execution": {
    "strategy": "adaptive",
    "max_parallel": 5,
    "timeout_seconds": 300
  }
}
```

### Environment Variable Overrides

Features can be overridden using environment variables:

```bash
# Enable Docker-first development
export FEATURE_DOCKER_FIRST=true

# Enable Kubernetes testing
export FEATURE_KUBERNETES=true

# Set parallel execution
export FEATURE_PARALLEL_AGENTS=true
```

## Feature Dependencies

Some features depend on others:

| Feature | Requires |
|---------|----------|
| Kubernetes Testing | Docker-First Development |
| Auto PR Creation | GitHub/Azure DevOps Integration |
| Parallel Agents | Docker-First (recommended) |
| Helm Validation | Kubernetes Testing |

## Validation

After changing toggles, validate your configuration:

```bash
# Using the script
bash .claude/scripts/config/toggle-features.sh
# Select option 7 (Validate Configuration)

# Or directly
autopm validate
```

Validation checks:
- Required dependencies are enabled
- Configuration files are valid JSON
- Required tools are installed (Docker, kubectl, etc.)
- Environment variables are set correctly

## Impact on Different Workflows

### Local Development

With Docker-First **enabled**:
```bash
# This will be blocked:
npm install express

# Use this instead:
docker compose run app npm install express
```

With Docker-First **disabled**:
```bash
# Direct execution allowed:
npm install express
python manage.py runserver
```

### CI/CD Pipeline

With Kubernetes Testing **enabled**:
```yaml
# Added to GitHub Actions workflow:
jobs:
  kubernetes-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Create KIND cluster
        run: kind create cluster
      - name: Deploy to Kubernetes
        run: kubectl apply -f k8s/
      - name: Run K8s tests
        run: npm run test:k8s
```

### Agent Execution

With Parallel Execution **enabled**:
```markdown
# Agents work simultaneously:
@code-analyzer: Reviewing code for issues...
@test-runner: Running test suite...
@docker-expert: Building containers...

# All three execute in parallel
```

With Parallel Execution **disabled**:
```markdown
# Agents work sequentially:
@code-analyzer: Reviewing code for issues...
# Waits for completion
@test-runner: Running test suite...
# Waits for completion
@docker-expert: Building containers...
```

## Troubleshooting

### Toggle Not Taking Effect

1. Check configuration file:
```bash
cat .claude/config.json | jq '.features'
```

2. Verify environment variables:
```bash
env | grep FEATURE_
```

3. Restart Claude Code:
```bash
# Configuration is loaded on startup
```

### Conflicts Between Features

The configurator will warn about conflicts:
```
⚠️  Warning: Kubernetes testing requires Docker-first development
   Would you like to enable Docker-first as well? [Y/n]
```

### Resetting to Defaults

```bash
# Reset all features to defaults
cp .claude/config.json.default .claude/config.json

# Or use the script
bash .claude/scripts/config/toggle-features.sh
# Select: Apply Configuration Preset > Minimal
```

## Best Practices

1. **Start with Minimal**: Begin with minimal configuration and enable features as needed
2. **Use Presets**: Leverage presets for common scenarios
3. **Validate Changes**: Always validate after changing toggles
4. **Document Custom Settings**: Add comments to config.json for custom configurations
5. **Team Consistency**: Ensure all team members use the same feature toggles

## Command Reference

| Command | Description |
|---------|-------------|
| `toggle-features.sh` | Interactive configuration menu |
| `toggle-features.sh --show` | Display current configuration |
| `toggle-features.sh --preset full` | Apply Full DevOps preset |
| `toggle-features.sh --validate` | Validate current configuration |
| `toggle-features.sh --reset` | Reset to defaults |

## Related Pages

- [Configuration Options](Configuration-Options)
- [Environment Variables](Environment-Variables)
- [Docker First Development](Docker-First-Development)
- [Kubernetes Integration](Kubernetes-Integration)