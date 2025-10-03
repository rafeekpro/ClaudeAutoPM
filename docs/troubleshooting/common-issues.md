# Common Issues

Typical problems and solutions.

## Installation Issues

### Permission denied

```bash
npm config set prefix ~/.npm-global
export PATH=~/.npm-global/bin:$PATH
npm install -g claude-autopm
```

### EACCES errors

```bash
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}
```

## Configuration Issues

### Invalid token

```bash
# Regenerate token
export GITHUB_TOKEN=ghp_new_token
autopm config validate
```

### Missing configuration

```bash
autopm install --force
```

## Runtime Issues

### Agent not loading

```bash
autopm team show
autopm team load fullstack
```

### MCP connection failed

```bash
autopm mcp diagnose --fix
```

## Related
- [FAQ](faq.md)
- [Debugging Guide](debugging.md)
