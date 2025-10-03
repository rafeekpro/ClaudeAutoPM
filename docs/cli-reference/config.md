# Configuration Commands

Complete reference for configuration management commands.

---

## autopm config show

Display current configuration.

### Synopsis

```bash
autopm config show [options]
```

### Description

Displays the current ClaudeAutoPM configuration from `.claude/config.json`.

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--json` | Output as JSON | false |
| `--verbose` | Show all settings including defaults | false |
| `--secrets` | Include secrets (masked) | false |

### Examples

**Show configuration:**
```bash
autopm config show
```

Output:
```
Configuration:
  Provider: github
  GitHub Owner: myusername
  GitHub Repo: myproject
  Execution Strategy: adaptive
  Max Parallel: 3
  MCP Enabled: true
  MCP Servers: context7, playwright
```

**JSON output:**
```bash
autopm config show --json
```

Output:
```json
{
  "provider": "github",
  "github": {
    "owner": "myusername",
    "repo": "myproject"
  },
  "execution": {
    "strategy": "adaptive",
    "maxParallel": 3
  },
  "mcp": {
    "enabled": true,
    "servers": ["context7", "playwright"]
  }
}
```

**Show all settings:**
```bash
autopm config show --verbose
```

**Show with secrets (masked):**
```bash
autopm config show --secrets
```

Output:
```
  GITHUB_TOKEN: ghp_****...(hidden)
  AZURE_DEVOPS_PAT: ****...(hidden)
```

---

## autopm config set

Set configuration value.

### Synopsis

```bash
autopm config set <key> <value>
```

### Description

Sets a configuration value in `.claude/config.json`.

### Configuration Keys

#### Provider Configuration

```bash
# Set provider type
autopm config set provider <github|azure|local>

# GitHub configuration
autopm config set github.owner <username>
autopm config set github.repo <repository>
autopm config set github.branch <branch>

# Azure DevOps configuration
autopm config set azure.organization <org>
autopm config set azure.project <project>
autopm config set azure.team <team>
```

#### Execution Configuration

```bash
# Execution strategy
autopm config set execution.strategy <sequential|adaptive|hybrid>

# Max parallel tasks
autopm config set execution.maxParallel <number>

# Timeout (milliseconds)
autopm config set execution.timeout <number>
```

#### MCP Configuration

```bash
# Enable/disable MCP
autopm config set mcp.enabled <true|false>

# Set MCP servers (comma-separated)
autopm config set mcp.servers context7,playwright,sqlite
```

### Examples

**Configure GitHub:**
```bash
autopm config set provider github
autopm config set github.owner myusername
autopm config set github.repo myproject
```

**Configure Azure DevOps:**
```bash
autopm config set provider azure
autopm config set azure.organization myorg
autopm config set azure.project myproject
```

**Set execution strategy:**
```bash
autopm config set execution.strategy adaptive
```

**Set max parallel:**
```bash
autopm config set execution.maxParallel 5
```

**Enable MCP:**
```bash
autopm config set mcp.enabled true
autopm config set mcp.servers context7
```

### Value Types

| Type | Example | Description |
|------|---------|-------------|
| String | `github` | Text value |
| Number | `3` | Numeric value |
| Boolean | `true` or `false` | Boolean value |
| Array | `context7,playwright` | Comma-separated values |

### Nested Keys

Use dot notation for nested keys:
```bash
autopm config set github.owner username
#                └─┬──┘ └──┬──┘
#                 key   value
```

Results in:
```json
{
  "github": {
    "owner": "username"
  }
}
```

---

## autopm config get

Get configuration value.

### Synopsis

```bash
autopm config get <key>
```

### Description

Retrieves a specific configuration value.

### Examples

**Get provider:**
```bash
autopm config get provider
# Output: github
```

**Get execution strategy:**
```bash
autopm config get execution.strategy
# Output: adaptive
```

**Get GitHub owner:**
```bash
autopm config get github.owner
# Output: myusername
```

**Get MCP servers:**
```bash
autopm config get mcp.servers
# Output: context7,playwright
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Value found and displayed |
| 1 | General error |
| 3 | Key not found in configuration |

---

## autopm config unset

Remove configuration value.

### Synopsis

```bash
autopm config unset <key>
```

### Description

Removes a configuration key and its value.

### Examples

**Remove GitHub configuration:**
```bash
autopm config unset github.owner
```

**Remove execution strategy (reverts to default):**
```bash
autopm config unset execution.strategy
```

**Remove MCP servers:**
```bash
autopm config unset mcp.servers
```

---

## autopm config validate

Validate configuration and test connections.

### Synopsis

```bash
autopm config validate [options]
```

### Description

Validates configuration file and tests provider connections.

### Options

| Option | Description |
|--------|-------------|
| `--fix` | Attempt to fix validation errors |
| `--provider-only` | Test provider connection only |

### Validation Checks

#### 1. Configuration File
- ✅ File exists
- ✅ Valid JSON format
- ✅ Required fields present
- ✅ Values have correct types

#### 2. Provider Configuration
- ✅ Provider type valid
- ✅ Provider-specific fields present
- ✅ Credentials configured (environment)

#### 3. Provider Connection
- ✅ API endpoint accessible
- ✅ Authentication successful
- ✅ Repository/project accessible
- ✅ Permissions sufficient

#### 4. Execution Configuration
- ✅ Strategy valid
- ✅ maxParallel in valid range (1-10)
- ✅ Timeout reasonable

#### 5. MCP Configuration
- ✅ Enabled flag is boolean
- ✅ Servers list valid

### Examples

**Validate configuration:**
```bash
autopm config validate
```

Output:
```
✅ Configuration file: OK
✅ Provider configuration (GitHub): OK
✅ Provider connection: OK
  - Repository: myusername/myproject
  - Access: Read/Write
  - Permissions: Issues, Pull Requests, Workflows
✅ Execution configuration: OK
✅ MCP configuration: OK

All checks passed! 🎉
```

**Validate and fix:**
```bash
autopm config validate --fix
```

**Test provider connection only:**
```bash
autopm config validate --provider-only
```

### Common Issues

#### Missing Required Fields

**Error:**
```
❌ Configuration file: FAILED
   - Missing required field: github.owner
```

**Fix:**
```bash
autopm config set github.owner myusername
```

#### Invalid Provider

**Error:**
```
❌ Provider configuration: FAILED
   - Invalid provider: invalid_provider
   - Valid providers: github, azure, local
```

**Fix:**
```bash
autopm config set provider github
```

#### Invalid Token

**Error:**
```
❌ Provider connection: FAILED
   - Authentication failed
   - Token may be expired or invalid
```

**Fix:**
```bash
# Regenerate token and update
export GITHUB_TOKEN=ghp_new_token
autopm config validate
```

#### Insufficient Permissions

**Error:**
```
⚠️  Provider connection: WARNING
   - Missing permission: workflows
   - Some features may not work
```

**Fix:**
- Regenerate token with additional scopes
- Update token in environment

---

## autopm config reset

Reset configuration to defaults.

### Synopsis

```bash
autopm config reset [options]
```

### Description

Resets configuration to default values.

### Options

| Option | Description |
|--------|-------------|
| `--hard` | Remove all configuration |
| `--backup` | Create backup before reset |

### Examples

**Reset to defaults:**
```bash
autopm config reset
```

**Hard reset (remove all config):**
```bash
autopm config reset --hard
```

**Reset with backup:**
```bash
autopm config reset --backup
```

### What Gets Reset

**Standard reset:**
- Execution strategy → `adaptive`
- Max parallel → `3`
- Timeout → `300000`
- Keeps provider configuration
- Keeps MCP configuration

**Hard reset:**
- Removes all configuration
- Creates default config file
- Requires reconfiguration

---

## autopm config export

Export configuration to file.

### Synopsis

```bash
autopm config export <file> [options]
```

### Description

Exports configuration to a file for backup or sharing.

### Options

| Option | Description |
|--------|-------------|
| `--json` | Export as JSON (default) |
| `--yaml` | Export as YAML |
| `--include-secrets` | Include environment variables |

### Examples

**Export to JSON:**
```bash
autopm config export config-backup.json
```

**Export to YAML:**
```bash
autopm config export config-backup.yaml --yaml
```

**Export with secrets:**
```bash
autopm config export config-full.json --include-secrets
```

---

## autopm config import

Import configuration from file.

### Synopsis

```bash
autopm config import <file> [options]
```

### Description

Imports configuration from a file.

### Options

| Option | Description |
|--------|-------------|
| `--merge` | Merge with existing config |
| `--force` | Overwrite without confirmation |

### Examples

**Import configuration:**
```bash
autopm config import config-backup.json
```

**Merge with existing:**
```bash
autopm config import config-backup.json --merge
```

**Force import:**
```bash
autopm config import config-backup.json --force
```

---

## Configuration File Reference

### Complete Configuration Schema

```json
{
  "provider": "github|azure|local",

  "github": {
    "owner": "username",
    "repo": "repository",
    "branch": "main"
  },

  "azure": {
    "organization": "org-name",
    "project": "project-name",
    "team": "team-name"
  },

  "execution": {
    "strategy": "sequential|adaptive|hybrid",
    "maxParallel": 3,
    "timeout": 300000
  },

  "mcp": {
    "enabled": true,
    "servers": ["context7", "playwright"]
  },

  "features": {
    "autoSync": true,
    "commitTemplates": true,
    "prTemplates": true
  },

  "paths": {
    "prds": "prds/",
    "epics": "epics/",
    "templates": ".claude/templates/"
  }
}
```

### Field Descriptions

#### provider
- **Type:** `string`
- **Values:** `github`, `azure`, `local`
- **Required:** Yes
- **Description:** Project management provider

#### github.owner
- **Type:** `string`
- **Required:** If provider is `github`
- **Description:** GitHub username or organization

#### github.repo
- **Type:** `string`
- **Required:** If provider is `github`
- **Description:** Repository name

#### github.branch
- **Type:** `string`
- **Default:** `main`
- **Description:** Default branch

#### azure.organization
- **Type:** `string`
- **Required:** If provider is `azure`
- **Description:** Azure DevOps organization

#### azure.project
- **Type:** `string`
- **Required:** If provider is `azure`
- **Description:** Azure DevOps project name

#### execution.strategy
- **Type:** `string`
- **Values:** `sequential`, `adaptive`, `hybrid`
- **Default:** `adaptive`
- **Description:** Agent execution strategy

#### execution.maxParallel
- **Type:** `number`
- **Range:** 1-10
- **Default:** 3
- **Description:** Maximum parallel tasks

#### execution.timeout
- **Type:** `number`
- **Default:** 300000
- **Description:** Task timeout in milliseconds

#### mcp.enabled
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Enable MCP servers

#### mcp.servers
- **Type:** `array`
- **Default:** `[]`
- **Description:** Enabled MCP server names

---

## Environment Variables

Configuration can reference environment variables:

### Required Variables

| Variable | Description | Provider |
|----------|-------------|----------|
| `GITHUB_TOKEN` | GitHub personal access token | GitHub |
| `AZURE_DEVOPS_PAT` | Azure DevOps PAT | Azure |

### Optional Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | For Context7 MCP server |
| `AUTOPM_DEBUG` | Enable debug logging |
| `AUTOPM_LOG_LEVEL` | Set log level |

### Setting Environment Variables

**.claude/.env file (recommended):**
```bash
GITHUB_TOKEN=ghp_xxxxx
OPENAI_API_KEY=sk-xxxxx
```

**Shell export:**
```bash
export GITHUB_TOKEN=ghp_xxxxx
export AZURE_DEVOPS_PAT=xxxxx
```

**Temporary (for single command):**
```bash
GITHUB_TOKEN=ghp_xxxxx autopm config validate
```

---

## Common Workflows

### Initial Configuration

```bash
# 1. Set provider
autopm config set provider github

# 2. Configure GitHub
autopm config set github.owner myusername
autopm config set github.repo myproject

# 3. Set credentials
export GITHUB_TOKEN=ghp_xxxxx

# 4. Enable MCP
autopm config set mcp.enabled true
autopm config set mcp.servers context7

# 5. Validate
autopm config validate
```

### Switch Providers

```bash
# From GitHub to Azure
autopm config set provider azure
autopm config set azure.organization myorg
autopm config set azure.project myproject
export AZURE_DEVOPS_PAT=xxxxx
autopm config validate
```

### Change Execution Strategy

```bash
# For learning/debugging
autopm config set execution.strategy sequential

# For production (recommended)
autopm config set execution.strategy adaptive

# For power users
autopm config set execution.strategy hybrid
autopm config set execution.maxParallel 5
```

### Backup and Restore

```bash
# Backup
autopm config export config-backup-$(date +%Y%m%d).json

# Restore
autopm config import config-backup-20250103.json
```

---

## Related Documentation

- [Installation Commands](install-update.md)
- [Team Management](team.md)
- [MCP Management](mcp.md)
- [Configuration Guide](../getting-started/installation.md#provider-configuration)
