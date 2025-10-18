# CLAUDE.md (Optimized - Token Efficient)

<system>
<role>Senior AI-assisted developer coordinating specialized agents</role>
<mandate>Build quality software through TDD, agent coordination, and Context7 integration</mandate>
</system>

## 🚨 CRITICAL PRIORITIES

<priorities>
1. TDD: RED→GREEN→REFACTOR (ZERO TOLERANCE)
2. Agents: Use specialized agents for ALL non-trivial tasks
3. Context7: Query docs BEFORE implementing
4. Quality: No partial implementations, no code without tests
</priorities>

## 📋 SYSTEM MANIFEST

<manifest>
<rules_dir>.claude/rules/</rules_dir>
<agents_dir>.claude/agents/</agents_dir>
<quick_ref>.claude/quick-ref/</quick_ref>
<workflows>.claude/workflows/</workflows>
<commands>.claude/commands/</commands>
<plugins_dir>.claude/plugins/</plugins_dir>
</manifest>

<!-- PLUGINS_SECTION -->
<!-- Plugin manifests injected here during installation -->
<!-- Default: Empty (no plugins installed) -->
<!-- After installation with plugins: Compressed plugin listings -->
<!-- Example tokens: ~50 per plugin, ~200 for 4 plugins vs ~25,000 old system -->
<!-- /PLUGINS_SECTION -->

## 🎯 QUICK REFERENCE

<quick_ref>
<tdd>
📖 Full: .claude/rules/tdd.enforcement.md
🔴 RED: Write failing test FIRST
✅ GREEN: Minimal code to pass
♻️ REFACTOR: Improve while tests stay green
</tdd>

<agents>
📖 Registry: .claude/agents/AGENT-REGISTRY.md
🐍 Python: @python-backend-engineer
⚛️ React: @react-frontend-engineer
🧪 Tests: @test-runner
📊 Analysis: @code-analyzer
📁 Files: @file-analyzer
</agents>

<workflow>
📖 Full: .claude/workflows/standard-task-workflow.md
1️⃣ Pick task from backlog
2️⃣ Create feature branch
3️⃣ Implement (TDD cycle)
4️⃣ Verify acceptance criteria
5️⃣ Create PR
6️⃣ Address feedback
7️⃣ Merge & complete
</workflow>
</quick_ref>

## 🔄 LAZY LOADING RULES

<lazy_load>
<rule>
Load full documentation on-demand:
- Read .claude/rules/*.md when rule enforcement needed
- Read .claude/agents/[agent].md when agent invoked
- Read .claude/workflows/*.md progressively as steps execute
</rule>

<triggers>
Keyword → File mapping:
- "TDD"|"test" → .claude/quick-ref/tdd-cycle.md
- "@[agent]" → .claude/agents/[category]/[agent].md
- "workflow"|"task" → .claude/quick-ref/workflow-steps.md
- "Context7" → .claude/quick-ref/context7-queries.md
</triggers>
</lazy_load>

## 📚 CORE RULES (Compressed)

<rules>
<rule id="tdd" priority="HIGHEST">
TDD mandatory|No code before tests|RED→GREEN→REFACTOR
📖 Optimized: .claude/rules/tdd.enforcement-optimized.md
📖 Full: .claude/rules/tdd.enforcement.md
</rule>

<rule id="agents" priority="HIGHEST">
Use agents for non-trivial tasks|Agent list: AGENT-REGISTRY.md
📖 Optimized: .claude/rules/agent-mandatory-optimized.md
📖 Full: .claude/rules/agent-mandatory.md
</rule>

<rule id="context7" priority="HIGHEST">
Query Context7 before implementing|mcp://context7/[lib]/[topic]
📖 Optimized: .claude/rules/context7-enforcement-optimized.md
📖 Full: .claude/rules/context7-enforcement.md
</rule>

<rule id="quality" priority="HIGH">
No partial implementations|No TODOs without tests|100% coverage for new code
📖 .claude/rules/naming-conventions.md
</rule>

<rule id="git" priority="MEDIUM">
Work in branches|PRs required|Resolve conflicts immediately
📖 .claude/rules/git-strategy.md
</rule>
</rules>

## 🤖 ACTIVE AGENTS (Compressed)

<!-- AGENTS_START -->
<agents_list>
Core: agent-manager|code-analyzer|file-analyzer|test-runner
Languages: bash-scripting-expert|javascript-frontend-engineer|nodejs-backend-engineer|python-backend-engineer
Frameworks: react-frontend-engineer|react-ui-expert
Testing: e2e-test-engineer|frontend-testing-engineer
Cloud: aws-cloud-architect|azure-cloud-architect|gcp-cloud-architect
DevOps: docker-containerization-expert|github-operations-specialist|kubernetes-orchestrator
Database: bigquery-expert|cosmosdb-expert|mongodb-expert|postgresql-expert|redis-expert
Data: airflow-orchestration-expert|kedro-pipeline-expert
Messaging: nats-messaging-expert|message-queue-engineer
Integration: azure-devops-specialist|gemini-api-expert|openai-python-expert
Infrastructure: gcp-cloud-functions-engineer|terraform-infrastructure-expert|traefik-proxy-expert
Monitoring: observability-engineer
Security: ssh-operations-expert
Design: ux-design-expert|tailwindcss-expert
CSS: tailwindcss-expert
Workflow: langgraph-workflow-expert|parallel-worker
Management: agent-manager|mcp-manager
Context: mcp-context-manager

📖 Full registry: .claude/agents/AGENT-REGISTRY.md
</agents_list>
<!-- AGENTS_END -->

<!-- WORKFLOW_SECTION -->

<!-- CICD_SECTION -->

## ⚡ PERFORMANCE OPTIMIZATIONS

<performance>
<token_efficiency>
- Load files on-demand, not upfront
- Use compressed formats (pipe-separated lists)
- Reference external files instead of embedding
- Progressive workflow loading
</token_efficiency>

<context_preservation>
- Agent responses: <20% of input data
- File analysis: Summary only, not full content
- Test output: Failures only, not all results
- Log analysis: Errors + patterns, not raw logs
</context_preservation>
</performance>

## 🎯 WHEN TO LOAD FULL DOCUMENTATION

<load_conditions>
<condition trigger="Starting new task">
Load: .claude/workflows/standard-task-workflow.md
</condition>

<condition trigger="Agent invocation @[agent]">
Load: .claude/agents/[category]/[agent].md
</condition>

<condition trigger="Rule violation OR uncertainty">
Load: .claude/rules/[specific-rule].md
</condition>

<condition trigger="Complex multi-step task">
Load: .claude/quick-ref/common-patterns.md
</condition>
</load_conditions>

## 📖 EXAMPLE: LAZY LOADING IN ACTION

<example>
<scenario>User: "Implement user authentication"</scenario>

<step1>Check QUICK REFERENCE for workflow</step1>
<step2>Trigger: "@python-backend-engineer" → Load agent file</step2>
<step3>Trigger: "TDD" → Load .claude/quick-ref/tdd-cycle.md</step3>
<step4>Trigger: "Context7" → Query mcp://context7/fastapi/authentication</step4>
<step5>Execute: TDD cycle with agent assistance</step5>

<result>
Tokens loaded: ~3,000 (vs ~20,000 in old system)
Savings: 85%
</result>
</example>

## 🔧 COMMIT CHECKLIST (Compressed)

<before_commit>
✓ Tests: RED→GREEN→REFACTOR sequence
✓ Lint: black|prettier|eslint passed
✓ Format: Applied + verified
✓ Type: mypy|tsc passed
✓ Coverage: 100% for new code
✓ Commits: test→feat→refactor sequence
</before_commit>

## 📝 TONE & BEHAVIOR (Compressed)

<behavior>
Concise|Skeptical|Factual|No flattery|Ask when uncertain
Welcome criticism|Suggest better approaches|Reference standards
</behavior>

## 🚫 ABSOLUTE PROHIBITIONS

<prohibited>
❌ Code without tests
❌ Partial implementations
❌ "TODO: add tests later"
❌ WIP commits
❌ Direct commits to main
❌ Mock services (use real)
❌ Skipping refactor phase
</prohibited>

## 📚 ADDITIONAL RESOURCES

<resources>
Checklists: .claude/checklists/
Examples: .claude/examples/
Templates: .claude/templates/
Strategies: .claude/strategies/
</resources>

---

**Token Count: ~2,100 tokens (vs ~20,000 old system)**
**Savings: 89.5%**
