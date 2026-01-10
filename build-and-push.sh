#!/bin/bash
# Build and push Docker images for igormraz.com
set -e

IMAGE_NAME="marekhotshot/igormraz"
VERSION="0.1"
REGISTRY="docker.io"

echo "=== Building and Pushing Docker Images ==="
echo "Image: ${IMAGE_NAME}:${VERSION}"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed or not in PATH"
  echo "Please install Docker to build images"
  exit 1
fi

# Check if logged in to Docker Hub
if ! docker info | grep -q "Username"; then
  echo "⚠️  Not logged in to Docker Hub"
  echo "Please run: docker login"
  exit 1
fi

cd "$(dirname "$0")"

# Build backend image
echo "📦 Building backend image..."
docker build -f Dockerfile.backend -t ${IMAGE_NAME}-backend:${VERSION} -t ${IMAGE_NAME}-backend:latest .

# Build frontend image
echo "📦 Building frontend image..."
cd commerce
docker build -f Dockerfile -t ${IMAGE_NAME}-frontend:${VERSION} -t ${IMAGE_NAME}-frontend:latest .
cd ..

# Tag images
echo "🏷️  Tagging images..."
docker tag ${IMAGE_NAME}-backend:${VERSION} ${REGISTRY}/${IMAGE_NAME}-backend:${VERSION}
docker tag ${IMAGE_NAME}-backend:latest ${REGISTRY}/${IMAGE_NAME}-backend:latest
docker tag ${IMAGE_NAME}-frontend:${VERSION} ${REGISTRY}/${IMAGE_NAME}-frontend:${VERSION}
docker tag ${IMAGE_NAME}-frontend:latest ${REGISTRY}/${IMAGE_NAME}-frontend:latest

# Push images
echo "🚀 Pushing images to ${REGISTRY}..."
docker push ${REGISTRY}/${IMAGE_NAME}-backend:${VERSION}
docker push ${REGISTRY}/${IMAGE_NAME}-backend:latest
docker push ${REGISTRY}/${IMAGE_NAME}-frontend:${VERSION}
docker push ${REGISTRY}/${IMAGE_NAME}-frontend:latest

echo ""
echo "✅ Build and push complete!"
echo ""
echo "Images pushed:"
echo "  - ${REGISTRY}/${IMAGE_NAME}-backend:${VERSION}"
echo "  - ${REGISTRY}/${IMAGE_NAME}-backend:latest"
echo "  - ${REGISTRY}/${IMAGE_NAME}-frontend:${VERSION}"
echo "  - ${REGISTRY}/${IMAGE_NAME}-frontend:latest"
echo ""
echo "To use in Kubernetes, update the image references in:"
echo "  - k8s/backend.yaml"
echo "  - k8s/frontend.yaml"
