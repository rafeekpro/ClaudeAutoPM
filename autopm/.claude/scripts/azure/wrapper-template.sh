#!/bin/bash

# Azure Script - Wrapper for Node.js implementation
# This wrapper maintains backward compatibility while delegating to the Node.js version

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "$0" .sh)"

# Check if Node.js is available and the .js file exists
if command -v node >/dev/null 2>&1 && [ -f "$SCRIPT_DIR/$SCRIPT_NAME.js" ]; then
  # Use the Node.js implementation
  node "$SCRIPT_DIR/$SCRIPT_NAME.js" "$@"
  exit $?
else
  # Fallback message
  echo "⚠️ Node.js not found or $SCRIPT_NAME.js missing"
  echo "Please ensure Node.js is installed and all files are present"
  exit 1
fi