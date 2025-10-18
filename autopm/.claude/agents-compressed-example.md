# Agent Descriptions - Compressed Format Example

This file shows how agent descriptions can be compressed using XML and pipe-separated lists.

## Traditional Format (Long)

**Before Optimization:**

```markdown
### python-backend-engineer

Use this agent for Python backend development including FastAPI, Django, Flask, and other Python frameworks.
Specializes in REST APIs, GraphQL, microservices, asynchronous programming, and database integration.
Expert in Python performance optimization, testing with pytest, and production deployment.

**When to use:**
- Building REST APIs with FastAPI
- Creating GraphQL endpoints
- Developing microservices
- Database integration with SQLAlchemy
- Async programming with asyncio
- Testing with pytest

**Documentation Queries:**
- `mcp://context7/fastapi/routing` - FastAPI routing and endpoints
- `mcp://context7/sqlalchemy/orm` - SQLAlchemy ORM patterns
- `mcp://context7/pytest/fixtures` - Pytest testing patterns

**Examples:**
- "Build a FastAPI authentication endpoint with JWT"
- "Create a microservice for user management"
- "Optimize database queries with SQLAlchemy"
```

**Token Count:** ~200 tokens

## Compressed Format (Short)

**After Optimization:**

```markdown
<agent id="python-backend-engineer">
<expertise>FastAPI|Django|Flask|REST|GraphQL|microservices|async|SQLAlchemy|pytest</expertise>
<use_for>REST APIs|GraphQL|microservices|DB integration|async|testing|optimization</use_for>
<context7>
fastapi/routing|sqlalchemy/orm|pytest/fixtures
</context7>
<examples>
FastAPI auth with JWT|User management microservice|SQLAlchemy query optimization
</examples>
</agent>
```

**Token Count:** ~60 tokens
**Savings:** 70%

## Multiple Agents - Compressed

```markdown
<agents>

<agent id="python-backend-engineer">
<exp>FastAPI|Django|Flask|REST|GraphQL|async|SQLAlchemy|pytest</exp>
<ctx7>fastapi/routing|sqlalchemy/orm|pytest/fixtures</ctx7>
</agent>

<agent id="react-frontend-engineer">
<exp>React|Next.js|TypeScript|hooks|state|routing|SSR|components</exp>
<ctx7>react/hooks|nextjs/routing|typescript/react</ctx7>
</agent>

<agent id="postgresql-expert">
<exp>PostgreSQL|indexing|optimization|partitioning|replication|JSON|full-text</exp>
<ctx7>postgresql/performance|postgresql/indexing|postgresql/jsonb</ctx7>
</agent>

<agent id="kubernetes-orchestrator">
<exp>K8s|Helm|deployments|services|ingress|operators|GitOps</exp>
<ctx7>kubernetes/deployments|kubernetes/services|helm/charts</ctx7>
</agent>

<agent id="code-analyzer">
<exp>Bug hunting|logic tracing|security analysis|performance|refactoring</exp>
<use>Review code|Find bugs|Trace logic|Security scan|Optimize</use>
</agent>

<agent id="test-runner">
<exp>Test execution|Jest|pytest|Playwright|analysis|reporting</exp>
<use>Run tests|Analyze results|Generate reports|Debug failures</use>
</agent>

</agents>
```

## Full Compressed Agent Registry Format

For the CLAUDE.md Active Agents section:

```markdown
<!-- AGENTS_START -->
<agents_list>
<core>
agent-manager|code-analyzer|file-analyzer|test-runner|parallel-worker
</core>

<lang>
bash-scripting-expert|javascript-frontend-engineer|nodejs-backend-engineer|python-backend-engineer
</lang>

<frameworks>
react-frontend-engineer|react-ui-expert
</frameworks>

<testing>
e2e-test-engineer|frontend-testing-engineer
</testing>

<cloud>
aws-cloud-architect|azure-cloud-architect|gcp-cloud-architect
</cloud>

<devops>
docker-containerization-expert|github-operations-specialist|kubernetes-orchestrator
</devops>

<db>
bigquery-expert|cosmosdb-expert|mongodb-expert|postgresql-expert|redis-expert
</db>

<data>
airflow-orchestration-expert|kedro-pipeline-expert
</data>

<messaging>
message-queue-engineer|nats-messaging-expert
</messaging>

<integration>
azure-devops-specialist|gemini-api-expert|openai-python-expert
</integration>

<infra>
gcp-cloud-functions-engineer|terraform-infrastructure-expert|traefik-proxy-expert
</infra>

<monitoring>
observability-engineer
</monitoring>

<security>
ssh-operations-expert
</security>

<design>
tailwindcss-expert|ux-design-expert
</design>

<workflow>
langgraph-workflow-expert
</workflow>

<mgmt>
agent-manager|mcp-context-manager|mcp-manager
</mgmt>

📖 Full registry: .claude/agents/AGENT-REGISTRY.md
📖 Quick ref: .claude/quick-ref/agent-quick-ref.md
</agents_list>
<!-- AGENTS_END -->
```

**Traditional Format:** ~8,000 tokens (listing all 45+ agents with descriptions)
**Compressed Format:** ~500 tokens (pipe-separated categorized list)
**Savings:** 93.75%

## Benefits of Compressed Format

1. **Token Efficiency**: 70-93% reduction in tokens
2. **Quick Scanning**: Pipe-separated lists easier to scan
3. **Category Grouping**: XML tags organize by purpose
4. **Lazy Loading**: Full docs loaded on-demand
5. **Maintainability**: Simpler to update and maintain

## Usage Pattern

In CLAUDE.md optimized template:

```markdown
## 🤖 ACTIVE AGENTS (Compressed)

<!-- AGENTS_START -->
<agents_list>
Core: agent-manager|code-analyzer|file-analyzer|test-runner
Languages: bash-scripting-expert|javascript-frontend-engineer|python-backend-engineer
...
📖 Full registry: .claude/agents/AGENT-REGISTRY.md
</agents_list>
<!-- AGENTS_END -->
```

When agent is invoked:
1. User: `@python-backend-engineer build API`
2. Claude sees compressed listing
3. Lazy loads: `.claude/agents/languages/python-backend-engineer.md`
4. Queries Context7: `mcp://context7/fastapi/routing`
5. Implements using full knowledge

## Implementation Strategy

1. **Keep full agent files** in `.claude/agents/` directories
2. **Use compressed format** in CLAUDE.md for listing
3. **Lazy load** full agent description when invoked
4. **Query Context7** as required by agent's Documentation Queries section

This provides best of both worlds:
- Minimal tokens in initial context
- Full agent knowledge when needed
- Always-current documentation via Context7
