# Epic Management Commands - Complete Guide

> **Kompletny przewodnik po wszystkich komendach zarządzania epikami w ClaudeAutoPM**

## 📋 Spis Treści

1. [Tworzenie Epików](#tworzenie-epików)
2. [Podział i Dekompozycja](#podział-i-dekompozycja)
3. [Wyświetlanie i Status](#wyświetlanie-i-status)
4. [Synchronizacja z GitHub](#synchronizacja-z-github)
5. [Rozpoczynanie Pracy](#rozpoczynanie-pracy)
6. [Zarządzanie Epikami](#zarządzanie-epikami)
7. [Przepływy Pracy (Workflows)](#przepływy-pracy)

---

## Tworzenie Epików

### `/pm:prd-parse <feature_name>`
**Co robi:** Parsuje dokument PRD i tworzy pojedynczy epic z taskami

**Kiedy używać:**
- Masz PRD dla jednej spójnej funkcjonalności
- Feature jest stosunkowo prosty (1 epic wystarczy)
- Chcesz szybko przejść od PRD do implementacji

**Przykład:**
```bash
/pm:prd-parse user-authentication
```

**Wynik:**
```
.claude/epics/user-authentication/
├── epic.md           # Główny epic
├── 001.md           # Task 1
├── 002.md           # Task 2
└── ...
```

**Następne kroki:**
```bash
/pm:epic-show user-authentication      # Przejrzyj epic
/pm:epic-sync user-authentication      # Wyślij do GitHub
/pm:epic-start user-authentication     # Rozpocznij pracę
```

---

### `/pm:epic-split <feature_name>`
**Co robi:** Automatycznie dzieli duży PRD na wiele logicznych epików

**Kiedy używać:**
- Masz kompleksowy PRD (frontend + backend + infra)
- Feature wymaga fazowego wdrożenia
- Pracujesz z dużym zespołem (potrzeba równoległej pracy)
- Potrzebujesz jasnych kamieni milowych (milestones)

**Jak to działa:**
1. Analizuje PRD pod kątem słów kluczowych i wzorców
2. Identyfikuje komponenty techniczne (frontend, backend, DB, etc.)
3. Mapuje zależności między epikami
4. Tworzy strukturę z priorytetami (P0, P1, P2)

**Przykład:**
```bash
/pm:epic-split ecommerce-platform
```

**Wynik:**
```
.claude/epics/ecommerce-platform/
├── meta.yaml                          # Metadata całego feature'a
├── 01-infrastructure/                 # Epic 1 (P0, 1w)
│   └── epic.md
├── 02-auth-backend/                   # Epic 2 (P0, 2w)
│   └── epic.md
├── 03-product-catalog/                # Epic 3 (P0, 2w)
│   └── epic.md
├── 04-shopping-cart/                  # Epic 4 (P1, 1w)
│   └── epic.md
├── 05-payment-integration/            # Epic 5 (P1, 2w)
│   └── epic.md
└── 06-admin-dashboard/                # Epic 6 (P2, 2w)
    └── epic.md

Łączny czas: 10 tygodni
P0 (krytyczne): 5 tygodni
P1 (ważne): 3 tygodnie
P2 (nice-to-have): 2 tygodnie
```

**Typy epików wykrywanych automatycznie:**
- 🏗️ **Infrastructure Foundation** - Docker, DB, monitoring
- 🔐 **Authentication Backend** - JWT, users, RBAC
- 🎨 **Authentication UI** - Login/register forms
- 🔌 **API Core Services** - REST/GraphQL endpoints
- ⚛️ **Frontend Foundation** - React/Vue/Angular setup
- 📊 **Dashboard & UX** - Main UI
- 💾 **Data Layer** - Models, migrations
- ✅ **Testing & Quality** - Test suites, TDD
- 🚀 **Deployment & DevOps** - CI/CD
- 🛡️ **Security & Compliance** - OWASP, hardening

**Następne kroki:**
```bash
# ZALECANE: Dekompozycja wszystkich epików naraz (jedna komenda!)
/pm:epic-decompose ecommerce-platform

# Alternatywnie: Dekompozycja pojedynczych epików
/pm:epic-decompose ecommerce-platform/01-infrastructure
/pm:epic-decompose ecommerce-platform/02-auth-backend
# ... itd.

# Synchronizacja do GitHub (wszystkie epiki naraz)
/pm:epic-sync ecommerce-platform
```

**Korzyści:**
- ✅ Automatyczna analiza - nie musisz ręcznie tworzyć epików
- ✅ Wykrywanie zależności - rozumie relacje między epikami
- ✅ Sortowanie priorytetów - P0 epiki na początku
- ✅ Równoległa praca - identyfikuje co może być robione równolegle
- ✅ Estymaty czasu - dostarcza szacunki na poziomie tygodni

---

## Podział i Dekompozycja

### `/pm:epic-decompose <feature_name>`
**Co robi:** Rozbija epic(i) na konkretne, wykonalne taski

**⚡ WAŻNE: Jedna komenda = wszystkie epiki!**

**Tryby działania:**

**1. Single Epic Mode:**
```bash
/pm:epic-decompose user-authentication
```
→ Dekompozycja jednego epika → taski w `.claude/epics/user-authentication/`

**2. Multi-Epic Mode (AUTOMATYCZNE - ZALECANE):**
```bash
/pm:epic-decompose ecommerce-platform
```
→ **AUTOMATYCZNIE** dekompozycja WSZYSTKICH epików → taski w każdym podfolderze
→ Nie musisz wielokrotnie uruchamiać komendy!

**3. Pojedynczy Epic z Multi-Epic (jeśli chcesz kontrolować):**
```bash
/pm:epic-decompose ecommerce-platform/01-infrastructure
```
→ Dekompozycja tylko jednego konkretnego epika

**Co tworzy:**
```markdown
---
name: Setup JWT authentication
status: open
created: 2025-01-15T10:30:00Z
updated: 2025-01-15T10:30:00Z
depends_on: [001]           # Zależy od taska 001
parallel: true              # Można robić równolegle
conflicts_with: []          # Nie konfliktuje z innymi
---

# Task: Setup JWT authentication

## Description
Implement JWT-based authentication...

## ⚠️ TDD Requirements
**This project uses Test-Driven Development:**
1. 🔴 RED: Write failing test first
2. 🟢 GREEN: Write minimal code to pass
3. 🔵 REFACTOR: Clean up code

## Acceptance Criteria
- [ ] JWT tokens generated on login
- [ ] Token validation middleware
- [ ] Refresh token mechanism

## Effort Estimate
- Size: M
- Hours: 8h
- Parallel: true
```

**Preflight Validation:**
Komenda automatycznie sprawdza:
- ✅ Czy epic istnieje
- ✅ Czy są już taski (pyta o usunięcie)
- ✅ Czy frontmatter jest poprawny
- ✅ Czy epic nie jest już ukończony

**Następne kroki:**
```bash
/pm:epic-show user-authentication      # Zobacz taski
/pm:epic-sync user-authentication      # Wyślij do GitHub
```

---

## Wyświetlanie i Status

### `/pm:epic-list`
**Co robi:** Pokazuje wszystkie epiki w projekcie

**Przykład:**
```bash
/pm:epic-list
```

**Wynik:**
```
📋 Active Epics:

user-authentication     [████████░░] 80%  8/10 tasks
  ├─ Status: in_progress
  ├─ Created: 2025-01-10
  └─ GitHub: #123

payment-gateway         [███░░░░░░░] 30%  3/10 tasks
  ├─ Status: in_progress
  ├─ Created: 2025-01-12
  └─ GitHub: #125

admin-dashboard         [░░░░░░░░░░]  0%  0/15 tasks
  ├─ Status: open
  └─ Created: 2025-01-14
```

---

### `/pm:epic-show <feature_name>`
**Co robi:** Pokazuje szczegóły jednego epika ze wszystkimi taskami

**Przykład:**
```bash
/pm:epic-show user-authentication
```

**Wynik:**
```
📄 Epic: User Authentication
══════════════════════════════════════════════════

Status: in_progress
Progress: 80% (8/10 tasks)
GitHub: #123
Created: 2025-01-10

📋 Tasks:
  ✅ 001.md - Setup project structure (2h) [DONE]
  ✅ 002.md - Implement JWT auth (8h) [DONE]
  🔄 003.md - Add refresh tokens (4h) [IN PROGRESS]
  ⏸️ 004.md - Password reset flow (6h) [BLOCKED: needs 003]
  📌 005.md - Email verification (4h) [TODO]
  ...

🔗 Dependencies:
  004 depends on: 003
  006 depends on: 003, 004

⚡ Parallel Tasks (można robić równolegle):
  001, 002, 005, 007

📊 Summary:
  Completed: 8 tasks (16h)
  In Progress: 1 task (4h)
  Remaining: 1 task (6h)
  Total Effort: 26h
```

---

### `/pm:epic-status <feature_name>`
**Co robi:** Zwięzły status epika (szybki check)

**Przykład:**
```bash
/pm:epic-status user-authentication
```

**Wynik:**
```
user-authentication: 80% complete (8/10 tasks)
Status: in_progress
GitHub: #123
Next: 003.md (Add refresh tokens)
```

---

## Synchronizacja z GitHub

### `/pm:epic-sync <feature_name>`
**Co robi:** Synchronizuje epic i taski do GitHub Issues

**Jak to działa:**
1. ✅ Tworzy główny issue dla epika
2. ✅ Tworzy sub-issues dla każdego taska
3. ✅ Zmienia nazwy plików (001.md → 456.md gdzie 456 = issue number)
4. ✅ Aktualizuje zależności (depends_on używa prawdziwych issue numbers)
5. ✅ Tworzy branch dla epika

**Single Epic:**
```bash
/pm:epic-sync user-authentication
```

**Multi-Epic:**
```bash
/pm:epic-sync ecommerce-platform
```
Synchronizuje WSZYSTKIE epiki z podfolderów

**Wynik:**
```
🚀 Epic sync completed!

📊 Summary:
  Epic: #456 - user-authentication
  Tasks: 10 sub-issues created
  Branch: epic/user-authentication

🔗 Links:
  Epic: https://github.com/you/repo/issues/456
  Branch: https://github.com/you/repo/tree/epic/user-authentication

📋 Next steps:
  - Start parallel execution: /pm:epic-start user-authentication
  - Or single issue: /pm:issue-start 457
```

**Multi-Epic Result:**
```
🎉 Multi-epic sync completed!

📊 Summary:
  Feature: ecommerce-platform
  Epics created: 6
  Epic issues: #501 #502 #503 #504 #505 #506
  Total tasks: 45
  Branch: feature/ecommerce-platform

🔗 Links:
  Epic #501 (Infrastructure): https://github.com/you/repo/issues/501
  Epic #502 (Auth Backend): https://github.com/you/repo/issues/502
  ...

📋 Next steps:
  - Work on P0 epics first
  - Start: /pm:issue-start 501
```

---

## Rozpoczynanie Pracy

### `/pm:epic-start <feature_name>`
**Co robi:** Inteligentnie rozpoczyna pracę nad epikiem

**Strategia:**
1. 🔍 Analizuje zależności między taskami
2. 🎯 Identyfikuje taski bez zależności (można zacząć od razu)
3. ⚡ Grupuje taski równoległe (brak konfliktów)
4. 🚀 Proponuje optymalne podejście (sekwencyjne vs równoległe)

**Przykład:**
```bash
/pm:epic-start user-authentication
```

**Wynik:**
```
🚀 Starting epic: user-authentication

📊 Analysis:
  Total tasks: 10
  Parallel tasks: 6
  Sequential tasks: 4

⚡ Recommended approach: Parallel execution

Ready to start tasks (no dependencies):
  ✅ 457 - Setup project structure (2h)
  ✅ 458 - Implement JWT auth (8h)
  ✅ 460 - Email verification (4h)

These can run in parallel (no conflicts).

Next steps:
  1. Assign tasks: gh issue edit 457 --assignee @me
  2. Start work: /pm:issue-start 457
  3. Or parallel: /pm:parallel-start 457 458 460
```

---

## Zarządzanie Epikami

### `/pm:epic-edit <feature_name>`
**Co robi:** Edytuje epic (opis, estymaty, status)

**Przykład:**
```bash
/pm:epic-edit user-authentication
```

---

### `/pm:epic-merge <source> <target>`
**Co robi:** Łączy dwa epiki w jeden

**Kiedy używać:**
- Epiki są zbyt granularne
- Podobna funkcjonalność powinna być w jednym miejscu
- Redukcja overhead'u zarządzania

**Przykład:**
```bash
/pm:epic-merge login-feature registration-feature
```

---

### `/pm:epic-close <feature_name>`
**Co robi:** Zamyka ukończony epic

**Przykład:**
```bash
/pm:epic-close user-authentication
```

**Walidacja:**
- ✅ Sprawdza czy wszystkie taski są ukończone
- ✅ Aktualizuje status w GitHub
- ✅ Archiwizuje epic

---

### `/pm:epic-refresh <feature_name>`
**Co robi:** Odświeża status epika z GitHub

**Kiedy używać:**
- Po zmianach w GitHub (zamknięte issues)
- Synchronizacja statusów
- Weryfikacja postępu

**Przykład:**
```bash
/pm:epic-refresh user-authentication
```

---

### `/pm:epic-oneshot <title>`
**Co robi:** Szybkie utworzenie prostego epika bez PRD

**Kiedy używać:**
- Mały, prosty feature
- Nie potrzebujesz formalnego PRD
- Quick start

**Przykład:**
```bash
/pm:epic-oneshot "Add dark mode toggle"
```

---

## Przepływy Pracy (Workflows)

### 🎯 Workflow 1: Prosty Feature (Single Epic)

```bash
# 1. Utwórz PRD
vim .claude/prds/dark-mode.md

# 2. Parse do epika
/pm:prd-parse dark-mode

# 3. Dekompozycja na taski
/pm:epic-decompose dark-mode

# 4. Przejrzyj
/pm:epic-show dark-mode

# 5. Sync do GitHub
/pm:epic-sync dark-mode

# 6. Rozpocznij pracę
/pm:epic-start dark-mode
```

---

### 🚀 Workflow 2: Kompleksowy Feature (Multi-Epic)

```bash
# 1. Utwórz kompleksowy PRD
vim .claude/prds/ecommerce-platform.md

# 2. Automatyczny split na epiki
/pm:epic-split ecommerce-platform
# Wynik: 6 epików (infrastructure, auth, products, cart, payment, admin)

# 3. JEDNA komenda dekompozycji dla WSZYSTKICH epików!
/pm:epic-decompose ecommerce-platform
# ✅ Automatycznie dekompozycja wszystkich 6 epików
# ✅ Nie musisz uruchamiać 6 razy!

# 4. Review struktury
/pm:epic-list
/pm:epic-show ecommerce-platform/01-infrastructure

# 5. Sync wszystkich epików
/pm:epic-sync ecommerce-platform

# 6. Rozpocznij od P0 epików
/pm:epic-start ecommerce-platform/01-infrastructure
/pm:epic-start ecommerce-platform/02-auth-backend
```

---

### ⚡ Workflow 3: Quick Feature (Oneshot)

```bash
# Wszystko w jednej komendzie
/pm:epic-oneshot "Add export to PDF feature"

# Następnie od razu decompose i sync
/pm:epic-decompose export-pdf
/pm:epic-sync export-pdf
/pm:epic-start export-pdf
```

---

### 🔄 Workflow 4: Zarządzanie w Trakcie Pracy

```bash
# Sprawdź status
/pm:epic-status user-auth

# Odśwież z GitHub
/pm:epic-refresh user-auth

# Zobacz szczegóły
/pm:epic-show user-auth

# Zamknij ukończony epic
/pm:epic-close user-auth
```

---

## 🎓 Best Practices

### 1. **Kiedy używać Single Epic vs Multi-Epic?**

**Single Epic (`/pm:prd-parse`):**
- ✅ Feature ma < 15 tasków
- ✅ Jeden komponent techniczny (np. tylko frontend)
- ✅ Jeden milestone
- ✅ Mały zespół (1-2 devs)

**Multi-Epic (`/pm:epic-split`):**
- ✅ Feature ma > 15 tasków
- ✅ Wiele komponentów (frontend + backend + infra)
- ✅ Wiele milestones
- ✅ Duży zespół (3+ devs)
- ✅ Fazowe wdrożenie (P0 → P1 → P2)

### 2. **Optymalizacja Równoległej Pracy**

```bash
# 1. Split na epiki z priorytetami
/pm:epic-split big-feature

# 2. Dekompozycja
/pm:epic-decompose big-feature

# 3. Sync
/pm:epic-sync big-feature

# 4. Start P0 epików równolegle (różni devs)
Dev1: /pm:epic-start big-feature/01-infrastructure
Dev2: /pm:epic-start big-feature/02-auth-backend
Dev3: /pm:epic-start big-feature/03-frontend
```

### 3. **Zarządzanie Zależnościami**

Epic split automatycznie wykrywa:
- 🔗 Infrastructure → Auth → Frontend (sequential)
- ⚡ Products ∥ Cart ∥ Orders (parallel)

Dekompozycja zachowuje te zależności w taskach.

---

## 📊 Porównanie Komend

| Komenda | Czas | Złożoność | Output | Kiedy używać |
|---------|------|-----------|--------|--------------|
| `/pm:prd-parse` | 1 min | Niska | 1 epic, 5-15 tasków | Prosty feature |
| `/pm:epic-split` | 2 min | Średnia | 3-10 epików | Kompleksowy feature |
| `/pm:epic-oneshot` | 30 sec | Bardzo niska | 1 epic, 3-5 tasków | Quick fix/small feature |
| `/pm:epic-decompose` | 1-5 min | Średnia | Taski dla epików | Po parse/split |
| `/pm:epic-sync` | 2-10 min | Średnia | GitHub issues | Przed rozpoczęciem pracy |
| `/pm:epic-start` | 10 sec | Niska | Plan działania | Rozpoczęcie implementacji |

---

## 🆘 Troubleshooting

### Problem: "Epic not found"
```bash
# Rozwiązanie:
/pm:epic-list                    # Zobacz dostępne epiki
/pm:prd-parse <feature>          # Lub utwórz nowy
```

### Problem: "No tasks to sync"
```bash
# Rozwiązanie:
/pm:epic-decompose <feature>     # Najpierw dekompozycja
```

### Problem: "Tasks already exist"
```bash
# Rozwiązanie: Potwierdź usunięcie i utworzenie na nowo
# Lub: /pm:epic-show <feature>   # Zobacz istniejące
```

### Problem: "Circular dependency detected"
```bash
# Rozwiązanie: Edytuj pliki tasków i usuń cykliczne zależności
vim .claude/epics/<feature>/003.md  # Usuń depends_on: [005]
```

---

## 🔗 Powiązane Komendy

- `/pm:issue-start <number>` - Rozpocznij pracę nad konkretnym taskiem
- `/pm:issue-test <number>` - Uruchom TDD workflow dla taska
- `/pm:parallel-start <numbers>` - Rozpocznij wiele tasków równolegle
- `/pm:validate` - Walidacja całego projektu

---

## 📚 Dodatkowe Materiały

- `DEVELOPMENT-STANDARDS.md` - Standardy rozwoju
- `.claude/rules/tdd.enforcement.md` - Wymagania TDD
- `.claude/templates/epic-template.md` - Template epika
- `.claude/templates/task-template.md` - Template taska

---

**Ostatnia aktualizacja:** 2025-01-15
**Wersja:** 1.0.0
