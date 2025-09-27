# 🎯 Plan Pełnego Pokrycia Testami - AutoPM Framework

## 📊 Stan Obecny
- **Przetestowane**: 14/86 plików (16%)
- **Nieprzetestowane**: 72/86 plików (84%)
- **Cel**: 100% pokrycie wszystkich plików JS

## 🚀 Harmonogram Realizacji (8 faz)

### **FAZA 1: PM Scripts - Dokończenie Krytycznych (2-3 dni)**

#### ✅ Już Ukończone (Program TDD)
- [x] blocked.js (77.43%)
- [x] epic-show.js (76.28%)
- [x] epic-status.js (87.28%)
- [x] in-progress.js (75.84%)

#### 🎯 Do Poprawy
- [ ] **search.js** (14.06% → 80%+)
  - Testy wyszukiwania w epic
  - Obsługa filtrów i sortowania
  - Edge cases i błędy
  - Integracja z różnymi formatami

- [ ] **init.js** (42.27% → 80%+)
  - Inicjalizacja nowych epic
  - Walidacja parametrów
  - Generowanie struktur plików
  - Obsługa błędów systemu plików

#### 🟡 Do Optymalizacji
- [ ] **prd-list.js** (59.49% → 80%+)
- [ ] **next.js** (78.65% → 85%+)
- [ ] **standup.js** (77.52% → 85%+)
- [ ] **router.js** (35.40% → 80%+)

**Pliki testowe do utworzenia:**
```
test/migration/pm-search-jest.test.js
test/migration/pm-init-jest.test.js
test/migration/pm-prd-list-enhanced.test.js
test/migration/pm-next-enhanced.test.js
test/migration/pm-standup-enhanced.test.js
test/migration/providers-router-jest.test.js
```

---

### **FAZA 2: Azure Providers - Core Functionality (3-4 dni)**

#### 🔴 Issue Management (Priorytet 1)
- [ ] **issue-close.js** (0% → 80%+)
  - Zamykanie work items
  - Walidacja ID
  - Integracja z Azure API
  - Obsługa błędów połączenia

- [ ] **issue-start.js** (0% → 80%+)
  - Rozpoczynanie pracy nad issue
  - Aktualizacja statusu
  - Przypisanie użytkownika
  - Synchronizacja z local state

- [ ] **issue-edit.js** (0% → 80%+)
  - Edycja metadanych
  - Walidacja pól
  - Bulk operations
  - Rollback mechanizm

- [ ] **issue-list.js** (0% → 80%+)
  - Listowanie work items
  - Filtry i sortowanie
  - Paginacja
  - Cache management

- [ ] **issue-show.js** (0% → 80%+)
  - Szczegóły work item
  - Related items
  - History tracking
  - Format output

#### 🟡 Epic Management (Priorytet 2)
- [ ] **epic-list.js** (0% → 80%+)
- [ ] **epic-show.js** (0% → 80%+)

#### 🟢 Libs and Utils (Priorytet 3)
- [ ] **lib/client.js** (0% → 90%+)
  - Azure DevOps REST API client
  - Authentication handling
  - Rate limiting
  - Error recovery

- [ ] **lib/formatter.js** (0% → 85%+)
  - Output formatting
  - Data transformation
  - Localization
  - Template engine

- [ ] **lib/cache.js** (0% → 85%+)
  - Caching mechanizm
  - TTL management
  - Cache invalidation
  - Performance optimization

**Pliki testowe do utworzenia:**
```
test/providers/azure/issue-close.test.js
test/providers/azure/issue-start.test.js
test/providers/azure/issue-edit.test.js
test/providers/azure/issue-list.test.js
test/providers/azure/issue-show.test.js
test/providers/azure/epic-list.test.js
test/providers/azure/epic-show.test.js
test/providers/azure/lib/client.test.js
test/providers/azure/lib/formatter.test.js
test/providers/azure/lib/cache.test.js
```

---

### **FAZA 3: Azure Providers - Advanced Features (2-3 dni)**

#### 📊 Reporting & Analytics
- [ ] **board-show.js** (0% → 80%+)
- [ ] **dashboard.js** (0% → 80%+)
- [ ] **sprint-report.js** (0% → 80%+)

#### 🔄 Features & User Stories
- [ ] **feature-list.js** (0% → 80%+)
- [ ] **feature-show.js** (0% → 80%+)
- [ ] **feature-status.js** (0% → 80%+)
- [ ] **us-status.js** (0% → 80%+)
- [ ] **us-list.js** (0% → 80%+)

#### 🧪 Testing Integration
- [ ] **test-run.js** (0% → 80%+)
- [ ] **test-plan-create.js** (0% → 80%+)
- [ ] **test-summary.js** (0% → 80%+)

**Pliki testowe do utworzenia:**
```
test/providers/azure/board-show.test.js
test/providers/azure/dashboard.test.js
test/providers/azure/sprint-report.test.js
test/providers/azure/feature-*.test.js
test/providers/azure/us-*.test.js
test/providers/azure/test-*.test.js
```

---

### **FAZA 4: GitHub Providers (1-2 dni)**

#### 🐙 GitHub Integration
- [ ] **issue-close.js** (0% → 80%+)
  - GitHub Issues API
  - Webhook handling
  - State synchronization
  - Label management

- [ ] **issue-start.js** (0% → 80%+)
- [ ] **issue-show.js** (0% → 80%+)
- [ ] **epic-list.js** (0% → 80%+)
- [ ] **epic-show.js** (0% → 80%+)

**Pliki testowe do utworzenia:**
```
test/providers/github/issue-close.test.js
test/providers/github/issue-start.test.js
test/providers/github/issue-show.test.js
test/providers/github/epic-list.test.js
test/providers/github/epic-show.test.js
```

---

### **FAZA 5: Azure Scripts - Daily Operations (2-3 dni)**

#### 📅 Daily Workflow
- [ ] **active-work.js** (0% → 80%+)
- [ ] **daily.js** (0% → 80%+)
- [ ] **next-task.js** (0% → 80%+)
- [ ] **sync.js** (0% → 80%+)

#### 🔍 Search & Navigation
- [ ] **search.js** (0% → 80%+)
- [ ] **blocked.js** (0% → 80%+)
- [ ] **validate.js** (0% → 80%+)

#### ⚙️ Setup & Configuration
- [ ] **setup.js** (0% → 80%+)
- [ ] **help.js** (0% → 80%+)

**Pliki testowe do utworzenia:**
```
test/scripts/azure/active-work.test.js
test/scripts/azure/daily.test.js
test/scripts/azure/next-task.test.js
test/scripts/azure/sync.test.js
test/scripts/azure/search.test.js
test/scripts/azure/blocked.test.js
test/scripts/azure/validate.test.js
test/scripts/azure/setup.test.js
test/scripts/azure/help.test.js
```

---

### **FAZA 6: Command Libraries - Infrastructure (3-4 dni)**

#### 🏗️ Core Infrastructure
- [ ] **api/documentation.js** (0% → 80%+)
  - API docs generation
  - OpenAPI spec validation
  - Interactive documentation
  - Version management

#### 🔧 Context Management
- [ ] **context/create.js** (0% → 80%+)
- [ ] **context/prime.js** (0% → 80%+)
- [ ] **context/update.js** (0% → 80%+)

#### 🚀 Deployment & DevOps
- [ ] **github/workflow.js** (0% → 80%+)
- [ ] **traefik/setup.js** (0% → 80%+)

#### 🤖 AI/ML Integration
- [ ] **langgraph/workflow.js** (0% → 80%+)
- [ ] **openai/chat.js** (0% → 80%+)

**Pliki testowe do utworzenia:**
```
test/commands/api/documentation.test.js
test/commands/context/create.test.js
test/commands/context/prime.test.js
test/commands/context/update.test.js
test/commands/github/workflow.test.js
test/commands/traefik/setup.test.js
test/commands/langgraph/workflow.test.js
test/commands/openai/chat.test.js
```

---

### **FAZA 7: Command Libraries - Development Tools (2-3 dni)**

#### 🏗️ Scaffolding & Generators
- [ ] **python/scaffold.js** (0% → 80%+)
- [ ] **react/scaffold.js** (0% → 80%+)
- [ ] **tailwind/system.js** (0% → 80%+)

#### 🧪 Testing & Quality
- [ ] **testing/prime.js** (0% → 80%+)
- [ ] **testing/run.js** (0% → 80%+)
- [ ] **regression/suite.js** (0% → 80%+)
- [ ] **performance/benchmark.js** (0% → 80%+)

#### 📋 Project Management
- [ ] **pm/prdParse.js** (0% → 80%+)
- [ ] **pm/prdReview.js** (0% → 80%+)
- [ ] **pm/prdStatus.js** (0% → 80%+)

#### 🔐 Security
- [ ] **ssh/security.js** (0% → 80%+)

#### 👤 User Management
- [ ] **user/guide.js** (0% → 80%+)

**Pliki testowe do utworzenia:**
```
test/commands/python/scaffold.test.js
test/commands/react/scaffold.test.js
test/commands/tailwind/system.test.js
test/commands/testing/prime.test.js
test/commands/testing/run.test.js
test/commands/regression/suite.test.js
test/commands/performance/benchmark.test.js
test/commands/pm/prdParse.test.js
test/commands/pm/prdReview.test.js
test/commands/pm/prdStatus.test.js
test/commands/ssh/security.test.js
test/commands/user/guide.test.js
```

---

### **FAZA 8: Utility Scripts - Infrastructure Support (1-2 dni)**

#### 🛠️ Core Utilities
- [ ] **decompose-issue.js** (0% → 80%+)
- [ ] **start-parallel-streams.js** (0% → 80%+)
- [ ] **install-hooks.js** (0% → 80%+)

#### 🐳 Docker Integration
- [ ] **docker-toggle.js** (0% → 80%+)
- [ ] **docker-dev-setup.js** (0% → 80%+)

#### 🔍 Validation & CI/CD
- [ ] **pr-validation.js** (0% → 80%+)
- [ ] **test-and-log.js** (0% → 80%+)

#### ⚙️ Configuration
- [ ] **setup-context7.js** (0% → 80%+)
- [ ] **config/toggle-features.js** (0% → 80%+)

**Pliki testowe do utworzenia:**
```
test/scripts/decompose-issue.test.js
test/scripts/start-parallel-streams.test.js
test/scripts/install-hooks.test.js
test/scripts/docker-toggle.test.js
test/scripts/docker-dev-setup.test.js
test/scripts/pr-validation.test.js
test/scripts/test-and-log.test.js
test/scripts/setup-context7.test.js
test/scripts/config/toggle-features.test.js
```

---

## 📈 Strategia Implementacji

### 🎯 Metodologia TDD dla Każdej Fazy

#### 1. **Analiza Kodu (30 min/plik)**
```bash
# Przeczytaj i zrozum funkcjonalność
code autopm/.claude/providers/azure/issue-close.js

# Zidentyfikuj main functions
grep -n "function\|class\|async" file.js

# Sprawdź dependencies
grep -n "require\|import" file.js
```

#### 2. **Napisanie Testów (2h/plik)**
```bash
# Utwórz plik testowy
touch test/providers/azure/issue-close.test.js

# Template struktury:
describe('AzureIssueClose', () => {
  describe('Basic Functionality', () => {})
  describe('Error Handling', () => {})
  describe('Edge Cases', () => {})
  describe('Integration', () => {})
})
```

#### 3. **Mockowanie Dependencies (1h/plik)**
- Azure API calls
- File system operations
- External processes
- Environment variables

#### 4. **Veryfikacja Pokrycia (30 min/plik)**
```bash
npm run test:coverage -- --collectCoverageFrom="path/to/file.js"
# Cel: >80% coverage
```

### 🛠️ Narzędzia i Templates

#### Test Template Generator
```bash
# Utwórz automatyczny generator testów
node scripts/generate-test-template.js <file-path>
```

#### Mock Libraries Setup
```javascript
// Common mocks for wszystkich testów
jest.mock('child_process')
jest.mock('fs-extra')
jest.mock('axios')
```

#### Coverage Monitoring
```bash
# Codzienne sprawdzanie postępu
npm run coverage:monitor
npm run coverage:report > daily_coverage_report.txt
```

---

## 📊 Metryki Sukcesu

### 🎯 Cele dla Każdej Fazy

| Faza | Pliki | Cel Pokrycia | Czas | Priority |
|------|-------|--------------|------|----------|
| **1** | PM Scripts (6) | 80%+ | 2-3 dni | 🔥 CRITICAL |
| **2** | Azure Core (10) | 80%+ | 3-4 dni | 🔥 CRITICAL |
| **3** | Azure Advanced (10) | 80%+ | 2-3 dni | 🟡 HIGH |
| **4** | GitHub (5) | 80%+ | 1-2 dni | 🟡 HIGH |
| **5** | Azure Scripts (9) | 80%+ | 2-3 dni | 🟡 HIGH |
| **6** | Commands Core (8) | 80%+ | 3-4 dni | 🟢 MEDIUM |
| **7** | Commands Dev (12) | 80%+ | 2-3 dni | 🟢 MEDIUM |
| **8** | Utilities (9) | 80%+ | 1-2 dni | 🟢 LOW |

### 📈 Tracking Dashboard

#### Daily Metrics
```bash
# Automatyczne raporty
npm run coverage:daily
# Output: "Phase 2: 7/10 files completed (70%)"
```

#### Weekly Reviews
- Przegląd completed phases
- Adjustments do harmonogramu
- Quality assurance checks
- Performance impact analysis

---

## 🚀 Expected Outcomes

### 📊 Final Coverage Goals
- **Overall Project Coverage**: 90%+
- **Critical Components**: 95%+
- **New Code Requirements**: 100%
- **Regression Risk**: MINIMAL

### 🎖️ Quality Benefits
- ✅ Production-ready codebase
- ✅ Automated quality gates
- ✅ Confidence in refactoring
- ✅ Faster development cycles
- ✅ Reduced bug reports
- ✅ Better documentation
- ✅ Team knowledge sharing

---

## 📝 Implementation Notes

### 🔧 Development Setup
```bash
# Setup test environment
npm install --save-dev jest @types/jest
npm install --save-dev supertest nock sinon

# Configure coverage thresholds
# In jest.config.js:
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### 📋 Daily Workflow
1. **Morning**: Review overnight CI results
2. **Plan**: Select 2-3 files for current day
3. **Execute**: TDD cycle for each file
4. **Review**: Coverage verification
5. **Commit**: With coverage report
6. **Monitor**: CI pipeline success

### 🎯 Success Criteria
- **Coverage**: >80% for each file
- **Quality**: All tests pass
- **Performance**: No significant slowdown
- **Maintainability**: Clear, readable tests
- **Documentation**: Self-documenting test cases

---

**Total Effort Estimate: 15-20 days**
**Total Files to Test: 72 files**
**Expected Final Coverage: 90%+**

🎉 **End Goal**: Comprehensive, production-ready test suite covering entire AutoPM framework!