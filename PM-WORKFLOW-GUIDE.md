# ClaudeAutoPM - Complete PM Workflow Guide

## 📖 Table of Contents

1. [Basic Process](#basic-process)
2. [Creating Multiple PRDs](#creating-multiple-prds)
3. [Epic Splitting](#epic-splitting)
4. [Processing Multiple Epics](#processing-multiple-epics)
5. [Practical Examples](#practical-examples)

---

## Basic Process

### STEP 1: `/pm:prd-new feature-name`

**What it does:** Creates a Product Requirements Document

```bash
/pm:prd-new user-authentication
```

**Result:**
- File: `.claude/prds/user-authentication.md`
- Contains template with sections:
  - Problem Statement (what we're solving)
  - User Stories (who, what, why)
  - Acceptance Criteria (definition of done)
  - Success Metrics (how we measure success)

**Claude fills the template** based on your description.

---

### STEP 2: `/pm:prd-parse feature-name`

**What it does:** Analyzes PRD and prepares for decomposition

```bash
/pm:prd-parse user-authentication
```

**Result:**
- Analyzes PRD structure
- Identifies components (frontend, backend, database, etc.)
- Detects dependencies between components
- Prepares metadata for next step

**This is analysis** - doesn't create tasks/epics yet.

---

### STEP 3a: `/pm:epic-decompose feature-name` (SIMPLE PROJECT)

**When to use:** Small/medium project with one epic

```bash
/pm:epic-decompose user-authentication
```

**What it does:**
- Creates **ONE** epic
- Breaks it into tasks/issues
- Structure:
  ```
  .claude/epics/user-authentication/
  ├── epic.md              # Main epic
  ├── 001.md              # Task 1: Setup database
  ├── 002.md              # Task 2: Create user model
  ├── 003.md              # Task 3: Implement JWT
  └── ...
  ```

**When to use:**
- ✅ One component (only backend or only frontend)
- ✅ Small functionality (1-2 weeks work)
- ✅ One developer
- ✅ No dependencies between components

---

### STEP 3b: `/pm:epic-split feature-name` (COMPLEX PROJECT)

**When to use:** Large project with multiple components

```bash
/pm:epic-split ecommerce-platform
```

**What it does:**
- Analyzes PRD for complexity
- Splits into **MULTIPLE EPICS**
- Each epic = separate folder
- Structure:
  ```
  .claude/epics/ecommerce-platform/
  ├── meta.yaml                          # Metadata of all epics
  ├── 01-infrastructure/
  │   └── epic.md                       # Epic: Infrastructure
  ├── 02-auth-backend/
  │   └── epic.md                       # Epic: Authentication Backend
  ├── 03-product-api/
  │   └── epic.md                       # Epic: Product API
  ├── 04-frontend-foundation/
  │   └── epic.md                       # Epic: Frontend Setup
  ├── 05-ecommerce-ui/
  │   └── epic.md                       # Epic: E-commerce UI
  └── 06-testing-deployment/
      └── epic.md                       # Epic: Testing & CI/CD
  ```

**Automatically detects:**
- Infrastructure (Docker, DB, monitoring) → Epic 1 (P0)
- Authentication Backend (JWT, users) → Epic 2 (P0)
- Product API Services (catalog, orders) → Epic 3 (P0)
- Frontend Foundation (React setup) → Epic 4 (P0)
- E-commerce UI (pages, cart) → Epic 5 (P1)
- Testing & Deployment (CI/CD) → Epic 6 (P1)

**When to use:**
- ✅ Multi-component (frontend + backend + infra)
- ✅ Large project (2+ months)
- ✅ Multiple people/teams
- ✅ Need for parallel work
- ✅ Phased delivery (milestone tracking)

---

### STEP 4: Decompose each epic

**After `/pm:epic-split` you must decompose EACH epic separately:**

```bash
# Decompose each epic into tasks
/pm:epic-decompose ecommerce-platform/01-infrastructure
/pm:epic-decompose ecommerce-platform/02-auth-backend
/pm:epic-decompose ecommerce-platform/03-product-api
/pm:epic-decompose ecommerce-platform/04-frontend-foundation
/pm:epic-decompose ecommerce-platform/05-ecommerce-ui
/pm:epic-decompose ecommerce-platform/06-testing-deployment
```

**Result of each decompose:**
```
.claude/epics/ecommerce-platform/01-infrastructure/
├── epic.md
├── 001.md    # Setup Docker Compose
├── 002.md    # Configure PostgreSQL
├── 003.md    # Setup Redis
├── 004.md    # Prometheus monitoring
└── ...
```

---

### STEP 5: `/pm:epic-sync feature-name`

**What it does:** Synchronizes with GitHub/Azure DevOps

```bash
/pm:epic-sync ecommerce-platform
```

**GitHub:**
- Creates Epic Issue (#1)
- Creates Issue for each task (#2, #3, #4...)
- Links issues to epic
- Adds labels (epic, P0, P1, frontend, backend)

**Azure DevOps:**
- Creates Epic
- Creates User Stories
- Creates Tasks
- Links hierarchically

**IMPORTANT:** If you used `/pm:epic-split`, sync synchronizes **ALL epics at once**.

---

### STEP 6: `/pm:next`

**What it does:** Returns next task to work on

```bash
/pm:next
```

**Result:**
```
📋 Next Task: #2 - Setup Docker Compose

Priority: P0
Epic: Infrastructure Foundation
Estimate: 2 hours
Status: Todo

File: .claude/epics/ecommerce-platform/01-infrastructure/001.md
```

---

### STEP 7: `/pm:issue-start ISSUE-123`

**What it does:** Starts work on task

```bash
/pm:issue-start #2
```

**Result:**
- Status → "In Progress"
- Assigned → You
- Creates branch (optional): `feature/issue-2-setup-docker`

---

### STEP 8: `/pm:issue-close ISSUE-123`

**What it does:** Closes completed task

```bash
/pm:issue-close #2
```

**Result:**
- Status → "Done"
- Links commits/PR
- Updates epic progress

---

## Creating Multiple PRDs

**YES - you can create multiple PRDs simultaneously:**

```bash
/pm:prd-new user-authentication
/pm:prd-new payment-system
/pm:prd-new notification-service
```

**Result:**
```
.claude/prds/
├── user-authentication.md
├── payment-system.md
└── notification-service.md
```

**Each PRD is a separate feature** - process them independently.

---

## Epic Splitting - Decision

### ❓ When to use `/pm:epic-decompose` (ONE epic)?

```bash
/pm:prd-new simple-login
/pm:prd-parse simple-login
/pm:epic-decompose simple-login  # ← ONE EPIC
```

**Use when:**
- ✅ Simple login form (frontend only)
- ✅ REST API endpoint (backend only)
- ✅ Database migration (DB only)
- ✅ Small feature (1-2 weeks)
- ✅ One component
- ✅ One developer

**Examples:**
- "Add user profile page" → one epic
- "Create REST API for products" → one epic
- "Setup Redis caching" → one epic

---

### ❓ When to use `/pm:epic-split` (MULTIPLE epics)?

```bash
/pm:prd-new ecommerce-platform
/pm:prd-parse ecommerce-platform
/pm:epic-split ecommerce-platform  # ← MULTIPLE EPICS
```

**Use when:**
- ✅ Full-stack feature (frontend + backend + database + infra)
- ✅ Large project (2+ months)
- ✅ Need milestone tracking
- ✅ Multiple teams/people
- ✅ Parallel work
- ✅ Phased delivery

**Examples:**
- "E-commerce platform" → 6-8 epics
- "Social media dashboard" → 5-7 epics
- "Multi-tenant SaaS" → 8-10 epics

---

### 🎯 Decision Criteria

| Feature | epic-decompose (1 epic) | epic-split (multiple epics) |
|---------|------------------------|------------------------------|
| **Components** | 1 (only frontend OR backend) | 2+ (frontend + backend + infra) |
| **Time** | 1-2 weeks | 2+ months |
| **People** | 1 developer | 2+ teams |
| **Dependencies** | None or minimal | Complex (infra → backend → frontend) |
| **Delivery** | Single release | Phased (milestones) |
| **Complexity** | Low/Medium | High |

---

## Processing Multiple Epics

### Scenario 1: One PRD → Multiple Epics

```bash
# 1. Create PRD
/pm:prd-new fullstack-app

# 2. Parse
/pm:prd-parse fullstack-app

# 3. Split into epics (automatic)
/pm:epic-split fullstack-app
# Result: 6 epics created

# 4. Decompose EACH epic
/pm:epic-decompose fullstack-app/01-infrastructure
/pm:epic-decompose fullstack-app/02-auth-backend
/pm:epic-decompose fullstack-app/03-product-api
/pm:epic-decompose fullstack-app/04-frontend-foundation
/pm:epic-decompose fullstack-app/05-ecommerce-ui
/pm:epic-decompose fullstack-app/06-testing-deployment

# 5. Sync ALL epics at once
/pm:epic-sync fullstack-app

# 6. Start work
/pm:next  # Returns first P0 task from epic 01
```

---

### Scenario 2: Multiple PRDs → One Epic Each

```bash
# 1. Create multiple PRDs
/pm:prd-new login-page
/pm:prd-new product-api
/pm:prd-new docker-setup

# 2. Parse each
/pm:prd-parse login-page
/pm:prd-parse product-api
/pm:prd-parse docker-setup

# 3. Decompose each (one epic each)
/pm:epic-decompose login-page
/pm:epic-decompose product-api
/pm:epic-decompose docker-setup

# 4. Sync each
/pm:epic-sync login-page
/pm:epic-sync product-api
/pm:epic-sync docker-setup

# 5. Start work
/pm:next  # Returns highest priority from all
```

---

### Scenario 3: Multiple PRDs → Some Split, Some Not

```bash
# PRD 1: Complex (split)
/pm:prd-new ecommerce-platform
/pm:prd-parse ecommerce-platform
/pm:epic-split ecommerce-platform
/pm:epic-decompose ecommerce-platform/01-infrastructure
/pm:epic-decompose ecommerce-platform/02-auth-backend
# ... (decompose all epics)

# PRD 2: Simple (no split)
/pm:prd-new email-notifications
/pm:prd-parse email-notifications
/pm:epic-decompose email-notifications

# PRD 3: Simple (no split)
/pm:prd-new admin-dashboard
/pm:prd-parse admin-dashboard
/pm:epic-decompose admin-dashboard

# Sync everything
/pm:epic-sync ecommerce-platform
/pm:epic-sync email-notifications
/pm:epic-sync admin-dashboard
```

---

## Practical Examples

### Example 1: Simple Feature (ONE epic)

**Feature:** User Profile Page

```bash
# 1. Create PRD
/pm:prd-new user-profile

# 2. Parse
/pm:prd-parse user-profile

# 3. Decompose (ONE epic, because it's simple)
/pm:epic-decompose user-profile

# Result:
# .claude/epics/user-profile/
# ├── epic.md
# ├── 001.md  # Create profile component
# ├── 002.md  # Add avatar upload
# ├── 003.md  # Implement edit form
# └── 004.md  # Add validation

# 4. Sync
/pm:epic-sync user-profile

# 5. Work
/pm:next
/pm:issue-start #123
# ... development ...
/pm:issue-close #123
```

---

### Example 2: Complex Project (MULTIPLE epics)

**Feature:** E-commerce Platform

```bash
# 1. Create PRD
/pm:prd-new ecommerce-platform

# 2. Parse
/pm:prd-parse ecommerce-platform

# 3. Split (automatically detects 6 epics)
/pm:epic-split ecommerce-platform

# Result:
# ✓ Epic 1: Infrastructure (Docker, PostgreSQL, Redis) - P0, 1w
# ✓ Epic 2: Auth Backend (JWT, users, RBAC) - P0, 2w
# ✓ Epic 3: Product API (catalog, inventory, orders) - P0, 3w
# ✓ Epic 4: Frontend Foundation (React, routing, state) - P0, 1w
# ✓ Epic 5: E-commerce UI (pages, cart, checkout) - P1, 3w
# ✓ Epic 6: Testing & Deployment (CI/CD, tests) - P1, 1w

# 4. Decompose EACH epic
/pm:epic-decompose ecommerce-platform/01-infrastructure
# Creates 12 tasks (Docker, DB, Redis, monitoring...)

/pm:epic-decompose ecommerce-platform/02-auth-backend
# Creates 15 tasks (models, JWT, endpoints, RBAC...)

/pm:epic-decompose ecommerce-platform/03-product-api
# Creates 20 tasks (catalog, inventory, orders...)

/pm:epic-decompose ecommerce-platform/04-frontend-foundation
# Creates 10 tasks (React setup, routing, state...)

/pm:epic-decompose ecommerce-platform/05-ecommerce-ui
# Creates 25 tasks (product pages, cart, checkout...)

/pm:epic-decompose ecommerce-platform/06-testing-deployment
# Creates 8 tasks (CI/CD, tests, deployment...)

# TOTAL: ~90 tasks across 6 epics

# 5. Sync EVERYTHING at once
/pm:epic-sync ecommerce-platform

# GitHub:
# - Epic #1 with 90 issues
# - Issues grouped by labels (infrastructure, auth, api, frontend, ui, testing)

# 6. Parallel work
/pm:next  # Returns infrastructure task (P0)
# Team 1 works on infrastructure
# Team 2 can work on auth backend (parallel)
```

---

### Example 3: Multiple Small Features

**Features:** Login, Signup, Password Reset

```bash
# Strategy 1: Separate PRDs (RECOMMENDED for independent features)
/pm:prd-new login-page
/pm:prd-new signup-page
/pm:prd-new password-reset

/pm:prd-parse login-page
/pm:prd-parse signup-page
/pm:prd-parse password-reset

/pm:epic-decompose login-page      # 5 tasks
/pm:epic-decompose signup-page     # 6 tasks
/pm:epic-decompose password-reset  # 4 tasks

/pm:epic-sync login-page
/pm:epic-sync signup-page
/pm:epic-sync password-reset

# Strategy 2: One PRD with split (if they're related)
/pm:prd-new authentication-system
/pm:prd-parse authentication-system
/pm:epic-split authentication-system
# → Epic 1: Login
# → Epic 2: Signup
# → Epic 3: Password Reset

/pm:epic-decompose authentication-system/01-login
/pm:epic-decompose authentication-system/02-signup
/pm:epic-decompose authentication-system/03-password-reset

/pm:epic-sync authentication-system
```

---

## 🎯 Decision Flow Chart

```
Start: I have a new feature
       ↓
   [How many components?]
       ↓
   ┌────┴────┐
   │         │
   1         2+
   │         │
   │         └→ [How big?]
   │             ↓
   │         ┌────┴────┐
   │         │         │
   │       Small     Large
   │         │         │
   │         │         └→ /pm:epic-split
   │         │            decompose each epic
   │         │            sync everything
   │         │
   │         └→ /pm:epic-decompose (one epic)
   │             sync
   │
   └→ /pm:epic-decompose (one epic)
      sync
```

---

## 📊 Command Summary

| Command | What it does | When to use |
|---------|--------------|-------------|
| `/pm:prd-new` | Creates PRD | Always at start |
| `/pm:prd-parse` | Analyzes PRD | After filling PRD |
| `/pm:epic-split` | Splits into MULTIPLE epics | Complex, multi-component |
| `/pm:epic-decompose` | Splits into tasks | ALWAYS (one epic or each after split) |
| `/pm:epic-sync` | Sync with GitHub/Azure | After decompose |
| `/pm:next` | Next task | Ready to work |
| `/pm:issue-start` | Start task | Before starting |
| `/pm:issue-close` | Close task | After completion |

---

## ❓ FAQ

**Q: Can I have multiple PRDs simultaneously?**
A: YES. Create as many as you want. Each is independent.

**Q: Can I edit PRD after parse?**
A: YES. Edit file `.claude/prds/feature-name.md` and run `/pm:prd-parse` again.

**Q: What if epic-split creates wrong number of epics?**
A: You can manually edit epics in `.claude/epics/feature-name/` and adjust.

**Q: Do I have to decompose ALL epics after split?**
A: You don't have to immediately. You can decompose only those you'll start working on. But before sync you must decompose all.

**Q: What if I want to work on multiple PRDs simultaneously?**
A: `/pm:next` automatically picks highest priority from ALL PRDs/epics.

**Q: How to set epic priorities?**
A: epic-split automatically sets (P0 for infra/core, P1 for UI/features). You can edit manually in epic.md.

---

## 🚀 Quick Start Examples

### Quick Start: Small Feature
```bash
/pm:prd-new my-feature
/pm:prd-parse my-feature
/pm:epic-decompose my-feature
/pm:epic-sync my-feature
/pm:next
```

### Quick Start: Large Project
```bash
/pm:prd-new big-project
/pm:prd-parse big-project
/pm:epic-split big-project
/pm:epic-decompose big-project/01-infrastructure
/pm:epic-decompose big-project/02-backend
/pm:epic-decompose big-project/03-frontend
# ... (decompose all)
/pm:epic-sync big-project
/pm:next
```
