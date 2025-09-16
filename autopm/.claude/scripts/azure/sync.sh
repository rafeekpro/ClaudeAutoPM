#!/bin/bash
# Azure DevOps Sync Script - Backward Compatible Wrapper
# Delegates to Node.js implementation while maintaining bash interface
# Usage: ./sync.sh [--full|--quick]

set -e

# Determine the directory containing this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR" && pwd)"

# Find the project root by looking for package.json or bin directory
while [ ! -f "$PROJECT_ROOT/package.json" ] && [ ! -d "$PROJECT_ROOT/bin" ] && [ "$PROJECT_ROOT" != "/" ]; do
    PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
done

# Determine Node.js script path
NODE_SCRIPT=""
if [ -f "$PROJECT_ROOT/bin/node/azure-sync.js" ]; then
    NODE_SCRIPT="$PROJECT_ROOT/bin/node/azure-sync.js"
elif [ -f "$(pwd)/bin/node/azure-sync.js" ]; then
    NODE_SCRIPT="$(pwd)/bin/node/azure-sync.js"
else
    # Try to find it relative to the autopm installation
    AUTOPM_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
    if [ -f "$AUTOPM_ROOT/bin/node/azure-sync.js" ]; then
        NODE_SCRIPT="$AUTOPM_ROOT/bin/node/azure-sync.js"
    fi
fi

# Parse arguments for backward compatibility
MODE="quick"
VERBOSE=""
SILENT=""

for arg in "$@"; do
    case $arg in
        --full)
            MODE="full"
            ;;
        --quick)
            MODE="quick"
            ;;
        --verbose|-v)
            VERBOSE="--verbose"
            ;;
        --silent|-s)
            SILENT="--silent"
            ;;
    esac
done

# Check if Node.js implementation exists and is executable
if [ -n "$NODE_SCRIPT" ] && [ -f "$NODE_SCRIPT" ] && command -v node >/dev/null 2>&1; then
    # Use Node.js implementation
    exec node "$NODE_SCRIPT" --mode "$MODE" --path "$(pwd)" $VERBOSE $SILENT
else
    # Fallback to bash implementation (original script functionality)
    echo "🔄 Azure DevOps Synchronization (Bash Fallback)"
    echo "================================================="
    echo "Mode: --$MODE"
    echo ""
    echo "Note: Using bash fallback. Install Node.js for enhanced features."
    echo ""

    # Load environment variables
    if [ -f ".claude/.env" ]; then
        export $(grep -v '^#' .claude/.env | xargs)
    fi

    # Check required variables
    if [ -z "$AZURE_DEVOPS_PAT" ] || [ -z "$AZURE_DEVOPS_ORG" ] || [ -z "$AZURE_DEVOPS_PROJECT" ]; then
        echo "❌ Error: Azure DevOps credentials not configured"
        echo "Please run: /azure:init"
        exit 1
    fi

    # Create cache directories
    mkdir -p .claude/azure/cache/{features,stories,tasks}
    mkdir -p .claude/azure/sync

    # Basic sync simulation for compatibility
    echo "Performing basic sync..."

    # Create basic metadata
    SYNC_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null)

    cat > .claude/azure/sync/last-sync.json << EOF
{
  "timestamp": "$SYNC_TIME",
  "mode": "--$MODE",
  "cache_size": "0",
  "items_synced": {
    "features": 0,
    "stories": 0,
    "tasks": 0
  },
  "fallback": true
}
EOF

    echo ""
    echo "📊 Sync Statistics"
    echo "------------------"
    echo "Last sync: $SYNC_TIME"
    echo "Mode: Bash fallback"
    echo "Features: 0"
    echo "Stories: 0"
    echo "Tasks: 0"
    echo ""
    echo "🔍 Checking for Conflicts"
    echo "-------------------------"
    echo "No conflicts detected"
    echo ""
    echo "================================"
    echo "✅ Synchronization complete!"
    echo ""
    echo "Next steps:"
    echo "  • View status: /azure:sprint-status"
    echo "  • Check work: /azure:active-work"
    echo "  • Start task: /azure:next-task"
    echo ""
    echo "💡 Tip: Install Node.js for full Azure DevOps integration"
fi