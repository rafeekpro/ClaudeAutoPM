# PM Workflow z Token Optimization

## 🎯 Pełny Cykl: Issue → Tasks → Implementation → Completion

### Scenariusz: "Add User Profile Management"

```
┌────────────────────────────────────────────────────────────────────────┐
│                    FAZA 1: ISSUE CREATION                              │
└────────────────────────────────────────────────────────────────────────┘

User: "/pm:issue-create User Profile Management"

┌─────────────────────┐
│ Session Start       │  Load: base-optimized.md (1,646 tokens)
│ Tokens: 1,646       │  Zawiera: priorities, lazy triggers, agent list
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Detect Command      │  Wykrywa: /pm:issue-create
│ Tokens: 1,646       │  Trigger: Potrzebny command file
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Load Command        │  Load: .claude/commands/pm/issue-create.md
│ Tokens: 1,646 + 300│  Zawiera: template, Documentation Queries
│       = 1,946       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Query Context7      │  Query: mcp://context7/github/issues
│ Tokens: 1,946 + 200│          mcp://context7/agile/user-stories
│       = 2,146       │  Result: Current GitHub issue best practices
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Create Issue        │  GitHub Issue #123 created
│ Tokens: 2,146       │  Title: Add User Profile Management
│                     │  Labels: enhancement, backend, frontend
│ OUTPUT:             │  Epic: User Management
│ Issue #123 created  │
└─────────────────────┘

💰 SAVINGS: 45,199 - 2,146 = 43,053 tokens (95.3%)


┌────────────────────────────────────────────────────────────────────────┐
│                    FAZA 2: EPIC DECOMPOSITION                          │
└────────────────────────────────────────────────────────────────────────┘

User: "/pm:epic-decompose 'User Profile Management'"

┌─────────────────────┐
│ Current Context     │  Already loaded: base-optimized.md (1,646)
│ Tokens: 2,146       │                  issue context (500)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Load Command        │  Load: .claude/commands/pm/epic-decompose.md
│ Tokens: 2,146 + 350│  Zawiera: decomposition patterns, queries
│       = 2,496       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Query Context7      │  Query: mcp://context7/agile/epic-decomposition
│ Tokens: 2,496 + 200│          mcp://context7/agile/task-sizing
│       = 2,696       │  Result: INVEST criteria, sizing guidelines
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Decompose Epic      │  Created 5 tasks:
│ Tokens: 2,696       │
│                     │  Task 1: Create User model (Backend, Size: S)
│ OUTPUT:             │  Task 2: Profile view API (Backend, Size: S)
│ 5 tasks created     │  Task 3: Profile update API (Backend, Size: M)
│                     │  Task 4: Profile view UI (Frontend, Size: M)
│                     │  Task 5: Profile edit UI (Frontend, Size: M)
└─────────────────────┘

💰 SAVINGS: 45,199 - 2,696 = 42,503 tokens (94.0%)


┌────────────────────────────────────────────────────────────────────────┐
│                    FAZA 3: TASK IMPLEMENTATION                         │
└────────────────────────────────────────────────────────────────────────┘

User: "/pm:task-start 'Create User model with profile fields'"

┌─────────────────────┐
│ Current Context     │  Base context: 2,696 tokens
│ Tokens: 2,696       │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Load Workflow       │  Load: .claude/quick-ref/workflow-steps.md
│ Tokens: 2,696 + 545│  Trigger: task-start command needs workflow
│       = 3,241       │  Zawiera: 9-step workflow, TDD requirement
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ TDD Enforcement     │  Load: .claude/quick-ref/tdd-cycle.md
│ Tokens: 3,241 + 285│  Trigger: workflow requires TDD
│       = 3,526       │  Zawiera: RED-GREEN-REFACTOR cycle
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Agent Selection     │  Decision: Backend Python task
│ Tokens: 3,526       │  Selected: @python-backend-engineer
│                     │  Reason: SQLAlchemy model creation
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Load Agent          │  Load: python-backend-engineer.md
│ Tokens: 3,526 + 600│  Lazy load when agent invoked
│       = 4,126       │  Contains: expertise, Documentation Queries
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Query Context7      │  Query: mcp://context7/sqlalchemy/models
│ Tokens: 4,126 + 200│          mcp://context7/sqlalchemy/migrations
│       = 4,326       │  Result: SQLAlchemy 2.0 patterns
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Implementation      │  🔴 RED: Write failing test
│ Tokens: 4,326       │       tests/test_user_model.py
│                     │       @test-runner → ❌ FAILS
│                     │       git commit -m "test: ..."
│                     │
│                     │  ✅ GREEN: Implement User model
│                     │       app/models/user.py
│                     │       @test-runner → ✅ PASSES
│                     │       git commit -m "feat: ..."
│                     │
│                     │  ♻️  REFACTOR: Improve structure
│                     │       Add validators, type hints
│                     │       @test-runner → ✅ PASSES
│                     │       git commit -m "refactor: ..."
└─────────────────────┘

💰 SAVINGS: 45,199 - 4,326 = 40,873 tokens (90.4%)


┌────────────────────────────────────────────────────────────────────────┐
│                    FAZA 4: PR CREATION                                 │
└────────────────────────────────────────────────────────────────────────┘

User: "/pm:pr-create"

┌─────────────────────┐
│ Current Context     │  Implementation complete: 4,326 tokens
│ Tokens: 4,326       │  Has: workflow, TDD, agent, Context7
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Create PR           │  PR #456 created with:
│ Tokens: 4,326       │  • Link to Task 1, Issue #123
│                     │  • Implementation summary
│ (No new files!)     │  • Test results (3/3 passing)
│                     │  • TDD evidence (git log)
│                     │  • Acceptance criteria checklist
└─────────────────────┘

💰 SAVINGS: 45,199 - 4,326 = 40,873 tokens (90.4%)
(Nie załadowano ŻADNEGO nowego pliku - używamy już załadowanego kontekstu!)


┌────────────────────────────────────────────────────────────────────────┐
│                    FAZA 5: TASK COMPLETION                             │
└────────────────────────────────────────────────────────────────────────┘

User: "/pm:task-complete 'Create User model'"

┌─────────────────────┐
│ Mark Complete       │  Task 1: ready → completed ✅
│ Tokens: 4,326       │  Issue #123: 1/5 tasks done (20%)
│                     │  Next: Task 2 ready
│ (No new files!)     │
└─────────────────────┘

💰 SAVINGS: 45,199 - 4,326 = 40,873 tokens (90.4%)
```

## 📊 Token Usage Breakdown - Pełny Workflow

### Co Się Załadowało i Kiedy

| Faza | Akcja | Plik Załadowany | Tokeny | Total | Oszczędność |
|------|-------|----------------|--------|-------|-------------|
| Start | Session start | base-optimized.md | 1,646 | 1,646 | 96.4% |
| Issue | /pm:issue-create | issue-create.md | 300 | 1,946 | 95.7% |
| Issue | Context7 query | github/issues | 200 | 2,146 | 95.3% |
| Epic | /pm:epic-decompose | epic-decompose.md | 350 | 2,496 | 94.5% |
| Epic | Context7 query | agile/epic | 200 | 2,696 | 94.0% |
| Task | /pm:task-start | workflow-steps.md | 545 | 3,241 | 92.8% |
| Task | TDD enforcement | tdd-cycle.md | 285 | 3,526 | 92.2% |
| Task | Agent invoke | python-backend-engineer.md | 600 | 4,126 | 90.9% |
| Task | Context7 query | sqlalchemy/models | 200 | 4,326 | 90.4% |
| PR | /pm:pr-create | (already loaded) | 0 | 4,326 | 90.4% |
| Complete | /pm:task-complete | (already loaded) | 0 | 4,326 | 90.4% |

**TOTAL PRZEZ CAŁY WORKFLOW: 4,326 tokenów**
**STARY SYSTEM: 45,199 tokenów**
**OSZCZĘDNOŚĆ: 40,873 tokeny (90.4%)**

## 🔑 Kluczowe Insights

### 1. Progresywne Ładowanie Przez Workflow

```
Issue Creation:     2,146 tokens (ładuje PM commands + Context7)
Epic Decomposition: 2,696 tokens (dodaje decomposition logic)
Implementation:     4,326 tokens (dodaje TDD, workflow, agent)
PR/Completion:      4,326 tokens (używa już załadowanego!)
```

### 2. Reużycie Kontekstu

**PR Creation i Task Completion NIE ładują nowych plików!**
- Używają już załadowanego workflow
- Używają już załadowanego TDD
- Używają już załadowanego agenta

**To znaczy:**
- Gdy raz załadujesz workflow → zostaje przez całą sesję
- Gdy raz załadujesz TDD → nie ładujesz ponownie
- Efektywne wykorzystanie kontekstu!

### 3. Context7 Queries Są Małe

Każde query Context7: ~200 tokenów
- Tylko kluczowe best practices
- Tylko to co potrzebne dla danej fazy
- Nie cała dokumentacja frameworka

### 4. Commands Są Lekkie

PM commands: 300-350 tokenów każdy
- Tylko logika tego commanda
- Nie cały PM system
- Lazy loading per command

## 💡 Porównanie: Stary vs Nowy System

### STARY SYSTEM - Wszystko na Starcie

```
Session Start:
├─ Pełny CLAUDE.md: 20,000 tokenów
├─ Wszystkie PM commands: 5,000 tokenów
├─ Wszystkie agenci: 8,000 tokenów
├─ Wszystkie workflows: 5,000 tokenów
├─ Wszystkie reguły: 10,000 tokenów
└─ TOTAL: 45,199 tokenów

Issue Creation: 45,199 tokens (90% niewykorzystane)
Epic Decomp:    45,199 tokens (85% niewykorzystane)
Implementation: 45,199 tokens (70% niewykorzystane)
PR Creation:    45,199 tokens (80% niewykorzystane)

PROBLEM: Zawsze 45,199 tokenów, niezależnie od tego co robisz!
```

### NOWY SYSTEM - Ładowanie Na Żądanie

```
Session Start:     1,646 tokens (tylko minimum)
                      ↓
Issue Creation:    2,146 tokens (+500 tylko dla issue)
                      ↓
Epic Decomp:       2,696 tokens (+550 tylko dla epic)
                      ↓
Implementation:    4,326 tokens (+1,630 dla impl)
                      ↓
PR Creation:       4,326 tokens (+0 reużycie!)
                      ↓
Task Complete:     4,326 tokens (+0 reużycie!)

BENEFIT: Zawsze tylko to co potrzebne + reużycie!
```

## 🚀 Real-World Scenariusze

### Scenariusz 1: Tylko Issue Creation

```
User: Chcę tylko stworzyć issue i skończyć sesję

STARY SYSTEM:
- Ładuje: 45,199 tokenów
- Używa: ~2,000 tokenów
- Marnuje: 43,199 tokenów (95.6%)

NOWY SYSTEM:
- Ładuje: 2,146 tokenów
- Używa: ~2,000 tokenów
- Marnuje: 146 tokenów (6.8%)

OSZCZĘDNOŚĆ: 43,053 tokeny!
```

### Scenariusz 2: Epic Decomposition Bez Implementacji

```
User: Stwórz issue, rozłóż na taski, skończ

STARY SYSTEM:
- Ładuje: 45,199 tokenów
- Używa: ~3,000 tokenów
- Marnuje: 42,199 tokenów (93.4%)

NOWY SYSTEM:
- Ładuje: 2,696 tokenów
- Używa: ~2,700 tokenów
- Marnuje: 0 tokenów (0%)

OSZCZĘDNOŚĆ: 42,503 tokeny + zero waste!
```

### Scenariusz 3: Pełny Workflow (Jak W Symulacji)

```
User: Issue → Epic → Implementation → PR → Complete

STARY SYSTEM:
- Ładuje: 45,199 tokenów
- Używa: ~4,500 tokenów
- Marnuje: 40,699 tokenów (90.0%)

NOWY SYSTEM:
- Ładuje: 4,326 tokenów
- Używa: ~4,300 tokenów
- Marnuje: 26 tokenów (0.6%)

OSZCZĘDNOŚĆ: 40,873 tokeny + prawie zero waste!
```

## 🎯 Wypróbuj Sam

```bash
# Pełna symulacja PM workflow
node test/pm-workflow-simulation.js

# Automatyczna wersja (wszystko od razu)
yes "" | node test/pm-workflow-simulation.js

# Tylko podsumowanie
yes "" | node test/pm-workflow-simulation.js | tail -40
```

## ✅ Wnioski

### Jak To Działa Z Issues/Tasks/Epics:

1. **Issue Creation** - Ładuje TYLKO command dla issue + Context7 (95% oszczędności)
2. **Epic Decomposition** - Dodaje TYLKO decomposition logic (94% oszczędności)
3. **Task Implementation** - Dodaje workflow + TDD + agent (90% oszczędności)
4. **PR/Completion** - REUŻYWA już załadowany kontekst (90% oszczędności, 0 nowych plików)

### Kluczowe Zalety:

✅ **Lazy Loading Per Command** - każdy /pm:command ładuje tylko swój plik
✅ **Context Reuse** - raz załadowany workflow/TDD zostaje przez sesję
✅ **Progressive Enhancement** - kontekst rośnie tylko gdy potrzebny
✅ **Near-Zero Waste** - prawie wszystko co załadowane jest używane
✅ **90%+ Savings** - przez cały workflow, każda faza
✅ **Full Functionality** - zero kompromisów w funkcjonalności

### Najlepsze:

**Gdy robisz kolejne taski w tej samej sesji:**
- Task 1: 4,326 tokenów (pierwszy task ładuje wszystko)
- Task 2: 4,326 tokenów (reużywa TDD, workflow, może inny agent +600)
- Task 3: 4,326 tokenów (znowu reużywa)

**vs Stary System:**
- Task 1: 45,199 tokenów
- Task 2: 45,199 tokenów
- Task 3: 45,199 tokenów

**3 taski = 135,597 tokenów oszczędności!** 🚀
