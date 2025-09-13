#!/bin/bash

# Hook enforcing agent usage instead of direct operations
# Usage: set as tool-use-hook in Claude Code configuration

TOOL_NAME="$1"
TOOL_PARAMS="$2"

# Function to display blocking message
block_with_message() {
    echo "❌ BLOCKED: $1"
    echo "✅ INSTEAD: Use the $2 agent via Task tool"
    echo ""
    echo "Example:"
    echo "  Task: $3"
    exit 1
}

# Check Bash usage for operations that should use agents
if [[ "$TOOL_NAME" == "Bash" ]]; then
    
    # Block direct grep/find - should use code-analyzer
    if echo "$TOOL_PARAMS" | grep -qE "(grep|rg|find|ag)\s+.*\.(py|js|ts|jsx|tsx)"; then
        block_with_message \
            "Direct code search detected" \
            "code-analyzer" \
            "Search for [pattern] in codebase"
    fi
    
    # Block direct test execution - should use test-runner
    if echo "$TOOL_PARAMS" | grep -qE "(pytest|npm test|yarn test|jest|vitest)"; then
        block_with_message \
            "Direct test execution detected" \
            "test-runner" \
            "Run and analyze test results"
    fi
    
    # Block direct log reading - should use file-analyzer
    if echo "$TOOL_PARAMS" | grep -qE "(cat|head|tail|less).*\.(log|txt|out)"; then
        block_with_message \
            "Direct log reading detected" \
            "file-analyzer" \
            "Analyze and summarize [log file]"
    fi
fi

# Check Read usage for large files
if [[ "$TOOL_NAME" == "Read" ]]; then
    FILE_PATH=$(echo "$TOOL_PARAMS" | jq -r '.file_path' 2>/dev/null)
    
    # If file is larger than 1000 lines, enforce file-analyzer
    if [[ -f "$FILE_PATH" ]]; then
        LINE_COUNT=$(wc -l < "$FILE_PATH")
        if [[ $LINE_COUNT -gt 1000 ]]; then
            block_with_message \
                "Reading large file directly (${LINE_COUNT} lines)" \
                "file-analyzer" \
                "Summarize contents of ${FILE_PATH}"
        fi
    fi
fi

# Check Grep usage for complex searches
if [[ "$TOOL_NAME" == "Grep" ]]; then
    PATTERN=$(echo "$TOOL_PARAMS" | jq -r '.pattern' 2>/dev/null)
    
    # If pattern is complex or searches many files, use code-analyzer
    if echo "$PATTERN" | grep -qE "(\.\*|\+|\{|\[)"; then
        echo "⚠️  SUGGESTION: For complex searches, consider using code-analyzer agent"
        echo "   It provides better context and analysis of results"
        # Don't block, just suggest
    fi
fi

# Allowed - pass through
exit 0