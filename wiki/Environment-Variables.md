# Environment Variables

ClaudeAutoPM uses environment variables to configure integrations, enable features, and customize behavior. This page documents all available variables from the `.claude/.env` configuration file.

## Configuration File

Environment variables are stored in `.claude/.env` after installation. A template is available at `.claude/.env.example`.

## Core Configuration

### Framework Settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AUTOPM_VERSION` | Framework version identifier | No | Current version |
| `AUTOPM_MODE` | Execution mode (development/production) | No | `development` |
| `CLAUDE_CODE_PATH` | Path to Claude Code installation | No | Auto-detected |

## MCP (Model Context Protocol) Configuration

### MCP Server Settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MCP_CONTEXT7_ENABLED` | Enable Context7 MCP server | No | `true` |
| `MCP_PLAYWRIGHT_ENABLED` | Enable Playwright MCP server | No | `true` |
| `MCP_GITHUB_ENABLED` | Enable GitHub MCP server | No | `true` |
| `MCP_FILESYSTEM_ENABLED` | Enable Filesystem MCP server | No | `false` |
| `MCP_SQLITE_ENABLED` | Enable SQLite MCP server | No | `false` |

### Context7 Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `CONTEXT7_API_URL` | Context7 API endpoint | When enabled | `https://api.context7.com` |
| `CONTEXT7_CODEBASE_PATH` | Path to codebase for Context7 | When enabled | Current directory |
| `CONTEXT7_DOCS_PATH` | Path to documentation | When enabled | `./docs` |
| `CONTEXT7_INDEX_ENABLED` | Enable automatic indexing | No | `true` |

## GitHub Integration

### Repository Settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GITHUB_OWNER` | GitHub repository owner | For GitHub commands | - |
| `GITHUB_REPO` | GitHub repository name | For GitHub commands | - |
| `GITHUB_TOKEN` | GitHub personal access token | For API operations | - |
| `GITHUB_DEFAULT_BRANCH` | Default branch name | No | `main` |

### GitHub Actions

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GITHUB_ACTIONS_ENABLED` | Enable GitHub Actions workflows | No | `true` |
| `GITHUB_RUNNER_TYPE` | Runner type (github-hosted/self-hosted) | No | `github-hosted` |
| `GITHUB_MATRIX_TESTING` | Enable matrix testing | No | `true` |

## Azure DevOps Integration

### Organization Settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AZURE_DEVOPS_ORG_URL` | Azure DevOps organization URL | For Azure commands | - |
| `AZURE_DEVOPS_PROJECT` | Azure DevOps project name | For Azure commands | - |
| `AZURE_DEVOPS_PAT` | Personal Access Token | For Azure API | - |

### Work Item Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AZURE_AREA_PATH` | Default area path for work items | No | Project root |
| `AZURE_ITERATION_PATH` | Default iteration path | No | Current iteration |
| `AZURE_TEAM` | Default team name | No | Default team |
| `AZURE_BOARD_COLUMN_TODO` | Column for new items | No | `To Do` |
| `AZURE_BOARD_COLUMN_DOING` | Column for active items | No | `Doing` |
| `AZURE_BOARD_COLUMN_DONE` | Column for completed items | No | `Done` |

### Pipeline Settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AZURE_PIPELINE_ID` | Default pipeline ID | No | - |
| `AZURE_BUILD_DEFINITION` | Build definition name | No | - |
| `AZURE_RELEASE_DEFINITION` | Release definition name | No | - |

## Docker Configuration

### Docker Settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DOCKER_ENABLED` | Enable Docker features | No | `true` |
| `DOCKER_FIRST_DEVELOPMENT` | Enforce Docker-first workflow | No | `true` |
| `DOCKER_REGISTRY` | Docker registry URL | No | `docker.io` |
| `DOCKER_USERNAME` | Docker registry username | For push | - |
| `DOCKER_PASSWORD` | Docker registry password | For push | - |

### Docker Compose

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `COMPOSE_PROJECT_NAME` | Docker Compose project name | No | Directory name |
| `COMPOSE_FILE` | Docker Compose file path | No | `docker-compose.yml` |
| `COMPOSE_PROFILES` | Active Compose profiles | No | - |

## Kubernetes Configuration

### Cluster Settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `KUBERNETES_ENABLED` | Enable Kubernetes features | No | `false` |
| `KUBERNETES_CONTEXT` | kubectl context to use | When enabled | `docker-desktop` |
| `KUBERNETES_NAMESPACE` | Default namespace | No | `default` |
| `KUBERNETES_DEVOPS_TESTING` | Enable K8s in CI/CD | No | `false` |

### Helm Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `HELM_ENABLED` | Enable Helm chart management | No | `false` |
| `HELM_CHART_PATH` | Path to Helm charts | No | `./charts` |
| `HELM_RELEASE_NAME` | Default release name | No | Project name |

## Cloud Provider Configuration

### AWS Settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AWS_REGION` | AWS region | For AWS operations | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | For AWS API | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | For AWS API | - |
| `AWS_SESSION_TOKEN` | AWS session token | For temp credentials | - |

### Azure Cloud Settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | For Azure operations | - |
| `AZURE_TENANT_ID` | Azure AD tenant ID | For authentication | - |
| `AZURE_CLIENT_ID` | Service principal ID | For authentication | - |
| `AZURE_CLIENT_SECRET` | Service principal secret | For authentication | - |

### Google Cloud Settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GCP_PROJECT_ID` | GCP project ID | For GCP operations | - |
| `GCP_REGION` | Default GCP region | No | `us-central1` |
| `GOOGLE_APPLICATION_CREDENTIALS` | Path to service account key | For authentication | - |

## AI/ML Integrations

### OpenAI Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `OPENAI_API_KEY` | OpenAI API key | For OpenAI agents | - |
| `OPENAI_ORGANIZATION` | OpenAI organization ID | No | - |
| `OPENAI_MODEL` | Default model to use | No | `gpt-4` |

### Google Gemini Configuration

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | For Gemini agents | - |
| `GEMINI_MODEL` | Default Gemini model | No | `gemini-pro` |

## Testing Configuration

### Test Settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `TEST_RUNNER` | Test runner to use | No | `npm test` |
| `TEST_COVERAGE_THRESHOLD` | Minimum coverage percentage | No | `80` |
| `TEST_PARALLEL` | Run tests in parallel | No | `true` |
| `TEST_CONTAINERS` | Use containers for testing | No | `true` |

## Feature Toggles

### Development Features

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `FEATURE_DOCKER_FIRST` | Enable Docker-first development | No | `true` |
| `FEATURE_KUBERNETES` | Enable Kubernetes features | No | `false` |
| `FEATURE_PARALLEL_AGENTS` | Enable parallel agent execution | No | `true` |
| `FEATURE_AUTO_PR` | Auto-create pull requests | No | `false` |
| `FEATURE_AUTO_MERGE` | Auto-merge approved PRs | No | `false` |

## Security Settings

### Authentication

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `AUTH_PROVIDER` | Authentication provider | No | `none` |
| `AUTH_TOKEN_EXPIRY` | Token expiry time (seconds) | No | `3600` |
| `ENCRYPTION_KEY` | Key for encrypting secrets | No | Generated |

## Logging and Monitoring

### Log Settings

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `LOG_LEVEL` | Logging level (debug/info/warn/error) | No | `info` |
| `LOG_FORMAT` | Log format (json/text) | No | `text` |
| `LOG_FILE` | Path to log file | No | `./logs/autopm.log` |

## Example .env File

Here's a typical `.env` configuration for a full DevOps setup:

```bash
# GitHub Integration
GITHUB_OWNER=mycompany
GITHUB_REPO=awesome-project
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
GITHUB_DEFAULT_BRANCH=main

# Azure DevOps Integration
AZURE_DEVOPS_ORG_URL=https://dev.azure.com/mycompany
AZURE_DEVOPS_PROJECT=MyProject
AZURE_DEVOPS_PAT=xxxxxxxxxxxxxxxxxxxx

# Docker Configuration
DOCKER_ENABLED=true
DOCKER_FIRST_DEVELOPMENT=true
COMPOSE_PROJECT_NAME=awesome-project

# Kubernetes Configuration
KUBERNETES_ENABLED=true
KUBERNETES_CONTEXT=docker-desktop
KUBERNETES_NAMESPACE=development

# Feature Toggles
FEATURE_PARALLEL_AGENTS=true
FEATURE_AUTO_PR=true

# MCP Servers
MCP_CONTEXT7_ENABLED=true
MCP_PLAYWRIGHT_ENABLED=true
MCP_GITHUB_ENABLED=true

# Testing
TEST_COVERAGE_THRESHOLD=85
TEST_CONTAINERS=true
```

## Setting Environment Variables

### During Installation

The installer will prompt for required variables:

```bash
autopm install
# Follow prompts to set variables
```

### Manual Configuration

Edit `.claude/.env` directly:

```bash
nano .claude/.env
# or
vim .claude/.env
```

### Using Command Line

Set variables before running commands:

```bash
GITHUB_TOKEN=mytoken DOCKER_ENABLED=true autopm install
```

### In Docker Compose

Reference in `docker-compose.yml`:

```yaml
services:
  app:
    env_file:
      - .claude/.env
```

## Best Practices

1. **Never commit secrets**: Add `.env` to `.gitignore`
2. **Use `.env.example`**: Commit template without values
3. **Validate variables**: Run `autopm validate` after changes
4. **Use consistent naming**: Follow the PREFIX_NAME pattern
5. **Document custom variables**: Add to `.env.example`

## Troubleshooting

### Variable Not Working

Check if the variable is loaded:

```bash
# In your project directory
cat .claude/.env | grep VARIABLE_NAME

# Test in shell
source .claude/.env
echo $VARIABLE_NAME
```

### Missing Required Variables

The validator will identify missing variables:

```bash
autopm validate

# Output:
❌ Missing required environment variables:
  - GITHUB_TOKEN
  - AZURE_DEVOPS_PAT
```

## Related Pages

- [Configuration Options](Configuration-Options)
- [Feature Toggles](Feature-Toggles)
- [Azure DevOps Integration](Azure-DevOps-Integration)
- [GitHub Actions](GitHub-Actions)