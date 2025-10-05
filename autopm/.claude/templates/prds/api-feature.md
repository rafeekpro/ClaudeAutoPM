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

**API Endpoint**: `{{http_method}} {{api_endpoint}}`

## Problem Statement

### Background
{{problem}}

### Business Value
{{business_value}}

### API Requirements
- **Endpoint**: `{{http_method}} {{api_endpoint}}`
- **Authentication**: {{auth_method}}
- **Rate Limiting**: {{rate_limit}}
- **Performance**: < 100ms (internal) / < 1s (complex)

## User Stories

Following INVEST criteria (Independent, Negotiable, Valuable, Estimable, Small, Testable):

- As a **{{user_role}}**, I want to **{{api_action}}** so that **{{user_benefit}}**

{{#if additional_stories}}
{{#each additional_stories}}
- As a **{{role}}**, I want to **{{action}}** so that **{{benefit}}**
{{/each}}
{{/if}}

## API Specification

### OpenAPI Contract (Design-First Approach)

**Method**: `{{http_method}}`
**Endpoint**: `{{api_endpoint}}`
**Content-Type**: `application/json`

### Request

**Headers**:
```
Authorization: Bearer <token>
Content-Type: application/json
{{#if custom_headers}}{{custom_headers}}{{/if}}
```

**Body** (JSON):
```json
{{request_body_example}}
```

**Validation Rules**:
{{#if validation_rules}}
{{#each validation_rules}}
- {{field}}: {{rule}}
{{/each}}
{{/if}}

### Response

**Success (200 OK)**:
```json
{{response_body_example}}
```

**Created (201)**:
```json
{
  "id": "{{resource_id}}",
  "message": "Resource created successfully",
  "data": {{response_body_example}}
}
```

**Error Responses**:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": [
      {
        "field": "field_name",
        "message": "Specific error"
      }
    ]
  }
}
```

**Status Codes**:
- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid auth
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Temporary unavailability

## Technical Requirements

### Architecture
- **Service**: {{service_name}}
- **Database**: {{database_tables}}
- **Cache**: {{cache_strategy}}
- **Message Queue**: {{queue_system}}

### Security (2025 Best Practices)
- [ ] **Authentication**: JWT (JSON Web Tokens) with refresh tokens
- [ ] **Authorization**: Role-based access control (RBAC)
- [ ] **Input Validation**: Whitelist approach, sanitize all inputs
- [ ] **SQL Injection Prevention**: Parameterized queries only
- [ ] **XSS Prevention**: Content-Type headers, output encoding
- [ ] **CSRF Protection**: Token-based validation
- [ ] **HTTPS/TLS**: SSL/TLS 1.3 minimum
- [ ] **API Keys**: Encrypted storage, rotation policy
- [ ] **Rate Limiting**: Per-user and per-IP limits

### Performance Targets
- **Response Time**: < 100ms (p50), < 200ms (p95), < 1s (p99)
- **Throughput**: {{requests_per_second}} req/s
- **Concurrent Users**: {{concurrent_users}}
- **Availability**: 99.9% uptime (SLA)
- **Error Rate**: < 0.1%

### Data Model
```
{{database_schema}}
```

### Dependencies
- [ ] External APIs: {{external_apis}}
- [ ] Internal Services: {{internal_services}}
- [ ] Third-party Libraries: {{libraries}}

## Testing Requirements

### Unit Tests (TDD - Red-Green-Refactor)
- [ ] Request validation (all fields)
- [ ] Business logic (core functionality)
- [ ] Error handling (all error cases)
- [ ] Edge cases (boundary conditions)
- [ ] Mock external dependencies

### Integration Tests
- [ ] Database operations (CRUD)
- [ ] External API calls
- [ ] Cache operations
- [ ] Message queue integration
- [ ] Authentication flow

### E2E Tests
- [ ] Happy path (complete flow)
- [ ] Authentication/Authorization
- [ ] Error scenarios
- [ ] Rate limiting
- [ ] Load testing ({{load_test_target}} concurrent users)

### Security Tests
- [ ] Penetration testing
- [ ] OWASP Top 10 validation
- [ ] Authentication bypass attempts
- [ ] SQL injection tests
- [ ] XSS vulnerability scanning

## Success Metrics (SMART Goals)

- **Adoption**: {{adoption_target}}% of users within {{adoption_timeframe}}
- **Performance**: {{performance_target}}ms p95 response time
- **Reliability**: {{uptime_target}}% uptime
- **Error Rate**: < {{error_rate_target}}%
- **User Satisfaction**: {{satisfaction_target}} NPS score

## API Documentation

### Interactive Documentation
- [ ] OpenAPI/Swagger UI
- [ ] Postman Collection
- [ ] Code examples (cURL, JavaScript, Python)
- [ ] Authentication guide
- [ ] Rate limiting documentation

### Developer Experience
- [ ] SDK availability (if applicable)
- [ ] Versioning strategy (semantic versioning)
- [ ] Deprecation policy
- [ ] Migration guides

## Implementation Plan

### Phase 1: Design & Setup (Week 1)
- [ ] OpenAPI specification finalized
- [ ] Database schema design
- [ ] Security review and approval
- [ ] Development environment setup

### Phase 2: Core Development (Week 2-3)
- [ ] Write failing tests (TDD Red phase)
- [ ] Implement endpoint logic (Green phase)
- [ ] Refactor and optimize (Refactor phase)
- [ ] Code review and approval
- [ ] Security scanning

### Phase 3: Testing (Week 4)
- [ ] Integration testing
- [ ] Load testing ({{load_test_target}} req/s)
- [ ] Security testing (OWASP)
- [ ] Performance optimization
- [ ] Documentation review

### Phase 4: Release (Week 5)
- [ ] Staging deployment
- [ ] Final QA validation
- [ ] Production deployment
- [ ] Monitoring setup (metrics, alerts)
- [ ] Post-release verification

## Monitoring & Observability

### Metrics to Track
- Request rate (req/s)
- Response time (p50, p95, p99)
- Error rate (%)
- Active users
- Cache hit rate

### Logging
- Request/response logging
- Error tracking (stack traces)
- Audit logs (authentication/authorization)
- Performance profiling

### Alerts
- Error rate > {{error_threshold}}%
- Response time > {{latency_threshold}}ms
- Availability < {{availability_threshold}}%
- Rate limit violations

## Rollback Plan

### Rollback Triggers
- Error rate > {{rollback_error_threshold}}%
- Critical security vulnerability discovered
- Data corruption detected
- Performance degradation > {{rollback_perf_threshold}}%

### Rollback Procedure
1. {{rollback_step_1}}
2. {{rollback_step_2}}
3. {{rollback_step_3}}
4. Notify stakeholders
5. Post-mortem analysis

## Risks and Mitigation

### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| {{risk_1}} | {{impact_1}} | {{prob_1}} | {{mitigation_1}} |
| {{risk_2}} | {{impact_2}} | {{prob_2}} | {{mitigation_2}} |

### Business Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| {{business_risk_1}} | {{b_impact_1}} | {{b_prob_1}} | {{b_mitigation_1}} |

## Open Questions

- [ ] {{question_1}}
- [ ] {{question_2}}
- [ ] {{question_3}}

## Appendix

### References
- [OpenAPI Specification](https://swagger.io/specification/)
- [REST API Best Practices 2025](https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/)
- [JWT Authentication](https://jwt.io/introduction)
- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)

### Changelog
- {{timestamp}}: Initial PRD created by {{author}}

---

*API Feature PRD - Generated from template: api-feature*
*Template follows 2025 best practices: OpenAPI contract-first, JWT auth, WCAG compliance, TDD methodology*
