#!/bin/bash
# Azure DevOps Setup Script - Backward Compatible Wrapper
# Delegates to Node.js implementation while maintaining bash interface
# Usage: ./setup.sh

set -e

# Determine the directory containing this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR" && pwd)"

# Find the project root by looking for package.json or bin directory
while [ ! -f "$PROJECT_ROOT/package.json" ] && [ ! -d "$PROJECT_ROOT/bin" ] && [ "$PROJECT_ROOT" != "/" ]; do
    PROJECT_ROOT="$(dirname "$PROJECT_ROOT")"
done

# Determine Node.js script path
NODE_SCRIPT=""
if [ -f "$PROJECT_ROOT/bin/node/azure-setup.js" ]; then
    NODE_SCRIPT="$PROJECT_ROOT/bin/node/azure-setup.js"
elif [ -f "$(pwd)/bin/node/azure-setup.js" ]; then
    NODE_SCRIPT="$(pwd)/bin/node/azure-setup.js"
else
    # Try to find it relative to the autopm installation
    AUTOPM_ROOT="$(dirname "$(dirname "$(dirname "$SCRIPT_DIR")")")"
    if [ -f "$AUTOPM_ROOT/bin/node/azure-setup.js" ]; then
        NODE_SCRIPT="$AUTOPM_ROOT/bin/node/azure-setup.js"
    fi
fi

# Parse arguments for backward compatibility
VERBOSE=""
SILENT=""
NON_INTERACTIVE=""

for arg in "$@"; do
    case $arg in
        --verbose|-v)
            VERBOSE="--verbose"
            ;;
        --silent|-s)
            SILENT="--silent"
            ;;
        --non-interactive|-n)
            NON_INTERACTIVE="--non-interactive"
            ;;
    esac
done

# Check if Node.js implementation exists and is executable
if [ -n "$NODE_SCRIPT" ] && [ -f "$NODE_SCRIPT" ] && command -v node >/dev/null 2>&1; then
    # Use Node.js implementation
    exec node "$NODE_SCRIPT" --path "$(pwd)" $VERBOSE $SILENT $NON_INTERACTIVE
else
    # Fallback to simplified bash implementation
    echo "🔧 Azure DevOps Integration Setup (Bash Fallback)"
    echo "=================================================="
    echo ""
    echo "Note: Using bash fallback. Install Node.js for enhanced features."
    echo ""

    # Colors
    GREEN='\033[0;32m'
    YELLOW='\033[1;33m'
    RED='\033[0;31m'
    NC='\033[0m'

    # Check if .env exists
    if [ ! -f ".claude/.env" ]; then
        echo "Creating .env file..."
        mkdir -p .claude
        cp .claude/.env.example .claude/.env 2>/dev/null || touch .claude/.env
    fi

    # Basic credential collection for fallback
    echo "📋 Azure DevOps Configuration (Fallback Mode)"
    echo "---------------------------------------------"
    echo ""

    # Check existing values
    source .claude/.env 2>/dev/null || true

    if [ -z "$AZURE_DEVOPS_PAT" ] || [ -z "$AZURE_DEVOPS_ORG" ] || [ -z "$AZURE_DEVOPS_PROJECT" ]; then
        echo "Missing Azure DevOps credentials."
        echo "Please manually add the following to .claude/.env:"
        echo ""
        echo "AZURE_DEVOPS_PAT=your-personal-access-token"
        echo "AZURE_DEVOPS_ORG=your-organization-name"
        echo "AZURE_DEVOPS_PROJECT=your-project-name"
        echo ""
    else
        echo -e "${GREEN}✓${NC} Credentials already configured:"
        echo "  Organization: $AZURE_DEVOPS_ORG"
        echo "  Project: $AZURE_DEVOPS_PROJECT"
    fi

    # Create basic directory structure
    echo ""
    echo "📁 Creating Directory Structure"
    echo "-------------------------------"

    directories=(
        ".claude/azure/cache/features"
        ".claude/azure/cache/stories"
        ".claude/azure/cache/tasks"
        ".claude/azure/sync"
    )

    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            echo "  ✓ Created $dir"
        else
            echo "  • $dir exists"
        fi
    done

    # Create basic config file
    echo ""
    echo "⚙️ Creating Basic Configuration"
    echo "-------------------------------"

    mkdir -p .claude/azure

    cat > .claude/azure/config.yml << EOF
# Azure DevOps Configuration (Fallback)
# Generated: $(date)

azure_devops:
  organization: ${AZURE_DEVOPS_ORG:-"your-org"}
  project: ${AZURE_DEVOPS_PROJECT:-"your-project"}
  api_version: "7.0"

fallback_mode: true
EOF

    echo -e "${GREEN}✓${NC} Basic configuration created"

    # Make scripts executable
    echo ""
    echo "🔐 Setting Script Permissions"
    echo "-----------------------------"

    chmod +x .claude/scripts/azure/*.sh 2>/dev/null || true
    echo -e "${GREEN}✓${NC} Scripts are executable"

    # Summary
    echo ""
    echo "=================================="
    echo -e "${GREEN}✅ Basic Azure DevOps Setup Complete!${NC}"
    echo "=================================="
    echo ""
    echo "⚠️ Note: This is a basic fallback setup."
    echo "For full features, install Node.js and re-run setup."
    echo ""
    echo "📋 Quick Start Guide:"
    echo "--------------------"
    echo "1. Configure credentials in .claude/.env"
    echo "2. Install Node.js for enhanced features"
    echo "3. Re-run setup: ./setup.sh"
    echo ""
    echo "💡 Tip: Install Node.js for full Azure DevOps integration"
fi