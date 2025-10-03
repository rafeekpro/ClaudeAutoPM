# `/pm:epic-decompose` - Quick Guide

## ⚡ TL;DR

**Po `/pm:epic-split` NIE MUSISZ uruchamiać wiele razy `/pm:epic-decompose`!**

```bash
# ❌ NIEPOTRZEBNE (stary sposób):
/pm:epic-decompose ecommerce/01-infrastructure
/pm:epic-decompose ecommerce/02-auth-backend
/pm:epic-decompose ecommerce/03-product-api
/pm:epic-decompose ecommerce/04-frontend
/pm:epic-decompose ecommerce/05-ui
/pm:epic-decompose ecommerce/06-testing

# ✅ WYSTARCZY (jedna komenda):
/pm:epic-decompose ecommerce
```

---

## Jak to działa?

### Single Epic
```bash
/pm:prd-parse simple-feature
/pm:epic-decompose simple-feature  # Dekompozycja 1 epika
```

**Struktura:**
```
.claude/epics/simple-feature/
├── epic.md
├── 001.md
├── 002.md
└── 003.md
```

---

### Multi-Epic (po split)
```bash
/pm:epic-split complex-feature
/pm:epic-decompose complex-feature  # AUTOMATYCZNIE dekompozycja WSZYSTKICH
```

**Komenda wykrywa:**
```
.claude/epics/complex-feature/
├── 01-epic1/
│   └── epic.md  ← znaleziony!
├── 02-epic2/
│   └── epic.md  ← znaleziony!
└── 03-epic3/
    └── epic.md  ← znaleziony!
```

**I dekompozycja każdego:**
```
.claude/epics/complex-feature/
├── 01-epic1/
│   ├── epic.md
│   ├── 001.md
│   ├── 002.md
│   └── ...
├── 02-epic2/
│   ├── epic.md
│   ├── 001.md
│   ├── 002.md
│   └── ...
└── 03-epic3/
    ├── epic.md
    ├── 001.md
    └── ...
```

---

## Tryby użycia

### 1. Automatyczny (Multi-Epic) - ZALECANE
```bash
/pm:epic-decompose ecommerce-platform
```
→ Dekompozycja **wszystkich** epików automatycznie

### 2. Pojedynczy (z Multi-Epic)
```bash
/pm:epic-decompose ecommerce-platform/01-infrastructure
```
→ Dekompozycja tylko tego jednego

### 3. Single Epic
```bash
/pm:epic-decompose simple-feature
```
→ Dekompozycja jedynego epika

---

## Complete Workflow

### Prosty Feature (1 epic)
```bash
/pm:prd-parse login
/pm:epic-decompose login
/pm:epic-sync login
```

### Kompleksowy Feature (6 epików)
```bash
/pm:epic-split ecommerce
/pm:epic-decompose ecommerce    # ← JEDNA komenda dla WSZYSTKICH!
/pm:epic-sync ecommerce
```

---

## FAQ

**Q: Muszę uruchamiać `/pm:epic-decompose` dla każdego epika?**
A: NIE! Wystarczy raz: `/pm:epic-decompose <feature-name>`

**Q: Jak dekompozycja wie które epiki przetworzyć?**
A: Szuka podfolderów z `epic.md` w `.claude/epics/<feature-name>/`

**Q: Co jeśli chcę dekompozycję tylko jednego?**
A: Użyj pełnej ścieżki: `/pm:epic-decompose <feature>/<epic-folder>`

**Q: Czy mogę uruchomić ponownie dla jednego epika?**
A: TAK, ale zapyta czy usunąć istniejące taski

---

## Przykład Real-World

```bash
# 1. Kompleksowy PRD
vim .claude/prds/saas-platform.md

# 2. Split na epiki (wykryje 8 epików)
/pm:epic-split saas-platform

# Wynik:
# ✓ 01-infrastructure (P0, 1w)
# ✓ 02-auth-backend (P0, 2w)
# ✓ 03-user-management (P0, 1w)
# ✓ 04-billing-api (P1, 2w)
# ✓ 05-frontend-core (P0, 1w)
# ✓ 06-admin-dashboard (P1, 2w)
# ✓ 07-analytics (P2, 1w)
# ✓ 08-testing-ci (P1, 1w)

# 3. JEDNA komenda = wszystkie epiki!
/pm:epic-decompose saas-platform

# Wynik:
# 📂 Processing: 01-infrastructure
#    ✅ Created 15 tasks
# 📂 Processing: 02-auth-backend
#    ✅ Created 20 tasks
# 📂 Processing: 03-user-management
#    ✅ Created 12 tasks
# ... (wszystkie 8 epików)
#
# ✅ Total: 120 tasks across 8 epics

# 4. Sync wszystkiego
/pm:epic-sync saas-platform

# 5. Rozpocznij pracę
/pm:epic-start saas-platform/01-infrastructure
```

---

**Pamiętaj:** Jedna komenda = wszystkie epiki! 🚀
