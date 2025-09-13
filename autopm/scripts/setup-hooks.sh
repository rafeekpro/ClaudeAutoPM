#!/bin/bash

# Setup script for git hooks

echo "🔧 Setting up git hooks for code protection..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Configure git to use our hooks directory
git config core.hooksPath .githooks

if [ $? -eq 0 ]; then
    echo "✅ Git hooks configured successfully!"
    echo ""
    echo "📋 Active hooks:"
    echo "  • pre-commit: Validates code integrity before commits"
    echo ""
    echo "To disable temporarily:"
    echo "  git commit --no-verify"
    echo ""
    echo "To disable permanently:"
    echo "  git config --unset core.hooksPath"
else
    echo "❌ Failed to configure git hooks"
    exit 1
fi