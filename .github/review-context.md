# PROJECT_CONTEXT_BRIEF — ClaudeAutoPM

## Stack
- Node.js / JavaScript CLI tool (npm package: project-management automation). Shell scripts. Some Python + TypeScript.

## OUT OF SCOPE (do not flag)
- Style nits (linters/prettier enforce). Pre-existing tech debt outside the diff hunk. Doc/markdown wording.

## Severity
- HIGH: data loss, security (esp. arbitrary command exec in a CLI), broken contract, crash on happy path.
- MEDIUM: edge-case bug, missing test for a new code path. LOW: maintainability nit.
