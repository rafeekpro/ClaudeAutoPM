---
allowed-tools: Bash, Read, Write, LS
---

# PRD New

Create new product requirement document - interactively or from existing content.

## Usage
```
/pm:prd-new <feature_name> [options]
```

## Flags

`--local`, `-l`
: Use local mode (offline workflow)
: Creates PRD files in `.claude/prds/` directory
: No GitHub/Azure synchronization required
: Ideal for working offline or without remote provider configured

`--content`, `-c`
: PRD content for non-interactive mode
: Use `@filepath` to read from file (e.g., `--content @/path/to/draft.md`)
: Use inline text for short content (e.g., `--content "# My PRD..."`)
: Skips interactive wizard completely
: Ideal for importing existing PRDs or automated workflows

`--force`, `-f`
: Overwrite existing PRD file if it exists

`--priority`, `-p`
: Set PRD priority (P0/P1/P2/P3, default: P2)

`--timeline`
: Set PRD timeline (e.g., "Q1 2025")

## Examples

### Interactive mode (default)
```
/pm:prd-new user-authentication
```

### Local mode
```
/pm:prd-new user-authentication --local
```

### From existing file
```
/pm:prd-new payment-gateway --content @docs/drafts/payment-prd.md
```

### From clipboard/inline content
```
/pm:prd-new api-v2 --content "# API v2 Redesign

## Problem Statement
Current API has performance issues...

## Goals
1. Improve response times
2. Better error handling
"
```

### With metadata
```
/pm:prd-new critical-fix --content @bug-report.md --priority P0 --timeline "This Sprint"
```

### Force overwrite
```
/pm:prd-new existing-feature --content @updated-prd.md --force
```

## Required Documentation Access

**MANDATORY:** Before creating PRDs, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/product-management/prd-templates` - PRD structure and templates
- `mcp://context7/product-management/requirements` - Requirements gathering
- `mcp://context7/agile/user-stories` - User story best practices
- `mcp://context7/product-management/success-metrics` - Defining success criteria

**Why This is Required:**
- Ensures PRDs follow industry-standard formats
- Applies proven requirements gathering techniques
- Validates completeness of product specifications
- Prevents missing critical sections (acceptance criteria, success metrics, etc.)

## Instructions

### Mode Detection

Parse the arguments to detect the mode:
- If `--content @<filepath>` is present → **Content from file mode**
- If `--content "<text>"` is present → **Content from inline text mode**
- Otherwise → **Interactive mode**

### Content from File Mode (`--content @filepath`)

1. Extract the file path from `--content @<filepath>` argument
2. Use the Read tool to read the source file content
3. Check if target PRD already exists at `.claude/prds/<feature_name>.md`
   - If exists and `--force` not provided → Error and stop
   - If exists and `--force` provided → Continue (will overwrite)
4. Prepare the PRD content:
   - If source content starts with `---` (has frontmatter) → Use as-is
   - If no frontmatter → Add frontmatter with:
     ```yaml
     ---
     title: <feature_name>
     status: draft
     priority: <from --priority or P2>
     created: <current ISO timestamp>
     author: <from git config or "unknown">
     timeline: <from --timeline or "TBD">
     ---
     ```
5. Create directory `.claude/prds/` if it doesn't exist (use Bash: `mkdir -p .claude/prds`)
6. Write the PRD file using the Write tool to `.claude/prds/<feature_name>.md`
7. Confirm success and show next steps

### Content from Inline Text Mode (`--content "text"`)

Same as file mode, but use the inline text directly instead of reading from file.

### Interactive Mode (default)

Run `node .claude/scripts/pm/prd-new.js $ARGUMENTS` using the Bash tool and show me the complete output.

This will launch an interactive brainstorming session that will:
1. Prompt for product vision
2. Gather information about target users
3. Collect key features through interactive prompts
4. Define success metrics
5. Capture technical considerations
6. Generate a comprehensive PRD with proper frontmatter

The script handles all validation, creates the necessary directories, and saves the PRD to `.claude/prds/<feature_name>.md`.

## Output

After successful PRD creation, show:
```
✅ PRD created: .claude/prds/<feature_name>.md

📋 Next steps:
  1. Review: /pm:prd-show <feature_name>
  2. Edit:   /pm:prd-edit <feature_name>
  3. Parse:  /pm:prd-parse <feature_name>
```
