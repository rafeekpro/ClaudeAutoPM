---
title: Architecture
description: ClaudeAutoPM project architecture, directory structure, and system design
---

# Project Architecture

ClaudeAutoPM follows a modular architecture designed for extensibility, maintainability, and clear separation of concerns. This document explains the project structure and key architectural decisions.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         ClaudeAutoPM                            │
├─────────────────────────────────────────────────────────────────┤
│  CLI Layer (bin/)                                               │
│  ├── autopm.js (main entry point)                               │
│  └── Command routing via yargs                                  │
├─────────────────────────────────────────────────────────────────┤
│  Service Layer (lib/services/)                                  │
│  ├── AgentService      │ PRDService                             │
│  ├── ContextService    │ TaskService                            │
│  ├── EpicService       │ UtilityService                         │
│  ├── IssueService      │ WorkflowService                        │
│  └── ServiceFactory (dependency injection)                      │
├─────────────────────────────────────────────────────────────────┤
│  Plugin System (lib/plugins/)                                   │
│  └── PluginManager (discovery, loading, installation)           │
├─────────────────────────────────────────────────────────────────┤
│  Provider Layer (lib/providers/)                                │
│  ├── GitHubProvider (issues, PRs, workflows)                    │
│  └── AzureDevOpsProvider (work items, boards)                   │
├─────────────────────────────────────────────────────────────────┤
│  Packages (packages/)                                           │
│  ├── plugin-core       │ plugin-pm                              │
│  ├── plugin-languages  │ plugin-frameworks                      │
│  ├── plugin-devops     │ plugin-cloud                           │
│  └── ... additional plugins                                     │
├─────────────────────────────────────────────────────────────────┤
│  Framework Resources (autopm/.claude/)                          │
│  ├── agents/           │ commands/                              │
│  ├── rules/            │ hooks/                                 │
│  ├── scripts/          │ templates/                             │
│  └── mcp/              │ examples/                              │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

### `/lib` - Core Library

The core library contains all business logic and system functionality.

```
lib/
├── cli/
│   └── commands/           # CLI command implementations
│       ├── agent.js        # Agent-related commands
│       ├── config.js       # Configuration commands
│       ├── context.js      # Context management
│       ├── epic.js         # Epic management
│       ├── issue.js        # Issue management
│       ├── pm.js           # Project management
│       ├── prd.js          # PRD operations
│       └── task.js         # Task operations
├── plugins/
│   └── PluginManager.js    # Plugin lifecycle management
├── providers/
│   ├── GitHubProvider.js   # GitHub API integration
│   └── AzureDevOpsProvider.js # Azure DevOps API
├── services/
│   ├── AgentService.js     # Agent operations
│   ├── ContextService.js   # Context management
│   ├── EpicService.js      # Epic operations
│   ├── IssueService.js     # Issue operations
│   ├── PRDService.js       # PRD operations
│   ├── TaskService.js      # Task operations
│   ├── UtilityService.js   # Helper utilities
│   ├── WorkflowService.js  # Workflow orchestration
│   └── interfaces.js       # Service interfaces
├── config/
│   └── ConfigManager.js    # Configuration management
├── utils/
│   ├── CircuitBreaker.js   # Fault tolerance
│   ├── Encryption.js       # Security utilities
│   ├── RateLimiter.js      # API rate limiting
│   └── ServiceFactory.js   # Dependency injection
├── ai-providers/
│   ├── AbstractAIProvider.js  # Base AI provider
│   ├── ClaudeProvider.js      # Claude API integration
│   └── TemplateProvider.js    # Template-based responses
└── *.js                    # Additional utilities
```

### `/packages` - Plugin Packages

ClaudeAutoPM uses npm workspaces for modular plugin architecture.

```
packages/
├── plugin-core/            # Core framework functionality
│   ├── agents/             # Core agents
│   │   └── core/           # agent-manager, code-analyzer, etc.
│   ├── commands/           # Core commands
│   ├── rules/              # Framework rules
│   ├── hooks/              # Enforcement hooks
│   ├── scripts/            # Utility scripts
│   └── plugin.json         # Plugin manifest
├── plugin-pm/              # Project management features
│   ├── agents/
│   ├── commands/
│   └── plugin.json
├── plugin-languages/       # Language-specific agents
│   ├── agents/
│   │   └── languages/      # nodejs, python, bash experts
│   └── plugin.json
├── plugin-frameworks/      # Framework specialists
├── plugin-devops/          # DevOps and CI/CD
├── plugin-cloud/           # Cloud platform agents
├── plugin-databases/       # Database specialists
├── plugin-testing/         # Testing specialists
├── plugin-data/            # Data engineering
├── plugin-ai/              # AI/ML integration
└── plugin-ml/              # Machine learning
```

### `/autopm` - Framework Resources

Resources copied to user projects during installation.

```
autopm/
└── .claude/
    ├── agents/              # Agent definitions
    │   ├── core/            # Essential agents
    │   ├── languages/       # Language experts
    │   ├── frameworks/      # Framework specialists
    │   ├── cloud/           # Cloud architects
    │   ├── devops/          # DevOps specialists
    │   ├── databases/       # Database experts
    │   ├── data/            # Data engineering
    │   ├── testing/         # Testing specialists
    │   ├── decision-matrices/ # Decision tools
    │   └── AGENT-REGISTRY.md  # Agent catalog
    ├── commands/            # Command definitions
    │   ├── config/          # Configuration commands
    │   ├── context/         # Context commands
    │   └── mcp/             # MCP commands
    ├── rules/               # Development rules
    │   ├── tdd.enforcement.md
    │   ├── naming-conventions.md
    │   └── ...
    ├── hooks/               # Enforcement hooks
    ├── scripts/             # Utility scripts
    │   └── lib/             # Script libraries
    ├── templates/           # File templates
    │   ├── claude-templates/
    │   ├── prds/
    │   └── strategies-templates/
    ├── mcp/                 # MCP server configs
    ├── examples/            # Usage examples
    ├── guides/              # User guides
    ├── quick-ref/           # Quick reference docs
    └── providers/           # Provider configs
```

### `/.claude` - Project Maintenance

The project's own Claude configuration for self-maintenance.

```
.claude/
├── agents/                  # Project-specific agents
│   ├── core/                # Maintenance agents
│   └── project-maintenance/ # Custom agents
├── commands/                # Maintenance commands
├── rules/                   # Development rules
├── hooks/                   # Pre-commit hooks
└── DEVELOPMENT-STANDARDS.md # Standards reference
```

## Key Architectural Components

### Plugin Manager

The `PluginManager` class handles the complete plugin lifecycle:

```javascript
// lib/plugins/PluginManager.js
class PluginManager extends EventEmitter {
  constructor(options = {}) {
    this.plugins = new Map();    // Discovered plugins
    this.agents = new Map();     // Registered agents
    this.hooks = new Map();      // Plugin hooks
  }

  async initialize() {
    await this.discoverPlugins();  // Find plugins in node_modules
    await this.validatePlugins();  // Check compatibility
  }

  async loadPlugin(pluginName) {
    // Load and register plugin agents
  }

  async installPlugin(pluginName) {
    // Install agents, commands, rules, hooks, scripts
  }
}
```

### Service Layer

Services encapsulate business logic with consistent interfaces:

```javascript
// lib/services/interfaces.js
class IEpicService {
  async list(options) { }
  async show(id) { }
  async create(data) { }
  async update(id, data) { }
  async sync(id) { }
}
```

### Provider Pattern

Providers abstract external service integrations:

```javascript
// lib/providers/GitHubProvider.js
class GitHubProvider {
  constructor(config) {
    this.octokit = new Octokit({ auth: config.token });
  }

  async getIssue(owner, repo, number) { }
  async createIssue(owner, repo, data) { }
  async updateIssue(owner, repo, number, data) { }
}
```

## Plugin Schema (v2.0)

Plugins use a standardized JSON schema:

```json
{
  "name": "@claudeautopm/plugin-core",
  "version": "2.0.0",
  "displayName": "Core Framework",
  "description": "Core framework functionality",
  "schemaVersion": "2.0",
  "metadata": {
    "category": "Core Framework",
    "author": "ClaudeAutoPM Team",
    "keywords": ["core", "framework", "agents"],
    "required": true
  },
  "agents": [
    {
      "name": "agent-manager",
      "file": "agents/core/agent-manager.md",
      "category": "core",
      "description": "Agent lifecycle management",
      "version": "1.0.0",
      "tags": ["core", "agents"]
    }
  ],
  "commands": [...],
  "rules": [...],
  "hooks": [...],
  "scripts": [...],
  "dependencies": {
    "required": [],
    "optional": []
  },
  "features": {
    "tdd_enforcement": { "enabled": true }
  },
  "compatibleWith": ">=3.0.0"
}
```

## Agent Architecture

Agents follow a standardized structure with frontmatter and markdown:

```markdown
---
name: code-analyzer
description: Code analysis and bug detection
tools: Glob, Grep, LS, Read, Task, Agent
model: inherit
color: blue
---

# Code Analyzer

You are a senior code analyst...

## TDD Methodology (MANDATORY)
...

## Documentation Queries
- `mcp://context7/analysis/patterns`

## Core Expertise
...

## Self-Verification Protocol
...
```

## Command Architecture

Commands use a template structure:

```markdown
---
allowed-tools: Bash, Read, Write, LS
---

# Command Name

## Usage
/namespace:command [arguments]

## Quick Check
[Prerequisites validation]

## Instructions
[Step-by-step execution]

## Output
[Expected output format]
```

## Data Flow

### Installation Flow

```
User runs: autopm install
    │
    ▼
bin/autopm.js (CLI entry)
    │
    ▼
PluginManager.initialize()
    │
    ├─► discoverPlugins() ─► Scan node_modules/@claudeautopm/
    │
    ├─► validatePlugins() ─► Check version compatibility
    │
    ▼
PluginManager.installPlugin()
    │
    ├─► installAgents()   ─► Copy to .claude/agents/
    ├─► installCommands() ─► Copy to .claude/commands/
    ├─► installRules()    ─► Copy to .claude/rules/
    ├─► installHooks()    ─► Copy to .claude/hooks/
    └─► installScripts()  ─► Copy to scripts/
```

### Command Execution Flow

```
User types: /pm:epic-list
    │
    ▼
Claude reads: .claude/commands/pm/epic-list.md
    │
    ▼
Validates prerequisites (Quick Check)
    │
    ▼
Executes instructions using allowed-tools
    │
    ▼
Formats output per command specification
```

### Agent Delegation Flow

```
User requests: "Analyze this code for bugs"
    │
    ▼
Claude identifies: Use @code-analyzer agent
    │
    ▼
Invokes via Task tool with agent specification
    │
    ▼
Agent executes with permitted tools
    │
    ▼
Returns summarized results (<20% of context)
```

## Design Decisions

### Why npm Workspaces?

- Modular plugin architecture
- Independent versioning
- Selective installation
- Clear dependency boundaries

### Why Markdown for Agents/Commands?

- Human-readable specifications
- Easy to modify and extend
- Version control friendly
- No compilation required

### Why Event Emitters in PluginManager?

- Decoupled logging and monitoring
- Easy to add telemetry
- Non-blocking operations
- Flexible event handling

### Why Service Layer Pattern?

- Testable business logic
- Provider abstraction
- Consistent interfaces
- Dependency injection support

## Security Considerations

1. **Token Management**: API tokens stored in environment variables
2. **Input Validation**: All user inputs validated before processing
3. **Rate Limiting**: Built-in rate limiter for API calls
4. **Circuit Breaker**: Fault tolerance for external services

## Performance Considerations

1. **Context Efficiency**: Agents return <20% of processed data
2. **Lazy Loading**: Plugins loaded on demand
3. **Caching**: Provider responses cached where appropriate
4. **Parallel Execution**: Agents can work in parallel streams

## Next Steps

- [Plugin Development](./plugin-development.md) - Create your own plugins
- [Agent Development](./agent-development.md) - Build specialized agents
- [Command Development](./command-development.md) - Add new commands
