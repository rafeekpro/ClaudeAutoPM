# cloud:validate

Validate cloud infrastructure configuration and credentials across AWS, Azure, and GCP.

## Description

Performs comprehensive validation of cloud infrastructure setup including:
- Cloud provider credentials and authentication
- IAC configuration files (Terraform, CloudFormation, ARM templates)
- Resource naming conventions and tagging compliance
- Security best practices and compliance checks
- Cost optimization opportunities

## Required Documentation Access

**MANDATORY:** Before executing validation, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/aws/best-practices` - AWS Well-Architected Framework
- `mcp://context7/azure/best-practices` - Azure Cloud Adoption Framework
- `mcp://context7/gcp/best-practices` - Google Cloud Architecture Framework
- `mcp://context7/terraform/validation` - Terraform validation and testing patterns
- `mcp://context7/security/cloud-security` - Cloud security hardening guidelines

**Why This is Required:**
- Ensures validation follows cloud provider best practices
- Applies latest security recommendations
- Validates against current compliance standards
- Prevents misconfigurations and vulnerabilities

## Usage

```bash
/cloud:validate [options]
```

## Options

- `--provider <aws|azure|gcp|all>` - Cloud provider to validate (default: all)
- `--scope <credentials|config|security|cost|all>` - Validation scope (default: all)
- `--fix` - Attempt to fix issues automatically
- `--report <path>` - Generate validation report at specified path
- `--strict` - Fail on warnings (default: fail on errors only)

## Examples

### Validate All Cloud Providers
```bash
/cloud:validate
```

### Validate AWS Configuration Only
```bash
/cloud:validate --provider aws --scope config
```

### Validate with Auto-Fix
```bash
/cloud:validate --provider azure --fix
```

### Generate Security Validation Report
```bash
/cloud:validate --scope security --report ./security-audit.md
```

## Validation Checks

### Credentials
- ✅ AWS credentials in ~/.aws/credentials or environment
- ✅ Azure CLI authentication status
- ✅ GCP service account or user credentials
- ✅ Permission scope and access levels
- ✅ Credential rotation compliance

### Configuration
- ✅ Terraform/IaC syntax validation
- ✅ Provider version compatibility
- ✅ Backend configuration (state management)
- ✅ Variable definitions and defaults
- ✅ Module source verification

### Security
- ✅ Public exposure risks (S3 buckets, security groups)
- ✅ Encryption at rest and in transit
- ✅ IAM/RBAC policy compliance
- ✅ Network security (VPC, NSG, firewall rules)
- ✅ Secret management practices

### Cost Optimization
- ✅ Resource sizing recommendations
- ✅ Unused or underutilized resources
- ✅ Reserved instance opportunities
- ✅ Storage class optimization
- ✅ Network data transfer costs

## Implementation

This command uses specialized cloud agents to perform validation:

1. **@aws-cloud-architect** - AWS validation
2. **@azure-cloud-architect** - Azure validation
3. **@gcp-cloud-architect** - GCP validation
4. **@terraform-infrastructure-expert** - IaC validation

The command:
1. Queries Context7 for provider-specific best practices
2. Executes validation scripts for each provider
3. Aggregates results and generates reports
4. Optionally applies fixes for common issues
5. Provides actionable recommendations

## Exit Codes

- `0` - All validations passed
- `1` - Validation warnings found (fail with --strict)
- `2` - Validation errors found
- `3` - Critical security issues found
- `4` - Configuration errors prevent validation

## Output Format

### Console Output
```
☁️  Cloud Infrastructure Validation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AWS Validation
  ✅ Credentials: Valid (us-east-1)
  ✅ Configuration: 12 resources validated
  ⚠️  Security: 2 warnings (S3 bucket encryption)
  ✅ Cost: No optimization opportunities

Azure Validation
  ✅ Credentials: Valid (subscription: prod-001)
  ✅ Configuration: 8 resources validated
  ✅ Security: All checks passed
  💰 Cost: 3 optimization opportunities found

GCP Validation
  ✅ Credentials: Valid (project: my-project)
  ✅ Configuration: 15 resources validated
  ✅ Security: All checks passed
  ✅ Cost: No optimization opportunities

Summary
  Total Resources: 35
  ✅ Passed: 33
  ⚠️  Warnings: 2
  ❌ Errors: 0
  💰 Cost Savings: ~$120/month
```

### Report Output (Markdown)
Generates comprehensive markdown report with:
- Executive summary
- Detailed findings by provider
- Security compliance matrix
- Cost optimization recommendations
- Remediation steps with code examples

## Related Commands

- `/cloud:deploy` - Deploy validated infrastructure
- `/cloud:cost-analysis` - Detailed cost analysis
- `/cloud:security-scan` - Deep security scanning
- `/infra-deploy` - Infrastructure deployment

## Best Practices

1. **Run Before Deployment**: Always validate before deploying changes
2. **CI/CD Integration**: Include in pipeline for automated checks
3. **Regular Audits**: Schedule weekly validation runs
4. **Fix Warnings**: Address warnings before they become errors
5. **Document Exceptions**: Track validation exceptions with justification

## Troubleshooting

### Authentication Failures
- Verify cloud CLI installation (aws-cli, azure-cli, gcloud)
- Check credential files and environment variables
- Ensure proper permissions and access scopes

### Configuration Errors
- Run `terraform fmt` and `terraform validate`
- Check provider version compatibility
- Verify module sources and versions

### Performance Issues
- Use `--provider` flag to limit scope
- Run validations in parallel for large infrastructures
- Cache provider API responses when possible

## Version History

- v2.0.0 - Initial Schema v2.0 release with Context7 integration
