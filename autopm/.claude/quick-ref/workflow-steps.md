# Standard Task Workflow (Quick Reference)

<workflow>
<step id="1" name="Pick Task">
<action>Select task from backlog (sorted by priority)</action>
<verify>Check Acceptance Criteria + Definition of Done</verify>
</step>

<step id="2" name="Create Branch">
<action>git checkout -b feature/task-name</action>
<convention>feature/|bugfix/|hotfix/</convention>
</step>

<step id="3" name="Implement">
<action>Follow TDD: RED→GREEN→REFACTOR</action>
<agents>@test-runner|@code-analyzer|specialist agents</agents>
<context7>Query docs BEFORE coding</context7>
</step>

<step id="4" name="Verify AC">
<checklist>
✓ All Acceptance Criteria met
✓ Definition of Done complete
✓ Tests passing (@test-runner)
✓ Code formatted + linted
✓ No partial implementations
</checklist>
</step>

<step id="5" name="Create PR">
<action>gh pr create --title "feat: description"</action>
<template>
## Summary
- What changed
- Why changed

## Test Plan
- How to verify

## Checklist
✓ Tests pass
✓ Linting clean
✓ Documentation updated
</template>
</step>

<step id="6" name="Address Feedback">
<action>Interpret + resolve ALL PR comments</action>
<process>
1. Read comment carefully
2. Ask clarifying questions if unclear
3. Implement requested changes
4. Push updates
5. Respond to comment
</process>
</step>

<step id="7" name="Merge">
<action>gh pr merge --squash</action>
<requirements>
✓ All checks pass
✓ All comments resolved
✓ No merge conflicts
</requirements>
</step>

<step id="8" name="Complete">
<action>Mark task status: "completed" (NOT "ready")</action>
<cleanup>Delete feature branch</cleanup>
</step>

<step id="9" name="Next Task">
<action>Return to step 1</action>
</step>
</workflow>

<quick_commands>
# Branch workflow
git checkout -b feature/name
git add .
git commit -m "type: description"
git push -u origin feature/name

# PR workflow
gh pr create
gh pr view
gh pr merge --squash

# Verification
@test-runner run all tests
npm run lint
npm run build
</quick_commands>

<prohibited>
❌ Direct commits to main
❌ PRs without tests
❌ Merging with conflicts
❌ Ignoring PR feedback
❌ Status "ready" (use "completed")
</prohibited>

<full_docs>.claude/workflows/standard-task-workflow.md</full_docs>
