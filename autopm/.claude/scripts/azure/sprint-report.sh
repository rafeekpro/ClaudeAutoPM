#!/bin/bash
# Azure DevOps Sprint Report Generator (Backward Compatible Wrapper)
# Usage: ./sprint-report.sh [sprint-name] [options]
#
# This script now delegates to the Node.js implementation for better performance
# and maintainability while preserving the original interface.

set -e

# Detect script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# Check if Node.js implementation exists
NODE_SCRIPT="$PROJECT_ROOT/bin/node/azure-sprint-report.js"

if [ ! -f "$NODE_SCRIPT" ]; then
    echo "Error: Node.js version not found at $NODE_SCRIPT"
    echo "Please ensure the migration is complete."
    exit 1
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed or not in PATH"
    echo "Please install Node.js to use the migrated Azure DevOps scripts"
    exit 1
fi

# Handle legacy first argument as sprint name
ARGS=()
if [ $# -gt 0 ] && [[ "$1" != --* ]]; then
    # First argument is not a flag, treat it as sprint name
    ARGS+=("--sprint" "$1")
    shift
fi

# Pass remaining arguments
ARGS+=("$@")

# Execute the Node.js version with converted arguments
exec node "$NODE_SCRIPT" "${ARGS[@]}"