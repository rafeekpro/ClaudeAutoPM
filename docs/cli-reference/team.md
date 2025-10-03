# Team Management Commands

Complete reference for agent team management commands.

---

## autopm team list

List available agent teams.

### Synopsis

```bash
autopm team list [options]
```

### Description

Lists all available agent teams defined in `.claude/teams.json`.

### Options

| Option | Description |
|--------|-------------|
| `--verbose` | Show agents in each team |
| `--json` | Output as JSON |

### Examples

**List teams:**
```bash
autopm team list
```

Output:
```
Available Teams:

minimal (7 agents)
  Core agents for basic operations

frontend (15 agents)
  Frontend development team

backend (15 agents)
  Backend development team

fullstack (30 agents)
  Full-stack development team

devops (25 agents)
  DevOps and infrastructure team

database (12 agents)
  Database specialists

cloud (20 agents)
  Cloud architecture team
```

**List with agents:**
```bash
autopm team list --verbose
```

Output:
```
fullstack (30 agents):
  Description: Full-stack development team
  Inherits: base
  Agents:
    Core (7):
    - agent-manager
    - code-analyzer
    - file-analyzer
    - test-runner
    - parallel-worker
    - mcp-manager
    - documentation-manager

    Languages (6):
    - python-backend-engineer
    - nodejs-backend-engineer
    - javascript-frontend-engineer
    - bash-scripting-expert
    - go-backend-engineer
    - rust-systems-engineer

    Frameworks (8):
    - react-frontend-engineer
    - react-ui-expert
    - tailwindcss-expert
    - vue-frontend-engineer
    - e2e-test-engineer
    - frontend-testing-engineer
    - backend-testing-engineer
    - ux-design-expert

    [... and more]
```

**JSON output:**
```bash
autopm team list --json
```

---

## autopm team load

Load agent team configuration.

### Synopsis

```bash
autopm team load <team-name>
```

### Description

Loads an agent team by activating specified agents in Claude Code configuration.

**What it does:**
1. Reads team definition from `.claude/teams.json`
2. Activates specified agents
3. Updates `.claude-code/config.json`
4. Includes inherited agents from base teams

**Note:** You need to reload Claude Code for changes to take effect.

### Available Teams

#### minimal
- **Agents:** 7 (core only)
- **Best for:** Small projects, learning
- **Includes:** Core agents

#### frontend
- **Agents:** 15
- **Best for:** Frontend development
- **Includes:** Core + JavaScript/TypeScript + React + UI frameworks

#### backend
- **Agents:** 15
- **Best for:** Backend development
- **Includes:** Core + Python/Node.js + Databases + Testing

#### fullstack
- **Agents:** 30
- **Best for:** Most projects (RECOMMENDED)
- **Includes:** Core + All languages + All frameworks + Databases + Testing

#### devops
- **Agents:** 25
- **Best for:** Infrastructure, deployments
- **Includes:** Core + Docker + Kubernetes + Cloud (AWS/Azure/GCP) + CI/CD

#### database
- **Agents:** 12
- **Best for:** Database-focused projects
- **Includes:** Core + All database agents + Backend

#### cloud
- **Agents:** 20
- **Best for:** Cloud infrastructure
- **Includes:** Core + All cloud agents + Terraform + Kubernetes

### Examples

**Load fullstack team (recommended):**
```bash
autopm team load fullstack
```

Output:
```
✅ Loaded team: fullstack
   Agents activated: 30
   - Core agents: 7
   - Language agents: 6
   - Framework agents: 8
   - Cloud agents: 7
   - DevOps agents: 6
   - Database agents: 5

⚠️  Note: Reload Claude Code for changes to take effect
```

**Load frontend team:**
```bash
autopm team load frontend
```

**Load devops team:**
```bash
autopm team load devops
```

### Team Inheritance

Teams can inherit from other teams:

```json
{
  "fullstack": {
    "inherits": ["base", "frontend", "backend"],
    "agents": [
      "additional-agent.md"
    ]
  }
}
```

**Result:** fullstack = base + frontend + backend + additional agents

---

## autopm team show

Show currently loaded team and agents.

### Synopsis

```bash
autopm team show [options]
```

### Description

Displays the currently active team and its agents.

### Options

| Option | Description |
|--------|-------------|
| `--agents` | Show only agent list |
| `--json` | Output as JSON |

### Examples

**Show current team:**
```bash
autopm team show
```

Output:
```
Current Team: fullstack

Active Agents (30):

Core Agents (7):
  - agent-manager
  - code-analyzer
  - file-analyzer
  - test-runner
  - parallel-worker
  - mcp-manager
  - documentation-manager

Language Agents (6):
  - python-backend-engineer
  - nodejs-backend-engineer
  - javascript-frontend-engineer
  - bash-scripting-expert
  - go-backend-engineer
  - rust-systems-engineer

Framework Agents (8):
  - react-frontend-engineer
  - react-ui-expert
  - tailwindcss-expert
  - vue-frontend-engineer
  - e2e-test-engineer
  - frontend-testing-engineer
  - backend-testing-engineer
  - ux-design-expert

Cloud Agents (7):
  - aws-cloud-architect
  - azure-cloud-architect
  - gcp-cloud-architect
  - terraform-infrastructure-expert
  - pulumi-infrastructure-expert
  - cloudflare-edge-expert
  - observability-engineer

DevOps Agents (6):
  - docker-containerization-expert
  - kubernetes-orchestrator
  - github-operations-specialist
  - gitlab-cicd-expert
  - jenkins-automation-expert
  - security-engineer

Database Agents (5):
  - postgresql-expert
  - mongodb-expert
  - redis-cache-expert
  - mysql-expert
  - database-migration-expert
```

**Show only agents:**
```bash
autopm team show --agents
```

**JSON output:**
```bash
autopm team show --json
```

---

## autopm team create

Create custom agent team.

### Synopsis

```bash
autopm team create <name> [options]
```

### Description

Creates a custom agent team with specified agents.

### Options

| Option | Description |
|--------|-------------|
| `--agents <list>` | Comma-separated agent list |
| `--inherits <team>` | Inherit from existing team |
| `--description <text>` | Team description |

### Examples

**Create custom team from scratch:**
```bash
autopm team create my-team \
  --agents "python-backend-engineer,react-frontend-engineer,postgresql-expert" \
  --description "My custom development team"
```

**Create team inheriting from fullstack:**
```bash
autopm team create my-team \
  --inherits fullstack \
  --agents "custom-agent" \
  --description "Fullstack + custom agent"
```

**Create specialized team:**
```bash
autopm team create data-science \
  --agents "python-backend-engineer,postgresql-expert,mongodb-expert" \
  --description "Data science team"
```

### Agent Names

Use agent file names without `.md` extension:

```bash
# Correct
--agents "python-backend-engineer,react-frontend-engineer"

# Incorrect
--agents "python-backend-engineer.md,react-frontend-engineer.md"
```

### Team Definition

Created in `.claude/teams.json`:

```json
{
  "my-team": {
    "description": "My custom development team",
    "inherits": [],
    "agents": [
      "python-backend-engineer.md",
      "react-frontend-engineer.md",
      "postgresql-expert.md"
    ]
  }
}
```

---

## autopm team edit

Edit existing team configuration.

### Synopsis

```bash
autopm team edit <name> [options]
```

### Description

Edits an existing agent team.

### Options

| Option | Description |
|--------|-------------|
| `--add <agents>` | Add agents to team |
| `--remove <agents>` | Remove agents from team |
| `--set-agents <list>` | Replace all agents |
| `--description <text>` | Update description |

### Examples

**Add agents to team:**
```bash
autopm team edit my-team \
  --add "docker-containerization-expert,kubernetes-orchestrator"
```

**Remove agents from team:**
```bash
autopm team edit my-team \
  --remove "deprecated-agent"
```

**Replace all agents:**
```bash
autopm team edit my-team \
  --set-agents "python-backend-engineer,postgresql-expert"
```

**Update description:**
```bash
autopm team edit my-team \
  --description "Updated team description"
```

---

## autopm team delete

Delete custom team.

### Synopsis

```bash
autopm team delete <name> [options]
```

### Description

Deletes a custom agent team.

### Options

| Option | Description |
|--------|-------------|
| `--force` | Skip confirmation prompt |

### Examples

**Delete team:**
```bash
autopm team delete my-team
```

Prompts:
```
Are you sure you want to delete team 'my-team'? (y/N):
```

**Force delete:**
```bash
autopm team delete my-team --force
```

### Protection

Cannot delete built-in teams:
- minimal
- frontend
- backend
- fullstack
- devops
- database
- cloud

---

## autopm team export

Export team configuration.

### Synopsis

```bash
autopm team export <name> <file>
```

### Description

Exports team configuration to a file for sharing or backup.

### Examples

**Export team:**
```bash
autopm team export fullstack fullstack-team.json
```

**Export all teams:**
```bash
autopm team export --all teams-backup.json
```

---

## autopm team import

Import team configuration.

### Synopsis

```bash
autopm team import <file> [options]
```

### Description

Imports team configuration from a file.

### Options

| Option | Description |
|--------|-------------|
| `--merge` | Merge with existing teams |
| `--force` | Overwrite existing teams |

### Examples

**Import team:**
```bash
autopm team import fullstack-team.json
```

**Merge with existing:**
```bash
autopm team import fullstack-team.json --merge
```

---

## Team Configuration File

### Location

`.claude/teams.json`

### Format

```json
{
  "team-name": {
    "description": "Team description",
    "inherits": ["base-team"],
    "agents": [
      "agent-file-1.md",
      "agent-file-2.md"
    ]
  }
}
```

### Complete Example

```json
{
  "minimal": {
    "description": "Core agents only",
    "inherits": [],
    "agents": [
      "agent-manager.md",
      "code-analyzer.md",
      "file-analyzer.md",
      "test-runner.md",
      "parallel-worker.md",
      "mcp-manager.md",
      "documentation-manager.md"
    ]
  },

  "fullstack": {
    "description": "Full-stack development team",
    "inherits": ["minimal"],
    "agents": [
      "python-backend-engineer.md",
      "nodejs-backend-engineer.md",
      "javascript-frontend-engineer.md",
      "react-frontend-engineer.md",
      "react-ui-expert.md",
      "tailwindcss-expert.md",
      "postgresql-expert.md",
      "mongodb-expert.md",
      "redis-cache-expert.md",
      "docker-containerization-expert.md",
      "e2e-test-engineer.md",
      "frontend-testing-engineer.md",
      "backend-testing-engineer.md"
    ]
  },

  "my-custom-team": {
    "description": "My specialized team",
    "inherits": ["fullstack"],
    "agents": [
      "custom-agent.md"
    ]
  }
}
```

---

## Common Workflows

### Quick Team Switching

```bash
# Frontend work
autopm team load frontend

# Backend work
autopm team load backend

# Infrastructure work
autopm team load devops

# Full-stack development
autopm team load fullstack
```

### Creating Specialized Team

```bash
# 1. Create team
autopm team create api-team \
  --inherits backend \
  --agents "aws-cloud-architect,terraform-infrastructure-expert" \
  --description "API development with AWS"

# 2. Load team
autopm team load api-team

# 3. Reload Claude Code
# (Close and reopen Claude Code)
```

### Managing Multiple Projects

```bash
# Project 1: Frontend
cd project1
autopm team load frontend

# Project 2: Backend
cd project2
autopm team load backend

# Project 3: Full-stack
cd project3
autopm team load fullstack
```

### Backup and Share

```bash
# Export custom teams
autopm team export my-team my-team.json

# Share with team
# (Send my-team.json file)

# Import on another machine
autopm team import my-team.json
```

---

## Team Selection Guide

### By Project Type

**Frontend Only:**
```bash
autopm team load frontend
# Includes: React, Vue, UI frameworks, testing
```

**Backend Only:**
```bash
autopm team load backend
# Includes: Python, Node.js, databases, testing
```

**Full-Stack:**
```bash
autopm team load fullstack
# Includes: Frontend + Backend + Testing
```

**Infrastructure:**
```bash
autopm team load devops
# Includes: Docker, K8s, Cloud, CI/CD
```

### By Technology Stack

**Python + FastAPI + PostgreSQL:**
```bash
autopm team create python-api \
  --agents "python-backend-engineer,postgresql-expert,backend-testing-engineer,docker-containerization-expert"
```

**React + TypeScript + Tailwind:**
```bash
autopm team create react-app \
  --agents "react-frontend-engineer,javascript-frontend-engineer,tailwindcss-expert,e2e-test-engineer"
```

**MERN Stack:**
```bash
autopm team create mern \
  --agents "nodejs-backend-engineer,react-frontend-engineer,mongodb-expert,e2e-test-engineer"
```

**Cloud Infrastructure:**
```bash
autopm team load cloud
# Includes: AWS, Azure, GCP, Terraform, K8s
```

### By Team Size

**Solo Developer:**
```bash
autopm team load fullstack
# Get all capabilities
```

**Small Team (2-5):**
```bash
# Specialize per developer
autopm team load frontend  # Developer 1
autopm team load backend   # Developer 2
autopm team load devops    # Developer 3
```

**Large Team (5+):**
```bash
# Create specialized teams
autopm team create frontend-ui --agents "..."
autopm team create backend-api --agents "..."
autopm team create infrastructure --agents "..."
```

---

## Related Documentation

- [Agent Registry](../agents/registry.md) - All available agents
- [Team Management Guide](../core-concepts/team-management.md)
- [Configuration Commands](config.md)
- [Quick Start](../getting-started/quick-start.md)
