# 🎯 Definition of Done (DoD)

> **A feature is not DONE until ALL criteria are met. No exceptions.**

## Universal DoD Checklist

A feature/task is **DONE** when:

### ✅ Code Quality

- [ ] Code complete and follows all coding standards
- [ ] No commented-out code or debug statements
- [ ] No hardcoded values (use config/env variables)
- [ ] DRY principle applied (no duplication)
- [ ] SOLID principles followed
- [ ] Error handling implemented
- [ ] Logging added for debugging

### 🧪 Testing

- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests written and passing
- [ ] E2E tests for critical paths
- [ ] Visual regression tests passing (UI changes)
- [ ] Performance tests passing
- [ ] Security tests passing
- [ ] All tests run in CI/CD

### 🎨 UI/UX (if applicable)

- [ ] Responsive design verified (mobile, tablet, desktop)
- [ ] Cross-browser testing completed
- [ ] Dark mode supported (if applicable)
- [ ] Loading states implemented
- [ ] Error states handled
- [ ] Empty states designed
- [ ] Animations smooth (<60fps)
- [ ] Screenshots captured for documentation

### ♿ Accessibility

- [ ] WCAG 2.1 AA compliance verified
- [ ] Keyboard navigation functional
- [ ] Screen reader tested
- [ ] Color contrast ratios met
- [ ] ARIA labels appropriate
- [ ] Focus indicators visible
- [ ] Alt text for images

### 🔒 Security

- [ ] Security scan completed (no critical/high vulnerabilities)
- [ ] Input validation implemented
- [ ] SQL injection prevention verified
- [ ] XSS protection in place
- [ ] Authentication/authorization correct
- [ ] Sensitive data encrypted
- [ ] No secrets in code

### ⚡ Performance

- [ ] Performance requirements met
- [ ] Database queries optimized
- [ ] Caching implemented where appropriate
- [ ] Bundle size within limits
- [ ] Memory leaks checked
- [ ] Load testing passed (if applicable)

### 📝 Documentation

- [ ] Code comments added where necessary
- [ ] README updated (if needed)
- [ ] API documentation updated
- [ ] CHANGELOG updated
- [ ] Architecture docs updated (if applicable)
- [ ] User documentation created (if needed)
- [ ] Inline JSDoc/docstrings complete

### 👥 Review & Collaboration

- [ ] Code reviewed and approved by peer
- [ ] Design reviewed (for UI changes)
- [ ] Product owner acceptance (if applicable)
- [ ] No unresolved comments in PR
- [ ] Branch conflicts resolved
- [ ] Commit messages follow convention

### 🚀 Deployment Readiness

- [ ] CI/CD pipeline passing (all checks green)
- [ ] Feature flags configured (if applicable)
- [ ] Database migrations ready and tested
- [ ] Rollback plan documented
- [ ] Monitoring/alerts configured
- [ ] Deployment notes written

### 🛠️ Technical Debt

- [ ] No new technical debt introduced
- [ ] Existing debt not increased
- [ ] Refactoring opportunities documented
- [ ] TODO comments have associated tickets

## DoD by Feature Type

### API Endpoint

```markdown
- [ ] OpenAPI/Swagger spec updated
- [ ] Request validation implemented
- [ ] Response format consistent
- [ ] Rate limiting configured
- [ ] Authentication required (if needed)
- [ ] Integration tests for all methods
- [ ] Error responses documented
- [ ] Performance < 200ms
```

### Database Change

```markdown
- [ ] Migration script created
- [ ] Rollback script created
- [ ] Migration tested on staging
- [ ] Indexes optimized
- [ ] Constraints defined
- [ ] Backup plan documented
- [ ] Data integrity verified
```

### UI Component

```markdown
- [ ] Storybook story created
- [ ] Props documented with types
- [ ] Default props defined
- [ ] Error boundaries implemented
- [ ] Accessibility audit passed
- [ ] Visual regression tests
- [ ] Theme variables used
- [ ] RTL support (if required)
```

### Bug Fix

```markdown
- [ ] Root cause identified
- [ ] Regression test written
- [ ] Fix verified in multiple scenarios
- [ ] Related code reviewed
- [ ] No side effects introduced
- [ ] Performance not degraded
```

### Infrastructure Change

```markdown
- [ ] Terraform/IaC updated
- [ ] Change tested in staging
- [ ] Rollback procedure documented
- [ ] Cost impact assessed
- [ ] Security review completed
- [ ] Monitoring updated
- [ ] Runbook updated
```

## DoD Verification Process

### Self-Check (Developer)

1. Review entire DoD checklist
2. Mark completed items
3. Document any exceptions with justification
4. Attach evidence (screenshots, test results)

### Peer Review

1. Verify developer's checklist
2. Spot-check critical items
3. Run tests locally
4. Review documentation updates

### Automated Verification

```yaml
# CI/CD Pipeline Checks
- Linting and formatting
- Unit test coverage
- Integration tests
- Security scanning
- Performance benchmarks
- Build success
- Docker image scan
```

### Final Verification (Team Lead/PO)

1. Acceptance criteria met
2. Business value delivered
3. No blockers for deployment
4. Stakeholder sign-off (if needed)

## Exceptions Process

### When Exceptions Are Allowed

- Emergency hotfixes (document debt)
- Proof of concepts (marked clearly)
- Experimental features (behind flags)

### Exception Requirements

1. Document reason for exception
2. Create follow-up ticket for completion
3. Get approval from team lead
4. Set deadline for resolution
5. Track in technical debt log

## DoD Evolution

### Quarterly Review

- Review DoD effectiveness
- Add new criteria based on incidents
- Remove outdated criteria
- Adjust based on team feedback

### Continuous Improvement

- Track DoD violations and patterns
- Automate more checks
- Simplify where possible
- Share learnings across teams

## Quick Reference Card

```bash
# Minimum DoD (cannot skip)
✓ Tests written and passing
✓ Code reviewed
✓ Documentation updated
✓ Security scan clean
✓ CI/CD passing

# Additional for UI
+ Responsive design
+ Accessibility verified
+ Visual tests passing

# Additional for API
+ API docs updated
+ Integration tests
+ Performance verified

# Additional for Database
+ Migration tested
+ Rollback ready
+ Backup verified
```

## Remember

**"Done" means DONE—not "mostly done" or "done except for..."**

The Definition of Done protects:

- **Users** from broken features
- **Team** from technical debt
- **Product** from quality issues
- **Company** from reputation damage

**Quality is not negotiable. Done is not debatable.**
