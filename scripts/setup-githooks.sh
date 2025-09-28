#!/bin/bash

# Setup Git hooks for ClaudeAutoPM
# This script configures Git to use the custom hooks in .githooks directory

echo ""
echo "🔧 ClaudeAutoPM Git Hooks Setup"
echo "================================"
echo ""

# Check if we're in a Git repository
if [ ! -d ".git" ]; then
  echo "❌ Error: Not in a Git repository root directory."
  echo "   Please run this script from the root of your Git project."
  exit 1
fi

# Check if .githooks directory exists
if [ ! -d ".githooks" ]; then
  echo "❌ Error: .githooks directory not found."
  echo "   Please ensure the .githooks directory exists with hook scripts."
  exit 1
fi

# Configure Git to use .githooks directory
echo "📝 Configuring Git to use the '.githooks' directory..."
git config core.hooksPath .githooks

if [ $? -eq 0 ]; then
  echo "✅ Git hooks path configured successfully!"
  echo ""
  echo "🎯 Active hooks:"

  # List available hooks
  hook_found=false
  for hook in .githooks/*; do
    # Check if pattern expansion actually matches files
    if [ -f "$hook" ] && [ -x "$hook" ]; then
      hook_name=$(basename "$hook")
      echo "   - $hook_name"
      hook_found=true
    fi
  done

  if [ "$hook_found" = false ]; then
    echo "   (No executable hooks found in .githooks directory)"
  fi

  echo ""
  echo "📌 Auto-switching feature enabled!"
  echo "   Branch naming convention for automatic team switching:"
  echo "   - feature/<team>/<description>  (e.g., feature/devops/add-ci)"
  echo "   - fix/<team>/<description>       (e.g., fix/frontend/button-style)"
  echo "   - feat/<team>/<description>      (e.g., feat/backend/api-endpoint)"
  echo ""
  echo "   Supported teams: base, devops, frontend, python_backend, fullstack"
  echo ""
  echo "🚀 Git will now use the hooks in the '.githooks' directory."
  echo "   The post-checkout hook will automatically switch agent teams based on branch names."
else
  echo "❌ Error: Failed to configure Git hooks path."
  echo "   Please check your Git configuration and try again."
  exit 1
fi

# Verify configuration
configured_path=$(git config --get core.hooksPath)
if [ "$configured_path" = ".githooks" ]; then
  echo ""
  echo "✔️  Verification: Git hooks path is correctly set to: $configured_path"
else
  echo ""
  echo "⚠️  Warning: Git hooks path verification failed."
  echo "   Expected: .githooks"
  echo "   Got: $configured_path"
fi

echo ""