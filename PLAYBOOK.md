# Speacher Project Playbook

This document is the single source of truth for all development, testing, and deployment practices for this project. All contributors, both human and AI, MUST adhere to these principles.

## Core Philosophy

Our strategy combines a **Docker-first local development** experience with a **Kubernetes-native CI/CD** pipeline. This provides developers with a fast, familiar, and consistent local environment while leveraging the power and scalability of Kubernetes for testing and deployment.

- **Developer Experience is Paramount:** The local workflow remains unchanged (`docker-compose`).
- **CI/CD is Production-Like:** CI/CD runs directly on Kubernetes, mirroring our production environment.
- **Artifacts are Universal:** `Dockerfiles` are the shared, single source of truth for building container images.

## Key Strategy Documents

The detailed rules and implementation patterns are located in the `.claude/rules/` directory:

1. **[Development Environments & Workflow](/.claude/rules/development-environments.md)**
    - Defines the separation between the local Docker setup and the Kubernetes-based CI/CD environment.

2. **[CI/CD Kubernetes Strategy](/.claude/rules/ci-cd-kubernetes-strategy.md)**
    - Contains the practical implementation details for running services, building images (`nerdctl`), and managing resources on our `containerd` Kubernetes runners.

3. **[Database Management Strategy](/.claude/rules/database-management-strategy.md)**
    - Outlines the approach for managing databases across all four environments: **Local, CI/CD, Staging, and Production**.

4. **[Golden Rules of Development](/.claude/rules/golden-rules.md)**
    - The fundamental truths that guide all development decisions.

5. **[Definition of Done (DoD)](/.claude/rules/definition-of-done.md)**
    - The universal checklist that must be satisfied before any work is considered complete.
