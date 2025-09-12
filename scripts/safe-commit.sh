#!/bin/bash

# Safe Commit Script - Zapewnia że wszystko jest sprawdzone przed commitem
# Użycie: ./scripts/safe-commit.sh "commit message"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║         SAFE COMMIT VERIFICATION             ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"

# Sprawdź czy podano wiadomość
if [ -z "$1" ]; then
    echo -e "${RED}❌ Error: Commit message required${NC}"
    echo "Usage: $0 \"your commit message\""
    exit 1
fi

COMMIT_MSG="$1"
FAILED=0

# Funkcja do sprawdzania statusu
check_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        return 0
    else
        echo -e "${RED}✗${NC} $1"
        FAILED=1
        return 1
    fi
}

# 1. Sprawdź git status
echo -e "\n${BLUE}📊 Git Status:${NC}"
git status --short
if [ -z "$(git status --short)" ]; then
    echo -e "${YELLOW}⚠️  No changes to commit${NC}"
    exit 0
fi

# 2. Sprawdź czy są unstaged changes
echo -e "\n${BLUE}🔍 Checking for unstaged changes...${NC}"
if ! git diff --quiet; then
    echo -e "${YELLOW}⚠️  You have unstaged changes:${NC}"
    git diff --stat
    echo -e "${YELLOW}Add them with 'git add' or stash them${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 3. Uruchom formattery
echo -e "\n${BLUE}🎨 Running formatters...${NC}"

# JavaScript/TypeScript
if [ -f "package.json" ]; then
    if grep -q '"prettier"' package.json; then
        npx prettier --write . 2>/dev/null
        check_status "Prettier formatting"
    fi
    
    if grep -q '"eslint"' package.json; then
        npx eslint --fix . 2>/dev/null
        check_status "ESLint fixes"
    fi
fi

# Python
if [ -f "pyproject.toml" ] || [ -f "setup.py" ]; then
    if command -v black &> /dev/null; then
        black . 2>/dev/null
        check_status "Black formatting"
    fi
    
    if command -v isort &> /dev/null; then
        isort . 2>/dev/null
        check_status "Import sorting"
    fi
fi

# 4. Uruchom linters
echo -e "\n${BLUE}🔎 Running linters...${NC}"

if [ -f "package.json" ]; then
    if grep -q '"lint"' package.json; then
        npm run lint >/dev/null 2>&1
        check_status "Linting"
    fi
fi

if command -v ruff &> /dev/null; then
    ruff check . >/dev/null 2>&1
    check_status "Ruff check"
fi

# 5. Uruchom testy
echo -e "\n${BLUE}🧪 Running tests...${NC}"

if [ -f "package.json" ] && grep -q '"test"' package.json; then
    npm test >/dev/null 2>&1
    check_status "Unit tests"
fi

if command -v pytest &> /dev/null; then
    pytest >/dev/null 2>&1
    check_status "Pytest"
fi

# 6. Build
echo -e "\n${BLUE}🔨 Running build...${NC}"

if [ -f "package.json" ] && grep -q '"build"' package.json; then
    npm run build >/dev/null 2>&1
    check_status "Build"
fi

# 7. TypeScript check
if [ -f "tsconfig.json" ]; then
    echo -e "\n${BLUE}📘 TypeScript check...${NC}"
    npx tsc --noEmit >/dev/null 2>&1
    check_status "TypeScript"
fi

# 8. Sprawdź security
echo -e "\n${BLUE}🔒 Security checks...${NC}"

# Sprawdź czy nie ma sekretów
if grep -r "password\|secret\|api_key\|token" --exclude-dir=.git --exclude-dir=node_modules --exclude="*.md" . 2>/dev/null | grep -v "^Binary" | grep -i "=\|:" | head -1 >/dev/null; then
    echo -e "${YELLOW}⚠️  Potential secrets detected${NC}"
    echo "Review these lines:"
    grep -r "password\|secret\|api_key" --exclude-dir=.git --exclude-dir=node_modules --exclude="*.md" . 2>/dev/null | grep -v "^Binary" | head -3
fi

# Podsumowanie
echo -e "\n${CYAN}╔══════════════════════════════════════════════╗${NC}"
if [ $FAILED -eq 0 ]; then
    echo -e "${CYAN}║${GREEN}          ✅ ALL CHECKS PASSED!              ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
    
    # Dodaj zmiany
    echo -e "\n${BLUE}📦 Staging changes...${NC}"
    git add -A
    
    # Commituj
    echo -e "${BLUE}💾 Creating commit...${NC}"
    git commit -m "$COMMIT_MSG"
    
    if [ $? -eq 0 ]; then
        echo -e "\n${GREEN}✅ Commit successful!${NC}"
        echo -e "${CYAN}Ready to push with: git push${NC}"
    else
        echo -e "\n${RED}❌ Commit failed${NC}"
        exit 1
    fi
else
    echo -e "${CYAN}║${RED}          ❌ CHECKS FAILED!                  ${CYAN}║${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
    echo -e "\n${YELLOW}Fix the issues above before committing${NC}"
    exit 1
fi