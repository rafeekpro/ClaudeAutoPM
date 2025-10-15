#!/bin/bash
# Publish all ClaudeAutoPM plugins to npm
# Usage: ./scripts/publish-plugins.sh [--dry-run]

set -e  # Exit on error

DRY_RUN=false
if [ "$1" = "--dry-run" ]; then
  DRY_RUN=true
  echo "🧪 DRY RUN MODE - No actual publishing"
  echo ""
fi

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check npm login
echo -e "${BLUE}📋 Pre-flight Checks${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -n "Checking npm authentication... "
if ! npm whoami &>/dev/null; then
  echo -e "${RED}✗ Not logged in${NC}"
  echo ""
  echo "Please run: npm login"
  exit 1
fi
echo -e "${GREEN}✓ Logged in as $(npm whoami)${NC}"

# Check if we're in the right directory
if [ ! -d "packages" ]; then
  echo -e "${RED}✗ packages/ directory not found${NC}"
  echo "Please run this script from the AUTOPM root directory"
  exit 1
fi

# Count plugins
PLUGIN_COUNT=$(find packages -name "plugin-*" -type d | wc -l | tr -d ' ')
echo -e "Found ${GREEN}$PLUGIN_COUNT${NC} plugins to publish"
echo ""

# List plugins
echo -e "${BLUE}📦 Plugins to Publish${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for plugin_dir in packages/plugin-*; do
  plugin_name=$(basename "$plugin_dir")
  package_name=$(grep '"name"' "$plugin_dir/package.json" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
  version=$(grep '"version"' "$plugin_dir/package.json" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
  agent_count=$(find "$plugin_dir/agents" -name "*.md" -not -name "README.md" | wc -l | tr -d ' ')

  echo "  • $package_name@$version ($agent_count agents)"
done
echo ""

# Confirm before proceeding
if [ "$DRY_RUN" = false ]; then
  echo -e "${YELLOW}⚠️  This will publish $PLUGIN_COUNT packages to npm${NC}"
  read -p "Continue? (yes/no) " -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy](es)?$ ]]; then
    echo "Cancelled."
    exit 0
  fi
fi

# Publish each plugin
echo -e "${BLUE}🚀 Publishing Plugins${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

SUCCESS_COUNT=0
FAIL_COUNT=0
FAILED_PLUGINS=()

for plugin_dir in packages/plugin-*; do
  plugin_name=$(basename "$plugin_dir")
  package_name=$(grep '"name"' "$plugin_dir/package.json" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
  version=$(grep '"version"' "$plugin_dir/package.json" | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')

  echo -e "${BLUE}Publishing:${NC} $package_name@$version"

  # Change to plugin directory
  cd "$plugin_dir"

  # Publish
  if [ "$DRY_RUN" = true ]; then
    # Dry run
    if npm publish --dry-run --access public > /tmp/npm-publish.log 2>&1; then
      echo -e "  ${GREEN}✓ Dry run successful${NC}"
      ((SUCCESS_COUNT++))
    else
      echo -e "  ${RED}✗ Dry run failed${NC}"
      cat /tmp/npm-publish.log
      ((FAIL_COUNT++))
      FAILED_PLUGINS+=("$package_name")
    fi
  else
    # Actual publish
    if npm publish --access public 2>&1 | tee /tmp/npm-publish.log; then
      echo -e "  ${GREEN}✓ Published successfully${NC}"
      ((SUCCESS_COUNT++))

      # Verify
      sleep 2
      if npm view "$package_name@$version" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓ Verified on npm registry${NC}"
      else
        echo -e "  ${YELLOW}⚠ Published but not yet visible on registry (may take a moment)${NC}"
      fi
    else
      echo -e "  ${RED}✗ Publish failed${NC}"
      cat /tmp/npm-publish.log
      ((FAIL_COUNT++))
      FAILED_PLUGINS+=("$package_name")
    fi
  fi

  echo ""

  # Return to root
  cd - > /dev/null
done

# Summary
echo ""
echo -e "${BLUE}📊 Summary${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "Total plugins:    $PLUGIN_COUNT"
echo -e "${GREEN}Successful:       $SUCCESS_COUNT${NC}"

if [ $FAIL_COUNT -gt 0 ]; then
  echo -e "${RED}Failed:           $FAIL_COUNT${NC}"
  echo ""
  echo -e "${RED}Failed plugins:${NC}"
  for failed in "${FAILED_PLUGINS[@]}"; do
    echo "  • $failed"
  done
  echo ""
  exit 1
else
  echo -e "${RED}Failed:           0${NC}"
  echo ""

  if [ "$DRY_RUN" = false ]; then
    echo -e "${GREEN}🎉 All plugins published successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Verify on npm: https://www.npmjs.com/org/claudeautopm"
    echo "  2. Test installation: npm install -g @claudeautopm/plugin-cloud"
    echo "  3. Update CHANGELOG.md"
    echo "  4. Tag release: git tag v2.8.1 && git push origin v2.8.1"
  else
    echo -e "${GREEN}🎉 All dry runs successful!${NC}"
    echo ""
    echo "Ready to publish for real:"
    echo "  ./scripts/publish-plugins.sh"
  fi
fi
