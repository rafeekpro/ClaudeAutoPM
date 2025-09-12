# 📦 Migration Guide - Przenoszenie systemu .claude do nowego projektu

## Krok 1: Kopiowanie struktury

```bash
# W nowym projekcie
cp -r /path/to/source/project/.claude ./
```

## Krok 2: Inicjalizacja w nowym projekcie

### A. Otwórz CLAUDE.md w edytorze
```bash
# WAŻNE: Claude musi "zobaczyć" ten plik
code .claude/CLAUDE.md  # lub otwórz w swoim edytorze
```

### B. Poinformuj Claude o systemie
Powiedz Claude:
```
"Mamy system agentów i reguł w .claude/. Przeczytaj CLAUDE.md aby zrozumieć konfigurację."
```

### C. Zainicjalizuj kontekst nowego projektu
```bash
/context:create  # Tworzy dokumentację dla NOWEGO projektu
```

## Krok 3: Weryfikacja działania

### Test agentów
```bash
# Przetestuj czy agenci działają
"Użyj code-analyzer aby przeanalizować strukturę projektu"
"Użyj file-analyzer aby podsumować README.md"
```

### Test komend
```bash
/context:prime   # Powinno załadować kontekst
/pm:issue-status # Powinno pokazać status zadań
```

## Krok 4: Dostosowanie do nowego projektu

### Wyczyść stare dane
```bash
# Usuń stare PRDs i Epics z poprzedniego projektu
rm -rf .claude/prds/*
rm -rf .claude/epics/*

# Wyczyść stary kontekst
rm -f .claude/context/*.md
```

### Zaktualizuj konfigurację
- Edytuj `.claude/CLAUDE.md` jeśli potrzebujesz specyficznych ustawień
- Dodaj reguły specyficzne dla nowego projektu w `.claude/rules/`

## 🚨 Częste problemy i rozwiązania

### Problem: "Nie mogę znaleźć agenta X"
**Rozwiązanie**: 
```bash
# Pokaż Claude strukturę
ls -la .claude/agents/
# Poproś o przeczytanie
"Przeczytaj .claude/CLAUDE.md i załaduj konfigurację agentów"
```

### Problem: "Komendy /pm:* nie działają"
**Rozwiązanie**:
```bash
# Pokaż Claude komendy
ls -la .claude/commands/
# Poinformuj o systemie
"Mamy system komend PM w .claude/commands/pm/"
```

### Problem: "Agent nie widzi plików projektu"
**Rozwiązanie**:
```bash
# Upewnij się że jesteś w głównym katalogu projektu
pwd  # Powinno pokazać root projektu
# Zainicjalizuj kontekst
/context:create
```

## 🎯 Checklist migracji

- [ ] Skopiowano folder `.claude/`
- [ ] Otwarto CLAUDE.md w edytorze
- [ ] Poinformowano Claude o systemie
- [ ] Uruchomiono `/context:create`
- [ ] Przetestowano agenta (np. code-analyzer)
- [ ] Przetestowano komendę (np. /context:prime)
- [ ] Wyczyszczono stare PRDs/Epics
- [ ] Zaktualizowano kontekst projektu

## 💡 Pro Tips

1. **Zawsze rozpoczynaj sesję od:**
   - Otwarcia CLAUDE.md w edytorze
   - Wykonania `/context:prime`

2. **Jeśli Claude "zapomina" o agentach:**
   - Przypomnij: "Użyj agentów zdefiniowanych w .claude/agents/"
   - Pokaż przykład: "Użyj test-runner do uruchomienia testów"

3. **Dla lepszej integracji:**
   - Dodaj `.claude/` do `.gitignore` jeśli zawiera dane wrażliwe
   - Lub committuj aby zespół miał wspólną konfigurację

## 📝 Przykład pierwszej sesji w nowym projekcie

```bash
# 1. Otwórz CLAUDE.md
code .claude/CLAUDE.md

# 2. W rozmowie z Claude
"Mamy system agentów i reguł w .claude/. Przeczytaj CLAUDE.md."

# 3. Inicjalizacja
/context:create

# 4. Test
"Użyj code-analyzer aby przeanalizować główne pliki projektu"

# 5. Jeśli działa - sukces! 🎉
```