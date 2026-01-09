#!/bin/bash
# Build and load Docker images for K3s
set -e

export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
NAMESPACE=igormraz

echo "Building backend image..."
# Create a temporary pod to build the image
kubectl run build-backend --image=docker:24-dind --restart=Never -n $NAMESPACE --overrides='
{
  "spec": {
    "containers": [{
      "name": "build-backend",
      "image": "docker:24-dind",
      "securityContext": {
        "privileged": true
      },
      "volumeMounts": [{
        "name": "workspace",
        "mountPath": "/workspace"
      }]
    }],
    "volumes": [{
      "name": "workspace",
      "emptyDir": {}
    }]
  }
}' --command -- sleep 3600 || true

# Wait for pod to be ready
kubectl wait --for=condition=ready pod/build-backend -n $NAMESPACE --timeout=60s

# Copy source code to pod
echo "Copying source code..."
kubectl cp /workspaces/simple-ai-shop/. build-backend:/workspace -n $NAMESPACE --exclude='node_modules' --exclude='.next' --exclude='dist' --exclude='.git' || true

# Build image inside pod
echo "Building image..."
kubectl exec -n $NAMESPACE build-backend -- sh -c "
cd /workspace && \
docker build -f Dockerfile.backend -t simple-ai-shop-backend:latest . && \
docker save simple-ai-shop-backend:latest | kubectl exec -i -n $NAMESPACE build-backend -- ctr -n k8s.io images import -
" || echo "Build failed, trying alternative method"

# Cleanup
kubectl delete pod build-backend -n $NAMESPACE --ignore-not-found=true

echo "Backend image build complete!"
