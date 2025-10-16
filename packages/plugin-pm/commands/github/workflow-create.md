---
allowed-tools: Task, Read, Write, Edit, MultiEdit, Bash, Glob, Grep
---

# GitHub Workflow Creation

Creates GitHub Actions workflows for CI/CD pipelines.

**Usage**: `/github:workflow-create [--type=ci|cd|release] [--stack=node|python|dotnet] [--deploy-to=aws|azure|gcp]`

## Required Documentation Access

**MANDATORY:** Before creating GitHub workflows, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/github/workflows` - workflows best practices
- `mcp://context7/ci-cd/github-actions` - github actions best practices
- `mcp://context7/devops/pipeline-design` - pipeline design best practices
- `mcp://context7/ci-cd/best-practices` - best practices best practices

**Why This is Required:**
- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions


**Example**: `/github:workflow-create --type=ci --stack=node --deploy-to=aws`

**What this does**:
- Creates .github/workflows directory structure
- Generates workflow YAML with best practices
- Configures secrets and environment variables
- Sets up caching for dependencies
- Implements matrix testing strategies
- Adds deployment stages if needed

Use the github-operations-specialist agent to create comprehensive GitHub Actions workflows.

**CRITICAL INSTRUCTION FOR AGENT:**
The generated workflow MUST adhere to the Kubernetes-native CI/CD strategy for `containerd` runners.
Refer to the rules in `.claude/rules/ci-cd-kubernetes-strategy.md` for specific implementation details (use `kubectl` and `nerdctl`, not Docker services).