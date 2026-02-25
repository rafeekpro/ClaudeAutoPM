# Creating Custom XML Templates

Guide to creating and customizing XML prompt templates for your specific needs.

## Why Create Custom Templates?

### Use Cases for Custom Templates

1. **Project-Specific Patterns**
   - Enforce project architecture
   - Standardize code structure
   - Implement team conventions

2. **Technology Stacks**
   - Framework-specific templates
   - Language-specific patterns
   - Library integration standards

3. **Workflow Requirements**
   - Company development process
   - Compliance requirements
   - Documentation standards

4. **Team Knowledge**
   - Capture best practices
   - Encode lessons learned
   - Share expertise

## Template Structure

### Minimum Required Elements

Every XML template must include:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
Template: template-name
Purpose: What this template does
Category: arch|dev|test|refactor|doc
-->

<prompt_workflow>
  <!-- Stage identification -->
  <stage>1-5</stage>
  <workflow_type>workflow_identifier</workflow_type>

  <!-- Core task definition -->
  <task>{{task}}</task>
  <context>{{context}}</context>

  <!-- Requirements specification -->
  <requirements>
    {{#each requirements}}
    <requirement>{{this}}</requirement>
    {{/each}}
  </requirements>

  <!-- Constraints section -->
  <constraints>
    <allowed_libraries>{{allowed_libraries}}</allowed_libraries>
    <forbidden_approaches>{{forbidden_approaches}}</forbidden_approaches>
    <complexity_limits>{{complexity_limits}}</complexity_limits>
    <integration_requirements>{{integration_requirements}}</integration_requirements>
  </constraints>

  <!-- Deliverables specification -->
  <deliverables>
    <deliverable>
      <name>Deliverable Name</name>
      <description>What it includes</description>
      <format>Output format</format>
      <required>YES|NO|Conditional</required>
    </deliverable>
  </deliverables>

  <!-- Thinking section -->
  <thinking>
    Instructions for AI reasoning before taking action.
    This should guide the AI through systematic analysis.
  </thinking>
</prompt_workflow>
```

## Creating Your First Template

### Step 1: Plan Your Template

Define:
- **Purpose:** What will this template generate?
- **Stage:** Which stage (1-5) does it belong to?
- **Category:** Which category (arch, dev, test, refactor, doc)?
- **Variables:** What inputs does it need?
- **Deliverables:** What should it output?

### Step 2: Create Template File

**Option A: Use Command (Interactive)**

```bash
/xml:template create my-template --category dev --stage 2
```

This will prompt you for:
- Template purpose
- Required variables
- Optional sections
- Quality checklist

**Option B: Create Manually**

```bash
# Create file in appropriate category
vim autopm/.claude/templates/xml-prompts/dev/my-template.xml
```

### Step 3: Define Template Content

Let's create a microservice template:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
Template: Microservice Template
Purpose: Generate microservice with standard structure
Category: dev
Stage: 2
-->

<prompt_workflow>
  <stage>2</stage>
  <workflow_type>microservice_creation</workflow_type>

  <task>{{task}}</task>

  <context>{{context}}</context>

  <requirements>
    {{#each requirements}}
    <requirement>{{this}}</requirement>
    {{/each}}
  </requirements>

  <constraints>
    <allowed_libraries>{{allowed_libraries}}</allowed_libraries>
    <forbidden_approaches>{{forbidden_approaches}}</forbidden_approaches>
    <complexity_limits>{{complexity_limits}}</complexity_limits>
    <integration_requirements>{{integration_requirements}}</integration_requirements>
  </constraints>

  <!-- Microservice-specific requirements -->
  <service_structure>
    <entry_point>src/index.js</entry_point>
    <routes>src/routes/</routes>
    <controllers>src/controllers/</controllers>
    <services>src/services/</services>
    <models>src/models/</models>
    <middleware>src/middleware/</middleware>
    <config>config/</config>
  </service_structure>

  <tdd_requirements>
    <test_first>REQUIRED</test_first>
    <test_framework>{{test_framework}}</test_framework>
    <coverage_minimum>{{coverage_minimum}}</coverage_minimum>
  </tdd_requirements>

  <deliverables>
    <deliverable>
      <name>Project Structure</name>
      <description>Complete directory structure</description>
      <format>Directories and files</format>
      <required>YES</required>
    </deliverable>
    <deliverable>
      <name>Entry Point</name>
      <description>Server initialization and startup</description>
      <format>JavaScript/TypeScript</format>
      <required>YES</required>
    </deliverable>
    <deliverable>
      <name>Routes</name>
      <description>API route definitions</description>
      <format>RESTful endpoints</format>
      <required>YES</required>
    </deliverable>
    <deliverable>
      <name>Controllers</name>
      <description>Request handlers</description>
      <format>JavaScript/TypeScript</format>
      <required>YES</required>
    </deliverable>
    <deliverable>
      <name>Services</name>
      <description>Business logic layer</description>
      <format>JavaScript/TypeScript</format>
      <required>YES</required>
    </deliverable>
    <deliverable>
      <name>Tests</name>
      <description>Comprehensive test suite</description>
      <format>Jest/Mocha tests</format>
      <required>YES</required>
    </deliverable>
    <deliverable>
      <name>Configuration</name>
      <description>Environment configuration</description>
      <format>config/default.yaml, config/production.yaml</format>
      <required>YES</required>
    </deliverable>
    <deliverable>
      <name>Dockerfile</name>
      <description>Container definition</description>
      <format>Dockerfile</format>
      <required>Conditional</required>
    </deliverable>
  </deliverables>

  <thinking>
    Before creating the microservice:

    1. UNDERSTAND THE REQUIREMENTS:
       - What is the microservice's purpose?
       - What APIs does it expose?
       - What data does it manage?
       - What services does it integrate with?

    2. DESIGN THE SERVICE STRUCTURE:
       - What are the main routes/endpoints?
       - How is business logic organized?
       - What is the data model?
       - How is configuration managed?

    3. PLAN TESTING STRATEGY:
       - What needs to be tested at each layer?
       - How to test API endpoints?
       - How to test business logic?
       - How to test integrations?

    4. CONSIDER INTEGRATIONS:
       - What databases are needed?
       - What external APIs are called?
       - How is authentication handled?
       - How are errors propagated?

    5. FOLLOW MICROSERVICE PATTERNS:
       - Single responsibility
       - API versioning
       - Health check endpoint
       - Graceful shutdown
       - Request logging
       - Error handling

    CRITICAL: Follow TDD strictly
    - Write tests BEFORE implementation
    - Implement MINIMAL code to pass
    - Refactor while tests pass
    - Never skip TDD phases
  </thinking>

  {{#if existing_code}}
  <existing_code>
    <description>Current implementation to extend</description>
    <content>{{existing_code}}</content>
  </existing_code>
  {{/if}}

  <quality_checklist>
    <check>Service structure follows conventions</check>
    <check>Entry point initializes all components</check>
    <check>Routes are RESTful</check>
    <check>Controllers handle requests only</check>
    <check>Business logic in services layer</check>
    <check>Data access in models layer</check>
    <check>Tests written first (TDD)</check>
    <check>All layers have tests</check>
    <check>Error handling implemented</check>
    <check>Configuration externalized</check>
    <check>Health check endpoint included</check>
    <check>Request logging configured</check>
    <check>No hardcoded values</check>
  </quality_checklist>
</prompt_workflow>
```

### Step 4: Validate Template

```bash
/xml:template validate my-template
```

Expected output:
```
✅ Template validation passed

Template: my-template
Stage: 2
Required tags: 11/11 present
Optional tags: 2/2 present

Constraints section: Valid
Deliverables section: Valid (8 deliverables)
Thinking section: Valid (850 chars)

No issues found
```

### Step 5: Test Template

```bash
/prompt:xml my-template \
  --task "Create inventory management microservice" \
  --context "E-commerce platform backend" \
  --requirement "REST API for CRUD operations" \
  --requirement "Support product search" \
  --requirement "Handle stock updates" \
  --allowed "Node.js, Express, MongoDB" \
  --forbidden "Direct database access in controllers, blocking operations" \
  --output test-output.xml
```

Review the generated XML to ensure it meets your expectations.

## Template Customization Patterns

### Pattern 1: Framework-Specific Templates

Create templates for specific frameworks:

```xml
<!-- FastAPI Template -->
<framework_requirements>
  <framework>FastAPI</framework>
  <python_version>3.9+</python_version>
  <structure>
    <main>main.py</main>
    <routes>app/routers/</routes>
    <models>app/models/</models>
    <schemas>app/schemas/</schemas>
    <dependencies>app/dependencies/</dependencies>
  </structure>
</framework_requirements>
```

### Pattern 2: Language-Specific Templates

Enforce language-specific patterns:

```xml
<!-- Python Template -->
<language_requirements>
  <language>Python</language>
  <style_guide>PEP 8</style_guide>
  <type_hints>REQUIRED</type_hints>
  <docstrings>Google style</docstrings>
  <testing>pytest with fixtures</testing>
</language_requirements>
```

### Pattern 3: Company Standards

Embed company conventions:

```xml
<!-- Company Template -->
<company_standards>
  <error_handling>Use CustomError classes</error_handling>
  <logging>Use structured logging (JSON)</logging>
  <authentication>OAuth2 with JWT</authentication>
  <api_versioning>URL path versioning (/v1/)</api_versioning>
  <documentation>OpenAPI 3.0 spec required</documentation>
</company_standards>
```

### Pattern 4: Domain-Specific Templates

Specialize for specific domains:

```xml
<!-- E-commerce Template -->
<domain_requirements>
  <entity>Product</entity>
  <operations>CRUD + Search + Inventory Management</operations>
  <integrations>
    <payment_gateway>Stripe</payment_gateway>
    <inventory_system>Custom ERP</inventory_system>
  </integrations>
  <compliance>
    <pci_dss>Level 1</pci_dss>
    <gdpr>Data retention policies</gdpr>
  </compliance>
</domain_requirements>
```

## Advanced Template Features

### Conditional Sections

Use `{{#if}}` for optional sections:

```xml
{{#if include_docker}}
<docker_requirements>
  <base_image>node:18-alpine</base_image>
  <multi_stage>YES</multi_stage>
  <health_check>REQUIRED</health_check>
</docker_requirements>
{{/if}}
```

Usage:
```bash
/prompt:xml my-template \
  --include-docker "true" \
  --task "..."
```

### Array Variables

Use `{{#each}}` for lists:

```xml
<api_versions>
  {{#each versions}}
  <version>{{this}}</version>
  {{/each}}
</api_versions>
```

Usage:
```bash
/prompt:xml my-template \
  --version "v1" \
  --version "v2" \
  --task "..."
```

### Nested Structures

Create complex deliverable hierarchies:

```xml
<deliverables>
  <deliverable_group>
    <name>Backend Services</name>
    <deliverables>
      <deliverable>
        <name>API Layer</name>
        <description>REST endpoints</description>
      </deliverable>
      <deliverable>
        <name>Business Logic</name>
        <description>Service classes</description>
      </deliverable>
      <deliverable>
        <name>Data Access</name>
        <description>Repository pattern</description>
      </deliverable>
    </deliverables>
  </deliverable_group>
</deliverables>
```

### Template Inheritance

Create base templates and extend:

```xml
<!-- Base template -->
<base_template>stage2-code-generation.xml</base_template>

<!-- Custom extensions -->
<custom_constraints>
  <!-- Additional constraints -->
</custom_constraints>
```

## Template Validation

### Automatic Validation

Templates are validated automatically when:
- Created via `/xml:template create`
- Imported via `/xml:template import`
- Validated explicitly via `/xml:template validate`

### Validation Checks

1. **Required Tags** - All mandatory tags present
2. **Tag Nesting** - Proper XML structure
3. **Variable Syntax** - Valid Handlebars syntax
4. **Deliverable Completeness** - Required fields present
5. **Thinking Section** - Sufficient depth (>200 chars)

### Common Validation Errors

**Error:** Missing required tag `<task>`

**Fix:** Add `<task>{{task}}</task>` to template

**Error:** Empty deliverable

**Fix:** Ensure all deliverables have name, description, format

**Error:** Thinking section too short

**Fix:** Expand thinking section with more detailed instructions

## Template Testing

### Unit Testing Templates

Test template with simple inputs:

```bash
/prompt:xml my-template \
  --task "Test simple feature" \
  --context "Testing template" \
  --requirement "Basic requirement" \
  --output test-simple.xml
```

### Integration Testing Templates

Test with realistic inputs:

```bash
/prompt:xml my-template \
  --task "Create user management service" \
  --context "Multi-tenant SaaS platform" \
  --requirement "User CRUD operations" \
  --requirement "Role-based access control" \
  --requirement "Audit logging" \
  --allowed "Node.js, Express, PostgreSQL" \
  --forbidden "Direct SQL queries, raw database access" \
  --complexity "Single responsibility per function" \
  --integration "Must use existing auth service" \
  --output test-realistic.xml
```

### Validation Testing

Always validate generated XML:

```bash
# Generate XML
/prompt:xml my-template --task "..." --context "..." --output test.xml

# Validate
cat test.xml | grep -q "<task>" && echo "✅ Has task" || echo "❌ Missing task"
cat test.xml | grep -q "<thinking>" && echo "✅ Has thinking" || echo "❌ Missing thinking"
```

## Template Maintenance

### Version Control

Track template changes:

```bash
git add autopm/.claude/templates/xml-prompts/dev/my-template.xml
git commit -m "Update microservice template with health check requirements"
```

### Documentation

Document template usage:

```xml
<!--
Template: Microservice Template
Version: 1.2.0
Last Updated: 2024-01-15
Author: Team Name

Usage:
  /prompt:xml microservice \
    --task "Create service" \
    --context "Background" \
    --allowed "Node.js, Express" \
    --forbidden "Global state"

Changes:
  v1.2.0 - Added health check requirements
  v1.1.0 - Added Docker support option
  v1.0.0 - Initial version
-->
```

### Team Review

Review templates with team:
1. Present template structure
2. Discuss deliverables
3. Validate constraints
4. Test with examples
5. Incorporate feedback
6. Version and release

## Template Repository

### Sharing Templates

**Export for sharing:**
```bash
/xml:template export my-template --output ~/shared-templates/
```

**Import shared template:**
```bash
/xml:template import ~/shared-templates/my-template.xml
```

### Template Marketplace (Future)

Consider:
- Public template repository
- Community contributions
- Template ratings and reviews
- Version compatibility tracking

## Troubleshooting

### Template Not Found

```bash
❌ Template not found: my-template

Solution:
1. List templates: /xml:template list
2. Check spelling
3. Use full path: dev/my-template
```

### Variables Not Substituting

```bash
⚠️ Found unsubstituted variables: {{custom_field}}

Solution:
1. Add field to command: --custom-field "value"
2. Or remove from template if not needed
3. Or provide default: {{custom_field|default}}
```

### Validation Fails

```bash
❌ Template validation failed

Solution:
1. Check required tags: /xml:template show my-template
2. Fix XML syntax errors
3. Ensure proper tag nesting
4. Validate thinking section length
```

## Best Practices

1. **Start Simple** - Begin with basic template, iterate
2. **Test Thoroughly** - Validate with various inputs
3. **Document Clearly** - Explain purpose and usage
4. **Version Control** - Track all changes
5. **Team Review** - Get feedback before use
6. **Maintain Regularly** - Update as needs evolve
7. **Share Knowledge** - Document learnings
8. **Reuse Patterns** - Copy from existing templates

## See Also

- **README:** `README.md` - Overview
- **Templates Guide:** `templates-guide.md` - Using templates
- **Best Practices:** `best-practices.md` - Advanced patterns
