---
allowed-tools: Read, Bash
---

# Handoff

Generate a compact context primer to paste immediately after `/compact`. Keeps primer under 200 words so it fits a fresh context window.

## Instructions

### Step 1 — Capture current state

Run these shell commands to collect context:

```bash
# Current branch (fallback: "unknown" if detached HEAD or not on a feature branch)
BRANCH=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
[ -z "$BRANCH" ] && BRANCH="unknown"

# Issue number from branch name (e.g. feature/654-handoff → #654)
ISSUE=$(echo "$BRANCH" | grep -oE '[0-9]+' | head -1 || echo "")
[ -n "$ISSUE" ] && ISSUE="#$ISSUE" || ISSUE="(no issue)"

# Files modified in this session
MODIFIED=$(git diff --name-only HEAD 2>/dev/null | head -10 | tr '\n' ', ' | sed 's/, $//')
[ -z "$MODIFIED" ] && MODIFIED="(none)"

# Last 3–5 meaningful commits
COMMITS=$(git log --oneline -5 2>/dev/null | sed 's/^/  /')
```

Also read any active task notes or recent CLAUDE.md entries to identify what was just completed and what the next concrete step is. If no task context is available, summarise the most recent commit message as "Just completed."

### Step 2 — Write handoff file

```bash
TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
HANDOFF_FILE="/tmp/handoff-${TIMESTAMP}.md"
```

Write the primer to `$HANDOFF_FILE`:

```bash
cat > "$HANDOFF_FILE" <<EOF
Context: $ISSUE — ${BRANCH}. Branch: ${BRANCH}.
Just completed: [most recent work from commits/task].
Modified: ${MODIFIED}.
Next: [next concrete action].
Relevant constraints: check CLAUDE.md for non-obvious rules.
Continue.
EOF
```

### Step 3 — Generate primer

Compose the final primer (≤ 200 words):

```
Context: <issue-ref> (<brief title>). Branch: <branch-name>.
Just completed: <what was just finished>.
Modified: <file1>, <file2>.
Next: <single concrete next action>.
Relevant constraints: <any non-obvious rule from CLAUDE.md or memories>.
Continue.
```

Use real values from Step 1. If not on a feature branch (e.g. on `main`, `develop`, or detached HEAD), set the context line to `Context: (no active feature branch). Branch: <branch-name>.` as a fallback.

### Step 4 — Print primer

Output exactly this format:

```
📋 Handoff ready — copy everything between the lines:
────────────────────────────────────────
Context: <issue-ref> (<brief title>). Branch: <branch-name>.
Just completed: <completed work>.
Modified: <file list>.
Next: <next action>.
Relevant constraints: <constraints or "none">.
Continue.
────────────────────────────────────────
Saved to: /tmp/handoff-${TIMESTAMP}.md
```
