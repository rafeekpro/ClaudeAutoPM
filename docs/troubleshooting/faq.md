# FAQ

Frequently asked questions.

## Installation

**Q: Command not found: autopm**

```bash
npm install -g claude-autopm
export PATH=$(npm bin -g):$PATH
```

**Q: Slash commands not working**

```bash
autopm validate
# Reload Claude Code
```

## Configuration

**Q: GitHub sync failed**

```bash
autopm config validate
# Check token permissions
```

**Q: MCP server not responding**

```bash
autopm mcp diagnose
autopm mcp test context7
```

## Usage

**Q: Agent not found**

```bash
autopm team load fullstack
# Reload Claude Code
```

**Q: How to switch teams?**

```bash
autopm team load <team-name>
```

## Related
- [Common Issues](common-issues.md)
- [Debugging Guide](debugging.md)
