---
name: context7-docs
command: npx
args: ["@context7/mcp-server"]
env:
  CONTEXT7_API_KEY: "${CONTEXT7_API_KEY:-}"
  CONTEXT7_MCP_URL: "${CONTEXT7_MCP_URL:-mcp.context7.com/mcp}"
  CONTEXT7_API_URL: "${CONTEXT7_API_URL:-context7.com/api/v1}"
  CONTEXT7_WORKSPACE: "${CONTEXT7_WORKSPACE:-}"
  CONTEXT7_MODE: "documentation"
envFile: .claude/.env
description: Context7 documentation server for accessing technical documentation
category: documentation
status: active
version: ">=1.0.0"
---

# Context7 Documentation Server

## Description

The Context7 Documentation Server provides AI agents with access to comprehensive technical documentation from various sources. It enables intelligent documentation retrieval, contextual search, and knowledge base integration.

## Features

- **Smart Documentation Search**: AI-powered search across multiple documentation sources
- **Contextual Retrieval**: Returns relevant documentation based on current task context
- **Version-Aware**: Handles multiple versions of documentation
- **Caching**: Local caching for improved performance
- **Multi-Source Support**: Aggregates documentation from various sources

## Configuration

### Required Environment Variables

- `CONTEXT7_API_KEY`: Your Context7 API key (required)
- `CONTEXT7_WORKSPACE`: Your workspace identifier (optional)

### Optional Environment Variables

- `CONTEXT7_MCP_URL`: MCP endpoint URL (default: mcp.context7.com/mcp)
- `CONTEXT7_API_URL`: API endpoint URL (default: context7.com/api/v1)
- `CONTEXT7_MODE`: Server mode (default: documentation)

## Usage Examples

### Basic Setup

```bash
# Enable the server
autopm mcp enable context7-docs

# Set up environment variables
echo "CONTEXT7_API_KEY=your-api-key" >> .claude/.env
echo "CONTEXT7_WORKSPACE=your-workspace" >> .claude/.env

# Sync configuration
autopm mcp sync
```

### Integration with Agents

This server is commonly used with:
- `python-backend-engineer` - For Python documentation
- `react-frontend-engineer` - For React/JavaScript documentation
- `azure-devops-specialist` - For Azure DevOps documentation
- `kubernetes-orchestrator` - For Kubernetes documentation

### Context Pool Configuration

```json
{
  "python-docs": {
    "type": "shared",
    "agents": ["python-backend-engineer"],
    "sources": ["context7-docs"],
    "filters": ["fastapi", "sqlalchemy", "pydantic"],
    "maxSize": "100MB",
    "retention": "7d"
  }
}
```

## Supported Documentation Sources

### Programming Languages
- Python (CPython, PyPI packages)
- JavaScript/TypeScript (MDN, Node.js)
- Go (official docs)
- Rust (docs.rs)
- Java (OpenJDK)

### Frameworks & Libraries
- FastAPI, Flask, Django
- React, Vue, Angular
- Express, NestJS
- Spring Boot

### Cloud & DevOps
- AWS, Azure, GCP documentation
- Kubernetes, Docker
- Terraform, Ansible
- GitHub Actions, GitLab CI

### Databases
- PostgreSQL, MySQL, MongoDB
- Redis, Elasticsearch
- SQLAlchemy, Prisma

## Performance Optimization

### Caching Strategy
- Local cache: 7 days for stable docs
- Version-specific caching
- Incremental updates for large docs

### Request Optimization
- Batch requests when possible
- Use filters to reduce payload
- Enable compression

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify CONTEXT7_API_KEY is set correctly
   - Check API key permissions

2. **Slow Response Times**
   - Enable local caching
   - Use specific filters
   - Check network connectivity

3. **Missing Documentation**
   - Verify documentation source is supported
   - Check workspace configuration
   - Update server version

### Debug Mode

Enable debug logging:
```bash
export CONTEXT7_DEBUG=true
```

## Security Considerations

1. **API Key Management**
   - Store in `.claude/.env`
   - Never commit to version control
   - Rotate keys regularly

2. **Network Security**
   - Use HTTPS endpoints only
   - Validate SSL certificates
   - Monitor API usage

3. **Access Control**
   - Limit workspace access
   - Use read-only permissions when possible
   - Audit access logs

## Version History

- **1.0.0**: Initial release
- **1.1.0**: Added caching support
- **1.2.0**: Multi-source aggregation
- **1.3.0**: Context-aware retrieval

## Related Resources

- [Context7 Documentation](https://docs.context7.com)
- [MCP Protocol Specification](https://modelcontextprotocol.org)
- [Agent Integration Guide](../agents/AGENT-MCP-INTEGRATION.md)