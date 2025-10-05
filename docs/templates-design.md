# Templates & Scaffolding System Design

**Feature**: Templates for PRD/Epic/Task creation
**Target**: v1.28.0 (Phase 3 Quick Win)
**Value Score**: 2.67 (Demand: 8, Effort: 3)

---

## 🎯 Goals

1. **Speed up creation** - Reduce time to create PRDs/Epics/Tasks by 70%
2. **Ensure consistency** - Standardized structure across team
3. **Lower barrier to entry** - New users can start quickly
4. **Extensibility** - Custom templates for specific domains

---

## 📁 Directory Structure

```
.claude/
├── templates/           # User's custom templates
│   ├── prds/
│   │   ├── api-feature.md
│   │   ├── ui-feature.md
│   │   ├── bug-fix.md
│   │   └── custom-*.md
│   ├── epics/
│   │   ├── sprint.md
│   │   └── release.md
│   └── tasks/
│       ├── development.md
│       ├── testing.md
│       └── documentation.md
│
autopm/.claude/templates/  # Built-in templates (framework)
├── prds/
│   ├── api-feature.md     # REST/GraphQL API
│   ├── ui-feature.md      # Frontend component
│   ├── bug-fix.md         # Bug resolution
│   ├── data-migration.md  # Database/data work
│   └── documentation.md   # Docs update
├── epics/
│   ├── sprint.md
│   └── release.md
└── tasks/
    ├── development.md
    ├── testing.md
    └── documentation.md
```

---

## 🔧 Template Format

### Frontmatter Variables

```yaml
---
# Auto-generated
id: {{id}}                    # Auto: prd-001, epic-002, task-003
created: {{timestamp}}        # Auto: ISO 8601
author: {{author}}            # Auto: $USER or git config

# User-provided (via CLI or prompts)
title: {{title}}              # Required
type: {{type}}                # prd/epic/task
status: {{status}}            # Default: draft/planning/todo
priority: {{priority}}        # Default: P2/medium

# Optional (template-specific)
{{custom_field}}              # Template can define custom fields
---
```

### Body Variables

```markdown
# {{title}}

## Problem
{{problem}}

## Solution
{{solution}}

## User Stories
{{#each user_stories}}
- As a {{role}}, I want to {{goal}}, so that {{benefit}}
{{/each}}

## Technical Notes
{{technical_notes}}
```

### Variable Types

1. **Auto-generated** - System provides
   - `{{id}}` - Sequential ID (prd-001)
   - `{{timestamp}}` - ISO 8601 datetime
   - `{{author}}` - From $USER or git config
   - `{{date}}` - YYYY-MM-DD

2. **Required** - User must provide
   - `{{title}}` - Feature/Epic/Task name
   - `{{type}}` - prd/epic/task

3. **Optional with defaults**
   - `{{status}}` - Default: draft/planning/todo
   - `{{priority}}` - Default: P2/medium
   - `{{timeline}}` - Default: TBD

4. **Template-specific** - Defined in template
   - `{{problem}}` - Problem statement
   - `{{solution}}` - Proposed solution
   - `{{api_endpoint}}` - For API templates
   - `{{component_name}}` - For UI templates

---

## 🚀 CLI Commands

### Create from Template

```bash
# PRD with template
autopm prd:new --template api-feature "User Authentication API"
autopm prd:new -t ui-feature "Dashboard Redesign"

# Epic with template
autopm epic:new --template sprint "Sprint 24"

# Task with template
autopm task:new --template development "Implement login endpoint"

# Interactive mode (prompts for template)
autopm prd:new "My Feature"
# Prompt: Which template? (api-feature, ui-feature, bug-fix, custom, none)
```

### List Templates

```bash
# List all available templates
autopm template:list

# Output:
# 📋 Available Templates
#
# PRD Templates:
#   • api-feature       - REST/GraphQL API development
#   • ui-feature        - Frontend component/page
#   • bug-fix          - Bug resolution workflow
#   • data-migration   - Database schema/data changes
#   • documentation    - Documentation updates
#   • custom-myteam    - [Custom] Team-specific template
#
# Epic Templates:
#   • sprint           - Sprint planning
#   • release          - Release epic
#
# Task Templates:
#   • development      - Development task
#   • testing          - Testing task
#   • documentation    - Documentation task
```

### Create Custom Template

```bash
# Create new custom template
autopm template:new prd custom-myteam

# Opens editor with base template
# Save to: .claude/templates/prds/custom-myteam.md
```

---

## 🧪 Template Rendering Engine

### Core Functions

```javascript
class TemplateEngine {
  constructor() {
    this.builtInDir = path.join(__dirname, '..', 'templates');
    this.userDir = path.join('.claude', 'templates');
  }

  /**
   * Find template by name
   * Priority: user templates > built-in templates
   */
  findTemplate(type, name) {
    const userPath = path.join(this.userDir, type, `${name}.md`);
    const builtInPath = path.join(this.builtInDir, type, `${name}.md`);

    if (fs.existsSync(userPath)) return userPath;
    if (fs.existsSync(builtInPath)) return builtInPath;
    return null;
  }

  /**
   * List all available templates
   */
  listTemplates(type) {
    const templates = [];

    // Built-in
    const builtInPath = path.join(this.builtInDir, type);
    if (fs.existsSync(builtInPath)) {
      templates.push(...fs.readdirSync(builtInPath)
        .filter(f => f.endsWith('.md'))
        .map(f => ({ name: f.replace('.md', ''), custom: false })));
    }

    // User custom
    const userPath = path.join(this.userDir, type);
    if (fs.existsSync(userPath)) {
      templates.push(...fs.readdirSync(userPath)
        .filter(f => f.endsWith('.md'))
        .map(f => ({ name: f.replace('.md', ''), custom: true })));
    }

    return templates;
  }

  /**
   * Render template with variables
   */
  render(templatePath, variables) {
    let content = fs.readFileSync(templatePath, 'utf8');

    // Auto-generate variables
    const autoVars = this.generateAutoVariables();
    const allVars = { ...autoVars, ...variables };

    // Simple string replacement (no external deps)
    for (const [key, value] of Object.entries(allVars)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      content = content.replace(regex, value || '');
    }

    // Handle conditionals {{#if var}}...{{/if}}
    content = this.processConditionals(content, allVars);

    // Handle loops {{#each items}}...{{/each}}
    content = this.processLoops(content, allVars);

    return content;
  }

  generateAutoVariables() {
    return {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      author: process.env.USER || process.env.USERNAME || 'unknown'
    };
  }

  generateId() {
    // Read existing files to determine next ID
    // prd-001, prd-002, etc.
  }

  processConditionals(content, vars) {
    // {{#if priority}}Priority: {{priority}}{{/if}}
    // Simple implementation without external deps
  }

  processLoops(content, vars) {
    // {{#each features}}
    // - {{this}}
    // {{/each}}
    // Simple implementation without external deps
  }

  /**
   * Validate template
   */
  validate(templatePath) {
    const content = fs.readFileSync(templatePath, 'utf8');
    const errors = [];

    // Check frontmatter
    if (!content.startsWith('---')) {
      errors.push('Missing frontmatter');
    }

    // Check required variables
    const requiredVars = ['id', 'title', 'type'];
    for (const varName of requiredVars) {
      if (!content.includes(`{{${varName}}}`)) {
        errors.push(`Missing required variable: {{${varName}}}`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
```

---

## 📝 Built-in Templates

### api-feature.md

```markdown
---
id: {{id}}
title: {{title}}
type: prd
status: draft
priority: {{priority}}
created: {{timestamp}}
author: {{author}}
timeline: {{timeline}}
---

# PRD: {{title}}

## Executive Summary

Design and implement {{title}} - a RESTful API endpoint for {{api_purpose}}.

## Problem Statement

### Background
{{problem}}

### API Requirements
- **Endpoint**: `{{http_method}} {{api_endpoint}}`
- **Authentication**: {{auth_method}}
- **Rate Limiting**: {{rate_limit}}

## User Stories

- As a **{{user_role}}**, I want to **{{api_action}}** so that **{{user_benefit}}**

## API Specification

### Request

**Method**: `{{http_method}}`
**Endpoint**: `{{api_endpoint}}`

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body** (JSON):
```json
{{request_body_example}}
```

### Response

**Success (200)**:
```json
{{response_body_example}}
```

**Error (4xx/5xx)**:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

## Technical Requirements

### Architecture
- **Service**: {{service_name}}
- **Database**: {{database_tables}}
- **Cache**: {{cache_strategy}}

### Security
- [ ] Authentication: {{auth_method}}
- [ ] Authorization: Role-based access control
- [ ] Input validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection

### Performance
- **Response Time**: < 200ms (p95)
- **Throughput**: {{requests_per_second}} req/s
- **Concurrent Users**: {{concurrent_users}}

## Testing Requirements

### Unit Tests
- [ ] Request validation
- [ ] Business logic
- [ ] Error handling
- [ ] Edge cases

### Integration Tests
- [ ] Database operations
- [ ] External API calls
- [ ] Cache operations

### E2E Tests
- [ ] Happy path
- [ ] Authentication flow
- [ ] Error scenarios

## Success Metrics

- **Adoption**: {{adoption_target}}% of users
- **Performance**: {{performance_target}}ms p95
- **Reliability**: {{uptime_target}}% uptime
- **Error Rate**: < {{error_rate_target}}%

## Implementation Plan

### Phase 1: Design (Week 1)
- [ ] API specification review
- [ ] Database schema design
- [ ] Security review

### Phase 2: Development (Week 2-3)
- [ ] Implement endpoint
- [ ] Write unit tests
- [ ] Code review

### Phase 3: Testing (Week 4)
- [ ] Integration testing
- [ ] Load testing
- [ ] Security testing

### Phase 4: Release (Week 5)
- [ ] Documentation
- [ ] Deployment
- [ ] Monitoring setup

---

*API PRD - Generated from template: api-feature*
```

### ui-feature.md

```markdown
---
id: {{id}}
title: {{title}}
type: prd
status: draft
priority: {{priority}}
created: {{timestamp}}
author: {{author}}
timeline: {{timeline}}
---

# PRD: {{title}}

## Executive Summary

Design and implement {{title}} - a {{component_type}} component for {{feature_purpose}}.

## Problem Statement

### Background
{{problem}}

### User Need
Users need to {{user_need}} in order to {{user_goal}}.

## User Stories

- As a **{{user_role}}**, I want to **{{user_action}}** so that **{{user_benefit}}**

## UI/UX Requirements

### Component Specifications
- **Type**: {{component_type}} (Page/Modal/Widget/Form)
- **Location**: {{component_location}}
- **Interaction**: {{interaction_pattern}}

### Wireframes
{{wireframe_link}}

### Design Mockups
{{design_link}}

### Accessibility
- [ ] WCAG 2.1 Level AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader support
- [ ] Color contrast ratio > 4.5:1
- [ ] Focus indicators

### Responsive Design
- [ ] Mobile (320px - 767px)
- [ ] Tablet (768px - 1023px)
- [ ] Desktop (1024px+)

## Technical Requirements

### Framework
- **Stack**: {{frontend_framework}} (React/Vue/Angular)
- **State Management**: {{state_management}}
- **Styling**: {{styling_approach}} (CSS-in-JS/Sass/Tailwind)

### Components
```
{{component_name}}/
├── index.jsx           # Main component
├── styles.module.css   # Component styles
├── hooks.js            # Custom hooks
├── utils.js            # Helper functions
└── __tests__/
    ├── index.test.jsx  # Unit tests
    └── integration.test.jsx
```

### API Integration
- **Endpoints**: {{api_endpoints}}
- **Loading States**: Skeleton/Spinner
- **Error Handling**: Toast/Banner notifications

### Performance
- **Initial Load**: < 1.5s
- **Interaction**: < 100ms
- **Bundle Size**: < 50KB (gzipped)

## Testing Requirements

### Unit Tests
- [ ] Component rendering
- [ ] User interactions
- [ ] State management
- [ ] Edge cases

### Integration Tests
- [ ] API integration
- [ ] Navigation flow
- [ ] Form submission

### E2E Tests
- [ ] User journey
- [ ] Cross-browser (Chrome, Firefox, Safari)
- [ ] Responsive design

## Success Metrics

- **Usability**: {{usability_score}} SUS score
- **Adoption**: {{adoption_target}}% usage
- **Performance**: {{performance_target}} Lighthouse score
- **Accessibility**: 100% WCAG AA compliance

## Implementation Plan

### Phase 1: Design (Week 1)
- [ ] UI/UX review
- [ ] Component architecture
- [ ] API contracts

### Phase 2: Development (Week 2-3)
- [ ] Implement component
- [ ] Write tests
- [ ] Accessibility audit

### Phase 3: Testing (Week 4)
- [ ] QA testing
- [ ] Usability testing
- [ ] Performance optimization

### Phase 4: Release (Week 5)
- [ ] Documentation
- [ ] Deployment
- [ ] User feedback collection

---

*UI PRD - Generated from template: ui-feature*
```

### bug-fix.md

```markdown
---
id: {{id}}
title: {{title}}
type: prd
status: draft
priority: {{priority}}
created: {{timestamp}}
author: {{author}}
timeline: {{timeline}}
---

# PRD: Bug Fix - {{title}}

## Bug Summary

**Issue**: {{bug_summary}}
**Severity**: {{severity}} (Critical/High/Medium/Low)
**Impact**: {{user_impact}}

## Reproduction Steps

1. {{step_1}}
2. {{step_2}}
3. {{step_3}}

**Expected**: {{expected_behavior}}
**Actual**: {{actual_behavior}}

## Root Cause Analysis

### Investigation
{{investigation_notes}}

### Root Cause
{{root_cause}}

### Affected Components
- {{component_1}}
- {{component_2}}

## Proposed Solution

### Approach
{{solution_approach}}

### Code Changes
{{code_changes_summary}}

### Testing Strategy
- [ ] Unit tests for fix
- [ ] Regression tests
- [ ] Manual verification

## Risk Assessment

### Impact of Fix
- **User Impact**: {{fix_impact}}
- **System Impact**: {{system_impact}}
- **Breaking Changes**: {{breaking_changes}}

### Rollback Plan
{{rollback_strategy}}

## Implementation Plan

### Immediate (Day 1)
- [ ] Implement fix
- [ ] Write tests
- [ ] Code review

### Short-term (Day 2-3)
- [ ] QA verification
- [ ] Deploy to staging
- [ ] Monitor metrics

### Follow-up (Week 1-2)
- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] User communication

## Success Metrics

- **Error Rate**: Reduced to < {{target_error_rate}}%
- **User Reports**: Zero new reports
- **Performance**: No regression

---

*Bug Fix PRD - Generated from template: bug-fix*
```

---

## 🧪 Testing Strategy

### Test Files

```
test/
├── templates/
│   ├── template-engine.test.js      # Engine tests
│   ├── template-rendering.test.js   # Rendering tests
│   ├── template-validation.test.js  # Validation tests
│   └── cli-integration.test.js      # CLI tests
```

### Test Cases

#### Template Engine Tests (20 tests)
1. ✅ Find built-in template
2. ✅ Find user custom template (overrides built-in)
3. ✅ Return null for non-existent template
4. ✅ List all templates
5. ✅ List only user templates
6. ✅ List only built-in templates
7. ✅ Generate auto variables (id, timestamp, author)
8. ✅ Render simple variable {{title}}
9. ✅ Render auto variables {{id}}, {{timestamp}}
10. ✅ Handle missing variables (empty string)
11. ✅ Process conditionals {{#if}}...{{/if}}
12. ✅ Process loops {{#each}}...{{/each}}
13. ✅ Validate template - valid
14. ✅ Validate template - missing frontmatter
15. ✅ Validate template - missing required variable
16. ✅ Generate sequential ID (prd-001, prd-002)
17. ✅ Generate ID for different types (epic-001, task-001)
18. ✅ Create template directory if not exists
19. ✅ Handle template read errors
20. ✅ Handle template write errors

#### CLI Integration Tests (15 tests)
21. ✅ `prd:new --template api-feature "My API"`
22. ✅ `prd:new -t ui-feature "My UI"`
23. ✅ `prd:new` (interactive, selects template)
24. ✅ `epic:new --template sprint "Sprint 24"`
25. ✅ `task:new --template development "My Task"`
26. ✅ `template:list` shows all templates
27. ✅ `template:new prd custom-myteam` creates template
28. ✅ `prd:new --template non-existent` shows error
29. ✅ User template overrides built-in
30. ✅ Variables populated correctly
31. ✅ Frontmatter generated correctly
32. ✅ File created in correct location
33. ✅ File not overwritten if exists
34. ✅ Dry-run mode (--dry-run)
35. ✅ Help text shows template options

**Total**: 35 tests

---

## 📦 Implementation Checklist

### Phase 1: Template Engine (Day 1-2)
- [ ] Create `lib/template-engine.js`
- [ ] Implement `findTemplate(type, name)`
- [ ] Implement `listTemplates(type)`
- [ ] Implement `render(templatePath, variables)`
- [ ] Implement `generateAutoVariables()`
- [ ] Implement `processConditionals()`
- [ ] Implement `processLoops()`
- [ ] Implement `validate(templatePath)`
- [ ] Write 20 engine tests (TDD)

### Phase 2: Built-in Templates (Day 3)
- [ ] Create `autopm/.claude/templates/prds/api-feature.md`
- [ ] Create `autopm/.claude/templates/prds/ui-feature.md`
- [ ] Create `autopm/.claude/templates/prds/bug-fix.md`
- [ ] Create `autopm/.claude/templates/prds/data-migration.md`
- [ ] Create `autopm/.claude/templates/prds/documentation.md`
- [ ] Validate all templates

### Phase 3: CLI Integration (Day 4-5)
- [ ] Update `pm-prd-new.js` to support `--template` flag
- [ ] Add interactive template selection
- [ ] Create `template-list.js` command
- [ ] Create `template-new.js` command
- [ ] Write 15 CLI integration tests
- [ ] Update help text and docs

### Phase 4: Documentation (Day 6)
- [ ] Update README.md with template examples
- [ ] Create `docs/templates-guide.md`
- [ ] Add template examples to repository
- [ ] Create video tutorial (optional)

### Phase 5: Testing & Release (Day 7)
- [ ] Run full test suite (205 + 35 = 240 tests)
- [ ] Manual testing of all templates
- [ ] Update CHANGELOG.md
- [ ] Create release PR
- [ ] Publish v1.28.0

---

## 📊 Success Metrics

### v1.28.0 Success Criteria
- ✅ 35+ new tests passing (240 total)
- ✅ 5+ built-in templates available
- ✅ Template rendering < 50ms
- ✅ Zero breaking changes
- ✅ Documentation complete
- ✅ User feedback positive

### User Impact
- **Time Saved**: 70% reduction in PRD creation time (30min → 9min)
- **Adoption**: 50%+ users use templates within 2 weeks
- **Quality**: Fewer missing sections in PRDs
- **Consistency**: Standard structure across team

---

## 🔄 Future Enhancements (v1.29.0+)

### Template Marketplace
- Community-contributed templates
- Template ratings and reviews
- Template discovery and search

### Advanced Features
- Template inheritance (extend base templates)
- Mustache/Handlebars syntax
- YAML variable files
- Template preview mode

### IDE Integration
- VSCode extension
- IntelliJ plugin
- Template snippets

---

**Status**: Design Complete ✅
**Next**: Implement Template Engine (TDD)
**Timeline**: 7 days to v1.28.0
