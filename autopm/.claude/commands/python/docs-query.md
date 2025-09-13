---
allowed-tools: Task, Read, WebFetch, Glob, Grep
---

# Python Documentation Query

Queries latest Python/FastAPI documentation via context7 before implementation.

**Usage**: `/python:docs-query [--topic=fastapi|sqlalchemy|pydantic|uv|pytest] [--pattern=search-pattern] [--examples]`

**Examples**: 
- `/python:docs-query --topic=fastapi --pattern=authentication`
- `/python:docs-query --topic=sqlalchemy --pattern=async --examples`
- `/python:docs-query --topic=pydantic --examples`

**What this does**:
- Queries context7 for latest Python framework documentation
- Searches for specific patterns, methods, or concepts
- Returns relevant examples and best practices
- Provides version compatibility information
- Shows security recommendations and performance tips

Use the python-backend-engineer agent to query documentation and provide implementation guidance.

Requirements for the agent:
- Query MCP context7 documentation servers for specified topics
- Search documentation using provided patterns or keywords
- Extract relevant code examples and implementation patterns
- Verify version compatibility and security recommendations
- Format results with clear examples and explanations
- Include links to full documentation sections when available