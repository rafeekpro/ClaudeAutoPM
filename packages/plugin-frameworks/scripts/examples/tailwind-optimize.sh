#!/usr/bin/env bash
# Tailwind CSS optimization checker
# Usage: ./tailwind-optimize.sh [src-path]

set -euo pipefail

SRC_PATH="${1:-./src}"

echo "🎨 Analyzing Tailwind CSS usage and optimization..."

# Check for responsive design patterns
echo ""
echo "🔍 Checking responsive design patterns..."
RESPONSIVE_COUNT=$(grep -r "sm:\|md:\|lg:\|xl:\|2xl:" "$SRC_PATH" --include="*.jsx" --include="*.tsx" --include="*.vue" --include="*.html" 2>/dev/null | wc -l || echo "0")
echo "  Responsive utility classes: $RESPONSIVE_COUNT"

echo ""
echo "🔍 Checking for arbitrary values..."
ARBITRARY_COUNT=$(grep -r "\[.*\]" "$SRC_PATH" --include="*.jsx" --include="*.tsx" --include="*.vue" --include="*.html" 2>/dev/null | grep -E "className=|class=" | wc -l || echo "0")
echo "  Arbitrary values used: $ARBITRARY_COUNT"

echo ""
echo "🔍 Checking container queries..."
CONTAINER_COUNT=$(grep -r "@container\|@\[" "$SRC_PATH" --include="*.jsx" --include="*.tsx" --include="*.vue" --include="*.html" 2>/dev/null | wc -l || echo "0")
echo "  Container query usage: $CONTAINER_COUNT"

echo ""
echo "🔍 Checking for utility-first patterns..."
if [ -f "tailwind.config.js" ] || [ -f "tailwind.config.ts" ]; then
    echo "  ✓ Tailwind config found"
else
    echo "  ⚠️  No tailwind.config found"
fi

echo ""
echo "📋 Best practices from Context7:"
echo "  ✓ Use responsive variants (sm:, md:, lg:) for mobile-first design"
echo "  ✓ Leverage container queries (@container) for component-based responsiveness"
echo "  ✓ Use arbitrary values sparingly [value] for one-off designs"
echo "  ✓ Configure purge/content in tailwind.config for production optimization"
echo "  ✓ Use @apply in components for repeated utility patterns"

echo ""
echo "✅ Tailwind optimization check complete"
