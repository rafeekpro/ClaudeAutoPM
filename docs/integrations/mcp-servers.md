# MCP Servers Integration

Guide to Model Context Protocol server integration.

## Available Servers

### context7
Framework documentation access

```bash
autopm mcp enable context7
export OPENAI_API_KEY=sk-xxxxx
autopm mcp test context7
```

### playwright
Browser automation

```bash
autopm mcp enable playwright
npm install -D playwright
autopm mcp test playwright
```

## Configuration

File: `.claude/mcp-servers.json`

## Troubleshooting

```bash
autopm mcp diagnose
autopm mcp test context7
```

## Related

- [MCP Commands](../cli-reference/mcp.md)
- [Context7 Integration](context7.md)
