#!/usr/bin/env bash
# Docker multi-stage build example with optimization
# Usage: ./docker-build-multistage.sh [image-name] [tag]

set -euo pipefail

IMAGE_NAME="${1:-myapp}"
TAG="${2:-latest}"
DOCKERFILE="${DOCKERFILE:-Dockerfile}"

echo "🐳 Building multi-stage Docker image: ${IMAGE_NAME}:${TAG}..."

# Check Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install it first."
    exit 1
fi

# Build with BuildKit for better caching and performance
export DOCKER_BUILDKIT=1

echo "📦 Building image with BuildKit optimization..."
docker build \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --tag "${IMAGE_NAME}:${TAG}" \
    --file "${DOCKERFILE}" \
    .

# Get image size
IMAGE_SIZE=$(docker images "${IMAGE_NAME}:${TAG}" --format "{{.Size}}")
echo "✅ Image built successfully: ${IMAGE_NAME}:${TAG} (Size: ${IMAGE_SIZE})"

# Optional: Security scan with Trivy if available
if command -v trivy &> /dev/null; then
    echo "🔒 Running security scan with Trivy..."
    trivy image --severity HIGH,CRITICAL "${IMAGE_NAME}:${TAG}"
fi

# Optional: Show image layers
echo "📊 Image layers:"
docker history "${IMAGE_NAME}:${TAG}" --no-trunc --human

echo "✅ Build complete: ${IMAGE_NAME}:${TAG}"
