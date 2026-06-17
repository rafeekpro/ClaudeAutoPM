---
allowed-tools: Bash, Read
---

# pm:issue-finish

Complete an issue and open a PR after all quality gates pass.

## Usage

```
/pm:issue-finish [issue_number]
```

`issue_number` is optional — auto-detected from branch name if omitted.

## Required Documentation Access

**MANDATORY:** Query Context7 for project-management best practices before proceeding. Use the standard PM query set in `.claude/rules/context7-required.md`.

## Steps

### 1. Pre-flight

```bash
# Branch guard — must not be on main or develop
CURRENT_BRANCH=$(git branch --show-current)
if echo "$CURRENT_BRANCH" | grep -qE '^(main|develop)$'; then
  echo "❌ Must be on a feature branch, not main/develop"
  exit 1
fi

# Resolve issue number: explicit arg first, then extract from branch name
if [ -n "$ARGUMENTS" ]; then
  ISSUE_NUMBER="$ARGUMENTS"
else
  ISSUE_NUMBER=$(echo "$CURRENT_BRANCH" | grep -oE '[0-9]+' | head -1)
fi
[ -z "$ISSUE_NUMBER" ] && {
  echo "❌ Cannot detect issue number from '$CURRENT_BRANCH'. Usage: /pm:issue-finish <number>"
  exit 1
}
echo "Issue: #$ISSUE_NUMBER  Branch: $CURRENT_BRANCH"
```

### 2. Quality gate — tests

Delegate to `@test-runner`:

```
Run the full test suite: npm test
Do not proceed if any tests fail.
```

**BLOCK on failure** — if tests fail, stop here and report which tests are failing. No PR created.

### 3. Quality gate — coverage

```bash
npm run test:coverage -- --coverageReporters=json-summary 2>/dev/null
LINES=$(node -e "const c=require('./coverage/coverage-summary.json').total; console.log(c.lines.pct)")
BRANCHES=$(node -e "const c=require('./coverage/coverage-summary.json').total; console.log(c.branches.pct)")
FUNCTIONS=$(node -e "const c=require('./coverage/coverage-summary.json').total; console.log(c.functions.pct)")
STATEMENTS=$(node -e "const c=require('./coverage/coverage-summary.json').total; console.log(c.statements.pct)")

# Thresholds: lines >= 80%, branches >= 75%, functions >= 80%, statements >= 80%
LINES_OK=$(node -e "process.exit(parseFloat('$LINES') >= 80 ? 0 : 1)" && echo "✅" || echo "❌")
BRANCHES_OK=$(node -e "process.exit(parseFloat('$BRANCHES') >= 75 ? 0 : 1)" && echo "✅" || echo "❌")
FUNCTIONS_OK=$(node -e "process.exit(parseFloat('$FUNCTIONS') >= 80 ? 0 : 1)" && echo "✅" || echo "❌")
STATEMENTS_OK=$(node -e "process.exit(parseFloat('$STATEMENTS') >= 80 ? 0 : 1)" && echo "✅" || echo "❌")

if [ "$LINES_OK" = "❌" ] || [ "$BRANCHES_OK" = "❌" ] || [ "$FUNCTIONS_OK" = "❌" ] || [ "$STATEMENTS_OK" = "❌" ]; then
  echo "❌ Coverage below threshold — no PR created. Add tests to meet minimums."
  exit 1
fi
```

### 4. Linters

```bash
npx eslint . || { echo "❌ ESLint failed — fix linting errors before creating PR"; exit 1; }
npx prettier --check . || { echo "❌ Prettier check failed — run: npx prettier --write ."; exit 1; }
```

### 5. Commit unstaged changes

```bash
git diff --quiet && git diff --staged --quiet || {
  git add -A
  git commit -m "chore: pre-PR cleanup"
}
```

### 6. Push branch

```bash
git push origin "$CURRENT_BRANCH" || { echo "❌ Push failed: git push origin $CURRENT_BRANCH"; exit 1; }
```

### 7. Get issue title

```bash
ISSUE_TITLE=$(gh issue view "$ISSUE_NUMBER" --json title -q .title) || {
  echo "❌ Cannot fetch issue #$ISSUE_NUMBER: gh issue view $ISSUE_NUMBER"
  exit 1
}
```

### 8. Create PR

```bash
gh pr create \
  --title "$ISSUE_TITLE" \
  --base develop \
  --body "## Coverage

| Metric     | Result         | Threshold | Status         |
|------------|----------------|-----------|----------------|
| Lines      | ${LINES}%      | 80%       | $LINES_OK      |
| Branches   | ${BRANCHES}%   | 75%       | $BRANCHES_OK   |
| Functions  | ${FUNCTIONS}%  | 80%       | $FUNCTIONS_OK  |
| Statements | ${STATEMENTS}% | 80%       | $STATEMENTS_OK |

Closes #$ISSUE_NUMBER" \
  --label "in-progress"
```

### 9. Output

```
✅ PR created: <PR_URL>
Waiting for review. Run /pm:review-fix after Copilot comments.
```

## Error Handling

- On main/develop: `❌ Must be on a feature branch, not main/develop`
- No issue number: `❌ Cannot detect issue number from '<branch>'. Usage: /pm:issue-finish <number>`
- Tests fail: stop and report failing tests, no PR created
- Coverage gate: `❌ Coverage below threshold — no PR created. Add tests to meet minimums.`
- Linter fails: `❌ ESLint failed` / `❌ Prettier check failed`
- Push fails: `❌ Push failed: git push origin <branch>`
