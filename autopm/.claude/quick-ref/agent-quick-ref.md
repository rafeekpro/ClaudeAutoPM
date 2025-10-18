# Agent Quick Reference

<agent_categories>

<core>
@agent-manager - Create|analyze|manage agents
@code-analyzer - Bug hunting|logic tracing|security analysis
@file-analyzer - File|log analysis|context reduction
@test-runner - Test execution|analysis|structured reports
@parallel-worker - Multi-stream parallel execution
</core>

<languages>
@bash-scripting-expert - Shell automation|scripts|POSIX
@javascript-frontend-engineer - Vanilla JS|TypeScript|browser APIs
@nodejs-backend-engineer - Node.js|Express|NestJS|Fastify
@python-backend-engineer - FastAPI|Django|Flask|async
</languages>

<frameworks>
@react-frontend-engineer - React|Next.js|component development
@react-ui-expert - React UI frameworks|design systems
</frameworks>

<testing>
@e2e-test-engineer - Playwright|Cypress|visual testing
@frontend-testing-engineer - Jest|Vitest|React Testing Library
</testing>

<cloud>
@aws-cloud-architect - AWS services|CloudFormation
@azure-cloud-architect - Azure services|ARM|Bicep
@gcp-cloud-architect - GCP services|Deployment Manager
</cloud>

<devops>
@docker-containerization-expert - Dockerfile|Compose|multi-stage
@github-operations-specialist - GitHub Actions|workflows|releases
@kubernetes-orchestrator - K8s|Helm|deployments|operators
</devops>

<databases>
@bigquery-expert - BigQuery|SQL|analytics|partitioning
@cosmosdb-expert - Cosmos DB|multi-region|consistency
@mongodb-expert - MongoDB|aggregation|sharding
@postgresql-expert - PostgreSQL|optimization|indexing
@redis-expert - Redis|caching|pub/sub|distributed locks
</databases>

<data>
@airflow-orchestration-expert - Airflow|DAGs|task dependencies
@kedro-pipeline-expert - Kedro|data pipelines|MLOps
</data>

<messaging>
@message-queue-engineer - Kafka|RabbitMQ|SQS|event streaming
@nats-messaging-expert - NATS|JetStream|clustering
</messaging>

<integration>
@azure-devops-specialist - Azure DevOps|work items|pipelines
@gemini-api-expert - Google Gemini|multimodal|function calling
@openai-python-expert - OpenAI|GPT|embeddings|assistants
</integration>

<infrastructure>
@gcp-cloud-functions-engineer - Cloud Functions|serverless
@terraform-infrastructure-expert - Terraform|IaC|modules
@traefik-proxy-expert - Traefik|reverse proxy|SSL
</infrastructure>

<monitoring>
@observability-engineer - Prometheus|Grafana|ELK|Jaeger|APM
</monitoring>

<security>
@ssh-operations-expert - SSH|key management|tunneling
</security>

<design>
@tailwindcss-expert - TailwindCSS|utility-first|design systems
@ux-design-expert - UX/UI|accessibility|user experience
</design>

<workflow>
@langgraph-workflow-expert - LangGraph|state machines|AI workflows
</workflow>

<management>
@mcp-context-manager - MCP servers|context optimization
@mcp-manager - MCP installation|lifecycle|configuration
</management>

</agent_categories>

<usage_patterns>

<pattern name="Task Delegation">
<rule>Use specialized agents for ALL non-trivial tasks</rule>
<example>
Task: Build FastAPI authentication
Agent: @python-backend-engineer
Context7: mcp://context7/fastapi/security
</example>
</pattern>

<pattern name="Context Preservation">
<rule>Agent responses ≤ 20% of input data</rule>
<when>
Large files → @file-analyzer
Deep analysis → @code-analyzer
Test execution → @test-runner
</when>
</pattern>

<pattern name="Parallel Execution">
<rule>Use @parallel-worker for independent work streams</rule>
<example>
@parallel-worker execute:
- Stream 1: Frontend changes
- Stream 2: Backend changes
- Stream 3: Database migrations
</example>
</pattern>

<pattern name="Specialist Selection">
<decision_tree>
Python code? → @python-backend-engineer
React UI? → @react-frontend-engineer
Database? → @[db-type]-expert
Cloud? → @[cloud]-cloud-architect
Tests? → @test-runner
Logs? → @file-analyzer
Bugs? → @code-analyzer
</decision_tree>
</pattern>

</usage_patterns>

<obligations>
✓ ALWAYS use agents for non-trivial tasks
✓ Check agent registry before implementing
✓ Delegate to preserve context
✓ Use parallel execution when possible
✓ Follow agent recommendations
</obligations>

<full_docs>
.claude/agents/AGENT-REGISTRY.md - Complete agent list
.claude/rules/agent-mandatory.md - Usage enforcement
.claude/rules/context-optimization.md - Context patterns
.claude/rules/agent-coordination.md - Multi-agent workflows
</full_docs>
