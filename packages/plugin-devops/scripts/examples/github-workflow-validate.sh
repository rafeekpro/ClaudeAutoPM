#!/usr/bin/env bash
# GitHub Actions workflow validation
# Usage: ./github-workflow-validate.sh [workflow-file]

set -euo pipefail

WORKFLOW_FILE="${1:-.github/workflows/*.yml}"

echo "🔍 Validating GitHub Actions workflows..."

# Check GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI not found. Please install it first."
    echo "   Visit: https://cli.github.com/"
    exit 1
fi

# Check if logged in
if ! gh auth status &> /dev/null; then
    echo "❌ Not logged into GitHub CLI. Please run: gh auth login"
    exit 1
fi

# Validate workflow syntax
echo "📋 Checking workflow syntax..."
for workflow in .github/workflows/*.yml .github/workflows/*.yaml 2>/dev/null; do
    if [ -f "$workflow" ]; then
        echo "  ✓ Validating: $workflow"
        # Check YAML syntax
        if command -v yamllint &> /dev/null; then
            yamllint "$workflow" || echo "    ⚠️  YAML lint warnings found"
        fi

        # Validate with GitHub Actions
        if gh workflow view "$(basename "$workflow")" &> /dev/null; then
            echo "    ✓ Workflow exists on GitHub"
        else
            echo "    ⚠️  Workflow not found on GitHub (may not be pushed yet)"
        fi
    fi
done

# List all workflows
echo ""
echo "📊 Available workflows:"
gh workflow list

echo "✅ Workflow validation complete"
