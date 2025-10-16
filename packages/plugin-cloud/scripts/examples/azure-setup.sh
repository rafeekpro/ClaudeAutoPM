#!/usr/bin/env bash
# Azure environment setup example
# Usage: ./azure-setup.sh

set -euo pipefail

echo "🔍 Setting up Azure environment..."

# Check Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install it first."
    exit 1
fi

# Check login status
echo "📋 Checking Azure login status..."
az account show || {
    echo "🔐 Not logged in. Starting login..."
    az login
}

# List subscriptions
echo "📋 Available subscriptions:"
az account list --output table

# Set default subscription (if needed)
# az account set --subscription "Your-Subscription-Name"

# Validate resource providers
echo "🔍 Checking resource providers..."
az provider list --query "[?registrationState=='Registered'].namespace" --output table

echo "✅ Azure environment setup complete"
