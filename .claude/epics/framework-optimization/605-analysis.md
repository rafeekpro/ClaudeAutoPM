---
issue: 605
name: framework-wide-optimization
analyzed: 2026-06-10T11:03:46Z
status: audit-complete
---

# Issue #605 — Audit Results & Work Stream Decomposition

Audit phase (5 parallel audits) completed 2026-06-10. Findings below drive the sub-issue decomposition.

## Audit Findings Summary

### A. Prompts & Tokens (framework payload)

- 233 command prompt files, ~1.51 MB, ~388k tokens total.
- **44 exact duplicate files** between `autopm/.claude/commands/` and `packages/plugin-*/commands/` (~34.5k tokens, 9% of payload): 25 → plugin-pm, 17 → plugin-pm-github, 2 → plugin-core.
- **4 near-duplicates already diverged**: `pm:issue-start.md`, `pm:prd-new.md`, `pm:epic-decompose.md`, `pm:import.md`.
- **Zero `@include` usage in the payload** — all boilerplate copy-pasted. Biggest blocks: "Required Documentation Access"/Context7 (51–53 files, ~33k tokens), "Important Notes" footers (40+ files), TDD reminder (4 files).
- Total recoverable: **~76k tokens (~19.6% of payload)** — exceeds the 20% issue target via dedup + extraction alone.

### B. Shell Scripts (3 locations)

- Core libs (`lib/*.sh`, `mcp/*.sh`) currently **byte-identical** across plugin-core / autopm payload / repo `.claude` — but sync is **fully manual** (issue #599 required editing 3 files by hand).
- **No automated sync or CI divergence check exists.** Install flow: `install/install.js` `copyDirectory` (lines 299–375), no checksum validation.
- Not yet consolidated into plugin-core: 8 root-level scripts (only in autopm payload) + 3 hooks scripts (only in repo `.claude`).
- `bash -n`: all 25 scripts pass.

### C. Code Quality (lib/, bin/)

- 158 JS files; largest: EpicService.js (1,972), IssueService.js (1,582), PluginManager.js (1,542).
- **Critical bug**: `PluginManager.js:914` uninstall removes from `projectRoot/scripts` while install writes to `projectRoot/.claude/scripts` (`:698`) → orphaned files on uninstall.
- Broken semver handling (`PluginManager.js:1411-1440` — only `>=` supported), ~35% duplication across install* methods, sync fs in async contexts, unprotected `copyFileSync` calls (12+ sites), misleading indentation at `:193`.
- **No ESLint** — `npm run lint` is markdownlint only. 815 scattered console.* calls; duplicated helpers across `lib/cli/commands/*`.

### D. Security

- **CRITICAL (distributed payload)**: `autopm/.claude/scripts/pr-validation.js:154` — `spawn('sh', ['-c', command])` with user-controlled command.
- **HIGH**: `bin/autopm.js:48` (args interpolated into execSync string), `bin/commands/epic.js:133` (epicName → bash), `autopm/.claude/scripts/setup-context7.js:36,116` (`which ${command}`, `npm install -g ${pkg}`), `lib/providers/AzureDevOpsCliWrapper.js` (8+ unescaped interpolations into az commands).
- **MEDIUM**: path traversal in `lib/cli/commands/prd.js:316-328` (`--content @file` reads arbitrary paths); token logged to stdout in `autopm/.claude/scripts/pm/dashboard-serve.js`; `PluginManager.js:1015,1055` (plugin name → execSync).
- npm audit (prod): 7 vulns (1 high: fast-uri; moderate: hono ×15 CVEs, qs, brace-expansion, ip-address).

### E. Tests

- 194 test files, mixed Jest + node:test runners across 19 dirs.
- **`npm test` runs only a 7-file allowlist** (jest.config.quick.js) — green CI ≠ healthy test base.
- `npx jest test/unit`: **13 of 38 suites failing today** (93 failing tests) — API drift (`.projectRoot`), wrong require path (`test/unit/core/PluginManager.test.js` → nonexistent `src/`), empty suite, git-dependent bash tests.
- Coverage gates: rule requires 80/75/80/80; jest.config.js has 50/50/50/50 and **only measures `autopm/.claude/scripts`** — `lib/` and `bin/` excluded from default coverage.
- Untested: `lib/cli/commands/obsidian.js`, `context.js`, `bin/commands/plugin.js`, `install/install.js` (test excluded), `validation-utils.sh`, `logging-utils.sh`. Dead file: `lib/plugins/PluginManager.old.js` (0%).

## Work Streams (→ sub-issues)

| # | Stream | Type | Effort | Priority | Depends on |
|---|--------|------|--------|----------|------------|
| 1 | Security hardening (injection, traversal, token logging, npm audit) | fix | L | P0 | — |
| 2 | PluginManager critical bugs (uninstall path, semver, I/O errors) | fix | M | P0 | — |
| 3 | Test infrastructure repair (failing suites, coverage gates, dead code) | test | L | P1 | — |
| 4 | Prompt dedup + @include extraction (token optimization) | refactor | L | P1 | — |
| 5 | Script sync automation (plugin-core → payload, CI divergence check) | chore | M | P1 | — |
| 6 | CLI consolidation (shared helpers, output, ESLint) | refactor | L | P2 | 2, 3 |
| 7 | Repo-config refresh (root .claude as consumer) | chore | S | P3 | 4, 5 |

Streams 1–5 are independent and parallelizable. Each lands as its own PR against this epic branch or main.
