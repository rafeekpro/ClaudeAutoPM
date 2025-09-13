## 🚀 FULL DEVOPS WORKFLOW (DOCKER + KUBERNETES)

This project uses a hybrid strategy: Docker for local development, Kubernetes for CI/CD and production.

### 🎯 HYBRID STRATEGY

#### Why Hybrid?
**The Problem**: 
- ✅ Docker works perfectly for local development
- ❌ CI/CD runners use containerd (no Docker daemon)
- ❌ `docker build` and `docker run` fail in Kubernetes runners

**The Solution**:
- 🏠 **Local**: Pure Docker (unchanged for developers)
- ☸️ **CI/CD**: Kubernetes-native using Kaniko for builds
- 🐳 **Shared**: Dockerfiles remain source of truth

#### Local Development: Docker-First
- All local development happens in Docker containers
- Use `docker compose` for service orchestration
- Hot reload enabled for rapid iteration

#### CI/CD & Production: Kubernetes-Native
- GitHub Actions automatically test in KIND clusters
- Kaniko builds images without Docker daemon
- Helm charts for production deployments
- Multi-environment support (dev/staging/prod)

### 🐳 Local Development (Docker)

1. **Start development environment**
   ```bash
   docker compose up -d
   ```

2. **Run commands in containers**
   ```bash
   docker compose exec app npm install
   docker compose exec app npm run dev
   docker compose exec app npm test
   ```

3. **Simulate CI locally before push**
   ```bash
   # Test exactly what CI will run
   npm ci
   npm run build
   npm run test
   npm run lint
   npm run test:e2e
   
   # Or use shorthand
   npm run ci:local
   ```

### ☸️ Kubernetes Testing (CI/CD)

Automated via GitHub Actions:

1. **KIND Cluster Setup**
   - Spins up Kubernetes in Docker
   - Tests deployment manifests
   - Validates Helm charts

2. **Building Images with Kaniko**
   ```yaml
   # In GitHub Actions (no Docker daemon)
   - name: Build with Kaniko
     run: |
       kubectl apply -f - <<EOF
       apiVersion: batch/v1
       kind: Job
       metadata:
         name: kaniko-build
       spec:
         template:
           spec:
             containers:
             - name: kaniko
               image: gcr.io/kaniko-project/executor:latest
               args:
                 - "--dockerfile=Dockerfile"
                 - "--context=git://github.com/user/repo"
                 - "--destination=registry/image:tag"
       EOF
   ```

3. **Integration Tests**
   ```yaml
   # Runs automatically on push
   - Tests in real K8s environment
   - Multi-version K8s testing
   - Security scanning with Trivy
   ```

4. **Production Deployment**
   ```bash
   # Helm deployment (automated)
   helm upgrade --install app ./charts/app
   ```

### 📋 DevOps Rules

#### Local Development
- **ALWAYS** use Docker Compose locally
- **NEVER** run code on host machine
- **MAINTAIN** hot reload for productivity

#### CI/CD Pipeline
- **AUTOMATE** K8s testing in GitHub Actions
- **VALIDATE** manifests before deployment
- **SCAN** images for vulnerabilities

#### Production
- **DEPLOY** via Helm charts
- **MONITOR** with Prometheus/Grafana
- **SCALE** based on metrics

### 🔧 Required Files

```
project/
├── docker-compose.yml      # Local development
├── Dockerfile             # Container build
├── k8s/                   # Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── ingress.yaml
├── charts/                # Helm charts
│   └── app/
│       ├── Chart.yaml
│       └── values.yaml
└── .github/workflows/     # CI/CD pipelines
    └── kubernetes-tests.yml
```

### ⚠️ Important Notes

- Local Docker ≠ Production Kubernetes
- Test in KIND before production
- Use namespaces for isolation
- Enable resource limits
- Implement health checks