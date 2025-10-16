#!/usr/bin/env bash
# React component performance analysis
# Usage: ./react-component-perf.sh [component-path]

set -euo pipefail

COMPONENT_PATH="${1:-.}"

echo "⚛️  Analyzing React component performance patterns..."

# Check for common performance issues
echo ""
echo "🔍 Checking for useMemo/useCallback opportunities..."
grep -r "function.*{" "$COMPONENT_PATH" --include="*.jsx" --include="*.tsx" | wc -l | xargs -I {} echo "  Found {} inline functions (consider useCallback)"

echo ""
echo "🔍 Checking for React.memo usage..."
MEMO_COUNT=$(grep -r "React.memo\|memo(" "$COMPONENT_PATH" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
echo "  Components wrapped with memo: $MEMO_COUNT"

echo ""
echo "🔍 Checking for expensive calculations..."
grep -r "\.map\|\.filter\|\.reduce" "$COMPONENT_PATH" --include="*.jsx" --include="*.tsx" 2>/dev/null | wc -l | xargs -I {} echo "  Array operations found: {} (consider useMemo)"

echo ""
echo "📋 Best practices from Context7:"
echo "  ✓ Use useMemo for expensive calculations"
echo "  ✓ Use useCallback for functions passed as props"
echo "  ✓ Wrap components with React.memo when props don't change often"
echo "  ✓ Avoid inline object/array creation in render"
echo "  ✓ Use dependency arrays correctly in hooks"

echo ""
echo "✅ Analysis complete"
