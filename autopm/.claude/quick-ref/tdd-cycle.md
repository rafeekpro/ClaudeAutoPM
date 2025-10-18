# TDD Cycle (Quick Reference)

<tdd_cycle>
<phase id="RED">
<action>Write failing test FIRST</action>
<verify>@test-runner confirms RED ❌</verify>
<commit>test: add failing test for [feature]</commit>
</phase>

<phase id="GREEN">
<action>Write MINIMUM code to pass</action>
<verify>@test-runner confirms GREEN ✅</verify>
<commit>feat: implement [feature]</commit>
</phase>

<phase id="REFACTOR">
<action>Improve code structure</action>
<verify>@test-runner confirms still GREEN ✅</verify>
<commit>refactor: improve [feature] structure</commit>
</phase>
</tdd_cycle>

<example>
```bash
# RED
touch tests/test_auth.py
# Write test
@test-runner run tests/test_auth.py  # Must be RED ❌
git commit -m "test: add failing test for auth"

# GREEN
# Write minimal implementation
@test-runner run tests/test_auth.py  # Must be GREEN ✅
git commit -m "feat: implement auth endpoint"

# REFACTOR
# Improve code
@test-runner run all tests  # Must be GREEN ✅
git commit -m "refactor: improve auth structure"
```
</example>

<prohibited>
❌ Code before test
❌ Skip any phase
❌ "TODO: add tests"
</prohibited>

<full_docs>.claude/rules/tdd.enforcement.md</full_docs>
