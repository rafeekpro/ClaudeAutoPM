#!/usr/bin/env bash
# GCP environment setup example
# Usage: ./gcp-setup.sh [project-id]

set -euo pipefail

PROJECT_ID="${1:-}"

echo "🔍 Setting up GCP environment..."

# Check gcloud CLI is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install it first."
    exit 1
fi

# Check login status
echo "📋 Checking GCP login status..."
gcloud auth list

# Set project if provided
if [ -n "$PROJECT_ID" ]; then
    echo "🔧 Setting project to: $PROJECT_ID"
    gcloud config set project "$PROJECT_ID"
fi

# List projects
echo "📋 Available projects:"
gcloud projects list

# Show current configuration
echo "⚙️  Current configuration:"
gcloud config list

# Enable required APIs (example)
# gcloud services enable compute.googleapis.com
# gcloud services enable container.googleapis.com

echo "✅ GCP environment setup complete"
