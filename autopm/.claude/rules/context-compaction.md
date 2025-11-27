# Context Compaction Rules - MANDATORY

> **CRITICAL**: Apply these compaction strategies to prevent context window exhaustion during long sessions.

## Core Principle

**Context is a finite resource.** Every token matters. Compact aggressively, preserve strategically.

## Automatic Compaction Triggers

### Trigger 1: Tool Result Accumulation

**When**: 10+ tool results in session

**Action**: Summarize older tool results

```markdown
# BEFORE (consuming ~5000 tokens per result)
Tool Result 1: [full 500-line file]
Tool Result 2: [full 300-line file]
...
Tool Result 15: [full 200-line file]

# AFTER (consuming ~200 tokens per summary)
## Compacted Tool Results
- config.json: DB settings (PostgreSQL:5432), API keys, feature flags
- src/auth.js: Authentication module with login/logout/validateToken
- package.json: Node 18, React 18, Express 4, Jest testing
...
```

### Trigger 2: Code Block Proliferation

**When**: Same file read 3+ times OR 10+ different files read

**Action**: Consolidate to essential references

```markdown
# BEFORE
[src/auth.js - first read - 200 lines]
[src/auth.js - second read after edit - 205 lines]
[src/auth.js - third read to verify - 205 lines]

# AFTER
## src/auth.js Summary
- Purpose: User authentication with JWT
- Key functions: login(email, password), validateToken(jwt), refreshToken()
- Modified sections: lines 45-60 (added MFA check)
- Current length: 205 lines
- Last state: MFA integrated, tests passing
```

### Trigger 3: Thinking Block Growth

**When**: Multiple extended reasoning chains completed

**Action**: Compress to decisions and rationale

```markdown
# BEFORE
<thinking>
Let me analyze this step by step...
First, I should consider option A because...
Actually, option B might be better since...
On further reflection, option A is correct because...
[500+ tokens of reasoning]
</thinking>

# AFTER
## Decision: Option A (Authentication Strategy)
- Choice: JWT with refresh tokens
- Rationale: Stateless architecture, better scalability
- Rejected: Sessions (state management complexity)
```

### Trigger 4: Conversation Length

**When**: 30+ messages in session

**Action**: Summarize completed topics

```markdown
# BEFORE
[Messages 1-15: Debugging authentication issue]
[Messages 16-25: Implementing MFA]
[Messages 26-35: Current work on dashboard]

# AFTER
## Session Summary (Messages 1-25)
### Completed: Authentication Debugging
- Issue: Token validation failing on refresh
- Fix: Updated expiry check in validateToken()
- PR: #123 merged

### Completed: MFA Implementation
- Added TOTP support
- Backup codes generated
- Tests: 15/15 passing

## Active Context (Messages 26+)
[Current dashboard implementation work...]
```

## Compaction Formats

### Format 1: File Summary

```markdown
## File: [path]
- Purpose: [one-line description]
- Key exports: [list main functions/classes]
- Dependencies: [external dependencies]
- Modified: [what changed, if applicable]
- State: [current state/version]
```

### Format 2: Search Results Summary

```markdown
## Search: [query]
- Total matches: [count]
- Key files: [most relevant files]
- Pattern: [what the matches reveal]
- Action needed: [what to do with this info]
```

### Format 3: Test Results Summary

```markdown
## Tests: [suite/file]
- Status: [PASS/FAIL] ([passed]/[total])
- Failures: [list failing tests if any]
- Coverage: [percentage if available]
- Action: [what to fix/investigate]
```

### Format 4: Decision Record

```markdown
## Decision: [title]
- Choice: [what was decided]
- Rationale: [why, in one sentence]
- Rejected: [alternatives not chosen]
- Impact: [what this affects]
```

## Preservation Rules

### ALWAYS Preserve

1. **Active Task Context**
   - Current file being edited
   - Unsaved changes
   - Active error messages

2. **Critical Decisions**
   - Architectural choices
   - Security configurations
   - Breaking changes

3. **Blocking Issues**
   - Current errors
   - Failing tests
   - Unresolved dependencies

4. **User Requirements**
   - Original request
   - Constraints specified
   - Preferences stated

### SAFE to Compact

1. **Historical Tool Results**
   - Files read 5+ messages ago
   - Search results already acted upon
   - Test results from passing suites

2. **Superseded Information**
   - Old file versions
   - Rejected approaches
   - Fixed bugs

3. **Verbose Output**
   - Full stack traces (keep summary)
   - Build logs (keep errors only)
   - Long lists (keep relevant items)

4. **Exploratory Work**
   - Hypothesis testing completed
   - Alternative approaches evaluated
   - Research phase findings

## Implementation Patterns

### Pattern 1: Progressive Summarization

```markdown
# Level 0: Full content (initial read)
[Complete file: 500 lines]

# Level 1: Key sections (after analysis)
## Key Sections in config.json
- Database config (lines 1-50)
- API settings (lines 51-100)
- Feature flags (lines 101-150)

# Level 2: Actionable summary (after decision)
config.json: Using PostgreSQL on 5432, rate limit 100/min, darkMode enabled
```

### Pattern 2: Rolling Window

Keep last N items in full detail, summarize older:

```markdown
## Recent (full detail)
- Tool Result 8: [full content]
- Tool Result 9: [full content]
- Tool Result 10: [full content]

## Historical (summarized)
- Results 1-7: config files read, auth system analyzed,
  tests confirmed passing, dependencies validated
```

### Pattern 3: Topic-Based Grouping

Group related items for efficient summarization:

```markdown
## Authentication Work (compacted)
Files read: src/auth.js, src/middleware/auth.js, src/models/User.js
Changes made: Added MFA support (auth.js:45-60)
Tests: 15/15 passing
Outcome: MFA feature complete

## Database Work (compacted)
Files read: src/db/connection.js, migrations/*.js
Changes made: Added index on users.email
Tests: 8/8 passing
Outcome: Query performance improved 40%
```

## Enforcement

### Self-Check Questions

Before adding new content, ask:
1. Is this information already in context (in another form)?
2. Will this be needed after the current operation?
3. Can this be summarized without losing actionable details?
4. Does this duplicate information from another tool result?

### Compaction Checklist

When context feels heavy:
- [ ] Summarize tool results older than 5 messages
- [ ] Compress completed reasoning chains
- [ ] Consolidate multiple reads of same file
- [ ] Remove superseded information
- [ ] Group related items into summaries

### Warning Signs

**Immediate Action Needed:**
- Response times noticeably slower
- "Context too long" errors
- Repetitive information in context
- Multiple versions of same file
- 50+ messages without compaction

## Integration with /clear

### When to Compact vs Clear

| Situation | Action |
|-----------|--------|
| Same task, growing context | Compact |
| Task complete, starting new | /clear |
| Context heavy but continuity needed | Compact + Checkpoint |
| Unrelated topics mixing | /clear |
| Long research session | Compact progressively |

### Handoff Pattern

Before `/clear`, create transfer summary:

```markdown
## Session Transfer Summary

### Completed
- [list completed items]

### In Progress
- [current state]

### Preserved Context
- [critical information for next session]

### Next Steps
- [what to do next]
```

## Metrics

### Context Efficiency Score

Calculate: (Useful tokens / Total tokens) × 100

- **>80%**: Excellent - minimal waste
- **60-80%**: Good - some optimization possible
- **40-60%**: Fair - compaction recommended
- **<40%**: Poor - immediate compaction needed

### Token Budget Guidelines

| Session Type | Recommended Budget |
|--------------|-------------------|
| Quick fix | <20k tokens |
| Feature implementation | <50k tokens |
| Complex debugging | <80k tokens |
| Full project work | <100k tokens + checkpoints |

## Summary

**Golden Rules:**
1. Compact early, compact often
2. Preserve decisions, discard deliberation
3. Summarize verbose output immediately
4. Use progressive summarization
5. Create checkpoints for long work
6. /clear between unrelated tasks

**Remember**: A well-compacted context leads to better responses, faster processing, and more productive sessions.
