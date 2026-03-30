---

## Mandatory Implementation Rules

> **These rules apply to EVERY issue. No exceptions.**

### 1. Context7 — REQUIRED before writing any code
- Query Context7 MCP for up-to-date documentation BEFORE implementation
- Use `mcp__context7__resolve-library-id` then `mcp__context7__get-library-docs`
- Never rely on training data for API signatures or patterns

### 2. Specialized Agents — REQUIRED for all non-trivial work
- Backend Python → `python-backend-engineer` agent
- Frontend React → `react-frontend-engineer` agent
- Testing → `test-runner` agent
- Database → `postgresql-expert` agent
- Code analysis → `code-analyzer` agent
- Do NOT write code directly — delegate to the appropriate agent

### 3. TDD — REQUIRED commit pattern
- RED: `git commit -m "test: add failing tests for <feature>"`
- GREEN: `git commit -m "feat: implement <feature>"`
- REFACTOR: `git commit -m "refactor: improve <feature> structure"`

### 4. Quality gates before PR
- Backend: `black --check . && ruff check . && pytest --cov --cov-fail-under=70`
- Frontend: `npm run lint && npx tsc --noEmit && npm test -- --coverage`
