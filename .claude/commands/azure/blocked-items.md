---
allowed-tools: Task, Bash, Read, Write, WebFetch, Glob, Grep
---

# Azure DevOps Blocked Items

Identify and manage blocked work items with resolution tracking.

**Usage**: `/azure:blocked-items [--resolve] [--escalate]`

**Examples**:
- `/azure:blocked-items` - List all blocked items
- `/azure:blocked-items --resolve` - Interactive resolution mode
- `/azure:blocked-items --escalate` - Escalate to management
- `/azure:blocked-items --by-reason` - Group by blocker type

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

### 1. Identify Blocked Items

Query for items with:
- Tags containing "blocked"
- Comments mentioning blockers
- Dependencies not met
- Stale items (no progress >3 days)

### 2. Blocker Dashboard

```
🚧 Blocked Items Dashboard
═══════════════════════════════════════════════════════════════
Total Blocked: 7 items | Impact: 45 story points | 3 people affected

🔴 CRITICAL BLOCKERS (Immediate Action Required)
────────────────────────────────────────────────────────────────

Story #37: Search Feature Implementation
Blocked: 3 days | Impact: 8 points | Owner: Lisa
Reason: Search API not deployed to staging
Dependencies: Backend team API deployment
Resolution: Contact Backend Team Lead
Escalation: Required if not resolved by EOD

Tasks Affected:
  └── #371: Search UI (Lisa) - Cannot start
  └── #372: Search tests (Lisa) - Cannot start
  └── #373: Integration (Team) - Cannot start

⚠️ HIGH PRIORITY BLOCKERS
────────────────────────────────────────────────────────────────

Task #104: Integration Tests
Blocked: 4 hours | Impact: Story #34 completion | Owner: John
Reason: Test environment database connection failing
Dependencies: DevOps team
Resolution: Ticket #OPS-234 opened
Status: DevOps investigating, ETA 2 hours

Task #215: Bug Fix
Blocked: 1 day | Impact: Production hotfix | Owner: Unassigned
Reason: Cannot reproduce issue, need more info from customer
Dependencies: Customer Support
Resolution: Awaiting customer response
Action: Follow up with support team

🟡 MEDIUM PRIORITY BLOCKERS
────────────────────────────────────────────────────────────────

Story #35: User Profile
Blocked: 2 hours | Impact: 5 points | Owner: Sarah
Reason: Waiting for design review
Dependencies: UX team
Resolution: Meeting scheduled 2 PM today
Status: Will unblock after meeting

📊 BLOCKER ANALYSIS
────────────────────────────────────────────────────────────────

By Type:
  External Dependencies: 3 (43%)
  Technical Issues: 2 (29%)
  Missing Information: 1 (14%)
  Resource Availability: 1 (14%)

By Team:
  Backend Team: 2 blockers
  DevOps: 2 blockers
  UX/Design: 1 blocker
  Customer Support: 1 blocker
  External Vendor: 1 blocker

By Age:
  < 1 day: 3 items
  1-3 days: 2 items
  > 3 days: 2 items (escalation needed)

Impact on Sprint:
  Stories at risk: 3 (21 points)
  Sprint completion risk: HIGH
  Recommended action: Defer Story #37

📈 BLOCKER TRENDS
────────────────────────────────────────────────────────────────

This Sprint vs Last Sprint:
  Total Blockers: 7 vs 4 (↑ 75%)
  Avg Resolution Time: 18h vs 12h (↑ 50%)
  Most Common: External deps (was Technical)

Recurring Blockers:
  • Test environment (3rd sprint in a row)
  • API dependencies (2nd sprint)
  • Design review delays (every sprint)

🎯 RESOLUTION ACTIONS
────────────────────────────────────────────────────────────────

Immediate Actions:
1. [CRITICAL] Escalate Story #37 to management
2. [HIGH] Follow up on test environment fix
3. [MEDIUM] Attend design review at 2 PM

Assigned Actions:
  John → Check OPS-234 ticket status
  PM → Decide on Story #37 deferral
  Sarah → Prepare for design review

Preventive Actions:
  • Schedule recurring design reviews
  • Improve test environment monitoring
  • Create dependency checklist

⚡ Quick Actions:
────────────────────────────────────────────────────────────────
[1] Update blocker status
[2] Escalate critical items
[3] Send blocker report
[4] Create resolution tickets
[5] Show resolution history
[6] Contact blocker owners

Select (1-6): _
```

### 3. Resolution Tracking

```
🔧 Blocker Resolution Tracker
═══════════════════════════════════════════════════════════════

Active Resolutions:
┌──────┬────────────────┬───────────┬─────────┬──────────────┐
│ Item │ Blocker        │ Owner     │ ETA     │ Status       │
├──────┼────────────────┼───────────┼─────────┼──────────────┤
│ #104 │ Test env       │ DevOps    │ 2h      │ In Progress  │
│ #37  │ API deploy     │ Backend   │ EOD     │ Escalated    │
│ #35  │ Design review  │ UX Team   │ 2 PM    │ Scheduled    │
│ #215 │ Customer info  │ Support   │ Unknown │ Waiting      │
└──────┴────────────────┴───────────┴─────────┴──────────────┘

Resolution History (Last 7 days):
  ✅ Resolved: 12 blockers
  ⏱️ Avg Time: 14 hours
  🏆 Fastest: 2 hours (Database access)
  😞 Slowest: 4 days (Vendor API)
```

### 4. Escalation Template

When `--escalate` is used:

```
📧 Escalation Email Draft
────────────────────────────────────────────────────────────────
To: management@company.com
Subject: Sprint 2 - Critical Blockers Requiring Escalation

Critical Blockers Summary:
- 7 items blocked (45 story points)
- 3 team members affected
- Sprint completion at risk

Immediate Escalation Required:
1. Story #37 (8 pts): Search API deployment blocked 3 days
   Owner: Backend Team
   Impact: Full feature cannot be delivered
   
Action Requested:
- Authorize emergency deployment or
- Approve deferral to Sprint 3

Please respond by EOD today.

[Send] [Edit] [Cancel]
```

### 5. Interactive Resolution Mode

```
🔧 Blocker Resolution Wizard
────────────────────────────────────────────────────────────────

Select blocked item to resolve:
1. Story #37: Search API not deployed
2. Task #104: Test environment down
3. Task #215: Missing customer info

Selection: 1

Story #37 Resolution Options:
a) Contact responsible team
b) Find alternative solution
c) Escalate to management
d) Defer to next sprint
e) Remove from sprint

Choose action: c

Escalating to management...
✅ Escalation email sent to PM and Tech Lead
✅ Slack notification sent to #blockers channel
✅ Calendar invite sent for emergency meeting
✅ Blocker tagged as "escalated" in Azure DevOps

Next blocker? (y/n): _
```

## Smart Features

### Auto-Detection
- Identify stale items
- Find hidden blockers
- Predict future blocks

### Resolution Patterns
- Learn from history
- Suggest solutions
- Auto-assign resolvers

### Impact Analysis
- Calculate sprint risk
- Show dependency chains
- Prioritize unblocking

## Notifications

```yaml
notifications:
  new_blocker:
    channel: "#dev-blockers"
    mentions: ["@pm", "@techlead"]
  
  resolution:
    channel: "#dev-general"
    celebrate: true
  
  escalation:
    email: "management@company.com"
    urgent: true
```