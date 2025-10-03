---
allowed-tools: Task, Read, Write, Edit, MultiEdit, Bash, Glob, Grep
---

# Kubernetes Deployment

Deploys applications to Kubernetes clusters.

**Usage**: `/kubernetes:deploy [app-name] [--chart=helm|kustomize] [--namespace=default] [--gitops=argocd|flux]`

## Required Documentation Access

**MANDATORY:** Before Kubernetes deployment, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/kubernetes/deployment` - deployment best practices
- `mcp://context7/kubernetes/best-practices` - best practices best practices
- `mcp://context7/devops/container-orchestration` - container orchestration best practices

**Why This is Required:**
- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions


**Example**: `/kubernetes:deploy my-app --chart=helm --namespace=production --gitops=argocd`

**What this does**:
- Creates Kubernetes manifests or Helm charts
- Configures deployments with best practices
- Sets up services and ingress
- Implements autoscaling and monitoring
- Configures GitOps if requested
- Adds security policies

Use the kubernetes-orchestrator agent to deploy applications to Kubernetes.