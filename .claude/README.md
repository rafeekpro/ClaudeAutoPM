# Root `.claude/` — Dogfooding Install of the Framework

This directory is this repository's **own** Claude Code configuration — a regular
*consumer* install of the framework, NOT the distributed product. The product
lives in:

- `autopm/.claude/` — the installation payload copied into user projects by `autopm install`
- `packages/plugin-*/` — the plugin sources (single source of truth for shared commands/scripts)

Rule of thumb: **never hand-edit framework-derived files here** — fix them in
`packages/` (preferred) or `autopm/.claude/`, then refresh this directory
(see "How to refresh" below). Repo-specific files are owned here and are safe
to edit directly.

## How to refresh

```bash
npm run sync:scripts            # plugin-core scripts -> autopm/.claude/scripts AND .claude/scripts
npm run sync:scripts:check      # verify scripts are in sync (CI gate)
npm run sync:commands           # plugin commands -> autopm/.claude/commands (payload only)
npm run sync:commands:check     # verify commands are in sync (CI gate)
```

For everything not covered by the sync scripts (commands, rules, agents,
providers, lib, templates), compare against the payload and copy forward:

```bash
# show divergence between this install and the payload
git ls-files .claude | while read f; do
  rel="${f#.claude/}"; p="autopm/.claude/$rel"
  [ -f "$p" ] && ! cmp -s "$f" "$p" && echo "DIFF  $rel"
  [ -f "$p" ] || echo "REPO-ONLY  $rel"
done
```

Any `DIFF` not listed under "Intentionally diverged" below is stale — refresh it
from `autopm/.claude/`.

## Classification

### Framework-derived (mirror of `autopm/.claude/` — regenerate, do not hand-edit)

All of the following are byte-identical copies of the payload:

- `agents/**` — core agent definitions, registry (`agent-registry.xml`, `AGENT-REGISTRY.md`)
- `checklists/**`, `quick-ref/**`, `strategies/**`, `mcp/**`, `base.md`, `teams.json`, `mcp-servers.json`
- `commands/**` — except `commands/xml/` (repo-specific) and the four
  `pm:issue-*` files listed under "Intentionally diverged"
- `rules/**` — including the repo-critical `github-operations.xml` and
  `issue-structure.xml` (identical to the payload versions)
- `scripts/**` — kept in sync automatically by `npm run sync:scripts`
- `hooks/**` — `context7-enforcement.js`, `docker-first-enforcement.sh`,
  `pre-action-agent-reminder.js`, `pre-commit-clear-reminder.sh`,
  `pre-push-docker-tests.sh`, `test-hook.sh`
- `lib/**` — except `lib/commands/xml/` (repo-specific)
- `providers/**`
- `templates/epic.xml`, `templates/issue.xml`, `templates/prd.xml`, `templates/task.xml`
  (the only tracked templates — the rest of `templates/` is gitignored, see below)

### Intentionally diverged from the payload (review / upstream candidates)

| File | Why it diverges |
|------|-----------------|
| `commands/pm:issue-analyze.md` | Contains the #557 frontmatter-first task-file lookup fix (newer than the payload copy). Upstream to `packages/plugin-pm` + payload, then re-sync. |
| `commands/pm:issue-close.md` | Same #557 lookup fix. |
| `commands/pm:issue-edit.md` | Same #557 lookup fix. |
| `commands/pm:issue-reopen.md` | Same #557 lookup fix. |

### Repo-specific (owned by this repo — keep, edit freely)

| Path | Purpose |
|------|---------|
| `config.json` | Live AutoPM config for this repo (execution strategy, features, MCP state) |
| `agent-triggers.md` | Agent trigger map checked by `scripts/verify-agents.js` |
| `DEVELOPMENT-STANDARDS.md` | Command/agent authoring standard used by `scripts/standardize-*.js` |
| `commands/xml/*.md`, `lib/commands/xml/*.js` | Repo-local `/xml:template-*` slash commands (never shipped in payload) |
| `docs/*.md` (11 files) | Historical engineering notes and issue analyses |
| `epics/imported/557.md` | PM working data (imported issue) |
| `settings.local.json` | Local Claude Code permissions (untracked) |

### Removed in #612 (orphans — deleted from the payload in the prompt dedup, #609/#610)

- `hooks/context7-reminder.md`, `hooks/enforce-agents.js`, `hooks/enforce-agents.sh`,
  `hooks/pre-agent-context7.js`, `hooks/pre-command-context7.js`,
  `hooks/strict-enforce-agents.sh`, `hooks/unified-context7-enforcement.sh`
  — replaced by `hooks/context7-enforcement.js` and `hooks/pre-action-agent-reminder.js`
- `mcp/test-server.md` — old test artifact; tests create their own fixtures in temp dirs

### Gitignored local content (not in git — informational)

`.claude/templates/` is gitignored except the four tracked XML templates, so a
local checkout may contain extra template files materialized by an earlier
install (e.g. `templates/claude-templates/`, `templates/prds/`,
`templates/infrastructure/`, `templates/xml-prompts/`). These are local install
artifacts; if stale ones bother you (`claude-templates/base-optimized.md`,
`infrastructure/`, `xml-prompts/dev/*infrastructure*` no longer exist in the
payload) they can be deleted locally without affecting the repo.

## Consumed by

- `CLAUDE.md` — `@include`s `rules/*.xml`, `commands/pm/pm-commands.md`,
  `agents/agent-registry.xml`; references `agents/AGENT-REGISTRY.md` and
  `templates/xml-prompts/TEMPLATE_REGISTRY.md`
- Claude Code — `commands/` (slash commands), `hooks/`, `settings.local.json`
- Repo tooling — `scripts/verify-agents.js` (`agent-triggers.md`),
  `scripts/standardize-*.js` (`DEVELOPMENT-STANDARDS.md`)
