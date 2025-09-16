#!/bin/bash

# Safe Commit Script - Bridge to Node.js implementation
# This script now delegates to the Node.js version for better cross-platform support

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Execute the Node.js version
exec node "$SCRIPT_DIR/safe-commit.js" "$@"