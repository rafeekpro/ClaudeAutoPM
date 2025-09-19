# 📚 Strategia Dokumentacji GitHub dla ClaudeAutoPM

## 🔍 Obecny Stan

### 1. **Lokalne zasoby dokumentacji**
```
AUTOPM/
├── README.md           # ✅ Główna dokumentacja (aktualna)
├── CHANGELOG.md        # ✅ Historia zmian
├── CONTRIBUTING.md     # ✅ Przewodnik dla kontrybutorów
├── wiki/              # 📚 21 plików MD z dokumentacją
├── docs/              # ⚠️ PUSTY katalog
└── docs-site/         # 🆕 Nowy portal VitePress
```

### 2. **GitHub Features**
- **Wiki**: ✅ Włączona (hasWikiEnabled: true)
- **GitHub Pages**: 🔧 Skonfigurowana (workflow gotowy)
- **Homepage URL**: ❌ Nie ustawiona

### 3. **Zawartość Wiki (21 plików)**
- Agent-Registry.md
- Agent-Selection-Guide.md
- Azure-DevOps-Integration.md
- CLI-Reference.md
- Configuration-Options.md
- Custom-Agents.md
- Docker-First-Development.md
- Environment-Variables.md
- Feature-Toggles.md
- First-Project.md
- GitHub-Actions.md
- Home.md
- Installation-Guide.md
- PM-Commands.md
- Quality-Assurance.md
- Quick-Start.md
- Testing-Strategies.md
- Troubleshooting.md
- CLAUDE-Templates.md

## 🎯 Strategia Konsolidacji

### **Option 1: Centralizacja w GitHub Pages** (REKOMENDOWANA)

#### Działania:
1. **Migracja Wiki → VitePress**
   - Przenieś wszystkie pliki z `wiki/` do `docs-site/docs/`
   - Zachowaj strukturę kategorii
   - Zaktualizuj linki wewnętrzne

2. **Publikacja na GitHub Pages**
   - URL: `https://rafeekpro.github.io/ClaudeAutoPM/`
   - Automatyczne wdrożenie przez GitHub Actions
   - Wyszukiwarka i nawigacja VitePress

3. **Wyłączenie GitHub Wiki**
   - Po migracji wyłącz Wiki w ustawieniach repo
   - Przekieruj użytkowników do GitHub Pages

#### Zalety:
- ✅ Jedna lokalizacja dokumentacji
- ✅ Profesjonalny wygląd (VitePress)
- ✅ Pełna kontrola nad stylami
- ✅ Wbudowana wyszukiwarka
- ✅ Wersjonowanie z kodem

#### Struktura docelowa:
```
docs-site/docs/
├── guide/
│   ├── getting-started.md      (z wiki/Quick-Start.md)
│   ├── installation.md          (z wiki/Installation-Guide.md)
│   ├── first-project.md        (z wiki/First-Project.md)
│   └── interactive-setup.md    (istniejący)
├── commands/
│   ├── cli-reference.md        (z wiki/CLI-Reference.md)
│   ├── pm-commands.md          (z wiki/PM-Commands.md)
│   └── azure-commands.md       (z wiki/Azure-DevOps-Integration.md)
├── agents/
│   ├── registry.md             (z wiki/Agent-Registry.md)
│   ├── selection-guide.md      (z wiki/Agent-Selection-Guide.md)
│   └── custom-agents.md        (z wiki/Custom-Agents.md)
├── development/
│   ├── docker-first.md         (z wiki/Docker-First-Development.md)
│   ├── testing.md              (z wiki/Testing-Strategies.md)
│   ├── quality.md              (z wiki/Quality-Assurance.md)
│   └── github-actions.md       (z wiki/GitHub-Actions.md)
└── reference/
    ├── configuration.md         (z wiki/Configuration-Options.md)
    ├── environment-vars.md      (z wiki/Environment-Variables.md)
    ├── feature-toggles.md       (z wiki/Feature-Toggles.md)
    ├── claude-templates.md      (z wiki/CLAUDE-Templates.md)
    └── troubleshooting.md       (z wiki/Troubleshooting.md)
```

### **Option 2: Hybrydowa (Wiki + Pages)**

#### Działania:
- Zachowaj Wiki dla szczegółowej dokumentacji technicznej
- GitHub Pages dla głównej dokumentacji użytkownika
- README.md jako punkt wejścia

#### Zalety/Wady:
- ⚠️ Dwa miejsca do utrzymania
- ⚠️ Potencjalne niespójności
- ✅ Wiki łatwiejsze do edycji przez community

### **Option 3: Tylko README + Wiki**

#### Działania:
- Usuń docs-site
- Rozbuduj README
- Zachowaj Wiki

#### Zalety/Wady:
- ❌ Brak profesjonalnego portalu
- ❌ Brak wyszukiwarki
- ✅ Najprostsza opcja

## 📋 Plan Implementacji (Option 1)

### Faza 1: Przygotowanie
```bash
# 1. Backup wiki
cp -r wiki/ wiki-backup/

# 2. Utworzenie struktury katalogów
mkdir -p docs-site/docs/{agents,development,reference}
```

### Faza 2: Migracja
```bash
# 3. Przeniesienie plików z odpowiednim mapowaniem
# (skrypt migracyjny)

# 4. Aktualizacja konfiguracji VitePress
# (dodanie nowych sekcji do sidebar)

# 5. Aktualizacja linków wewnętrznych
```

### Faza 3: Publikacja
```bash
# 6. Build i test lokalnie
cd docs-site && npm run build

# 7. Commit i push
git add .
git commit -m "docs: Migrate wiki to VitePress documentation"
git push

# 8. Włączenie GitHub Pages
# Settings → Pages → Source: GitHub Actions
```

### Faza 4: Cleanup
```bash
# 9. Wyłączenie Wiki w ustawieniach GitHub
# 10. Usunięcie lokalnego katalogu wiki/
# 11. Aktualizacja README z linkiem do dokumentacji
```

## 🔗 Linki i Przekierowania

### Aktualizacja README.md:
```markdown
## 📖 Documentation

Full documentation is available at: https://rafeekpro.github.io/ClaudeAutoPM/

- [Getting Started](https://rafeekpro.github.io/ClaudeAutoPM/guide/getting-started)
- [Command Reference](https://rafeekpro.github.io/ClaudeAutoPM/commands/overview)
- [Agent Registry](https://rafeekpro.github.io/ClaudeAutoPM/agents/registry)
```

### Ustawienie Homepage URL w GitHub:
```
Repository Settings → Details → Website: https://rafeekpro.github.io/ClaudeAutoPM/
```

## ✅ Korzyści z Konsolidacji

1. **Dla Użytkowników**:
   - Jedna lokalizacja całej dokumentacji
   - Profesjonalny wygląd
   - Skuteczna wyszukiwarka
   - Lepsza nawigacja

2. **Dla Maintainerów**:
   - Łatwiejsze utrzymanie
   - Wersjonowanie z kodem
   - Automatyczne wdrożenia
   - Markdown z rozszerzeniami

3. **Dla Kontrybutorów**:
   - Jasna struktura
   - PR-based workflow
   - Lokalne preview
   - CI/CD validation

## 🚀 Next Steps

1. **Decyzja**: Wybór Option 1 (centralizacja w GitHub Pages)
2. **Migracja**: Przeniesienie wiki/ → docs-site/
3. **Konfiguracja**: Aktualizacja VitePress config
4. **Publikacja**: Włączenie GitHub Pages
5. **Komunikacja**: Ogłoszenie zmiany użytkownikom

## 📅 Timeline

- **Tydzień 1**: Migracja i konfiguracja
- **Tydzień 2**: Testy i poprawki
- **Tydzień 3**: Publikacja i wyłączenie Wiki
- **Tydzień 4**: Monitoring i feedback