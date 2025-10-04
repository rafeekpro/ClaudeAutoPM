#!/bin/bash
# Fix invalid command references in documentation

set -e

echo "🔧 Fixing invalid command references..."

# Replacement map (escaped for use in sed)
declare -A REPLACEMENTS=(
  ["\/pm:epic-new"]="\/pm:prd-new"
  ["\/pm:done"]="\/pm:issue-close"
  ["\/pm:next-task"]="\/pm:next"
  ["\/pm:epic-resolve"]="\/pm:epic-close"
  ["\/pm:epic-stop"]="\/pm:epic-close"
  ["\/pm:prd-split"]="\/pm:epic-split"
)

# Commands to remove (no replacement) - escaped
REMOVE_COMMANDS=(
  "\/pm:azure-next"
  "\/pm:azure-sync"
  "\/pm:board"
  "\/pm:build"
  "\/pm:config"
  "\/pm:optimize"
  "\/pm:pr-create"
  "\/pm:pr-list"
  "\/pm:query"
  "\/pm:release"
  "\/pm:report"
  "\/pm:resource"
  "\/pm:resource-action"
  "\/pm:sprint"
  "\/pm:sprint-status"
  "\/pm:sync-all"
  "\/pm:test"
  "\/pm:todo"
  "\/pm:wip"
)

# Generic commands to remove (too vague) - escaped
GENERIC_COMMANDS=(
  "\/pm:epic"
  "\/pm:issue"
  "\/pm:prd"
  "\/pm:pr"
)

total_changes=0

# Function to replace in file
replace_in_file() {
  local file="$1"
  local old="$2"
  local new="$3"

  if grep -q "$old" "$file" 2>/dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|$old|$new|g" "$file"
    else
      sed -i "s|$old|$new|g" "$file"
    fi
    echo "  ✓ $file: $old → $new"
    ((total_changes++))
  fi
}

# Function to remove command references
remove_from_file() {
  local file="$1"
  local cmd="$2"

  if grep -q "$cmd" "$file" 2>/dev/null; then
    # Remove lines containing the command (with word boundary)
    # Match only whole command tokens, not substrings
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' -E "/([[:space:]]|^)${cmd}([[:space:]]|\$|[[:punct:]])/d" "$file"
    else
      sed -i -E "/([[:space:]]|^)${cmd}([[:space:]]|\$|[[:punct:]])/d" "$file"
    fi
    echo "  ✗ $file: removed $cmd"
    ((total_changes++))
  fi
}

echo ""
echo "=== Replacing commands with correct alternatives ==="
for old in "${!REPLACEMENTS[@]}"; do
  new="${REPLACEMENTS[$old]}"
  echo ""
  echo "Replacing: $old → $new"

  # Find files with this command (excluding our analysis doc and script)
  while IFS= read -r file; do
    if [[ "$file" != *"MISSING-COMMANDS-ANALYSIS.md"* ]] && \
       [[ "$file" != *"fix-invalid-command-refs.sh"* ]]; then
      replace_in_file "$file" "$old" "$new"
    fi
  done < <(grep -rl "$old" . --include="*.md" 2>/dev/null || true)
done

echo ""
echo "=== Removing commands with no replacement ==="
for cmd in "${REMOVE_COMMANDS[@]}"; do
  echo ""
  echo "Removing: $cmd"

  while IFS= read -r file; do
    if [[ "$file" != *"MISSING-COMMANDS-ANALYSIS.md"* ]] && \
       [[ "$file" != *"fix-invalid-command-refs.sh"* ]]; then
      remove_from_file "$file" "$cmd"
    fi
  done < <(grep -rl "$cmd" . --include="*.md" 2>/dev/null || true)
done

echo ""
echo "=== Removing generic commands (too vague) ==="
for cmd in "${GENERIC_COMMANDS[@]}"; do
  echo ""
  echo "Removing: $cmd (too vague - use specific commands instead)"

  while IFS= read -r file; do
    if [[ "$file" != *"MISSING-COMMANDS-ANALYSIS.md"* ]] && \
       [[ "$file" != *"fix-invalid-command-refs.sh"* ]] && \
       [[ "$file" != *"COMMANDS.md"* ]]; then
      # Only remove if it's standalone, not part of a longer command
      if grep -E "$cmd[[:space:]]|$cmd\$|$cmd\`" "$file" &>/dev/null; then
        remove_from_file "$file" "$cmd"
      fi
    fi
  done < <(grep -rl "$cmd" . --include="*.md" 2>/dev/null || true)
done

echo ""
echo "════════════════════════════════════════════"
echo "✅ Complete! Total changes: $total_changes"
echo "════════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. Review changes: git diff"
echo "2. Test affected documentation"
echo "3. Commit: git add . && git commit -m 'fix: remove invalid command references'"
