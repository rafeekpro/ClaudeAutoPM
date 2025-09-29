#!/bin/bash

# ClaudeAutoPM Update Script
# Updates existing installation to latest framework version

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration from environment variables
FORCE_UPDATE=${AUTOPM_FORCE:-0}
CREATE_BACKUP=${AUTOPM_BACKUP:-1}
PRESERVE_CONFIG=${AUTOPM_PRESERVE_CONFIG:-1}

# Paths
CLAUDE_DIR=".claude"
BACKUP_DIR=".claude-backup-$(date +%Y%m%d-%H%M%S)"
AUTOPM_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRAMEWORK_SOURCE="$AUTOPM_ROOT/autopm/.claude"

echo -e "${BLUE}🔄 ClaudeAutoPM Framework Update${NC}"
echo -e "${BLUE}=================================${NC}"

# Check if this is a ClaudeAutoPM project
if [ ! -d "$CLAUDE_DIR" ]; then
    echo -e "${RED}❌ Error: No .claude directory found${NC}"
    echo -e "${YELLOW}💡 This doesn't appear to be a ClaudeAutoPM project${NC}"
    echo -e "${YELLOW}   Run 'autopm install' to install the framework${NC}"
    exit 1
fi

# Check if config.json exists to verify it's our installation
if [ ! -f "$CLAUDE_DIR/config.json" ]; then
    echo -e "${RED}❌ Error: No config.json found in .claude directory${NC}"
    echo -e "${YELLOW}💡 This might not be a ClaudeAutoPM installation${NC}"
    if [ "$FORCE_UPDATE" = "0" ]; then
        echo -e "${YELLOW}   Use --force to proceed anyway${NC}"
        exit 1
    fi
fi

# Get current version if available
CURRENT_VERSION=""
if [ -f "$CLAUDE_DIR/config.json" ]; then
    CURRENT_VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$CLAUDE_DIR/config.json" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "unknown")
fi

# Get new version from package.json
NEW_VERSION=""
if [ -f "$AUTOPM_ROOT/package.json" ]; then
    NEW_VERSION=$(grep -o '"version"[[:space:]]*:[[:space:]]*"[^"]*"' "$AUTOPM_ROOT/package.json" | sed 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || echo "unknown")
fi

echo -e "${BLUE}📋 Update Information:${NC}"
echo -e "   Current version: ${CURRENT_VERSION:-unknown}"
echo -e "   New version: ${NEW_VERSION:-unknown}"
echo -e "   Project: $(pwd)"
echo ""

# Check if versions are the same
if [ "$CURRENT_VERSION" = "$NEW_VERSION" ] && [ "$FORCE_UPDATE" = "0" ]; then
    echo -e "${GREEN}✅ Already up to date (v$CURRENT_VERSION)${NC}"
    echo -e "${YELLOW}💡 Use --force to reinstall anyway${NC}"
    exit 0
fi

# Create backup if requested
if [ "$CREATE_BACKUP" = "1" ]; then
    echo -e "${YELLOW}📦 Creating backup...${NC}"
    if cp -r "$CLAUDE_DIR" "$BACKUP_DIR"; then
        echo -e "${GREEN}✅ Backup created: $BACKUP_DIR${NC}"
    else
        echo -e "${RED}❌ Failed to create backup${NC}"
        exit 1
    fi
fi

# Preserve important files
PRESERVED_FILES=()
if [ "$PRESERVE_CONFIG" = "1" ]; then
    echo -e "${YELLOW}💾 Preserving configuration files...${NC}"

    # List of files to preserve
    FILES_TO_PRESERVE=(
        "config.json"
        "settings.local.json"
        "teams.json"
        ".env.local"
    )

    # Create temp directory for preserved files
    TEMP_PRESERVE_DIR=$(mktemp -d)

    for file in "${FILES_TO_PRESERVE[@]}"; do
        if [ -f "$CLAUDE_DIR/$file" ]; then
            cp "$CLAUDE_DIR/$file" "$TEMP_PRESERVE_DIR/"
            PRESERVED_FILES+=("$file")
            echo -e "   📄 Preserved: $file"
        fi
    done
fi

# Preserve epics and PRDs directories
echo -e "${YELLOW}📁 Preserving project data...${NC}"
PROJECT_DIRS=(
    "epics"
    "prds"
)

TEMP_PROJECT_DIR=$(mktemp -d)
for dir in "${PROJECT_DIRS[@]}"; do
    if [ -d "$CLAUDE_DIR/$dir" ]; then
        cp -r "$CLAUDE_DIR/$dir" "$TEMP_PROJECT_DIR/"
        echo -e "   📂 Preserved: $dir/"
    fi
done

# Remove old framework files (but preserve data)
echo -e "${YELLOW}🗑️  Removing old framework files...${NC}"

# List of framework directories to update
FRAMEWORK_DIRS=(
    "agents"
    "commands"
    "rules"
    "scripts"
    "checklists"
    "hooks"
    "lib"
    "mcp"
    "providers"
    "strategies"
    "templates"
)

for dir in "${FRAMEWORK_DIRS[@]}"; do
    if [ -d "$CLAUDE_DIR/$dir" ]; then
        rm -rf "$CLAUDE_DIR/$dir"
        echo -e "   🗑️  Removed: $dir/"
    fi
done

# Remove framework files from root
FRAMEWORK_FILES=(
    "base.md"
    "mcp-servers.json"
)

for file in "${FRAMEWORK_FILES[@]}"; do
    if [ -f "$CLAUDE_DIR/$file" ]; then
        rm -f "$CLAUDE_DIR/$file"
        echo -e "   🗑️  Removed: $file"
    fi
done

# Copy new framework files
echo -e "${YELLOW}📥 Installing new framework files...${NC}"

if [ ! -d "$FRAMEWORK_SOURCE" ]; then
    echo -e "${RED}❌ Error: Framework source not found at $FRAMEWORK_SOURCE${NC}"
    exit 1
fi

# Copy framework directories
for dir in "${FRAMEWORK_DIRS[@]}"; do
    if [ -d "$FRAMEWORK_SOURCE/$dir" ]; then
        cp -r "$FRAMEWORK_SOURCE/$dir" "$CLAUDE_DIR/"
        echo -e "   ✅ Installed: $dir/"
    fi
done

# Copy framework files
for file in "${FRAMEWORK_FILES[@]}"; do
    if [ -f "$FRAMEWORK_SOURCE/$file" ]; then
        cp "$FRAMEWORK_SOURCE/$file" "$CLAUDE_DIR/"
        echo -e "   ✅ Installed: $file"
    fi
done

# Update config.json with new version and timestamp
if [ -f "$TEMP_PRESERVE_DIR/config.json" ]; then
    # Update the preserved config with new version
    sed -i.bak "s/\"version\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"version\": \"$NEW_VERSION\"/" "$TEMP_PRESERVE_DIR/config.json" 2>/dev/null || true
    sed -i.bak "s/\"updated\"[[:space:]]*:[[:space:]]*\"[^\"]*\"/\"updated\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\"/" "$TEMP_PRESERVE_DIR/config.json" 2>/dev/null || true
    rm -f "$TEMP_PRESERVE_DIR/config.json.bak" 2>/dev/null || true
else
    # Create new config if none exists
    cat > "$TEMP_PRESERVE_DIR/config.json" << EOF
{
  "version": "$NEW_VERSION",
  "updated": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "provider": "github"
}
EOF
fi

# Restore preserved files
if [ "$PRESERVE_CONFIG" = "1" ] && [ ${#PRESERVED_FILES[@]} -gt 0 ]; then
    echo -e "${YELLOW}♻️  Restoring preserved files...${NC}"
    for file in "${PRESERVED_FILES[@]}"; do
        if [ -f "$TEMP_PRESERVE_DIR/$file" ]; then
            cp "$TEMP_PRESERVE_DIR/$file" "$CLAUDE_DIR/"
            echo -e "   ♻️  Restored: $file"
        fi
    done
fi

# Restore project directories
echo -e "${YELLOW}♻️  Restoring project data...${NC}"
for dir in "${PROJECT_DIRS[@]}"; do
    if [ -d "$TEMP_PROJECT_DIR/$dir" ]; then
        cp -r "$TEMP_PROJECT_DIR/$dir" "$CLAUDE_DIR/"
        echo -e "   ♻️  Restored: $dir/"
    fi
done

# Clean up temp directories
rm -rf "$TEMP_PRESERVE_DIR" "$TEMP_PROJECT_DIR" 2>/dev/null || true

# Update scripts permissions
if [ -d "$CLAUDE_DIR/scripts" ]; then
    echo -e "${YELLOW}🔧 Setting script permissions...${NC}"
    find "$CLAUDE_DIR/scripts" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true
    find "$CLAUDE_DIR/hooks" -name "*.sh" -exec chmod +x {} \; 2>/dev/null || true
fi

# Success message
echo ""
echo -e "${GREEN}✅ Update completed successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Summary:${NC}"
echo -e "   Updated from: ${CURRENT_VERSION:-unknown} → $NEW_VERSION"
echo -e "   Backup: ${CREATE_BACKUP:+$BACKUP_DIR}"
echo -e "   Preserved: ${#PRESERVED_FILES[@]} config files, ${#PROJECT_DIRS[@]} project directories"
echo ""

# Show what's new (if we can detect major changes)
if [ "$CURRENT_VERSION" != "$NEW_VERSION" ]; then
    echo -e "${BLUE}🆕 What's New in v$NEW_VERSION:${NC}"
    echo -e "   • Enhanced epic-decompose for multi-epic support"
    echo -e "   • Improved epic-sync with multi-epic workflows"
    echo -e "   • Updated release automation"
    echo -e "   • Better documentation and examples"
    echo ""
fi

echo -e "${BLUE}🚀 Next Steps:${NC}"
echo -e "   • Verify configuration: autopm config show"
echo -e "   • Test PM commands: /pm:validate"
echo -e "   • Check documentation: autopm --help"
echo ""

if [ "$CREATE_BACKUP" = "1" ]; then
    echo -e "${YELLOW}💡 Backup Note:${NC}"
    echo -e "   Your backup is saved at: $BACKUP_DIR"
    echo -e "   Remove it when you're satisfied with the update"
    echo ""
fi