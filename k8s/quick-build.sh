#!/bin/bash
# Quick build script - builds image in a pod and loads it
set -e

export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
NAMESPACE=igormraz
BUILD_NAME="build-$(date +%s)"

cd /workspaces/simple-ai-shop

echo "Creating build pod: $BUILD_NAME"
kubectl run $BUILD_NAME \
  --image=docker:24-dind \
  --restart=Never \
  --namespace=$NAMESPACE \
  --overrides='{
  "spec": {
    "containers": [{
      "name": "docker",
      "image": "docker:24-dind",
      "securityContext": {"privileged": true},
      "command": ["sleep", "600"]
    }]
  }
}'

echo "Waiting for pod..."
kubectl wait --for=condition=ready pod/$BUILD_NAME -n $NAMESPACE --timeout=120s

echo "Copying source..."
tar --exclude='node_modules' --exclude='.next' --exclude='dist' --exclude='.git' --exclude='k8s' -czf /tmp/src.tar . 2>/dev/null
kubectl cp /tmp/src.tar $NAMESPACE/$BUILD_NAME:/tmp/src.tar
rm /tmp/src.tar

echo "Building..."
kubectl exec -n $NAMESPACE $BUILD_NAME -- sh -c "
cd /tmp && tar -xzf src.tar && cd simple-ai-shop
apk add --no-cache nodejs npm
npm install -g pnpm@9.0.0
pnpm install --frozen-lockfile
pnpm build
docker build -f Dockerfile.backend -t simple-ai-shop-backend:latest .
docker save simple-ai-shop-backend:latest -o /tmp/img.tar
"

echo "Extracting image..."
kubectl cp $NAMESPACE/$BUILD_NAME:/tmp/img.tar /tmp/img.tar

echo "Loading into K3s..."
NODE=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
# Try to load via node debug
kubectl debug node/$NODE -it --image=busybox --rm -- sh -c "cat /tmp/img.tar | ctr -n k8s.io images import -" < /tmp/img.tar 2>&1 | grep -v "Creating debugging pod" || \
echo "Loading via alternative method..."
# Alternative: copy to node and load
kubectl cp /tmp/img.tar $NAMESPACE/$BUILD_NAME:/host/tmp/img.tar && \
kubectl exec -n $NAMESPACE $BUILD_NAME -- sh -c "cat /host/tmp/img.tar | ctr -n k8s.io images import -" || \
echo "Manual load required: ctr -n k8s.io images import /tmp/img.tar on $NODE"

kubectl delete pod $BUILD_NAME -n $NAMESPACE
rm -f /tmp/img.tar

echo "Done! Image: simple-ai-shop-backend:latest"
