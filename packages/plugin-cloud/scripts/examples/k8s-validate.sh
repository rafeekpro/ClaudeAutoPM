#!/usr/bin/env bash
# Kubernetes cluster validation example
# Usage: ./k8s-validate.sh [context]

set -euo pipefail

CONTEXT="${1:-$(kubectl config current-context)}"

echo "🔍 Validating Kubernetes cluster: ${CONTEXT}..."

# Check kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl not found. Please install it first."
    exit 1
fi

# Use specified context
kubectl config use-context "$CONTEXT"

# Check cluster info
echo "📋 Cluster info:"
kubectl cluster-info

# Check nodes
echo "🖥️  Cluster nodes:"
kubectl get nodes

# Check system pods
echo "🐳 System pods:"
kubectl get pods -n kube-system

# Check namespaces
echo "📁 Namespaces:"
kubectl get namespaces

# Validate RBAC (if you have permissions)
echo "🔐 Checking RBAC..."
kubectl auth can-i --list || echo "⚠️  RBAC check requires additional permissions"

echo "✅ Kubernetes cluster validation complete for: ${CONTEXT}"
