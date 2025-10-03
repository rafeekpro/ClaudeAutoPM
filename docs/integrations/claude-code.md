# Claude Code Integration

Best practices for using ClaudeAutoPM with Claude Code.

## Starting Claude Code

```bash
claude --dangerously-skip-permissions .
```

**Note:** The `--dangerously-skip-permissions` flag is required for ClaudeAutoPM.

## Slash Commands

All PM commands available in Claude Code:

```
/pm:prd-new "description"
/pm:epic-decompose prd-file
/pm:epic-sync epic-file
/pm:next
/pm:issue-close "message"
```

## Best Practices

1. **Load appropriate team** before starting work
2. **Use specific agent** mentions in prompts
3. **Keep context focused** on current task
4. **Sync regularly** with provider

## Configuration

File: `.claude-code/config.json`

Updated by: `autopm team load`

## Related

- [Quick Start](../getting-started/quick-start.md)
- [Team Management](../cli-reference/team.md)
