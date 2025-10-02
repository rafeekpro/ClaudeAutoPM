# ClaudeAutoPM - Kompletny Przewodnik po Workflow PM

## 📖 Spis Treści

1. [Podstawowy Proces](#podstawowy-proces)
2. [Tworzenie Wielu PRD](#tworzenie-wielu-prd)
3. [Podział na Epiki](#podział-na-epiki)
4. [Przetwarzanie Wielu Epiców](#przetwarzanie-wielu-epiców)
5. [Przykłady Praktyczne](#przykłady-praktyczne)

---

## Podstawowy Proces

### KROK 1: `/pm:prd-new feature-name`

**Co robi:** Tworzy Product Requirements Document

```bash
/pm:prd-new user-authentication
```

**Rezultat:**
- Plik: `.claude/prds/user-authentication.md`
- Zawiera szablon z sekcjami:
  - Problem Statement (co rozwiązujemy)
  - User Stories (kto, co, dlaczego)
  - Acceptance Criteria (definicja zakończenia)
  - Success Metrics (jak mierzymy sukces)

**Claude wypełnia szablon** na podstawie Twojego opisu.

---

### KROK 2: `/pm:prd-parse feature-name`

**Co robi:** Analizuje PRD i przygotowuje do decomposition

```bash
/pm:prd-parse user-authentication
```

**Rezultat:**
- Analizuje strukturę PRD
- Identyfikuje komponenty (frontend, backend, database, etc.)
- Wykrywa zależności między komponentami
- Przygotowuje metadata do następnego kroku

**To jest analiza** - nie tworzy jeszcze tasków/epiców.

---

### KROK 3a: `/pm:epic-decompose feature-name` (PROSTY PROJEKT)

**Kiedy używać:** Mały/średni projekt z jednym epicem

```bash
/pm:epic-decompose user-authentication
```

**Co robi:**
- Tworzy **JEDEN** epic
- Dzieli go na tasks/issues
- Struktura:
  ```
  .claude/epics/user-authentication/
  ├── epic.md              # Główny epic
  ├── 001.md              # Task 1: Setup database
  ├── 002.md              # Task 2: Create user model
  ├── 003.md              # Task 3: Implement JWT
  └── ...
  ```

**Kiedy używać:**
- ✅ Jeden komponent (tylko backend lub tylko frontend)
- ✅ Mała funkcjonalność (1-2 tygodnie pracy)
- ✅ Jeden developer
- ✅ Brak dependencies między komponentami

---

### KROK 3b: `/pm:epic-split feature-name` (ZŁOŻONY PROJEKT)

**Kiedy używać:** Duży projekt z wieloma komponentami

```bash
/pm:epic-split ecommerce-platform
```

**Co robi:**
- Analizuje PRD pod kątem complexity
- Dzieli na **WIELE EPICÓW**
- Każdy epic = osobny folder
- Struktura:
  ```
  .claude/epics/ecommerce-platform/
  ├── meta.yaml                          # Metadata wszystkich epiców
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

**Automatycznie wykrywa:**
- Infrastructure (Docker, DB, monitoring) → Epic 1 (P0)
- Authentication Backend (JWT, users) → Epic 2 (P0)
- Product API Services (catalog, orders) → Epic 3 (P0)
- Frontend Foundation (React setup) → Epic 4 (P0)
- E-commerce UI (pages, cart) → Epic 5 (P1)
- Testing & Deployment (CI/CD) → Epic 6 (P1)

**Kiedy używać:**
- ✅ Multi-komponent (frontend + backend + infra)
- ✅ Duży projekt (2+ miesiące)
- ✅ Wiele osób/teamów
- ✅ Potrzeba równoległej pracy
- ✅ Phased delivery (milestone tracking)

---

### KROK 4: Decompose każdego epica

**Po `/pm:epic-split` musisz decompose KAŻDY epic osobno:**

```bash
# Decompose każdy epic na tasks
/pm:epic-decompose ecommerce-platform/01-infrastructure
/pm:epic-decompose ecommerce-platform/02-auth-backend
/pm:epic-decompose ecommerce-platform/03-product-api
/pm:epic-decompose ecommerce-platform/04-frontend-foundation
/pm:epic-decompose ecommerce-platform/05-ecommerce-ui
/pm:epic-decompose ecommerce-platform/06-testing-deployment
```

**Rezultat każdego decompose:**
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

### KROK 5: `/pm:epic-sync feature-name`

**Co robi:** Synchronizuje z GitHub/Azure DevOps

```bash
/pm:epic-sync ecommerce-platform
```

**GitHub:**
- Tworzy Epic Issue (#1)
- Tworzy Issue dla każdego taska (#2, #3, #4...)
- Linkuje issues do epica
- Dodaje labels (epic, P0, P1, frontend, backend)

**Azure DevOps:**
- Tworzy Epic
- Tworzy User Stories
- Tworzy Tasks
- Linkuje hierarchicznie

**WAŻNE:** Jeśli użyłeś `/pm:epic-split`, sync synchronizuje **WSZYSTKIE epiki naraz**.

---

### KROK 6: `/pm:next`

**Co robi:** Zwraca następny task do pracy

```bash
/pm:next
```

**Rezultat:**
```
📋 Next Task: #2 - Setup Docker Compose

Priority: P0
Epic: Infrastructure Foundation
Estimate: 2 hours
Status: Todo

File: .claude/epics/ecommerce-platform/01-infrastructure/001.md
```

---

### KROK 7: `/pm:issue-start ISSUE-123`

**Co robi:** Rozpoczyna pracę nad taskiem

```bash
/pm:issue-start #2
```

**Rezultat:**
- Status → "In Progress"
- Assigned → You
- Tworzy branch (opcjonalne): `feature/issue-2-setup-docker`

---

### KROK 8: `/pm:issue-close ISSUE-123`

**Co robi:** Zamyka ukończony task

```bash
/pm:issue-close #2
```

**Rezultat:**
- Status → "Done"
- Linkuje commits/PR
- Aktualizuje progress epica

---

## Tworzenie Wielu PRD

**TAK - możesz tworzyć wiele PRD równocześnie:**

```bash
/pm:prd-new user-authentication
/pm:prd-new payment-system
/pm:prd-new notification-service
```

**Rezultat:**
```
.claude/prds/
├── user-authentication.md
├── payment-system.md
└── notification-service.md
```

**Każdy PRD to osobny feature** - przetwarzasz je niezależnie.

---

## Podział na Epiki - Decyzja

### ❓ Kiedy używać `/pm:epic-decompose` (JEDEN epic)?

```bash
/pm:prd-new simple-login
/pm:prd-parse simple-login
/pm:epic-decompose simple-login  # ← JEDEN EPIC
```

**Używaj gdy:**
- ✅ Prosty login form (tylko frontend)
- ✅ REST API endpoint (tylko backend)
- ✅ Database migration (tylko DB)
- ✅ Mały feature (1-2 tygodnie)
- ✅ Jeden komponent
- ✅ Jeden developer

**Przykłady:**
- "Add user profile page" → jeden epic
- "Create REST API for products" → jeden epic
- "Setup Redis caching" → jeden epic

---

### ❓ Kiedy używać `/pm:epic-split` (WIELE epiców)?

```bash
/pm:prd-new ecommerce-platform
/pm:prd-parse ecommerce-platform
/pm:epic-split ecommerce-platform  # ← WIELE EPICÓW
```

**Używaj gdy:**
- ✅ Full-stack feature (frontend + backend + database + infra)
- ✅ Duży projekt (2+ miesiące)
- ✅ Potrzeba milestone tracking
- ✅ Wiele zespołów/osób
- ✅ Równoległa praca
- ✅ Phased delivery

**Przykłady:**
- "E-commerce platform" → 6-8 epiców
- "Social media dashboard" → 5-7 epiców
- "Multi-tenant SaaS" → 8-10 epiców

---

### 🎯 Kryteria Decyzji

| Cecha | epic-decompose (1 epic) | epic-split (wiele epiców) |
|-------|------------------------|---------------------------|
| **Komponenty** | 1 (tylko frontend LUB backend) | 2+ (frontend + backend + infra) |
| **Czas** | 1-2 tygodnie | 2+ miesiące |
| **Osoby** | 1 developer | 2+ zespoły |
| **Dependencies** | Brak lub minimalne | Złożone (infra → backend → frontend) |
| **Delivery** | Jedno release | Phased (milestones) |
| **Complexity** | Niski/Średni | Wysoki |

---

## Przetwarzanie Wielu Epiców

### Scenariusz 1: Jeden PRD → Wiele Epiców

```bash
# 1. Utwórz PRD
/pm:prd-new fullstack-app

# 2. Parse
/pm:prd-parse fullstack-app

# 3. Split na epiki (automatyczny)
/pm:epic-split fullstack-app
# Rezultat: 6 epiców utworzonych

# 4. Decompose KAŻDY epic
/pm:epic-decompose fullstack-app/01-infrastructure
/pm:epic-decompose fullstack-app/02-auth-backend
/pm:epic-decompose fullstack-app/03-product-api
/pm:epic-decompose fullstack-app/04-frontend-foundation
/pm:epic-decompose fullstack-app/05-ecommerce-ui
/pm:epic-decompose fullstack-app/06-testing-deployment

# 5. Sync WSZYSTKIE epiki naraz
/pm:epic-sync fullstack-app

# 6. Rozpocznij pracę
/pm:next  # Zwraca pierwszy P0 task z epic 01
```

---

### Scenariusz 2: Wiele PRD → Jeden Epic Każdy

```bash
# 1. Utwórz wiele PRD
/pm:prd-new login-page
/pm:prd-new product-api
/pm:prd-new docker-setup

# 2. Parse każdy
/pm:prd-parse login-page
/pm:prd-parse product-api
/pm:prd-parse docker-setup

# 3. Decompose każdy (po jednym epicu)
/pm:epic-decompose login-page
/pm:epic-decompose product-api
/pm:epic-decompose docker-setup

# 4. Sync każdy
/pm:epic-sync login-page
/pm:epic-sync product-api
/pm:epic-sync docker-setup

# 5. Rozpocznij pracę
/pm:next  # Zwraca najwyższy priorytet ze wszystkich
```

---

### Scenariusz 3: Wiele PRD → Niektóre Split, Niektóre Nie

```bash
# PRD 1: Złożony (split)
/pm:prd-new ecommerce-platform
/pm:prd-parse ecommerce-platform
/pm:epic-split ecommerce-platform
/pm:epic-decompose ecommerce-platform/01-infrastructure
/pm:epic-decompose ecommerce-platform/02-auth-backend
# ... (decompose wszystkie epiki)

# PRD 2: Prosty (bez split)
/pm:prd-new email-notifications
/pm:prd-parse email-notifications
/pm:epic-decompose email-notifications

# PRD 3: Prosty (bez split)
/pm:prd-new admin-dashboard
/pm:prd-parse admin-dashboard
/pm:epic-decompose admin-dashboard

# Sync wszystko
/pm:epic-sync ecommerce-platform
/pm:epic-sync email-notifications
/pm:epic-sync admin-dashboard
```

---

## Przykłady Praktyczne

### Przykład 1: Prosty Feature (JEDEN epic)

**Feature:** User Profile Page

```bash
# 1. Create PRD
/pm:prd-new user-profile

# 2. Parse
/pm:prd-parse user-profile

# 3. Decompose (JEDEN epic, bo prosty feature)
/pm:epic-decompose user-profile

# Rezultat:
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

### Przykład 2: Złożony Projekt (WIELE epiców)

**Feature:** E-commerce Platform

```bash
# 1. Create PRD
/pm:prd-new ecommerce-platform

# 2. Parse
/pm:prd-parse ecommerce-platform

# 3. Split (automatycznie wykrywa 6 epiców)
/pm:epic-split ecommerce-platform

# Rezultat:
# ✓ Epic 1: Infrastructure (Docker, PostgreSQL, Redis) - P0, 1w
# ✓ Epic 2: Auth Backend (JWT, users, RBAC) - P0, 2w
# ✓ Epic 3: Product API (catalog, inventory, orders) - P0, 3w
# ✓ Epic 4: Frontend Foundation (React, routing, state) - P0, 1w
# ✓ Epic 5: E-commerce UI (pages, cart, checkout) - P1, 3w
# ✓ Epic 6: Testing & Deployment (CI/CD, tests) - P1, 1w

# 4. Decompose KAŻDY epic
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

# 5. Sync WSZYSTKO naraz
/pm:epic-sync ecommerce-platform

# GitHub:
# - Epic #1 with 90 issues
# - Issues grouped by labels (infrastructure, auth, api, frontend, ui, testing)

# 6. Równoległa praca
/pm:next  # Returns infrastructure task (P0)
# Team 1 works on infrastructure
# Team 2 can work on auth backend (parallel)
```

---

### Przykład 3: Wiele Małych Features

**Features:** Login, Signup, Password Reset

```bash
# Strategy 1: Osobne PRD (RECOMMENDED dla niezależnych features)
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

# Strategy 2: Jeden PRD ze split (jeśli są powiązane)
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

## 🎯 Decyzja Flow Chart

```
Start: Mam nowy feature
       ↓
   [Ile komponentów?]
       ↓
   ┌────┴────┐
   │         │
   1         2+
   │         │
   │         └→ [Jak duży?]
   │             ↓
   │         ┌────┴────┐
   │         │         │
   │       Mały     Duży
   │         │         │
   │         │         └→ /pm:epic-split
   │         │            decompose każdy epic
   │         │            sync wszystko
   │         │
   │         └→ /pm:epic-decompose (jeden epic)
   │             sync
   │
   └→ /pm:epic-decompose (jeden epic)
      sync
```

---

## 📊 Podsumowanie Komend

| Komenda | Co robi | Kiedy używać |
|---------|---------|--------------|
| `/pm:prd-new` | Tworzy PRD | Zawsze na początku |
| `/pm:prd-parse` | Analizuje PRD | Po wypełnieniu PRD |
| `/pm:epic-split` | Dzieli na WIELE epiców | Złożone, multi-komponent |
| `/pm:epic-decompose` | Dzieli na tasks | ZAWSZE (jeden epic lub każdy po split) |
| `/pm:epic-sync` | Sync z GitHub/Azure | Po decompose |
| `/pm:next` | Następny task | Gotowy do pracy |
| `/pm:issue-start` | Rozpocznij task | Przed rozpoczęciem |
| `/pm:issue-close` | Zamknij task | Po ukończeniu |

---

## ❓ FAQ

**Q: Czy mogę mieć wiele PRD równocześnie?**
A: TAK. Twórz ile chcesz. Każdy jest niezależny.

**Q: Czy mogę edytować PRD po parse?**
A: TAK. Edytuj plik `.claude/prds/feature-name.md` i uruchom `/pm:prd-parse` ponownie.

**Q: Co jeśli epic-split utworzy złą liczbę epiców?**
A: Możesz ręcznie edytować epiki w `.claude/epics/feature-name/` i dostosować.

**Q: Czy muszę decompose WSZYSTKIE epiki po split?**
A: Nie musisz od razu. Możesz decompose tylko te, nad którymi zaczniesz pracę. Ale przed sync musisz decompose wszystkie.

**Q: Co jeśli chcę pracować nad wieloma PRD równocześnie?**
A: `/pm:next` automatycznie wybiera najwyższy priorytet ze WSZYSTKICH PRD/epiców.

**Q: Jak ustawić priority epiców?**
A: epic-split automatycznie ustawia (P0 dla infra/core, P1 dla UI/features). Możesz edytować ręcznie w epic.md.

---

## 🚀 Quick Start Examples

### Szybki Start: Mały Feature
```bash
/pm:prd-new my-feature
/pm:prd-parse my-feature
/pm:epic-decompose my-feature
/pm:epic-sync my-feature
/pm:next
```

### Szybki Start: Duży Projekt
```bash
/pm:prd-new big-project
/pm:prd-parse big-project
/pm:epic-split big-project
/pm:epic-decompose big-project/01-infrastructure
/pm:epic-decompose big-project/02-backend
/pm:epic-decompose big-project/03-frontend
# ... (decompose wszystkie)
/pm:epic-sync big-project
/pm:next
```
