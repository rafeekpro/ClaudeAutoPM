---
allowed-tools: Task, Read, Write, Edit, MultiEdit, Bash, Glob, Grep
---

# Cloud Infrastructure Deployment

Deploys infrastructure to cloud providers using Terraform.

**Usage**: `/cloud:infra-deploy [--provider=aws|azure|gcp] [--env=dev|staging|prod] [--services=compute,storage,database]`

## Required Documentation Access

**MANDATORY:** Before deploying infrastructure, query Context7 for best practices:

**Documentation Queries:**
- `mcp://context7/infrastructure/deployment` - deployment best practices
- `mcp://context7/cloud/best-practices` - best practices best practices
- `mcp://context7/devops/automation` - automation best practices
- `mcp://context7/infrastructure/configuration` - configuration best practices

**Why This is Required:**
- Ensures adherence to current industry standards and best practices
- Prevents outdated or incorrect implementation patterns
- Provides access to latest framework/tool documentation
- Reduces errors from stale knowledge or assumptions


**Example**: `/cloud:infra-deploy --provider=aws --env=staging --services=eks,rds,s3`

**What this does**:
- Creates Terraform modules for selected cloud
- Configures provider and backend
- Sets up networking and security
- Deploys requested services
- Implements cost optimization
- Adds monitoring and alerting

Use the appropriate cloud architect agent (aws-cloud-architect, azure-cloud-architect, or gcp-cloud-architect) based on provider.