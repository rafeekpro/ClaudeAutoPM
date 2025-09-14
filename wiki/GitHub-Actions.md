# GitHub Actions

ClaudeAutoPM includes a comprehensive suite of GitHub Actions workflows for automated testing, deployment, and quality assurance. This page documents all available workflows, their purposes, triggers, and configuration options.

## Workflow Overview

ClaudeAutoPM uses a sophisticated CI/CD strategy with multiple workflows:

| Workflow | Purpose | Triggers | Duration |
|----------|---------|-----------|----------|
| **Comprehensive Test Suite** | Full testing across platforms | Push, PR, Schedule | 15-20 min |
| **Selective CI/CD Tests** | Quick feedback for PRs | Push, PR | 3-5 min |
| **Self-Hosted Runner Tests** | Parallel testing on self-hosted runners | Push, PR | 8-12 min |
| **Docker Tests** | Container validation | Push, PR, Docker changes | 10-15 min |
| **Kubernetes Tests** | K8s deployment validation | Push, PR, K8s changes | 12-18 min |
| **Hybrid Runner Strategy** | Adaptive runner selection | All events | 5-10 min |
| **NPM Publish** | Package publication | Version tags | 2-3 min |

## Core Workflows

### Comprehensive Test Suite

**File**: `.github/workflows/comprehensive-tests.yml`

**Purpose**: Complete testing across multiple platforms and Node.js versions

**Triggers**:
- Push to `main`, `develop`, `test/**`, `feature/**` branches
- Pull requests to `main`
- Daily schedule at 2 AM UTC
- Manual dispatch with runner selection

**Configuration**:
```yaml
strategy:
  matrix:
    os: [ubuntu-latest, macos-latest]
    node-version: [18.x, 20.x]
```

**Jobs**:
1. **Check Runners** - Determine optimal runner type
2. **Code Quality Checks** - Linting, formatting, security scans
3. **Integration Tests** - Azure DevOps API integration
4. **End-to-End Tests** - Full workflow validation

**Key Features**:
- Automatic runner selection (GitHub-hosted vs self-hosted)
- Comprehensive Azure DevOps integration testing
- Cross-platform validation
- Artifact generation for test reports

### Selective CI/CD Tests

**File**: `.github/workflows/selective-tests.yml`

**Purpose**: Fast feedback for pull requests with intelligent test selection

**Triggers**:
- Push to any branch
- Pull requests

**Smart Test Selection**:
```yaml
# Runs different tests based on changed files
- name: Determine Tests
  run: |
    if [[ ${{ github.event_name }} == "pull_request" ]]; then
      echo "Running quick tests for PR"
      echo "test_suite=quick" >> $GITHUB_ENV
    else
      echo "Running full tests for push"
      echo "test_suite=full" >> $GITHUB_ENV
    fi
```

**Test Categories**:
- **Quick Tests**: Security, unit tests, basic validation (3-5 min)
- **Full Tests**: All test suites including E2E (15+ min)
- **Security Only**: Focus on security validation (2 min)

### Self-Hosted Runner Tests

**File**: `.github/workflows/self-hosted-tests.yml`

**Purpose**: Parallel test execution on self-hosted runners for faster feedback

**Triggers**:
- Push to `main`, `develop`, feature branches
- Pull requests to `main`

**Parallel Execution Strategy**:
```yaml
strategy:
  matrix:
    test-suite: [security, regression, installation, unit, cli]
    node-version: [18.x, 20.x]
  max-parallel: 5
```

**Jobs**:
- **Security Tests**: Parallel execution of security test suite
- **Regression Tests**: Critical path validation
- **Installation Tests**: Installation scenario validation
- **Unit Tests**: Fast unit test execution
- **CLI Tests**: Command-line interface testing

**Performance Benefits**:
- 60% faster execution through parallelization
- Reduced queue times on busy days
- Resource optimization

### Docker Tests

**File**: `.github/workflows/docker-tests.yml`

**Purpose**: Validate Docker containerization and multi-platform builds

**Triggers**:
- Push to main branches
- Pull requests
- Changes to Docker-related files (`Dockerfile`, `docker-compose.yml`)

**Multi-Platform Testing**:
```yaml
strategy:
  matrix:
    platform: [linux/amd64, linux/arm64]
    scenario: [minimal, docker-only, full-devops]
```

**Test Scenarios**:
1. **Minimal Installation** - Basic Docker setup
2. **Docker-Only** - Docker-first development
3. **Full DevOps** - Complete containerized workflow

**Validation Steps**:
- Docker image builds successfully
- Container starts and responds
- Installation scripts work in containers
- Cross-platform compatibility

### Kubernetes Tests

**File**: `.github/workflows/kubernetes-tests.yml`

**Purpose**: Validate Kubernetes deployments using KIND (Kubernetes in Docker)

**Triggers**:
- Push to main branches
- Pull requests
- Changes to K8s manifests or Helm charts

**KIND Cluster Setup**:
```yaml
- name: Create KIND cluster
  uses: helm/kind-action@v1.5.0
  with:
    cluster_name: autopm-test
    config: test/k8s/kind-config.yaml
```

**Test Categories**:
1. **Basic Deployment** - Simple pod deployment
2. **Helm Charts** - Helm chart validation
3. **Service Discovery** - Network connectivity
4. **Scaling Tests** - Horizontal pod autoscaling
5. **Persistent Volumes** - Storage functionality

**Cluster Configurations**:
- Single-node cluster for basic tests
- Multi-node cluster for advanced scenarios
- Custom networking for service mesh testing

### Hybrid Runner Strategy

**File**: `.github/workflows/hybrid-runner-strategy.yml`

**Purpose**: Intelligently select between GitHub-hosted and self-hosted runners

**Triggers**: All workflow events

**Runner Selection Logic**:
```yaml
- name: Select Runner Type
  id: runner-selection
  run: |
    # Check runner availability
    if [ "${{ github.event.inputs.runner_type }}" = "auto" ]; then
      # Intelligent selection based on:
      # - Queue length
      # - Time of day
      # - Workflow type
      echo "runner=self-hosted" >> $GITHUB_OUTPUT
    else
      echo "runner=${{ github.event.inputs.runner_type }}" >> $GITHUB_OUTPUT
    fi
```

**Selection Criteria**:
- **GitHub-hosted**: For simple, standard tests
- **Self-hosted**: For complex, resource-intensive tests
- **Auto**: Intelligent selection based on load and requirements

### NPM Publish

**File**: `.github/workflows/npm-publish.yml`

**Purpose**: Automated package publishing to npm registry

**Triggers**:
- Creation of version tags (`v*`)
- Manual workflow dispatch

**Publication Process**:
```yaml
steps:
  - name: Validate Version
    run: npm run validate

  - name: Run Tests
    run: npm test

  - name: Publish to NPM
    run: npm publish
    env:
      NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}

  - name: Create GitHub Release
    uses: actions/create-release@v1
```

**Validation Steps**:
- Version number validation
- Full test suite execution
- Package integrity checks
- Automated changelog generation

## Workflow Configuration

### Environment Variables

Common environment variables used across workflows:

```yaml
env:
  NODE_VERSION: '18.x'
  CACHE_DEPENDENCY_PATH: package-lock.json
  AZURE_DEVOPS_ORG_URL: ${{ secrets.AZURE_DEVOPS_ORG_URL }}
  AZURE_DEVOPS_PAT: ${{ secrets.AZURE_DEVOPS_PAT }}
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Secrets Management

Required secrets for full functionality:

| Secret | Purpose | Required For |
|--------|---------|--------------|
| `AZURE_DEVOPS_PAT` | Azure DevOps integration | Integration tests |
| `AZURE_DEVOPS_ORG_URL` | Azure DevOps organization | Integration tests |
| `NPM_TOKEN` | NPM package publishing | Release workflow |
| `DOCKER_USERNAME` | Docker Hub authentication | Docker workflows |
| `DOCKER_PASSWORD` | Docker Hub authentication | Docker workflows |

### Caching Strategy

Workflows use sophisticated caching to reduce execution time:

```yaml
- name: Cache Node.js dependencies
  uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-

- name: Cache Docker layers
  uses: actions/cache@v3
  with:
    path: /tmp/.buildx-cache
    key: ${{ runner.os }}-buildx-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-buildx-
```

**Cache Benefits**:
- 70% faster dependency installation
- 50% faster Docker builds
- Reduced bandwidth usage

## Self-Hosted Runners

### Setup Requirements

For organizations wanting to use self-hosted runners:

**Hardware Requirements**:
- CPU: 4+ cores
- RAM: 8GB+ (16GB recommended)
- Storage: 50GB+ SSD
- Network: Stable internet connection

**Software Requirements**:
- Docker and Docker Compose
- Node.js 18+
- Git
- kubectl (for K8s tests)

### Runner Configuration

```bash
# Download and configure runner
mkdir actions-runner && cd actions-runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure with your organization
./config.sh --url https://github.com/rafeekpro/ClaudeAutoPM \
  --token YOUR_TOKEN \
  --labels self-hosted,linux,x64,autopm

# Install as service
sudo ./svc.sh install
sudo ./svc.sh start
```

### Security Considerations

- Use dedicated machines for runners
- Limit network access to required services
- Regular security updates
- Monitor runner activity

## Workflow Optimization

### Performance Tuning

**Matrix Strategy Optimization**:
```yaml
strategy:
  matrix:
    include:
      - os: ubuntu-latest
        node-version: 18.x
        test-suite: fast
      - os: ubuntu-latest
        node-version: 20.x
        test-suite: comprehensive
  fail-fast: false
```

**Parallel Job Execution**:
- Maximum 10 parallel jobs
- Strategic job dependencies
- Resource-aware scheduling

### Cost Optimization

**Runner Selection Strategy**:
- Use GitHub-hosted for standard tests
- Use self-hosted for intensive operations
- Implement intelligent queuing

**Execution Time Optimization**:
- Cache dependencies aggressively
- Skip unchanged test categories
- Use matrix builds efficiently

## Monitoring and Debugging

### Workflow Monitoring

**Health Checks**:
```yaml
- name: Workflow Health Check
  run: |
    echo "Workflow: ${{ github.workflow }}"
    echo "Event: ${{ github.event_name }}"
    echo "Runner: ${{ runner.os }}"
    echo "Node: $(node --version)"
```

**Artifact Collection**:
- Test reports and coverage
- Build logs and debugging info
- Performance metrics
- Error screenshots (for E2E tests)

### Debugging Failed Workflows

**Common Issues**:
1. **Dependency conflicts** - Clear npm cache
2. **Timeout issues** - Increase timeout values
3. **Resource exhaustion** - Use different runner type
4. **Network issues** - Retry with exponential backoff

**Debug Mode**:
```yaml
- name: Debug Information
  if: failure()
  run: |
    echo "=== System Information ==="
    uname -a
    node --version
    npm --version
    docker --version

    echo "=== Environment Variables ==="
    env | grep -E "(NODE_|NPM_|GITHUB_)" | sort

    echo "=== Process List ==="
    ps aux

    echo "=== Disk Usage ==="
    df -h
```

## Custom Workflows

### Creating Custom Workflows

Organizations can extend workflows for specific needs:

```yaml
name: Custom Organization Tests

on:
  push:
    branches: [main]

jobs:
  custom-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Organization-Specific Tests
        run: |
          npm run test:organization
          npm run validate:compliance
          npm run security:scan
```

### Workflow Templates

Common templates for different scenarios:

1. **Security-First**: Enhanced security scanning
2. **Performance-Focused**: Intensive performance testing
3. **Compliance**: Regulatory compliance validation
4. **Multi-Cloud**: Testing across cloud providers

## Best Practices

### Workflow Design

1. **Fail Fast**: Put quick tests first
2. **Parallel Execution**: Use matrix builds effectively
3. **Resource Management**: Monitor runner usage
4. **Clear Naming**: Use descriptive job names
5. **Status Checks**: Implement proper status reporting

### Security Best Practices

1. **Secret Management**: Use GitHub secrets properly
2. **Least Privilege**: Limit permissions
3. **Audit Logs**: Monitor workflow execution
4. **Dependency Scanning**: Regular security scans
5. **Isolated Environments**: Use clean runners

### Maintenance

**Regular Tasks**:
- Update action versions quarterly
- Review and optimize slow workflows
- Monitor runner costs and usage
- Update security policies
- Clean up old artifacts

## Related Pages

- [Testing Strategies](Testing-Strategies) - Testing approach and tools
- [Quality Assurance](Quality-Assurance) - Quality standards and gates
- [Troubleshooting](Troubleshooting) - CI/CD troubleshooting
- [Configuration Options](Configuration-Options) - Workflow configuration