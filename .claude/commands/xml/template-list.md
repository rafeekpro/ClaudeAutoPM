<!--
Command: XML Template List
Purpose: List all available XML prompt templates
-->

# /xml:template list

List all available XML prompt templates in the framework.

## Usage

```bash
/xml:template list
```

## Required Documentation Access

**Documentation Queries:**
- `mcp://context7/xml/templating` - XML template structure and syntax
- `mcp://context7/file-system/navigation` - Directory traversal patterns

**Why This is Required:**
- Ensures proper XML template discovery and listing
- Validates template metadata extraction
- Follows file system best practices

## Quick Check

1. Read `.claude/lib/xml-prompt-builder.js` for template listing logic
2. Scan `.claude/templates/xml-prompts/` directory for templates
3. Extract metadata from each template
4. Display organized list by category

## Output Format

```
Available XML Prompt Templates:

📁 Architecture (arch/)
  ✦ stage1-architectural-planning.xml
    Stage: 1 | Type: architectural_planning
    Purpose: Design system architecture before implementation

  ✦ prd-to-epic.xml
    Stage: 1 | Type: prd_to_epic_decomposition
    Purpose: Convert Product Requirements Document to technical epic

📁 Development (dev/)
  ✦ stage2-code-generation.xml
    Stage: 2 | Type: code_generation
    Purpose: Generate implementation code with TDD

  ✦ api-endpoint.xml
    Stage: 2 | Type: api_endpoint_creation
    Purpose: Generate REST API endpoint with full TDD

  ✦ stage2-infrastructure-implementation.xml
    Stage: 2 | Type: infrastructure_implementation
    Purpose: Implement infrastructure code (Docker, K8s, Terraform)

  ✦ stage3-infrastructure-validation.xml
    Stage: 3 | Type: infrastructure_validation
    Purpose: Create comprehensive validation tests for infrastructure

📁 Testing (test/)
  ✦ stage3-test-creation.xml
    Stage: 3 | Type: test_creation
    Purpose: Generate comprehensive test suites

📁 Refactoring (refactor/)
  ✦ stage4-refactoring.xml
    Stage: 4 | Type: refactoring
    Purpose: Improve code structure while maintaining functionality

📁 Documentation (doc/)
  ✦ stage5-documentation.xml
    Stage: 5 | Type: documentation
    Purpose: Generate comprehensive documentation

Total: 8 templates across 5 categories

Usage:
  const XMLPromptBuilder = require('.claude/lib/xml-prompt-builder');
  const builder = new XMLPromptBuilder();
  const prompt = builder.build('dev/stage2-code-generation.xml', variables);
```

## Implementation

Use xml-prompt-builder.js to list templates:

```javascript
const XMLPromptBuilder = require('../../lib/xml-prompt-builder');

const builder = new XMLPromptBuilder();
const templates = builder.listTemplates();

// Group by category
const byCategory = templates.reduce((acc, template) => {
  if (!acc[template.category]) acc[template.category] = [];
  acc[template.category].push(template);
  return acc;
}, {});

// Display organized list
for (const [category, temps] of Object.entries(byCategory)) {
  console.log(`\n📁 ${category}/`);
  temps.forEach(t => {
    const meta = builder.getTemplateMetadata(t.path);
    console.log(`  ✦ ${t.name}`);
    console.log(`    Stage: ${meta.stage} | Type: ${meta.workflowType}`);
    if (meta.purpose) {
      console.log(`    Purpose: ${meta.purpose}`);
    }
  });
}
```

## Success

✅ Template listing complete
  - 8 templates found
  - Organized by category
  - Metadata extracted
Next: Use /xml:template new to create custom templates, see TEMPLATE_REGISTRY.md for details
