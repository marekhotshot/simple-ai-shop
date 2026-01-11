#!/bin/bash
# Build, push, and deploy Docker images for igormraz.com
set -e

IMAGE_NAME="marekhotshot/igormraz"
VERSION="0.7"
REGISTRY="docker.io"
NAMESPACE="igormraz"

echo "=== Building, Pushing, and Deploying Docker Images ==="
echo "Image: ${IMAGE_NAME}:${VERSION}"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
  echo "❌ Docker is not installed or not in PATH"
  echo "Please install Docker to build images"
  exit 1
fi

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
  echo "❌ kubectl is not installed or not in PATH"
  echo "Please install kubectl to deploy"
  exit 1
fi

# Check if logged in to Docker Hub (skip check - user should ensure they're logged in)
echo "ℹ️  Assuming Docker Hub login is configured"
echo "   If push fails, run: docker login"
echo ""

cd "$(dirname "$0")"

# Build backend image
echo "📦 Building backend image..."
docker build -f Dockerfile.backend -t ${IMAGE_NAME}-backend:${VERSION} -t ${IMAGE_NAME}-backend:latest .

# Build frontend image
echo "📦 Building frontend image..."
cd commerce
docker build -f Dockerfile \
  --build-arg NEXT_PUBLIC_EXPRESS_API_URL=https://igormraz.com \
  --build-arg NEXT_PUBLIC_IMAGE_BASE_URL=https://igormraz.com \
  -t ${IMAGE_NAME}-frontend:${VERSION} -t ${IMAGE_NAME}-frontend:latest .
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

# Deploy to Kubernetes
echo "🚀 Deploying to Kubernetes..."
echo ""

# Update image versions in YAML files
echo "📝 Updating image versions in k8s manifests..."
sed -i.bak "s|image: ${IMAGE_NAME}-backend:[0-9][0-9.]*|image: ${IMAGE_NAME}-backend:${VERSION}|g" k8s/backend.yaml
sed -i.bak "s|image: ${IMAGE_NAME}-frontend:[0-9][0-9.]*|image: ${IMAGE_NAME}-frontend:${VERSION}|g" k8s/frontend.yaml

# Apply backend deployment
echo "📦 Deploying backend..."
kubectl apply -f k8s/backend.yaml

# Apply frontend deployment
echo "📦 Deploying frontend..."
kubectl apply -f k8s/frontend.yaml

# Wait for rollouts
echo ""
echo "⏳ Waiting for deployments to rollout..."
kubectl rollout status deployment/backend -n ${NAMESPACE} --timeout=120s || echo "⚠️  Backend rollout timeout or failed"
kubectl rollout status deployment/frontend -n ${NAMESPACE} --timeout=120s || echo "⚠️  Frontend rollout timeout or failed"

# Clean up backup files
rm -f k8s/backend.yaml.bak k8s/frontend.yaml.bak

echo ""
echo "✅ Deployment complete!"
echo ""
echo "Deployed version: ${VERSION}"
echo ""
echo "Check status with:"
echo "  kubectl get pods -n ${NAMESPACE}"
echo "  kubectl get svc -n ${NAMESPACE}"
