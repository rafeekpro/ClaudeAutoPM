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
: Skips LLM generation completely
: Ideal for importing existing PRDs or automated workflows

`--interactive`, `-i`
: Use interactive terminal prompts (requires interactive terminal)
: NOT compatible with Claude Code (use default LLM generation instead)
: Launches traditional brainstorming wizard with readline prompts

`--force`, `-f`
: Overwrite existing PRD file if it exists

`--priority`, `-p`
: Set PRD priority (P0/P1/P2/P3, default: P2)

`--timeline`
: Set PRD timeline (e.g., "Q1 2025")

## Examples

### LLM-assisted generation (default - works in Claude Code)
```
/pm:prd-new user-authentication
```

### Interactive terminal mode (requires interactive terminal)
```
/pm:prd-new user-authentication --interactive
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
- If `--interactive` flag is present → **Interactive Terminal Mode**
- If `--content @<filepath>` is present → **Content from File Mode**
- If `--content "<text>"` is present → **Content from Inline Text Mode**
- Otherwise → **LLM-Assisted Generation Mode** (default)

### LLM-Assisted Generation Mode (DEFAULT - works in Claude Code)

#### Phase 0: Codebase Analysis (MANDATORY)

**CRITICAL**: Before creating any PRD, perform comprehensive codebase analysis to prevent duplicate implementations and identify reusable components.

1. **Search for Existing Functionality**

   Use code-analyzer agent to search the entire codebase:

   ```markdown
   Task:
     subagent_type: "code-analyzer"
     description: "Search for existing '<feature_name>' functionality"
     prompt: |
       Search the entire codebase for anything related to: <feature_name>

       Search criteria:
       - Function names containing: <feature_name> (or related terms)
       - File names related to: <feature_name>
       - Class/module names similar to: <feature_name>
       - Comments/documentation mentioning: <feature_name>
       - Similar patterns or implementations
       - Related API endpoints or routes
       - Database models/schemas related to feature

       Return findings in this format:

       ## Existing Implementations Found
       - File: [path] - [brief description]
       - Function: [name] - [what it does]
       - Component: [name] - [purpose]

       ## Similar Patterns
       - [description of similar functionality]

       ## Recommendation
       ✅ Safe to create new PRD (no conflicts found)
       OR
       ⚠️ Existing functionality detected - review before proceeding

       ## Reusable Components
       - [list components that can be reused]
       - [list utilities that apply]
   ```

2. **Analyze Dependencies and Integration Points**

   Use code-analyzer agent to identify dependencies:

   ```markdown
   Task:
     subagent_type: "code-analyzer"
     description: "Identify dependencies for '<feature_name>'"
     prompt: |
       Identify systems that '<feature_name>' would interact with:

       - **Databases**: What tables/collections would be needed?
       - **APIs**: Which endpoints would be affected/created?
       - **External Services**: Third-party integrations needed?
       - **Internal Modules**: Which existing modules would be used?
       - **Authentication**: Auth/authorization requirements?
       - **State Management**: Frontend state considerations?

       Return integration points and potential conflicts.
   ```

3. **Present Findings to User**

   Format the analysis results for user review:

   ```markdown
   🔍 **Codebase Analysis Results for: <feature_name>**
   ═══════════════════════════════════════════════════

   ### Existing Implementations
   [If found, list each with file path and purpose]
   [If none found: "✅ No existing implementations detected"]

   ### Dependencies Identified
   [List each dependency type and specific items]

   ### Reusable Components
   [List components that can be leveraged]
   [If none: "No directly reusable components found"]

   ### Potential Conflicts
   [List any naming conflicts, duplicate logic, etc.]
   [If none: "✅ No conflicts detected"]

   ### Technology Stack Detected
   - Backend: [detected frameworks]
   - Frontend: [detected frameworks]
   - Database: [detected systems]
   - Testing: [detected tools]

   ───────────────────────────────────────────────────

   ## Recommendation

   Based on this analysis:

   ✅ **OPTION 1: Create New PRD**
      No conflicts found. Safe to proceed with new feature.

   ⚠️ **OPTION 2: Extend Existing Feature**
      Similar functionality found at [path]. Consider extending instead.

   🔄 **OPTION 3: Refactor Existing Code**
      Duplication detected. Consider refactoring before adding new feature.

   ───────────────────────────────────────────────────

   **Next Step**: Review the analysis above and confirm your choice:
   - To proceed: Continue with PRD creation
   - To abort: Stop here and investigate findings
   ```

4. **User Decision Point**

   After presenting findings, ask user to confirm:
   ```markdown
   Based on the codebase analysis above, do you want to:

   1. ✅ Proceed with new PRD (no conflicts found)
   2. 🔍 Investigate existing implementations first
   3. ❌ Cancel PRD creation

   [Wait for user response before continuing]
   ```

#### Phase 1: PRD Existence Check

1. **Pre-check**: Verify PRD doesn't already exist
   ```bash
   if [ -f .claude/prds/<feature_name>.md ]; then
     echo "❌ PRD already exists: <feature_name>"
     echo "💡 Use --force to overwrite or edit: /pm:prd-edit <feature_name>"
     exit 1
   fi
   ```

#### Phase 2: Generate PRD Content

1. **Generate PRD Content**: Create a comprehensive PRD based on:
   - Feature name: `<feature_name>`
   - **Codebase analysis findings** from Phase 0 (existing implementations, dependencies, conflicts)
   - Project context (analyze existing codebase structure)
   - Technology stack (detect from package.json, requirements.txt, etc.)
   - Existing patterns (check similar features)
   - **Reusable components** identified in analysis
   - **Integration points** from dependency analysis

3. **PRD Structure**: Use this template:
   ```markdown
   ---
   title: <Title Case Feature Name>
   status: draft
   priority: <from --priority or P2>
   created: <current ISO timestamp>
   author: <from git config or "claude">
   timeline: <from --timeline or "TBD">
   ---

   # PRD: <feature_name>

   ## Executive Summary
   [Brief overview of the feature - 2-3 sentences]

   ## Codebase Analysis
   ### Existing Implementations
   [List any existing functionality found during pre-analysis]
   [If none: "✅ No existing implementations detected"]

   ### Reusable Components
   [List components that can be leveraged from existing codebase]
   [If none: "No directly reusable components found"]

   ### Integration Points
   [List systems this feature will interact with]
   - Database: [tables/models needed]
   - APIs: [endpoints affected]
   - External Services: [third-party integrations]
   - Internal Modules: [existing modules to use]

   ### Potential Conflicts
   [List any naming conflicts or duplicate logic concerns]
   [If none: "✅ No conflicts detected"]

   ## Problem Statement
   ### Background
   [Context and why this feature is needed]

   ### Current State
   [What exists today and its limitations]

   ### Desired State
   [What the solution will provide]

   ## Target Users
   [Who will use this feature]

   ### User Personas
   - **Primary Users**: [Main user segment]
   - **Secondary Users**: [Additional beneficiaries]

   ### User Stories
   - As a [user type], I want to [action], so that [benefit]
   - As a [user type], I want to [action], so that [benefit]

   ## Key Features
   ### Must Have (P0)
   - [ ] [Core feature 1]
   - [ ] [Core feature 2]

   ### Should Have (P1)
   - [ ] [Important feature 1]
   - [ ] [Important feature 2]

   ### Nice to Have (P2)
   - [ ] [Enhancement 1]
   - [ ] [Enhancement 2]

   ## Success Metrics
   ### Key Performance Indicators (KPIs)
   - **Adoption Rate**: [Target percentage]
   - **User Satisfaction**: [Target score]
   - **Performance**: [Response time targets]
   - **Quality**: [Error rate targets]

   ## Technical Requirements
   ### Architecture Considerations
   [System components affected, integration points, data flow]

   ### Non-Functional Requirements
   - **Performance**: [Specific targets]
   - **Scalability**: [Capacity requirements]
   - **Security**: [Auth/authorization requirements]
   - **Reliability**: [Uptime targets]

   ### Dependencies
   - [External services or APIs]
   - [Internal systems or components]
   - [Third-party libraries or tools]

   ## Implementation Plan
   ### Phase 1: Foundation
   - [ ] [Initial tasks]

   ### Phase 2: Core Features
   - [ ] [Main development]

   ### Phase 3: Enhancement
   - [ ] [Additional features]

   ### Phase 4: Release
   - [ ] [Final testing and deployment]

   ## Risks and Mitigation
   ### Technical Risks
   - **Risk 1**: [Description and mitigation]

   ### Business Risks
   - **Risk 1**: [Impact and contingency]

   ## Open Questions
   - [ ] [Question requiring clarification]
   - [ ] [Question needing stakeholder input]

   ## Appendix
   ### References
   - [Related documentation]

   ### Changelog
   - [timestamp]: Initial PRD created
   ```

4. **Write PRD File**:
   ```bash
   mkdir -p .claude/prds
   # Use Write tool to create .claude/prds/<feature_name>.md
   ```

5. **Confirm Success**: Show next steps

### Interactive Terminal Mode (`--interactive`)

**⚠️ WARNING**: This mode requires an interactive terminal and **will NOT work in Claude Code**.

Run `node .claude/scripts/pm/prd-new.js $ARGUMENTS` using the Bash tool and show me the complete output.

This will launch an interactive brainstorming session that will:
1. Prompt for product vision
2. Gather information about target users
3. Collect key features through interactive prompts
4. Define success metrics
5. Capture technical considerations
6. Generate a comprehensive PRD with proper frontmatter

The script handles all validation, creates the necessary directories, and saves the PRD to `.claude/prds/<feature_name>.md`.

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

## Output

After successful PRD creation, show:
```
✅ PRD created: .claude/prds/<feature_name>.md

📋 Next steps:
  1. Review: /pm:prd-show <feature_name>
  2. Edit:   /pm:prd-edit <feature_name>
  3. Parse:  /pm:prd-parse <feature_name>
```
