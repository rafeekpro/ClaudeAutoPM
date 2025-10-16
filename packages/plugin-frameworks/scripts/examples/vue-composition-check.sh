#!/usr/bin/env bash
# Vue Composition API usage checker
# Usage: ./vue-composition-check.sh [component-path]

set -euo pipefail

COMPONENT_PATH="${1:-.}"

echo "🎭 Checking Vue Composition API patterns..."

# Check for Composition API usage
echo ""
echo "🔍 Checking <script setup> usage..."
SETUP_COUNT=$(grep -r "<script setup>" "$COMPONENT_PATH" --include="*.vue" 2>/dev/null | wc -l || echo "0")
echo "  Components using <script setup>: $SETUP_COUNT"

echo ""
echo "🔍 Checking ref/reactive usage..."
REF_COUNT=$(grep -r "ref(\|reactive(" "$COMPONENT_PATH" --include="*.vue" 2>/dev/null | wc -l || echo "0")
echo "  Reactive state declarations: $REF_COUNT"

echo ""
echo "🔍 Checking computed properties..."
COMPUTED_COUNT=$(grep -r "computed(" "$COMPONENT_PATH" --include="*.vue" 2>/dev/null | wc -l || echo "0")
echo "  Computed properties: $COMPUTED_COUNT"

echo ""
echo "🔍 Checking lifecycle hooks..."
LIFECYCLE_COUNT=$(grep -r "onMounted\|onBeforeMount\|onUnmounted" "$COMPONENT_PATH" --include="*.vue" 2>/dev/null | wc -l || echo "0")
echo "  Lifecycle hooks: $LIFECYCLE_COUNT"

echo ""
echo "📋 Best practices from Context7:"
echo "  ✓ Prefer <script setup> for cleaner syntax"
echo "  ✓ Use ref() for primitives, reactive() for objects"
echo "  ✓ Leverage computed() for derived state"
echo "  ✓ Use defineProps() and defineEmits() for component API"
echo "  ✓ Apply composition functions for reusable logic"

echo ""
echo "✅ Vue Composition API check complete"
