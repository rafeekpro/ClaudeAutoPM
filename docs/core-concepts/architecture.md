# Architecture Overview

Understanding ClaudeAutoPM's architecture helps you use it effectively and extend it for your needs.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        ClaudeAutoPM                              │
│                    (Installed in .claude/)                       │
└─────────────────────────────────────────────────────────────────┘
                                ▲
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌──────────────┐      ┌──────────────┐       ┌──────────────┐
│  CLI Layer   │      │ Claude Code  │       │   Provider   │
│              │      │    Agent     │       │  Integration │
│  (autopm)    │      │   Execution  │       │              │
└──────────────┘      └──────────────┘       └──────────────┘
        │                       │                       │
        └───────────────────────┼───────────────────────┘
                                │
                                ▼
        ┌───────────────────────────────────────────┐
        │         Execution Engine                   │
        │  - Sequential / Adaptive / Hybrid         │
        │  - Context Management                      │
        │  - Agent Coordination                      │
        └───────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                │               │               │
                ▼               ▼               ▼
        ┌──────────┐    ┌──────────┐   ┌──────────┐
        │  Agents  │    │   MCP    │   │   Git    │
        │ (39)     │    │ Servers  │   │ Workflow │
        └──────────┘    └──────────┘   └──────────┘
```

---

## Core Components

### 1. CLI Layer (autopm)

The command-line interface for deterministic operations.

**Location:** `bin/autopm.js`

**Responsibilities:**
- Installation and setup
- Configuration management
- Team management
- MCP server management
- Project validation

**Key Commands:**
```bash
autopm install          # Project setup
autopm config           # Configuration
autopm team             # Team management
autopm mcp              # MCP management
autopm validate         # Validation
```

**Implementation:**
- Built with [yargs](https://yargs.js.org/)
- 109 total commands
- Modular command structure in `bin/commands/`

### 2. Agent System (Claude Code)

AI-powered agents for intelligent tasks.

**Location:** `.claude/agents/`

**Organization:**
```
.claude/agents/
├── core/              # System agents (7)
├── languages/         # Language-specific (6)
├── frameworks/        # Framework experts (8)
├── cloud/             # Cloud & infra (7)
├── devops/            # DevOps & CI/CD (6)
├── databases/         # Database experts (5)
├── decision-matrices/ # Agent selection guides
└── AGENT-REGISTRY.md  # Complete registry
```

**Agent Types:**

| Type | Count | Purpose | Example |
|------|-------|---------|---------|
| Core | 7 | System operations | agent-manager, code-analyzer |
| Language | 6 | Language-specific dev | python-backend-engineer |
| Framework | 8 | Framework expertise | react-frontend-engineer |
| Cloud | 7 | Cloud infrastructure | aws-cloud-architect |
| DevOps | 6 | CI/CD & deployment | docker-containerization-expert |
| Database | 5 | Data management | postgresql-expert |

**Total:** 39 active agents

### 3. Command System (Slash Commands)

Markdown-based commands for Claude Code.

**Location:** `.claude/commands/`

**Organization:**
```
.claude/commands/
├── pm/               # Project management (44 commands)
├── azure/            # Azure DevOps (31 commands)
├── context/          # Context management (3 commands)
├── testing/          # Test automation (2 commands)
├── mcp/              # MCP management (2 commands)
├── python/           # Python scaffolding (2 commands)
├── react/            # React scaffolding (1 command)
└── infrastructure/   # Infrastructure (2 commands)
```

**Command Format:**
```markdown
---
name: epic-decompose
description: Decompose PRD into epic with tasks
---

# Epic Decompose

Use this command to analyze a PRD and create an epic...

## Parameters
- prd_file: Path to PRD markdown file

## Process
1. Read PRD file
2. Analyze requirements
3. Break into tasks
...
```

**Total:** 109 commands

### 4. Rules Engine

Development rules and best practices.

**Location:** `.claude/rules/`

**Categories:**
- **Mandatory:** agent-mandatory.md, pipeline-mandatory.md
- **Workflows:** development-workflow.md, git-strategy.md
- **Standards:** naming-conventions.md, tdd.enforcement.md
- **Patterns:** docker-first-development.md, agent-coordination.md

**Purpose:**
- Enforce development standards
- Guide agent behavior
- Define workflows
- Set best practices

### 5. Provider Integration

Multi-provider support for project management.

**Location:** `.claude/providers/`

**Supported Providers:**

| Provider | Features | Configuration |
|----------|----------|---------------|
| **GitHub** | Issues, PRs, Actions, Projects | GITHUB_TOKEN |
| **Azure DevOps** | Work Items, Boards, Pipelines | AZURE_DEVOPS_PAT |
| **Local** | Git-only workflow | No external config |

**Implementation:**
```
.claude/providers/
├── interface.js       # Provider interface
├── router.js          # Provider routing
├── github/           # GitHub implementation
└── azure/            # Azure DevOps implementation
```

### 6. Execution Engine

Coordinates agent execution with different strategies.

**Strategies:**

#### Sequential (Safe)
```
Task 1 → Complete → Task 2 → Complete → Task 3 → Complete
```
- ✅ Safest
- ✅ Predictable
- ⚠️ Slowest
- **Use:** Learning, debugging, critical operations

#### Adaptive (Recommended)
```
Analyze dependencies → Choose strategy per task group
Simple tasks: Parallel
Complex tasks: Sequential
```
- ✅ Intelligent
- ✅ Balanced speed/safety
- ✅ Context-aware
- **Use:** Most development work

#### Hybrid (Performance)
```
Independent tasks: Parallel
Dependent tasks: Sequential with smart batching
```
- ✅ Fastest
- ✅ Maximum throughput
- ⚠️ Requires expertise
- **Use:** Experienced users, known patterns

**Configuration:**
```bash
# Set strategy
autopm config set execution.strategy adaptive

# Or in .claude/config.json
{
  "execution": {
    "strategy": "adaptive",
    "maxParallel": 3,
    "timeout": 300000
  }
}
```

### 7. MCP Integration

Model Context Protocol for external tools and documentation.

**Location:** `.claude/mcp/`

**Available Servers:**
- **context7**: Documentation for all major frameworks
- **playwright**: Browser automation
- **filesystem**: File system access
- **sqlite**: Database operations

**Configuration:** `.claude/mcp-servers.json`

**Agent Usage:**
```markdown
# In agent definition
## Documentation Access via MCP Context7

Access documentation:
- `mcp://context7/react` - React documentation
- `mcp://context7/fastapi` - FastAPI documentation
```

---

## Data Flow

### 1. CLI Command Flow

```
User runs: autopm install --preset fullstack
         ↓
CLI Parser (yargs)
         ↓
Command Handler (bin/commands/install.js)
         ↓
Installation Logic
         ↓
Copy Framework Files (.claude/)
         ↓
Generate Configuration
         ↓
Setup Environment
         ↓
Validate Installation
         ↓
Success Message
```

### 2. Slash Command Flow

```
User types: /pm:epic-decompose prd-001.md
         ↓
Claude Code Reads: .claude/commands/pm/epic-decompose.md
         ↓
Loads Instructions + Context
         ↓
Selects Agent: agent-manager or appropriate expert
         ↓
Agent Analyzes PRD
         ↓
Generates Epic Structure
         ↓
Creates epic-001.md file
         ↓
Reports to User
```

### 3. Agent Execution Flow

```
User: "Use python-backend-engineer to create FastAPI app"
         ↓
Claude Loads: .claude/agents/languages/python-backend-engineer.md
         ↓
Agent Frontmatter Parsed:
  - Tools: Bash, Edit, Write, Read, etc.
  - Model: inherit
  - Color: #3776AB
         ↓
Agent Executes with Instructions:
  - Expertise: FastAPI, async Python, SQLAlchemy
  - Best practices: Type hints, Pydantic, etc.
         ↓
Uses Tools:
  - Read existing files
  - Write new code
  - Edit configurations
  - Run tests
         ↓
Returns Results to User
```

### 4. GitHub Integration Flow

```
User: /pm:epic-sync epic-001.md
         ↓
Command Reads epic-001.md
         ↓
Parses Tasks
         ↓
Calls Provider (GitHub via .claude/providers/github/)
         ↓
For each task:
  - Create GitHub Issue
  - Set labels, assignee
  - Link to epic
         ↓
Update epic-001.md with issue numbers
         ↓
Report sync status
```

---

## File System Layout

### After Installation

```
your-project/
├── .claude/                       # ClaudeAutoPM Framework
│   ├── agents/                   # 39 AI agents
│   │   ├── core/                # System agents
│   │   ├── languages/           # Python, Node.js, etc.
│   │   ├── frameworks/          # React, FastAPI, etc.
│   │   ├── cloud/               # AWS, Azure, GCP
│   │   ├── devops/              # Docker, K8s, CI/CD
│   │   ├── databases/           # PostgreSQL, MongoDB
│   │   └── AGENT-REGISTRY.md   # Complete registry
│   │
│   ├── commands/                # 109 slash commands
│   │   ├── pm/                  # Project management
│   │   ├── azure/               # Azure DevOps
│   │   ├── testing/             # Test automation
│   │   └── ...
│   │
│   ├── rules/                   # Development rules
│   │   ├── agent-mandatory.md  # Agent usage rules
│   │   ├── agent-coordination.md
│   │   ├── development-workflow.md
│   │   └── ...
│   │
│   ├── scripts/                 # Automation scripts
│   │   ├── pm/                  # PM operations
│   │   ├── azure/               # Azure scripts
│   │   └── ...
│   │
│   ├── providers/               # Provider integrations
│   │   ├── github/             # GitHub integration
│   │   ├── azure/              # Azure DevOps
│   │   └── interface.js        # Provider interface
│   │
│   ├── templates/               # Code templates
│   │   ├── claude-templates/   # CLAUDE.md templates
│   │   ├── config-templates/   # Configuration templates
│   │   ├── issue-decomposition/# Task breakdown templates
│   │   └── strategies-templates/# Execution strategies
│   │
│   ├── mcp/                     # MCP documentation
│   │   ├── context7.md
│   │   ├── playwright-mcp.md
│   │   └── MCP-REGISTRY.md
│   │
│   ├── checklists/             # Development checklists
│   │   └── COMMIT_CHECKLIST.md
│   │
│   ├── strategies/             # Execution strategies
│   │   └── ACTIVE_STRATEGY.md
│   │
│   ├── config.json             # Main configuration
│   ├── teams.json              # Agent team definitions
│   ├── mcp-servers.json        # MCP configuration
│   ├── .env                    # Environment variables
│   └── base.md                 # Base instructions
│
├── .claude-code/              # Claude Code settings
│   └── config.json
│
├── scripts/                   # Project-level scripts
│   ├── safe-commit.sh
│   └── setup-hooks.sh
│
├── prds/                      # Product requirements (created on-demand)
├── epics/                     # Epic definitions (created on-demand)
│
└── CLAUDE.md                  # Project instructions for Claude
```

---

## Configuration System

### Hierarchy

```
1. Environment Variables (.env)
   ↓
2. Project Config (.claude/config.json)
   ↓
3. Team Config (.claude/teams.json)
   ↓
4. Strategy Config (.claude/strategies/)
   ↓
5. MCP Config (.claude/mcp-servers.json)
```

### Config Files

#### .claude/config.json
```json
{
  "provider": "github",
  "github": {
    "owner": "username",
    "repo": "repository"
  },
  "execution": {
    "strategy": "adaptive",
    "maxParallel": 3
  },
  "mcp": {
    "enabled": true,
    "servers": ["context7"]
  }
}
```

#### .claude/teams.json
```json
{
  "fullstack": {
    "description": "Full-stack development team",
    "inherits": ["base"],
    "agents": [
      "python-backend-engineer.md",
      "react-frontend-engineer.md",
      "postgresql-expert.md",
      "docker-containerization-expert.md"
    ]
  }
}
```

#### .claude/.env
```bash
GITHUB_TOKEN=ghp_xxxxx
AZURE_DEVOPS_PAT=xxxxx
OPENAI_API_KEY=sk-xxxxx  # For MCP context7
```

---

## Extension Points

### 1. Custom Agents

Create new agents in `.claude/agents/custom/`:

```markdown
---
name: my-custom-agent
description: Custom agent for specific task
tools: Bash, Edit, Write, Read
model: inherit
---

# My Custom Agent

Expertise in...
```

### 2. Custom Commands

Add commands in `.claude/commands/custom/`:

```markdown
---
name: my-command
description: Custom command
---

# My Custom Command

Instructions for Claude...
```

### 3. Custom Rules

Add rules in `.claude/rules/custom/`:

```markdown
# Custom Development Rule

When doing X, always Y...
```

### 4. Custom Hooks

Add Git hooks in `.git/hooks/`:

```bash
#!/bin/bash
# pre-commit hook
# Custom validation...
```

---

## Performance Considerations

### Context Management

ClaudeAutoPM optimizes context usage:

1. **Lazy Loading:** Agents loaded only when needed
2. **Context Pooling:** MCP servers reduce token usage
3. **Smart Chunking:** Large files analyzed in chunks
4. **Caching:** Frequent data cached locally

### Agent Coordination

```
Sequential:  Agent1 → Agent2 → Agent3        (3x time)
Adaptive:    Agent1 + Agent2 || Agent3       (1.5x time)
Hybrid:      Agent1 || Agent2 || Agent3      (1x time)
```

### Resource Usage

| Strategy | CPU | Memory | Speed | Safety |
|----------|-----|--------|-------|--------|
| Sequential | Low | Low | Slow | High |
| Adaptive | Medium | Medium | Medium | Medium |
| Hybrid | High | High | Fast | Low |

---

## Security Architecture

### Token Management

```
.env (gitignored)
  ↓
Environment Variables (runtime)
  ↓
Encrypted in Memory
  ↓
Secure Provider API Calls
```

### Permission Model

```
User Approval Required:
  - File writes outside project
  - Bash commands
  - Network requests

Auto-Approved (with --dangerously-skip-permissions):
  - Read project files
  - Write to project
  - Git operations
```

### Data Flow Security

```
Local Project Files
  ↓
ClaudeAutoPM (local processing)
  ↓
Claude API (encrypted)
  ↓
MCP Servers (authenticated)
  ↓
Provider APIs (authenticated)
```

---

## Next Steps

- [Hybrid Execution](hybrid-execution.md) - Understanding execution modes
- [Agent System](agent-system.md) - Deep dive into agents
- [Team Management](team-management.md) - Managing agent teams
- [Execution Strategies](execution-strategies.md) - Choosing the right strategy

---

## Related Documentation

- [Installation](../getting-started/installation.md)
- [CLI Reference](../cli-reference/overview.md)
- [Agent Registry](../agents/registry.md)
- [Configuration Guide](../cli-reference/config.md)
