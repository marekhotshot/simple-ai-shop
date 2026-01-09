#!/bin/bash
# Build images directly on K3s node
set -e

export KUBECONFIG=/workspaces/simple-ai-shop/kubeconfig
NODE=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
echo "Building on node: $NODE"

# Create a temporary directory on the node
kubectl debug node/$NODE -it --image=busybox --rm -- sh -c "
mkdir -p /tmp/build-workspace && \
echo 'Workspace created'
" 2>&1 | grep -v "Creating debugging pod" || true

echo "Copying source to node..."
cd /workspaces/simple-ai-shop
tar --exclude='node_modules' --exclude='.next' --exclude='dist' --exclude='.git' --exclude='k8s' -czf /tmp/source.tar .

# Copy to node using kubectl cp via a pod
kubectl run file-copy-$(date +%s) --image=busybox --restart=Never -n igormraz --overrides='{
  "spec": {
    "nodeName": "'$NODE'",
    "containers": [{
      "name": "busybox",
      "image": "busybox",
      "command": ["sleep", "300"],
      "volumeMounts": [{
        "name": "host",
        "mountPath": "/host"
      }]
    }],
    "volumes": [{
      "name": "host",
      "hostPath": {
        "path": "/",
        "type": "Directory"
      }
    }]
  }
}' || true

POD=$(kubectl get pods -n igormraz -l run=file-copy-* -o jsonpath='{.items[0].metadata.name}' 2>/dev/null | head -1)
if [ -n "$POD" ]; then
  kubectl wait --for=condition=ready pod/$POD -n igormraz --timeout=30s || true
  kubectl cp /tmp/source.tar igormraz/$POD:/host/tmp/source.tar
  kubectl delete pod $POD -n igormraz --ignore-not-found=true
fi

rm -f /tmp/source.tar

echo "Source copied. Now building on node..."
kubectl debug node/$NODE -it --image=docker:24-dind --rm --overrides='{
  "spec": {
    "containers": [{
      "name": "debugger",
      "image": "docker:24-dind",
      "securityContext": {
        "privileged": true
      },
      "command": ["sh", "-c", "cd /tmp && tar -xzf source.tar && docker build -f Dockerfile.backend -t simple-ai-shop-backend:latest . && docker save simple-ai-shop-backend:latest | ctr -n k8s.io images import -"]
    }]
  }
}' 2>&1 | grep -v "Creating debugging pod" || echo "Build may have completed"

echo "Build process initiated!"
