# Agent Usage - MANDATORY

**🚨 CRITICAL: This rule has HIGHEST PRIORITY and MUST be followed for ALL tasks.**

## ⚠️ BEFORE YOU START ANY TASK - READ THIS

**MANDATORY SELF-CHECK:**

Before doing ANYTHING complex, ask yourself:
1. ❓ Is this writing code? → **USE AGENT**
2. ❓ Is this testing code? → **USE test-runner**
3. ❓ Is this analyzing code/files? → **USE code-analyzer or file-analyzer**
4. ❓ Is this database work? → **USE database expert agent**
5. ❓ Is this DevOps/infrastructure? → **USE DevOps agent**

**If YES to ANY → STOP and USE the appropriate agent!**

## Core Requirement

**YOU MUST USE SPECIALIZED AGENTS FOR ALL NON-TRIVIAL TASKS.**

Do NOT perform complex tasks yourself. Use the Task tool to delegate to appropriate agents.

### Why This Rule Exists

1. **Quality**: Specialized agents have deeper expertise
2. **Consistency**: Agents follow established patterns
3. **Context7**: Agents query live documentation (you should too!)
4. **TDD**: Agents enforce RED-GREEN-REFACTOR cycle
5. **Best Practices**: Agents apply industry standards

### What Happens When You Don't Use Agents

❌ **Common failures:**
- Code without tests (violates TDD)
- Missing Context7 queries (outdated patterns)
- Inconsistent code style
- Security vulnerabilities
- Performance issues
- Missing error handling

## When to Use Agents

### ✅ ALWAYS Use Agents For:

1. **Writing Code** (any language)
   - Use: `python-backend-engineer`, `react-frontend-engineer`, `nodejs-backend-engineer`
   - Example: "I need to create an API endpoint" → Use python-backend-engineer

2. **Testing**
   - Use: `test-runner`, `frontend-testing-engineer`, `e2e-test-engineer`
   - Example: "Run the test suite" → Use test-runner

3. **Infrastructure/DevOps**
   - Use: `kubernetes-orchestrator`, `docker-containerization-expert`, `terraform-infrastructure-expert`
   - Example: "Deploy to Kubernetes" → Use kubernetes-orchestrator

4. **Database Work**
   - Use: `postgresql-expert`, `mongodb-expert`, `bigquery-expert`
   - Example: "Design database schema" → Use postgresql-expert

5. **Code Analysis**
   - Use: `code-analyzer`
   - Example: "Review this code for bugs" → Use code-analyzer

6. **GitHub/Azure DevOps Operations**
   - Use: `github-operations-specialist`, `azure-devops-specialist`
   - Example: "Create a PR" → Use github-operations-specialist

7. **Large File Analysis**
   - Use: `file-analyzer`
   - Example: "Summarize this 10k line log file" → Use file-analyzer

### ⚪ Can Do Yourself:

1. **Simple file reads** (1-2 files, quick lookup)
2. **Simple bash commands** (ls, pwd, basic git commands)
3. **Answering questions** about existing code/documentation
4. **Creating todo lists** with TodoWrite

## Agent Selection Guide

### By Task Type

| Task | Agent | Example |
|------|-------|---------|
| Python API development | `python-backend-engineer` | Build FastAPI endpoint |
| React component | `react-frontend-engineer` | Create dashboard UI |
| Database schema | `postgresql-expert` | Design user tables |
| Kubernetes deployment | `kubernetes-orchestrator` | Deploy to K8s cluster |
| Docker container | `docker-containerization-expert` | Create Dockerfile |
| GitHub workflow | `github-operations-specialist` | Setup CI/CD |
| Code review | `code-analyzer` | Find bugs in PR |
| Test execution | `test-runner` | Run test suite |
| Log analysis | `file-analyzer` | Parse 50MB log file |

### By Technology

| Technology | Primary Agent | Secondary Agent |
|------------|---------------|-----------------|
| Python/FastAPI | `python-backend-engineer` | `postgresql-expert` for DB |
| React/Next.js | `react-frontend-engineer` | `tailwindcss-expert` for styles |
| Node.js/Express | `nodejs-backend-engineer` | `mongodb-expert` for DB |
| TypeScript | `javascript-frontend-engineer` | Language-specific |
| Kubernetes | `kubernetes-orchestrator` | `docker-containerization-expert` |
| Terraform | `terraform-infrastructure-expert` | Cloud-specific architects |
| Testing | `test-runner` | `frontend-testing-engineer` |

## Violation Examples

### ❌ WRONG - Doing It Yourself:

```
User: "Create a FastAPI endpoint for user registration"
You: *writes Python code directly*
```

### ✅ CORRECT - Using Agent:

```
User: "Create a FastAPI endpoint for user registration"
You: "I'll use the python-backend-engineer agent to create this endpoint"
*Uses Task tool with python-backend-engineer*
```

### ❌ WRONG - Not Using Agent for Analysis:

```
User: "Review this 5000 line file for security issues"
You: *reads file and tries to analyze*
```

### ✅ CORRECT - Using Agent:

```
User: "Review this 5000 line file for security issues"
You: "I'll use the code-analyzer agent to review this file"
*Uses Task tool with code-analyzer*
```

## How to Use Agents

### Single Task:

```markdown
I'll use the [agent-name] agent to [task description].
```

Then invoke Task tool:
- `subagent_type`: Agent name (e.g., "python-backend-engineer")
- `description`: Short task description
- `prompt`: Detailed task requirements

### Multiple Parallel Tasks:

```markdown
I'll launch multiple agents in parallel:
1. python-backend-engineer - Create API endpoints
2. react-frontend-engineer - Build dashboard UI
3. postgresql-expert - Design database schema
```

Then invoke multiple Task tools IN SINGLE MESSAGE.

## Active Team Agents

**Check the "Active Team Agents" section at the top of CLAUDE.md** for the current list of available agents in this project.

If you need an agent that's not listed, you can still use any agent from the registry. The active team list is just a convenience reference.

## Common Mistakes to Avoid

1. ❌ **Not reading Active Team Agents section** - Always check what agents are available
2. ❌ **Writing code yourself for non-trivial tasks** - Use appropriate agent
3. ❌ **Not using parallel agents** - Launch multiple agents when tasks are independent
4. ❌ **Using wrong agent for task** - Match agent specialty to task type
5. ❌ **Forgetting file-analyzer for large files** - Use it for files >1000 lines or logs

## Enforcement

This rule is enforced through:

1. **Git Hooks** - Pre-commit checks for agent usage patterns
2. **Code Review** - Human reviewers check for proper agent delegation
3. **Self-Monitoring** - You must self-enforce and explain why you're using/not using agents

## Questions?

If you're unsure whether to use an agent:
- **Default: YES, use an agent**
- When in doubt, delegate to specialist
- Better to over-use agents than under-use them

## Context7 Integration - ALSO MANDATORY

**In addition to using agents, you MUST query Context7 for up-to-date documentation.**

### When to Query Context7

**BEFORE implementing ANY code:**
```bash
# Query relevant documentation
mcp://context7/<framework>/<topic>
mcp://context7/<language>/best-practices
mcp://context7/<library>/api-reference
```

### Why Context7 is Required

1. **Up-to-date info**: Your training data may be outdated
2. **API changes**: Libraries evolve, APIs change
3. **Best practices**: Current industry standards
4. **Bug fixes**: Known issues and workarounds

### Examples

**Writing Python FastAPI code:**
```bash
# Query BEFORE implementation
mcp://context7/fastapi/routing
mcp://context7/fastapi/validation
mcp://context7/pydantic/models
```

**Writing React components:**
```bash
# Query BEFORE implementation
mcp://context7/react/hooks
mcp://context7/react/18.0/best-practices
mcp://context7/typescript/react-patterns
```

**Database schema design:**
```bash
# Query BEFORE implementation
mcp://context7/postgresql/schema-design
mcp://context7/postgresql/indexing
mcp://context7/postgresql/performance
```

## Summary

**Before doing ANY complex task, ask yourself:**
1. Is there a specialized agent for this?
2. Would an agent do this better/faster/more thoroughly?
3. Am I trying to do something I should delegate?
4. Should I query Context7 for current best practices?

**If answer is YES to any → USE THE AGENT! AND QUERY CONTEXT7!**
