#!/bin/bash
# Azure DevOps Feature Show Script - Backward Compatible Wrapper
# Migrated to Node.js with backward compatibility for existing scripts
# Usage: ./feature-show.sh <feature-id>

set -e

# Get the directory of this script to find the Node.js version
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../../../.." && pwd)"
NODE_SCRIPT="${PROJECT_ROOT}/bin/node/azure-feature-show.js"

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

# Pass the feature ID and all other arguments to the Node.js version
exec node "$NODE_SCRIPT" "$@"