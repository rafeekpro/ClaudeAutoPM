# CLAUDE.md

> Think carefully. Implement the most concise solution possible.

## CRITICAL RULES (zero tolerance — read on every task)

@include .claude/rules/tdd.enforcement.xml
@include .claude/rules/coverage-thresholds.xml
@include .claude/rules/agent-mandatory.xml
@include .claude/rules/context7.xml

## COMMANDS

@include .claude/commands/pm/pm-commands.md

## AGENTS

@include .claude/agents/AGENT-REGISTRY.md

## EXTENDED RULES

See `.claude/rules/` for all operational rules:

- `standard-patterns.md` — Output formats, error messages, validation
- `github-operations.md` — gh CLI patterns, repo protection
- `frontmatter-operations.md` — YAML frontmatter read/write
- `command-pipelines.md` — Command sequences and prerequisites
- `naming-conventions.md` — Naming prohibitions, code quality
- `datetime.md` — ISO 8601 timestamps from system clock
- `context-optimization.md` — Agent delegation for context efficiency
- `development-workflow.md` — Pre/during/post implementation steps
- `git-strategy.md` — Branch-based development workflow
- `strip-frontmatter.md` — Remove YAML before GitHub sync
- `test-execution.md` — Test runner patterns and cleanup

## PROJECT

- **Language**: JavaScript/Node.js
- **Testing**: Jest (`npm test`, `npm run test:coverage`)
- **Install**: `autopm install` copies `autopm/.claude/` to target
- **Path rule**: Never hardcode `autopm/` in framework files — use `.claude/`
- **Commits**: Semantic format, no Claude attribution signatures

## TONE

- Be concise. Be skeptical. Criticism welcome.
- Ask questions rather than guessing intent.
- No flattery. No compliments unless asked.
