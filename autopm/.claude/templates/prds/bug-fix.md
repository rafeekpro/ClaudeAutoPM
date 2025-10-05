---
id: {{id}}
title: {{title}}
type: prd
status: draft
priority: {{priority}}
created: {{timestamp}}
author: {{author}}
timeline: {{timeline}}
severity: {{severity}}
---

# PRD: Bug Fix - {{title}}

## Bug Summary

**Issue ID**: {{bug_id}}
**Severity**: {{severity}} (Critical/High/Medium/Low)
**Impact**: {{user_impact}}
**Affected Users**: {{affected_users}}
**Environment**: {{environment}}

## Problem Description

### Observed Behavior
{{observed_behavior}}

### Expected Behavior
{{expected_behavior}}

### Reproduction Steps

1. {{step_1}}
2. {{step_2}}
3. {{step_3}}
{{#if additional_steps}}
{{#each additional_steps}}
{{this}}
{{/each}}
{{/if}}

### Environment Details
- **Browser/OS**: {{browser_os}}
- **Version**: {{app_version}}
- **User Role**: {{user_role}}
- **Data State**: {{data_state}}

### Error Messages/Logs
```
{{error_logs}}
```

### Screenshots/Videos
{{#if media_links}}
{{#each media_links}}
- {{this}}
{{/each}}
{{/if}}

## Impact Analysis

### User Impact
- **Affected Users**: {{affected_user_count}} ({{affected_percentage}}%)
- **User Segments**: {{user_segments}}
- **Business Impact**: {{business_impact}}
- **Revenue Impact**: {{revenue_impact}}

### System Impact
- **Components Affected**: {{affected_components}}
- **Services Down**: {{services_down}}
- **Data Integrity**: {{data_integrity_status}}
- **Performance Impact**: {{performance_impact}}

### Severity Classification

**Critical** (P0):
- System completely unusable
- Data loss or corruption
- Security breach
- Revenue impact > $10k/hour

**High** (P1):
- Major feature broken
- Significant user impact (>20%)
- Workaround exists but difficult
- Revenue impact $1k-10k/hour

**Medium** (P2):
- Feature degradation
- Moderate user impact (<20%)
- Easy workaround available
- Minimal revenue impact

**Low** (P3):
- Minor issue
- Cosmetic or edge case
- No workaround needed
- No revenue impact

## Root Cause Analysis (RCA)

### Investigation Timeline
| Time | Action | Finding |
|------|--------|---------|
| {{time_1}} | {{action_1}} | {{finding_1}} |
| {{time_2}} | {{action_2}} | {{finding_2}} |

### 5 Whys Analysis

**Problem**: {{problem_statement}}

1. **Why?** {{why_1}}
2. **Why?** {{why_2}}
3. **Why?** {{why_3}}
4. **Why?** {{why_4}}
5. **Why?** {{why_5}}

**Root Cause**: {{root_cause}}

### Affected Components

```
System Map:
{{system_map}}

Affected Areas:
{{#if affected_areas}}
{{#each affected_areas}}
- {{component}}: {{impact}}
{{/each}}
{{/if}}
```

### Root Cause Category
- [ ] Code defect (logic error, typo, missing validation)
- [ ] Configuration issue (environment, settings)
- [ ] Infrastructure problem (server, network, database)
- [ ] Third-party service failure (API, library)
- [ ] Data quality issue (corrupt data, missing data)
- [ ] Deployment error (rollout, migration)
- [ ] Security vulnerability
- [ ] Performance bottleneck
- [ ] Race condition / timing issue
- [ ] Integration failure

### Contributing Factors
{{#if contributing_factors}}
{{#each contributing_factors}}
- {{this}}
{{/each}}
{{/if}}

## Proposed Solution

### Fix Approach
{{solution_approach}}

### Technical Implementation

**Files to Modify**:
{{#if files_to_modify}}
{{#each files_to_modify}}
- `{{file}}`: {{change}}
{{/each}}
{{/if}}

**Code Changes Summary**:
```{{language}}
{{code_changes_summary}}
```

### Alternative Solutions Considered

| Solution | Pros | Cons | Selected |
|----------|------|------|----------|
| {{alt_solution_1}} | {{pros_1}} | {{cons_1}} | {{selected_1}} |
| {{alt_solution_2}} | {{pros_2}} | {{cons_2}} | {{selected_2}} |

## Testing Strategy (TDD)

### Reproduction Test (Red Phase)
- [ ] Write test that reproduces the bug
- [ ] Verify test fails with current code
- [ ] Document failing test case

### Fix Implementation (Green Phase)
- [ ] Implement minimal fix
- [ ] Verify reproduction test passes
- [ ] Ensure no new failures

### Regression Prevention (Refactor Phase)
- [ ] Add edge case tests
- [ ] Refactor code for clarity
- [ ] Update documentation

### Test Coverage

**Unit Tests**:
- [ ] Fix validation test
- [ ] Edge case coverage
- [ ] Error handling paths
- [ ] Mock external dependencies

**Integration Tests**:
- [ ] Component integration
- [ ] Database operations
- [ ] API contract verification
- [ ] State management

**E2E Tests**:
- [ ] User flow regression
- [ ] Cross-browser validation
- [ ] Performance verification
- [ ] Data integrity check

**Automated Regression Suite**:
- [ ] Add bug reproduction to CI/CD
- [ ] Update smoke tests
- [ ] Performance benchmarks
- [ ] Security scanning

## Risk Assessment

### Risks of Fix Implementation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Breaking changes | {{break_impact}} | {{break_prob}} | {{break_mitigation}} |
| Performance degradation | {{perf_impact}} | {{perf_prob}} | {{perf_mitigation}} |
| New bugs introduced | {{bug_impact}} | {{bug_prob}} | {{bug_mitigation}} |
| Data migration needed | {{data_impact}} | {{data_prob}} | {{data_mitigation}} |

### Risk Mitigation Strategies
{{#if risk_strategies}}
{{#each risk_strategies}}
- {{this}}
{{/each}}
{{/if}}

## Rollback Plan

### Rollback Triggers
- New error rate > {{rollback_error_threshold}}%
- Performance degradation > {{rollback_perf_threshold}}%
- User reports > {{rollback_user_threshold}}
- Data integrity issues detected
- Security vulnerability introduced

### Rollback Procedure

**Immediate Rollback** (< 5 minutes):
1. {{rollback_step_1}}
2. {{rollback_step_2}}
3. {{rollback_step_3}}

**Full Rollback** (< 30 minutes):
1. Revert deployment to previous version
2. Restore database from backup (if needed)
3. Clear caches and restart services
4. Notify stakeholders
5. Update status page

**Rollback Validation**:
- [ ] System functionality verified
- [ ] Error rates normalized
- [ ] User impact resolved
- [ ] Monitoring confirms stability

## Implementation Plan

### Immediate Actions (Hour 0-1)
- [ ] Implement hotfix
- [ ] Write reproduction test
- [ ] Local testing and validation
- [ ] Code review (expedited)
- [ ] Security scan

### Short-term (Hour 1-4)
- [ ] Deploy to staging
- [ ] QA validation
- [ ] Regression testing
- [ ] Performance testing
- [ ] Stakeholder approval

### Deployment (Hour 4-6)
- [ ] Production deployment (canary/blue-green)
- [ ] Monitor error rates
- [ ] Verify user reports
- [ ] Update status page
- [ ] Communication to users

### Follow-up (Day 1-7)
- [ ] Monitor metrics (24h)
- [ ] Complete RCA documentation
- [ ] Update runbooks
- [ ] Team retrospective
- [ ] Process improvements

## Monitoring & Verification

### Success Metrics
- **Error Rate**: Reduced from {{current_error_rate}}% to < {{target_error_rate}}%
- **User Reports**: Zero new reports within 24h
- **Performance**: No regression (< {{perf_threshold}}ms)
- **Availability**: {{uptime_target}}% uptime maintained

### Monitoring Dashboards
- [ ] Error tracking (Sentry/Rollbar)
- [ ] Application metrics (Datadog/New Relic)
- [ ] User analytics (GA4/Mixpanel)
- [ ] Server metrics (CPU, memory, disk)

### Alerts Configuration
- Error rate > {{alert_error_threshold}}%
- Response time > {{alert_latency_threshold}}ms
- Failed requests > {{alert_failure_threshold}}
- Anomaly detection triggers

## Prevention Strategies

### Immediate Prevention
- [ ] Add monitoring/alerting for this scenario
- [ ] Update validation rules
- [ ] Improve error handling
- [ ] Add circuit breakers

### Long-term Prevention
- [ ] Code review checklist update
- [ ] Add pre-deployment validation
- [ ] Improve testing coverage
- [ ] Update coding standards
- [ ] Team training session

### Process Improvements
{{#if process_improvements}}
{{#each process_improvements}}
- {{this}}
{{/each}}
{{/if}}

## Communication Plan

### Internal Communication
- **Engineering Team**: {{eng_communication}}
- **Product Team**: {{product_communication}}
- **Leadership**: {{leadership_communication}}
- **Support Team**: {{support_communication}}

### External Communication
{{#if external_communication_needed}}
- **Users Affected**: {{user_message}}
- **Status Page Update**: {{status_page_message}}
- **Social Media**: {{social_media_message}}
- **Support Channels**: {{support_message}}
{{/if}}

## Post-Mortem

### Timeline of Events
| Time | Event | Action Taken |
|------|-------|--------------|
| {{event_time_1}} | {{event_1}} | {{event_action_1}} |
| {{event_time_2}} | {{event_2}} | {{event_action_2}} |

### What Went Well
{{#if went_well}}
{{#each went_well}}
- {{this}}
{{/each}}
{{/if}}

### What Went Wrong
{{#if went_wrong}}
{{#each went_wrong}}
- {{this}}
{{/each}}
{{/if}}

### Lessons Learned
{{#if lessons_learned}}
{{#each lessons_learned}}
- {{this}}
{{/each}}
{{/if}}

### Action Items
| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| {{action_1}} | {{owner_1}} | {{due_1}} | {{status_1}} |
| {{action_2}} | {{owner_2}} | {{due_2}} | {{status_2}} |

## Appendix

### Related Issues
{{#if related_issues}}
{{#each related_issues}}
- {{issue_id}}: {{issue_title}}
{{/each}}
{{/if}}

### References
- [Root Cause Analysis Guide](https://asana.com/resources/root-cause-analysis)
- [5 Whys Technique](https://www.mindtools.com/pages/article/newTMC_5W.htm)
- [Incident Response Best Practices](https://www.atlassian.com/incident-management/postmortem)
- [Bug Fix Best Practices 2025](https://stackoverflow.blog/2023/12/28/best-practices-for-writing-code-comments/)

### Changelog
- {{timestamp}}: Initial bug fix PRD created by {{author}}

---

*Bug Fix PRD - Generated from template: bug-fix*
*Template follows 2025 best practices: 5 Whys RCA, TDD testing, comprehensive monitoring, prevention-focused*
