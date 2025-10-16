# Rule: Development Environments & Workflow

This document defines the two primary development environments for this project.

## 1. Local Development Environment (Docker-First)

The local development workflow MUST remain pure `docker-compose`. This ensures zero disruption for developers and maintains a fast, familiar iteration cycle.

- **Tooling**: `docker compose up`, `docker build`, `docker run`.
- **Configuration**: `docker-compose.yml` and `docker-compose.dev.yml`.
- **Philosophy**: Developers should not need to learn `kubectl` or Kubernetes for local work. The experience is seamless and unchanged.

## 2. CI/CD Environment (Kubernetes-Native)

All automated testing and continuous integration processes run directly on our Kubernetes cluster which uses `containerd`. The Docker daemon is NOT available on these runners.

- **Tooling**: `kubectl`, `nerdctl` (for building Dockerfiles).
- **Philosophy**: CI/CD pipelines MUST mirror the production environment as closely as possible. We build and test in the same way we deploy.
- **Artifacts**: The `Dockerfiles` from the repository are the source of truth and are used by `nerdctl` to build images within the CI/CD pipeline.
