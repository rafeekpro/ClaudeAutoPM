# Agent Triggers for ClaudeAutoPM

This file defines automatic agent triggers for common maintenance tasks.

## Automatic Agent Invocation Rules

### When Working on Agents
**Trigger**: Creating, modifying, or managing agents
**Use**: `@agent-manager` from `autopm/.claude/agents/core/agent-manager.md`

### When Reviewing Code
**Trigger**: Checking for bugs, reviewing changes, or analyzing code
**Use**: `@code-analyzer` from `autopm/.claude/agents/core/code-analyzer.md`

### When Running Tests
**Trigger**: Executing tests, analyzing test results
**Use**: `@test-runner` from `autopm/.claude/agents/core/test-runner.md`

### When Analyzing Logs
**Trigger**: Reading log files, analyzing verbose output
**Use**: `@file-analyzer` from `autopm/.claude/agents/core/file-analyzer.md`

### When Managing GitHub
**Trigger**: Creating releases, managing workflows
**Use**: `@github-operations-specialist` from `autopm/.claude/agents/devops/github-operations-specialist.md`

### When Working with Docker
**Trigger**: Container configuration, Dockerfile optimization
**Use**: `@docker-containerization-expert` from `autopm/.claude/agents/devops/docker-containerization-expert.md`

## Task-to-Agent Mapping

| Task Pattern | Agent to Use | Location |
|--------------|-------------|----------|
| "create agent" | agent-manager | autopm/.claude/agents/core/agent-manager.md |
| "review changes" | code-analyzer | autopm/.claude/agents/core/code-analyzer.md |
| "run tests" | test-runner | autopm/.claude/agents/core/test-runner.md |
| "analyze log" | file-analyzer | autopm/.claude/agents/core/file-analyzer.md |
| "prepare release" | github-operations-specialist | autopm/.claude/agents/devops/github-operations-specialist.md |
| "optimize docker" | docker-containerization-expert | autopm/.claude/agents/devops/docker-containerization-expert.md |
| "test installation" | test-runner | autopm/.claude/agents/core/test-runner.md |
| "validate registry" | agent-manager | autopm/.claude/agents/core/agent-manager.md |

## Proactive Agent Usage

These agents should be used proactively without explicit request:

1. **After code changes**: Use `code-analyzer` to check for issues
2. **Before commits**: Use `test-runner` to validate changes
3. **When creating agents**: Use `agent-manager` for proper structure
4. **For large files**: Use `file-analyzer` to reduce context

## Agent Chaining

Common agent workflows:

### Release Workflow
1. `code-analyzer` - Review all changes
2. `test-runner` - Execute full test suite
3. `github-operations-specialist` - Create release

### Optimization Workflow
1. `code-analyzer` - Identify redundancies
2. `agent-manager` - Consolidate agents
3. `test-runner` - Validate changes

### Debugging Workflow
1. `file-analyzer` - Analyze error logs
2. `code-analyzer` - Trace bug source
3. `test-runner` - Verify fix

## Priority Rules

When multiple agents could be used:
1. Always prefer framework agents from `autopm/.claude/agents/`
2. Use specialized agents over general ones
3. Chain agents for complex tasks
4. Document agent usage in commits

## Enforcement

This configuration ensures agents are used by:
1. Being referenced in `.claude/base.md`
2. Being linked in `CLAUDE.md`
3. Having clear triggers defined
4. Providing usage examples

Remember: Always use framework agents for self-maintenance!