#!/bin/bash
# Azure DevOps Validation Script - Backward Compatible Wrapper
# Migrated to Node.js with backward compatibility for existing scripts
# Usage: ./validate.sh [--sprint=current] [--fix]

set -e

# Get the directory of this script to find the Node.js version
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
NODE_SCRIPT="${PROJECT_ROOT}/bin/node/azure-validate.js"

# Check if Node.js version exists
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

# Pass all arguments to the Node.js version
ARGS=()

# Process arguments
for arg in "$@"; do
    if [[ "$arg" == --sprint=* ]]; then
        SPRINT_VALUE="${arg#*=}"
        ARGS+=("--sprint" "$SPRINT_VALUE")
    elif [[ "$arg" == --fix ]] || [[ "$arg" == -f ]]; then
        ARGS+=("--fix")
    elif [[ "$arg" == --verbose ]] || [[ "$arg" == -v ]]; then
        ARGS+=("--verbose")
    elif [[ "$arg" == --silent ]] || [[ "$arg" == -s ]]; then
        ARGS+=("--silent")
    elif [[ "$arg" == --help ]] || [[ "$arg" == -h ]]; then
        ARGS+=("--help")
    fi
done

# Set project path to current working directory
ARGS+=("--path" "$(pwd)")

# Execute the Node.js version with converted arguments
exec node "$NODE_SCRIPT" "${ARGS[@]}"