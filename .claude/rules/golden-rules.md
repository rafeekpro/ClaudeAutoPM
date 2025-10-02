# 🏆 Golden Rules of Development

> **These are the fundamental truths that guide all development decisions.**

## The 12 Golden Rules

### 1. **If it's not tested, it's broken**

Every piece of code must have tests. No exceptions.

### 2. **If it's not documented, it doesn't exist**

Undocumented features are unknown features. Document as you build.

### 3. **If it's not in version control, it didn't happen**

All work must be committed. No local-only changes.

### 4. **If it's not monitored, it's not production-ready**

You can't fix what you can't see. Monitor everything.

### 5. **If it's not secure, it's not shippable**

Security is not optional. Every release must be secure.

### 6. **If it's not accessible, it's not complete**

Accessibility is a requirement, not a nice-to-have.

### 7. **If it's not performant, it's not acceptable**

Performance is a feature. Slow is broken.

### 8. **If it's not maintainable, it's technical debt**

Write code for the next developer (it might be you).

### 9. **If it's not reviewed, it's not ready**

All code needs a second pair of eyes. No solo commits to main.

### 10. **If it's not automated, it's not scalable**

Manual processes don't scale. Automate everything.

### 11. **If it's not responsive, it's not modern**

Mobile-first is not optional in 2024+.

### 12. **If it's not user-friendly, it's not finished**

User experience trumps developer convenience.

## Application of Golden Rules

### During Development

- Before writing code: Which rules apply?
- During implementation: Am I violating any rules?
- Before committing: Have I satisfied all rules?
- During review: Check against all 12 rules

### In Code Reviews

Use golden rules as review criteria:

```markdown
## Review Checklist
- [ ] Rule #1: Tests written and passing
- [ ] Rule #2: Documentation updated
- [ ] Rule #3: Changes committed properly
- [ ] Rule #4: Monitoring in place
- [ ] Rule #5: Security reviewed
- [ ] Rule #6: Accessibility verified
- [ ] Rule #7: Performance acceptable
- [ ] Rule #8: Code is maintainable
- [ ] Rule #9: Peer reviewed
- [ ] Rule #10: Automation added
- [ ] Rule #11: Responsive design
- [ ] Rule #12: UX considered
```

### In Architecture Decisions

Every architectural decision must:

1. Not violate any golden rule
2. Support multiple golden rules
3. Make following rules easier

## Rule Prioritization

When rules conflict (rare but possible):

### Priority 1: Safety & Security

- Rule #5 (Security)
- Rule #1 (Testing)

### Priority 2: User Impact

- Rule #12 (User-friendly)
- Rule #6 (Accessibility)
- Rule #7 (Performance)

### Priority 3: Sustainability

- Rule #8 (Maintainable)
- Rule #2 (Documentation)
- Rule #10 (Automation)

### Priority 4: Process

- Rule #3 (Version control)
- Rule #9 (Review)
- Rule #4 (Monitoring)
- Rule #11 (Responsive)

## Enforcement

### Automatic Checks

- CI/CD pipeline enforces rules #1, #3, #5, #7
- Linters enforce rule #8
- Accessibility tools enforce rule #6
- Design tools enforce rule #11

### Manual Verification

- Code review enforces rules #2, #9, #12
- Architecture review enforces rule #10
- Security review enforces rule #5
- UX review enforces rules #6, #11, #12

## Consequences of Violation

### Immediate Action Required

- **Rule #1 violation**: Block deployment
- **Rule #5 violation**: Security incident process
- **Rule #6 violation**: Accessibility fix required

### Fix in Current Sprint

- **Rule #2 violation**: Documentation debt ticket
- **Rule #7 violation**: Performance optimization ticket
- **Rule #8 violation**: Refactoring ticket

### Track and Improve

- **Rule #4 violation**: Add monitoring
- **Rule #10 violation**: Automation backlog
- **Rule #11 violation**: Responsive design update

## Quick Reference

```bash
# Before starting work
"What rules apply to this task?"

# During implementation
"Am I following all applicable rules?"

# Before committing
"Have I validated against all 12 rules?"

# During review
"Does this PR satisfy the golden rules?"

# In production
"Are we monitoring rule compliance?"
```

## Remember

**Excellence is not a skill, it's an attitude.**

These rules are not suggestions—they are the foundation of quality software. Every line of code is an opportunity to uphold these standards. When in doubt, refer to the rules. When facing a decision, let the rules guide you.

**Quality is everyone's responsibility.**
