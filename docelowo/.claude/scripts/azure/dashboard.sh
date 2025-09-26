#!/bin/bash
# Azure DevOps Dashboard Script - Backward Compatible Wrapper
# Delegates to Node.js implementation while maintaining bash interface
# Usage: ./dashboard.sh

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
if [ -f "$PROJECT_ROOT/bin/node/azure-dashboard.js" ]; then
    NODE_SCRIPT="$PROJECT_ROOT/bin/node/azure-dashboard.js"
elif [ -f "$(pwd)/bin/node/azure-dashboard.js" ]; then
    NODE_SCRIPT="$(pwd)/bin/node/azure-dashboard.js"
else
    # Try to find it relative to the autopm installation
    AUTOPM_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
    if [ -f "$AUTOPM_ROOT/bin/node/azure-dashboard.js" ]; then
        NODE_SCRIPT="$AUTOPM_ROOT/bin/node/azure-dashboard.js"
    fi
fi

# Parse arguments for backward compatibility
VERBOSE=""
SILENT=""

for arg in "$@"; do
    case $arg in
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
    exec node "$NODE_SCRIPT" --path "$(pwd)" $VERBOSE $SILENT
else
    # Fallback to bash implementation (simplified version)
    echo "📊 Azure DevOps Project Dashboard (Bash Fallback)"
    echo "=================================================="
    echo "Generated: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    echo "Note: Using bash fallback. Install Node.js for full dashboard features."
    echo ""

    # Load environment variables
    if [ -f ".claude/.env" ]; then
        export $(grep -v '^#' .claude/.env | xargs)
    fi

    # Check required variables for basic fallback
    if [ -z "$AZURE_DEVOPS_PAT" ] || [ -z "$AZURE_DEVOPS_ORG" ] || [ -z "$AZURE_DEVOPS_PROJECT" ]; then
        echo "❌ Error: Azure DevOps credentials not configured"
        echo "Please run: /azure:init"
        echo ""
        echo "🚀 Quick Actions"
        echo "----------------"
        echo "1. Daily standup      → /azure:standup"
        echo "2. Get next task      → /azure:next-task"
        echo "3. View active work   → /azure:active-work"
        echo "4. Check blockers     → /azure:blocked-items"
        echo "5. Sprint details     → /azure:sprint-status"
        echo "6. Search items       → /azure:search"
        echo ""
        echo "Dashboard refresh: ./dashboard.sh"
        echo "💡 Tip: Install Node.js for full Azure DevOps integration"
        exit 1
    fi

    # Simple status display for fallback
    echo "🏃 Sprint Information"
    echo "--------------------"
    echo "No active sprint (limited in fallback mode)"
    echo ""

    echo "📋 Work Items Overview"
    echo "---------------------"
    echo "Limited data available in fallback mode"
    echo ""

    echo "⚠️ Alerts"
    echo "---------"
    echo "✅ No alerts available in fallback mode"
    echo ""

    echo "✅ Recent Completions"
    echo "--------------------"
    echo "No recent activity data in fallback mode"
    echo ""

    echo "🚀 Quick Actions"
    echo "----------------"
    echo "1. Daily standup      → /azure:standup"
    echo "2. Get next task      → /azure:next-task"
    echo "3. View active work   → /azure:active-work"
    echo "4. Check blockers     → /azure:blocked-items"
    echo "5. Sprint details     → /azure:sprint-status"
    echo "6. Search items       → /azure:search"
    echo ""
    echo "Dashboard refresh: ./dashboard.sh"
    echo "💡 Tip: Install Node.js for full Azure DevOps integration"
fi