# Installation & Update Commands

Complete reference for installation, updates, and project setup commands.

---

## autopm install

Install ClaudeAutoPM framework in the current project.

### Synopsis

```bash
autopm install [options]
```

### Description

Installs the ClaudeAutoPM framework into your project by:
1. Creating `.claude/` directory structure
2. Copying agent definitions, commands, rules, and scripts
3. Generating project-specific configuration files
4. Setting up Claude Code integration
5. Installing selected MCP servers
6. Loading initial agent team

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--preset <name>` | Installation preset | Interactive prompt |
| `--provider <name>` | Provider (github/azure/local) | Interactive prompt |
| `--force` | Force reinstall (overwrites existing) | false |
| `--no-interactive` | Skip interactive prompts | false |
| `--dry-run` | Show what would be installed | false |
| `--skip-mcp` | Skip MCP server installation | false |
| `--skip-hooks` | Skip Git hooks installation | false |

### Presets

#### minimal
Best for: Small projects, learning ClaudeAutoPM

**Includes:**
- Core agents (7)
- Basic PM commands (44)
- Sequential execution
- Local Git workflow
- ~10 agents total

```bash
autopm install --preset minimal
```

#### docker-only
Best for: Docker development, containerized apps

**Includes:**
- Core agents (7)
- Docker containerization expert
- Docker-first development rules
- Adaptive execution
- ~15 agents total

```bash
autopm install --preset docker-only
```

#### fullstack
Best for: Most projects, full-stack development (RECOMMENDED)

**Includes:**
- All language agents (6)
- All framework agents (8)
- Docker containerization
- Database agents (5)
- Testing agents (3)
- ~30 agents total

```bash
autopm install --preset fullstack
```

#### devops
Best for: Infrastructure teams, production deployments

**Includes:**
- Everything in fullstack
- Kubernetes orchestrator
- All cloud architects (7)
- Terraform expert
- CI/CD specialists
- ~39 agents (all)

```bash
autopm install --preset devops
```

#### custom
Best for: Advanced users, specific requirements

**Allows:**
- Manual agent selection
- Custom execution strategy
- Fine-tuned configuration

```bash
autopm install --preset custom
```

### Examples

**Interactive installation (recommended):**
```bash
cd my-project
autopm install
```

**Install with specific preset:**
```bash
autopm install --preset fullstack
```

**Install for GitHub with fullstack preset:**
```bash
autopm install --preset fullstack --provider github
```

**Force reinstall:**
```bash
autopm install --force
```

**Dry run to see what would be installed:**
```bash
autopm install --preset fullstack --dry-run
```

**Non-interactive installation:**
```bash
autopm install --preset fullstack --provider github --no-interactive
```

### Files Created

After installation, your project will have:

```
your-project/
├── .claude/
│   ├── agents/           # AI agent definitions
│   ├── commands/         # Slash commands
│   ├── rules/            # Development rules
│   ├── scripts/          # Automation scripts
│   ├── checklists/       # Development checklists
│   ├── mcp/              # MCP documentation
│   ├── templates/        # Code templates
│   ├── strategies/       # Execution strategies
│   ├── config.json       # Main configuration
│   ├── teams.json        # Agent team definitions
│   └── .env              # Environment variables
├── .claude-code/
│   └── config.json       # Claude Code settings
├── scripts/
│   ├── safe-commit.sh    # Git commit helper
│   └── setup-hooks.sh    # Git hooks installer
└── CLAUDE.md             # Project instructions
```

### Post-Installation

After installation:

1. **Configure Provider:**
   ```bash
   autopm config set provider github
   autopm config set github.owner YOUR_USERNAME
   autopm config set github.repo YOUR_REPO
   ```

2. **Set Environment Variables:**
   ```bash
   export GITHUB_TOKEN=ghp_xxxxx
   # Or add to .claude/.env
   echo "GITHUB_TOKEN=ghp_xxxxx" >> .claude/.env
   ```

3. **Load Agent Team:**
   ```bash
   autopm team load fullstack
   ```

4. **Validate Installation:**
   ```bash
   autopm validate
   ```

5. **Open Claude Code:**
   ```bash
   claude --dangerously-skip-permissions .
   ```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Installation successful |
| 1 | General error |
| 2 | Invalid arguments |
| 3 | Directory not empty (without --force) |
| 4 | Invalid preset |
| 5 | Failed to copy files |

---

## autopm update

Update ClaudeAutoPM framework to latest version.

### Synopsis

```bash
autopm update [options]
```

### Description

Updates the ClaudeAutoPM framework while preserving your configuration and customizations.

**Update process:**
1. Backs up current configuration
2. Downloads latest framework files
3. Updates agents, commands, and rules
4. Preserves custom modifications
5. Migrates configuration if needed
6. Validates updated installation

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--force` | Force update (overwrites local changes) | false |
| `--agents-only` | Update only agent definitions | false |
| `--commands-only` | Update only slash commands | false |
| `--rules-only` | Update only development rules | false |
| `--preserve-config` | Keep current configuration | true |
| `--dry-run` | Show what would be updated | false |
| `--backup` | Create backup before updating | true |

### Examples

**Standard update (preserves config):**
```bash
autopm update
```

**Force update all files:**
```bash
autopm update --force
```

**Update only agents:**
```bash
autopm update --agents-only
```

**Update only commands:**
```bash
autopm update --commands-only
```

**Dry run to see changes:**
```bash
autopm update --dry-run
```

**Update without backup:**
```bash
autopm update --no-backup
```

### Update Process

1. **Backup** (if enabled):
   - Creates `.claude.backup/` directory
   - Copies current configuration
   - Saves timestamp

2. **Download**:
   - Fetches latest framework version
   - Verifies integrity

3. **Update**:
   - Updates framework files
   - Preserves custom agents
   - Migrates configuration

4. **Validate**:
   - Checks installation
   - Verifies configuration
   - Tests agent registry

### Files Updated

| Category | Files Updated | Preserved |
|----------|---------------|-----------|
| **Agents** | Standard agents | Custom agents |
| **Commands** | Standard commands | Custom commands |
| **Rules** | Standard rules | Custom rules |
| **Scripts** | Framework scripts | User scripts |
| **Config** | Default values | User settings |

### Configuration Migration

If configuration format changes between versions, `autopm update` automatically migrates:

```
Old config (v1.0):          New config (v1.1):
{                           {
  "provider": "github"  →     "provider": {
}                               "type": "github",
                                "config": {...}
                              }
                            }
```

### Rollback

If update fails or causes issues:

```bash
# Restore from backup
cp -r .claude.backup/ .claude/

# Or reinstall previous version
npm install -g claude-autopm@1.20.0
autopm update
```

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Update successful |
| 1 | General error |
| 2 | Update failed |
| 3 | Configuration migration failed |
| 4 | Validation failed after update |

---

## autopm validate

Validate ClaudeAutoPM installation and configuration.

### Synopsis

```bash
autopm validate [options]
```

### Description

Performs comprehensive validation of your ClaudeAutoPM installation:
- Framework files integrity
- Configuration validity
- Provider connection
- Agent registry consistency
- MCP server availability
- Git repository status

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--verbose` | Show detailed validation results | false |
| `--fix` | Attempt to fix common issues | false |
| `--registry` | Validate agent registry only | false |
| `--config` | Validate configuration only | false |
| `--provider` | Test provider connection only | false |
| `--mcp` | Validate MCP servers only | false |

### Examples

**Full validation:**
```bash
autopm validate
```

**Verbose output:**
```bash
autopm validate --verbose
```

**Validate and fix issues:**
```bash
autopm validate --fix
```

**Validate agent registry only:**
```bash
autopm validate --registry
```

**Validate configuration only:**
```bash
autopm validate --config
```

**Test provider connection:**
```bash
autopm validate --provider
```

### Validation Checks

#### 1. Framework Installation
- ✅ `.claude/` directory exists
- ✅ Required directories present
- ✅ Framework files complete
- ✅ Permissions correct

#### 2. Configuration
- ✅ `config.json` valid JSON
- ✅ Required fields present
- ✅ Provider configuration valid
- ✅ Execution strategy valid

#### 3. Provider Connection
- ✅ Token/credentials valid
- ✅ API connection successful
- ✅ Repository access confirmed
- ✅ Permissions sufficient

#### 4. Agent Registry
- ✅ All agents have valid frontmatter
- ✅ No duplicate agents
- ✅ Required agents present
- ✅ Team definitions valid

#### 5. MCP Servers
- ✅ MCP configuration valid
- ✅ Servers accessible
- ✅ Authentication working
- ✅ Integration functional

#### 6. Git Repository
- ✅ Repository initialized
- ✅ Remote configured (if using GitHub/Azure)
- ✅ Working tree clean

### Output Format

**Successful validation:**
```
✅ Framework installation: OK
✅ Configuration file: OK
✅ Provider setup (GitHub): OK
✅ Agent registry: OK (39 agents)
✅ MCP servers: OK (2 active)
✅ Git repository: OK

All checks passed! 🎉
```

**Failed validation:**
```
✅ Framework installation: OK
❌ Configuration file: FAILED
   - Missing required field: github.owner
   - Invalid execution strategy: invalid
✅ Provider setup: SKIPPED (config invalid)
⚠️  Agent registry: WARNING
   - Duplicate agent: python-backend-engineer
✅ MCP servers: OK
✅ Git repository: OK

2 errors, 1 warning
```

### Auto-Fix

With `--fix` flag, validation attempts to fix:

1. **Missing Configuration Fields**:
   - Prompts for required values
   - Sets sensible defaults

2. **Invalid JSON**:
   - Repairs common JSON errors
   - Reformats configuration

3. **Duplicate Agents**:
   - Removes duplicates
   - Keeps latest version

4. **Missing Directories**:
   - Creates required directories
   - Sets correct permissions

### Exit Codes

| Code | Meaning |
|------|---------|
| 0 | All validations passed |
| 1 | General error |
| 6 | Validation failed (errors found) |
| 7 | Validation warnings (minor issues) |

---

## autopm uninstall

Remove ClaudeAutoPM from project.

### Synopsis

```bash
autopm uninstall [options]
```

### Description

Removes ClaudeAutoPM framework from your project while optionally preserving configuration and custom files.

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--keep-config` | Preserve configuration files | false |
| `--keep-custom` | Preserve custom agents/commands | false |
| `--backup` | Create backup before uninstall | true |
| `--force` | Skip confirmation prompt | false |

### Examples

**Standard uninstall (with confirmation):**
```bash
autopm uninstall
```

**Uninstall and keep configuration:**
```bash
autopm uninstall --keep-config
```

**Uninstall without backup:**
```bash
autopm uninstall --no-backup
```

**Force uninstall (no prompts):**
```bash
autopm uninstall --force
```

### Files Removed

**Standard uninstall removes:**
- `.claude/` directory
- `.claude-code/config.json`
- `CLAUDE.md`
- `scripts/safe-commit.sh`
- `scripts/setup-hooks.sh`

**With `--keep-config` preserves:**
- `.claude/config.json`
- `.claude/.env`
- `.claude/teams.json`

**With `--keep-custom` preserves:**
- `.claude/agents/custom/`
- `.claude/commands/custom/`
- `.claude/rules/custom/`

### Backup

If `--backup` enabled (default), creates:
```
.claude.uninstall.backup.TIMESTAMP/
├── .claude/
├── .claude-code/
├── CLAUDE.md
└── scripts/
```

### Restore from Backup

```bash
# List backups
ls -la | grep claude.uninstall

# Restore
mv .claude.uninstall.backup.20250103-081500/ .claude/
```

---

## autopm version

Show version information.

### Synopsis

```bash
autopm version [options]
autopm --version
autopm -v
```

### Options

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |
| `--verbose` | Show detailed version info |

### Examples

**Show version:**
```bash
autopm version
# Output: claude-autopm@1.20.1
```

**Detailed version info:**
```bash
autopm version --verbose
```

Output:
```
claude-autopm version: 1.20.1
Node.js version: v18.17.0
npm version: 9.6.7
Installation path: /usr/local/lib/node_modules/claude-autopm
Framework version: 1.1.0
Agent registry version: 1.1.0
```

**JSON output:**
```bash
autopm version --json
```

Output:
```json
{
  "package": "1.20.1",
  "node": "v18.17.0",
  "npm": "9.6.7",
  "framework": "1.1.0",
  "registry": "1.1.0"
}
```

---

## autopm help

Show help information.

### Synopsis

```bash
autopm help [command]
autopm --help
autopm -h
```

### Examples

**General help:**
```bash
autopm help
```

**Command-specific help:**
```bash
autopm help install
autopm help config
autopm help team
```

**List all commands:**
```bash
autopm help --all
```

---

## Common Workflows

### Initial Setup

```bash
# 1. Install framework
cd my-project
autopm install --preset fullstack

# 2. Configure provider
autopm config set provider github
autopm config set github.owner myusername
autopm config set github.repo myrepo
export GITHUB_TOKEN=ghp_xxxxx

# 3. Load team
autopm team load fullstack

# 4. Validate
autopm validate

# 5. Open Claude Code
claude --dangerously-skip-permissions .
```

### Regular Updates

```bash
# Check current version
autopm version

# Update npm package
npm update -g claude-autopm

# Update framework
autopm update

# Validate
autopm validate
```

### Troubleshooting

```bash
# Full validation with verbose output
autopm validate --verbose

# Validate and fix
autopm validate --fix

# Reinstall
autopm install --force

# Uninstall and reinstall
autopm uninstall --backup
autopm install --preset fullstack
```

---

## Environment Variables

Commands respect these environment variables:

| Variable | Description |
|----------|-------------|
| `AUTOPM_DEBUG=1` | Enable debug output |
| `AUTOPM_LOG_LEVEL=verbose` | Set log level |
| `AUTOPM_CONFIG=/path/config` | Custom config location |
| `GITHUB_TOKEN` | GitHub personal access token |
| `AZURE_DEVOPS_PAT` | Azure DevOps PAT |

---

## Related Documentation

- [Configuration Commands](config.md)
- [Team Management](team.md)
- [MCP Management](mcp.md)
- [Installation Guide](../getting-started/installation.md)
- [Quick Start](../getting-started/quick-start.md)
