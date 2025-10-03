# Language Agents

Specialized agents for programming languages.

---

## Overview

- **6 language agents** covering major programming languages
- Expertise in language-specific patterns, frameworks, and best practices
- Deep knowledge of ecosystem tools and libraries

---

## python-backend-engineer

**Expert Python backend developer specializing in FastAPI, async patterns, and SQLAlchemy**

**File:** `.claude/agents/languages/python-backend-engineer.md`

### Expertise
- FastAPI applications ⭐⭐⭐⭐⭐
- Async Python (asyncio, aiohttp) ⭐⭐⭐⭐⭐
- SQLAlchemy ORM ⭐⭐⭐⭐⭐
- Type hints and Pydantic ⭐⭐⭐⭐⭐
- Python testing (pytest) ⭐⭐⭐⭐

### When to Use
```
@python-backend-engineer create FastAPI application with JWT authentication

@python-backend-engineer implement async database operations with SQLAlchemy

@python-backend-engineer add Pydantic models with comprehensive validation
```

### MCP Integration
Uses Context7 for latest Python, FastAPI, and SQLAlchemy documentation

---

## nodejs-backend-engineer

**Expert Node.js/TypeScript backend developer**

**File:** `.claude/agents/languages/nodejs-backend-engineer.md`

### Expertise
- Express.js ⭐⭐⭐⭐⭐
- NestJS ⭐⭐⭐⭐⭐
- TypeScript ⭐⭐⭐⭐⭐
- GraphQL servers ⭐⭐⭐⭐
- Microservices ⭐⭐⭐⭐

### When to Use
```
@nodejs-backend-engineer create Express REST API with TypeScript

@nodejs-backend-engineer implement GraphQL server with Apollo

@nodejs-backend-engineer build microservice with NestJS
```

### MCP Integration
Uses Context7 for Node.js, TypeScript, Express, and NestJS docs

---

## javascript-frontend-engineer

**Modern JavaScript/TypeScript frontend specialist**

**File:** `.claude/agents/languages/javascript-frontend-engineer.md`

### Expertise
- ES2024+ features ⭐⭐⭐⭐⭐
- TypeScript ⭐⭐⭐⭐⭐
- Browser APIs ⭐⭐⭐⭐⭐
- Performance optimization ⭐⭐⭐⭐
- DOM manipulation ⭐⭐⭐⭐

### When to Use
```
@javascript-frontend-engineer create interactive UI with vanilla JavaScript

@javascript-frontend-engineer optimize frontend performance

@javascript-frontend-engineer implement modern JavaScript features
```

### MCP Integration
Uses Context7 for JavaScript and TypeScript documentation

---

## bash-scripting-expert

**Expert in Bash scripting, shell automation, and system administration**

**File:** `.claude/agents/languages/bash-scripting-expert.md`

### Expertise
- Bash scripting ⭐⭐⭐⭐⭐
- POSIX compliance ⭐⭐⭐⭐⭐
- CI/CD automation ⭐⭐⭐⭐
- System administration ⭐⭐⭐⭐
- Error handling ⭐⭐⭐⭐

### When to Use
```
@bash-scripting-expert create deployment script with error handling

@bash-scripting-expert write CI/CD automation for GitHub Actions

@bash-scripting-expert implement backup script with logging
```

---

## go-backend-engineer

**Expert Go developer for backend services and microservices**

**File:** `.claude/agents/languages/go-backend-engineer.md`

### Expertise
- Go standard library ⭐⭐⭐⭐⭐
- gRPC APIs ⭐⭐⭐⭐⭐
- Concurrency patterns ⭐⭐⭐⭐⭐
- Microservices ⭐⭐⭐⭐
- Performance optimization ⭐⭐⭐⭐⭐

### When to Use
```
@go-backend-engineer create gRPC service with protocol buffers

@go-backend-engineer implement concurrent processing with goroutines

@go-backend-engineer build high-performance API
```

---

## rust-systems-engineer

**Expert Rust developer for systems programming and performance-critical code**

**File:** `.claude/agents/languages/rust-systems-engineer.md`

### Expertise
- Rust core ⭐⭐⭐⭐⭐
- Tokio async runtime ⭐⭐⭐⭐⭐
- Memory safety ⭐⭐⭐⭐⭐
- WebAssembly ⭐⭐⭐⭐
- Systems programming ⭐⭐⭐⭐⭐

### When to Use
```
@rust-systems-engineer create high-performance service in Rust

@rust-systems-engineer implement WebAssembly module

@rust-systems-engineer optimize critical performance path
```

---

## Selection Guide

### By Language

**Python Projects:**
```bash
autopm team load backend
# Includes: python-backend-engineer
```

**Node.js Projects:**
```bash
autopm team load backend
# Includes: nodejs-backend-engineer
```

**Frontend JavaScript:**
```bash
autopm team load frontend
# Includes: javascript-frontend-engineer
```

**DevOps/Automation:**
```bash
autopm team load devops
# Includes: bash-scripting-expert
```

### By Framework

**FastAPI:**
```
@python-backend-engineer with FastAPI expertise
```

**Express/NestJS:**
```
@nodejs-backend-engineer with Express or NestJS
```

**gRPC:**
```
@go-backend-engineer with gRPC expertise
```

### By Task Type

**API Development:**
- Python: `python-backend-engineer`
- Node.js: `nodejs-backend-engineer`
- Go: `go-backend-engineer`

**Frontend Logic:**
- `javascript-frontend-engineer`

**Scripts/Automation:**
- `bash-scripting-expert`

**High Performance:**
- `rust-systems-engineer`
- `go-backend-engineer`

---

## Related Documentation

- [Agent Registry](registry.md)
- [Framework Agents](framework-agents.md)
- [Backend Testing](backend-testing-engineer.md)
