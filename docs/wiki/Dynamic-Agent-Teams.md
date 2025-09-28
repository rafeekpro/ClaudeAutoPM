# Dynamic Agent Teams

ClaudeAutoPM supports **dynamic agent teams** that can be switched based on your current development context. This allows you to load specialized agents for specific tasks, improving performance and reducing context overhead.

## What Are Agent Teams?

Agent teams are predefined collections of specialized AI agents optimized for specific development contexts:

- **base**: Core agents available in all teams
- **devops**: Docker, Kubernetes, CI/CD, and infrastructure agents
- **frontend**: React, JavaScript, UI/UX, and testing agents
- **python_backend**: Python, FastAPI, Flask, and database agents
- **fullstack**: Combined frontend and backend capabilities

## Team Configuration

Teams are defined in `.claude/teams.json` with support for inheritance:

```json
{
  "base": {
    "description": "Core agents available in all teams.",
    "agents": [
      "code-analyzer.md",
      "file-analyzer.md",
      "test-runner.md",
      "agent-manager.md"
    ]
  },
  "devops": {
    "description": "Team for CI/CD, containerization, and infrastructure tasks.",
    "inherits": ["base"],
    "agents": [
      "docker-containerization-expert.md",
      "kubernetes-orchestrator.md",
      "github-operations-specialist.md",
      "terraform-infrastructure-expert.md"
    ]
  },
  "fullstack": {
    "description": "Combined frontend and backend development team.",
    "inherits": ["frontend", "python_backend"],
    "agents": []
  }
}
```

## CLI Commands

### List Available Teams

```bash
autopm team list
```

Output:
```
Available teams:
  base         - Core agents available in all teams
  devops       - Team for CI/CD, containerization, and infrastructure
  frontend     - Team specializing in React, JavaScript, and UI
  python_backend - Team specializing in Python backend development
  fullstack    - Combined frontend and backend development
```

### Check Current Team

```bash
autopm team current
```

Output:
```
Current active team: frontend
```

### Load a Team

```bash
autopm team load devops
```

Output:
```
✅ Team 'devops' loaded successfully!
📋 Active agents:
  - docker-containerization-expert.md
  - kubernetes-orchestrator.md
  - github-operations-specialist.md
  - terraform-infrastructure-expert.md
  - code-analyzer.md (inherited from base)
  - file-analyzer.md (inherited from base)
  - test-runner.md (inherited from base)
  - agent-manager.md (inherited from base)
```

## Manual Team Switching

Switch teams based on your current work context:

```bash
# Load DevOps team for CI/CD work
autopm team load devops

# Switch to frontend team for React development
autopm team load frontend

# Use fullstack team for complete features
autopm team load fullstack
```

## 🚀 Automatic Team Switching

ClaudeAutoPM can automatically switch teams based on your Git branch name!

### Setup (One-time)

```bash
# Enable automatic team switching
bash scripts/setup-githooks.sh
```

This configures Git to use the `.githooks` directory for hooks.

### How It Works

When you switch branches, the post-checkout hook automatically detects team keywords and loads the appropriate team:

```bash
# Branch pattern: type/team/description
git checkout -b feature/devops/add-ci      # Auto-loads 'devops' team
git checkout -b fix/frontend/button-style  # Auto-loads 'frontend' team
git checkout -b feat/backend/new-api       # Auto-loads 'python_backend' team
```

### Supported Patterns

1. **Standard pattern**: `type/team/description`
   - Types: `feature`, `fix`, `feat`, `chore`
   - Teams: `devops`, `frontend`, `backend`, `python_backend`, `fullstack`

2. **Alternative patterns**:
   - `team-*` (e.g., `devops-pipeline`, `frontend-ui`)
   - `*-team` (e.g., `add-frontend`, `fix-backend`)

### Keyword Aliases

The system recognizes common aliases:
- `backend` → `python_backend`
- `python` → `python_backend`
- `react`, `vue`, `angular`, `ui`, `ux` → `frontend`
- `docker`, `k8s`, `kubernetes`, `ci`, `cd`, `cicd`, `pipeline` → `devops`
- `full`, `complete` → `fullstack`

### Example Workflow

```bash
# Start working on a DevOps feature
git checkout -b feature/devops/kubernetes-setup
# 🔄 ClaudeAutoPM: Switching to 'devops' team...
# ✅ Team successfully switched to 'devops'

# Switch to frontend bug fix
git checkout -b fix/frontend/navbar-responsive
# 🔄 ClaudeAutoPM: Switching to 'frontend' team...
# ✅ Team successfully switched to 'frontend'

# Work on backend API
git checkout -b feat/backend/user-auth
# 🔄 ClaudeAutoPM: Switching to 'python_backend' team...
# ✅ Team successfully switched to 'python_backend'
```

### Benefits

1. **Context Preservation**: Automatically loads relevant agents for your current task
2. **Reduced Manual Work**: No need to remember to switch teams
3. **Team Consistency**: Ensures everyone on the same branch uses the same agents
4. **Workflow Integration**: Seamlessly integrates with Git workflow

## Team Inheritance

Teams can inherit agents from other teams, reducing duplication:

```json
{
  "frontend": {
    "inherits": ["base"],
    "agents": ["react-ui-expert.md", "javascript-frontend-engineer.md"]
  },
  "fullstack": {
    "inherits": ["frontend", "python_backend"],
    "agents": []
  }
}
```

In this example:
- `frontend` inherits all agents from `base` plus its own agents
- `fullstack` inherits from both `frontend` and `python_backend`, getting all their agents

## Technical Details

### How Teams Are Applied

When a team is loaded:
1. The system resolves all agents (including inherited ones)
2. Updates `CLAUDE.md` between the `<!-- AGENTS_START -->` and `<!-- AGENTS_END -->` markers
3. Saves the current team to `.claude/active_team.txt`

### File Locations

- **Team Configuration**: `.claude/teams.json`
- **Active Team**: `.claude/active_team.txt`
- **Agent Files**: `.claude/agents/` or `autopm/.claude/agents/`
- **Git Hook**: `.githooks/post-checkout`

## Creating Custom Teams

To create a custom team, edit `.claude/teams.json`:

```json
{
  "data_science": {
    "description": "Team for data science and ML tasks",
    "inherits": ["python_backend"],
    "agents": [
      "jupyter-notebook-expert.md",
      "pandas-data-expert.md",
      "scikit-learn-ml-expert.md"
    ]
  }
}
```

Then load it:
```bash
autopm team load data_science
```

## Troubleshooting

### Team Not Loading

1. Check if teams.json exists:
```bash
ls -la .claude/teams.json
```

2. Validate JSON syntax:
```bash
cat .claude/teams.json | jq .
```

3. Check for missing agent files (warnings are shown but don't block operation)

### Automatic Switching Not Working

1. Verify Git hooks are configured:
```bash
git config --get core.hooksPath
# Should output: .githooks
```

2. Check if hook is executable:
```bash
ls -la .githooks/post-checkout
# Should have execute permissions (x)
```

3. Re-run setup if needed:
```bash
bash scripts/setup-githooks.sh
```

## Best Practices

1. **Start with base team** for general development
2. **Use specialized teams** when working on specific areas
3. **Name branches clearly** to leverage automatic switching
4. **Create custom teams** for recurring project needs
5. **Keep teams focused** - avoid loading unnecessary agents

## Performance Impact

Using specialized teams reduces:
- Context token usage by ~40-60%
- Agent initialization time
- Memory footprint
- API costs

## Integration with CI/CD

Teams can be automatically loaded in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Load DevOps team
  run: autopm team load devops

- name: Run deployment agents
  run: autopm deploy --team-context
```

## Future Enhancements

Planned features:
- Team templates for common project types
- Automatic team suggestion based on file changes
- Team-specific configuration overrides
- Team usage analytics
- Cloud-based team sharing