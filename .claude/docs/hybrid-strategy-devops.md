
## 📖 Overview

This document describes our comprehensive hybrid approach that combines a **docker-first development philosophy** with a **kubernetes-native CI/CD implementation** for our containerd runners.

## 🎯 The Problem We Solved

### The Challenge
- ✅ **Local development** works perfectly with Docker & docker-compose.
- ❌ **CI/CD on Kubernetes** was failing because there is no Docker daemon on our `containerd` runners.
- ❌ A **purely docker-first** command approach (`docker build`, `docker run`) is incompatible with our K8s infrastructure.
- ✅ **`containerd` + `kubectl`** are available, but represent a different operational paradigm.

### The Solution: A Hybrid Strategy
- 🏠 **Local:** Pure docker-first (unchanged for developers).
- ☸️ **CI/CD:** Kubernetes-native, but still using the "container-first" philosophy.
- 🐳 **Artifacts:** Dockerfiles remain the single source of truth for building images.
- 🔄 **Experience:** Seamless for developers, powerful and reliable for CI/CD.

## 🏗️ Architecture Overview

```mermaid
graph TD
    subgraph "🏠 Local Development"
        A[Developer] --> B[docker-compose up]
        A --> C[docker build]
    end
    
    subgraph "☸️ CI/CD (Kubernetes Runner)"
        E[GitHub Actions Workflow] --> F[kubectl apply -f kaniko-job.yml]
        F --> G[Kaniko Pod builds image in Cluster]
        E --> H[kubectl run test-pod --image=...]
    end
    
    subgraph "🐳 Shared Artifacts"
        I[Dockerfiles]
        J[Container Images]
    end
    
    B --> I
    C --> J
    G --> I
    G --> J
````

## 📋 Implementation Strategy

### For Developers (Your Workflow is Unchanged)

You continue to work exactly as before. The goal is zero disruption to your local development experience.

```bash
# Your local workflow remains the same!
docker-compose -f docker-compose.dev.yml up --build

# Manually build an image
docker build -t my-feature-image .
```

### For CI/CD (The New Kubernetes-Native Way)

The GitHub Actions runner now acts as an **orchestrator**, telling Kubernetes what to do instead of doing the work itself.

#### Building Container Images

We use **Kaniko** to build images directly inside the cluster, without needing a Docker daemon.

*Old Way (Fails in CI):*

```yaml
- name: Build Backend Image
  run: docker build -t my-app . # Fails: docker not available
```

*New Way (Works in CI):*

```yaml
- name: Build Backend Container with Kaniko
  run: |
    # This command creates a Job in Kubernetes
    # The Job runs a Kaniko pod that builds the image from our Dockerfile
    kubectl apply -f .github/templates/kaniko-build-job.yml
    
    # Wait for the build to finish inside the cluster
    kubectl wait --for=condition=complete job/backend-build --timeout=600s
```

#### Running Services (like Databases for Tests)

We use `kubectl` to spin up temporary services needed for tests.

*Old Way (Fails in CI):*

```yaml
services:
  mongodb:
    image: mongo:6.0
```

*New Way (Works in CI):*

```yaml
- name: Deploy MongoDB for tests
  run: |
    # Create a MongoDB pod directly in Kubernetes for this job
    kubectl run mongodb-test --image=mongo:6.0
    kubectl wait --for=condition=ready pod/mongodb-test --timeout=120s
```

## 🎯 Benefits of This Hybrid Approach

### For Developers ✅

  - **Zero Disruption:** Your local `docker-compose` workflow is unchanged.
  - **Familiar Artifacts:** You still create and modify standard `Dockerfiles`.
  - **Fast Iteration:** No need to learn Kubernetes commands for local development.

### For CI/CD ✅

  - **Works on Kubernetes:** Fully compatible with `containerd`-based runners.
  - **Reliable Isolation:** Each CI job can run in its own temporary Kubernetes namespace.
  - **Scalable & Efficient:** Leverages the cluster's resources for building and testing, not the runner's.
  - **Production Parity:** Tests run in an environment that is structurally identical to production.

## 🚀 The Bottom Line

Our strategy is simple:

1.  **Develop Locally** using the speed and simplicity of `docker-compose`.
2.  **Define Your Application** using standard `Dockerfiles`.
3.  **CI/CD Will Handle the Rest**, by translating your `Dockerfiles` into running applications in a real Kubernetes environment for testing.

This approach gives us the best of both worlds, ensuring a smooth developer experience and a robust, production-ready CI/CD pipeline.

```


**Result**: Docker-first philosophy ✅ + K8s-native implementation ✅ = Successful hybrid strategy! 🚀