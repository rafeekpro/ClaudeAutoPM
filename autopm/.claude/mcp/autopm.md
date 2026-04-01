---
name: autopm
command: node
args: [".claude/scripts/mcp/autopm-server.js"]
description: AutoPM project management — issues, epics, PRDs, learnings, checkpoints
category: project-management
status: inactive
---

# AutoPM MCP Server

Local MCP server exposing AutoPM project management data. Reuses local providers — same data as slash commands.

## Tools (13)
- `autopm_list_issues` — list issues (filter by status)
- `autopm_show_issue` — issue details
- `autopm_create_issue` — create new issue
- `autopm_start_issue` — start working (set in_progress)
- `autopm_close_issue` — close issue
- `autopm_list_epics` — list epics with progress
- `autopm_show_epic` — epic with tasks
- `autopm_list_prds` — list PRDs
- `autopm_show_prd` — PRD details
- `autopm_status` — project overview
- `autopm_learn` — save learning
- `autopm_recall` — get learnings
- `autopm_checkpoint` — create checkpoint

## Resources (5)
- `autopm://config` — config.json
- `autopm://agents` — agent-registry.xml
- `autopm://events` — recent events
- `autopm://learnings` — all learnings
- `autopm://test-plan` — test plan

## Prompts (3)
- `autopm_issue_template` — issue XML template
- `autopm_prd_template` — PRD XML template
- `autopm_epic_template` — epic XML template

## Enable
```bash
autopm mcp enable autopm
```
