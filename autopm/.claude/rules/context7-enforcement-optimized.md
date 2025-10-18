# Context7 Documentation Enforcement (Optimized)

<priority>HIGHEST - ZERO TOLERANCE</priority>

<visual_reminder>
WHEN YOU SEE: `/pm:command` or `@agent-name`

YOU MUST:
1. 📖 ANNOUNCE: "Querying Context7..."
2. 🔍 READ command/agent file → extract Documentation Queries
3. 🌐 QUERY Context7 MCP for EACH listed topic
4. 📝 SUMMARIZE key findings
5. ✅ CONFIRM: "Context7 complete. Proceeding..."

<output>
🔒 Context7 Enforcement Active

📋 Command: /pm:epic-decompose
📚 Querying Context7...

   ➜ mcp://context7/agile/epic-decomposition
   ➜ mcp://context7/agile/task-sizing
   ➜ mcp://context7/agile/user-stories

✅ Context7 complete
📖 Key findings: [summary]

Proceeding with Context7 best practices...
</output>
</visual_reminder>

<prime_directive>
Query live documentation from Context7 BEFORE implementing
No implementation without Context7 query
No reliance on training data for technical specifics
No shortcuts
</prime_directive>

<why_critical>
<problems>
Hallucinations|API changes|Best practices drift|Version conflicts
Training data stale|Frameworks evolve|Deprecated patterns
</problems>

<benefits>
Always current|Verified patterns|API accuracy|Breaking changes awareness
Live documentation|Real examples|Current signatures|No guesswork
</benefits>
</why_critical>

<context7_cycle>
<query_phase>
1. Read command/agent file → extract Documentation Queries
2. Query EACH Context7 MCP link
3. Analyze: patterns|APIs|best practices|anti-patterns
4. Summarize findings before proceeding
</query_phase>

<implement_phase>
Apply Context7 patterns EXACTLY as documented
Use API signatures from Context7 (NOT training data)
Follow architectural recommendations
Reference Context7 in comments
</implement_phase>

<validate_phase>
Implementation matches Context7
No hallucinations
Latest conventions followed
Deprecation warnings addressed
</validate_phase>
</context7_cycle>

<absolute_requirements>
<commands>
MUST read "Required Documentation Access"
MUST query EVERY mcp:// link before execution
MUST summarize Context7 findings
MUST apply Context7 guidance
</commands>

<agents>
MUST read "Documentation Queries"
MUST query before technical decisions
MUST verify API signatures
MUST flag training data conflicts
</agents>

<implementations>
NO code from training data alone
NO assumptions without Context7
NO "I think this works" - VERIFY
NO skip for "small changes"
</implementations>
</absolute_requirements>

<prohibited>
❌ Implementing without querying
❌ "I remember" - training data stale
❌ Skip for "simple" tasks
❌ Cached knowledge vs live docs
❌ Proceed when query fails
❌ Ignore Context7 guidance
</prohibited>

<query_quality>
<do>
✅ Query ALL listed links
✅ Request specific topics
✅ Ask for examples + patterns
✅ Verify API signatures
✅ Check breaking changes
</do>

<dont>
❌ Skip assuming training data sufficient
❌ Query only one link
❌ Accept generic results
❌ Ignore version mismatches
</dont>

<coverage>
100% query rate|Complete coverage|Result validation|Stop if fails
</coverage>
</query_quality>

<command_flow>
User: /pm:epic-decompose feature-name

BEFORE:
1. Read .claude/commands/pm/epic-decompose.md
2. Extract Documentation Queries
3. Query Context7 for EACH link
4. Summarize: "Context7 confirms INVEST criteria..."
5. PROCEED with Context7 guidance

DURING:
Apply Context7 patterns|Reference examples|Follow best practices

AFTER:
Validate against Context7|Flag deviations
</command_flow>

<agent_flow>
User: @aws-cloud-architect design VPC

BEFORE:
1. Read .claude/agents/cloud/aws-cloud-architect.md
2. Extract Documentation Queries
3. Query Context7 for EACH link
4. Summarize: "Context7 shows VPC /16 for staging..."
5. PROCEED with Context7 knowledge

DURING:
Current AWS API patterns|Terraform patterns|Networking best practices

AFTER:
Cross-check design|No deprecated patterns
</agent_flow>

<violations>
<immediate>
STOP execution|IDENTIFY unverified code|DELETE stale implementation|
QUERY Context7|REIMPLEMENT|DOCUMENT violation
</immediate>

<severity>
Level 1 (Minor): Partial queries → Complete + validate
Level 2 (Moderate): No queries → Stop + query + review
Level 3 (Critical): Contradicts Context7 → Delete + redo
</severity>

<no_exceptions>
NO "small changes"|NO "I'm confident"|NO "Context7 slow"|NO assumptions
</no_exceptions>
</violations>

<success_metrics>
✅ 100% commands query Context7
✅ 100% agents query Context7
✅ Zero training-data-only implementations
✅ All API signatures verified
✅ No deprecated patterns
✅ Findings documented
</success_metrics>

<automation>
<hooks>
.claude/hooks/pre-command-context7.js - Extract + query before commands
.claude/hooks/pre-agent-context7.js - Extract + query before agents
</hooks>

<validation>
.claude/rules/context7-enforcement.md - Highest priority rule
Read on every session|Zero tolerance
</validation>
</automation>

<emergency_fallback>
If Context7 unavailable:
1. ALERT: "⚠️ Context7 MCP unavailable"
2. REQUEST user decision: WAIT (recommended) or PROCEED (risky)
3. DOCUMENT: // WARNING: No Context7 verification - MCP unavailable
4. FLAG: TODO re-verify when available

DO NOT:
❌ Silently proceed
❌ Assume training data sufficient
❌ Skip queries
</emergency_fallback>

<final_reminder>
Context7 is MANDATORY for EVERY command and agent execution.
Training data becomes stale. APIs change. Best practices evolve.
Context7 keeps us current. Query it. Every. Single. Time.
</final_reminder>

<ref>
Full version: .claude/rules/context7-enforcement.md
Quick ref: .claude/quick-ref/context7-queries.md
</ref>
