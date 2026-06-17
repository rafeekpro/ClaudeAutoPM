---
allowed-tools: Read, Edit, Write, Bash
---

# Wrap Session

Perform the full pre-compact ritual: summarize session, persist memories, update CLAUDE.md, review hook candidates, and print a context primer.

## Instructions

### Step 1 — Summarize session

Review the current conversation. Extract:
- Key decisions made
- Patterns or commands discovered (what worked, what failed)
- Blockers resolved
- Anything surprising or non-obvious

Hold this summary in memory for use in subsequent steps.

### Step 2 — Update memories

Write or update memory files in `.claude/projects/<cwd>/memory/` (create the directory if absent).

Memory types to cover — check each one and write/update as needed:
- `user` — role, preferences, expertise level discovered this session
- `feedback` — corrections or confirmations the user gave (what to stop/keep doing)
- `project` — decisions, deadlines, constraints, active initiatives
- `reference` — pointers to external systems, dashboards, or docs referenced

Each memory file uses YAML frontmatter with `name`, `description`, and `metadata.type` fields, followed by a body section.

After writing memory files, update `MEMORY.md` in the same directory:
- One line per memory: `- [Title](file.md) — one-line hook`
- Keep the index under 200 lines (truncate oldest low-value entries if MEMORY.md exceeds 200 lines)
- Idempotent: check whether an entry for the same slug already exists before adding; update in place rather than appending a duplicate

### Step 3 — Update CLAUDE.md

Scan the session for anything not yet captured in `.claude.local.md` (prefer this for personal notes) or `CLAUDE.md`:
- New commands or workflows discovered
- Gotchas, invariants, or non-obvious constraints
- Patterns that should be repeated

Read the target file first, then append only what is genuinely missing — do not duplicate existing content.

### Step 4 — Review hooks

Scan the session for repeated manual actions the user had to do more than once:
- Running a linter after every edit
- Fetching a URL before testing
- Any consistent before/after pattern

For each candidate output one line of the form:
Hook candidate: after `<event>` → run `<command>`

Skip this step silently if no candidates are found.

### Step 5 — Print compact primer

Run `/handoff` to generate and print the context primer. The `/handoff` command captures current branch, modified files, recent commits, and next steps, then prints a ready-to-paste block under 200 words.

## Output Format

Print the following block when done (substitute real counts):

    ✅ wrap-session complete
      - <N> memories updated
      - CLAUDE.md: <N> lines added
      - Hook candidates: <N> (or "none")

Next: copy the primer below → /compact → paste primer

```
[primer text here — branch, decisions, completed work, open items, gotchas]
```
