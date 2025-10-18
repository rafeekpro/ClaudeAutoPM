# Agent Usage - MANDATORY (Optimized)

<priority>HIGHEST - ZERO TOLERANCE</priority>

<core_requirement>
YOU MUST USE SPECIALIZED AGENTS FOR ALL NON-TRIVIAL TASKS
Do NOT perform complex tasks yourself
Use Task tool to delegate
</core_requirement>

<when_to_use>
<always>
Code writing|Testing|Infrastructure|Database|Analysis|GitHub ops|Large files
</always>

<mapping>
Python → python-backend-engineer
React → react-frontend-engineer
Node.js → nodejs-backend-engineer
Tests → test-runner|frontend-testing-engineer|e2e-test-engineer
K8s → kubernetes-orchestrator
Docker → docker-containerization-expert
Database → postgresql-expert|mongodb-expert|bigquery-expert
Review → code-analyzer
Logs → file-analyzer
GitHub → github-operations-specialist
Azure → azure-devops-specialist
</mapping>

<can_do_yourself>
Simple file reads (1-2 files)|Basic bash (ls, pwd, git)|Answering questions|TodoWrite
</can_do_yourself>
</when_to_use>

<violations>
<wrong>
User: "Create FastAPI endpoint"
You: *writes code directly*
</wrong>

<correct>
User: "Create FastAPI endpoint"
You: "Using @python-backend-engineer"
*Invokes Task tool*
</correct>
</violations>

<usage_patterns>
<single>
Task tool:
- subagent_type: "python-backend-engineer"
- description: "Create user endpoint"
- prompt: "Detailed requirements..."
</single>

<parallel>
Launch multiple agents IN SINGLE MESSAGE:
- python-backend-engineer (API)
- react-frontend-engineer (UI)
- postgresql-expert (schema)
</parallel>
</usage_patterns>

<decision_rule>
Before ANY complex task:
1. Is there a specialized agent?
2. Would agent do better?
3. Am I trying to do what I should delegate?

YES to any? → USE THE AGENT
When in doubt? → USE THE AGENT
</decision_rule>

<common_mistakes>
❌ Not checking Active Team Agents
❌ Writing code for non-trivial tasks
❌ Not using parallel agents
❌ Wrong agent for task
❌ Not using file-analyzer for large files
</common_mistakes>

<enforcement>
Git hooks|Code review|Self-monitoring
Default: YES use agent|Over-use better than under-use
</enforcement>

<ref>
Full version: .claude/rules/agent-mandatory.md
Quick ref: .claude/quick-ref/agent-quick-ref.md
Registry: .claude/agents/AGENT-REGISTRY.md
</ref>
