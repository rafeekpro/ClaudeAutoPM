---
name: context7-codebase
command: npx
args: ["@context7/mcp-server"]
env:
  CONTEXT7_API_KEY: "${CONTEXT7_API_KEY:-}"
  CONTEXT7_MCP_URL: "${CONTEXT7_MCP_URL:-mcp.context7.com/mcp}"
  CONTEXT7_API_URL: "${CONTEXT7_API_URL:-context7.com/api/v1}"
  CONTEXT7_WORKSPACE: "${CONTEXT7_WORKSPACE:-}"
  CONTEXT7_MODE: "codebase"
envFile: .claude/.env
description: Context7 codebase server for project code analysis and navigation
category: codebase
status: active
version: ">=1.0.0"
---

# Context7 Codebase Server

## Description

The Context7 Codebase Server provides intelligent code analysis, navigation, and understanding capabilities for your project. It indexes and analyzes your codebase to provide context-aware assistance for development tasks.

## Features

- **Code Indexing**: Automatic indexing of project files
- **Semantic Analysis**: Understanding code structure and relationships
- **Dependency Tracking**: Tracks imports and dependencies
- **Change Detection**: Monitors code changes in real-time
- **Cross-Reference**: Links between related code elements
- **Pattern Recognition**: Identifies common patterns and anti-patterns

## Configuration

### Required Environment Variables

- `CONTEXT7_API_KEY`: Your Context7 API key (required)
- `CONTEXT7_WORKSPACE`: Your workspace identifier (required for codebase mode)

### Optional Environment Variables

- `CONTEXT7_MCP_URL`: MCP endpoint URL (default: mcp.context7.com/mcp)
- `CONTEXT7_API_URL`: API endpoint URL (default: context7.com/api/v1)
- `CONTEXT7_MODE`: Must be set to "codebase"

## Usage Examples

### Basic Setup

```bash
# Enable the server
autopm mcp enable context7-codebase

# Configure environment
echo "CONTEXT7_API_KEY=your-api-key" >> .claude/.env
echo "CONTEXT7_WORKSPACE=project-workspace" >> .claude/.env

# Sync configuration
autopm mcp sync
```

### Project Indexing

```bash
# Index current project
context7 index .

# Exclude directories
context7 index . --exclude node_modules,dist,build
```

### Integration with Agents

Commonly used with:
- `code-analyzer` - For code quality analysis
- `python-backend-engineer` - For Python projects
- `react-frontend-engineer` - For React projects
- `test-runner` - For test coverage analysis

### Context Pool Configuration

```json
{
  "project-context": {
    "type": "persistent",
    "agents": ["code-analyzer", "python-backend-engineer"],
    "sources": ["context7-codebase"],
    "maxSize": "300MB",
    "retention": "30d",
    "refresh": "on-change"
  }
}
```

## Supported Languages & Frameworks

### Languages
- Python (including type hints)
- JavaScript/TypeScript
- Java
- Go
- Rust
- C/C++
- Ruby
- PHP

### Frameworks
- FastAPI, Django, Flask (Python)
- React, Vue, Angular (JavaScript)
- Spring Boot (Java)
- Express, NestJS (Node.js)

### File Types
- Source code (`.py`, `.js`, `.ts`, etc.)
- Configuration (`.json`, `.yaml`, `.toml`)
- Documentation (`.md`, `.rst`)
- Docker files
- CI/CD pipelines

## Indexing Configuration

### .context7ignore

Create a `.context7ignore` file to exclude files from indexing:

```
# Dependencies
node_modules/
venv/
.venv/

# Build outputs
dist/
build/
*.pyc
__pycache__/

# Large files
*.log
*.sqlite
*.db

# Sensitive data
.env
*.key
*.pem
```

### Index Settings

```json
{
  "indexing": {
    "incremental": true,
    "parallel": true,
    "maxFileSize": "10MB",
    "languages": ["python", "javascript", "typescript"],
    "includeTests": true,
    "includeComments": true
  }
}
```

## Performance Optimization

### Indexing Strategy
- Incremental indexing for large codebases
- Parallel processing for faster indexing
- Smart caching of analysis results

### Memory Management
- Configurable memory limits
- Automatic garbage collection
- Efficient data structures

## Advanced Features

### Code Intelligence

```yaml
features:
  - symbol_resolution
  - type_inference
  - dead_code_detection
  - cyclomatic_complexity
  - test_coverage_mapping
```

### Real-time Monitoring

- File system watch for changes
- Git integration for version tracking
- Branch-aware indexing

## Troubleshooting

### Common Issues

1. **Indexing Timeout**
   - Reduce scope with `.context7ignore`
   - Enable incremental indexing
   - Increase timeout settings

2. **Memory Issues**
   - Set memory limits in configuration
   - Exclude large binary files
   - Use filtering for specific languages

3. **Sync Problems**
   - Check workspace permissions
   - Verify git status
   - Clear local cache

### Debug Mode

```bash
export CONTEXT7_DEBUG=true
export CONTEXT7_VERBOSE=true
```

## Security Considerations

1. **Code Privacy**
   - Code is processed securely
   - No code storage without permission
   - Encrypted transmission

2. **Access Control**
   - Workspace-level permissions
   - Read-only by default
   - Audit logging enabled

3. **Sensitive Data**
   - Automatic secret detection
   - Pattern-based exclusion
   - Environment variable masking

## Best Practices

1. **Initial Setup**
   - Start with a clean codebase
   - Configure `.context7ignore` first
   - Run initial index during off-hours

2. **Maintenance**
   - Regular re-indexing for accuracy
   - Monitor index size
   - Clean up old indexes

3. **Team Usage**
   - Share workspace configuration
   - Consistent ignore patterns
   - Document custom settings

## Version History

- **1.0.0**: Initial release
- **1.1.0**: Added incremental indexing
- **1.2.0**: Multi-language support
- **1.3.0**: Real-time monitoring
- **1.4.0**: Advanced code intelligence

## Related Resources

- [Context7 Codebase Docs](https://docs.context7.com/codebase)
- [Indexing Best Practices](https://docs.context7.com/best-practices)
- [Code Analysis Guide](../agents/code-analyzer.md)