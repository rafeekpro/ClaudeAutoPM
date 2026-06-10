#!/bin/bash

# ClaudeAutoPM Feature Toggle Script - Bridge to Node.js
# This script now delegates to the Node.js version for better cross-platform support
# Original bash implementation backed up to toggle-features.sh.backup

set -e  # Exit on error

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is required but not installed."
    echo "Please install Node.js first: https://nodejs.org/"
    exit 1
fi

# Check if the Node.js version exists
NODE_SCRIPT="$SCRIPT_DIR/toggle-features.js"
if [ ! -f "$NODE_SCRIPT" ]; then
    echo "Error: Node.js implementation not found at $NODE_SCRIPT"
    echo "Falling back to original bash implementation..."

    # Try to use the backup if available
    if [ -f "$SCRIPT_DIR/toggle-features.sh.backup" ]; then
        exec bash "$SCRIPT_DIR/toggle-features.sh.backup" "$@"
    else
        echo "Error: No backup implementation found"
        exit 1
    fi
fi

# Execute the Node.js version with all arguments
exec node "$NODE_SCRIPT" "$@"