---
allowed-tools: Task, Read, Write, Edit, MultiEdit, Bash, Glob, Grep
---

# Python API Scaffolding

Creates a complete FastAPI project structure with modern Python tooling.

**Usage**: `/python:api-scaffold [project-name] [--db=postgresql|mysql|sqlite] [--auth=jwt|oauth2]`

**Example**: `/python:api-scaffold task-manager --db=postgresql --auth=jwt`

**What this does**:
- Creates complete FastAPI project structure
- Sets up database integration with SQLAlchemy
- Implements authentication system
- Configures modern Python tooling (uv, ruff, mypy)
- Adds comprehensive testing setup
- Creates Docker configuration

Use the python-backend-engineer agent to create a complete FastAPI project scaffold.

Requirements for the agent:
- Create modern project structure with proper FastAPI organization
- Include SQLAlchemy models with async support
- Add Pydantic schemas for request/response validation
- Implement authentication and authorization system
- Set up database migration with Alembic
- Configure comprehensive testing with pytest
- Add modern Python tooling configuration (uv, ruff, mypy)
- Include Docker configuration and deployment setup
- Ensure type hints throughout and async/await patterns
- Add error handling, input validation, and security best practices