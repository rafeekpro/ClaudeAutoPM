#!/bin/bash

# STRICT MODE: Blokuje WSZYSTKIE bezpośrednie operacje oprócz Task tool

TOOL_NAME="$1"

# Lista dozwolonych narzędzi gdy nie używamy agentów
ALLOWED_TOOLS="Task|TodoWrite|ExitPlanMode|WebFetch|WebSearch"

# Jeśli narzędzie nie jest na liście dozwolonych
if ! echo "$TOOL_NAME" | grep -qE "^($ALLOWED_TOOLS)$"; then
    
    # Mapowanie narzędzi na agenty
    case "$TOOL_NAME" in
        "Bash")
            echo "❌ BLOCKED: Direct bash execution"
            echo "✅ USE: Appropriate agent based on task:"
            echo "   - python-backend-engineer for Python development"
            echo "   - test-runner for running tests"
            echo "   - bash-scripting-expert for shell scripts"
            exit 1
            ;;
        "Read"|"Glob"|"Grep")
            echo "❌ BLOCKED: Direct file operations"
            echo "✅ USE: code-analyzer or file-analyzer agent"
            exit 1
            ;;
        "Edit"|"Write"|"MultiEdit")
            echo "❌ BLOCKED: Direct file editing"
            echo "✅ USE: Appropriate development agent:"
            echo "   - python-backend-engineer for .py files"
            echo "   - react-frontend-engineer for .jsx/.tsx files"
            echo "   - nodejs-backend-engineer for Node.js"
            exit 1
            ;;
    esac
fi

exit 0