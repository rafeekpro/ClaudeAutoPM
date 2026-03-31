---
name: pm:test-plan
description: Generate test plan from epic acceptance criteria
---

# /pm:test-plan

Generate a test plan from acceptance criteria found in epics and tasks.

## What it does

1. Scans `.claude/epics/` for markdown files with `- [ ]` checkboxes
2. Extracts each checkbox as a test case
3. Infers test type (unit, integration, e2e) from the text
4. Generates a test plan table at `.claude/pm/test-plan.md`

## Usage

```
/pm:test-plan
```

## Implementation

Run the test plan generator:

```bash
node .claude/scripts/pm/test-plan.js
```

Report the output to the user. If no epics with acceptance criteria are found, suggest creating epics with `- [ ]` checkbox items.
