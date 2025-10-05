# Built-in PRD Templates

**Version**: v1.28.0
**Total Templates**: 5
**Status**: Production Ready ✅

---

## 📋 Available Templates

### 1. API Feature (`api-feature.md`)
**Use for**: REST/GraphQL API development

**Best for**:
- Microservices endpoints
- Public APIs
- Internal service APIs
- Authentication systems

**Includes**:
- OpenAPI specification (contract-first)
- JWT authentication & security
- Performance benchmarks (< 100ms)
- Rate limiting & error handling
- Comprehensive testing (TDD)

**Example Variables**:
```yaml
title: "User Authentication API"
api_purpose: "user authentication"
http_method: "POST"
api_endpoint: "/api/auth/login"
auth_method: "JWT"
rate_limit: "100 req/min"
```

---

### 2. UI Feature (`ui-feature.md`)
**Use for**: Frontend components and pages

**Best for**:
- React/Vue/Angular components
- Dashboard pages
- Forms and modals
- Responsive layouts

**Includes**:
- WCAG 2.1 AA compliance (legal requirement 2025)
- Core Web Vitals (LCP, FID, CLS)
- Mobile-first responsive design
- Accessibility testing (screen readers)
- Lighthouse performance targets

**Example Variables**:
```yaml
title: "User Dashboard"
component_type: "Page"
platform: "Web"
frontend_framework: "React 18"
state_management: "Zustand"
styling_approach: "Tailwind CSS"
```

---

### 3. Bug Fix (`bug-fix.md`)
**Use for**: Bug resolution with root cause analysis

**Best for**:
- Critical production bugs
- Performance issues
- Data corruption fixes
- Security vulnerabilities

**Includes**:
- 5 Whys root cause analysis
- Severity classification (P0-P3)
- Impact analysis (users, revenue, system)
- Comprehensive rollback plan
- Post-mortem documentation

**Example Variables**:
```yaml
title: "Fix Login Timeout Issue"
severity: "High"
bug_id: "BUG-1234"
affected_users: "5,000 (20%)"
environment: "Production"
root_cause: "Database connection pool exhaustion"
```

---

### 4. Data Migration (`data-migration.md`)
**Use for**: Database schema changes and data migration

**Best for**:
- Database migrations
- Cloud migrations
- Data consolidation
- Schema refactoring

**Includes**:
- Data profiling & quality assessment
- Migration strategies (Big Bang, Trickle, Phased)
- Comprehensive validation (pre/post)
- Performance optimization
- Rollback procedures

**Example Variables**:
```yaml
title: "Migrate User Data to PostgreSQL"
migration_type: "Platform Migration"
source_system: "MySQL 5.7"
target_system: "PostgreSQL 15"
data_volume: "10M records"
estimated_duration: "4 hours"
```

---

### 5. Documentation (`documentation.md`)
**Use for**: Technical and user documentation

**Best for**:
- API documentation
- User guides
- Developer documentation
- Runbooks
- Tutorials

**Includes**:
- Documentation-as-Code approach
- WCAG 2.1 AA accessibility
- SEO optimization
- Analytics & measurement
- Localization (i18n) support

**Example Variables**:
```yaml
title: "API Reference Documentation"
doc_type: "API Documentation"
target_audience: "External Developers"
delivery_format: "Web (Docusaurus)"
platform: "GitHub Pages"
```

---

## 🚀 Quick Start

### Using a Template

```bash
# With autopm CLI (coming in v1.28.0)
autopm prd:new --template api-feature "User Authentication API"
autopm prd:new --template ui-feature "Dashboard Redesign"
autopm prd:new --template bug-fix "Fix Login Issue"
autopm prd:new --template data-migration "Migrate to PostgreSQL"
autopm prd:new --template documentation "API Reference"
```

### Manual Usage

1. Copy template file to your PRDs directory
2. Replace `{{variables}}` with actual values
3. Fill in optional sections as needed
4. Remove unused sections

---

## 🎯 Template Selection Guide

**Choose based on your feature type**:

| Feature Type | Template | Why |
|-------------|----------|-----|
| REST/GraphQL API | `api-feature` | OpenAPI spec, security, performance |
| Frontend UI | `ui-feature` | WCAG compliance, Core Web Vitals |
| Production Bug | `bug-fix` | RCA, rollback, post-mortem |
| Data Work | `data-migration` | Validation, rollback, compliance |
| Docs Update | `documentation` | Accessibility, SEO, analytics |

---

## 📝 Variable Reference

### Common Variables (All Templates)

**Auto-generated**:
- `{{id}}` - Sequential ID (prd-001, prd-002...)
- `{{timestamp}}` - ISO 8601 datetime
- `{{date}}` - YYYY-MM-DD
- `{{author}}` - From $USER or git config

**User-provided**:
- `{{title}}` - Feature/PRD title (required)
- `{{priority}}` - P0/P1/P2/P3 or Critical/High/Medium/Low
- `{{timeline}}` - Estimated timeline or "TBD"

### Template-Specific Variables

**api-feature.md**:
- `{{api_purpose}}`, `{{http_method}}`, `{{api_endpoint}}`
- `{{auth_method}}`, `{{rate_limit}}`
- `{{request_body_example}}`, `{{response_body_example}}`

**ui-feature.md**:
- `{{component_type}}`, `{{platform}}`, `{{frontend_framework}}`
- `{{wireframe_link}}`, `{{design_link}}`
- `{{lighthouse_target}}`, `{{usability_score}}`

**bug-fix.md**:
- `{{severity}}`, `{{bug_id}}`, `{{affected_users}}`
- `{{root_cause}}`, `{{solution_approach}}`
- `{{why_1}}` through `{{why_5}}` (5 Whys)

**data-migration.md**:
- `{{migration_type}}`, `{{source_system}}`, `{{target_system}}`
- `{{data_volume}}`, `{{migration_strategy}}`
- `{{source_schema}}`, `{{target_schema}}`

**documentation.md**:
- `{{doc_type}}`, `{{target_audience}}`, `{{delivery_format}}`
- `{{platform}}`, `{{content_sections}}`
- `{{reading_level}}`, `{{adoption_target}}`

---

## ✨ Features

### All Templates Include

✅ **2025 Best Practices**: Context7-verified industry standards
✅ **TDD Methodology**: Red-Green-Refactor testing approach
✅ **SMART Goals**: Specific, Measurable, Achievable, Relevant, Time-bound
✅ **INVEST User Stories**: Independent, Negotiable, Valuable, Estimable, Small, Testable
✅ **Risk Assessment**: Comprehensive risk analysis and mitigation
✅ **Rollback Plans**: Detailed rollback procedures and triggers
✅ **Monitoring**: Metrics, alerts, and observability
✅ **Communication Plans**: Internal and external stakeholder communication

### Special Features by Template

**API Feature**:
- OpenAPI/Swagger specification
- OWASP security compliance
- Performance targets (p50, p95, p99)

**UI Feature**:
- WCAG 2.1 AA compliance (legal requirement)
- Core Web Vitals optimization
- Cross-browser testing matrix

**Bug Fix**:
- 5 Whys root cause analysis
- Post-mortem documentation
- Prevention strategies

**Data Migration**:
- Multiple migration strategies
- Data quality assessment
- Compliance & security

**Documentation**:
- Documentation-as-Code
- SEO optimization
- Analytics tracking

---

## 📚 References

### Best Practices Sources
- [PRD Best Practices 2025](https://productschool.com/blog/product-strategy/product-template-requirements-document-prd)
- [INVEST Criteria](https://ones.com/blog/invest-criteria-scrum-user-stories-guide/)
- [REST API Design](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design)
- [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)
- [Root Cause Analysis](https://asana.com/resources/root-cause-analysis-template)

### Technical Standards
- [OpenAPI Specification](https://swagger.io/specification/)
- [Core Web Vitals](https://web.dev/vitals/)
- [TDD Methodology](https://martinfowler.com/bliki/TestDrivenDevelopment.html)
- [SMART Goals](https://www.atlassian.com/blog/productivity/how-to-write-smart-goals)

---

## 🔄 Customization

### Creating Custom Templates

1. **Copy an existing template** as starting point
2. **Modify sections** to match your needs
3. **Add/remove variables** as required
4. **Save to** `.claude/templates/prds/custom-name.md`
5. **User templates override** built-in templates

### Template Inheritance

Templates support:
- `{{#if variable}}...{{/if}}` - Conditional sections
- `{{#each items}}...{{/each}}` - Loops
- Nested variables and logic

---

## 📊 Template Statistics

| Template | Lines | Size | Variables | Complexity |
|----------|-------|------|-----------|------------|
| api-feature.md | 306 | 7.4KB | ~45 | Medium |
| ui-feature.md | 365 | 10KB | ~60 | High |
| bug-fix.md | 413 | 9.5KB | ~70 | High |
| data-migration.md | 483 | 12KB | ~80 | High |
| documentation.md | 439 | 11KB | ~75 | High |

**Total**: 2,006 lines across 5 templates

---

## 🆘 Support

**Documentation**: See `docs/templates-design.md` for detailed design
**Implementation**: See `docs/template-engine-implementation.md` for technical details
**Examples**: See `docs/built-in-templates-summary.md` for comprehensive overview

**Issues**: Report template issues to the ClaudeAutoPM repository

---

*Built-in PRD Templates - v1.28.0*
*Context7-verified 2025 best practices*
