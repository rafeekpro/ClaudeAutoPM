# Context7 Integration Example

This example shows how to use the new agents with context7 documentation integration.

## Setup

1. **Install context7 MCP server**:

```bash
npm install -g @context7/mcp-server
```

2. **Configure environment variables**:

```bash
export CONTEXT7_API_KEY="your-api-key"
export CONTEXT7_WORKSPACE="your-workspace"
```

3. **Setup MCP servers** (already configured in `.claude/mcp-servers.json`):
   - `context7-docs`: Documentation server
   - `context7-codebase`: Codebase context server

## Usage Examples

### 1. Python Backend Development with Live Docs

**Command**: `/python:docs-query --topic=fastapi --pattern=authentication --examples`

This will:

- Query latest FastAPI authentication documentation via context7
- Return current best practices and security patterns
- Provide code examples using latest FastAPI version

**Follow with**: `/python:api-scaffold user-api --auth=jwt`

The python-backend-engineer agent will:

1. First query context7 for latest FastAPI authentication patterns
2. Use current JWT implementation best practices
3. Generate code with latest library versions
4. Include security recommendations from current docs

### 2. Azure DevOps Integration with Live API Docs

**Command**: `/azure:docs-query --topic=rest-api --version=latest --examples`

This will:

- Fetch latest Azure DevOps REST API documentation
- Show current authentication methods and endpoints
- Provide integration examples with current API version

**Follow with**: `/azure:work-item-sync --project=MyProject`

The azure-devops-specialist agent will:

1. Check latest API version and authentication requirements
2. Use current field mappings and endpoint schemas  
3. Implement with latest security best practices
4. Handle any API changes or deprecations

### 3. Context Optimization Setup

**Command**: `/mcp:context-setup --server=context7 --pool-name=project-docs --agents=python-backend-engineer,azure-devops-specialist --max-size=100MB`

This will:

- Configure shared documentation pool between agents
- Set up automatic documentation refresh
- Optimize context usage across agent interactions
- Enable cross-agent knowledge sharing

## Workflow Integration

### Complete Feature Development Flow

```bash
# 1. Setup context sharing
/mcp:context-setup --server=context7 --pool-name=feature-dev

# 2. Query latest Python docs
/python:docs-query --topic=fastapi --examples

# 3. Create API with latest patterns  
/python:api-scaffold task-api --db=postgresql --auth=jwt

# 4. Query Azure DevOps integration docs
/azure:docs-query --topic=pipelines --examples  

# 5. Setup CI/CD with current best practices
/azure:pipeline-setup --project=TaskAPI --environment=production

# 6. Refresh documentation cache daily
/mcp:docs-refresh --validate
```

## Benefits

✅ **Always Current**: Documentation queries fetch latest versions
✅ **Version Compatibility**: Agents check compatibility between libraries
✅ **Security Updates**: Latest security recommendations automatically included
✅ **Performance Optimizations**: Current performance patterns and best practices
✅ **Context Efficiency**: Shared documentation pools reduce redundant queries
✅ **Cross-Agent Learning**: Agents share knowledge through context pools

## Monitoring

Check documentation cache status:

```bash
/mcp:docs-refresh --validate
```

View context pool usage:

```bash  
/mcp:context-analyze --pool=project-docs --metrics=usage,efficiency
```

## Configuration Files

- **`.claude/mcp-servers.json`**: MCP server and context pool configuration
- **`.claude/agents/*.md`**: Agent definitions with context7 integration
- **`.claude/commands/*/docs-query.md`**: Documentation query commands
- **`.claude/commands/mcp/*.md`**: MCP management commands
