---
allowed-tools: Read, Bash, Glob
---

# /pm:prd-show - Display PRD Content

Display the full content of a Product Requirements Document (PRD).

## Usage

```
/pm:prd-show <feature_name>
```

## Arguments

- `<feature_name>` - Name of the PRD to display (without .md extension)

## Instructions

1. **Locate the PRD file:**
   ```bash
   ls .claude/prds/{feature_name}.md 2>/dev/null || ls .pm/prds/{feature_name}.md 2>/dev/null
   ```

2. **If not found by exact name, search:**
   ```bash
   find .claude/prds .pm/prds -name "*{feature_name}*.md" 2>/dev/null | head -1
   ```

3. **Read and display the PRD:**
   - Use the Read tool to display the full PRD content
   - Show the complete file including frontmatter
   - DO NOT truncate or abbreviate

## Output Format

```
PRD: {feature_name}
File: {file_path}
─────────────────────────────────────

{full PRD content}

─────────────────────────────────────
📋 Next steps:
  • Edit:   /pm:prd-edit {feature_name}
  • Parse:  /pm:prd-parse {feature_name}
  • Status: /pm:prd-status
```

## Error Handling

If PRD not found:
```
❌ PRD not found: {feature_name}

Available PRDs:
{list of .md files in .claude/prds/ or .pm/prds/}

Create new: /pm:prd-new {feature_name}
```

## Required Documentation Access

**MANDATORY:** Before displaying PRD, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/agile/product-requirements` - PRD best practices
- `mcp://context7/project-management/documentation` - documentation standards

**Why This is Required:**
- Ensures PRD format follows industry standards
- Validates PRD completeness against best practices
