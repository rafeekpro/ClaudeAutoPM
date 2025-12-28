# 🔒 Security Checklist

> **Security is not optional. Every deployment must pass ALL security checks.**

## Pre-Deployment Security Checklist

### 🔑 Authentication & Authorization

- [ ] Multi-factor authentication available
- [ ] Password complexity requirements enforced
- [ ] Session management secure (timeout, invalidation)
- [ ] JWT tokens properly validated and not expired
- [ ] API keys rotated regularly
- [ ] OAuth implementation follows best practices
- [ ] Role-based access control (RBAC) implemented
- [ ] Principle of least privilege applied

### 🔐 Data Protection

- [ ] All sensitive data encrypted at rest (AES-256)
- [ ] All sensitive data encrypted in transit (TLS 1.2+)
- [ ] PII data identified and protected
- [ ] Database connections use SSL
- [ ] Secrets stored in secure vault (not in code)
- [ ] Environment variables for configuration
- [ ] No sensitive data in logs
- [ ] Data retention policies implemented

### 🛡️ Input Validation & Sanitization

- [ ] All user inputs validated on server-side
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (output encoding)
- [ ] XXE prevention (XML parsing secured)
- [ ] Command injection prevention
- [ ] Path traversal prevention
- [ ] File upload restrictions (type, size)
- [ ] CSRF tokens for state-changing operations

### 🌐 Network Security

- [ ] HTTPS enforced (HSTS enabled)
- [ ] Security headers configured:
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Referrer-Policy
  - [ ] Permissions-Policy
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] DDoS protection in place
- [ ] Firewall rules configured

### 📦 Dependencies & Supply Chain

- [ ] All dependencies scanned for vulnerabilities
- [ ] No critical or high vulnerabilities
- [ ] Dependencies up-to-date
- [ ] License compliance verified
- [ ] SBOM (Software Bill of Materials) generated
- [ ] Container images scanned
- [ ] Base images from trusted sources
- [ ] No unnecessary packages installed

### 🔍 Monitoring & Logging

- [ ] Security events logged
- [ ] Failed authentication attempts tracked
- [ ] Suspicious activity alerts configured
- [ ] Log integrity protected
- [ ] Sensitive data not logged
- [ ] Centralized logging implemented
- [ ] Log retention policy defined
- [ ] Incident response plan documented

### 🔧 API Security

- [ ] API authentication required
- [ ] API rate limiting per user/IP
- [ ] API versioning implemented
- [ ] GraphQL query depth limiting
- [ ] API documentation doesn't expose sensitive info
- [ ] Webhooks use signature verification
- [ ] API keys not exposed in client-side code

### 🐳 Container & Infrastructure

- [ ] Containers run as non-root user
- [ ] Read-only root filesystem
- [ ] Security policies (AppArmor/SELinux)
- [ ] Resource limits defined
- [ ] Network policies configured
- [ ] Secrets mounted securely
- [ ] Image signing enabled
- [ ] Vulnerability scanning in CI/CD

### 📱 Frontend Security

- [ ] No sensitive data in localStorage
- [ ] Secure cookie flags (HttpOnly, Secure, SameSite)
- [ ] Content Security Policy implemented
- [ ] Subresource Integrity (SRI) for CDN resources
- [ ] No inline scripts or styles
- [ ] API keys not exposed in source
- [ ] Service Worker scope limited

### 🧪 Testing & Validation

- [ ] Security unit tests written
- [ ] Penetration testing performed
- [ ] SAST (Static Analysis) passing
- [ ] DAST (Dynamic Analysis) passing
- [ ] Dependency check passing
- [ ] Security regression tests
- [ ] Fuzzing performed (if applicable)

## Security by Feature Type

### Database Operations

```sql
-- ✅ SECURE: Parameterized query
SELECT * FROM users WHERE id = $1;

-- ❌ INSECURE: String concatenation
SELECT * FROM users WHERE id = '${userId}';
```

### File Uploads

```javascript
// Security checks required:
- [ ] File type validation (whitelist)
- [ ] File size limits
- [ ] Filename sanitization
- [ ] Virus scanning
- [ ] Store outside web root
- [ ] Generate new filename
- [ ] Check magic numbers
```

### Password Handling

```javascript
// Requirements:
- [ ] Minimum 12 characters
- [ ] Complexity requirements
- [ ] Password history check
- [ ] Bcrypt/Argon2 hashing
- [ ] Salt rounds >= 10
- [ ] No password in logs
- [ ] Secure reset flow
```

### Session Management

```javascript
// Secure session configuration:
- [ ] Secure cookie flag
- [ ] HttpOnly flag
- [ ] SameSite attribute
- [ ] Session timeout
- [ ] Regenerate on login
- [ ] Invalidate on logout
- [ ] CSRF protection
```

## Incident Response Plan

### If Security Breach Detected

1. **Immediate Actions**
   - [ ] Isolate affected systems
   - [ ] Preserve evidence
   - [ ] Activate incident response team
   - [ ] Begin investigation

2. **Within 1 Hour**
   - [ ] Assess scope of breach
   - [ ] Implement containment measures
   - [ ] Notify security team
   - [ ] Start incident log

3. **Within 24 Hours**
   - [ ] Complete initial assessment
   - [ ] Implement fixes
   - [ ] Notify stakeholders (if required)
   - [ ] Prepare communication plan

4. **Post-Incident**
   - [ ] Complete investigation
   - [ ] Document lessons learned
   - [ ] Update security measures
   - [ ] Conduct security training

## Security Tools Integration

### Required in CI/CD

```yaml
# Security scanning pipeline
pipeline:
  - stage: security
    jobs:
      - sast:
          tool: [Semgrep/SonarQube]
      - dependency-check:
          tool: [Snyk/OWASP]
      - container-scan:
          tool: [Trivy/Clair]
      - secrets-scan:
          tool: [GitLeaks/TruffleHog]
```

### Development Environment

```bash
# Pre-commit hooks
- gitleaks (secret detection)
- bandit (Python security)
- npm audit (Node dependencies)
- safety (Python dependencies)
```

## Compliance Requirements

### GDPR (if applicable)

- [ ] Privacy policy updated
- [ ] Data processing agreements
- [ ] Right to erasure implemented
- [ ] Data portability available
- [ ] Consent mechanisms in place

### PCI DSS (if handling cards)

- [ ] Cardholder data encrypted
- [ ] Network segmentation
- [ ] Access controls implemented
- [ ] Regular security testing
- [ ] Compliance scanning

### HIPAA (if healthcare)

- [ ] PHI encryption
- [ ] Access controls
- [ ] Audit logging
- [ ] Business Associate Agreements

## Security Review Gates

### Before Code Review

- [ ] Self-assessment complete
- [ ] SAST scan clean
- [ ] No hardcoded secrets

### Before Merge

- [ ] Security review approved
- [ ] All security tests passing
- [ ] Dependencies checked

### Before Deployment

- [ ] Security checklist complete
- [ ] Penetration test passed (major releases)
- [ ] Security documentation updated

## Quick Security Reference

```bash
# NEVER DO THIS:
❌ Store passwords in plain text
❌ Commit secrets to git
❌ Trust user input
❌ Use HTTP for sensitive data
❌ Log sensitive information
❌ Ignore security warnings
❌ Deploy with known vulnerabilities

# ALWAYS DO THIS:
✅ Validate all inputs
✅ Encrypt sensitive data
✅ Use parameterized queries
✅ Implement rate limiting
✅ Keep dependencies updated
✅ Follow principle of least privilege
✅ Security test before deployment
```

## Security Contacts

```markdown
# Security Team
Email: security@company.com
Slack: #security-team

# Incident Response
Hotline: +1-XXX-XXX-XXXX
On-call: PagerDuty

# Bug Bounty
Program: hackerone.com/company
Email: security-bounty@company.com
```

## Remember

**Security is everyone's responsibility.**

- Developers: Write secure code
- Reviewers: Check for vulnerabilities
- DevOps: Secure infrastructure
- Product: Prioritize security fixes
- Users: Report security issues

**When in doubt, choose the more secure option.**
