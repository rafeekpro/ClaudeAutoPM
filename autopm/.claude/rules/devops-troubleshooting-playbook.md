# DevOps Troubleshooting Playbook

This document contains standard procedures for resolving common issues in our CI/CD and Kubernetes environments. All DevOps agents MUST follow these guidelines.

---

## 🚀 Kubernetes CI/CD Error Debugging

### Error: `PodInitializing` or `ImagePullBackOff`

**Diagnosis:** This error means the Pod cannot start. The most common cause is an issue with the init container or missing resources.

**Debugging Procedure:**

1. **Add debug step to workflow:** In the workflow file (`.github/workflows/*.yml`), after the failed step, add a conditional step (`if: failure()`).

2. **Collect diagnostic information:** In the debug step, use the following commands to gather logs before the pod is deleted:

```yaml
- name: 🐞 Debug Pod on Failure
  if: failure()
  run: |
    POD_NAME=$(kubectl get pods --selector=job-name=YOUR_JOB_NAME -o jsonpath='{.items[0].metadata.name}')
    echo "--- Pod Description ($POD_NAME) ---"
    kubectl describe pod $POD_NAME
    echo "--- Init Container Logs ---"
    kubectl logs $POD_NAME -c INIT_CONTAINER_NAME
    echo "--- Main Container Logs (if available) ---"
    kubectl logs $POD_NAME -c main || echo "Main container not yet started"
    echo "--- Pod Events ---"
    kubectl get events --field-selector involvedObject.name=$POD_NAME
```

### Error: `field is immutable`

**Diagnosis:** This error indicates an attempt to modify an existing, immutable Kubernetes resource (e.g., Job).

**Solution (MANDATORY):** Always delete the old resource before creating a new one. This ensures each CI/CD run is clean.

**Implementation Pattern in Workflow:**

```yaml
- name: 🏗️ Deploy Job with Cleanup
  run: |
    echo "🧹 Cleaning up previous job (if any)..."
    kubectl delete job YOUR_JOB_NAME --ignore-not-found=true
    
    # Wait for cleanup to complete
    kubectl wait --for=delete job/YOUR_JOB_NAME --timeout=30s 2>/dev/null || true
    
    echo "🚀 Creating new job..."
    cat <<EOF | kubectl apply -f -
    apiVersion: batch/v1
    kind: Job
    metadata:
      name: YOUR_JOB_NAME
    spec:
      # ... your job definition ...
    EOF
```

### Error: `CreateContainerConfigError`

**Diagnosis:** Configuration issue preventing container creation, often related to secrets or configmaps.

**Debugging Steps:**

1. Check if referenced secrets/configmaps exist:

```bash
kubectl get secret YOUR_SECRET_NAME
kubectl get configmap YOUR_CONFIG_NAME
```

2. Verify secret keys match what's expected:

```bash
kubectl describe secret YOUR_SECRET_NAME
```

3. Check pod events for detailed error:

```bash
kubectl describe pod POD_NAME | grep -A 10 Events
```

### Error: ConfigMap "..." is invalid: Too long

**Diagnosis:** This error means you're trying to store data in a `ConfigMap` that exceeds the 1MB size limit.

**Root Cause (Anti-pattern):** Packaging entire source code (e.g., as `.tar.gz` archive) into a `ConfigMap` to use as build context for Kaniko. ConfigMaps are designed for small configuration files, not for storing entire applications.

**Solution (MANDATORY):** Deliver build context to the pod using a volume. Best practice is to use an `initContainer` that clones the repository into a shared `emptyDir` volume.

**Implementation Pattern in Workflow:**

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: kaniko-build-job
spec:
  template:
    spec:
      restartPolicy: Never
      initContainers:
      - name: prepare-build-context
        image: alpine/git:latest
        command: ['sh', '-c']
        args:
          - |
            git clone --depth 1 https://github.com/YOUR/REPO.git /workspace
            cd /workspace && git checkout $COMMIT_SHA
        volumeMounts:
        - name: workspace
          mountPath: /workspace
      containers:
      - name: kaniko
        image: gcr.io/kaniko-project/executor:latest
        args:
        - --dockerfile=/workspace/Dockerfile
        - --context=dir:///workspace
        - --destination=YOUR_REGISTRY/IMAGE:TAG
        - --cache=true
        - --cache-ttl=24h
        volumeMounts:
        - name: workspace
          mountPath: /workspace
      volumes:
      - name: workspace
        emptyDir: {}
```

**Alternative Solutions:**

1. **Git Context (Recommended for public repos):**

```yaml
args:
  - --context=git://github.com/YOUR/REPO.git#refs/heads/main
  - --dockerfile=Dockerfile
```

2. **S3/GCS Bucket for build context:**

```yaml
args:
  - --context=s3://your-bucket/build-context.tar.gz
  - --dockerfile=Dockerfile
```

3. **Registry-based builds (for layer caching):**

```yaml
args:
  - --cache-repo=YOUR_REGISTRY/cache
  - --cache=true
```

---

## 📊 Database Management Strategy

Database management strategy MUST align with environment purpose:

| Environment | Tool | Purpose | Persistence | Backup Strategy |
|------------|------|---------|-------------|-----------------|
| **Local (Dev)** | docker compose | Convenience | Yes (Named Volume) | Optional |
| **Testing (CI/CD)** | kubectl | Isolation | No (Ephemeral) | Not Required |
| **Staging** | Managed DB | Pre-prod Testing | Yes (PVC) | Daily |
| **Production** | Managed Service | Reliability | Yes (HA + Backups) | Continuous |

### Development Database Setup

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Named volume for persistence
    environment:
      POSTGRES_DB: ${DB_NAME:-devdb}
      POSTGRES_USER: ${DB_USER:-developer}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-localpass}
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-developer}"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:  # Persistent across container restarts
```

### CI/CD Database Setup

```yaml
# Ephemeral database for testing
apiVersion: v1
kind: Service
metadata:
  name: test-postgres
spec:
  selector:
    app: test-postgres
  ports:
    - port: 5432
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-postgres
spec:
  replicas: 1
  selector:
    matchLabels:
      app: test-postgres
  template:
    metadata:
      labels:
        app: test-postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: testdb
        - name: POSTGRES_USER
          value: testuser
        - name: POSTGRES_PASSWORD
          value: testpass
        - name: POSTGRES_HOST_AUTH_METHOD
          value: trust  # For CI/CD only!
        # No volume mount - data is ephemeral
```

---

## 🔄 CI/CD Pipeline Best Practices

### GitHub Actions Kubernetes Debugging

**ALWAYS include these debug steps in Kubernetes workflows:**

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: 🎯 Deploy Application
        id: deploy
        run: |
          # Your deployment commands
          kubectl apply -f manifests/
      
      - name: 🔍 Debug on Failure
        if: failure()
        run: |
          echo "=== Pod Status ==="
          kubectl get pods -o wide
          
          echo "=== Recent Events ==="
          kubectl get events --sort-by='.lastTimestamp' | tail -20
          
          echo "=== Failed Pods Details ==="
          kubectl get pods --field-selector=status.phase!=Running,status.phase!=Succeeded -o json | \
            jq -r '.items[] | "\(.metadata.name): \(.status.containerStatuses[0].state)"'
          
          echo "=== Resource Usage ==="
          kubectl top nodes || echo "Metrics not available"
          kubectl top pods || echo "Metrics not available"
```

### Container Build Optimization

**Cache layers effectively in CI/CD:**

```dockerfile
# Good: Dependencies first (cached often)
FROM node:18-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Bad: Everything at once (cache busted on any change)
FROM node:18-alpine
COPY . .
RUN npm install
```

---

## 🛡️ Security Best Practices

### Secret Management

**NEVER hardcode secrets. Use this hierarchy:**

1. **Local Development:** `.env` files (gitignored)
2. **CI/CD:** GitHub Secrets / Environment Variables
3. **Kubernetes:** Secrets or External Secrets Operator
4. **Production:** Vault, AWS Secrets Manager, or Azure Key Vault

**Example Secret Injection Pattern:**

```yaml
# GitHub Actions
- name: 🔐 Inject Secrets
  run: |
    kubectl create secret generic app-secrets \
      --from-literal=db-password=${{ secrets.DB_PASSWORD }} \
      --from-literal=api-key=${{ secrets.API_KEY }} \
      --dry-run=client -o yaml | kubectl apply -f -
```

---

## 🔧 Common Debugging Commands

### Quick Diagnostics Checklist

```bash
# 1. Check pod status
kubectl get pods -A | grep -v Running

# 2. Get pod logs
kubectl logs POD_NAME --previous  # If pod restarted
kubectl logs POD_NAME -f          # Follow logs

# 3. Shell into pod
kubectl exec -it POD_NAME -- /bin/sh

# 4. Check resource consumption
kubectl top pods
kubectl describe node

# 5. Check recent errors
kubectl get events --sort-by='.lastTimestamp' | grep Warning

# 6. Verify service endpoints
kubectl get endpoints

# 7. Test service connectivity
kubectl run debug --image=busybox:1.28 --rm -it --restart=Never -- wget -O- SERVICE_NAME:PORT
```

### Emergency Rollback Procedure

```bash
# 1. Quick rollback to previous deployment
kubectl rollout undo deployment/APP_NAME

# 2. Check rollback status
kubectl rollout status deployment/APP_NAME

# 3. Verify pods are healthy
kubectl get pods -l app=APP_NAME

# 4. If still broken, scale to zero and debug
kubectl scale deployment/APP_NAME --replicas=0
# Fix issues...
kubectl scale deployment/APP_NAME --replicas=3
```

---

## 📝 Logging and Monitoring

### Structured Logging Requirements

All applications MUST:

1. Log in JSON format for parsing
2. Include correlation IDs for request tracing
3. Use appropriate log levels (DEBUG, INFO, WARN, ERROR)
4. Never log sensitive data (passwords, tokens, PII)

**Example Structured Log:**

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "correlation_id": "abc-123-def",
  "service": "api-gateway",
  "message": "Database connection failed",
  "error": "connection timeout after 30s",
  "retry_count": 3
}
```

---

## 🚨 Incident Response Template

When production issues occur, follow this template:

```markdown
## Incident Report

**Date:** YYYY-MM-DD HH:MM UTC
**Severity:** Critical | High | Medium | Low
**Duration:** XX minutes

### Impact
- What broke and who was affected

### Root Cause
- Technical reason for the failure

### Resolution
- Steps taken to fix

### Prevention
- Changes to prevent recurrence

### Timeline
- HH:MM - Issue detected
- HH:MM - Team notified
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Service restored
```

---

## 🎯 Golden Rules

1. **Always clean before create** - Delete old resources before creating new ones
2. **Debug immediately on failure** - Add conditional debug steps to all CI/CD workflows
3. **Never assume, always verify** - Check that resources exist before using them
4. **Fail fast, recover faster** - Quick detection and rollback procedures
5. **Document everything** - If it's not documented, it didn't happen

---

## 📚 References

- [Kubernetes Troubleshooting Guide](https://kubernetes.io/docs/tasks/debug/)
- [GitHub Actions Best Practices](https://docs.github.com/en/actions/guides)
- [12 Factor App Methodology](https://12factor.net/)
- [SRE Principles](https://sre.google/sre-book/table-of-contents/)

---

**Remember:** This playbook is a living document. Update it with new solutions as we discover them.
