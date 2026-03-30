---
allowed-tools: Bash, Read, Write, LS
---

# PRD Parse

Convert PRD to technical implementation epic.

## Usage
```
/pm:prd-parse <feature_name>
```

## Required Documentation Access

**MANDATORY:** Before converting PRDs to epics, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/product-management/prd-to-epic` - PRD to epic conversion patterns
- `mcp://context7/agile/epic-structure` - Epic structure and organization
- `mcp://context7/architecture/technical-design` - Technical architecture decisions
- `mcp://context7/project-management/task-breakdown` - Task breakdown strategies
- `mcp://context7/agile/estimation` - Effort estimation and timeline planning

**Why This is Required:**
- Ensures proper PRD-to-epic translation following industry standards
- Applies proven architecture decision frameworks
- Validates task breakdown completeness and accuracy
- Prevents missing critical technical considerations

## Instructions

Run `node .claude/scripts/pm/prd-parse.js $ARGUMENTS` using the Bash tool and show me the complete output.

This will convert the Product Requirements Document into a detailed technical implementation epic including:
1. Technical analysis and architecture decisions
2. Implementation strategy and phases
3. Task breakdown preview (limited to 10 or fewer tasks)
4. Dependencies and success criteria
5. Effort estimates and timeline

The script handles all validation, reads the PRD file, and creates the epic structure at `.claude/epics/$ARGUMENTS/epic.md`.
