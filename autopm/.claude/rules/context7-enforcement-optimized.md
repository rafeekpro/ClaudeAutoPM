# Context7 Documentation Enforcement (Optimized)

<priority>HIGHEST - ZERO TOLERANCE</priority>

<visual_reminder>
WHEN YOU SEE: `/pm:command` or `@agent-name`

YOU MUST:
1. READ command/agent file -> extract Documentation Queries
2. QUERY Context7 MCP for EACH listed topic
3. SUMMARIZE key findings
4. CONFIRM: "Context7 complete. Proceeding..."

<output>
Context7 Enforcement Active

Command: /pm:epic-decompose
Querying Context7...

   -> mcp://context7/agile/epic-decomposition
   -> mcp://context7/agile/task-sizing
   -> mcp://context7/agile/user-stories

Context7 complete
Key findings: [summary]

Proceeding with Context7 best practices...
</output>
</visual_reminder>

<prime_directive>
Query live documentation from Context7 BEFORE implementing.
No implementation without Context7 query.
No reliance on training data for technical specifics.
</prime_directive>

<example>
User: /pm:epic-decompose feature-name

1. Read .claude/commands/pm/epic-decompose.md
2. Extract Documentation Queries
3. Query Context7 for EACH link
4. Summarize: "Context7 confirms INVEST criteria..."
5. PROCEED with Context7 guidance
</example>

<emergency_fallback>
If Context7 unavailable:
1. ALERT: "Context7 MCP unavailable"
2. REQUEST user decision: WAIT (recommended) or PROCEED (risky)
3. DOCUMENT: // WARNING: No Context7 verification - MCP unavailable
4. FLAG: TODO re-verify when available
</emergency_fallback>

<automation>
<hooks>
.claude/hooks/context7-enforcement.js - Extract + query before commands and agents
</hooks>
</automation>

<ref>
Quick ref: .claude/quick-ref/context7-queries.md
</ref>
