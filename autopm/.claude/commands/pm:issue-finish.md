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

### 2. Quality gate

```bash
/quality-gate || exit 1
```

### 3. Commit unstaged changes

```bash
git diff --quiet && git diff --staged --quiet || {
  git add -A
  git commit -m "chore: pre-PR cleanup"
}
```

### 4. Push branch

```bash
git push origin "$CURRENT_BRANCH" || { echo "❌ Push failed: git push origin $CURRENT_BRANCH"; exit 1; }
```

### 5. Get issue title

```bash
ISSUE_TITLE=$(gh issue view "$ISSUE_NUMBER" --json title -q .title) || {
  echo "❌ Cannot fetch issue #$ISSUE_NUMBER: gh issue view $ISSUE_NUMBER"
  exit 1
}
```

### 6. Create PR

```bash
COVERAGE_TABLE="| Metric | Threshold | Status |
|--------|-----------|--------|
| Lines | 80% | ✅/❌ |
| Branches | 75% | ✅/❌ |
| Functions | 80% | ✅/❌ |
| Statements | 80% | ✅/❌ |"

gh pr create \
  --title "$ISSUE_TITLE" \
  --base develop \
  --body "Closes #$ISSUE_NUMBER

## Coverage

$COVERAGE_TABLE" \
  --label "in-progress"
```

### 7. Output

```
✅ PR created: <PR_URL>
Waiting for review. Run /pm:review-fix after Copilot comments.
```

## Error Handling

- On main/develop: `❌ Must be on a feature branch, not main/develop`
- No issue number: `❌ Cannot detect issue number from '<branch>'. Usage: /pm:issue-finish <number>`
- Quality gate fails: `/quality-gate` exits non-zero — fix failures and re-run
- Push fails: `❌ Push failed: git push origin <branch>`
