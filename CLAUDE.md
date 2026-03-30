# CLAUDE.md

> Think carefully. Implement the most concise solution possible.

## CRITICAL RULES (zero tolerance — read on every task)

@include .claude/rules/tdd.enforcement.xml
@include .claude/rules/coverage-thresholds.xml
@include .claude/rules/agent-mandatory.xml
@include .claude/rules/context7.xml
@include .claude/rules/github-operations.xml
@include .claude/rules/naming-conventions.xml
@include .claude/rules/command-pipelines.xml

## COMMANDS

@include .claude/commands/pm/pm-commands.md

## AGENTS

@include .claude/agents/agent-registry.xml

Full agent descriptions: `.claude/agents/AGENT-REGISTRY.md`

## XML PROMPT TEMPLATES

See `.claude/templates/xml-prompts/TEMPLATE_REGISTRY.md` for staged workflow templates.
Builder: `lib/xml-prompt-builder.js` — invoke with template path and variables.

## OPERATIONAL GUIDANCE

See `.claude/rules/` for reference:

- `standard-patterns.md` — Output formats, datetime handling, error messages
- `frontmatter-operations.md` — YAML frontmatter read/write/strip
- `git-strategy.md` — Branch naming, commit standards, merge workflow

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
