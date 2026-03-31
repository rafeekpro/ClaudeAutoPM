---
allowed-tools: Bash, Read
---

# PM Dashboard

Generate self-contained HTML dashboard with project overview.

## Usage

```bash
node .claude/scripts/pm/dashboard.js
```

## What it generates

HTML file at `.claude/pm/dashboard.html` with:
- PRD/Epic/Issue counts and status breakdown
- Epic progress bars with task completion
- Recent activity from JSONL event log
- Dark theme, inline CSS, zero external dependencies

Opens automatically in default browser.
