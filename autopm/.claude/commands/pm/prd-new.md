---
allowed-tools: Bash, Read, Write, LS
---

# PRD New

Launch interactive brainstorming session for new product requirement document.

## Usage
```
/pm:prd-new <feature_name> [--local]
```

## Flags

`--local`, `-l`
: Use local mode (offline workflow)
: Creates PRD files in `.claude/prds/` directory
: No GitHub/Azure synchronization required
: Ideal for working offline or without remote provider configured

Example:
```
/pm:prd-new user-authentication --local
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

Run `node .claude/scripts/pm/prd-new.js $ARGUMENTS` using the Bash tool and show me the complete output.

This will launch an interactive brainstorming session that will:
1. Prompt for product vision
2. Gather information about target users
3. Collect key features through interactive prompts
4. Define success metrics
5. Capture technical considerations
6. Generate a comprehensive PRD with proper frontmatter

The script handles all validation, creates the necessary directories, and saves the PRD to `.claude/prds/$ARGUMENTS.md`.
