# Context7 Mandatory Rule - HIGHEST PRIORITY

**PRIORITY:** 🔴 CRITICAL - This rule OVERRIDES all other considerations

## 📜 Zero Tolerance Policy

When a command or agent specifies **"Documentation Queries"** section with Context7 links:

### ❌ PROHIBITED:
- Skipping Context7 queries
- Using training data instead of Context7
- Proceeding without querying
- Ignoring mandatory queries

### ✅ REQUIRED:
- Query Context7 FIRST, before any implementation
- Use results to guide implementation
- Verify API signatures against Context7 docs
- Apply latest best practices from Context7

---

## 🚨 Enforcement

**If a command has "Documentation Queries" section:**

1. **STOP** - Do not proceed with implementation yet
2. **QUERY** - Use Context7 MCP to fetch each listed documentation
3. **APPLY** - Use Context7 results in your implementation
4. **VERIFY** - Check that your code matches Context7 patterns

**Example - Correct Flow:**

```
User: /pm:epic-decompose my-feature

Claude reads: epic-decompose.md has Documentation Queries:
  - mcp://context7/agile/epic-decomposition
  - mcp://context7/agile/task-sizing
  - mcp://context7/agile/user-stories

Claude: "I see this command requires Context7 queries. Let me fetch them first..."

[Queries Context7 using MCP]

Claude: "Based on Context7 documentation, I'll apply:
  - INVEST criteria from agile/user-stories
  - Task sizing patterns from agile/task-sizing
  - Decomposition strategies from agile/epic-decomposition

Now creating tasks..."
```

---

## 🎯 Why This is Critical

**Training Data is Stale:**
- My training ended January 2025
- Frameworks update constantly
- Best practices evolve
- API signatures change

**Context7 is Current:**
- Live documentation
- Latest patterns
- Current API signatures
- Up-to-date best practices

**Consequences of Skipping:**
- Outdated patterns applied
- Deprecated APIs used
- Anti-patterns introduced
- Incorrect assumptions

---

## 🔍 Verification Checklist

Before implementing ANY command with Documentation Queries:

- [ ] I have read the "Documentation Queries" section
- [ ] I have queried EACH Context7 link using MCP
- [ ] I have the Context7 results in my context
- [ ] I am using Context7 patterns, not just training data
- [ ] My implementation matches Context7 documentation

---

## 📋 Command Examples

### epic-decompose.md
```markdown
**Documentation Queries:**
- `mcp://context7/agile/epic-decomposition`
- `mcp://context7/agile/task-sizing`
- `mcp://context7/agile/user-stories`
```

**Enforcement:** MUST query all 3 before creating tasks

### Agents (e.g., javascript-frontend-engineer.md)
```markdown
**Documentation Queries (Technical):**
- `mcp://context7/javascript/latest`
- `mcp://context7/typescript/latest`

**Documentation Queries (Task Creation):**
- `mcp://context7/agile/task-breakdown`
- `mcp://context7/agile/user-stories`
```

**Enforcement:** MUST query all 4 when creating tasks

---

## 🎓 User Communication

When user asks: "Did you use Context7?"

**Correct Answer:**
"Yes! I queried:
- [list each Context7 query]

And applied:
- [specific patterns/practices from Context7]

Here's what I learned from Context7:
- [key takeaways]"

**Incorrect Answer:**
"No" or "I used my training data" or "I skipped Context7"

---

## 🚀 Integration with Existing Rules

This rule has **EQUAL PRIORITY** with:
- TDD enforcement (`.claude/rules/tdd.enforcement.md`)
- Context7 enforcement for commands (`.claude/rules/context7-enforcement.md`)

**Order of Operations:**
1. Read command/agent file
2. See "Documentation Queries" section
3. **STOP and QUERY Context7** (this rule)
4. Apply TDD requirements (tdd.enforcement.md)
5. Implement using Context7 patterns

---

## 🔧 Implementation Protocol

### For Commands:
```
1. User: /pm:some-command
2. Read: .claude/commands/pm/some-command.md
3. Find: "Documentation Queries" section
4. Query: Each mcp://context7/... link
5. Apply: Context7 patterns in execution
6. Verify: Output matches Context7 standards
```

### For Agent Invocations:
```
1. Command invokes: @some-agent create tasks
2. Agent reads: Its own .md file
3. Find: "Documentation Queries (Task Creation)" section
4. Query: Each mcp://context7/... link
5. Apply: Both technical + task creation patterns
6. Verify: Tasks follow INVEST + tech best practices
```

---

## ❓ FAQ

**Q: What if Context7 is unavailable?**
A: STOP. Do not proceed. Inform user that Context7 is required and implementation cannot continue without it.

**Q: What if I already know the answer?**
A: Still query Context7. Your training data may be outdated. Verify against live docs.

**Q: Can I skip queries for simple tasks?**
A: NO. If command has Documentation Queries, they are MANDATORY regardless of task complexity.

**Q: What if Context7 contradicts my training data?**
A: ALWAYS use Context7. It has current, authoritative information.

---

## 🎯 Success Criteria

**This rule is successful when:**
- ✅ 100% of commands with Documentation Queries use Context7
- ✅ 100% of agent task creation uses Context7
- ✅ 0% implementation from training data alone
- ✅ User can verify Context7 was used by asking

**This rule fails when:**
- ❌ Context7 queries are skipped
- ❌ Training data used instead of Context7
- ❌ Implementation proceeds without querying
- ❌ User asks "did you use Context7?" and answer is "no"

---

**REMEMBER:** Context7 queries are not optional. They are MANDATORY. Zero tolerance.

When you see "Documentation Queries" → STOP → QUERY → APPLY → VERIFY
