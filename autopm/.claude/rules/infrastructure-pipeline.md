# Infrastructure Operations Pipeline

> **CRITICAL**: Infrastructure changes require strict validation and rollback capabilities.

## 1. TERRAFORM DEPLOYMENT PIPELINE

**Trigger**: Infrastructure as Code changes
**Sequence**:

```
1. terraform-infrastructure-expert → Validate configuration
2. Run terraform plan and review changes
3. Write infrastructure tests (Terratest)
4. Apply to staging environment first
5. test-runner → Verify infrastructure health
6. Document changes in CHANGELOG
7. Apply to production with approval
```

## 2. CONTAINER BUILD PIPELINE

**Trigger**: Dockerfile or container changes
**Sequence**:

```
1. docker-containerization-expert → Optimize Dockerfile
2. Security scan with Trivy/Snyk
3. Build multi-stage image
4. test-runner → Test container functionality
5. Push to registry with proper tags
6. Never push unscanned images
```

## 3. KUBERNETES DEPLOYMENT PIPELINE

**Trigger**: K8s manifest or Helm chart changes
**Sequence**:

```
1. kubernetes-orchestrator → Validate manifests
2. Dry-run deployment
3. Apply to dev/staging cluster
4. test-runner → Verify pod health
5. Monitor resource usage
6. Rollout to production with canary
```

## 4. CLOUD FUNCTION PIPELINE

**Trigger**: Serverless function deployment
**Sequence**:

```
1. gcp-cloud-functions-engineer → Optimize function
2. Set memory/timeout limits
3. Configure triggers and IAM
4. test-runner → Integration tests
5. Deploy with gradual rollout
6. Monitor cold starts and errors
```

## 5. CI/CD PIPELINE SETUP

**Trigger**: GitHub Actions or Azure DevOps setup
**Sequence**:

```
1. github-operations-specialist → Design pipeline
2. Implement security scanning
3. Add quality gates
4. test-runner → Test pipeline stages
5. Document pipeline flow
6. Set up notifications
```

## 6. MESSAGING SYSTEM PIPELINE

**Trigger**: NATS implementation
**Sequence**:

```
1. nats-messaging-expert → Design topology
2. Configure JetStream persistence
3. Implement pub/sub patterns
4. test-runner → Test message delivery
5. Monitor throughput and latency
6. Document message contracts
```

## 7. DATA PIPELINE ORCHESTRATION

**Trigger**: Airflow/Kedro workflow setup
**Sequence**:

```
1. airflow-orchestration-expert/kedro-pipeline-expert → Design DAG/pipeline
2. Implement idempotent tasks
3. Add monitoring and alerts
4. test-runner → Test pipeline execution
5. Verify data quality checks
6. Document dependencies
```

## Pipeline Requirements

### NEVER ALLOWED

- ❌ Deploying without staging validation
- ❌ Pushing unscanned container images
- ❌ Applying Terraform without plan review
- ❌ Skipping rollback procedures
- ❌ Ignoring security vulnerabilities

### ALWAYS REQUIRED

- ✅ Infrastructure as Code for everything
- ✅ Security scanning at every stage
- ✅ Staging environment validation
- ✅ Automated rollback capability
- ✅ Comprehensive monitoring

## Success Metrics

- Zero unplanned downtime
- All images pass security scan
- Terraform drift detection active
- Rollback time < 5 minutes
- 100% infrastructure test coverage
