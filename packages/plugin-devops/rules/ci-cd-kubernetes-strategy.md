# Rule: CI/CD Kubernetes Implementation Strategy

This document provides the practical implementation patterns for running workflows on our Kubernetes runners.

## Service Deployment in CI/CD

To run services like databases during a CI/CD job, `docker-compose` is NOT used. Instead, we create an isolated Kubernetes pod for the service.

**Pattern: Deploying MongoDB**

```yaml
- name: 🗄️ Setup MongoDB with kubectl
  run: |
    # Create a unique, isolated namespace for this CI run
    NAMESPACE="ci-${{ github.run_id }}"
    kubectl create namespace $NAMESPACE

    # Run the MongoDB pod within the new namespace
    kubectl run mongodb --image=mongo:6.0 --namespace=$NAMESPACE --restart=Never

    # Wait for the pod to be ready before proceeding
    kubectl wait --for=condition=ready pod/mongodb --timeout=120s --namespace=$NAMESPACE

    # Forward the pod's port to localhost for the test runner to access
    kubectl port-forward -n $NAMESPACE pod/mongodb 27017:27017 &
