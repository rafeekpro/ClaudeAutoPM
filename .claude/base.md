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

## Available Maintenance Agents

- **registry-manager** - Manage agent registry
- **installer-tester** - Test installation scenarios
- **optimization-analyzer** - Find optimization opportunities

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