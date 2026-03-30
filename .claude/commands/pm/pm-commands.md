# PM Commands

> **IMPORTANT:** Run each `pm:issue-start` in a FRESH Claude Code session.
> Long sessions cause rule degradation. When in doubt — start fresh.

> **MANDATORY:** Every issue created by PM commands MUST include the mandatory implementation
> rules footer from `.claude/templates/issue-mandatory-footer.md`.
> See `.claude/rules/github-operations.xml` for details.

## pm:issue-start <issue_number> [--analyze]

Start work on a GitHub issue.

**Before starting — re-read:**
- `.claude/rules/tdd.enforcement.xml`
- `.claude/rules/coverage-thresholds.xml`
- `.claude/rules/context7.xml`

**Steps:**
1. Fetch issue from GitHub — title, description, labels, comments
2. If `--analyze`: estimate complexity, list affected files, identify agents needed
3. Create branch: `feature/<issue_number>-<slug-from-title>`
4. Query Context7 for all libraries involved
5. Select agents from `AGENT-REGISTRY.md`
6. Write implementation plan — list files to create/modify including tests
7. Execute TDD cycle per `tdd.enforcement.xml`

---

## pm:issue-finish <issue_number>

Complete issue and open PR.

**Before running — re-read:**
- `.claude/rules/coverage-thresholds.xml`

**Steps:**
1. Run full test suite via `@test-runner`
2. Run coverage — BLOCK if thresholds not met
3. Run linters (black/ruff for Python, prettier/eslint for JS/TS)
4. Open PR with coverage table in description
5. STOP — do not proceed until Copilot review complete

---

## pm:review-fix

Process Copilot review and fix all issues.

**Steps:**
1. Read ALL open Copilot comments on current PR
2. Fix every issue — errors first, then style, then comments
3. Run full test suite — confirm all pass
4. Push and report PR clean status

---

## pm:backlog

Show prioritized open GitHub issues.

**Steps:**
1. Fetch all open issues from GitHub
2. Group by label and priority
3. Suggest next issue based on dependencies and complexity
4. Show estimated effort per issue
