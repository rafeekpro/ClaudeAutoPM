#!/bin/bash

# Unified Context7 Enforcement Hook
# Triggered by Claude Code on tool-use events
# Shows Context7 queries that MUST be performed before command/agent execution

set -e

# Get the user's prompt/command
PROMPT="${PROMPT:-$1}"

# Check if this is a command invocation (starts with /)
if [[ "$PROMPT" =~ ^/([a-z-]+):([a-z-]+) ]]; then
    CATEGORY="${BASH_REMATCH[1]}"
    COMMAND="${BASH_REMATCH[2]}"

    echo ""
    echo "🔒 Context7 Enforcement: Command Detected"
    echo "   Command: /$CATEGORY:$COMMAND"
    echo ""

    # Run the command hook
    node .claude/hooks/pre-command-context7.js "$PROMPT"

elif [[ "$PROMPT" =~ ^@([a-z-]+) ]]; then
    AGENT="${BASH_REMATCH[1]}"

    echo ""
    echo "🔒 Context7 Enforcement: Agent Detected"
    echo "   Agent: @$AGENT"
    echo ""

    # Run the agent hook
    node .claude/hooks/pre-agent-context7.js "$PROMPT"
fi

# Always allow execution to continue
exit 0
