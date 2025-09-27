#!/bin/bash
# Wrapper for setup-azure-aliases.sh - delegates to Node.js implementation

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NODE_SCRIPT="$SCRIPT_DIR/setup-azure-aliases.js"

if [ -f "$NODE_SCRIPT" ] && command -v node >/dev/null 2>&1; then
  exec node "$NODE_SCRIPT" "$@"
else
  echo "Error: Node.js implementation not found or Node.js not installed"
  exit 1
fi