# Context7 Documentation Queries (Quick Reference)

<context7_usage>
<when>
ALWAYS query BEFORE implementing:
- New features
- Framework usage
- API integration
- Best practices
- Design patterns
</when>

<why>
Training data is stale|APIs change|Best practices evolve
Context7 provides CURRENT documentation
</why>
</context7_usage>

<query_format>
mcp://context7/[library-name]/[topic]

<examples>
mcp://context7/fastapi/authentication
mcp://context7/react/hooks
mcp://context7/postgresql/indexing
mcp://context7/kubernetes/deployments
mcp://context7/aws/lambda
</examples>
</query_format>

<common_queries>
<backend>
# Python
mcp://context7/fastapi/routing
mcp://context7/sqlalchemy/relationships
mcp://context7/pydantic/validation

# Node.js
mcp://context7/express/middleware
mcp://context7/nestjs/modules
mcp://context7/prisma/migrations
</backend>

<frontend>
# React
mcp://context7/react/state-management
mcp://context7/nextjs/routing
mcp://context7/tailwindcss/utilities

# Vue
mcp://context7/vue/composition-api
mcp://context7/nuxt/server-routes
</frontend>

<testing>
mcp://context7/jest/mocking
mcp://context7/pytest/fixtures
mcp://context7/playwright/selectors
mcp://context7/cypress/commands
</testing>

<cloud>
# AWS
mcp://context7/aws/ec2
mcp://context7/aws/s3
mcp://context7/cloudformation/resources

# Azure
mcp://context7/azure/app-service
mcp://context7/azure/functions
mcp://context7/bicep/modules

# GCP
mcp://context7/gcp/cloud-run
mcp://context7/gcp/cloud-functions
mcp://context7/terraform/gcp
</cloud>

<databases>
mcp://context7/postgresql/performance
mcp://context7/mongodb/aggregation
mcp://context7/redis/caching
mcp://context7/elasticsearch/queries
</databases>

<devops>
mcp://context7/docker/multi-stage
mcp://context7/kubernetes/helm
mcp://context7/github-actions/workflows
mcp://context7/terraform/modules
</devops>
</common_queries>

<workflow_integration>
<step1>Receive task</step1>
<step2>Query Context7 for relevant docs</step2>
<step3>Review documentation findings</step3>
<step4>Implement using current best practices</step4>
<step5>Verify against documentation</step5>
</workflow_integration>

<example>
Task: "Implement user authentication with JWT"

Queries:
1. mcp://context7/fastapi/security
2. mcp://context7/jwt/best-practices
3. mcp://context7/pydantic/validation
4. mcp://context7/sqlalchemy/user-models

Result: Current, secure implementation using latest patterns
</example>

<obligations>
✓ Query BEFORE implementing
✓ Never rely solely on training data
✓ Verify API signatures
✓ Check for deprecations
✓ Follow current patterns
</obligations>

<full_docs>.claude/rules/context7-enforcement.md</full_docs>
