#!/bin/bash
# Simple build script for K3s - builds images on the node
set -e

export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
NODE_NAME=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')

echo "Using node: $NODE_NAME"
echo "Building backend image..."

# Create a build pod on the node
kubectl run build-backend-$(date +%s) \
  --image=docker:24-dind \
  --restart=Never \
  --namespace=igormraz \
  --overrides='{
  "spec": {
    "nodeName": "'$NODE_NAME'",
    "containers": [{
      "name": "docker",
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
}' --command -- sleep 600

POD_NAME=$(kubectl get pods -n igormraz -l run=build-backend-* -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")

if [ -z "$POD_NAME" ]; then
  echo "Failed to create build pod"
  exit 1
fi

echo "Waiting for pod $POD_NAME to be ready..."
kubectl wait --for=condition=ready pod/$POD_NAME -n igormraz --timeout=60s || true

echo "Copying source code..."
cd /workspaces/simple-ai-shop
tar --exclude='node_modules' --exclude='.next' --exclude='dist' --exclude='.git' --exclude='k8s' -czf - . | kubectl exec -i -n igormraz $POD_NAME -- tar -xzf - -C /workspace

echo "Building backend image in pod..."
kubectl exec -n igormraz $POD_NAME -- sh -c "
cd /workspace && \
docker build -f Dockerfile.backend -t simple-ai-shop-backend:latest . && \
docker save simple-ai-shop-backend:latest -o /tmp/backend.tar
"

echo "Copying image to node..."
kubectl cp igormraz/$POD_NAME:/tmp/backend.tar /tmp/backend.tar

echo "Loading image into K3s..."
kubectl exec -n kube-system -it $(kubectl get pods -n kube-system -l app=local-path-provisioner -o jsonpath='{.items[0].metadata.name}') -- sh -c "cat /tmp/backend.tar | ctr -n k8s.io images import -" 2>/dev/null || \
ssh root@$NODE_NAME "ctr -n k8s.io images import /tmp/backend.tar" 2>/dev/null || \
echo "Note: You may need to manually load the image on the node"

# Cleanup
kubectl delete pod $POD_NAME -n igormraz --ignore-not-found=true
rm -f /tmp/backend.tar

echo "Backend build complete!"
