# Context7 Documentation Enforcement

> **CRITICAL**: This rule has HIGHEST PRIORITY. ALL commands and agents MUST query Context7 before execution.

---

## 🔴 VISUAL REMINDER FOR EVERY COMMAND/AGENT

**WHEN YOU SEE:** User writes `/pm:epic-decompose` or `@aws-cloud-architect`

**YOU MUST IMMEDIATELY:**

1. 📖 **ANNOUNCE**: "I will now query Context7 for required documentation..."
2. 🔍 **READ** the command/agent file to extract Documentation Queries
3. 🌐 **QUERY** Context7 MCP for EACH listed topic using mcp__context7__get-library-docs
4. 📝 **SUMMARIZE** key findings from Context7 results
5. ✅ **CONFIRM**: "Context7 verification complete. Proceeding with [command/agent]..."

**VISUAL OUTPUT FOR USER:**

```
🔒 Context7 Enforcement Active

📋 Command: /pm:epic-decompose
📚 Querying Context7 for required documentation...

   ➜ mcp://context7/agile/epic-decomposition
   ➜ mcp://context7/agile/task-sizing
   ➜ mcp://context7/agile/user-stories
   ➜ mcp://context7/project-management/task-breakdown

✅ Context7 queries complete
📖 Key findings: [summarize what you learned]

Proceeding with epic decomposition using Context7 best practices...
```

---

## Core Context7 Philosophy

**Prime Directive**: Query live documentation from Context7 MCP BEFORE implementing any solution.
**Zero Tolerance**: No implementation without Context7 query. No reliance on training data. No shortcuts.

## Why This is Critical

### Problems We Solve

- **Hallucinations**: AI training data becomes stale, leading to outdated patterns
- **API Changes**: Frameworks evolve - training data doesn't reflect latest versions
- **Best Practices Drift**: Industry standards change faster than model retraining
- **Version Conflicts**: Code suggestions may target wrong framework versions

### Context7 Benefits

- **Always Current**: Live documentation reflects latest releases
- **Verified Patterns**: Real code examples from official sources
- **API Accuracy**: Current function signatures, parameters, return types
- **Breaking Changes**: Immediate awareness of deprecated patterns

## The Context7 Cycle

### 1. QUERY Phase (Before Implementation)

**MANDATORY Steps:**
1. Read command/agent file to extract `**Documentation Queries:**` section
2. Query EACH Context7 MCP link listed
3. Analyze results for relevant patterns, APIs, and best practices
4. Summarize key findings before proceeding

**Required Information:**
- Current API signatures and parameters
- Recommended patterns and anti-patterns
- Breaking changes from recent versions
- Official code examples

### 2. IMPLEMENT Phase (Using Context7 Knowledge)

**Requirements:**
- Apply patterns EXACTLY as documented in Context7 results
- Use API signatures from Context7 (not from training data)
- Follow architectural recommendations from live docs
- Reference Context7 findings in code comments where applicable

**Verification:**
- Cross-check implementation against Context7 examples
- Validate parameters match current API documentation
- Ensure no deprecated patterns are used

### 3. VALIDATE Phase (Post-Implementation)

**Mandatory Checks:**
- Implementation matches Context7 best practices
- No training data hallucinations introduced
- Code follows latest framework conventions
- All deprecation warnings addressed

## Enforcement Rules

### ABSOLUTE REQUIREMENTS

**For ALL Commands:**
- MUST read `## Required Documentation Access` section
- MUST query EVERY `mcp://context7/...` link before execution
- MUST summarize Context7 findings before proceeding
- MUST apply Context7 guidance in implementation

**For ALL Agents:**
- MUST read `**Documentation Queries:**` section
- MUST query Context7 before making technical decisions
- MUST verify API signatures against live documentation
- MUST flag conflicts between training data and Context7

**For ALL Implementations:**
- NO code based solely on training data for technical specifics
- NO assumptions about API signatures without Context7 verification
- NO "I think this is how it works" - VERIFY with Context7
- NO skipping Context7 "because it's a small change"

### PROHIBITED PRACTICES

- ❌ Implementing without querying Context7 first
- ❌ "I remember how this works" - training data is stale
- ❌ Skipping Context7 for "simple" or "obvious" tasks
- ❌ Using cached knowledge instead of live documentation
- ❌ Proceeding when Context7 query fails (STOP and report)
- ❌ Ignoring Context7 guidance because training data "seems better"

## Query Quality Standards

### Effective Context7 Queries

**DO:**
- ✅ Query ALL links in Documentation Queries section
- ✅ Request specific topics relevant to the task
- ✅ Ask for code examples and patterns
- ✅ Verify API signatures and parameters
- ✅ Check for breaking changes and migrations

**DON'T:**
- ❌ Skip queries assuming training data is sufficient
- ❌ Query only one link when multiple are listed
- ❌ Accept generic results - request specifics
- ❌ Ignore version mismatches in results

### Coverage Requirements

- **100% Query Rate**: Every command/agent execution queries Context7
- **Complete Coverage**: ALL listed Context7 links must be queried
- **Result Validation**: Verify Context7 returned relevant information
- **Fallback Protocol**: If Context7 fails, STOP and report (don't proceed with stale data)

## Integration with Workflow

### Command Execution Flow

```
User executes command: /pm:epic-decompose feature-name

BEFORE execution:
1. Read .claude/commands/pm/epic-decompose.md
2. Extract Documentation Queries section:
   - mcp://context7/agile/epic-decomposition
   - mcp://context7/agile/task-sizing
   - mcp://context7/agile/user-stories
   - mcp://context7/project-management/task-breakdown
3. Query Context7 for EACH link
4. Summarize findings: "Context7 confirms INVEST criteria for user stories..."
5. PROCEED with command execution using Context7 guidance

DURING execution:
- Apply Context7 patterns
- Reference Context7 examples
- Follow Context7 best practices

AFTER execution:
- Validate against Context7 standards
- Flag any deviations from documentation
```

### Agent Invocation Flow

```
User invokes agent: @aws-cloud-architect design VPC

BEFORE invocation:
1. Read .claude/agents/cloud/aws-cloud-architect.md
2. Extract Documentation Queries section:
   - mcp://context7/aws/compute
   - mcp://context7/aws/networking
   - mcp://context7/terraform/aws
3. Query Context7 for EACH link
4. Summarize: "Context7 shows VPC best practices: /16 for staging, /20 for prod..."
5. PROCEED with agent work using Context7 knowledge

DURING agent work:
- Use current AWS API patterns from Context7
- Apply Terraform AWS provider patterns from Context7
- Follow networking best practices from Context7

AFTER agent work:
- Cross-check VPC design against Context7 recommendations
- Ensure no deprecated patterns used
```

## Violation Consequences

**If Context7 enforcement is violated:**

### Immediate Actions

1. **STOP** execution immediately
2. **IDENTIFY** what was implemented without Context7 verification
3. **DELETE** code based on potentially stale training data
4. **QUERY** Context7 for the relevant documentation
5. **REIMPLEMENT** using Context7 guidance
6. **DOCUMENT** violation and correction

### Severity Levels

**Level 1 - Minor (Warning):**
- Partial Context7 queries (some links skipped)
- Action: Complete missing queries, validate implementation

**Level 2 - Moderate (Correction Required):**
- No Context7 queries performed
- Action: Stop, query Context7, review implementation

**Level 3 - Critical (Revert and Redo):**
- Implementation contradicts Context7 documentation
- Action: Delete code, start over with Context7 guidance

### No Exceptions Policy

- NO "small changes" exceptions
- NO "I'm confident this is right" exceptions
- NO "Context7 is slow" exceptions
- NO "training data matches Context7" assumptions

## Success Metrics

### Compliance Indicators

- ✅ 100% of commands query Context7 before execution
- ✅ 100% of agents query Context7 before implementation
- ✅ Zero implementations based solely on training data
- ✅ All API signatures verified against live documentation
- ✅ No deprecated patterns in codebase
- ✅ Context7 findings documented in comments/commits

### Quality Indicators

- ✅ Implementation matches Context7 examples
- ✅ No "unexpected behavior" due to API changes
- ✅ Code follows latest framework conventions
- ✅ Breaking changes identified and addressed proactively

## Automation and Enforcement

### Pre-Command Hook

File: `.claude/hooks/pre-command-context7.js`

**Purpose**: Automatically extract and query Context7 before command execution

**Behavior**:
1. Intercept command execution
2. Read command file from `.claude/commands/{category}/{command}.md`
3. Extract `**Documentation Queries:**` section
4. Query Context7 MCP for each link
5. Inject results into command context
6. Proceed with execution

### Pre-Agent Hook

File: `.claude/hooks/pre-agent-context7.js`

**Purpose**: Automatically extract and query Context7 before agent invocation

**Behavior**:
1. Intercept agent invocation
2. Read agent file from `.claude/agents/{category}/{agent}.md`
3. Extract `**Documentation Queries:**` section
4. Query Context7 MCP for each link
5. Inject results into agent context
6. Proceed with agent work

### Validation Rule

File: `.claude/rules/context7-enforcement.md` (this file)

**Purpose**: Remind Claude to ALWAYS query Context7

**Enforcement**:
- Read by Claude on every session start
- Highest priority in rule hierarchy
- Zero tolerance for violations

## Emergency Fallback

**If Context7 MCP is unavailable:**

1. **ALERT** user immediately: "⚠️ Context7 MCP unavailable - cannot verify documentation"
2. **REQUEST** user decision:
   - WAIT for Context7 to become available (RECOMMENDED)
   - PROCEED with explicit user acknowledgment and risk acceptance
3. **DOCUMENT** in code: `// WARNING: Implemented without Context7 verification - Context7 MCP was unavailable`
4. **FLAG** for review: Add TODO to re-verify with Context7 when available

**DO NOT:**
- ❌ Silently proceed without Context7
- ❌ Assume training data is sufficient
- ❌ Skip documentation queries

## Related Rules

- **TDD Enforcement** (`.claude/rules/tdd.enforcement.md`) - Tests first, always
- **Agent Usage** (`.claude/rules/agent-usage.md`) - When to use specialized agents
- **Code Quality** (`.claude/rules/code-quality.md`) - Standards and anti-patterns

## Final Reminder

> **Context7 is NOT optional. It is MANDATORY for EVERY command and agent execution.**
>
> Training data becomes stale. APIs change. Best practices evolve.
>
> Context7 keeps us current. Query it. Every. Single. Time.
