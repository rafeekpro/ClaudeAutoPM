#!/bin/bash

# Safe Commit Script - Ensures all checks pass before committing
# Usage: ./scripts/safe-commit.sh "commit message"

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if commit message provided
if [ -z "$1" ]; then
    print_error "Please provide a commit message"
    echo "Usage: $0 \"commit message\""
    exit 1
fi

COMMIT_MSG="$1"

print_status "Starting safe commit process..."

# 1. Format code
if command -v prettier &> /dev/null; then
    print_status "Formatting JavaScript/TypeScript files..."
    prettier --write "**/*.{js,jsx,ts,tsx,json,css,scss,md}" 2>/dev/null || true
    print_success "Code formatted with Prettier"
fi

if command -v black &> /dev/null; then
    print_status "Formatting Python files..."
    black . 2>/dev/null || true
    print_success "Code formatted with Black"
fi

# 2. Fix linting issues
if [ -f "package.json" ] && command -v npm &> /dev/null; then
    if grep -q "\"lint\":" package.json; then
        print_status "Running ESLint fix..."
        npm run lint -- --fix 2>/dev/null || true
        print_success "Linting issues fixed"
    fi
fi

if command -v ruff &> /dev/null; then
    print_status "Running Ruff fix..."
    ruff check --fix . 2>/dev/null || true
    print_success "Python linting issues fixed"
fi

# 3. Run tests
if [ -f "package.json" ] && command -v npm &> /dev/null; then
    if grep -q "\"test\":" package.json; then
        print_status "Running tests..."
        if npm test; then
            print_success "All tests passed"
        else
            print_error "Tests failed! Please fix before committing."
            exit 1
        fi
    fi
fi

if command -v pytest &> /dev/null; then
    print_status "Running Python tests..."
    if pytest; then
        print_success "All Python tests passed"
    else
        print_error "Python tests failed! Please fix before committing."
        exit 1
    fi
fi

# 4. Build project
if [ -f "package.json" ] && command -v npm &> /dev/null; then
    if grep -q "\"build\":" package.json; then
        print_status "Building project..."
        if npm run build; then
            print_success "Build successful"
        else
            print_error "Build failed! Please fix before committing."
            exit 1
        fi
    fi
fi

# 5. Check TypeScript
if [ -f "tsconfig.json" ] && command -v npx &> /dev/null; then
    print_status "Checking TypeScript..."
    if npx tsc --noEmit; then
        print_success "TypeScript check passed"
    else
        print_error "TypeScript errors found! Please fix before committing."
        exit 1
    fi
fi

# 6. Check for secrets
print_status "Checking for potential secrets..."
SECRETS_PATTERNS=(
    "password.*=.*['\"]"
    "api[_-]?key.*=.*['\"]"
    "secret.*=.*['\"]"
    "token.*=.*['\"]"
    "AWS_ACCESS_KEY"
    "AWS_SECRET"
    "PRIVATE_KEY"
)

FOUND_SECRETS=false
for pattern in "${SECRETS_PATTERNS[@]}"; do
    if git diff --cached | grep -iE "$pattern" > /dev/null 2>&1; then
        print_warning "Potential secret found matching pattern: $pattern"
        FOUND_SECRETS=true
    fi
done

if [ "$FOUND_SECRETS" = true ]; then
    print_warning "Potential secrets detected in staged changes!"
    read -p "Are you sure you want to continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Commit cancelled due to potential secrets"
        exit 1
    fi
fi

# 7. Stage all changes
print_status "Staging all changes..."
git add -A
print_success "Changes staged"

# 8. Create commit
print_status "Creating commit..."
if git commit -m "$COMMIT_MSG"; then
    print_success "Commit created successfully!"
    echo
    print_success "✨ Safe commit completed! ✨"
    echo
    print_status "Next steps:"
    echo "  - Review your commit: git log -1"
    echo "  - Push to remote: git push"
else
    print_error "Commit failed!"
    exit 1
fi