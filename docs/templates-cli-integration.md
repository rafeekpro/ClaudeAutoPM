# Template System CLI Integration

**Version**: v1.28.0
**Status**: ✅ Completed
**Tests**: 260 passing (235 existing + 25 new)

## Overview

Integrated the template system with ClaudeAutoPM CLI commands, enabling users to create PRDs, Epics, and Tasks from pre-built or custom templates with interactive prompts.

## What Was Implemented

### 1. Updated `prd-new.js` Command

**File**: `/Users/rla/Projects/AUTOPM/autopm/.claude/scripts/pm/prd-new.js`

**New Features**:
- `--template` / `-t` flag support for template-based creation
- Interactive template selection when no template specified
- Template variable prompting
- Backwards compatible with traditional brainstorming mode

**Usage Examples**:

```bash
# Use template with flag
autopm prd:new --template api-feature "User Authentication API"
autopm prd:new -t ui-feature "Dashboard Redesign"

# Interactive template selection
autopm prd:new "My Feature"
# Prompts:
# 1. api-feature     - REST/GraphQL API development
# 2. ui-feature      - Frontend component/page
# 3. bug-fix         - Bug resolution workflow
# 4. data-migration  - Database schema changes
# 5. documentation   - Documentation updates
# 6. none            - Create empty PRD
# Select template (1-6): 1

# Traditional mode (backwards compatible)
autopm prd:new --template none "My Feature"
# OR
# Select "6. none" in interactive mode
```

**Template-Specific Prompts**:

When using a template, users are prompted for template-specific variables:

```bash
autopm prd:new -t api-feature "payment-api"

# Prompts:
# Title [Payment Api]: Payment Processing API
# Priority (P0/P1/P2/P3) [P2]: P0
# Timeline [TBD]: 4 weeks
# api purpose: processing payments
# problem: No payment integration exists
# business value: Enable e-commerce
# http method: POST
# api endpoint: /api/v1/payments
# auth method: OAuth 2.0
# ...
```

### 2. Created `template-list.js` Command

**File**: `/Users/rla/Projects/AUTOPM/autopm/.claude/scripts/pm/template-list.js`

**Features**:
- List all available templates
- Distinguish between built-in and custom templates
- Filter by type (prd, epic, task)
- Show template descriptions

**Usage Examples**:

```bash
# List all templates
autopm template:list

# Output:
# 📋 Available Templates
# ══════════════════════════════════════════════════════════
#
# Prds Templates:
#
# Built-in:
#   • api-feature        - REST/GraphQL API development
#   • ui-feature         - Frontend component/page
#   • bug-fix           - Bug resolution workflow
#   • data-migration    - Database schema changes
#   • documentation     - Documentation updates
#
# Custom:
#   • custom-team       - [Custom Template]
#
# ══════════════════════════════════════════════════════════
# Usage:
#   autopm prd:new --template <name> "<title>"
#   autopm prd:new -t api-feature "User Authentication API"

# List specific type
autopm template:list prd
autopm template:list epic
autopm template:list task
```

### 3. Created `template-new.js` Command

**File**: `/Users/rla/Projects/AUTOPM/autopm/.claude/scripts/pm/template-new.js`

**Features**:
- Create custom templates
- Base templates for PRD, Epic, Task types
- Auto-open in editor (code/nano/vim)
- Template validation after creation
- Helpful guidance for template syntax

**Usage Examples**:

```bash
# Create custom PRD template
autopm template:new prd my-team-template

# Output:
# 📝 Creating Custom Template
# ══════════════════════════════════════════════════════════
# ✅ Template created: .claude/templates/prds/my-team-template.md
#
# 📋 Template Structure:
#    - Frontmatter: Define metadata variables
#    - Variables: Use {{variable_name}} for substitution
#    - Conditionals: {{#if var}}...{{/if}}
#    - Loops: {{#each items}}...{{/each}}
#
# 🛠️  Next Steps:
#    1. Edit template: nano .claude/templates/prds/my-team-template.md
#    2. Add custom variables and sections
#    3. Test template: autopm prd:new --template my-team-template "Test"
#
# 📝 Opening in code...

# Create custom epic template
autopm template:new epic sprint-planning

# Create custom task template
autopm template:new task development-task
```

**Base Template Structure**:

Each base template includes:
- **Frontmatter**: id, title, type, status, priority, created, author, timeline
- **Auto-variables**: {{id}}, {{timestamp}}, {{date}}, {{author}}
- **Required variables**: {{title}}, type (can be literal)
- **Template-specific variables**: Customizable per use case
- **Conditionals**: `{{#if var}}...{{/if}}`
- **Loops**: `{{#each items}}...{{/each}}`

### 4. Comprehensive CLI Integration Tests

**File**: `/Users/rla/Projects/AUTOPM/test/templates/cli-integration.test.js`

**Test Coverage**: 25 tests across 4 categories

#### Test Categories:

**1. `prd:new` with `--template` flag (12 tests)**:
- ✅ Creates PRD from api-feature template
- ✅ Creates PRD from ui-feature template with short flag `-t`
- ✅ Shows error for non-existent template
- ✅ User custom template overrides built-in template
- ✅ Auto-generates id, timestamp, author variables
- ✅ Does not overwrite existing PRD file
- ✅ Handles template with conditionals `{{#if}}`
- ✅ Handles template with loops `{{#each}}`
- ✅ Validates template has required variables
- ✅ Validates template reports missing frontmatter
- ✅ Validates template reports missing required variables

**2. `template:list` command (3 tests)**:
- ✅ Lists all available PRD templates
- ✅ Distinguishes between built-in and custom templates
- ✅ Returns empty array for non-existent template type

**3. `template:new` command (2 tests)**:
- ✅ Creates new custom template file
- ✅ Creates template directory if not exists

**4. Integration scenarios (5 tests)**:
- ✅ Full workflow: create PRD from template, variables substituted
- ✅ Sequential ID generation works correctly
- ✅ Handles bug-fix template with specific fields
- ✅ Documentation template for docs updates
- ✅ Data-migration template for database changes

**5. Error handling (3 tests)**:
- ✅ Handles missing template file gracefully
- ✅ Handles template read errors
- ✅ Handles empty variables object
- ✅ Handles malformed template gracefully

## Technical Implementation

### Template Engine Integration

The CLI commands use the `TemplateEngine` class (`/Users/rla/Projects/AUTOPM/lib/template-engine.js`) with dynamic path resolution:

```javascript
// Dynamic path resolution for cross-environment compatibility
let TemplateEngine;
try {
  // Try relative path from autopm/.claude/scripts/pm/
  TemplateEngine = require(path.join(__dirname, '..', '..', '..', '..', 'lib', 'template-engine'));
} catch (err) {
  try {
    // Try from project root
    TemplateEngine = require(path.join(process.cwd(), 'lib', 'template-engine'));
  } catch (err2) {
    // Fallback to relative
    TemplateEngine = require('../../../lib/template-engine');
  }
}
```

This ensures the template engine works:
- In installed projects (via `npm install -g claude-autopm`)
- During development and testing
- From different working directories

### Backwards Compatibility

**CRITICAL**: All changes are fully backwards compatible.

**Traditional Mode Still Works**:
```bash
# Old workflow (still supported)
autopm prd:new "My Feature"
# Interactive brainstorming (no templates)
```

**Explicit Opt-Out**:
```bash
# Use traditional mode explicitly
autopm prd:new --template none "My Feature"
```

**No Breaking Changes**:
- All 235 existing tests still pass
- Traditional brainstorming workflow unchanged
- Existing PRDs not affected
- No changes to `prd-parse`, `epic-decompose`, etc.

## Test Results

```
Test Suites: 14 passed, 14 total
Tests:       260 passed, 260 total
Snapshots:   0 total
Time:        1.798 s
```

**Breakdown**:
- 235 existing tests: ✅ All passing (no regressions)
- 25 new template CLI tests: ✅ All passing
- **Total**: 260 tests passing

## File Changes Summary

### Modified Files (1):
1. `/Users/rla/Projects/AUTOPM/autopm/.claude/scripts/pm/prd-new.js`
   - Added template support
   - Added `--template` / `-t` flag
   - Added interactive template selection
   - Added template variable prompting
   - Maintained backwards compatibility

### Created Files (3):
1. `/Users/rla/Projects/AUTOPM/autopm/.claude/scripts/pm/template-list.js`
   - New command to list available templates
   - Shows built-in and custom templates
   - Filter by type

2. `/Users/rla/Projects/AUTOPM/autopm/.claude/scripts/pm/template-new.js`
   - New command to create custom templates
   - Base templates for PRD/Epic/Task
   - Auto-open in editor
   - Template validation

3. `/Users/rla/Projects/AUTOPM/test/templates/cli-integration.test.js`
   - 25 comprehensive integration tests
   - Covers all CLI scenarios
   - Error handling tests

### Total Lines of Code:
- **prd-new.js**: +247 lines (template support)
- **template-list.js**: +119 lines (new)
- **template-new.js**: +317 lines (new)
- **cli-integration.test.js**: +514 lines (new)
- **Total**: ~1,197 lines added

## Usage Workflows

### Workflow 1: Quick PRD from Template

```bash
# 1. List available templates
autopm template:list

# 2. Create PRD from template (with prompts)
autopm prd:new -t api-feature "payment-processing"

# 3. Fill in prompted variables
# Title [Payment Processing]: Payment Processing API
# Priority (P0/P1/P2/P3) [P2]: P0
# Timeline [TBD]: 4 weeks
# api purpose: processing payments
# ...

# 4. PRD created with all sections filled in
# File: .claude/prds/payment-processing.md
```

### Workflow 2: Create Custom Template

```bash
# 1. Create custom template
autopm template:new prd my-company-template

# 2. Edit template (opens in editor)
# Add company-specific sections and variables

# 3. Use custom template
autopm prd:new -t my-company-template "new-feature"

# 4. Custom template overrides built-in if same name
```

### Workflow 3: Interactive Mode

```bash
# 1. Start interactive creation
autopm prd:new

# 2. Enter name
# Enter PRD name (use-kebab-case): my-feature

# 3. Select template
# 📋 Available Templates:
# 1. api-feature       - REST/GraphQL API development
# 2. ui-feature        - Frontend component/page
# ...
# Select template (1-6): 2

# 4. Fill in prompts
# (Template-specific variable prompts)
```

### Workflow 4: Traditional Mode (Backwards Compatible)

```bash
# No template, use traditional brainstorming
autopm prd:new "my-feature"

# Select "none" when prompted for template
# OR
autopm prd:new --template none "my-feature"

# Traditional interactive brainstorming workflow
```

## Next Steps

### For Users:
1. Try creating a PRD with a template: `autopm prd:new -t api-feature "test-api"`
2. List available templates: `autopm template:list`
3. Create a custom template: `autopm template:new prd my-template`

### For Framework:
1. Add more built-in templates (epic, task templates)
2. Create template marketplace/sharing
3. Add template inheritance (extend base templates)
4. Add dry-run mode (`--dry-run` flag)

## Success Metrics

✅ **Implementation Complete**:
- All 4 tasks completed
- 260 tests passing
- Zero breaking changes
- Full backwards compatibility

✅ **Code Quality**:
- TDD approach followed
- Comprehensive test coverage
- Error handling implemented
- Documentation complete

✅ **User Experience**:
- Interactive template selection
- Helpful prompts and guidance
- Clear error messages
- Multiple usage workflows

## Conclusion

The template system CLI integration is **fully implemented and tested**. Users can now:

1. Create PRDs from templates with `--template` flag
2. Select templates interactively
3. List available templates with `template:list`
4. Create custom templates with `template:new`
5. Continue using traditional brainstorming mode (backwards compatible)

**All 260 tests passing. Zero regressions. Ready for v1.28.0 release.**
