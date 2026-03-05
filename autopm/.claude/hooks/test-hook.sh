#!/bin/bash

# Hook test - call simulation
echo "Testing hook with different scenarios:"
echo "======================================"

# Test 1: Direct grep (should show reminder)
echo -e "\n1. Testing: Bash 'grep -r TODO *.py'"
node ./.claude/hooks/pre-action-agent-reminder.js "grep -r TODO *.py" || echo "   Result: Blocked"

# Test 2: Task tool (should pass)
echo -e "\n2. Testing: Task tool usage"
node ./.claude/hooks/pre-action-agent-reminder.js "use task tool" && echo "   Result: Allowed"

# Test 3: Direct tests (should show reminder)
echo -e "\n3. Testing: Bash 'pytest tests/'"
node ./.claude/hooks/pre-action-agent-reminder.js "pytest tests/" || echo "   Result: Blocked"

# Test 4: Normal bash command (should pass)
echo -e "\n4. Testing: Bash 'ls -la'"
node ./.claude/hooks/pre-action-agent-reminder.js "ls -la" && echo "   Result: Allowed"
