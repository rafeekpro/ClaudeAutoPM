#!/bin/bash
# Add a new MCP server interactively

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

node "$FRAMEWORK_ROOT/scripts/mcp-handler.js" add