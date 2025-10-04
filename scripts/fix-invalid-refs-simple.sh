#!/bin/bash
# Simple script to fix invalid command references

set -e

echo "🔧 Fixing invalid command references..."
echo ""

total=0

# Function to safely replace
safe_replace() {
  local old="$1"
  local new="$2"
  local desc="$3"
  local count=0

  echo "Replacing: $old → $new ($desc)"

  # Find and replace (exclude our analysis docs)
  while IFS= read -r file; do
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|$old|$new|g" "$file"
    else
      sed -i "s|$old|$new|g" "$file"
    fi
    echo "  ✓ $file"
    ((count++))
  done < <(find . -name "*.md" -type f ! -path "*/MISSING-COMMANDS-ANALYSIS.md" ! -path "*/node_modules/*" -exec grep -l "$old" {} \; 2>/dev/null)

  ((total += count))
  echo "  Updated: $count file(s)"
}

# Replacements
echo "=== Step 1: Replacing with correct alternatives ==="
safe_replace "/pm:epic-new" "/pm:prd-new" "create PRD first"
safe_replace "/pm:done" "/pm:issue-close" "close issue"
safe_replace "/pm:next-task" "/pm:next" "get next task"
safe_replace "/pm:epic-resolve" "/pm:epic-close" "close epic"
safe_replace "/pm:epic-stop" "/pm:epic-close" "close epic"
safe_replace "/pm:prd-split" "/pm:epic-split" "split after parse"

echo ""
echo "✅ Replacements complete!"
echo "📊 Total files updated: $total"
echo ""
echo "📝 Note: The following invalid commands still exist in docs:"
echo "   - Azure commands (/pm:azure-*)"
echo "   - Generic commands (/pm:epic, /pm:issue, /pm:prd, /pm:pr)"
echo "   - Other unimplemented commands"
echo ""
echo "These should be manually reviewed and removed/updated in context."
echo "See docs/MISSING-COMMANDS-ANALYSIS.md for full list."
