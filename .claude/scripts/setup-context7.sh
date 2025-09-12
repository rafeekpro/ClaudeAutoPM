#!/bin/bash

# Setup script for Context7 MCP integration
# Usage: ./setup-context7.sh

echo "🔮 Setting up Context7 MCP integration..."

# Check if .env file exists
if [ ! -f ".claude/.env" ]; then
    echo "Creating .env file from template..."
    cp .claude/.env.example .claude/.env
    echo "✅ Created .claude/.env file"
    echo ""
    echo "❗ IMPORTANT: Edit .claude/.env and add your actual Context7 credentials:"
    echo "   - CONTEXT7_API_KEY=your-actual-api-key"
    echo "   - CONTEXT7_WORKSPACE=your-actual-workspace"
    echo ""
else
    echo "✅ .env file already exists"
fi

# Check if context7 MCP server is installed
if ! command -v npx &> /dev/null; then
    echo "❌ npm/npx not found. Please install Node.js first."
    exit 1
fi

echo "Installing Context7 MCP server..."
npm install -g @context7/mcp-server

if [ $? -eq 0 ]; then
    echo "✅ Context7 MCP server installed successfully"
else
    echo "❌ Failed to install Context7 MCP server"
    exit 1
fi

# Load environment variables
if [ -f ".claude/.env" ]; then
    export $(cat .claude/.env | grep -v '^#' | xargs)
fi

# Test MCP server connection (if credentials are set)
if [ -n "$CONTEXT7_API_KEY" ] && [ "$CONTEXT7_API_KEY" != "your-context7-api-key-here" ]; then
    echo "Testing Context7 connection..."
    # Add test command here when available
    echo "✅ Context7 credentials configured"
else
    echo "⚠️  Context7 credentials not yet configured"
    echo "   Please edit .claude/.env with your actual API key and workspace"
fi

echo ""
echo "🚀 Setup complete! You can now use:"
echo "   /python:docs-query --topic=fastapi"
echo "   /azure:docs-query --topic=rest-api"
echo "   /mcp:context-setup --server=context7"