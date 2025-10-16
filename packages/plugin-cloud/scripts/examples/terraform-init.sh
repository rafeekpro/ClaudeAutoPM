#!/usr/bin/env bash
# Terraform initialization and validation example
# Usage: ./terraform-init.sh [environment]

set -euo pipefail

ENVIRONMENT="${1:-staging}"

echo "🚀 Initializing Terraform for ${ENVIRONMENT} environment..."

# Initialize Terraform
terraform init -backend-config="env/${ENVIRONMENT}/backend.tf"

# Validate configuration
terraform validate

# Format check
terraform fmt -check -recursive

# Security scan (if tfsec is installed)
if command -v tfsec &> /dev/null; then
    echo "🔒 Running security scan..."
    tfsec .
fi

echo "✅ Terraform initialization complete for ${ENVIRONMENT}"
