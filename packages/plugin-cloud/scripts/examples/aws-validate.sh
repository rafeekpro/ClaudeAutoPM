#!/usr/bin/env bash
# AWS environment validation example
# Usage: ./aws-validate.sh

set -euo pipefail

echo "🔍 Validating AWS environment..."

# Check AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install it first."
    exit 1
fi

# Verify AWS credentials
echo "📋 Checking AWS credentials..."
aws sts get-caller-identity

# Check default region
echo "🌍 Current region: $(aws configure get region)"

# List available regions
echo "📍 Available regions:"
aws ec2 describe-regions --output table

# Validate IAM permissions
echo "🔐 Checking IAM permissions..."
aws iam get-user || echo "⚠️  IAM user access may be limited"

echo "✅ AWS environment validation complete"
