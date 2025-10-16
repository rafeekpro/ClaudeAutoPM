#!/bin/bash
# Disable an MCP server in the current project

if [ -z "$1" ]; then
    echo "Usage: autopm mcp disable <server-name>"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

node "$FRAMEWORK_ROOT/scripts/mcp-handler.js" disable "$1"