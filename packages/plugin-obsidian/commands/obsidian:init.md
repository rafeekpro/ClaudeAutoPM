---
allowed-tools: Bash, Read, Write, Glob, Grep, LS
---

# Obsidian Init

Generate project-aware Obsidian vault files by reading the actual project structure.

Unlike generic templates, this command reads your project's real content — issues, epics, PRDs, agents, rules, code structure — and generates MOC, Dashboard, templates, and diagrams tailored to what actually exists.

## Usage

```
/obsidian:init [--force]
```

Options:
- `--force` — Overwrite existing vault files (default: skip if they exist)

## Prerequisites

Run `autopm obsidian setup --vault-path "<path>"` first. This command reads the vault config from `.claude/config.json`.

## Instructions

### 1. Read Configuration

```bash
# Get vault config
node -e "
  const c = JSON.parse(require('fs').readFileSync('.claude/config.json','utf8'));
  if (!c.obsidian || !c.obsidian.vault_path) { console.error('ERROR: Run autopm obsidian setup first'); process.exit(1); }
  console.log(JSON.stringify(c.obsidian));
"
```

Extract `vault_path` and `vault_prefix` from the output. The target directory for all generated files is `{vault_path}/{vault_prefix}/`.

### 2. Discover Project Structure

Read the project to understand what exists. Gather:

**Issues/Tasks:**
- Glob for `issues/**/*.md` and `.claude/epics/**/*.md`
- Read frontmatter of each: extract `name`, `status`, `type`, `tags`, `github`
- Count by status: open, in-progress, closed

**PRDs:**
- Glob for `.claude/prds/**/*.md` or `prds/**/*.md`
- Read frontmatter: `name`, `status`

**Epics:**
- Glob for `.claude/epics/*/epic.md`
- Read frontmatter: `name`, `status`, `progress`

**Agents:**
- Glob for `.claude/agents/**/*.md` (exclude README, REGISTRY)
- Extract agent names and categories from directory structure

**Rules:**
- Glob for `.claude/rules/*.md`
- Extract rule names

**Commands:**
- Glob for `.claude/commands/*.md`
- Extract command names (the `pm:*`, `obsidian:*` prefixes)

**Code structure:**
- Check for common project indicators: `package.json`, `requirements.txt`, `go.mod`, `Cargo.toml`, `pom.xml`
- Read `package.json` if exists: extract `name`, `description`, `scripts`, main dependencies
- Check for `src/`, `lib/`, `app/`, `api/` directories
- Check for test directories: `tests/`, `test/`, `__tests__/`, `spec/`

### 3. Generate MOC.md

Write `{vault_path}/{vault_prefix}/MOC.md` with content based on what was discovered.

The MOC (Map of Content) should be a navigation hub. Structure it as:

```markdown
---
type: moc
title: "{project_name} — Map of Content"
created: "{current_iso_date}"
updated: "{current_iso_date}"
tags: [moc, navigation]
---

# {project_name} — Map of Content

> Auto-generated from project structure. Regenerate with `/obsidian:init`.

## Project Overview

{One paragraph summary based on package.json description or README first paragraph}

Tech stack: {detected languages/frameworks}

## Epics

{If epics exist, create a Dataview TABLE query. If no epics, write "No epics yet."}

```dataview
TABLE status, progress
FROM "{prefix}/epics"
WHERE type = "epic"
SORT status ASC
```

### Active Epics
{List each discovered epic with a direct link: `- [[{prefix}/epics/{name}/epic|{title}]] — {status}`}

## Issues & Tasks

{If issues exist, create Dataview queries grouped by status}

```dataview
TABLE status, tags
FROM "{prefix}/issues"
WHERE status = "open" OR status = "in-progress"
SORT status ASC, file.mtime DESC
```

**Summary:** {X} open, {Y} in-progress, {Z} closed

## PRDs

{If PRDs exist, list them with links. Otherwise "No PRDs yet."}

```dataview
TABLE status, created
FROM "{prefix}/prds"
SORT created DESC
```

## Agents ({count} available)

{Group agents by category with links}

### Core
{List core agents}

### Languages
{List language agents}

### {Other categories}
{List other agents}

## Rules ({count} active)

{List rules as a simple bullet list with links}

## Commands ({count} available)

{Group commands by prefix: pm:*, obsidian:*, etc.}

## Recent Changes

```dataview
TABLE file.mtime as "Modified"
FROM "{prefix}"
SORT file.mtime DESC
LIMIT 15
```
```

### 4. Generate DASHBOARD.md

Write `{vault_path}/{vault_prefix}/DASHBOARD.md` with project status overview:

```markdown
---
type: dashboard
title: "{project_name} Dashboard"
created: "{current_iso_date}"
updated: "{current_iso_date}"
tags: [dashboard, overview]
---

# {project_name} Dashboard

> Auto-generated. Regenerate with `/obsidian:init`.

## Status at a Glance

| Metric | Count |
|--------|-------|
| Open Issues | {actual_count} |
| In Progress | {actual_count} |
| Closed | {actual_count} |
| Epics | {actual_count} |
| PRDs | {actual_count} |
| Agents | {actual_count} |
| Rules | {actual_count} |

## Open Work

```dataview
TABLE status, tags, file.mtime as "Updated"
FROM "{prefix}/issues" OR "{prefix}/epics"
WHERE status = "open" OR status = "in-progress"
SORT status ASC, file.mtime DESC
```

## In Progress

```dataview
LIST
FROM "{prefix}"
WHERE status = "in-progress"
SORT file.mtime DESC
```

## Recently Completed

```dataview
TABLE status, file.mtime as "Completed"
FROM "{prefix}"
WHERE status = "closed" OR status = "completed"
SORT file.mtime DESC
LIMIT 10
```

## By Type

```dataview
TABLE WITHOUT ID
  type as "Type",
  length(rows) as "Count"
FROM "{prefix}"
WHERE type
GROUP BY type
SORT length(rows) DESC
```

## Quick Links

- [[{prefix}/MOC|Map of Content]]
- [[{prefix}/agents|Agents]]
- [[{prefix}/rules|Rules]]
```

### 5. Generate _templates/

Create Obsidian Templater-compatible templates based on the project's actual frontmatter conventions.

Read 2-3 existing issue files to understand what fields are used. Then generate templates that match.

Write to `{vault_path}/{vault_prefix}/_templates/`:

**issue.md** — based on actual issue frontmatter fields found:
```markdown
---
type: issue
title: "<% tp.file.title %>"
status: open
created: "<% tp.date.now('YYYY-MM-DDTHH:mm:ss') %>Z"
updated: "<% tp.date.now('YYYY-MM-DDTHH:mm:ss') %>Z"
tags: [issue]
{any_other_fields_found_in_existing_issues}
---

# <% tp.file.title %>

## Description

## Acceptance Criteria

- [ ] 

## Technical Details
```

**prd.md** and **epic.md** — same approach, based on actual frontmatter conventions found.

### 6. Generate Architecture Diagram

Write `{vault_path}/{vault_prefix}/diagrams/01-architecture.md` with a Mermaid diagram reflecting the actual project structure:

```markdown
---
type: diagram
title: "{project_name} Architecture"
tags: [diagram, mermaid, architecture]
---

# {project_name} Architecture

> Auto-generated from project structure. Edit to match your actual architecture.

```mermaid
graph TB
    subgraph "Project: {project_name}"
        {Generate nodes based on discovered directories}
        {e.g., if src/api/ exists: API[API Layer]}
        {e.g., if src/models/ exists: Models[Data Models]}
        {Connect related components}
    end

    subgraph "ClaudeAutoPM"
        PM[PM System]
        Agents["{agent_count} Agents"]
        Rules["{rule_count} Rules"]
    end

    subgraph "Obsidian Vault"
        MOC[MOC.md]
        Dashboard[DASHBOARD.md]
        Issues["{issue_count} Issues"]
    end

    PM -->|sync| Issues
    Agents -->|documented in| MOC
```
```

If the project is simple (no src/ structure), generate a simpler diagram showing just the ClaudeAutoPM + Obsidian relationship.

### 7. Generate Excalidraw Whiteboard

Write `{vault_path}/{vault_prefix}/diagrams/pizarra.excalidraw.md`:

```markdown
---
type: diagram
title: Whiteboard
tags: [diagram, excalidraw, whiteboard]
excalidraw-plugin: parsed
---

# Whiteboard

Open this file in Excalidraw to start drawing.

%%
# Excalidraw Data

## Drawing
```json
{
  "type": "excalidraw",
  "version": 2,
  "source": "https://github.com/zsviczian/obsidian-excalidraw-plugin",
  "elements": [],
  "appState": {
    "gridSize": null,
    "viewBackgroundColor": "#ffffff"
  },
  "files": {}
}
```
%%
```

### 8. Run Sync

After generating all files, run a sync to push everything to the vault:

```bash
# Find and run sync script
if [ -f ".claude/scripts/obsidian/sync-to-obsidian.sh" ]; then
  bash .claude/scripts/obsidian/sync-to-obsidian.sh
elif [ -f "packages/plugin-obsidian/scripts/obsidian/sync-to-obsidian.sh" ]; then
  bash packages/plugin-obsidian/scripts/obsidian/sync-to-obsidian.sh
fi
```

### 9. Output Summary

```
Obsidian vault initialized for {project_name}

Generated:
  MOC.md           — {X} sections, {Y} linked items
  DASHBOARD.md     — {open} open, {in_progress} in progress, {closed} closed
  _templates/      — {N} templates based on project conventions
  diagrams/        — architecture + whiteboard

Vault: {vault_path}/{prefix}/

Discovered:
  Issues:   {count} ({open} open, {in_progress} in progress, {closed} closed)
  Epics:    {count}
  PRDs:     {count}
  Agents:   {count} across {categories} categories
  Rules:    {count}
  Commands: {count}

Next: Open the vault in Obsidian. Install Dataview plugin for live queries.
Resync: autopm obsidian sync
Regenerate: /obsidian:init --force
```

## Important Notes

- All Dataview queries use the vault prefix from `.claude/config.json`
- Generated files go directly to the vault path, not the project
- Sync runs after generation to ensure vault has latest project content
- Use `--force` to regenerate if project structure changes significantly
- The command is idempotent — safe to run multiple times
