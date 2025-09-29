---
allowed-tools: Bash, Read, Write, LS
---

# PRD New

Launch interactive brainstorming session for new product requirement document.

## Usage
```
/pm:prd-new <feature_name>
```

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
