# Debugging Guide

How to debug issues.

## Enable Debug Mode

```bash
export AUTOPM_DEBUG=1
autopm validate --verbose
```

## Check Logs

```bash
# MCP logs
autopm mcp logs context7

# Claude Code logs
# Check Claude Code console
```

## Diagnostic Commands

```bash
# Full validation
autopm validate --verbose

# Configuration check
autopm config show --verbose

# Team check
autopm team show

# MCP diagnostics
autopm mcp diagnose
```

## Common Debug Steps

1. Check configuration: `autopm config show`
2. Validate setup: `autopm validate`
3. Check teams: `autopm team show`
4. Test MCP: `autopm mcp status`
5. Check logs with debug mode

## Getting Help

- [FAQ](faq.md)
- [Common Issues](common-issues.md)
- [GitHub Issues](https://github.com/rafeekpro/ClaudeAutoPM/issues)
