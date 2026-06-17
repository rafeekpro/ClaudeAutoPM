---
allowed-tools: Bash, Read, Edit
---

---

## pm:review-fix

Process Copilot review and fix all issues on the current PR.

Fix priority order: **error** first, then **style**, then **comment**.

## Required Documentation Access

**MANDATORY:** Query Context7 for project-management best practices before proceeding. Use the standard PM query set in `.claude/rules/context7-required.md`.

## Steps

### 1. Detect current PR

```bash
gh pr view --json number,url,headRefName,reviewThreads
```

If this fails: `❌ No open PR for current branch. Run: /pm:issue-finish <number>`

Store the `reviewThreads` array — each thread has `comments`, `isResolved`, and `path`.

### 2. Parse and group open review threads

Filter threads where `isResolved` is `false`. Group by severity:

- **error** — compilation failures, test failures, security issues, broken logic
- **style** — naming, formatting, whitespace, conventions
- **comment** — questions, suggestions, nitpicks

### 3. Fix in priority order

Work through groups in order: **error** → **style** → **comment**

- **error**: Must fix. Use `@code-analyzer` when a fix touches multiple files.
- **style**: Fix if straightforward.
- **comment**: Respond inline if no code change is needed.

Track per-thread status as one of:
- `fixed` — code change applied
- `responded` — replied inline, no code change
- `skipped` — out of scope or cannot reproduce

### 4. Run full test suite

Delegate to `@test-runner`:

```
Run the full test suite with: npm test
```

Do not push if tests fail. **BLOCK on failure** — report which tests are failing and stop.

### 5. Push fixes

Only run this if tests pass:

```bash
git push origin $(git branch --show-current)
```

### 6. Update PR status

```bash
gh pr comment --body "All review threads addressed. Re-requesting review."
```

### 7. Output summary

```
✅ Review processed
  - fixed: N
  - responded: M
  - skipped: K
Tests: green
PR: pushed and updated
```

## Error Handling

- No open PR: `❌ No PR found: Run /pm:issue-finish <number>`
- Tests fail after fixes: `❌ Tests failing — push blocked. Fix failures before retrying.`
- Push fails: `❌ Push failed: git push origin <branch>`
