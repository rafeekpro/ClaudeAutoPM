# ClaudeAutoPM Development Project

This is the development repository for the ClaudeAutoPM framework itself.

## Project Context

You are working on ClaudeAutoPM, a framework that helps other projects integrate with Claude. This project uses its own capabilities for self-maintenance.

## Self-Maintenance Mode

This project is configured to maintain itself using its own agents and tools. When working on this project:

1. **Use project maintenance agents** from `.claude/agents/project-maintenance/`
2. **Run maintenance commands** like `pm validate`, `pm optimize`
3. **Follow self-maintenance rules** in `.claude/rules/self-maintenance.md`
4. **Apply optimization strategies** from `.claude/strategies/`

## Framework Agents for Self-Maintenance

**IMPORTANT**: Use these agents from `autopm/.claude/agents/` for maintenance tasks:

### Core Maintenance Agents
- **agent-manager** (`autopm/.claude/agents/core/agent-manager.md`) - Create and manage agents
- **code-analyzer** (`autopm/.claude/agents/core/code-analyzer.md`) - Review code changes for bugs
- **test-runner** (`autopm/.claude/agents/core/test-runner.md`) - Execute and analyze tests
- **file-analyzer** (`autopm/.claude/agents/core/file-analyzer.md`) - Summarize large files

### DevOps Agents
- **github-operations-specialist** (`autopm/.claude/agents/devops/github-operations-specialist.md`) - GitHub Actions, releases
- **docker-containerization-expert** (`autopm/.claude/agents/devops/docker-containerization-expert.md`) - Container management

### Framework Testing
- **e2e-test-engineer** (`autopm/.claude/agents/frameworks/e2e-test-engineer.md`) - End-to-end testing

## Agent Usage Examples

```markdown
# When adding new agents
@agent-manager create a new agent for Redis optimization

# When reviewing changes
@code-analyzer review the recent optimization changes for potential issues

# When running tests
@test-runner execute all installation tests and analyze failures

# When preparing releases
@github-operations-specialist prepare release v1.0.8
```

## Quick Commands

```bash
# Validate project
pm validate

# Run optimization analysis
pm optimize

# Prepare release
pm release

# Check health
npm run pm:health
```

## Development Workflow

1. **Before changes**: Run `pm validate` to ensure clean state
2. **During development**: Use appropriate agents for tasks
3. **Before commit**: Run tests with `npm test`
4. **Before release**: Run `pm release` workflow

## Project Structure

```
AUTOPM/
├── .claude/                 # Project's own Claude configuration
│   ├── agents/             # Maintenance agents
│   ├── commands/           # PM commands
│   ├── rules/              # Self-maintenance rules
│   └── strategies/         # Optimization strategies
├── autopm/                 # Framework source (distributed)
│   └── .claude/           # Framework resources
├── install/               # Installation scripts
├── test/                  # Test suites
└── docs/                  # Documentation
```

## Current Status

- **Version**: 1.0.7
- **Agents**: ~35 (Phase 1 optimization complete)
- **Context Efficiency**: 60%
- **Test Coverage**: 95%

## Optimization Progress

### ✅ Phase 1 Complete
- Consolidated UI frameworks (4→1)
- Consolidated Python backends (3→1)
- Consolidated Docker agents (3→1)
- Consolidated E2E testing (2→1)

### 🔄 Phase 2 Pending
- Cloud architect consolidation
- Database expert consolidation
- Further optimizations

## Key Principles

1. **Dogfood** - Use own capabilities
2. **Automate** - Minimize manual work
3. **Validate** - Test everything
4. **Document** - Keep docs current
5. **Optimize** - Continuously improve

## Emergency Contacts

- GitHub: https://github.com/rafeekpro/ClaudeAutoPM
- Issues: https://github.com/rafeekpro/ClaudeAutoPM/issues

Remember: This project maintains itself using its own tools!