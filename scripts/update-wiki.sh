#!/bin/bash

# Update GitHub Wiki with local documentation
# Usage: ./scripts/update-wiki.sh

set -e

WIKI_REPO="https://github.com/rafeekpro/ClaudeAutoPM.wiki.git"
WIKI_DIR="/tmp/ClaudeAutoPM-wiki"
DOCS_DIR="docs/wiki"

echo "📚 Updating ClaudeAutoPM Wiki..."

# Clone or update wiki repository
if [ -d "$WIKI_DIR" ]; then
    echo "Updating existing wiki clone..."
    cd "$WIKI_DIR"
    git pull origin master
else
    echo "Cloning wiki repository..."
    git clone "$WIKI_REPO" "$WIKI_DIR"
    cd "$WIKI_DIR"
fi

# Copy documentation files
echo "Copying documentation files..."
cp "$OLDPWD/$DOCS_DIR"/*.md . 2>/dev/null || true

# Check for changes
if git status --porcelain | grep -q .; then
    echo "📝 Changes detected, updating wiki..."

    # Configure git if needed
    git config user.email "autopm@example.com" 2>/dev/null || true
    git config user.name "ClaudeAutoPM Bot" 2>/dev/null || true

    # Commit and push
    git add -A
    git commit -m "Update wiki documentation - $(date '+%Y-%m-%d %H:%M')"
    git push origin master

    echo "✅ Wiki updated successfully!"
else
    echo "ℹ️ No changes to update"
fi

cd "$OLDPWD"
echo "🎉 Wiki update complete!"
echo ""
echo "View the wiki at: https://github.com/rafeekpro/ClaudeAutoPM/wiki"
echo "Configuration Templates page: https://github.com/rafeekpro/ClaudeAutoPM/wiki/Configuration-Templates"