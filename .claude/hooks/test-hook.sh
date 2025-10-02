#!/bin/bash

# Hook test - call simulation
echo "Testing hook with different scenarios:"
echo "======================================"

# Test 1: Direct grep (should be blocked)
echo -e "\n1. Testing: Bash 'grep -r TODO *.py'"
./.claude/hooks/enforce-agents.sh "Bash" '{"command": "grep -r TODO *.py"}' || echo "   Result: Blocked ✓"

# Test 2: Task tool (should pass)
echo -e "\n2. Testing: Task tool usage"
./.claude/hooks/enforce-agents.sh "Task" '{"agent": "code-analyzer"}' && echo "   Result: Allowed ✓"

# Test 3: Direct tests (should be blocked)
echo -e "\n3. Testing: Bash 'pytest tests/'"
./.claude/hooks/enforce-agents.sh "Bash" '{"command": "pytest tests/"}' || echo "   Result: Blocked ✓"

# Test 4: Normal bash command (should pass)
echo -e "\n4. Testing: Bash 'ls -la'"
./.claude/hooks/enforce-agents.sh "Bash" '{"command": "ls -la"}' && echo "   Result: Allowed ✓"