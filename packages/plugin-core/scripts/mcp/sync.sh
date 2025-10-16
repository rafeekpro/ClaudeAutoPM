#!/bin/bash
# Sync MCP server configuration

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRAMEWORK_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

echo "🔄 Syncing MCP server configuration..."
node "$FRAMEWORK_ROOT/scripts/mcp-handler.js" sync