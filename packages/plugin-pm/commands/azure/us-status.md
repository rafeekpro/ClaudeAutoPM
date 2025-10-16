---
allowed-tools: Task, Bash, Read, Write, WebFetch, Glob, Grep
---

# Azure DevOps User Story Status

Show comprehensive status of User Stories with task progress and metrics.

**Usage**: `/azure:us-status [user-story-id] [--sprint=<name>] [--format=<type>]`

**Examples**:
- `/azure:us-status` - Status of all active User Stories
- `/azure:us-status 34` - Detailed status of specific User Story
- `/azure:us-status --sprint="Sprint 1"` - Sprint-specific status
- `/azure:us-status --format=burndown` - Show burndown chart

## Required Environment Variables

Ensure `.claude/.env` contains:

```bash
AZURE_DEVOPS_PAT=<your-pat-token>
AZURE_DEVOPS_ORG=<your-organization>
AZURE_DEVOPS_PROJECT=<your-project>
```

## Required Documentation Access

**MANDATORY:** Before Azure DevOps integration and agile workflows, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/azure-devops/boards` - boards best practices
- `mcp://context7/agile/user-stories` - user stories best practices
- `mcp://context7/project-management/work-items` - work items best practices
- `mcp://context7/agile/sprint-planning` - sprint planning best practices

**Why This is Required:**
- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions


## Instructions

### 1. Query Mode

Determine display based on arguments:
- **No args**: Show all active stories dashboard
- **Story ID**: Deep dive into specific story
- **Sprint filter**: Sprint-focused view
- **Format option**: Specialized visualizations

### 2. Status Displays

#### Single User Story Status

```
📊 User Story #34: Implement user password reset
Status: 🔄 Active | Sprint: Sprint 1 | Points: 8

📈 Progress Overview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tasks:     ████████████░░░░░░░░  60% (3/5 completed)
Hours:     ███████████░░░░░░░░░░  55% (15h/27h completed)
Quality:   ████████████████████░  95% (tests passing)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Task Breakdown:
┌─────┬──────────────────────┬────────┬──────────┬────────┬─────────┐
│ ID  │ Task                 │ Status │ Assignee │ Hours  │ Branch  │
├─────┼──────────────────────┼────────┼──────────┼────────┼─────────┤
│ 101 │ Technical Design     │ ✅     │ John     │ 4h/4h  │ merged  │
│ 102 │ Implementation       │ ✅     │ John     │ 10h/12h│ merged  │
│ 103 │ Unit tests          │ ✅     │ Sarah    │ 4h/4h  │ merged  │
│ 104 │ Integration tests    │ 🔄     │ Sarah    │ 2h/6h  │ task-104│
│ 105 │ Documentation       │ 🆕     │ -        │ 0h/3h  │ -       │
└─────┴──────────────────────┴────────┴──────────┴────────┴─────────┘

⏰ Timeline:
- Started: 3 days ago
- Est. Completion: 2 days
- Velocity: 5h/day
- Risk: Low ✅

🔗 Dependencies:
- Blocking: None
- Blocked by: API Gateway setup (#32)

💬 Recent Activity:
- 2h ago: Sarah started integration tests
- 5h ago: John completed implementation
- Yesterday: Code review approved

⚡ Recommended Actions:
1. Complete integration tests (Task #104)
2. Start documentation while tests run
3. Schedule demo for stakeholders
```

#### Sprint Dashboard View

```
🏃 Sprint 1 Status Dashboard
Days: 5/10 | Capacity: 45% used

User Stories Progress:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#34 Password Reset    ████████████░░░░░  70% [8pts]
#35 User Profile      ██████░░░░░░░░░░░  35% [5pts]
#36 OAuth Login       ████████████████░  90% [13pts]
#37 Search Feature    ██░░░░░░░░░░░░░░░  10% [8pts]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Sprint Metrics:
┌────────────────┬───────┬────────┬─────────┐
│ Metric         │ Plan  │ Actual │ Status  │
├────────────────┼───────┼────────┼─────────┤
│ Story Points   │ 34    │ 15     │ ⚠️ Behind│
│ Tasks Complete │ 20    │ 12     │ ⚠️ At Risk│
│ Hours Burned   │ 100h  │ 45h    │ ✅ On Track│
│ Defects Found  │ <5    │ 2      │ ✅ Good  │
└────────────────┴───────┴────────┴─────────┘

👥 Team Performance:
- John: 3 tasks complete, 2 in progress
- Sarah: 2 tasks complete, 1 in progress
- Mike: 1 task complete, 3 in progress
- Unassigned: 8 tasks

⚠️ Risks & Blockers:
1. OAuth integration delayed (external dependency)
2. Search feature needs design review
3. Mike overloaded - consider redistribution
```

#### Burndown Chart

```
📉 Sprint Burndown Chart

Hours
120 |■
110 |■■
100 |■■■ (Ideal)
 90 |■■■■■.
 80 |■■■■■■■■..
 70 |■■■■■■■■■■■...
 60 |■■■■■■■■■■■■■■■.. (Actual)
 50 |■■■■■■■■■■■■■■■■■■■
 40 |■■■■■■■■■■■■■■■■■■■■■
 30 |■■■■■■■■■■■■■■■■■■■■■■■
 20 |■■■■■■■■■■■■■■■■■■■■■■■■■
 10 |■■■■■■■■■■■■■■■■■■■■■■■■■■■
  0 +────────────────────────────→
    M  T  W  T  F  M  T  W  T  F
    ↑
    Today

Status: Slightly behind ideal pace
Projection: May need 1 extra day or scope reduction
```

### 3. Detailed Metrics

#### Velocity Analysis

```
📈 Velocity Trends

Story Points/Sprint
20 |      ■
18 |    ■ ■
16 |    ■ ■ ■
14 |  ■ ■ ■ ■
12 |■ ■ ■ ■ ■ (avg: 15)
10 |■ ■ ■ ■ ■
 8 |■ ■ ■ ■ ■
   └──────────────→
   S1 S2 S3 S4 S5

Current Sprint: Tracking at 13 points
Recommendation: Realistic capacity is 15 points
```

#### Quality Metrics

```
✅ Quality Dashboard

Test Coverage: ████████████████░░░░ 82%
Code Reviews:  ████████████████████ 100%
Bug Density:   ████░░░░░░░░░░░░░░░░ 2/story (Good)
Tech Debt:     ██████░░░░░░░░░░░░░░ 30% (Manage)

Recent Issues:
- 🐛 Bug #451: Login timeout (Fixed)
- 🐛 Bug #452: Validation error (In Progress)
- 💡 Improvement: Refactor auth service
```

### 4. Forecast & Predictions

```
🔮 Completion Forecast

Based on current velocity:
- Story #34: Complete by Thursday ✅
- Story #35: At risk - needs 2 more devs
- Story #36: On track for Friday
- Story #37: Won't complete this sprint ❌

Recommendations:
1. Move Story #37 to next sprint
2. Add Sarah to Story #35
3. Schedule sprint review for Friday PM
```

### 5. Export Formats

Support multiple export formats:

```bash
# Export as CSV
/azure:us-status --format=csv > sprint-status.csv

# Export as JSON for dashboards
/azure:us-status --format=json > status.json

# Generate HTML report
/azure:us-status --format=html > report.html

# Markdown for documentation
/azure:us-status --format=markdown > STATUS.md
```

### 6. Integration Status

Show CI/CD and PR status:

```
🔄 Integration Status

Story #34: Password Reset
├── PR #456: ✅ Merged
├── PR #457: 👀 In Review (2 approvals needed)
├── PR #458: 🚧 Draft
│
├── CI/CD Pipeline:
│   ├── Build: ✅ Passing
│   ├── Tests: ✅ 157/157 passing
│   ├── Security: ⚠️ 1 medium issue
│   └── Deploy: ⏸️ Waiting
│
└── Environments:
    ├── Dev: ✅ Deployed (v1.2.3-rc1)
    ├── Staging: ⏳ Scheduled for tonight
    └── Prod: 📅 Planned for Monday
```

### 7. Alerts & Notifications

Highlight important status changes:

```
🔔 Alerts

⚠️ HIGH: Story #35 blocked by external API
⏰ MEDIUM: Story #36 review needed today
📌 LOW: Update estimates for Story #37

Would you like to:
1. View blocker details
2. Send review reminder
3. Re-estimate story
4. Dismiss alerts

Select (1-4): _
```

## Smart Features

### Predictive Analytics
- Estimate completion dates
- Identify at-risk stories
- Suggest resource reallocation

### Automated Recommendations
- Next best action for each story
- Optimal task assignments
- Risk mitigation strategies

### Historical Comparison
- Compare with previous sprints
- Track improvement trends
- Identify recurring issues

## Error Handling

- **No stories found**: Check filters and sprint
- **API timeout**: Use cached data if available
- **Invalid sprint**: List available sprints

## Configuration

Support custom status views:

```yaml
# .claude/azure/status-config.yml
views:
  default:
    show_burndown: true
    show_velocity: true
    alert_threshold: 80
  
  executive:
    summary_only: true
    show_risks: true
    export_format: pdf
```