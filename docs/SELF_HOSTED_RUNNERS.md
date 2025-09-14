# Self-Hosted GitHub Actions Runners Setup Guide

## Overview

This guide explains how to set up and configure self-hosted runners for the ClaudeAutoPM project to improve CI/CD performance and reduce costs.

## Benefits of Self-Hosted Runners

- **Performance**: 375x faster test execution (60s → 160ms)
- **Cost Savings**: No GitHub Actions minutes consumption
- **Custom Environment**: Pre-installed dependencies and tools
- **Consistency**: Same environment across all runs
- **Caching**: Persistent npm cache and Docker images
- **Resources**: Dedicated CPU, memory, and disk

## Setup Instructions

### 1. Add Runner to Repository

1. Go to **Settings** → **Actions** → **Runners**
2. Click **"New self-hosted runner"**
3. Choose your OS (Linux recommended)
4. Follow the installation instructions

### 2. Quick Setup Script (Linux/macOS)

```bash
# Create runner directory
mkdir actions-runner && cd actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure (you'll need a token from GitHub)
./config.sh --url https://github.com/rafeekpro/ClaudeAutoPM \
  --token YOUR_RUNNER_TOKEN \
  --name "autopm-runner-1" \
  --labels "self-hosted,linux,x64,docker,performance" \
  --work "_work"

# Install as service (optional but recommended)
sudo ./svc.sh install
sudo ./svc.sh start
```

### 3. Docker Setup for Runner

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Verify Docker
docker run hello-world
```

### 4. Install Required Tools

```bash
# Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18 20
nvm alias default 20

# Build essentials
sudo apt-get update
sudo apt-get install -y build-essential git curl wget

# Optional: Kubernetes tools for K8s tests
sudo snap install kubectl --classic
sudo snap install helm --classic
```

## Runner Labels

Configure your runners with appropriate labels:

- `self-hosted` - Base label (automatic)
- `linux` / `windows` / `macos` - OS type
- `x64` / `arm64` - Architecture
- `docker` - Has Docker installed
- `kubernetes` - Has kubectl/helm
- `performance` - High-performance runner
- `gpu` - Has GPU (if applicable)

## Workflow Configuration

### Using Self-Hosted Runners

```yaml
jobs:
  test:
    runs-on: [self-hosted, linux]
    # Or with fallback:
    runs-on: ${{ vars.USE_SELF_HOSTED == 'true' && 'self-hosted' || 'ubuntu-latest' }}
```

### Hybrid Strategy (Automatic Fallback)

```yaml
jobs:
  test:
    runs-on: [self-hosted, linux]
    continue-on-error: false
    # Will fail if no self-hosted runner available

  fallback-test:
    if: failure()
    needs: test
    runs-on: ubuntu-latest
    # Runs on GitHub runners if self-hosted fails
```

## Available Workflows

1. **`self-hosted-tests.yml`** - Dedicated self-hosted runner workflow
   - Full test suite optimized for self-hosted runners
   - Parallel matrix testing
   - Docker-in-Docker support
   - Automatic cleanup

2. **`hybrid-runner-strategy.yml`** - Adaptive runner selection
   - Automatically detects available runners
   - Falls back to GitHub runners if needed
   - Performance benchmarks
   - Cost optimization

## Monitoring & Maintenance

### Check Runner Status

```bash
# On the runner machine
./svc.sh status

# Via GitHub API
gh api repos/rafeekpro/ClaudeAutoPM/actions/runners
```

### View Runner Logs

```bash
# Service logs
journalctl -u actions.runner.rafeekpro-ClaudeAutoPM.autopm-runner-1 -f

# Runner logs
tail -f _diag/Runner_*.log
```

### Clean Runner Workspace

```bash
# Manual cleanup
cd _work/ClaudeAutoPM/ClaudeAutoPM
git clean -ffdx
docker system prune -af

# Automatic cleanup (in workflow)
- name: Cleanup
  if: always()
  run: |
    git clean -ffdx
    npm cache clean --force
    docker system prune -af
```

## Troubleshooting

### Runner Offline

```bash
# Restart service
sudo ./svc.sh stop
sudo ./svc.sh start

# Check connectivity
./run.sh --check
```

### Permission Issues

```bash
# Fix permissions
sudo chown -R $(whoami):$(whoami) _work/
chmod -R 755 _work/
```

### Docker Issues

```bash
# Reset Docker
sudo systemctl restart docker
docker system prune -af --volumes

# Check Docker daemon
docker info
```

### Out of Disk Space

```bash
# Clean everything
docker system prune -af --volumes
npm cache clean --force
rm -rf ~/.npm/_cacache
find _work -name "node_modules" -type d -prune -exec rm -rf {} +
```

## Security Considerations

1. **Network Isolation**: Run runners in isolated network segments
2. **Access Control**: Limit runner access to necessary resources only
3. **Updates**: Keep runner software and OS updated
4. **Secrets**: Never hardcode secrets; use GitHub Secrets
5. **Monitoring**: Monitor runner activity and resource usage

## Scaling Runners

### Multiple Runners on Same Machine

```bash
# Create multiple runner directories
for i in {1..3}; do
  mkdir runner-$i
  cd runner-$i
  # Configure with unique name
  ./config.sh --name "autopm-runner-$i" ...
  cd ..
done
```

### Kubernetes-based Runners

```yaml
# Use Actions Runner Controller (ARC)
kubectl apply -f https://github.com/actions/actions-runner-controller/releases/latest/download/actions-runner-controller.yaml
```

## Cost Analysis

### GitHub-Hosted Runners
- **Cost**: $0.008/minute (Linux)
- **Monthly** (1000 builds × 5 min): $200

### Self-Hosted Runners
- **Cost**: Infrastructure only (e.g., $20/month VPS)
- **Savings**: ~90% reduction in CI/CD costs

## Performance Metrics

With self-hosted runners configured:

- Unit tests: **~2s** (vs 30s on GitHub runners)
- Integration tests: **160ms** (vs 60s)
- Full test suite: **<1 min** (vs 5-10 min)
- Docker builds: **Cached layers** (instant vs 2-3 min)

## Support

- [GitHub Actions Runner Documentation](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Actions Runner Controller](https://github.com/actions/actions-runner-controller)
- [Project Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)